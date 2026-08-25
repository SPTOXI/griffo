import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSourceQuality, type RawAlertForQuality, type RawJobForQuality } from './job-source-quality'

const NOW = new Date('2026-08-25T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

const job = (patch: Partial<RawJobForQuality> = {}): RawJobForQuality => ({
  sourceSlug: 'adzuna:br',
  createdAt: daysAgo(10),
  publishedAt: daysAgo(10),
  closedAt: null,
  salaryMin: null,
  salaryMax: null,
  requirements: null,
  skills: null,
  normalizedTitle: null,
  ...patch,
})

test('agrupa por fonte e conta o total de vagas', () => {
  const items = calculateSourceQuality(
    [job({ sourceSlug: 'adzuna:br' }), job({ sourceSlug: 'adzuna:br' }), job({ sourceSlug: 'greenhouse' })],
    [],
    NOW
  )
  const br = items.find((i) => i.sourceSlug === 'adzuna:br')!
  const gh = items.find((i) => i.sourceSlug === 'greenhouse')!
  assert.equal(br.totalJobs, 2)
  assert.equal(gh.totalJobs, 1)
})

test('tempo de renovação só aparece com amostra mínima de encerramentos', () => {
  // 4 encerradas: abaixo do mínimo (5) — não aparece nada, não "quase nada".
  const poucas = calculateSourceQuality(
    Array.from({ length: 4 }, () => job({ closedAt: daysAgo(0), publishedAt: daysAgo(10) })),
    [],
    NOW
  )
  assert.equal(poucas[0].avgLifespanDays, null)

  // 5 encerradas, todas com 10 dias de vida: média exata.
  const suficientes = calculateSourceQuality(
    Array.from({ length: 5 }, () => job({ closedAt: daysAgo(0), publishedAt: daysAgo(10) })),
    [],
    NOW
  )
  assert.equal(suficientes[0].avgLifespanDays, 10)
})

test('encerramento com data de início depois do fim não entra na média', () => {
  // Vaga "publicada" DEPOIS de encerrada -- dado inconsistente, não "renovação em 0 dias".
  const items = calculateSourceQuality(
    [
      ...Array.from({ length: 5 }, () => job({ closedAt: daysAgo(10), publishedAt: daysAgo(20) })),
      job({ closedAt: daysAgo(10), publishedAt: daysAgo(0) }), // inconsistente
    ],
    [],
    NOW
  )
  assert.equal(items[0].closedJobs, 6, 'a vaga inconsistente ainda conta como encerrada')
  assert.equal(items[0].avgLifespanDays, 10, 'mas não entra na média de tempo de vida')
})

test('taxas de qualidade: salário, requisitos, título reconhecido', () => {
  const items = calculateSourceQuality(
    [
      job({ salaryMin: 5000, requirements: '["SQL"]', normalizedTitle: 'data_analyst' }),
      job({ salaryMin: null, salaryMax: null, requirements: null, skills: null, normalizedTitle: null }),
    ],
    [],
    NOW
  )
  assert.equal(items[0].salaryDisclosureRate, 50)
  assert.equal(items[0].requirementsFillRate, 50)
  assert.equal(items[0].recognizedTitleRate, 50)
})

test('rendimento no Radar: share de alertas fortes/bons e de feedback positivo', () => {
  const alerts: RawAlertForQuality[] = [
    { sourceSlug: 'adzuna:br', overallFit: 'strong', feedback: 'interested' },
    { sourceSlug: 'adzuna:br', overallFit: 'weak', feedback: 'not_useful' },
    { sourceSlug: 'adzuna:br', overallFit: 'good', feedback: null },
  ]
  const items = calculateSourceQuality([job()], alerts, NOW)
  assert.equal(items[0].totalAlerts, 3)
  assert.equal(items[0].strongOrGoodShare, Math.round((2 / 3) * 1000) / 10)
  // Só 2 dos 3 responderam feedback; 1 de 2 foi positivo.
  assert.equal(items[0].positiveFeedbackShare, 50)
})

test('sem ninguém responder feedback, o share fica nulo — não vira zero', () => {
  const alerts: RawAlertForQuality[] = [{ sourceSlug: 'adzuna:br', overallFit: 'good', feedback: null }]
  const items = calculateSourceQuality([job()], alerts, NOW)
  assert.equal(items[0].positiveFeedbackShare, null)
})

test('maturidade: baixa com pouca amostra ou pouca janela de tempo', () => {
  const poucaAmostra = calculateSourceQuality(
    Array.from({ length: 5 }, () => job({ createdAt: daysAgo(60) })),
    [],
    NOW
  )
  assert.equal(poucaAmostra[0].maturity, 'baixa')

  const poucoTempo = calculateSourceQuality(
    Array.from({ length: 200 }, () => job({ createdAt: daysAgo(2) })),
    [],
    NOW
  )
  assert.equal(poucoTempo[0].maturity, 'baixa')
})

test('maturidade: média com amostra e janela razoáveis, mas abaixo do ciclo completo', () => {
  const items = calculateSourceQuality(
    Array.from({ length: 50 }, () => job({ createdAt: daysAgo(20) })),
    [],
    NOW
  )
  assert.equal(items[0].maturity, 'média')
})

test('maturidade: alta só com amostra grande E janela de pelo menos STALE_AFTER_DAYS', () => {
  const jobs = [
    ...Array.from({ length: 90 }, () => job({ createdAt: daysAgo(50) })),
    ...Array.from({ length: 10 }, () => job({ createdAt: daysAgo(50), closedAt: daysAgo(5), publishedAt: daysAgo(40) })),
  ]
  const items = calculateSourceQuality(jobs, [], NOW)
  assert.equal(items[0].totalJobs, 100)
  assert.equal(items[0].closedJobs, 10)
  assert.equal(items[0].observationDays, 50)
  assert.equal(items[0].maturity, 'alta')
})

test('a ordenação é pelo total de vagas, maior primeiro', () => {
  const items = calculateSourceQuality(
    [
      ...Array.from({ length: 3 }, () => job({ sourceSlug: 'pequena' })),
      ...Array.from({ length: 10 }, () => job({ sourceSlug: 'grande' })),
    ],
    [],
    NOW
  )
  assert.deepEqual(items.map((i) => i.sourceSlug), ['grande', 'pequena'])
})
