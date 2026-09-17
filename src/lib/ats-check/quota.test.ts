import test from 'node:test'
import assert from 'node:assert/strict'
import { ATS_FREE_CHECKS_PER_WINDOW, ipKeyFor, ipMetaNeedle } from './quota'

test('um teste grátis por pessoa', () => {
  assert.equal(ATS_FREE_CHECKS_PER_WINDOW, 1)
})

test('hash de IP é estável, não revela o IP e casa com o JSON gravado', () => {
  const k = ipKeyFor('200.100.50.25')
  assert.equal(k, ipKeyFor('200.100.50.25'))
  assert.notEqual(k, ipKeyFor('200.100.50.26'))
  assert.ok(!k.includes('200'))
  assert.equal(k.length, 32)
  assert.ok(JSON.stringify({ ipKey: k, score: 80 }).includes(ipMetaNeedle(k)))
})
