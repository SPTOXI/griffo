import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EUROSTAT_DESCRIPTOR,
  createEurostatConnector,
  decodeJsonStat,
  flagsFrom,
  isoFromEurostatGeo,
  parseEurostatPayload,
  periodFromEurostatTime,
} from './eurostat'

/**
 * Recorte do payload REAL observado em 01/09/2026, em
 * `GET ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/jvs_q_nace2`
 * com `format=JSON&freq=Q&s_adj=SA&nace_r2=B-S&sizeclas=TOTAL&indic_em=JVR`.
 *
 * Tudo aqui saiu da resposta de verdade e não foi inventado para ficar
 * conveniente: os agregados `EU27_2020` misturados aos países; a França
 * marcada `d` em TODOS os trimestres (ela pesquisa só empresas com 10+
 * empregados e exclui administração pública); a Chéquia com `b` (quebra de
 * série) em 2025-Q1; os Países Baixos inteiramente `p`; o Reino Unido sem
 * nenhum valor.
 *
 * Acrescentados de propósito ao recorte, porque a API os produz e o recorte de
 * um trimestre não os continha: a marcação `u` (baixa confiabilidade) e um
 * código de país que o produto não conhece.
 */
const T = 4
const geoIndex = {
  EU27_2020: 0,
  BE: 1,
  DE: 2,
  FR: 3,
  CZ: 4,
  NL: 5,
  EL: 6,
  UK: 7,
  XK: 8,
} as const

const payloadReal = {
  version: '2.0',
  class: 'dataset',
  label: 'Job vacancy statistics by NACE Rev. 2 activity - quarterly data (from 2001 onwards)',
  source: 'ESTAT',
  updated: '2026-03-20T23:00:00+0100',
  id: ['freq', 's_adj', 'nace_r2', 'sizeclas', 'indic_em', 'geo', 'time'],
  size: [1, 1, 1, 1, 1, 9, T],
  dimension: {
    freq: { label: 'Time frequency', category: { index: { Q: 0 }, label: { Q: 'Quarterly' } } },
    s_adj: { label: 'Seasonal adjustment', category: { index: { SA: 0 } } },
    nace_r2: { label: 'NACE Rev. 2', category: { index: { 'B-S': 0 } } },
    sizeclas: { label: 'Size classes', category: { index: { TOTAL: 0 } } },
    indic_em: { label: 'Employment indicator', category: { index: { JVR: 0 } } },
    geo: {
      label: 'Geopolitical entity (reporting)',
      category: {
        index: geoIndex,
        label: {
          EU27_2020: 'European Union - 27 countries (from 2020)',
          BE: 'Belgium',
          DE: 'Germany',
          FR: 'France',
          CZ: 'Czechia',
          NL: 'Netherlands',
          EL: 'Greece',
          UK: 'United Kingdom',
          XK: 'Kosovo',
        },
      },
    },
    time: {
      label: 'Time',
      category: { index: { '2025-Q1': 0, '2025-Q2': 1, '2025-Q3': 2, '2025-Q4': 3 } },
    },
  },
  value: {
    // EU27_2020 — agregado, não é país.
    0: 2.2, 1: 2.1, 2: 2, 3: 2.1,
    // BE
    4: 4.1, 5: 3.9, 6: 3.8, 7: 3.5,
    // DE
    8: 2.7, 9: 2.6, 10: 2.5, 11: 2.6,
    // FR — definição própria
    12: 2.5, 13: 2.4, 14: 2.4, 15: 2.3,
    // CZ — quebra de série no primeiro trimestre
    16: 1.9, 17: 2, 18: 2, 19: 1.9,
    // NL — tudo provisório
    20: 4.2, 21: 4.1, 22: 4.1, 23: 4,
    // EL (Grécia, no código do Eurostat)
    24: 2, 25: 1.4, 26: 1.8, 27: 1.6,
    // UK não tem valor nenhum: 28..31 simplesmente não existem.
    // XK — código que o produto não conhece
    32: 1.1, 33: 1.2, 34: 1.3, 35: 1.4,
  } as Record<string, number>,
  status: {
    12: 'd', 13: 'd', 14: 'd', 15: 'd',
    16: 'b',
    20: 'p', 21: 'p', 22: 'p', 23: 'p',
    11: 'u',
  } as Record<string, string>,
}

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

const pointsOf = (country: string) =>
  parseEurostatPayload(payloadReal)
    .points.filter((p) => p.country === country)
    .sort((a, b) => a.period.getTime() - b.period.getTime())

test('o índice achatado do JSON-stat é desfeito nas dimensões certas', () => {
  // Nada na resposta diz "este 2.3 é da França no 4º trimestre": isso se
  // calcula de `id`, `size` e dos `category.index`. É o único trecho não
  // óbvio do conector.
  const cells = decodeJsonStat(payloadReal)
  const franca = cells.find((c) => c.dims.geo === 'FR' && c.dims.time === '2025-Q4')
  assert.ok(franca)
  assert.equal(franca!.value, 2.3)
  assert.equal(franca!.status, 'd')
  assert.equal(franca!.dims.indic_em, 'JVR')
  assert.equal(franca!.dims.s_adj, 'SA')
})

test('AGREGADOS NÃO VIRAM PAÍS', () => {
  // `EU27_2020` é média ponderada de séries que o próprio Eurostat diz não
  // serem comparáveis. Guardá-la como um "país" chamado União Europeia daria
  // ao número mais autoridade do que ele tem.
  const { points } = parseEurostatPayload(payloadReal)
  assert.equal(points.filter((p) => p.country === 'EU27_2020').length, 0)
  assert.equal(points.filter((p) => p.country.length !== 2).length, 0)

  assert.equal(isoFromEurostatGeo('EU27_2020'), null)
  assert.equal(isoFromEurostatGeo('EA20'), null)
  assert.equal(isoFromEurostatGeo('EA21'), null)
})

test('EL vira GR e UK vira GB — a tradução acontece na fronteira', () => {
  // Sem isto, a Grécia seria dois países no banco: `EL` deste conector e `GR`
  // de qualquer outro.
  assert.equal(isoFromEurostatGeo('EL'), 'GR')
  assert.equal(isoFromEurostatGeo('UK'), 'GB')
  assert.equal(isoFromEurostatGeo('DE'), 'DE')

  const gregos = pointsOf('GR')
  assert.equal(gregos.length, 4)
  assert.deepEqual(gregos.map((p) => p.value), [2, 1.4, 1.8, 1.6])
  assert.equal(pointsOf('EL').length, 0)
})

test('código de país que o produto não conhece é descartado e denunciado', () => {
  // Um país errado é pior que país nenhum — a mesma regra de
  // `countryCodeFromName` em lib/market.
  const { points, problems } = parseEurostatPayload(payloadReal)
  assert.equal(points.filter((p) => p.country === 'XK').length, 0)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /XK/)
})

test('país sem valor no trimestre simplesmente não aparece — nunca vira zero', () => {
  // O `:` do Eurostat é ausência de célula no objeto `value`. Convertê-lo em
  // 0,0% diria que o Reino Unido não tem nenhum posto vago.
  const { points } = parseEurostatPayload(payloadReal)
  assert.equal(points.filter((p) => p.country === 'GB').length, 0)
})

test('o trimestre vira o primeiro dia do período, em UTC', () => {
  assert.equal(periodFromEurostatTime('2025-Q1')!.toISOString(), '2025-01-01T00:00:00.000Z')
  assert.equal(periodFromEurostatTime('2025-Q4')!.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(periodFromEurostatTime('2025Q2')!.toISOString(), '2025-04-01T00:00:00.000Z')
  assert.equal(periodFromEurostatTime('2025-M01'), null)
  assert.equal(periodFromEurostatTime('2025-Q5'), null)
  assert.equal(periodFromEurostatTime('lixo'), null)

  const belgas = pointsOf('BE')
  assert.equal(belgas[3].period.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(belgas[3].periodType, 'quarter')
})

test('provisório entra como não revisado', () => {
  const holandeses = pointsOf('NL')
  assert.equal(holandeses.length, 4)
  assert.ok(holandeses.every((p) => p.revised === false))
  assert.ok(holandeses.every((p) => p.note === 'p'))

  const belgas = pointsOf('BE')
  assert.ok(belgas.every((p) => p.revised === true))
  assert.ok(belgas.every((p) => p.note === null))
})

test('"DEFINIÇÃO DIFERE" NÃO REBAIXA A CONFIANÇA, E ISSO É PROPOSITAL', () => {
  // A França vem marcada `d` porque pesquisa só empresas com 10+ empregados e
  // exclui administração pública. Isso a torna incomparável com a Romênia —
  // comparação que este produto NÃO faz. Contra a própria história, uma
  // definição própria e estável não atrapalha nada.
  const franceses = pointsOf('FR')
  assert.equal(franceses.length, 4)
  assert.ok(franceses.every((p) => p.confidence === 'high'))
  assert.ok(franceses.every((p) => p.note === 'd'))
})

test('QUEBRA DE SÉRIE É MARCADA — é ela que invalida a comparação com o próprio passado', () => {
  // `b` diz que antes e depois daquele ponto não são comparáveis ENTRE SI. E
  // "o país contra a própria história" é a única comparação deste produto.
  const tchecos = pointsOf('CZ')
  assert.equal(tchecos.length, 4)
  assert.equal(tchecos[0].seriesBreak, true)
  assert.equal(tchecos[0].note, 'b')
  assert.ok(tchecos.slice(1).every((p) => p.seriesBreak === false))
})

test('"baixa confiabilidade" REBAIXA a confiança — é a fonte falando do próprio número', () => {
  const alemaes = pointsOf('DE')
  assert.equal(alemaes.length, 4)
  assert.equal(alemaes[3].confidence, 'low')
  assert.equal(alemaes[3].note, 'u')
  assert.ok(alemaes.slice(0, 3).every((p) => p.confidence === 'high'))
})

test('as marcações são lidas uma a uma, e combinam', () => {
  assert.deepEqual(flagsFrom('p'), { revised: false, breakInSeries: false, lowConfidence: false })
  assert.deepEqual(flagsFrom('e'), { revised: false, breakInSeries: false, lowConfidence: false })
  assert.deepEqual(flagsFrom('b'), { revised: true, breakInSeries: true, lowConfidence: false })
  assert.deepEqual(flagsFrom('d'), { revised: true, breakInSeries: false, lowConfidence: false })
  assert.deepEqual(flagsFrom('pu'), { revised: false, breakInSeries: false, lowConfidence: true })
  assert.deepEqual(flagsFrom('bd'), { revised: true, breakInSeries: true, lowConfidence: false })
  assert.deepEqual(flagsFrom(null), { revised: true, breakInSeries: false, lowConfidence: false })
})

test('todo ponto carrega a métrica e a unidade da fonte', () => {
  const { points } = parseEurostatPayload(payloadReal)
  assert.ok(points.length > 0)
  assert.ok(points.every((p) => p.metric === 'job_vacancy_rate'))
  assert.ok(points.every((p) => p.unit === 'percent'))
  assert.ok(points.every((p) => p.source === 'eurostat_jvs'))
})

test('FILTRO QUE NÃO CASA É ERRO DE CHAMADA, NÃO EUROPA SEM VAGAS', () => {
  // A primeira tentativa contra a API real usou `indic_em=JOBRATE` e
  // `s_adj=SCA`. A resposta veio 200, com `value: {}` e as categorias
  // vazias — nenhum erro em lugar nenhum.
  const semCorrespondencia = {
    ...payloadReal,
    size: [1, 0, 1, 2, 0, 9, T],
    dimension: {
      ...payloadReal.dimension,
      s_adj: { label: 'Seasonal adjustment', category: { index: {} } },
      indic_em: { label: 'Employment indicator', category: { index: {} } },
    },
    value: {},
    status: {},
  }
  const { points, problems } = parseEurostatPayload(semCorrespondencia)
  assert.equal(points.length, 0)
  assert.match(problems[0], /sem nenhum valor/)
})

test('erro declarado pelo Eurostat vira falha, com o corpo preservado', () => {
  const erro = { error: [{ status: 400, id: 400, label: "Invalid value for 'sinceTimePeriod' parameter." }] }
  const { points, problems } = parseEurostatPayload(erro)
  assert.equal(points.length, 0)
  assert.match(problems[0], /sinceTimePeriod/)
})

test('payload malformado não lança', () => {
  assert.deepEqual(decodeJsonStat(null), [])
  assert.deepEqual(decodeJsonStat({}), [])
  assert.deepEqual(decodeJsonStat({ id: ['geo'], size: [1, 2], dimension: {}, value: {} }), [])
  assert.equal(parseEurostatPayload(null).points.length, 0)
})

test('coleta com país desconhecido é PARCIAL, não completa nem falha', async () => {
  const connector = createEurostatConnector({ fetchImpl: fakeFetch(payloadReal) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'partial')
  assert.ok(result.points.length > 0)
  assert.match(result.error!, /XK/)
})

test('HTTP ruim é falha', async () => {
  const connector = createEurostatConnector({ fetchImpl: fakeFetch({}, false, 503) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 503/)
})

test('A URL PEDE A SÉRIE COM AJUSTE SAZONAL', async () => {
  // Sem `s_adj=SA`, todo país "esfria" no mesmo trimestre todo ano e a
  // classificação de fase viraria um calendário.
  let url = ''
  const espiao: typeof fetch = (async (u: string) => {
    url = u
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  await createEurostatConnector({ fetchImpl: espiao, lastPeriods: 24 }).fetchPoints({
    timeBudgetMs: 5000,
  })

  assert.match(url, /\/jvs_q_nace2\?/)
  assert.match(url, /s_adj=SA/)
  assert.match(url, /indic_em=JVR/)
  assert.match(url, /nace_r2=B-S/)
  assert.match(url, /sizeclas=TOTAL/)
  assert.match(url, /freq=Q/)
  assert.match(url, /lastTimePeriod=24/)
})

test('o descritor não promete uma lista fixa de países', () => {
  // Quem responde no trimestre muda; uma lista fixa mentiria na primeira
  // adesão ou na primeira ausência.
  assert.equal(EUROSTAT_DESCRIPTOR.countries, null)
  assert.equal(EUROSTAT_DESCRIPTOR.slug, 'eurostat_jvs')
  assert.equal(EUROSTAT_DESCRIPTOR.metric, 'job_vacancy_rate')
})
