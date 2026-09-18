import test from 'node:test'
import assert from 'node:assert/strict'
import type { OverallFit } from '../matching/compatibility'
import {
  BAND_ORDER,
  calibrate,
  MEANINGFUL_GAP,
  SAMPLE_FLOOR,
  type ApplicationOutcome,
  type CalibrationEntry,
} from './calibration'

/** n candidaturas de uma faixa com o mesmo desfecho. */
function many(band: OverallFit, outcome: ApplicationOutcome, n: number): CalibrationEntry[] {
  return Array.from({ length: n }, () => ({ band, outcome }))
}

function bandOf(c: ReturnType<typeof calibrate>, band: OverallFit) {
  return c.bands.find((b) => b.band === band)!
}

test('sem candidatura nenhuma: quatro faixas vazias e veredito insuficiente', () => {
  const c = calibrate([])
  assert.deepEqual(
    c.bands.map((b) => b.band),
    [...BAND_ORDER]
  )
  assert.equal(c.verdict, 'insufficient')
  assert.equal(c.totalResolved, 0)
  assert.equal(c.totalInFlight, 0)
  for (const b of c.bands) assert.equal(b.rate, null)
})

test('a saída sai em BAND_ORDER, seja qual for a ordem da entrada', () => {
  const c = calibrate([
    ...many('strong', 'offer', 1),
    ...many('weak', 'rejected', 1),
    ...many('good', 'interview', 1),
    ...many('partial', 'no_response', 1),
  ])
  assert.deepEqual(
    c.bands.map((b) => b.band),
    ['weak', 'partial', 'good', 'strong']
  )
})

/* --- Regra 1: em andamento não é ponto de dado ---------------------------- */

test('candidatura em andamento não entra no denominador nem no numerador', () => {
  const c = calibrate([
    ...many('strong', 'in_flight', 20),
    ...many('strong', 'interview', 3),
    ...many('strong', 'no_response', 3),
  ])
  const strong = bandOf(c, 'strong')
  assert.equal(strong.resolved, 6, 'só as 6 resolvidas contam')
  assert.equal(strong.inFlight, 20)
  assert.equal(strong.advanced, 3)
  assert.equal(strong.rate, 0.5, '3 de 6, e não 3 de 26')
})

test('faixa só com candidaturas em andamento não tem taxa', () => {
  const c = calibrate(many('good', 'in_flight', 50))
  const good = bandOf(c, 'good')
  assert.equal(good.rate, null)
  assert.equal(good.resolved, 0)
  assert.equal(good.inFlight, 50)
  assert.equal(c.totalResolved, 0)
  assert.equal(c.totalInFlight, 50)
})

test('em andamento nunca vira fracasso: a taxa não cai ao adicioná-las', () => {
  const resolved = [...many('strong', 'interview', 3), ...many('strong', 'no_response', 3)]
  const before = bandOf(calibrate(resolved), 'strong').rate
  const after = bandOf(calibrate([...resolved, ...many('strong', 'in_flight', 40)]), 'strong').rate
  assert.equal(before, after)
})

/* --- Regra 2: piso amostral ----------------------------------------------- */

test('abaixo do piso a taxa é null, mesmo com os números na mão', () => {
  const c = calibrate([
    ...many('strong', 'interview', 2),
    ...many('strong', 'rejected', 1),
  ])
  const strong = bandOf(c, 'strong')
  assert.equal(strong.resolved, 3)
  assert.equal(strong.advanced, 2)
  assert.equal(strong.rate, null, '"2 de 3" não é 67%')
})

test('a taxa nasce exatamente no piso, não antes', () => {
  const justUnder = calibrate(many('good', 'interview', SAMPLE_FLOOR - 1))
  assert.equal(bandOf(justUnder, 'good').rate, null)

  const atFloor = calibrate(many('good', 'interview', SAMPLE_FLOOR))
  assert.equal(bandOf(atFloor, 'good').rate, 1)
})

/* --- Veredito ------------------------------------------------------------- */

test('uma faixa só acima do piso não dá veredito: falta com o que comparar', () => {
  const c = calibrate([
    ...many('strong', 'interview', SAMPLE_FLOOR),
    ...many('weak', 'rejected', 2),
  ])
  assert.equal(bandOf(c, 'strong').rate, 1)
  assert.equal(bandOf(c, 'weak').rate, null)
  assert.equal(c.verdict, 'insufficient')
})

test('faixa alta convertendo mais, por margem grande: predictive', () => {
  const c = calibrate([
    ...many('strong', 'interview', 5),
    ...many('strong', 'no_response', 5),
    ...many('weak', 'no_response', 10),
  ])
  assert.equal(bandOf(c, 'strong').rate, 0.5)
  assert.equal(bandOf(c, 'weak').rate, 0)
  assert.equal(c.verdict, 'predictive')
})

test('faixas convertendo parecido: flat', () => {
  const c = calibrate([
    ...many('strong', 'interview', 3),
    ...many('strong', 'no_response', 7),
    ...many('weak', 'interview', 3),
    ...many('weak', 'no_response', 7),
  ])
  assert.equal(bandOf(c, 'strong').rate, 0.3)
  assert.equal(bandOf(c, 'weak').rate, 0.3)
  assert.equal(c.verdict, 'flat')
})

// Não é erro de conta: é o achado que mais vale a pena ver, porque diz que a
// nota está apontando para o lado errado NA BUSCA DESTA PESSOA.
test('faixa alta convertendo menos que a baixa: inverted', () => {
  const c = calibrate([
    ...many('strong', 'no_response', 10),
    ...many('weak', 'interview', 6),
    ...many('weak', 'no_response', 4),
  ])
  assert.equal(bandOf(c, 'strong').rate, 0)
  assert.equal(bandOf(c, 'weak').rate, 0.6)
  assert.equal(c.verdict, 'inverted')
})

test('diferença menor que a margem não vira veredito forte', () => {
  // 40% contra 30%: 10 pontos, abaixo dos 15 exigidos.
  const c = calibrate([
    ...many('strong', 'interview', 4),
    ...many('strong', 'no_response', 6),
    ...many('weak', 'interview', 3),
    ...many('weak', 'no_response', 7),
  ])
  assert.ok(bandOf(c, 'strong').rate! - bandOf(c, 'weak').rate! < MEANINGFUL_GAP)
  assert.equal(c.verdict, 'flat')
})

test('o veredito compara os extremos com amostra, ignorando faixa sem amostra no meio', () => {
  const c = calibrate([
    ...many('strong', 'interview', 5),
    ...many('strong', 'no_response', 5),
    ...many('good', 'interview', 1), // abaixo do piso: fica fora da comparação
    ...many('weak', 'no_response', 10),
  ])
  assert.equal(bandOf(c, 'good').rate, null)
  assert.equal(c.verdict, 'predictive')
})

/* --- Semântica do desfecho ------------------------------------------------ */

// O desfecho é o estágio MAIS LONGE alcançado, não o veredito final: quem foi
// entrevistado e depois recusado grava `interview`.
test('interview e offer contam como tração; rejected e no_response não', () => {
  const c = calibrate([
    ...many('good', 'interview', 3),
    ...many('good', 'offer', 2),
    ...many('good', 'rejected', 3),
    ...many('good', 'no_response', 2),
  ])
  const good = bandOf(c, 'good')
  assert.equal(good.resolved, 10)
  assert.equal(good.advanced, 5)
  assert.equal(good.rate, 0.5)
})

test('totais somam todas as faixas', () => {
  const c = calibrate([
    ...many('strong', 'offer', 2),
    ...many('good', 'in_flight', 3),
    ...many('weak', 'rejected', 4),
  ])
  assert.equal(c.totalResolved, 6)
  assert.equal(c.totalInFlight, 3)
})

test('o módulo não devolve taxa fora de [0,1]', () => {
  const c = calibrate([
    ...many('strong', 'offer', 5),
    ...many('weak', 'no_response', 5),
  ])
  for (const b of c.bands) {
    if (b.rate === null) continue
    assert.ok(b.rate >= 0 && b.rate <= 1, `taxa fora de faixa: ${b.rate}`)
  }
})
