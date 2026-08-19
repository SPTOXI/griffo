import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ADZUNA_COUNTRIES,
  adzunaCovers,
  estimatedRequests,
  planAdzunaRound,
} from './adzuna-plan'

const AGORA = new Date('2026-08-18T12:00:00Z')
const hAtras = (h: number) => new Date(AGORA.getTime() - h * 3600_000)

test('a cobertura é a VERIFICADA, e Portugal e Japão não estão nela', () => {
  // Testados um a um em 18/08/2026: PT e JP responderam 404. Supor que a
  // Adzuna os atende faria a fonte falhar toda rodada para quem mora lá,
  // gastando cota e enchendo o log.
  assert.ok(adzunaCovers('br'))
  assert.ok(adzunaCovers('DE'))
  assert.ok(!adzunaCovers('pt'))
  assert.ok(!adzunaCovers('jp'))
  assert.ok(!adzunaCovers(null))
  assert.equal(ADZUNA_COUNTRIES.length, 10)
})

test('quem nunca foi coletado vem primeiro', () => {
  const plans = planAdzunaRound([
    { country: 'br', terms: ['a'], lastCollectionAt: hAtras(1) },
    { country: 'us', terms: ['b'], lastCollectionAt: null },
  ])
  assert.equal(plans[0].country, 'us')
})

test('entre os já coletados, o que esperou mais vem primeiro', () => {
  const plans = planAdzunaRound([
    { country: 'br', terms: ['a'], lastCollectionAt: hAtras(1) },
    { country: 'us', terms: ['b'], lastCollectionAt: hAtras(50) },
    { country: 'gb', terms: ['c'], lastCollectionAt: hAtras(20) },
  ])
  assert.deepEqual(plans.map((p) => p.country), ['us', 'gb', 'br'])
})

test('a rodada respeita o teto de países', () => {
  const inputs = ADZUNA_COUNTRIES.map((c, i) => ({
    country: c,
    terms: ['x'],
    lastCollectionAt: hAtras(i),
  }))
  assert.equal(planAdzunaRound(inputs, { maxCountries: 4 }).length, 4)
})

test('país sem termo nenhum fica de fora', () => {
  // Gastar requisição numa busca vazia é gastar cota de quem tem o que buscar.
  const plans = planAdzunaRound([
    { country: 'br', terms: [], lastCollectionAt: null },
    { country: 'us', terms: ['a'], lastCollectionAt: hAtras(5) },
  ])
  assert.deepEqual(plans.map((p) => p.country), ['us'])
})

test('país fora da cobertura fica de fora, mesmo com termos', () => {
  const plans = planAdzunaRound([
    { country: 'pt', terms: ['engenheiro'], lastCollectionAt: null },
    { country: 'br', terms: ['analista'], lastCollectionAt: null },
  ])
  assert.deepEqual(plans.map((p) => p.country), ['br'])
})

test('os termos são cortados no teto por país', () => {
  const plans = planAdzunaRound(
    [{ country: 'br', terms: ['a', 'b', 'c', 'd', 'e'], lastCollectionAt: null }],
    { maxTermsPerCountry: 3 }
  )
  assert.equal(plans[0].terms.length, 3)
})

test('o país é normalizado para minúsculo, como a URL espera', () => {
  const plans = planAdzunaRound([{ country: 'BR', terms: ['a'], lastCollectionAt: null }])
  assert.equal(plans[0].country, 'br')
})

test('a rodada é reproduzível quando há empate de data', () => {
  const inputs = [
    { country: 'us', terms: ['a'], lastCollectionAt: null },
    { country: 'br', terms: ['a'], lastCollectionAt: null },
    { country: 'de', terms: ['a'], lastCollectionAt: null },
  ]
  assert.deepEqual(
    planAdzunaRound(inputs).map((p) => p.country),
    planAdzunaRound(inputs).map((p) => p.country)
  )
})

test('A CONTA DO MÊS CABE NA COTA', () => {
  // 2.500 requisições/mês é o teto da camada gratuita, ~83/dia. Este teste
  // trava o consumo da rodada: quem subir um dos três limites vai ver aqui,
  // antes de descobrir pela fatura.
  const inputs = ADZUNA_COUNTRIES.map((c) => ({
    country: c,
    terms: ['a', 'b', 'c', 'd', 'e', 'f'],
    lastCollectionAt: null,
  }))

  const plans = planAdzunaRound(inputs, { maxCountries: 4, maxTermsPerCountry: 3 })
  const porRodada = estimatedRequests(plans, 1)

  assert.equal(porRodada, 12)
  assert.ok(porRodada * 31 < 2500, 'a rodada diária sozinha não pode consumir a cota do mês')
  // E precisa sobrar bastante: o que resta é o que sustenta a busca sob demanda.
  assert.ok(porRodada * 31 < 500, 'a folga para a busca sob demanda encolheu demais')
})

test('todos os países são cobertos em poucas rodadas', () => {
  // O rodízio não pode deixar um mercado esperando indefinidamente.
  const estado = new Map<string, Date | null>(ADZUNA_COUNTRIES.map((c) => [c, null]))
  const vistos = new Set<string>()

  for (let rodada = 0; rodada < 3; rodada++) {
    const plans = planAdzunaRound(
      ADZUNA_COUNTRIES.map((c) => ({ country: c, terms: ['a'], lastCollectionAt: estado.get(c)! })),
      { maxCountries: 4 }
    )
    for (const plan of plans) {
      vistos.add(plan.country)
      estado.set(plan.country, new Date(AGORA.getTime() + rodada * 86_400_000))
    }
  }

  assert.equal(vistos.size, ADZUNA_COUNTRIES.length, 'em três rodadas todos os países devem ter vez')
})
