import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTINENTS,
  CONTINENT_BY_COUNTRY,
  COUNTRIES_PER_CONTINENT,
  continentOf,
  type Continent,
} from './continents'
import { COUNTRIES } from '../market/countries'

/**
 * As travas da tabela de continentes (§2.59).
 *
 * O que está sendo protegido aqui é o DENOMINADOR. A distribuição de fases de
 * um continente só é honesta se o total de países daquele continente estiver
 * certo — e "certo" quer dizer preso à lista do produto, não a um número
 * escrito à mão que ninguém revisita. Um país que entrasse em
 * `lib/market/countries.ts` sem entrar aqui sairia do denominador em silêncio,
 * e a tela passaria a dizer "30 de 44" quando já são 45.
 *
 * Mesma disciplina de `connectors/iso3.test.ts`: as duas listas presas uma à
 * outra, nos dois sentidos.
 */

// ---------------------------------------------------------------------------
// Sem lacuna e sem sobra — a tabela é bijetora com a lista do produto
// ---------------------------------------------------------------------------

test('TODO país da lista do produto tem continente', () => {
  const semContinente = COUNTRIES.filter((c) => !(c.code in CONTINENT_BY_COUNTRY)).map((c) => c.code)
  assert.deepEqual(semContinente, [], 'país do produto sem continente atribuído')
})

test('nenhum código da tabela é desconhecido da lista do produto', () => {
  const conhecidos = new Set(COUNTRIES.map((c) => c.code))
  const orfaos = Object.keys(CONTINENT_BY_COUNTRY).filter((code) => !conhecidos.has(code))
  assert.deepEqual(orfaos, [], 'continente atribuído a país que o produto não conhece')
})

test('a tabela tem exatamente um continente por país — nenhum código repetido', () => {
  // Um objeto literal com a mesma chave duas vezes compila e silenciosamente
  // fica com a última. O que se pode conferir é o efeito: um país, uma entrada,
  // e o total batendo com o tamanho da lista.
  const codigos = Object.keys(CONTINENT_BY_COUNTRY)
  assert.equal(new Set(codigos).size, codigos.length)
  assert.equal(codigos.length, COUNTRIES.length)
})

test('todo valor da tabela é um dos sete continentes povoados', () => {
  const validos = new Set<string>(CONTINENTS)
  for (const [code, continent] of Object.entries(CONTINENT_BY_COUNTRY)) {
    assert.match(code, /^[A-Z]{2}$/)
    assert.ok(validos.has(continent), `${code} aponta para continente inválido: ${continent}`)
  }
  // A Antártida não entra: nenhum país fica nela, e um continente sempre vazio
  // seria uma linha na tela afirmando cobertura zero de nada.
  assert.equal(CONTINENTS.length, 7)
  assert.equal(new Set(CONTINENTS).size, 7)
})

// ---------------------------------------------------------------------------
// A regra declarada: UN M49, aplicada igual para todos
// ---------------------------------------------------------------------------

test('os países transcontinentais seguem o M49, e não um palpite caso a caso', () => {
  // Cada um destes foi conferido contra dois conjuntos independentes que
  // publicam o M49 da UNSD — ver o cabeçalho de `continents.ts`.
  assert.equal(continentOf('RU'), 'EU', 'o M49 põe a Rússia inteira na Europa')
  assert.equal(continentOf('TR'), 'AS')
  assert.equal(continentOf('KZ'), 'AS')
  assert.equal(continentOf('GE'), 'AS')
  assert.equal(continentOf('AM'), 'AS')
  assert.equal(continentOf('AZ'), 'AS')
  // Chipre é membro da União Europeia; o M49 é geográfico e o põe na Ásia.
  assert.equal(continentOf('CY'), 'AS')
  // O Sinai não muda a região M49 do Egito.
  assert.equal(continentOf('EG'), 'AF')
  // O esquema CIA/GeoNames põe Timor-Leste na Oceania; o M49, na Ásia.
  assert.equal(continentOf('TL'), 'AS')
})

test('as Américas se dividem pela região intermediária do M49, não por gosto', () => {
  // *South America* é a única região intermediária que vira América do Sul.
  assert.equal(continentOf('BR'), 'SA')
  assert.equal(continentOf('GY'), 'SA')
  assert.equal(continentOf('SR'), 'SA')
  // *Northern America* vira América do Norte — só Canadá e EUA na lista do
  // produto (Bermudas, Groenlândia e Saint-Pierre-et-Miquelon não estão nela).
  assert.equal(continentOf('US'), 'NA')
  assert.equal(continentOf('CA'), 'NA')
  // *Central America* e *Caribbean* vão para América Central e Caribe — desde
  // o §2.65, e não mais junto de Northern America (ver o cabeçalho).
  assert.equal(continentOf('MX'), 'CA')
  assert.equal(continentOf('PA'), 'CA')
  assert.equal(continentOf('CU'), 'CA')
  assert.equal(continentOf('PR'), 'CA')
  assert.equal(continentOf('TT'), 'CA')
})

test('código desconhecido devolve null em vez de cair num continente qualquer', () => {
  // Chutar um continente colocaria o país numa contagem que o denominador não
  // previu, e o total daquele continente deixaria de fechar.
  assert.equal(continentOf('XX'), null)
  assert.equal(continentOf('ZZ'), null)
  assert.equal(continentOf('BRA'), null)
  assert.equal(continentOf(''), null)
  assert.equal(continentOf(null), null)
  assert.equal(continentOf(undefined), null)
})

test('aceita espaço em volta e caixa baixa, como o resto do produto', () => {
  assert.equal(continentOf(' br '), 'SA')
  assert.equal(continentOf('de'), 'EU')
})

// ---------------------------------------------------------------------------
// O denominador
// ---------------------------------------------------------------------------

test('a contagem por continente soma a lista inteira do produto', () => {
  const soma = CONTINENTS.reduce((acc, c) => acc + COUNTRIES_PER_CONTINENT[c], 0)
  assert.equal(soma, COUNTRIES.length)
  assert.equal(soma, 173)
})

test('o denominador é calculado da lista, e não escrito à mão', () => {
  // Recontado aqui por outro caminho: se alguém trocar `COUNTRIES_PER_CONTINENT`
  // por uma constante literal, este teste passa a falhar no primeiro país novo.
  const esperado: Record<Continent, number> = { AF: 0, AS: 0, CA: 0, EU: 0, NA: 0, OC: 0, SA: 0 }
  for (const country of COUNTRIES) {
    const continent = continentOf(country.code)
    assert.ok(continent, `${country.code} sem continente`)
    esperado[continent!]++
  }
  assert.deepEqual(COUNTRIES_PER_CONTINENT, esperado)
})

test('nenhum continente povoado fica com zero país na lista do produto', () => {
  for (const continent of CONTINENTS) {
    assert.ok(
      COUNTRIES_PER_CONTINENT[continent] > 0,
      `${continent} sem nenhum país — denominador zero divide a tela por zero`
    )
  }
})
