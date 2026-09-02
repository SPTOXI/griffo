import test from 'node:test'
import assert from 'node:assert/strict'
import { PHASES, phaseByCountry, phaseDistribution, summarizeAtlas } from './atlas'
import { summarizeHiringIndex, type HiringIndexSummary, type LaborMarketRow } from './lookup'
import type { HiringPhase } from './phase'

/**
 * As travas do agregado (§2.55).
 *
 * O que está sendo protegido aqui não é aritmética: é a promessa de que o
 * "Índice GriffoWork" continue sendo uma CONTAGEM conferível e não vire, numa
 * refatoração distraída, uma média de valores que `phase.ts` proíbe.
 */

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

/** Séries com forma conhecida, para não depender do acaso de um número. */
const FALLING = [6.0, 5.8, 5.6, 5.4, 5.2, 5.0, 4.8, 4.6]
const RISING = [3.0, 3.2, 3.5, 3.9, 4.4, 5.0, 5.7, 6.5]

function summary(overrides: Partial<HiringIndexSummary> = {}): HiringIndexSummary {
  return {
    country: 'US',
    covered: true,
    source: 'bls_jolts',
    sourceName: 'U.S. Bureau of Labor Statistics (JOLTS)',
    metric: 'job_openings_rate',
    phase: 'stable',
    insufficientDataReason: null,
    latestPeriod: '2026-07-01T00:00:00.000Z',
    periodType: 'month',
    latestIsPreliminary: false,
    confidence: 'high',
    pointsUsed: 55,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// A distribuição — o "índice agregado"
// ---------------------------------------------------------------------------

test('a distribuição conta países por fase, e a soma fecha com o total', () => {
  const d = phaseDistribution([
    summary({ country: 'AA', phase: 'cooling' }),
    summary({ country: 'AB', phase: 'cooling' }),
    summary({ country: 'AC', phase: 'heating_up' }),
    summary({ country: 'AD', phase: 'recovering' }),
    summary({ country: 'AE', phase: 'bottoming_out' }),
    summary({ country: 'AF', phase: 'stable' }),
    summary({ country: 'AG', phase: null, insufficientDataReason: 'too_few_points' }),
  ])

  assert.equal(d.counts.cooling, 2)
  assert.equal(d.counts.heating_up, 1)
  assert.equal(d.counts.recovering, 1)
  assert.equal(d.counts.bottoming_out, 1)
  assert.equal(d.counts.stable, 1)
  assert.equal(d.unclassified, 1)
  assert.equal(d.tracked, 7)
  assert.equal(d.classified, 6)

  // A conferência que importa: nenhum país some e nenhum é contado duas vezes.
  const soma = PHASES.reduce((acc, p) => acc + d.counts[p], 0)
  assert.equal(soma + d.unclassified, d.tracked)
})

test('país SEM COBERTURA não entra em contagem nenhuma', () => {
  const d = phaseDistribution([
    summary({ country: 'AA', phase: 'heating_up' }),
    summary({
      country: 'AB',
      covered: false,
      source: null,
      sourceName: null,
      metric: null,
      phase: null,
      latestPeriod: null,
      periodType: null,
      pointsUsed: 0,
    }),
  ])

  assert.equal(d.tracked, 1)
  assert.equal(d.unclassified, 0)
  assert.equal(d.counts.heating_up, 1)
})

test('lista vazia devolve zeros, e não um NaN disfarçado de número', () => {
  const d = phaseDistribution([])
  for (const phase of PHASES) assert.equal(d.counts[phase], 0)
  assert.equal(d.tracked, 0)
  assert.equal(d.classified, 0)
  assert.equal(d.unclassified, 0)
  assert.equal(d.netBreadth, 0)
})

// ---------------------------------------------------------------------------
// A amplitude líquida — o ÚNICO escalar, e o que ele não é
// ---------------------------------------------------------------------------

test('a amplitude líquida é esquentando MENOS esfriando, e nada mais', () => {
  const make = (heating: number, cooling: number, outros: HiringPhase[] = []) =>
    phaseDistribution([
      ...Array.from({ length: heating }, (_, i) => summary({ country: `H${i}`, phase: 'heating_up' })),
      ...Array.from({ length: cooling }, (_, i) => summary({ country: `C${i}`, phase: 'cooling' })),
      ...outros.map((phase, i) => summary({ country: `O${i}`, phase })),
    ])

  assert.equal(make(5, 2).netBreadth, 3)
  assert.equal(make(2, 5).netBreadth, -3)
  assert.equal(make(4, 4).netBreadth, 0)

  // As fases intermediárias NÃO entram no escalar: incluí-las exigiria pesá-las
  // umas contra as outras, que é o arbítrio que a distribuição evita.
  assert.equal(make(5, 2, ['recovering', 'recovering', 'bottoming_out', 'stable']).netBreadth, 3)
})

test('a amplitude é contagem de países — nunca uma média de valores', () => {
  // Dois países com fase igual e valores muito diferentes contam UM cada.
  const atlas = summarizeAtlas([
    ...rows(RISING, { country: 'AA' }),
    ...rows(RISING.map((v) => v * 10), { country: 'AB', source: 'eurostat_jvs' }),
  ])

  assert.equal(atlas.distribution.counts.heating_up, 2)
  assert.equal(atlas.distribution.netBreadth, 2)
  assert.equal(Number.isInteger(atlas.distribution.netBreadth), true)
})

// ---------------------------------------------------------------------------
// A montagem do atlas a partir das linhas cruas
// ---------------------------------------------------------------------------

test('as linhas são agrupadas por país, um resumo cada', () => {
  const atlas = summarizeAtlas([
    ...rows(FALLING, { country: 'DE', source: 'eurostat_jvs' }),
    ...rows(RISING, { country: 'US' }),
  ])

  assert.equal(atlas.countries.length, 2)
  assert.deepEqual(
    atlas.countries.map((c) => c.country),
    ['DE', 'US']
  )
  assert.equal(atlas.distribution.tracked, 2)
})

test('a ordem é alfabética por código, sem país privilegiado', () => {
  const atlas = summarizeAtlas([
    ...rows(RISING, { country: 'US' }),
    ...rows(RISING, { country: 'BR' }),
    ...rows(RISING, { country: 'DE' }),
    ...rows(RISING, { country: 'AO' }),
  ])

  assert.deepEqual(
    atlas.countries.map((c) => c.country),
    ['AO', 'BR', 'DE', 'US']
  )
})

test('o resumo do atlas é o MESMO que a rota de um país produz', () => {
  // Se as duas leituras divergirem, o mapa público e o cartão do laudo pago
  // classificam o mesmo país de formas diferentes. É a razão de `summarizeAtlas`
  // delegar em vez de reimplementar.
  const linhas = rows(FALLING, { country: 'PT', source: 'eurostat_jvs' })
  const sozinho = summarizeHiringIndex('PT', linhas)
  const noAtlas = summarizeAtlas(linhas).countries[0]

  assert.deepEqual(noAtlas, sozinho)
})

test('código de país inválido não vira país no mapa', () => {
  const atlas = summarizeAtlas([
    ...rows(RISING, { country: 'US' }),
    ...rows(RISING, { country: 'USA' }),
    ...rows(RISING, { country: '' }),
    ...rows(RISING, { country: 'X1' }),
  ])

  assert.deepEqual(
    atlas.countries.map((c) => c.country),
    ['US']
  )
})

test('o código chega normalizado, venha como vier do banco', () => {
  const atlas = summarizeAtlas(rows(RISING, { country: ' de ' }))
  assert.deepEqual(
    atlas.countries.map((c) => c.country),
    ['DE']
  )
})

test('o período mais recente do atlas é o mais recente de TODAS as séries', () => {
  const atlas = summarizeAtlas([
    ...rows(RISING, { country: 'AA' }, 0),
    ...rows(RISING, { country: 'AB' }, 6),
  ])

  // A série de `AB` começa seis meses depois, então termina depois.
  assert.equal(atlas.latestPeriod, new Date(Date.UTC(2024, 13, 1)).toISOString())
})

test('sem linha nenhuma, o atlas é honestamente vazio', () => {
  const atlas = summarizeAtlas([])
  assert.deepEqual(atlas.countries, [])
  assert.equal(atlas.latestPeriod, null)
  assert.equal(atlas.updatedAt, null)
  assert.equal(atlas.distribution.tracked, 0)
})

test('a data da coleta é normalizada para ISO, e lixo vira null', () => {
  const at = new Date(Date.UTC(2026, 8, 2, 2, 48))
  assert.equal(summarizeAtlas([], at).updatedAt, at.toISOString())
  assert.equal(summarizeAtlas([], at.toISOString()).updatedAt, at.toISOString())
  assert.equal(summarizeAtlas([], 'não é data').updatedAt, null)
})

test('país coberto sem histórico bastante conta como coberto, não como fase', () => {
  const atlas = summarizeAtlas(rows([4.1, 4.2, 4.0], { country: 'AA' }))

  assert.equal(atlas.countries.length, 1)
  assert.equal(atlas.countries[0].covered, true)
  assert.equal(atlas.countries[0].phase, null)
  assert.equal(atlas.distribution.tracked, 1)
  assert.equal(atlas.distribution.unclassified, 1)
  assert.equal(atlas.distribution.classified, 0)
})

// ---------------------------------------------------------------------------
// A consulta que o desenho do mapa faz
// ---------------------------------------------------------------------------

test('phaseByCountry só responde por país coberto', () => {
  const atlas = summarizeAtlas([
    ...rows(FALLING, { country: 'AA' }),
    ...rows([4.1, 4.2, 4.0], { country: 'AB' }),
  ])
  const mapa = phaseByCountry(atlas)

  assert.equal(mapa.AA, 'cooling')
  // Coberto sem histórico: a chave existe com `null`, que é diferente de ausente.
  assert.equal('AB' in mapa, true)
  assert.equal(mapa.AB, null)
  // País que não está na tabela simplesmente não tem chave — e o desenho
  // neutro é quem responde por ele.
  assert.equal('ZZ' in mapa, false)
})
