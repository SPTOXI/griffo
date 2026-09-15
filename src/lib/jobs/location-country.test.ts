import test from 'node:test'
import assert from 'node:assert/strict'
import { inferCountryFromLocation } from './location-country'

test('cidade americana isolada resolve US', () => {
  assert.equal(inferCountryFromLocation('San Francisco', null), 'US')
  assert.equal(inferCountryFromLocation('New York City', null), 'US')
  assert.equal(inferCountryFromLocation('Seattle', null), 'US')
})

test('cidade + sigla de estado americano resolve US pela vírgula', () => {
  assert.equal(inferCountryFromLocation('San Francisco, CA', null), 'US')
  assert.equal(inferCountryFromLocation('Menlo Park, CA', null), 'US')
})

test('múltiplas localizações separadas por | usam só o primeiro trecho', () => {
  assert.equal(inferCountryFromLocation('San Francisco, CA | New York City, NY', null), 'US')
  assert.equal(
    inferCountryFromLocation('San Francisco, CA | New York City, NY | Seattle, WA', null),
    'US'
  )
})

test('nome de país por extenso, em inglês ou português', () => {
  assert.equal(inferCountryFromLocation('Brazil (São Paulo - Hybrid)', null), 'BR')
  assert.equal(inferCountryFromLocation('Brasil', null), 'BR')
  assert.equal(inferCountryFromLocation('São Paulo, São Paulo, Brazil', null), 'BR')
  assert.equal(inferCountryFromLocation('Toronto, Canada', null), 'CA')
  assert.equal(inferCountryFromLocation('Dublin, Ireland', null), 'IE')
})

test('cidade brasileira sem "Brazil" no texto ainda resolve BR', () => {
  assert.equal(inferCountryFromLocation('Curitiba, Paraná, Brazil', null), 'BR')
  assert.equal(inferCountryFromLocation('Salvador, Bahia', null), 'BR')
})

test('cidade isolada sem sigla nem país resolve pelo nome da cidade', () => {
  assert.equal(inferCountryFromLocation('Singapore', null), 'SG')
  assert.equal(inferCountryFromLocation('Dublin', null), 'IE')
  assert.equal(inferCountryFromLocation('Bengaluru', null), 'IN')
  assert.equal(inferCountryFromLocation('Tokyo, Japan', null), 'JP')
})

test('"US - Remote" e variações de remoto com país resolvem o país', () => {
  assert.equal(inferCountryFromLocation('US - Remote', null), 'US')
  assert.equal(inferCountryFromLocation('Remote (US)', null), 'US')
  assert.equal(inferCountryFromLocation('Remote-Friendly, United States', null), 'US')
})

test('região preenche quando a cidade não basta', () => {
  assert.equal(inferCountryFromLocation(null, 'Brazil'), 'BR')
  assert.equal(inferCountryFromLocation('', 'Ontario, Canada'), 'CA')
})

test('texto sem nenhum sinal reconhecível devolve null, nunca um palpite', () => {
  assert.equal(inferCountryFromLocation('Cambridge', null), null)
  assert.equal(inferCountryFromLocation('N/A', null), null)
  assert.equal(inferCountryFromLocation(null, null), null)
  assert.equal(inferCountryFromLocation('', ''), null)
})

test('não confunde substring dentro de outra palavra (fronteira de palavra)', () => {
  // "us" não pode casar dentro de palavras que o contêm.
  assert.equal(inferCountryFromLocation('Focus Studios', null), null)
  assert.equal(inferCountryFromLocation('Housewares District', null), null)
})
