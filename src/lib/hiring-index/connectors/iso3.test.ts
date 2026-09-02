import test from 'node:test'
import assert from 'node:assert/strict'
import { ISO3_TO_ISO2, iso2FromIso3 } from './iso3'
import { COUNTRIES } from '../../market/countries'

test('A TABELA É BIJETORA COM A LISTA DE PAÍSES DO PRODUTO', () => {
  // As duas listas presas uma à outra: nenhum país do produto sem alfa-3, e
  // nenhum alfa-3 apontando para um alfa-2 que a lista não conhece. Sem este
  // teste, tirar um país de `countries.ts` deixaria um par órfão aqui.
  const pairs = Object.entries(ISO3_TO_ISO2)
  const iso2s = pairs.map(([, iso2]) => iso2)

  assert.equal(new Set(iso2s).size, iso2s.length, 'dois alfa-3 apontando para o mesmo alfa-2')
  assert.deepEqual(
    COUNTRIES.map((c) => c.code).filter((code) => !iso2s.includes(code)),
    [],
    'país do produto sem alfa-3'
  )
  assert.deepEqual(
    pairs.filter(([, iso2]) => !COUNTRIES.some((c) => c.code === iso2)),
    [],
    'alfa-3 apontando para país que o produto não conhece'
  )
})

test('as chaves são alfa-3 e os valores são alfa-2', () => {
  for (const [iso3, iso2] of Object.entries(ISO3_TO_ISO2)) {
    assert.match(iso3, /^[A-Z]{3}$/)
    assert.match(iso2, /^[A-Z]{2}$/)
  }
})

test('traduz os códigos que as duas fontes da ONU devolvem de verdade', () => {
  // Amostra da resposta real do ILOSTAT e do CEPALSTAT de 01/09/2026.
  assert.equal(iso2FromIso3('BRA'), 'BR')
  assert.equal(iso2FromIso3('DEU'), 'DE')
  assert.equal(iso2FromIso3('USA'), 'US')
  assert.equal(iso2FromIso3('ZAF'), 'ZA')
  assert.equal(iso2FromIso3('GRC'), 'GR')
  assert.equal(iso2FromIso3('GBR'), 'GB')
  assert.equal(iso2FromIso3('CHE'), 'CH')
  assert.equal(iso2FromIso3('MEX'), 'MX')
})

test('CÓDIGO QUE A TABELA NÃO CONHECE NÃO VIRA PAÍS', () => {
  // Acontece de verdade: o ILOSTAT publica `KOS` (Kosovo), que não é ISO
  // 3166-1, e `PSE`, `GRD`, `LCA` e `SYC`, que são ISO mas não estão na lista
  // do produto. Inventar um alfa-2 para eles gravaria país fantasma.
  assert.equal(iso2FromIso3('KOS'), null)
  assert.equal(iso2FromIso3('PSE'), null)
  assert.equal(iso2FromIso3('GRD'), null)
  assert.equal(iso2FromIso3('LCA'), null)
  assert.equal(iso2FromIso3('SYC'), null)
})

test('entrada que não é alfa-3 devolve nulo em vez de lançar', () => {
  assert.equal(iso2FromIso3('BR'), null)
  assert.equal(iso2FromIso3(''), null)
  assert.equal(iso2FromIso3('   '), null)
  assert.equal(iso2FromIso3('BR4'), null)
  assert.equal(iso2FromIso3(null), null)
  assert.equal(iso2FromIso3(undefined), null)
  assert.equal(iso2FromIso3(42), null)
  assert.equal(iso2FromIso3({ iso3: 'BRA' }), null)
})

test('aceita espaço em volta e caixa baixa', () => {
  assert.equal(iso2FromIso3(' bra '), 'BR')
  assert.equal(iso2FromIso3('deu'), 'DE')
})
