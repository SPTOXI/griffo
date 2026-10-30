import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '../i18n/types'
import { REFUND_COPY } from './copy'
import { dueAtFor, eligibilityOf, isDeliveryFailure, needsReminder, timeLeft, windowEndsAt } from './rules'

const H = 60 * 60 * 1000
const D = 24 * H
const now = new Date('2026-10-30T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms)

test('até 7 dias com a análise não usada: dentro da regra', () => {
  assert.equal(eligibilityOf({ purchasedAt: ago(6 * D), quantity: 1, balance: 1, hasFailedDelivery: false }, now), 'unused')
  assert.equal(eligibilityOf({ purchasedAt: ago(7 * D), quantity: 1, balance: 1, hasFailedDelivery: false }, now), 'unused')
})

test('depois dos 7 dias, ou com a análise usada: fora da regra', () => {
  assert.equal(eligibilityOf({ purchasedAt: ago(7 * D + H), quantity: 1, balance: 1, hasFailedDelivery: false }, now), 'outside_rules')
  assert.equal(eligibilityOf({ purchasedAt: ago(D), quantity: 1, balance: 0, hasFailedDelivery: false }, now), 'outside_rules')
  // Recolocação com uma das cinco já usada.
  assert.equal(eligibilityOf({ purchasedAt: ago(D), quantity: 5, balance: 4, hasFailedDelivery: false }, now), 'outside_rules')
})

test('análise paga e não entregue vale dentro dos 7 dias, e nada vale depois deles', () => {
  assert.equal(eligibilityOf({ purchasedAt: ago(3 * D), quantity: 1, balance: 0, hasFailedDelivery: true }, now), 'failure')
  assert.equal(eligibilityOf({ purchasedAt: ago(7 * D + 1000), quantity: 1, balance: 0, hasFailedDelivery: true }, now), 'outside_rules')
  assert.equal(eligibilityOf({ purchasedAt: ago(7 * D + 1000), quantity: 1, balance: 1, hasFailedDelivery: false }, now), 'outside_rules')
})

test('falha de entrega: job falhou, ou destravado há mais de 2 h sem análise', () => {
  assert.equal(isDeliveryFailure({ unlockedAt: ago(10 * 60 * 1000), analysisReady: false, jobFailed: true }, now), true)
  assert.equal(isDeliveryFailure({ unlockedAt: ago(3 * H), analysisReady: false, jobFailed: false }, now), true)
  assert.equal(isDeliveryFailure({ unlockedAt: ago(H), analysisReady: false, jobFailed: false }, now), false)
  assert.equal(isDeliveryFailure({ unlockedAt: ago(3 * H), analysisReady: true, jobFailed: true }, now), false)
  assert.equal(isDeliveryFailure({ unlockedAt: null, analysisReady: false, jobFailed: true }, now), false)
})

test('prazo de 24 h, lembrete a 4 h do fim e janela de 7 dias', () => {
  assert.equal(dueAtFor(now).getTime() - now.getTime(), 24 * H)
  assert.equal(windowEndsAt(now).getTime() - now.getTime(), 7 * D)
  const due = new Date(now.getTime() + 3 * H)
  assert.equal(needsReminder({ status: 'pending', dueAt: due, remindedAt: null }, now), true)
  assert.equal(needsReminder({ status: 'pending', dueAt: new Date(now.getTime() + 5 * H), remindedAt: null }, now), false)
  assert.equal(needsReminder({ status: 'pending', dueAt: due, remindedAt: now }, now), false)
  assert.equal(needsReminder({ status: 'refunded', dueAt: due, remindedAt: null }, now), false)
  assert.deepEqual(timeLeft(new Date(now.getTime() + 90 * 60 * 1000), now), { overdue: false, hours: 1, minutes: 30 })
  assert.equal(timeLeft(ago(H), now).overdue, true)
})

test('os 12 idiomas do reembolso têm as mesmas chaves e marcadores', () => {
  const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  const source = REFUND_COPY.pt
  for (const lang of LANGUAGES) {
    const target = REFUND_COPY[lang]
    assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort(), lang)
    for (const [k, v] of Object.entries(source)) {
      const t = target[k as keyof typeof target]
      assert.ok(t.trim().length > 0, `${lang}.${k} vazio`)
      assert.deepEqual(marks(t), marks(v), `${lang}.${k} marcadores`)
    }
  }
})

test('o texto da regra cita os 7 dias e não promete dinheiro na conta em 24 h', () => {
  // A Stripe devolve na hora; o tempo até a fatura é do banco do cliente.
  for (const lang of LANGUAGES) {
    assert.match(REFUND_COPY[lang].policy, /24/, lang)
    assert.match(REFUND_COPY[lang].policy, /7/, lang)
    assert.match(REFUND_COPY[lang].requestHow, /\{email\}/, lang)
  }
  assert.match(REFUND_COPY.pt.policy, /iniciamos a devolução/)
})
