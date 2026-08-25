import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateAgentMaturity,
  calculateSystemMaturity,
  type RawAiLogForMaturity,
  type RawIncidentForMaturity,
} from './agent-maturity'

const NOW = new Date('2026-08-25T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

const log = (patch: Partial<RawAiLogForMaturity> = {}): RawAiLogForMaturity => ({
  taskType: 'profile_extraction',
  status: 'success',
  failoverCount: 0,
  responseTimeMs: 1500,
  qualityScore: null,
  createdAt: daysAgo(5),
  ...patch,
})

test('agrupa por taskType', () => {
  const items = calculateAgentMaturity(
    [log({ taskType: 'profile_extraction' }), log({ taskType: 'cover_letter' }), log({ taskType: 'cover_letter' })],
    NOW
  )
  const pe = items.find((i) => i.taskType === 'profile_extraction')!
  const cl = items.find((i) => i.taskType === 'cover_letter')!
  assert.equal(pe.totalCalls, 1)
  assert.equal(cl.totalCalls, 2)
})

test('sucesso conta success E fallback; só error falha de vez', () => {
  const items = calculateAgentMaturity(
    [
      log({ status: 'success' }),
      log({ status: 'fallback' }),
      log({ status: 'error' }),
      log({ status: 'error' }),
    ],
    NOW
  )
  assert.equal(items[0].successRate, 50)
})

test('taxa de failover conta chamadas com failoverCount > 0', () => {
  const items = calculateAgentMaturity(
    [log({ failoverCount: 0 }), log({ failoverCount: 1 }), log({ failoverCount: 2 }), log({ failoverCount: 0 })],
    NOW
  )
  assert.equal(items[0].failoverRate, 50)
})

test('nota de qualidade só aparece com amostra mínima de julgamentos', () => {
  const poucas = calculateAgentMaturity(
    [...Array.from({ length: 4 }, () => log({ qualityScore: 9 })), log({ qualityScore: null })],
    NOW
  )
  assert.equal(poucas[0].qualitySamples, 4)
  assert.equal(poucas[0].avgQualityScore, null, 'abaixo do mínimo, não vira média')

  const suficientes = calculateAgentMaturity(
    Array.from({ length: 5 }, () => log({ qualityScore: 8 })),
    NOW
  )
  assert.equal(suficientes[0].avgQualityScore, 8)
})

test('maturidade do agente: baixa com pouca amostra ou pouca janela', () => {
  const poucaAmostra = calculateAgentMaturity(Array.from({ length: 10 }, () => log({ createdAt: daysAgo(60) })), NOW)
  assert.equal(poucaAmostra[0].maturity, 'baixa')

  const poucoTempo = calculateAgentMaturity(Array.from({ length: 500 }, () => log({ createdAt: daysAgo(2) })), NOW)
  assert.equal(poucoTempo[0].maturity, 'baixa')
})

test('maturidade do agente: alta com volume e janela de um ciclo mensal', () => {
  const items = calculateAgentMaturity(Array.from({ length: 300 }, () => log({ createdAt: daysAgo(35) })), NOW)
  assert.equal(items[0].maturity, 'alta')
})

test('sistema: taxa de sucesso geral e janela de observação', () => {
  const logs = [
    ...Array.from({ length: 250 }, () => log({ status: 'success', createdAt: daysAgo(35) })),
    ...Array.from({ length: 50 }, () => log({ status: 'error', createdAt: daysAgo(35) })),
  ]
  const sys = calculateSystemMaturity(logs, [], NOW)
  assert.equal(sys.totalCalls, 300)
  assert.equal(sys.overallSuccessRate, pctExpected(250, 300))
  assert.equal(sys.maturity, 'alta')
})

test('incidente grave em aberto rebaixa a maturidade do sistema, mesmo com volume alto', () => {
  const logs = Array.from({ length: 300 }, () => log({ createdAt: daysAgo(35) }))
  const incidentes: RawIncidentForMaturity[] = [
    { severity: 'critical', status: 'investigating', createdAt: daysAgo(1) },
  ]
  const sys = calculateSystemMaturity(logs, incidentes, NOW)
  assert.equal(sys.maturity, 'média', 'era alta pelo volume, mas o incidente grave em aberto rebaixa')
  assert.equal(sys.unresolvedHighSeverity, 1)
})

test('incidente grave já resolvido não rebaixa nada', () => {
  const logs = Array.from({ length: 300 }, () => log({ createdAt: daysAgo(35) }))
  const incidentes: RawIncidentForMaturity[] = [
    { severity: 'critical', status: 'resolved', createdAt: daysAgo(10) },
  ]
  const sys = calculateSystemMaturity(logs, incidentes, NOW)
  assert.equal(sys.maturity, 'alta')
  assert.equal(sys.unresolvedHighSeverity, 0)
})

test('sem incidente nenhum, a taxa de resolução fica nula — não vira 0%', () => {
  const sys = calculateSystemMaturity([log()], [], NOW)
  assert.equal(sys.incidentResolutionRate, null)
})

function pctExpected(n: number, d: number): number {
  return Math.round((n / d) * 1000) / 10
}
