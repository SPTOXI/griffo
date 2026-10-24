import { test } from 'node:test'
import assert from 'node:assert/strict'
import { areaFromUrl, areaToUrl, buildCityIndex, cityName, slugify } from './city-index'

test('cityName corta estado/país e recusa o que não é cidade', () => {
  assert.equal(cityName('São Paulo, São Paulo, Brazil'), 'São Paulo')
  assert.equal(cityName('Todo Brasil'), null)
  assert.equal(cityName('Brasil', new Set(['brasil'])), null)
  assert.equal(cityName('Remote - US'), null)
  assert.equal(cityName('Hybrid'), null)
  assert.equal(slugify('東京'), '東京')
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

test('cityName pega o primeiro lugar e descarta remoto em qualquer posição', () => {
  assert.equal(cityName('San Francisco, CA | New York City, NY'), 'San Francisco')
  assert.equal(cityName('New York, NY (HQ)'), 'New York')
  assert.equal(cityName('US - Remote'), null)
  assert.equal(cityName('Remote-Friendly, United States'), null)
  assert.equal(cityName('US', new Set(['us'])), null)
})

test('buildCityIndex junta nomes da mesma cidade em outra língua', () => {
  const idx = buildCityIndex([
    { city: 'München', category: null, count: 41 },
    { city: 'Munich', category: null, count: 30 },
    { city: 'New York City', category: null, count: 75 },
    { city: 'New York', category: null, count: 194 },
  ])
  assert.deepEqual(idx.map((c) => [c.slug, c.name, c.total]), [
    ['new-york', 'New York', 269],
    ['munchen', 'München', 71],
  ])
})

test('cadastro de cidades: junta bairro sem roubar o nome, esconde o que não é cidade', async () => {
  const { citySpellings } = await import('./city-index')
  const rows = [
    { city: 'Berlin', category: null, count: 192 },
    { city: 'Mitte', category: null, count: 14 },
    { city: 'Innenstadt', category: null, count: 14 },
    { city: 'Berlim', category: null, count: 1 },
  ]
  const rules = new Map([
    ['mitte', { rawSlug: 'mitte', kind: 'alias' as const, canonicalSlug: 'berlin' }],
    ['innenstadt', { rawSlug: 'innenstadt', kind: 'ignore' as const }],
    ['berlin', { rawSlug: 'berlin', kind: 'city' as const, displayName: 'Berlin' }],
  ])
  const idx = buildCityIndex(rows, new Set(), rules)
  assert.deepEqual(idx.map((c) => [c.slug, c.name, c.total]), [
    ['berlin', 'Berlin', 206],
    ['berlim', 'Berlim', 1],
  ])
  // A fila mostra primeiro o que falta revisar.
  const queue = citySpellings(rows, new Set(), rules)
  assert.equal(queue[0].rawSlug, 'berlim')
  assert.equal(queue[0].rule, null)
})
