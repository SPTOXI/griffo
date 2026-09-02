import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeCountryCode,
  selectSeries,
  sourceDisplayName,
  summarizeHiringIndex,
  toSeriesPoint,
  type LaborMarketRow,
} from './lookup'

/** Linhas mensais a partir de janeiro de 2024, no formato que o Prisma devolve. */
function rows(
  values: number[],
  overrides: Partial<LaborMarketRow> = {},
  startMonth = 0
): LaborMarketRow[] {
  return values.map((value, i) => ({
    country: 'US',
    source: 'bls_jolts',
    metric: 'job_openings_rate',
    value,
    unit: 'percent',
    period: new Date(Date.UTC(2024, startMonth + i, 1)),
    periodType: 'month',
    revised: true,
    seriesBreak: false,
    confidence: 'high',
    note: null,
    ...overrides,
  }))
}

// ---------------------------------------------------------------------------
// Normalização do código de país
// ---------------------------------------------------------------------------

test('código de país vira ISO2 maiúsculo', () => {
  assert.equal(normalizeCountryCode('us'), 'US')
  assert.equal(normalizeCountryCode(' de '), 'DE')
})

test('qualquer coisa que não seja duas letras é recusada', () => {
  assert.equal(normalizeCountryCode('USA'), null)
  assert.equal(normalizeCountryCode('U'), null)
  assert.equal(normalizeCountryCode('B1'), null)
  assert.equal(normalizeCountryCode(''), null)
  assert.equal(normalizeCountryCode(null), null)
  assert.equal(normalizeCountryCode(undefined), null)
})

// ---------------------------------------------------------------------------
// Escolha da série — a razão de este módulo existir
// ---------------------------------------------------------------------------

test('sem nenhuma linha, não há série', () => {
  assert.equal(selectSeries([]), null)
})

test('uma fonte só devolve a própria série inteira', () => {
  const series = selectSeries(rows([4.0, 4.1, 4.2, 4.3, 4.4, 4.5]))
  assert.equal(series?.length, 6)
})

test('duas fontes no mesmo país NÃO são emendadas: ganha a de mais pontos', () => {
  // O degrau entre a taxa do JOLTS e a taxa do Eurostat leria como virada de
  // mercado se as duas virassem uma série só.
  const jolts = rows([4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8])
  const outra = rows([2.0, 2.1, 2.2], { source: 'ilostat', metric: 'unemployment_rate' })

  const series = selectSeries([...jolts, ...outra])
  assert.equal(series?.length, 8)
  assert.ok(series?.every((r) => r.source === 'bls_jolts'))
})

test('empate no número de pontos: a fonte de confiança alta ganha da modelada', () => {
  const pesquisada = rows([4.0, 4.1, 4.2, 4.3, 4.4, 4.5])
  const modelada = rows([2.0, 2.1, 2.2, 2.3, 2.4, 2.5], {
    source: 'ilostat',
    metric: 'unemployment_rate',
    confidence: 'low',
  })

  const series = selectSeries([...modelada, ...pesquisada])
  assert.ok(series?.every((r) => r.source === 'bls_jolts'))
})

test('empate em pontos e em confiança: a série mais recente ganha', () => {
  const antiga = rows([4.0, 4.1, 4.2, 4.3, 4.4, 4.5], { source: 'a', metric: 'job_vacancy_rate' }, 0)
  const recente = rows([3.0, 3.1, 3.2, 3.3, 3.4, 3.5], { source: 'b', metric: 'job_vacancy_rate' }, 6)

  const series = selectSeries([...antiga, ...recente])
  assert.ok(series?.every((r) => r.source === 'b'))
})

test('a escolha é determinística: a mesma tabela em outra ordem dá a mesma série', () => {
  const a = rows([4.0, 4.1, 4.2, 4.3, 4.4, 4.5], { source: 'aaa', metric: 'job_vacancy_rate' })
  const b = rows([3.0, 3.1, 3.2, 3.3, 3.4, 3.5], { source: 'bbb', metric: 'job_vacancy_rate' })

  assert.equal(selectSeries([...a, ...b])?.[0].source, 'aaa')
  assert.equal(selectSeries([...b, ...a])?.[0].source, 'aaa')
})

// ---------------------------------------------------------------------------
// Conversão para ponto de série
// ---------------------------------------------------------------------------

test('confiança desconhecida na linha é tratada como alta, e "low" é preservada', () => {
  assert.equal(toSeriesPoint(rows([4.0])[0]).confidence, 'high')
  assert.equal(toSeriesPoint(rows([4.0], { confidence: 'low' })[0]).confidence, 'low')
  assert.equal(toSeriesPoint(rows([4.0], { confidence: 'seja-o-que-for' })[0]).confidence, 'high')
})

test('quebra de série e impressão preliminar atravessam a conversão', () => {
  const point = toSeriesPoint(rows([4.0], { revised: false, seriesBreak: true })[0])
  assert.equal(point.revised, false)
  assert.equal(point.seriesBreak, true)
})

// ---------------------------------------------------------------------------
// O resumo que vai para a tela
// ---------------------------------------------------------------------------

test('país sem nenhuma linha sai como NÃO COBERTO, e não como erro', () => {
  const summary = summarizeHiringIndex('BR', [])
  assert.equal(summary.covered, false)
  assert.equal(summary.phase, null)
  // Não coberto é diferente de coberto sem histórico: não há motivo a declarar.
  assert.equal(summary.insufficientDataReason, null)
  assert.equal(summary.source, null)
  assert.equal(summary.country, 'BR')
})

test('país coberto com histórico curto sai COBERTO, sem fase, com o motivo', () => {
  const summary = summarizeHiringIndex('GB', rows([2.0, 2.1, 2.2], { country: 'GB' }))
  assert.equal(summary.covered, true)
  assert.equal(summary.phase, null)
  assert.equal(summary.insufficientDataReason, 'too_few_points')
  // A fonte continua visível mesmo sem classificação — transparência não
  // depende de haver um resultado bonito.
  assert.equal(summary.sourceName, 'U.S. Bureau of Labor Statistics (JOLTS)')
})

test('quebra de série recente é o motivo declarado, não "poucos pontos"', () => {
  const antes = rows([3.0, 3.1, 3.2, 3.3, 3.4, 3.5], { country: 'CZ' }, 0)
  const depois = rows([2.0, 2.1, 2.2], { country: 'CZ' }, 6)
  depois[0].seriesBreak = true

  const summary = summarizeHiringIndex('CZ', [...antes, ...depois])
  assert.equal(summary.phase, null)
  assert.equal(summary.insufficientDataReason, 'series_break_too_recent')
})

test('série longa e em queda sai classificada, com fonte e período', () => {
  const summary = summarizeHiringIndex('us', rows([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6]))
  assert.equal(summary.country, 'US')
  assert.equal(summary.covered, true)
  assert.equal(summary.phase, 'cooling')
  assert.equal(summary.insufficientDataReason, null)
  assert.equal(summary.sourceName, 'U.S. Bureau of Labor Statistics (JOLTS)')
  assert.equal(summary.metric, 'job_openings_rate')
  assert.equal(summary.periodType, 'month')
  assert.equal(summary.latestPeriod, new Date(Date.UTC(2024, 7, 1)).toISOString())
})

test('impressão preliminar na janela final chega ao resumo', () => {
  const series = rows([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6])
  series[series.length - 1].revised = false

  assert.equal(summarizeHiringIndex('US', series).latestIsPreliminary, true)
  assert.equal(summarizeHiringIndex('US', rows([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6])).latestIsPreliminary, false)
})

test('confiança baixa em qualquer ponto rebaixa o resumo inteiro', () => {
  const series = rows([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6])
  series[2].confidence = 'low'
  assert.equal(summarizeHiringIndex('US', series).confidence, 'low')
})

test('o resumo nunca devolve texto de tela — só o enum da fase', () => {
  const summary = summarizeHiringIndex('US', rows([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6]))
  assert.ok(['cooling', 'bottoming_out', 'recovering', 'heating_up', 'stable'].includes(summary.phase!))
})

// ---------------------------------------------------------------------------
// Nome da fonte
// ---------------------------------------------------------------------------

test('fonte conhecida vira nome próprio da instituição', () => {
  assert.equal(sourceDisplayName('eurostat_jvs'), 'Eurostat')
  assert.equal(sourceDisplayName('bls_jolts'), 'U.S. Bureau of Labor Statistics (JOLTS)')
})

test('fonte desconhecida mostra o identificador em vez de esconder a origem', () => {
  assert.equal(sourceDisplayName('cepalstat_x'), 'cepalstat_x')
})
