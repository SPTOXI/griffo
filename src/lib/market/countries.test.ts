import test from 'node:test'
import assert from 'node:assert/strict'
import { countryCodeFromName, isKnownCountry } from './countries'
import { marketForCountry } from './index'

/**
 * Como a Adzuna ESCREVE cada país, lido da resposta real em 02/09/2026.
 *
 * Cada par saiu do `location.area[0]` observado nos 50 resultados de uma busca
 * naquele país — não de tabela de idiomas nem de suposição. É a lista que o
 * teste abaixo trava.
 */
const AREA0_OBSERVADO: [string, string][] = [
  ['Brasil', 'BR'],
  ['US', 'US'],
  ['Canada', 'CA'],
  ['UK', 'GB'],
  ['España', 'ES'],
  ['México', 'MX'],
  ['Deutschland', 'DE'],
  ['France', 'FR'],
  ['India', 'IN'],
  ['Australia', 'AU'],
  ['Italia', 'IT'],
  ['New Zealand', 'NZ'],
  ['South Africa', 'ZA'],
  ['Polska', 'PL'],
  ['Nederland', 'NL'],
  ['Österreich', 'AT'],
  ['België', 'BE'],
  ['Singapore', 'SG'],
  ['Schweiz', 'CH'],
]

test('TODO PAÍS DA ADZUNA É RECONHECIDO PELO NOME QUE ELA MANDA', () => {
  // O defeito que isto fecha: a Adzuna devolve o país no idioma do mercado, e a
  // tabela só tinha os nomes em português mais três apelidos. "UK", "Canada",
  // "España", "Deutschland", "France", "India" e "Australia" caíam em `null` —
  // vaga sem país, portanto sem mercado, portanto vaga de lugar nenhum para o
  // filtro duro. Enquanto só o Brasil era varrido ("Brasil" casa), não aparecia.
  for (const [nome, esperado] of AREA0_OBSERVADO) {
    assert.equal(countryCodeFromName(nome), esperado, `"${nome}" deveria virar ${esperado}`)
  }
})

test('o país reconhecido resolve para um mercado, que é o ponto', () => {
  // Reconhecer o nome só serve se o resto do produto puder usar o código.
  for (const [nome, esperado] of AREA0_OBSERVADO) {
    const code = countryCodeFromName(nome)!
    assert.ok(isKnownCountry(code), `${code} deveria estar no catálogo de países`)
    assert.ok(marketForCountry(code).id, `${esperado} deveria resolver algum mercado`)
  }
})

test('"UK" não é ISO2, e por isso precisava da tabela de nomes', () => {
  // O atalho de duas letras aceita a forma e consulta a tabela ISO, onde "UK"
  // não existe — o ISO do Reino Unido é "GB". A ordem antiga desistia ali sem
  // nunca perguntar à tabela de nomes.
  assert.equal(countryCodeFromName('UK'), 'GB')
  assert.equal(countryCodeFromName('GB'), 'GB')
  assert.equal(countryCodeFromName('United Kingdom'), 'GB')
})

test('o reconhecimento não depende de caixa nem de espaço em volta', () => {
  assert.equal(countryCodeFromName('  polska  '), 'PL')
  assert.equal(countryCodeFromName('ÖSTERREICH'), 'AT')
})

test('nome desconhecido continua nulo, nunca palpite', () => {
  // Um país errado é pior que país nenhum: o filtro duro age sobre ele.
  assert.equal(countryCodeFromName('Terra Média'), null)
  assert.equal(countryCodeFromName('ZZ'), null)
  assert.equal(countryCodeFromName(''), null)
  assert.equal(countryCodeFromName(null), null)
  assert.equal(countryCodeFromName(undefined), null)
  assert.equal(countryCodeFromName(42), null)
  // Bélgica e Suíça são multilíngues; só as formas OBSERVADAS estão na tabela.
  // Estas não foram observadas, e este arquivo não registra suposição.
  assert.equal(countryCodeFromName('Belgique'), null)
  assert.equal(countryCodeFromName('Suisse'), null)
})
