import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPIRED_AFTER_PUBLISHED_DAYS,
  PURGE_CLOSED_AFTER_DAYS,
  STALE_AFTER_DAYS,
  daysAgo,
  expiredByAgeDecision,
  staleDecision,
} from './lifecycle'
import { EVERGREEN_AFTER_DAYS } from './legitimacy'

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

/* --- Encerramento por idade de publicação --------------------------------- */

test('vaga publicada dentro da janela não é encerrada por idade', () => {
  const d = expiredByAgeDecision(
    { publishedAt: daysAgo(AGORA, EXPIRED_AFTER_PUBLISHED_DAYS - 1), closedAt: null },
    opts
  )
  assert.equal(d.close, false)
})

test('vaga publicada além da janela é encerrada, ainda que a fonte siga listando', () => {
  const d = expiredByAgeDecision(
    { publishedAt: daysAgo(AGORA, EXPIRED_AFTER_PUBLISHED_DAYS + 1), closedAt: null },
    opts
  )
  assert.equal(d.close, true)
  assert.match(d.reason!, /mais de 120 dias/)
})

// A borda é exclusiva, igual à de `staleDecision` (`>= cutoff` não fecha):
// exatamente na janela ainda está dentro. As duas decisões precisam concordar
// nisso, senão "45 dias" e "120 dias" passam a significar coisas diferentes.
test('exatamente na janela ainda não fecha — mesma borda do encerramento por ausência', () => {
  const porIdade = expiredByAgeDecision(
    { publishedAt: daysAgo(AGORA, EXPIRED_AFTER_PUBLISHED_DAYS), closedAt: null },
    opts
  )
  assert.equal(porIdade.close, false)

  const porAusencia = staleDecision(
    {
      lastSeenAt: daysAgo(AGORA, STALE_AFTER_DAYS),
      closedAt: null,
      sourceLastSuccessfulCollection: fonteSaudavel,
    },
    opts
  )
  assert.equal(porAusencia.close, false, 'a borda das duas regras é a mesma')
})

// A mesma regra que rege o módulo inteiro: "eliminar por dado ausente
// transforma silêncio em rejeição" (types.ts). Idade desconhecida não é idade
// demais.
test('vaga sem data de publicação NUNCA é encerrada por idade', () => {
  const d = expiredByAgeDecision({ publishedAt: null, closedAt: null }, opts)
  assert.equal(d.close, false)
  assert.match(d.explanation, /não informou data/)
})

test('vaga já encerrada não é reencerrada por idade', () => {
  const d = expiredByAgeDecision(
    { publishedAt: daysAgo(AGORA, 400), closedAt: daysAgo(AGORA, 10) },
    opts
  )
  assert.equal(d.close, false)
})

// Este é o ponto: a trava do §12 desliga o encerramento por ausência quando a
// fonte para de coletar, e é aí que o acervo congelaria. Idade é fato da vaga,
// não da coleta, então continua valendo.
test('idade fecha mesmo quando a fonte está parada — é o fundo falso da trava do §12', () => {
  const velhaEParada = {
    lastSeenAt: daysAgo(AGORA, 200),
    closedAt: null,
    sourceLastSuccessfulCollection: daysAgo(AGORA, 200),
  }
  assert.equal(staleDecision(velhaEParada, opts).close, false, 'ausência não fecha: trava do §12')

  const porIdade = expiredByAgeDecision({ publishedAt: daysAgo(AGORA, 200), closedAt: null }, opts)
  assert.equal(porIdade.close, true, 'idade fecha assim mesmo')
})

// Sem isto, mudar um dos dois números desligaria o sinal `evergreen` em
// silêncio: vaga na idade de expirar já está fechada, e o sinal só olha aberta.
test('o limiar de anúncio perpétuo fica abaixo do de expiração por idade', () => {
  assert.ok(
    EVERGREEN_AFTER_DAYS < EXPIRED_AFTER_PUBLISHED_DAYS,
    `evergreen (${EVERGREEN_AFTER_DAYS}) precisa ser menor que expiração (${EXPIRED_AFTER_PUBLISHED_DAYS})`
  )
})
