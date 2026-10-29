import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MIN_PERCENTILE_SAMPLE, percentileBelow, pickSocialProof, scoreFromMeta, thousandsLabel } from './social-proof'

test('percentil: só com amostra suficiente, e conta quem ficou abaixo', () => {
  assert.equal(percentileBelow([10, 20, 30], 25), null)
  const scores = Array.from({ length: 100 }, (_, i) => i) // 0..99
  assert.equal(percentileBelow(scores, 50), 50)
  assert.equal(percentileBelow(scores, 0), 0)
  assert.equal(percentileBelow(scores, 100), 100)
  assert.ok(MIN_PERCENTILE_SAMPLE >= 30)
})

test('nota do meta: só número válido', () => {
  assert.equal(scoreFromMeta('{"score":72}'), 72)
  assert.equal(scoreFromMeta('{"score":"72"}'), null)
  assert.equal(scoreFromMeta('lixo'), null)
  assert.equal(scoreFromMeta(null), null)
})

test('selo: vagas analisadas até os currículos passarem do corte; depois, currículos', () => {
  assert.deepEqual(pickSocialProof(112, 31_304), { kind: 'jobs', n: 31_000 })
  assert.deepEqual(pickSocialProof(1_250, 31_304), { kind: 'resumes', n: 1_250 })
  assert.equal(pickSocialProof(112, 400), null)
})

test('número do selo de vagas como cada língua diz', () => {
  assert.equal(thousandsLabel('pt', 31_000, 'pt-BR'), '31 mil')
  assert.equal(thousandsLabel('it', 31_000, 'it-IT'), '31 mila')
  assert.equal(thousandsLabel('en', 31_000, 'en-US'), '31,000')
  assert.equal(thousandsLabel('de', 31_000, 'de-DE'), '31.000')
})
