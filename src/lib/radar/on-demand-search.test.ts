import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ON_DEMAND_SEARCH_WEEKLY_LIMIT,
  onDemandSearchAvailability,
  onDemandSearchDecision,
  onDemandWeeklyLimit,
} from './on-demand-search'

test('primeiro uso abre uma janela nova e libera', () => {
  const now = new Date('2026-09-07T12:00:00Z')
  const d = onDemandSearchDecision({ count: 0, windowStart: null }, now)
  assert.equal(d.allowed, true)
  assert.equal(d.remaining, ON_DEMAND_SEARCH_WEEKLY_LIMIT - 1)
  assert.equal(d.nextCount, 1)
  assert.equal(d.windowStart.getTime(), now.getTime())
  assert.equal(d.resetAt.getTime(), now.getTime() + 7 * 24 * 60 * 60 * 1000)
})

test('libera até o limite semanal, dentro da mesma janela', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date('2026-09-03T00:00:00Z')

  const second = onDemandSearchDecision({ count: 1, windowStart }, now)
  assert.equal(second.allowed, true)
  assert.equal(second.remaining, 0)
  assert.equal(second.nextCount, 2)
  assert.equal(second.windowStart.getTime(), windowStart.getTime())

  const third = onDemandSearchDecision({ count: 2, windowStart }, now)
  assert.equal(third.allowed, false)
})

test('o limite semanal é 2, com ou sem passe', () => {
  assert.equal(ON_DEMAND_SEARCH_WEEKLY_LIMIT, 2)
  assert.equal(onDemandWeeklyLimit(true), 2)
  assert.equal(onDemandWeeklyLimit(false), 2)
})

test('BLOQUEIA a busca além do limite dentro da mesma janela', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date('2026-09-03T00:00:00Z')

  const d = onDemandSearchDecision({ count: ON_DEMAND_SEARCH_WEEKLY_LIMIT, windowStart }, now)
  assert.equal(d.allowed, false)
  assert.equal(d.remaining, 0)
  assert.equal(d.nextCount, undefined)
  // A janela não muda por uma tentativa negada.
  assert.equal(d.windowStart.getTime(), windowStart.getTime())
})

test('a janela vira sozinha depois de 7 dias, mesmo com o limite esgotado', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date('2026-09-08T00:00:01Z')

  const d = onDemandSearchDecision({ count: ON_DEMAND_SEARCH_WEEKLY_LIMIT, windowStart }, now)
  assert.equal(d.allowed, true)
  assert.equal(d.remaining, ON_DEMAND_SEARCH_WEEKLY_LIMIT - 1)
  assert.equal(d.nextCount, 1)
  // Janela nova começa agora, não continua a antiga.
  assert.equal(d.windowStart.getTime(), now.getTime())
})

test('exatamente 7 dias ainda conta como expirada (janela é [start, start+7d))', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date(windowStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  const d = onDemandSearchDecision({ count: ON_DEMAND_SEARCH_WEEKLY_LIMIT, windowStart }, now)
  assert.equal(d.allowed, true)
  assert.equal(d.windowStart.getTime(), now.getTime())
})

test('onDemandSearchAvailability não consome — só lê', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date('2026-09-03T00:00:00Z')

  const first = onDemandSearchAvailability({ count: 1, windowStart }, now)
  const second = onDemandSearchAvailability({ count: 1, windowStart }, now)
  assert.equal(first.available, ON_DEMAND_SEARCH_WEEKLY_LIMIT - 1)
  assert.equal(second.available, ON_DEMAND_SEARCH_WEEKLY_LIMIT - 1)
})

test('onDemandSearchAvailability chega a zero no limite, e nunca fica negativa', () => {
  const windowStart = new Date('2026-09-01T00:00:00Z')
  const now = new Date('2026-09-03T00:00:00Z')

  const d = onDemandSearchAvailability({ count: ON_DEMAND_SEARCH_WEEKLY_LIMIT, windowStart }, now)
  assert.equal(d.available, 0)
})
