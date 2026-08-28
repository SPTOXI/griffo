import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DICTIONARIES,
  LANGUAGES,
  detectLanguageFromCountry,
  localeForLang,
  type Language,
  type TranslationDictionary,
} from './index'

function extractKeyPaths(obj: Record<string, any>, prefix = ''): string[] {
  let paths: string[] = []
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      paths.push(...extractKeyPaths(val, fullPath))
    } else {
      paths.push(fullPath)
    }
  }
  return paths.sort()
}

test('todos os idiomas suportados estão declarados em LANGUAGES', () => {
  assert.deepEqual(LANGUAGES, ['pt', 'en', 'es'])
  assert.equal(Object.keys(DICTIONARIES).length, 3)
})

test('paridade estrutural estrita entre dicionários pt, en e es', () => {
  const ptKeys = extractKeyPaths(DICTIONARIES.pt)
  const enKeys = extractKeyPaths(DICTIONARIES.en)
  const esKeys = extractKeyPaths(DICTIONARIES.es)

  assert.deepEqual(
    enKeys,
    ptKeys,
    'Dicionário EN difere estruturalmente do dicionário PT'
  )
  assert.deepEqual(
    esKeys,
    ptKeys,
    'Dicionário ES difere estruturalmente do dicionário PT'
  )
})

test('nenhuma chave de tradução possui string vazia', () => {
  for (const lang of LANGUAGES) {
    const dict = DICTIONARIES[lang]
    const keys = extractKeyPaths(dict)
    for (const path of keys) {
      const parts = path.split('.')
      let cur: any = dict
      for (const part of parts) {
        cur = cur[part]
      }
      if (Array.isArray(cur)) {
        assert.ok(cur.length > 0, `Array vazio no idioma '${lang}' na chave '${path}'`)
        for (const item of cur) {
          assert.ok(
            typeof item === 'string' && item.trim().length > 0,
            `Item vazio no idioma '${lang}' na chave '${path}'`
          )
        }
      } else {
        assert.ok(
          typeof cur === 'string' && cur.trim().length > 0,
          `Tradução vazia ou inválida no idioma '${lang}' na chave '${path}'`
        )
      }
    }
  }
})

test('detecção de idioma por país funciona corretamente', () => {
  assert.equal(detectLanguageFromCountry('BR'), 'pt')
  assert.equal(detectLanguageFromCountry('PT'), 'pt')
  assert.equal(detectLanguageFromCountry('AO'), 'pt')
  assert.equal(detectLanguageFromCountry('MZ'), 'pt')

  assert.equal(detectLanguageFromCountry('ES'), 'es')
  assert.equal(detectLanguageFromCountry('MX'), 'es')
  assert.equal(detectLanguageFromCountry('AR'), 'es')
  assert.equal(detectLanguageFromCountry('CO'), 'es')
  assert.equal(detectLanguageFromCountry('CL'), 'es')

  assert.equal(detectLanguageFromCountry('US'), 'en')
  assert.equal(detectLanguageFromCountry('GB'), 'en')
  assert.equal(detectLanguageFromCountry('CA'), 'en')
  assert.equal(detectLanguageFromCountry('DE'), 'en')
  assert.equal(detectLanguageFromCountry(null), 'pt')
  assert.equal(detectLanguageFromCountry(undefined), 'pt')
})

test('mapeamento de locale para cada idioma', () => {
  assert.equal(localeForLang('pt'), 'pt-BR')
  assert.equal(localeForLang('en'), 'en-US')
  assert.equal(localeForLang('es'), 'es-ES')
})
