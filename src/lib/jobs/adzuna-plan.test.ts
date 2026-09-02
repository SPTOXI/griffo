import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ADZUNA_COUNTRIES,
  adzunaCovers,
  adzunaRoundInputs,
  estimatedRequests,
  planAdzunaRound,
} from './adzuna-plan'

const AGORA = new Date('2026-08-18T12:00:00Z')
const hAtras = (h: number) => new Date(AGORA.getTime() - h * 3600_000)

test('a cobertura é a VERIFICADA, e nada além dela', () => {
  // Testados um a um contra `/v1/api/jobs/{country}/search/1`: os dez originais
  // em 18/08/2026, a Itália em 25/08/2026, os oito novos em 02/09/2026.
  // PT, JP, RU, IE, SE, NO, DK, FI e AE responderam 404 UNSUPPORTED_COUNTRY.
  // Supor que a Adzuna os atende faria a fonte falhar toda rodada para quem
  // mora lá, gastando cota e enchendo o log.
  assert.ok(adzunaCovers('br'))
  assert.ok(adzunaCovers('DE'))
  assert.ok(adzunaCovers('it'))
  assert.ok(!adzunaCovers('pt'))
  assert.ok(!adzunaCovers('jp'))
  assert.ok(!adzunaCovers(null))
  assert.equal(ADZUNA_COUNTRIES.length, 19)
})

test('os oito países verificados em 02/09/2026 estão cobertos', () => {
  // Cada um respondeu 200 com 50 resultados. Nenhum entrou por lista de
  // terceiro: entrou porque a requisição foi feita e a resposta foi lida.
  for (const country of ['nz', 'za', 'pl', 'nl', 'at', 'be', 'sg', 'ch']) {
    assert.ok(adzunaCovers(country), `${country} deveria estar coberto`)
  }
})

test('RÚSSIA E IRLANDA NÃO ENTRAM POR REPUTAÇÃO', () => {
  // Listas antigas da Adzuna citam a Rússia; a Irlanda aparece em material de
  // divulgação. Em 02/09/2026 as duas responderam 404 UNSUPPORTED_COUNTRY com
  // as credenciais desta instalação. É o caso que justifica a regra: "a
  // documentação diz" não substitui a requisição.
  assert.ok(!adzunaCovers('ru'))
  assert.ok(!adzunaCovers('ie'))
  assert.ok(!adzunaCovers('se'))
  assert.ok(!adzunaCovers('ae'))
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

test('PAÍS SEM TERMO VIRA VARREDURA DE BASE, NÃO FICA DE FORA', () => {
  // Era o contrário até 02/09/2026, e a regra antiga tinha um motivo bom: não
  // gastar cota de quem procura em busca que ninguém pediu. O que ela produziu
  // foi outro: com os quatro perfis existentes, todos no Brasil, a Adzuna
  // rodava em UM país e os outros dez da lista nunca eram tocados.
  const plans = planAdzunaRound([
    { country: 'pl', terms: [], lastCollectionAt: null },
    { country: 'us', terms: ['a'], lastCollectionAt: hAtras(5) },
  ])
  assert.deepEqual(plans.map((p) => p.country), ['pl', 'us'])
  assert.equal(plans[0].baseline, true)
  assert.deepEqual(plans[0].terms, [])
  assert.equal(plans[1].baseline, false)
})

test('a fila cobre todos os países, não só onde alguém mora', () => {
  const inputs = adzunaRoundInputs(new Map([['BR', ['analista']]]), new Map())
  assert.equal(inputs.length, ADZUNA_COUNTRIES.length)
  assert.deepEqual(inputs.find((i) => i.country === 'br')!.terms, ['analista'])
  assert.deepEqual(inputs.find((i) => i.country === 'pl')!.terms, [])
})

test('a fila lê a última coleta de cada país, para o rodízio funcionar', () => {
  const inputs = adzunaRoundInputs(new Map(), new Map([['de', hAtras(30)]]))
  assert.deepEqual(inputs.find((i) => i.country === 'de')!.lastCollectionAt, hAtras(30))
  assert.equal(inputs.find((i) => i.country === 'nz')!.lastCollectionAt, null)
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

test('A CONTA DO MÊS CABE NA COTA, NO PIOR CASO', () => {
  // 2.500 requisições/mês é o teto da camada gratuita, ~83/dia. Este teste
  // trava o consumo da rodada: quem subir um dos limites vai ver aqui, antes
  // de descobrir pela fatura.
  //
  // Pior caso da configuração de 02/09/2026: os OITO países da rodada todos com
  // cinco termos, uma página por termo — 40/rodada, 1.240/mês (~50% da cota).
  // A folga (1.260) fica bem acima da reserva de 20% (500) para a busca sob
  // demanda, que ainda não foi implementada.
  const inputs = ADZUNA_COUNTRIES.map((c) => ({
    country: c,
    terms: ['a', 'b', 'c', 'd', 'e', 'f'],
    lastCollectionAt: null,
  }))

  const plans = planAdzunaRound(inputs, { maxCountries: 8, maxTermsPerCountry: 5 })
  const porRodada = estimatedRequests(plans, 1)

  assert.equal(porRodada, 40)
  assert.ok(porRodada * 31 < 2500, 'a rodada diária sozinha não pode consumir a cota do mês')
  assert.ok(2500 - porRodada * 31 >= 500, 'a folga para a busca sob demanda não pode ficar abaixo da reserva')
})

test('a conta do caso REAL de hoje é bem menor que a do pior caso', () => {
  // Um país com termos declarados (Brasil, o único com perfis) e sete de
  // varredura de base: 5 + 7 = 12 por rodada, 372/mês. É o número que a rodada
  // vai gastar de verdade enquanto não houver usuário fora do Brasil.
  const plans = planAdzunaRound(
    adzunaRoundInputs(new Map([['BR', ['a', 'b', 'c', 'd', 'e']]]), new Map()),
    { maxCountries: 8, maxTermsPerCountry: 5 }
  )
  assert.equal(estimatedRequests(plans, 1), 12)
})

test('a varredura de base custa uma requisição, não zero', () => {
  // Contá-la como zero faria a rodada declarar um consumo menor que o real —
  // e `recordQuotaUsage` grava o que a rodada declara.
  const plans = planAdzunaRound(
    [{ country: 'pl', terms: [], lastCollectionAt: null }],
    { maxCountries: 8 }
  )
  assert.equal(estimatedRequests(plans, 1), 1)
  assert.equal(estimatedRequests(plans, 2), 2)
})

test('todos os países são cobertos em poucas rodadas', () => {
  // O rodízio não pode deixar um mercado esperando indefinidamente. Com
  // dezenove países e oito por rodada, três rodadas bastam.
  const estado = new Map<string, Date | null>(ADZUNA_COUNTRIES.map((c) => [c, null]))
  const vistos = new Set<string>()

  for (let rodada = 0; rodada < 3; rodada++) {
    const plans = planAdzunaRound(
      ADZUNA_COUNTRIES.map((c) => ({ country: c, terms: ['a'], lastCollectionAt: estado.get(c)! })),
      { maxCountries: 8 }
    )
    for (const plan of plans) {
      vistos.add(plan.country)
      estado.set(plan.country, new Date(AGORA.getTime() + rodada * 86_400_000))
    }
  }

  assert.equal(vistos.size, ADZUNA_COUNTRIES.length, 'em três rodadas todos os países devem ter vez')
})

test('país que não rodou continua na frente da fila', () => {
  // Se o relógio da invocação acabar antes de a Adzuna chegar num país, ele
  // não é coletado e seu `lastCollectionAt` continua nulo — o rodízio o põe na
  // frente na rodada seguinte. Estourar o tempo atrasa; não perde ninguém.
  const estado = new Map<string, Date | null>(ADZUNA_COUNTRIES.map((c) => [c, null]))
  const primeira = planAdzunaRound(
    ADZUNA_COUNTRIES.map((c) => ({ country: c, terms: [], lastCollectionAt: estado.get(c)! })),
    { maxCountries: 8 }
  )
  // Só metade chegou a rodar: a outra metade fica sem data.
  for (const plan of primeira.slice(0, 4)) estado.set(plan.country, AGORA)

  const segunda = planAdzunaRound(
    ADZUNA_COUNTRIES.map((c) => ({ country: c, terms: [], lastCollectionAt: estado.get(c)! })),
    { maxCountries: 8 }
  )
  const naoRodaram = primeira.slice(4).map((p) => p.country)
  for (const country of naoRodaram) {
    assert.ok(segunda.some((p) => p.country === country), `${country} deveria voltar na rodada seguinte`)
  }
})
