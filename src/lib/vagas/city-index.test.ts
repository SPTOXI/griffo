import { test } from 'node:test'
import assert from 'node:assert/strict'
import { areaFromUrl, areaToUrl, buildCityIndex, cityName, slugify } from './city-index'

test('cityName corta estado/país e recusa o que não é cidade', () => {
  assert.equal(cityName('São Paulo, São Paulo, Brazil'), 'São Paulo')
  assert.equal(cityName('Todo Brasil'), null)
  assert.equal(cityName('Brasil'), null)
  assert.equal(cityName(null), null)
  assert.equal(slugify('Ribeirão Preto'), 'ribeirao-preto')
})

test('área ida e volta entre banco e URL', () => {
  assert.equal(areaToUrl('recursos_humanos'), 'recursos-humanos')
  assert.equal(areaFromUrl('recursos-humanos'), 'recursos_humanos')
  assert.equal(areaFromUrl('nao-existe'), null)
})

test('buildCityIndex junta grafias da mesma cidade', () => {
  const idx = buildCityIndex([
    { city: 'São Paulo', category: 'ti', count: 10 },
    { city: 'São Paulo, Estado de São Paulo', category: 'vendas', count: 3 },
    { city: 'Sao Paulo', category: null, count: 1 },
    { city: 'Campinas', category: 'ti', count: 5 },
    { city: 'Todo Brasil', category: 'ti', count: 99 },
    { city: 'Campinas', category: 'inventada', count: 2 },
  ])
  assert.deepEqual(idx.map((c) => [c.slug, c.name, c.total]), [
    ['sao-paulo', 'São Paulo', 14],
    ['campinas', 'Campinas', 7],
  ])
  assert.equal(idx[0].rawCities.length, 3)
  assert.deepEqual(idx[0].areas, [{ area: 'ti', count: 10 }, { area: 'vendas', count: 3 }])
  assert.deepEqual(idx[1].areas, [{ area: 'ti', count: 5 }])
})

test('buildCityIndex prefere a grafia acentuada', () => {
  const idx = buildCityIndex([
    { city: 'Brasilia', category: null, count: 9 },
    { city: 'Brasília', category: null, count: 4 },
  ])
  assert.equal(idx[0].name, 'Brasília')
})
