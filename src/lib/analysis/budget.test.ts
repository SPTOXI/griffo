import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXECUTION_RESERVE_MS,
  MAX_EXECUTION_MS,
  MIN_SEGMENT_BUDGET_MS,
  executionDeadline,
  leaseUntil,
  segmentBudgetMs,
} from './budget'

const LEASE_MS = 60_000

test('a concessão nunca passa do teto da plataforma para esta invocação', () => {
  // O caso que criava minutos de tempo morto: a invocação começou em 0 e grava
  // um segmento aos 50s. A renovação ingênua diria "vivo até 110s", mas a
  // plataforma a encerra aos 60s — e o job ficaria 50 segundos com dono
  // fantasma, sem ninguém podendo retomá-lo.
  const start = 0
  const lease = leaseUntil({ now: 50_000, executionStartedAt: start, leaseMs: LEASE_MS })
  assert.equal(lease.getTime(), start + MAX_EXECUTION_MS)
})

test('numa invocação recém-começada a concessão é a normal', () => {
  const start = 1_000_000
  const lease = leaseUntil({ now: start, executionStartedAt: start, leaseMs: LEASE_MS })
  assert.equal(lease.getTime(), start + LEASE_MS)
})

test('a concessão nunca fica no passado por causa do teto', () => {
  // Invocação que passou do teto (não deveria acontecer, mas se acontecer a
  // concessão vencida é a resposta certa: ela LIBERA o job para retomada).
  const start = 0
  const lease = leaseUntil({ now: 80_000, executionStartedAt: start, leaseMs: LEASE_MS })
  assert.ok(lease.getTime() <= start + MAX_EXECUTION_MS)
})

test('o prazo da invocação guarda folga para gravar antes do corte', () => {
  const start = 500
  assert.equal(executionDeadline(start), start + MAX_EXECUTION_MS - EXECUTION_RESERVE_MS)
  assert.ok(executionDeadline(start) < start + MAX_EXECUTION_MS)
})

test('sobrando tempo, o segmento recebe o que resta', () => {
  const deadline = 100_000
  assert.equal(segmentBudgetMs(60_000, deadline), 40_000)
})

test('sem tempo para uma chamada inteira, não se começa o segmento', () => {
  // Começar com pouco tempo não acelera nada: garante interrupção, e o custo
  // da chamada à IA foi pago sem resultado.
  const deadline = 100_000
  assert.equal(segmentBudgetMs(deadline - MIN_SEGMENT_BUDGET_MS + 1, deadline), null)
  assert.equal(segmentBudgetMs(deadline + 5_000, deadline), null)
})

test('exatamente no mínimo o segmento ainda começa', () => {
  const deadline = 100_000
  assert.equal(segmentBudgetMs(deadline - MIN_SEGMENT_BUDGET_MS, deadline), MIN_SEGMENT_BUDGET_MS)
})
