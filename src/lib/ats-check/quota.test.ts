import test from 'node:test'
import assert from 'node:assert/strict'
import { ATS_FREE_CHECKS_PER_WINDOW, ipKeyFor, ipMetaNeedle, quotaSubject } from './quota'

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

test('quotaSubject: todo o /64 de um IPv6 conta como um endereço só', () => {
  assert.equal(quotaSubject('2001:db8:1:2::1'), '2001:db8:1:2::/64')
  assert.equal(quotaSubject('2001:db8:1:2:ffff:ffff:ffff:ffff'), '2001:db8:1:2::/64')
  assert.equal(quotaSubject('2001:0DB8:0001:0002:0:0:0:9'), '2001:db8:1:2::/64')
  assert.equal(quotaSubject('[2001:db8::1]'), '2001:db8:0:0::/64')
  assert.equal(quotaSubject('fe80::1%eth0'), 'fe80:0:0:0::/64')
  assert.notEqual(quotaSubject('2001:db8:1:2::1'), quotaSubject('2001:db8:1:3::1'))
})

test('quotaSubject: IPv4 e IPv4 mapeado em IPv6 contam como o próprio IPv4', () => {
  assert.equal(quotaSubject('203.0.113.7'), '203.0.113.7')
  assert.equal(quotaSubject('::ffff:203.0.113.7'), '203.0.113.7')
  assert.equal(quotaSubject('desconhecido'), 'desconhecido')
})

test('ipKeyFor: dois endereços do mesmo /64 dividem a mesma cota', () => {
  assert.equal(ipKeyFor('2001:db8:1:2::1'), ipKeyFor('2001:db8:1:2::abcd'))
  assert.notEqual(ipKeyFor('203.0.113.7'), ipKeyFor('203.0.113.8'))
})
