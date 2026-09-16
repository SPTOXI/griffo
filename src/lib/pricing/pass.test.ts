import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extendPass, hasActivePass, passDaysLeft } from './pass'

const now = new Date('2026-09-17T12:00:00Z')
const day = 24 * 60 * 60 * 1000

test('sem passe, ou plano antigo, não há passe ativo', () => {
  assert.equal(hasActivePass(null, now), false)
  assert.equal(hasActivePass({ plan: 'free', planEndsAt: null }, now), false)
  assert.equal(hasActivePass({ plan: 'annual', planEndsAt: new Date(now.getTime() + 30 * day) }, now), false)
})

test('passe vencido não conta', () => {
  assert.equal(hasActivePass({ plan: 'quarterly', planEndsAt: new Date(now.getTime() - 1) }, now), false)
  assert.equal(passDaysLeft({ plan: 'quarterly', planEndsAt: new Date(now.getTime() - 1) }, now), 0)
})

test('primeira compra: 90 dias a partir de agora', () => {
  const { endsAt } = extendPass({ plan: 'free' }, now)
  assert.equal(endsAt.getTime(), now.getTime() + 90 * day)
})

test('recompra com passe ativo soma ao fim, sem perder dias', () => {
  const current = { plan: 'quarterly', planEndsAt: new Date(now.getTime() + 10 * day) }
  const { endsAt } = extendPass(current, now)
  assert.equal(endsAt.getTime(), now.getTime() + 100 * day)
  assert.equal(passDaysLeft(current, now), 10)
})

test('recompra com passe vencido recomeça de agora', () => {
  const { endsAt } = extendPass({ plan: 'quarterly', planEndsAt: new Date(now.getTime() - 5 * day) }, now)
  assert.equal(endsAt.getTime(), now.getTime() + 90 * day)
})
