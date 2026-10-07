import test from 'node:test'
import assert from 'node:assert/strict'
import { langAlternates, langCanonical } from './lang-alternates'

const BASE = 'https://griffo.work/ats/taleo'
const LANGS = ['en', 'de', 'es']

test('?lang= válido gera canonical autorreferente', () => {
  assert.equal(langCanonical(BASE, 'de', LANGS), `${BASE}?lang=de`)
  assert.equal(langCanonical(BASE, ' DE ', LANGS), `${BASE}?lang=de`)
})

test('sem parâmetro ou com idioma inexistente, canonical limpo', () => {
  assert.equal(langCanonical(BASE, undefined, LANGS), BASE)
  assert.equal(langCanonical(BASE, 'xx', LANGS), BASE)
})

test('hreflang lista cada idioma no seu ?lang= e x-default no limpo', () => {
  const a = langAlternates(BASE, 'es', LANGS, (l) => `${l}-XX`)
  assert.equal(a.canonical, `${BASE}?lang=es`)
  assert.equal(a.languages['de-XX'], `${BASE}?lang=de`)
  assert.equal(a.languages['x-default'], BASE)
  // O canonical de uma variante tem de estar no próprio hreflang.
  assert.ok(Object.values(a.languages).includes(a.canonical))
})
