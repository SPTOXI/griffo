import test from 'node:test'
import assert from 'node:assert/strict'
import {
  collectHiringIndexPoints,
  defaultConnectors,
  persistHiringIndexPoints,
  summarizeCollection,
  type LaborMarketPointWriter,
} from './collect'
import type { ConnectorResult, LaborMarketConnector, LaborMarketPointInput } from './types'

function point(overrides: Partial<LaborMarketPointInput> = {}): LaborMarketPointInput {
  return {
    country: 'US',
    source: 'bls_jolts',
    metric: 'job_openings_rate',
    value: 4.4,
    unit: 'percent',
    period: new Date(Date.UTC(2026, 6, 1)),
    periodType: 'month',
    revised: true,
    seriesBreak: false,
    confidence: 'high',
    note: null,
    ...overrides,
  }
}

/** Conector de mentira, com desfecho declarado. Nenhum teste toca a rede. */
function fakeConnector(slug: string, result: ConnectorResult | (() => never)): LaborMarketConnector {
  return {
    descriptor: {
      slug,
      name: slug,
      metric: 'job_openings_rate',
      confidence: 'high',
      countries: null,
      accessNote: 'dublê de teste',
    },
    async fetchPoints(): Promise<ConnectorResult> {
      if (typeof result === 'function') result()
      return result as ConnectorResult
    },
  }
}

const ok = (points: LaborMarketPointInput[]): ConnectorResult => ({
  outcome: 'complete',
  points,
  error: null,
})

// ---------------------------------------------------------------------------
// Coleta
// ---------------------------------------------------------------------------

test('coleta junta os pontos de todas as fontes que deram certo', async () => {
  const result = await collectHiringIndexPoints({
    connectors: [
      fakeConnector('a', ok([point()])),
      fakeConnector('b', ok([point({ country: 'DE', source: 'eurostat_jvs' })])),
    ],
  })

  assert.equal(result.points.length, 2)
  assert.deepEqual(
    result.sources.map((s) => [s.slug, s.outcome, s.points]),
    [['a', 'complete', 1], ['b', 'complete', 1]]
  )
})

test('fonte que FALHOU não contribui com um único ponto', () => {
  // Resposta vazia não é mercado vazio, e meia série gravada é pior que
  // nenhuma: a média móvel leria o buraco como movimento.
  return collectHiringIndexPoints({
    connectors: [
      fakeConnector('quebrada', { outcome: 'failed', points: [point()], error: 'API fora do ar' }),
      fakeConnector('boa', ok([point({ country: 'DE' })])),
    ],
  }).then((result) => {
    assert.equal(result.points.length, 1)
    assert.equal(result.points[0].country, 'DE')
    assert.equal(result.sources[0].outcome, 'failed')
    assert.equal(result.sources[0].error, 'API fora do ar')
  })
})

test('coleta PARCIAL aproveita o que veio, e registra o aviso', async () => {
  const result = await collectHiringIndexPoints({
    connectors: [fakeConnector('meia', { outcome: 'partial', points: [point()], error: 'faltou um país' })],
  })

  assert.equal(result.points.length, 1)
  assert.equal(result.sources[0].outcome, 'partial')
  assert.equal(result.sources[0].error, 'faltou um país')
})

test('conector que LANÇA não derruba as outras fontes', async () => {
  const result = await collectHiringIndexPoints({
    connectors: [
      fakeConnector('explode', () => {
        throw new Error('formato inesperado')
      }),
      fakeConnector('eurostat_jvs', ok([point({ country: 'DE', source: 'eurostat_jvs' })])),
    ],
  })

  assert.equal(result.sources[0].outcome, 'failed')
  assert.equal(result.sources[0].error, 'formato inesperado')
  assert.equal(result.points.length, 1)
})

test('o teto de tempo chega ao conector', async () => {
  let seen = -1
  const spy: LaborMarketConnector = {
    ...fakeConnector('x', ok([])),
    async fetchPoints(context) {
      seen = context.timeBudgetMs
      return ok([])
    },
  }

  await collectHiringIndexPoints({ connectors: [spy], timeBudgetMs: 7_000 })
  assert.equal(seen, 7_000)
})

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

test('cada ponto vira um upsert pela chave (país, fonte, métrica, período)', async () => {
  const calls: any[] = []
  const client: LaborMarketPointWriter = {
    laborMarketPoint: {
      async upsert(args: any) {
        calls.push(args)
        return null
      },
    },
  }

  const written = await persistHiringIndexPoints(client, [
    point(),
    point({ country: 'DE', source: 'eurostat_jvs', metric: 'job_vacancy_rate' }),
  ])

  assert.equal(written, 2)
  assert.deepEqual(calls[0].where.country_source_metric_period, {
    country: 'US',
    source: 'bls_jolts',
    metric: 'job_openings_rate',
    period: new Date(Date.UTC(2026, 6, 1)),
  })
})

test('o update reescreve o valor e a marcação de preliminar — a revisão do JOLTS vence', async () => {
  const calls: any[] = []
  const client: LaborMarketPointWriter = {
    laborMarketPoint: {
      async upsert(args: any) {
        calls.push(args)
        return null
      },
    },
  }

  await persistHiringIndexPoints(client, [point({ value: 4.6, revised: false, note: 'P' })])

  assert.equal(calls[0].update.value, 4.6)
  assert.equal(calls[0].update.revised, false)
  assert.equal(calls[0].update.note, 'P')
  assert.ok(calls[0].update.fetchedAt instanceof Date)
})

test('lista vazia não chama o banco', async () => {
  let called = false
  const client: LaborMarketPointWriter = {
    laborMarketPoint: {
      async upsert() {
        called = true
        return null
      },
    },
  }

  assert.equal(await persistHiringIndexPoints(client, []), 0)
  assert.equal(called, false)
})

// ---------------------------------------------------------------------------
// Classificação do que foi coletado
// ---------------------------------------------------------------------------

const monthly = (country: string, source: string, metric: any, values: number[]) =>
  values.map((value, i) =>
    point({ country, source, metric, value, period: new Date(Date.UTC(2024, i, 1)) })
  )

test('cada país vira uma série própria, classificada sozinha', () => {
  const series = summarizeCollection([
    ...monthly('US', 'bls_jolts', 'job_openings_rate', [5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6]),
    ...monthly('DE', 'eurostat_jvs', 'job_vacancy_rate', [2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4]),
  ])

  assert.equal(series.length, 2)
  assert.equal(series.find((s) => s.country === 'US')?.phase, 'cooling')
  assert.equal(series.find((s) => s.country === 'DE')?.phase, 'heating_up')
})

test('duas métricas do mesmo país são DUAS séries, nunca uma emendada', () => {
  const series = summarizeCollection([
    ...monthly('US', 'bls_jolts', 'job_openings_rate', [4.0, 4.1, 4.2, 4.3, 4.4, 4.5]),
    ...monthly('US', 'ilostat', 'unemployment_rate', [3.0, 3.1, 3.2, 3.3, 3.4, 3.5]),
  ])

  assert.equal(series.length, 2)
  assert.deepEqual(series.map((s) => s.metric).sort(), ['job_openings_rate', 'unemployment_rate'])
})

test('série curta sai sem fase, com o motivo, e não some do resumo', () => {
  const series = summarizeCollection(monthly('GB', 'eurostat_jvs', 'job_vacancy_rate', [2.0, 2.1, 2.2]))

  assert.equal(series.length, 1)
  assert.equal(series[0].phase, null)
  assert.equal(series[0].insufficientDataReason, 'too_few_points')
})

test('a ordem do resumo é estável, independente da ordem da coleta', () => {
  const us = monthly('US', 'bls_jolts', 'job_openings_rate', [4.0, 4.1, 4.2, 4.3, 4.4, 4.5])
  const de = monthly('DE', 'eurostat_jvs', 'job_vacancy_rate', [2.0, 2.1, 2.2, 2.3, 2.4, 2.5])

  assert.deepEqual(
    summarizeCollection([...us, ...de]).map((s) => s.country),
    summarizeCollection([...de, ...us]).map((s) => s.country)
  )
  assert.deepEqual(summarizeCollection([...us, ...de]).map((s) => s.country), ['DE', 'US'])
})

// ---------------------------------------------------------------------------
// A lista real de fontes
// ---------------------------------------------------------------------------

test('AS QUATRO FONTES REAIS SÃO MONTADAS AQUI, E SÓ AQUI', () => {
  // O script manual e o cron precisam coletar exatamente as mesmas fontes; a
  // lista mora nesta função para que não haja uma segunda cópia dela.
  const descriptors = defaultConnectors(null).map((c) => c.descriptor)

  assert.deepEqual(
    descriptors.map((d) => d.slug),
    ['bls_jolts', 'eurostat_jvs', 'ilostat_une', 'cepalstat_une']
  )
})

test('TAXA DE DESEMPREGO É SEMPRE CONFIANÇA BAIXA, TAXA DE VAGA É ALTA', () => {
  // A diferença não é de grau: em economia com setor informal grande, quem
  // trabalha informalmente conta como "empregado" sem contratação nenhuma por
  // trás. Ver `prisma/schema.prisma` e `./types.ts`.
  for (const d of defaultConnectors(null).map((c) => c.descriptor)) {
    const expected = d.metric === 'unemployment_rate' ? 'low' : 'high'
    assert.equal(d.confidence, expected, `${d.slug} deveria ser ${expected}`)
  }
})

test('NENHUM CONECTOR DECLARA LISTA DE PAÍSES QUE NÃO SEJA A DA PRÓPRIA RESPOSTA', () => {
  // Exceto o BLS, que cobre um país só por construção. Os outros três não
  // filtram país nenhum: a escolha entre fontes que se sobrepõem é de
  // `selectSeries`, em `./lookup.ts`, e não pode existir em dois lugares.
  const descriptors = defaultConnectors(null).map((c) => c.descriptor)
  assert.deepEqual(descriptors.find((d) => d.slug === 'bls_jolts')!.countries, ['US'])
  assert.ok(
    descriptors.filter((d) => d.slug !== 'bls_jolts').every((d) => d.countries === null)
  )
})
