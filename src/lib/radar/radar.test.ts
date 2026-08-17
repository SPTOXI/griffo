import test from 'node:test'
import assert from 'node:assert/strict'
import type { MatchResult, OverallFit } from '../matching/compatibility'
import {
  DEFAULT_RADAR_PREFERENCES,
  curate,
  meetsMinimumFit,
  radarMetrics,
  summarizeDigest,
  type EvaluatedOpportunity,
} from './curation'

const axis = (score: number) => ({
  score,
  level: score >= 70 ? ('high' as const) : score >= 40 ? ('medium' as const) : ('low' as const),
  evidence: [],
  gaps: [],
  blockers: [],
})

const match = (overall: OverallFit, score = 80, blockers: string[] = []): MatchResult => ({
  professional: axis(score),
  jobFit: axis(score),
  contextual: axis(score),
  overall,
  recommendation: overall === 'strong' ? 'apply' : overall === 'good' ? 'consider' : 'stretch',
  blockers,
  headline: 'Compatibilidade avaliada.',
})

const opp = (
  id: string,
  overall: OverallFit,
  score = 80,
  blockers: string[] = [],
  publishedAt?: Date
): EvaluatedOpportunity => ({
  job: { id },
  jobId: id,
  match: match(overall, score, blockers),
  publishedAt: publishedAt ?? null,
})

const prefs = (patch: Partial<typeof DEFAULT_RADAR_PREFERENCES> = {}) => ({
  ...DEFAULT_RADAR_PREFERENCES,
  ...patch,
})

/* ================================================================== *
 * §15 — SILÊNCIO POR PADRÃO
 *
 * "Se não houver oportunidade relevante: não enviar alerta."
 *
 * Um alerta ruim custa mais que o minuto que toma: custa a confiança
 * de que vale abrir o próximo. Estes testes protegem o silêncio.
 * ================================================================== */

test('§15: sem oportunidade nenhuma, silêncio', () => {
  const result = curate([], { preferences: prefs() })
  assert.equal(result.shouldAlert, false)
  assert.deepEqual(result.selected, [])
  assert.equal(result.silenceReason, 'no_opportunities')
})

test('§15: só oportunidades abaixo do mínimo, silêncio', () => {
  const result = curate([opp('a', 'partial'), opp('b', 'weak')], {
    preferences: prefs({ minimumFit: 'good' }),
  })
  assert.equal(result.shouldAlert, false)
  assert.equal(result.silenceReason, 'below_minimum_fit')
})

test('§15: vaga com impedimento nunca chega ao usuário', () => {
  // Uma vaga que ele não pode aceitar não é oportunidade: é frustração com
  // etiqueta de oportunidade.
  const result = curate([opp('a', 'strong', 95, ['Exige autorização de trabalho nos EUA'])], {
    preferences: prefs(),
  })
  assert.equal(result.shouldAlert, false)
  assert.equal(result.silenceReason, 'all_blocked')
})

test('§15: Radar desligado não avisa nem com oportunidade excelente', () => {
  const result = curate([opp('a', 'strong', 99)], { preferences: prefs({ frequency: 'off' }) })
  assert.equal(result.shouldAlert, false)
  assert.equal(result.silenceReason, 'radar_off')
})

test('§15: não se avisa duas vezes sobre a mesma vaga', () => {
  const result = curate([opp('a', 'strong')], {
    preferences: prefs(),
    alreadyAlertedJobIds: ['a'],
  })
  assert.equal(result.shouldAlert, false)
  assert.equal(result.silenceReason, 'already_alerted')
})

test('§15: o padrão de fábrica é exigente', () => {
  // Um Radar que avisa demais se desliga sozinho na cabeça do usuário.
  assert.equal(DEFAULT_RADAR_PREFERENCES.minimumFit, 'good')
  assert.ok(DEFAULT_RADAR_PREFERENCES.maxPerDigest <= 5)
})

test('oportunidade acima do mínimo interrompe', () => {
  const result = curate([opp('a', 'strong')], { preferences: prefs() })
  assert.equal(result.shouldAlert, true)
  assert.equal(result.selected.length, 1)
  assert.equal(result.silenceReason, null)
})

test('o mínimo é do usuário, não do sistema', () => {
  const opps = [opp('a', 'partial')]
  assert.equal(curate(opps, { preferences: prefs({ minimumFit: 'good' }) }).shouldAlert, false)
  assert.equal(curate(opps, { preferences: prefs({ minimumFit: 'partial' }) }).shouldAlert, true)
})

test('meetsMinimumFit compara na ordem certa', () => {
  assert.ok(meetsMinimumFit(match('strong'), 'good'))
  assert.ok(meetsMinimumFit(match('good'), 'good'))
  assert.ok(!meetsMinimumFit(match('partial'), 'good'))
  assert.ok(!meetsMinimumFit(match('weak'), 'partial'))
})

/* ================================================================== *
 * §23 — Curadoria, não lista
 * ================================================================== */

test('§23: não manda 30 vagas — corta no teto', () => {
  const muitas = Array.from({ length: 30 }, (_, i) => opp(`j${i}`, 'strong', 90 - i))
  const result = curate(muitas, { preferences: prefs({ maxPerDigest: 4 }) })

  assert.equal(result.selected.length, 4)
  assert.equal(result.discarded, 26)
})

test('§23: as melhores vêm primeiro', () => {
  const result = curate(
    [opp('media', 'good', 60), opp('otima', 'strong', 95), opp('boa', 'good', 80)],
    { preferences: prefs({ maxPerDigest: 3 }) }
  )
  assert.deepEqual(result.selected.map((o) => o.jobId), ['otima', 'boa', 'media'])
})

test('§23: empate no encaixe é desempatado pela vaga mais recente', () => {
  const antiga = opp('antiga', 'good', 70, [], new Date('2026-01-01'))
  const nova = opp('nova', 'good', 70, [], new Date('2026-08-01'))
  const result = curate([antiga, nova], { preferences: prefs({ maxPerDigest: 2 }) })
  assert.equal(result.selected[0].jobId, 'nova')
})

test('§23: o resumo segue o formato do exemplo do prompt', () => {
  const summary = summarizeDigest([
    opp('a', 'strong'),
    opp('b', 'strong'),
    opp('c', 'good'),
    opp('d', 'partial'),
  ])

  assert.equal(summary.total, 4)
  assert.equal(summary.strong, 2)
  assert.equal(summary.good, 1)
  assert.equal(summary.partial, 1)
  assert.equal(summary.headline, 'Encontramos 4 oportunidades relevantes.')
})

test('§23: uma oportunidade só fala no singular', () => {
  assert.equal(summarizeDigest([opp('a', 'strong')]).headline, 'Encontramos 1 oportunidade relevante.')
})

test('o teto nunca zera o envio', () => {
  // Um teto mal configurado não pode transformar alerta em silêncio silencioso.
  const result = curate([opp('a', 'strong')], { preferences: prefs({ maxPerDigest: 0 }) })
  assert.equal(result.shouldAlert, true)
  assert.equal(result.selected.length, 1)
})

/* ================================================================== *
 * §29 / §42 — Métricas
 * ================================================================== */

test('a taxa de alerta baixa é saudável, não um defeito', () => {
  // A métrica principal não é "quantas vagas encontramos" — é "quantas
  // oportunidades úteis". Taxa alta pode significar filtro frouxo.
  const results = [
    curate(Array.from({ length: 20 }, (_, i) => opp(`a${i}`, i < 2 ? 'strong' : 'weak')), {
      preferences: prefs(),
    }),
  ]
  const metrics = radarMetrics({ collected: 500, eligible: 60, results })

  assert.equal(metrics.evaluated, 20)
  assert.equal(metrics.alerted, 2)
  assert.equal(metrics.alertRate, 0.1)
})

test('rodadas silenciosas são contadas', () => {
  const results = [
    curate([], { preferences: prefs() }),
    curate([opp('a', 'weak')], { preferences: prefs() }),
    curate([opp('b', 'strong')], { preferences: prefs() }),
  ]
  const metrics = radarMetrics({ collected: 10, eligible: 3, results })
  assert.equal(metrics.silenced, 2)
  assert.equal(metrics.alerted, 1)
})
