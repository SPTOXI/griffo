import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BLS_JOLTS_DESCRIPTOR,
  createBlsJoltsConnector,
  isPreliminary,
  monthFromBlsPeriod,
  parseBlsPayload,
} from './bls-jolts'

/**
 * Recorte do payload REAL observado em 01/09/2026, em
 * `POST api.bls.gov/publicAPI/v2/timeseries/data/` com
 * `{"seriesid":["JTS000000000000000JOR"],"startyear":"2025","endyear":"2026"}`.
 *
 * O `latest: "true"` só no primeiro item, o `footnotes: [{}]` vazio (e não
 * ausente) nos demais e a nota `P` de preliminar apenas no mês mais recente
 * vieram de lá — nenhum dos três está óbvio na documentação.
 */
const payloadReal = {
  status: 'REQUEST_SUCCEEDED',
  responseTime: 80,
  message: ['Unable to get Catalog Data for series JTS000000000000000JOR'],
  Results: {
    series: [
      {
        seriesID: 'JTS000000000000000JOR',
        data: [
          {
            year: '2026',
            period: 'M07',
            periodName: 'July',
            latest: 'true',
            value: '4.4',
            footnotes: [{ code: 'P', text: 'preliminary' }],
          },
          { year: '2026', period: 'M06', periodName: 'June', value: '4.3', footnotes: [{}] },
          { year: '2026', period: 'M05', periodName: 'May', value: '4.5', footnotes: [{}] },
          { year: '2026', period: 'M04', periodName: 'April', value: '4.6', footnotes: [{}] },
          { year: '2026', period: 'M03', periodName: 'March', value: '4.2', footnotes: [{}] },
          { year: '2026', period: 'M02', periodName: 'February', value: '4.2', footnotes: [{}] },
          { year: '2026', period: 'M01', periodName: 'January', value: '4.4', footnotes: [{}] },
          { year: '2025', period: 'M12', periodName: 'December', value: '4.0', footnotes: [{}] },
        ],
      },
    ],
  },
}

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

test('converte a resposta real em pontos de série', () => {
  const { points, problems } = parseBlsPayload(payloadReal)
  assert.deepEqual(problems, [])
  assert.equal(points.length, 8)

  const julho = points[0]
  assert.equal(julho.country, 'US')
  assert.equal(julho.source, 'bls_jolts')
  assert.equal(julho.metric, 'job_openings_rate')
  assert.equal(julho.value, 4.4)
  assert.equal(julho.unit, 'percent')
  assert.equal(julho.periodType, 'month')
  assert.equal(julho.confidence, 'high')
  assert.equal(julho.period.toISOString(), '2026-07-01T00:00:00.000Z')
})

test('A IMPRESSÃO RECÉM-DIVULGADA VAI MARCADA COMO PRELIMINAR', () => {
  // A taxa de resposta do JOLTS caiu para ~30% e a revisão da segunda
  // divulgação vale ~180 mil vagas em média. Publicar a primeira impressão
  // como se fosse definitiva é publicar algo que costuma mudar.
  const { points } = parseBlsPayload(payloadReal)
  assert.equal(points[0].revised, false)
  assert.equal(points[0].note, 'P')
  // Todos os meses anteriores já passaram por revisão.
  assert.ok(points.slice(1).every((p) => p.revised === true))
  assert.ok(points.slice(1).every((p) => p.note === null))
})

test('a nota de preliminar é reconhecida em qualquer caixa, e só ela', () => {
  assert.ok(isPreliminary([{ code: 'P', text: 'preliminary' }]))
  assert.ok(isPreliminary([{ code: 'p' }]))
  assert.ok(!isPreliminary([{}]))
  assert.ok(!isPreliminary([{ code: 'R' }]))
  assert.ok(!isPreliminary(undefined))
  assert.ok(!isPreliminary('P'))
})

test('M13 É MÉDIA ANUAL E NÃO ENTRA NA SÉRIE MENSAL', () => {
  // O BLS entrega a média do ano no meio da lista de meses, como se fosse mais
  // um período. Aceitá-la faria a média móvel de 3 períodos somar um ano
  // inteiro com dois meses.
  assert.equal(monthFromBlsPeriod('M07'), 7)
  assert.equal(monthFromBlsPeriod('M01'), 1)
  assert.equal(monthFromBlsPeriod('M12'), 12)
  assert.equal(monthFromBlsPeriod('M13'), null)
  assert.equal(monthFromBlsPeriod('Q01'), null)
  assert.equal(monthFromBlsPeriod('A01'), null)
  assert.equal(monthFromBlsPeriod(undefined), null)

  const comAnual = {
    ...payloadReal,
    Results: {
      series: [
        {
          seriesID: 'X',
          data: [
            { year: '2025', period: 'M13', periodName: 'Annual', value: '4.3', footnotes: [{}] },
            { year: '2025', period: 'M01', periodName: 'January', value: '4.5', footnotes: [{}] },
          ],
        },
      ],
    },
  }
  const { points } = parseBlsPayload(comAnual)
  assert.equal(points.length, 1)
  assert.equal(points[0].period.getUTCMonth(), 0)
})

test('valor não numérico é descartado, nunca convertido em zero', () => {
  const suprimido = {
    ...payloadReal,
    Results: {
      series: [
        {
          seriesID: 'X',
          data: [
            { year: '2025', period: 'M01', value: '-', footnotes: [{}] },
            { year: '2025', period: 'M02', value: '', footnotes: [{}] },
            { year: '2025', period: 'M03', value: '4.1', footnotes: [{}] },
          ],
        },
      ],
    },
  }
  const { points } = parseBlsPayload(suprimido)
  assert.equal(points.length, 1)
  assert.equal(points[0].value, 4.1)
})

test('SÉRIE VAZIA É FALHA DE COLETA, NÃO PAÍS SEM VAGAS', () => {
  // `seriesid` inválido devolve 200, `status: REQUEST_SUCCEEDED` e
  // `data: []`, com a explicação escondida em `message`. Ler isso como
  // "os EUA não têm vagas em aberto" é o mesmo erro que a Adzuna já ensinou
  // aqui com o 200 + `exception`.
  const invalida = {
    status: 'REQUEST_SUCCEEDED',
    message: ['Invalid Series for Series NOTASERIES123'],
    Results: { series: [{ seriesID: 'NOTASERIES123', data: [] }] },
  }
  const { points, problems } = parseBlsPayload(invalida)
  assert.equal(points.length, 0)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /NOTASERIES123/)
})

test('status diferente de REQUEST_SUCCEEDED é falha, com a mensagem preservada', () => {
  const recusado = {
    status: 'REQUEST_NOT_PROCESSED',
    message: ['Request could not be serviced, as the daily threshold has been reached.'],
    Results: {},
  }
  const { points, problems } = parseBlsPayload(recusado)
  assert.equal(points.length, 0)
  assert.match(problems[0], /REQUEST_NOT_PROCESSED/)
  assert.match(problems[0], /daily threshold/)
})

test('payload malformado não lança', () => {
  assert.deepEqual(parseBlsPayload(null).points, [])
  assert.deepEqual(parseBlsPayload({}).points, [])
  assert.deepEqual(parseBlsPayload({ status: 'REQUEST_SUCCEEDED' }).points, [])
  assert.deepEqual(parseBlsPayload({ status: 'REQUEST_SUCCEEDED', Results: { series: 'x' } }).points, [])
})

test('o BLS não declara quebra de série, e isso não vira palpite', () => {
  const { points } = parseBlsPayload(payloadReal)
  assert.ok(points.every((p) => p.seriesBreak === false))
})

test('coleta bem-sucedida devolve os pontos e nenhum erro', async () => {
  const connector = createBlsJoltsConnector({ fetchImpl: fakeFetch(payloadReal) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.points.length, 8)
  assert.equal(result.error, null)
})

test('HTTP ruim é falha, sem ponto nenhum', async () => {
  const connector = createBlsJoltsConnector({ fetchImpl: fakeFetch({}, false, 429) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.equal(result.points.length, 0)
  assert.match(result.error!, /HTTP 429/)
})

test('a janela de anos é calculada a partir do relógio injetado', async () => {
  let corpo: any = null
  const espiao: typeof fetch = (async (_url: string, init: RequestInit) => {
    corpo = JSON.parse(String(init.body))
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  const connector = createBlsJoltsConnector({
    fetchImpl: espiao,
    years: 5,
    now: () => new Date('2026-09-01T00:00:00Z'),
  })
  await connector.fetchPoints({ timeBudgetMs: 5000 })

  assert.deepEqual(corpo.seriesid, ['JTS000000000000000JOR'])
  assert.equal(corpo.endyear, '2026')
  assert.equal(corpo.startyear, '2022')
  // Sem chave configurada, o campo simplesmente não vai — a v2 aceita assim.
  assert.equal('registrationkey' in corpo, false)
})

test('a chave, quando existe, vai no corpo — e nunca no descritor', async () => {
  let corpo: any = null
  const espiao: typeof fetch = (async (_url: string, init: RequestInit) => {
    corpo = JSON.parse(String(init.body))
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  const connector = createBlsJoltsConnector({ fetchImpl: espiao, registrationKey: 'segredo-bls' })
  await connector.fetchPoints({ timeBudgetMs: 5000 })

  assert.equal(corpo.registrationkey, 'segredo-bls')
  assert.ok(!JSON.stringify(connector.descriptor).includes('segredo'))
})

test('chave só de espaços é chave nenhuma', async () => {
  let corpo: any = null
  const espiao: typeof fetch = (async (_url: string, init: RequestInit) => {
    corpo = JSON.parse(String(init.body))
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  await createBlsJoltsConnector({ fetchImpl: espiao, registrationKey: '   ' }).fetchPoints({
    timeBudgetMs: 5000,
  })
  assert.equal('registrationkey' in corpo, false)
})

test('o descritor declara o que a fonte é', () => {
  assert.equal(BLS_JOLTS_DESCRIPTOR.slug, 'bls_jolts')
  assert.equal(BLS_JOLTS_DESCRIPTOR.metric, 'job_openings_rate')
  // Pesquisa direta com empregadores sobre vagas em aberto: mede a grandeza
  // certa, ao contrário da taxa de desemprego modelada da fase 2.
  assert.equal(BLS_JOLTS_DESCRIPTOR.confidence, 'high')
  assert.deepEqual(BLS_JOLTS_DESCRIPTOR.countries, ['US'])
})
