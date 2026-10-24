import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MIN_PERCENTILE_SAMPLE, percentileBelow, scoreFromMeta } from './social-proof'

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
