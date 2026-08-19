import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MONTHLY_QUOTA,
  SCHEDULED_RESERVE_RATIO,
  periodKey,
  quotaAlertLevel,
  quotaDecision,
} from './quota'

test('o período é mensal e em UTC', () => {
  // Em fuso local, uma rodada da meia-noite cairia no bucket do mês errado.
  assert.equal(periodKey(new Date('2026-08-19T12:00:00Z')), '2026-08')
  assert.equal(periodKey(new Date('2026-01-01T00:30:00Z')), '2026-01')
  assert.equal(periodKey(new Date('2026-12-31T23:59:59Z')), '2026-12')
})

test('cota folgada libera a busca sob demanda', () => {
  const d = quotaDecision({ provider: 'adzuna', used: 300, limit: 2500 })
  assert.equal(d.verdict, 'ok')
  assert.equal(d.remaining, 2200)
  // Reserva de 20% = 500. Sobram 1.700 para o sob demanda.
  assert.equal(d.remainingForOnDemand, 1700)
})

test('A RESERVA DA RODADA AGENDADA É INTOCÁVEL', () => {
  // A rodada serve todos; a busca sob demanda serve um. Quando aperta, quem
  // cede é o individual.
  const d = quotaDecision({ provider: 'adzuna', used: 2100, limit: 2500 })
  assert.equal(d.verdict, 'reserve_only')
  assert.equal(d.remaining, 400)
  assert.equal(d.remainingForOnDemand, 0)
})

test('cota esgotada é declarada como tal', () => {
  const d = quotaDecision({ provider: 'adzuna', used: 2500, limit: 2500 })
  assert.equal(d.verdict, 'exhausted')
  assert.equal(d.remaining, 0)
})

test('consumo acima do teto não vira sobra negativa', () => {
  const d = quotaDecision({ provider: 'adzuna', used: 9999, limit: 2500 })
  assert.equal(d.remaining, 0)
  assert.equal(d.remainingForOnDemand, 0)
})

test('SEM TETO DECLARADO NÃO É BARRA LIVRE', () => {
  // Confundir "não sabemos o limite" com "não há limite" faria uma fonte sem
  // cota conhecida ser chamada sem freio.
  const d = quotaDecision({ provider: 'gupy', used: 100000, limit: null })
  assert.equal(d.verdict, 'unknown')
  assert.equal(d.remaining, null)
  assert.equal(d.remainingForOnDemand, null)
  assert.match(d.explanation, /orçamento de tempo/)
})

test('a decisão sempre explica', () => {
  const casos = [
    { provider: 'a', used: 0, limit: 100 },
    { provider: 'a', used: 90, limit: 100 },
    { provider: 'a', used: 100, limit: 100 },
    { provider: 'a', used: 0, limit: null },
  ]
  for (const caso of casos) assert.ok(quotaDecision(caso).explanation.length > 20)
})

test('o alerta acende antes de a fonte parar', () => {
  // 90% dá tempo de reagir; 70% dá tempo de decidir sem pressa.
  assert.equal(quotaAlertLevel({ provider: 'a', used: 500, limit: 2500 }), 'none')
  assert.equal(quotaAlertLevel({ provider: 'a', used: 1750, limit: 2500 }), 'attention')
  assert.equal(quotaAlertLevel({ provider: 'a', used: 2250, limit: 2500 }), 'critical')
  assert.equal(quotaAlertLevel({ provider: 'a', used: 2500, limit: 2500 }), 'critical')
})

test('provedor sem teto não acende alerta de cota', () => {
  // Ele pode parar por outro motivo, e é o estado da FONTE que mostra isso.
  assert.equal(quotaAlertLevel({ provider: 'gupy', used: 99999, limit: null }), 'none')
  assert.equal(quotaAlertLevel({ provider: 'x', used: 10, limit: 0 }), 'none')
})

test('a reserva cabe com folga no consumo real da rodada diária', () => {
  // A rodada gasta ~12 por dia, ~372 no mês. A reserva de 20% de 2.500 são 500.
  const reserva = Math.ceil(MONTHLY_QUOTA.adzuna! * SCHEDULED_RESERVE_RATIO)
  assert.ok(reserva >= 12 * 31, 'a reserva precisa cobrir a rodada diária do mês inteiro')
})

test('o teto da Adzuna registrado é o verificado no painel', () => {
  assert.equal(MONTHLY_QUOTA.adzuna, 2500)
})
