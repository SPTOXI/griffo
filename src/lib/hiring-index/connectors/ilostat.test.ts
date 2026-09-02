import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ILOSTAT_DESCRIPTOR,
  createIlostatConnector,
  parseIlostatPayload,
  periodFromIlostatTime,
  startPeriodFor,
} from './ilostat'

/**
 * Recorte do payload REAL observado em 01/09/2026, em
 * `GET sdmx.ilo.org/rest/data/ILO,DF_UNE_DEAP_SEX_AGE_RT,1.0/.Q.UNE_DEAP_RT.SEX_T.AGE_YTHADULT_YGE15`
 * com `startPeriod=2024-Q1&dimensionAtObservation=AllDimensions`.
 *
 * Os valores são os da resposta de verdade, não números convenientes: a
 * Alemanha sem nenhuma marcação; os EUA com `B` (quebra de série) EXATAMENTE em
 * 2025-Q4 e sem marcação nos demais; a Guatemala com `B` em quatro trimestres
 * seguidos e sem os anteriores; a África do Sul com desemprego de 30%+, que é o
 * dado publicado; `KOS` (Kosovo), que o ILOSTAT publica e não é código ISO
 * 3166-1; e a lista de `OBS_STATUS` com um único elemento, `B`, porque foi só
 * ele que apareceu.
 */
const AREAS = ['BRA', 'DEU', 'GTM', 'KOS', 'USA', 'ZAF']
const TIMES = [
  '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4',
  '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4',
  '2026-Q1', '2026-Q2',
]

/** `[valor, OBS_STATUS, ...]` — o vetor real tem 12 posições; só as duas primeiras importam aqui. */
const cell = (value: number | null, status: number | null = null) =>
  [value, status, 0, 0, 0, 0, 0, 0, null, 0, null, null]

/** As observações reais, por país, no trimestre em que existem. */
const REAL: Record<string, Record<string, (number | null)[]>> = {
  BRA: {
    '2024-Q1': cell(7.895), '2024-Q2': cell(6.865), '2024-Q3': cell(6.328), '2024-Q4': cell(6.133),
    '2025-Q1': cell(6.972), '2025-Q2': cell(5.734), '2025-Q3': cell(5.555), '2025-Q4': cell(5.05),
    '2026-Q1': cell(6.031),
  },
  DEU: {
    '2024-Q1': cell(3.314), '2024-Q2': cell(3.397), '2024-Q3': cell(3.558), '2024-Q4': cell(3.238),
    '2025-Q1': cell(3.8), '2025-Q2': cell(3.8), '2025-Q3': cell(4), '2025-Q4': cell(3.7),
    '2026-Q1': cell(4),
  },
  // Quatro trimestres marcados com quebra de série, e nada antes de 2024-Q4.
  GTM: {
    '2024-Q4': cell(1.903, 0), '2025-Q1': cell(2.445, 0),
    '2025-Q2': cell(2.325, 0), '2025-Q3': cell(2.048, 0),
  },
  // Código que o produto não conhece.
  KOS: {
    '2024-Q1': cell(10.77), '2024-Q2': cell(10.537), '2024-Q3': cell(10.758), '2024-Q4': cell(11.266),
  },
  USA: {
    '2024-Q1': cell(4.057), '2024-Q2': cell(3.841), '2024-Q3': cell(4.265), '2024-Q4': cell(3.923),
    '2025-Q1': cell(4.364), '2025-Q2': cell(4.072), '2025-Q3': cell(4.46), '2025-Q4': cell(4.209, 0),
    '2026-Q1': cell(4.576), '2026-Q2': cell(4.15),
  },
  ZAF: {
    '2024-Q1': cell(32.638), '2024-Q2': cell(33.193), '2024-Q3': cell(31.766), '2024-Q4': cell(31.52),
    '2025-Q1': cell(32.621), '2025-Q2': cell(33.037),
  },
}

const ids = (list: readonly string[]) => list.map((id) => ({ id, name: id }))

function buildPayload(
  observations: Record<string, (number | null)[]>,
  statusValues = [{ id: 'B', name: 'Break in series' }]
) {
  return {
    meta: { schema: 'sdmx-json', sender: { id: 'ILO', name: 'ILOSTAT' } },
    data: {
      structure: {
        dimensions: {
          observation: [
            { id: 'REF_AREA', name: 'Reference area', values: ids(AREAS) },
            { id: 'FREQ', name: 'Frequency', values: ids(['Q']) },
            { id: 'MEASURE', name: 'Measure', values: ids(['UNE_DEAP_RT']) },
            { id: 'SEX', name: 'Sex', values: ids(['SEX_T']) },
            { id: 'AGE', name: 'Age', values: ids(['AGE_YTHADULT_YGE15']) },
            { id: 'TIME_PERIOD', name: 'Time period', values: ids(TIMES) },
          ],
        },
        attributes: {
          observation: [
            { id: 'OBS_STATUS', name: 'Observation status', values: statusValues },
            { id: 'UNIT_MEASURE_TYPE', values: [{ id: 'RT' }] },
            { id: 'UNIT_MEASURE', values: [{ id: 'PT', name: 'Percentage' }] },
            { id: 'UNIT_MULT', values: [{ id: '0' }] },
            { id: 'SOURCE', values: [{ id: 'LFS - Labour Force Survey' }] },
            { id: 'NOTE_SOURCE', values: [{ id: 'n' }] },
            { id: 'NOTE_INDICATOR', values: [{ id: 'n' }] },
            { id: 'NOTE_CLASSIF', values: [] },
            { id: 'DECIMALS', values: [{ id: '1' }] },
            { id: 'UPPER_BOUND', values: [] },
            { id: 'LOWER_BOUND', values: [] },
          ],
        },
      },
      dataSets: [{ action: 'Information', observations }],
    },
  }
}

/** As observações reais, na chave posicional `area:freq:measure:sex:age:time`. */
function realObservations(): Record<string, (number | null)[]> {
  const out: Record<string, (number | null)[]> = {}
  for (const [area, byTime] of Object.entries(REAL)) {
    const a = AREAS.indexOf(area)
    for (const [time, value] of Object.entries(byTime)) {
      out[`${a}:0:0:0:0:${TIMES.indexOf(time)}`] = value
    }
  }
  return out
}

const payloadReal = buildPayload(realObservations())

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

const pointsOf = (country: string, payload: unknown = payloadReal) =>
  parseIlostatPayload(payload)
    .points.filter((p) => p.country === country)
    .sort((a, b) => a.period.getTime() - b.period.getTime())

test('a chave posicional é desfeita nas dimensões certas', () => {
  // Nada na resposta diz "este 3.7 é da Alemanha em 2025-Q4": isso se calcula
  // da posição na chave e dos `values` de cada dimensão.
  const alemaes = pointsOf('DE')
  assert.equal(alemaes.length, 9)
  assert.equal(alemaes[7].period.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(alemaes[7].value, 3.7)
  assert.equal(alemaes[7].periodType, 'quarter')
})

test('ALFA-3 VIRA ALFA-2 — a tradução acontece na fronteira', () => {
  // Sem isto o Brasil seria dois países no banco: `BR` do Eurostat/BLS e `BRA`
  // daqui.
  const brasileiros = pointsOf('BR')
  assert.equal(brasileiros.length, 9)
  assert.equal(brasileiros[0].value, 7.895)
  assert.equal(pointsOf('BRA').length, 0)
  assert.equal(pointsOf('US').length, 10)
})

test('código de país que o produto não conhece é descartado e denunciado', () => {
  // O ILOSTAT publica `KOS`, que não existe na ISO 3166-1. Um país errado é
  // pior que país nenhum.
  const { points, problems } = parseIlostatPayload(payloadReal)
  assert.equal(points.filter((p) => p.country === 'KOS').length, 0)
  assert.equal(points.filter((p) => p.country.length !== 2).length, 0)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /KOS/)
})

test('QUEBRA DE SÉRIE É MARCADA, e só no ponto que a fonte marcou', () => {
  // `B` diz que antes e depois daquele ponto não são comparáveis ENTRE SI — a
  // única comparação que este produto faz.
  const americanos = pointsOf('US')
  const comQuebra = americanos.filter((p) => p.seriesBreak)
  assert.equal(comQuebra.length, 1)
  assert.equal(comQuebra[0].period.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(comQuebra[0].note, 'B')

  const alemaes = pointsOf('DE')
  assert.ok(alemaes.every((p) => p.seriesBreak === false))
  assert.ok(alemaes.every((p) => p.note === null))

  assert.equal(pointsOf('GT').filter((p) => p.seriesBreak).length, 4)
})

test('O `OBS_STATUS` É RESOLVIDO PELO CÓDIGO, NUNCA PELA POSIÇÃO', () => {
  // A lista de `OBS_STATUS` traz só os valores presentes NAQUELA resposta. Em
  // 01/09/2026 ela tinha um elemento só (`B`), e ler "índice 0 = quebra"
  // funcionaria hoje e quebraria calado na primeira resposta com `P` antes.
  //
  // Aqui a ordem é invertida de propósito: índice 0 é `P` e índice 1 é `B`.
  const invertido = buildPayload(realObservations(), [
    { id: 'P', name: 'Provisional' },
    { id: 'B', name: 'Break in series' },
  ])

  const americanos = pointsOf('US', invertido)
  const marcado = americanos.find((p) => p.period.toISOString() === '2025-10-01T00:00:00.000Z')!
  assert.equal(marcado.note, 'P')
  assert.equal(marcado.seriesBreak, false, 'índice 0 agora é P, não quebra de série')
  assert.equal(marcado.revised, false, 'provisório entra como não revisado')
})

test('provisório, estimativa e extrapolação por modelo entram como não revisados', () => {
  // `I`, `M` e `Z` são número calculado, não medido. Não são descartados — a
  // fonte os publica dentro da série e apagá-los abriria buraco de calendário —
  // mas nenhum deles é "o" número do trimestre.
  for (const code of ['P', 'E', 'F', 'I', 'M', 'Z']) {
    const payload = buildPayload(realObservations(), [{ id: code, name: code }])
    const marcado = pointsOf('US', payload).find(
      (p) => p.period.toISOString() === '2025-10-01T00:00:00.000Z'
    )!
    assert.equal(marcado.revised, false, `${code} deveria entrar como não revisado`)
    assert.equal(marcado.note, code)
  }

  const alemaes = pointsOf('DE')
  assert.ok(alemaes.every((p) => p.revised === true))
})

test('TODO PONTO SAI COM CONFIANÇA BAIXA — inclusive Alemanha e Estados Unidos', () => {
  // Não é juízo sobre este ou aquele instituto: taxa de desemprego mede coisa
  // diferente de taxa de vaga em aberto, e em economia com setor informal
  // grande mede mal. É a posição documentada do produto, não um caso a caso.
  const { points } = parseIlostatPayload(payloadReal)
  assert.ok(points.length > 0)
  assert.ok(points.every((p) => p.confidence === 'low'))
  assert.equal(ILOSTAT_DESCRIPTOR.confidence, 'low')
})

test('todo ponto carrega a métrica, a unidade e a fonte', () => {
  const { points } = parseIlostatPayload(payloadReal)
  assert.ok(points.every((p) => p.metric === 'unemployment_rate'))
  assert.ok(points.every((p) => p.unit === 'percent'))
  assert.ok(points.every((p) => p.source === 'ilostat_une'))
  assert.ok(points.every((p) => p.periodType === 'quarter'))
})

test('trimestre sem observação simplesmente não aparece — nunca vira zero', () => {
  // O Brasil não tem 2026-Q2 na resposta real e a Guatemala não tem nada antes
  // de 2024-Q4. `Number(null)` é `0`, e "desemprego de 0,0%" é um número que
  // ninguém publicou.
  assert.equal(pointsOf('BR').length, 9)
  assert.equal(pointsOf('GT').length, 4)

  const comNulo = buildPayload({ ...realObservations(), '1:0:0:0:0:9': cell(null) })
  assert.equal(pointsOf('DE', comNulo).length, 9)
})

test('a cobertura vai muito além do BLS e do Eurostat', () => {
  // É a razão de existir deste conector: África do Sul não tem nem JOLTS nem
  // pesquisa de postos vagos do Eurostat.
  const sulAfricanos = pointsOf('ZA')
  assert.equal(sulAfricanos.length, 6)
  assert.equal(sulAfricanos[0].value, 32.638)
})

test('o trimestre vira o primeiro dia do período, em UTC', () => {
  assert.equal(periodFromIlostatTime('2025-Q1')!.toISOString(), '2025-01-01T00:00:00.000Z')
  assert.equal(periodFromIlostatTime('2025-Q4')!.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(periodFromIlostatTime('2025Q2')!.toISOString(), '2025-04-01T00:00:00.000Z')
  assert.equal(periodFromIlostatTime('2025-M01'), null)
  assert.equal(periodFromIlostatTime('2025'), null)
  assert.equal(periodFromIlostatTime(null), null)
})

test('a janela começa `lastPeriods` trimestres atrás do trimestre corrente', () => {
  // O ILOSTAT não tem o `lastTimePeriod` do Eurostat: a janela se declara por
  // data inicial.
  assert.equal(startPeriodFor(new Date('2026-09-01T00:00:00Z'), 24), '2020-Q4')
  assert.equal(startPeriodFor(new Date('2026-01-15T00:00:00Z'), 4), '2025-Q2')
  assert.equal(startPeriodFor(new Date('2026-01-15T00:00:00Z'), 1), '2026-Q1')
})

test('payload malformado não lança e não vira ponto', () => {
  assert.deepEqual(parseIlostatPayload(null).points, [])
  assert.deepEqual(parseIlostatPayload({}).points, [])
  assert.deepEqual(parseIlostatPayload({ data: { structure: {} } }).points, [])

  const semDimensao = buildPayload(realObservations())
  semDimensao.data.structure.dimensions.observation = [{ id: 'FREQ', name: 'Frequency', values: ids(['Q']) }]
  const { points, problems } = parseIlostatPayload(semDimensao)
  assert.equal(points.length, 0)
  assert.match(problems[0], /REF_AREA/)
})

test('erro declarado pelo ILOSTAT vira falha, com o corpo preservado', () => {
  const erro = { errors: [{ code: 150, title: 'Semantic Error: invalid dimension value' }] }
  const { points, problems } = parseIlostatPayload(erro)
  assert.equal(points.length, 0)
  assert.match(problems[0], /Semantic Error/)
})

test('`errors: []` NÃO É ERRO — ele vem em toda resposta bem-sucedida', () => {
  // Array vazio é "truthy" em JavaScript. Testar só a presença da chave
  // rejeitaria a coleta inteira do ILOSTAT em silêncio, que foi exatamente o
  // que aconteceu na primeira coleta real ("ILOSTAT devolveu erro: []").
  const comErrosVazios = { ...payloadReal, errors: [] as unknown[] }
  const { points, problems } = parseIlostatPayload(comErrosVazios)
  assert.ok(points.length > 0)
  assert.equal(problems.filter((p) => /devolveu erro/.test(p)).length, 0)
})

test('RESPOSTA VAZIA É FALHA DE COLETA, NÃO MUNDO SEM DESEMPREGO', async () => {
  // Filtro que não casa devolve 200 com nenhuma observação. Ler isso como
  // ausência de dado é o defeito que a Adzuna já ensinou aqui.
  const connector = createIlostatConnector({ fetchImpl: fakeFetch(buildPayload({})) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.equal(result.points.length, 0)
})

test('coleta com país desconhecido é PARCIAL, não completa nem falha', async () => {
  const connector = createIlostatConnector({ fetchImpl: fakeFetch(payloadReal) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'partial')
  assert.ok(result.points.length > 0)
  assert.match(result.error!, /KOS/)
})

test('HTTP ruim é falha', async () => {
  const connector = createIlostatConnector({ fetchImpl: fakeFetch({}, false, 503) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 503/)
})

test('A CHAMADA PEDE JSON, TRIMESTRAL E TODAS AS DIMENSÕES NA CHAVE', async () => {
  // Sem `Accept` o web service devolve XML; sem `dimensionAtObservation` a
  // chave da observação deixa de conter o trimestre.
  let url = ''
  let init: RequestInit | undefined
  const espiao: typeof fetch = (async (u: string, i: RequestInit) => {
    url = u
    init = i
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  await createIlostatConnector({
    fetchImpl: espiao,
    lastPeriods: 24,
    now: () => new Date('2026-09-01T00:00:00Z'),
  }).fetchPoints({ timeBudgetMs: 5000 })

  assert.match(url, /ILO,DF_UNE_DEAP_SEX_AGE_RT,1\.0/)
  assert.match(url, /\/\.Q\.UNE_DEAP_RT\.SEX_T\.AGE_YTHADULT_YGE15\?/)
  assert.match(url, /startPeriod=2020-Q4/)
  assert.match(url, /dimensionAtObservation=AllDimensions/)
  assert.match(String((init!.headers as Record<string, string>).Accept), /sdmx\.data\+json/)
})

test('A CHAMADA MANDA `Accept-Language`, SEM O QUAL O SERVIÇO RESPONDE 500', () => {
  // O `fetch` do Node manda `Accept-Language: *` por padrão e o NSI Web Service
  // do ILO estoura ao lê-lo, com o corpo `languageTag1`. A mesma URL no `curl`,
  // que não manda o cabeçalho, responde 200 — foi assim que apareceu.
  let init: RequestInit | undefined
  const espiao: typeof fetch = (async (_u: string, i: RequestInit) => {
    init = i
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  return createIlostatConnector({ fetchImpl: espiao })
    .fetchPoints({ timeBudgetMs: 5000 })
    .then(() => {
      assert.equal((init!.headers as Record<string, string>)['Accept-Language'], 'en')
    })
})

test('o descritor não promete uma lista fixa de países', () => {
  assert.equal(ILOSTAT_DESCRIPTOR.countries, null)
  assert.equal(ILOSTAT_DESCRIPTOR.slug, 'ilostat_une')
  assert.equal(ILOSTAT_DESCRIPTOR.metric, 'unemployment_rate')
})
