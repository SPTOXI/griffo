import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DELETE_AFTER_PUBLISHED_DAYS,
  isTooOldToImport,
  FRESH_MAX_AGE_DAYS,
  PURGE_CLOSED_AFTER_DAYS,
  STALE_AFTER_DAYS,
  daysAgo,
  agedJobPurgeWhere,
  freshOpenJobWhere,
  staleDecision,
} from './lifecycle'

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

/* --- Frescor na leitura e expurgo por idade ------------------------------- */

/** O `gte` que o filtro monta, para as asserções lerem sem repetir a conta. */
function freshCutoff(now: Date) {
  const where = freshOpenJobWhere(now)
  const clause = where.OR[1] as { publishedAt: { gte: Date } }
  return clause.publishedAt.gte
}

test('o filtro de frescor exige vaga aberta', () => {
  assert.equal(freshOpenJobWhere(AGORA).closedAt, null)
})

test('o corte de frescor fica na janela declarada', () => {
  assert.equal(freshCutoff(AGORA).getTime(), daysAgo(AGORA, FRESH_MAX_AGE_DAYS).getTime())
})

// A regra do types.ts: "eliminar por dado ausente transforma silêncio em
// rejeição". Vaga sem data não é vaga velha, é vaga de idade desconhecida.
test('vaga sem data de publicação NUNCA é filtrada por frescor', () => {
  const where = freshOpenJobWhere(AGORA)
  assert.deepEqual(where.OR[0], { publishedAt: null })
})

test('o filtro é um OR de dois casos: sem data, ou dentro da janela', () => {
  const where = freshOpenJobWhere(AGORA)
  assert.equal(where.OR.length, 2)
})

// O expurgo é irreversível, então precisa de folga sobre o filtro: a vaga some
// da vista bem antes de sumir do banco, e dá tempo de voltar atrás.
test('o prazo de apagamento é maior que o de frescor', () => {
  assert.ok(
    DELETE_AFTER_PUBLISHED_DAYS > FRESH_MAX_AGE_DAYS,
    `apagamento (${DELETE_AFTER_PUBLISHED_DAYS}) precisa dar folga sobre frescor (${FRESH_MAX_AGE_DAYS})`
  )
})

test('a folga entre sumir da vista e sumir do banco é de pelo menos um mês', () => {
  assert.ok(DELETE_AFTER_PUBLISHED_DAYS - FRESH_MAX_AGE_DAYS >= 30)
})

// Frescor NÃO escreve closedAt: foi escrever idade nesse campo que causou os
// dois defeitos do PR #71 (apagamento de histórico e oscilação).
test('o filtro de frescor não propõe escrita nenhuma — só leitura', () => {
  const where = freshOpenJobWhere(AGORA) as Record<string, unknown>
  assert.deepEqual(Object.keys(where).sort(), ['OR', 'closedAt'])
})

/* --- A trava do expurgo --------------------------------------------------- */

// Decisão do operador (mesmo critério do JobBase): passou do prazo, a vaga
// sai, esteja a fonte ainda listando ou não.
test('IDADE BASTA — o expurgo não exige mais vaga encerrada', () => {
  assert.equal('closedAt' in agedJobPurgeWhere(AGORA), false)
})

// O laço que a exigência de `closedAt` evitava agora é fechado na importação.
// Se estas duas deixarem de usar o mesmo prazo, a vaga apagada volta na coleta
// seguinte com id novo, `RadarAlert` cai por cascata, e a pessoa é avisada de
// novo de algo que já viu — o §15 em laço, todo dia.
test('O QUE O EXPURGO APAGA, A IMPORTAÇÃO RECUSA — mesmo prazo nas duas pontas', () => {
  const umDiaAlemDoCorte = daysAgo(AGORA, DELETE_AFTER_PUBLISHED_DAYS + 1)
  const corte = agedJobPurgeWhere(AGORA).publishedAt.lt as Date

  assert.ok(umDiaAlemDoCorte < corte, 'o expurgo apagaria esta vaga')
  assert.equal(isTooOldToImport(umDiaAlemDoCorte, AGORA), true, 'e a importação precisa recusá-la')
})

test('vaga dentro do prazo entra normalmente', () => {
  assert.equal(isTooOldToImport(daysAgo(AGORA, DELETE_AFTER_PUBLISHED_DAYS - 1), AGORA), false)
})

test('bem no limite do prazo a vaga ainda entra', () => {
  // Mesma convenção do `staleDecision`: o limite exato não elimina.
  assert.equal(isTooOldToImport(daysAgo(AGORA, DELETE_AFTER_PUBLISHED_DAYS), AGORA), false)
})

test('SEM DATA DE PUBLICAÇÃO A VAGA ENTRA — idade desconhecida não é idade demais', () => {
  assert.equal(isTooOldToImport(null, AGORA), false)
  assert.equal(isTooOldToImport(undefined, AGORA), false)
})

test('a importação recusa exatamente o que o expurgo apaga, e nada além', () => {
  // A vaga velha que a fonte ainda lista É apagada agora (era o que o
  // `closedAt` impedia), então ela TEM que ser recusada na volta.
  const where = agedJobPurgeWhere(AGORA)
  assert.equal(where.publishedAt.lt.getTime(), daysAgo(AGORA, DELETE_AFTER_PUBLISHED_DAYS).getTime())
})

test('o expurgo nunca apaga vaga sem data de publicação', () => {
  assert.equal(agedJobPurgeWhere(AGORA).publishedAt.not, null)
})

test('o corte do expurgo fica na janela declarada', () => {
  assert.equal(
    agedJobPurgeWhere(AGORA).publishedAt.lt.getTime(),
    daysAgo(AGORA, DELETE_AFTER_PUBLISHED_DAYS).getTime()
  )
})

// O expurgo é mais restritivo que o filtro: tudo que ele apaga já estava
// invisível havia pelo menos 60 dias. Se esta relação inverter, passaríamos a
// apagar vaga que ainda aparece para alguém.
test('o expurgo é sempre mais restritivo que o filtro de frescor', () => {
  const purga = agedJobPurgeWhere(AGORA).publishedAt.lt
  const frescor = (freshOpenJobWhere(AGORA).OR[1] as { publishedAt: { gte: Date } }).publishedAt.gte
  assert.ok(purga < frescor, 'o corte de apagamento precisa ser mais antigo que o de frescor')
})
