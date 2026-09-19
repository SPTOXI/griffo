import test from 'node:test'
import assert from 'node:assert/strict'
import { PURGE_CLOSED_AFTER_DAYS, STALE_AFTER_DAYS, daysAgo, staleDecision } from './lifecycle'

const AGORA = new Date('2026-08-18T12:00:00Z')
const opts = { now: AGORA }

/** Fonte saudável: coletou com sucesso hoje. */
const fonteSaudavel = AGORA

test('vaga vista recentemente não é encerrada', () => {
  const d = staleDecision(
    { lastSeenAt: daysAgo(AGORA, 3), closedAt: null, sourceLastSuccessfulCollection: fonteSaudavel },
    opts
  )
  assert.equal(d.close, false)
})

test('vaga que sumiu há mais que a janela é encerrada', () => {
  const d = staleDecision(
    {
      lastSeenAt: daysAgo(AGORA, STALE_AFTER_DAYS + 1),
      closedAt: null,
      sourceLastSuccessfulCollection: fonteSaudavel,
    },
    opts
  )
  assert.equal(d.close, true)
  assert.match(d.reason!, new RegExp(String(STALE_AFTER_DAYS)))
})

test('bem no limite da janela ainda NÃO fecha', () => {
  // Fechar no limite exato transformaria arredondamento de relógio em
  // encerramento de vaga.
  const d = staleDecision(
    {
      lastSeenAt: daysAgo(AGORA, STALE_AFTER_DAYS),
      closedAt: null,
      sourceLastSuccessfulCollection: fonteSaudavel,
    },
    opts
  )
  assert.equal(d.close, false)
})

test('FONTE QUEBRADA NÃO FECHA VAGA — é o §12 em câmera lenta', () => {
  // Se a fonte não coleta há mais tempo que a janela, a vaga não reaparecer é
  // falha nossa. Fechar aqui apagaria vaga viva porque a COLETA falhou.
  const d = staleDecision(
    {
      lastSeenAt: daysAgo(AGORA, 200),
      closedAt: null,
      sourceLastSuccessfulCollection: daysAgo(AGORA, 100),
    },
    opts
  )
  assert.equal(d.close, false)
  assert.match(d.explanation, /falha nossa|coleta confiável/i)
})

test('fonte que nunca coletou com sucesso não fecha vaga nenhuma', () => {
  const d = staleDecision(
    { lastSeenAt: daysAgo(AGORA, 200), closedAt: null, sourceLastSuccessfulCollection: null },
    opts
  )
  assert.equal(d.close, false)
})

test('vaga já encerrada não é encerrada de novo', () => {
  const d = staleDecision(
    {
      lastSeenAt: daysAgo(AGORA, 200),
      closedAt: daysAgo(AGORA, 10),
      sourceLastSuccessfulCollection: fonteSaudavel,
    },
    opts
  )
  assert.equal(d.close, false)
  assert.match(d.explanation, /já estava encerrada/i)
})

test('a decisão sempre explica, inclusive quando não fecha', () => {
  // "Por que aquela vaga velha continua aparecendo" é pergunta que alguém vai
  // fazer, e a resposta tem que estar no código.
  const casos = [
    { lastSeenAt: daysAgo(AGORA, 1), closedAt: null, sourceLastSuccessfulCollection: fonteSaudavel },
    { lastSeenAt: daysAgo(AGORA, 200), closedAt: null, sourceLastSuccessfulCollection: null },
    { lastSeenAt: daysAgo(AGORA, 200), closedAt: AGORA, sourceLastSuccessfulCollection: fonteSaudavel },
  ]
  for (const caso of casos) {
    assert.ok(staleDecision(caso, opts).explanation.length > 10)
  }
})

test('a janela de encerramento é bem menor que a de expurgo', () => {
  // A vaga precisa sobreviver ao arrependimento: enquanto a linha existe, um
  // fechamento errado se desfaz sozinho quando ela reaparece numa coleta.
  assert.ok(PURGE_CLOSED_AFTER_DAYS > STALE_AFTER_DAYS)
})

test('a janela é longa o bastante para não punir instabilidade', () => {
  // Uma vaga real reaparece em toda coleta. Janela curta transformaria uma
  // semana ruim de uma fonte em encerramento em massa.
  assert.ok(STALE_AFTER_DAYS >= 30)
})

test('daysAgo anda para trás, não para frente', () => {
  assert.ok(daysAgo(AGORA, 5) < AGORA)
  assert.equal(daysAgo(AGORA, 0).getTime(), AGORA.getTime())
})
