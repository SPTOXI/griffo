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

test('todos os 12 idiomas suportados estão declarados em LANGUAGES', () => {
  assert.deepEqual(LANGUAGES, ['pt', 'en', 'es', 'de', 'fr', 'it', 'ja', 'nl', 'sv', 'zh', 'ar', 'ko'])
  assert.equal(Object.keys(DICTIONARIES).length, 12)
})

test('paridade estrutural estrita entre dicionários pt, en, es, de, fr, it, ja, nl, sv, zh, ar, ko', () => {
  const ptKeys = extractKeyPaths(DICTIONARIES.pt)

  for (const lang of LANGUAGES) {
    if (lang === 'pt') continue
    const langKeys = extractKeyPaths(DICTIONARIES[lang])
    assert.deepEqual(
      langKeys,
      ptKeys,
      `Dicionário '${lang.toUpperCase()}' difere estruturalmente do dicionário PT`
    )
  }
})

test('nenhuma chave de tradução possui string vazia em nenhum dos 12 idiomas', () => {
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

function extractPlaceholders(str: string): string[] {
  return [...new Set(str.match(/\{[a-zA-Z0-9_]+\}/g) || [])].sort()
}

test('todo placeholder {xxx} usado no PT existe nos outros 11 idiomas na mesma chave', () => {
  // Achado real (§2.76): reportOf/lastUpdated tinham "{date}" só em pt/en/es —
  // nos outros 9 idiomas a data era descartada em silêncio por `.replace()`
  // não encontrar o token. Isto pega essa classe de bug pra sempre: um
  // idioma pode traduzir a FRASE como quiser, mas não pode perder um
  // placeholder que o valor real (data, contagem, nome) depende de receber.
  // Exceção real, não preguiça: nestas 3 chaves a variante "One" só é escolhida
  // quando a contagem É exatamente 1 (`count === 1 ? xOne : xMany` em
  // professional-profile-view.tsx e radar-view.tsx), e o PT usa "{n}" nelas de
  // forma redundante — escrever o "1" fixo, como de/fr/it/... já faziam, é
  // igualmente correto e não perde informação nenhuma.
  const SINGULAR_LITERAL_OK = new Set([
    'profile.saveSuccessWithRadarOne',
    'profile.fillSuccessOne',
    'radar.runSuccessOne',
  ])

  const ptKeys = extractKeyPaths(DICTIONARIES.pt)
  const mismatches: string[] = []

  for (const path of ptKeys) {
    if (SINGULAR_LITERAL_OK.has(path)) continue
    const parts = path.split('.')
    const ptValue = parts.reduce((cur: any, part) => cur[part], DICTIONARIES.pt)
    if (typeof ptValue !== 'string') continue
    const ptPlaceholders = extractPlaceholders(ptValue)
    if (ptPlaceholders.length === 0) continue

    for (const lang of LANGUAGES) {
      if (lang === 'pt') continue
      const value = parts.reduce((cur: any, part) => cur[part], DICTIONARIES[lang])
      if (typeof value !== 'string') continue
      const placeholders = extractPlaceholders(value)
      if (placeholders.join(',') !== ptPlaceholders.join(',')) {
        mismatches.push(
          `'${lang}'.${path}: esperado [${ptPlaceholders.join(', ')}], achou [${placeholders.join(', ')}]`
        )
      }
    }
  }

  assert.deepEqual(mismatches, [], `Placeholders divergentes:\n${mismatches.join('\n')}`)
})

test('detecção de idioma por país funciona corretamente', () => {
  // Português
  assert.equal(detectLanguageFromCountry('BR'), 'pt')
  assert.equal(detectLanguageFromCountry('PT'), 'pt')
  assert.equal(detectLanguageFromCountry('AO'), 'pt')
  assert.equal(detectLanguageFromCountry('MZ'), 'pt')

  // Espanhol
  assert.equal(detectLanguageFromCountry('ES'), 'es')
  assert.equal(detectLanguageFromCountry('MX'), 'es')
  assert.equal(detectLanguageFromCountry('AR'), 'es')
  assert.equal(detectLanguageFromCountry('CO'), 'es')
  assert.equal(detectLanguageFromCountry('CL'), 'es')

  // Alemão
  assert.equal(detectLanguageFromCountry('DE'), 'de')
  assert.equal(detectLanguageFromCountry('AT'), 'de')
  assert.equal(detectLanguageFromCountry('CH'), 'de')

  // Francês
  assert.equal(detectLanguageFromCountry('FR'), 'fr')
  assert.equal(detectLanguageFromCountry('MC'), 'fr')

  // Italiano
  assert.equal(detectLanguageFromCountry('IT'), 'it')

  // Japonês
  assert.equal(detectLanguageFromCountry('JP'), 'ja')

  // Holandês
  assert.equal(detectLanguageFromCountry('NL'), 'nl')

  // Sueco
  assert.equal(detectLanguageFromCountry('SE'), 'sv')

  // Chinês
  assert.equal(detectLanguageFromCountry('CN'), 'zh')

  // Árabe
  assert.equal(detectLanguageFromCountry('AE'), 'ar')
  assert.equal(detectLanguageFromCountry('SA'), 'ar')

  // Coreano
  assert.equal(detectLanguageFromCountry('KR'), 'ko')

  // Inglês
  assert.equal(detectLanguageFromCountry('US'), 'en')
  assert.equal(detectLanguageFromCountry('GB'), 'en')
  assert.equal(detectLanguageFromCountry('CA'), 'en')
  assert.equal(detectLanguageFromCountry('AU'), 'en')

  // Fallbacks
  assert.equal(detectLanguageFromCountry(null), 'pt')
  assert.equal(detectLanguageFromCountry(undefined), 'pt')
})

test('mapeamento de locale para cada um dos 12 idiomas', () => {
  assert.equal(localeForLang('pt'), 'pt-BR')
  assert.equal(localeForLang('en'), 'en-US')
  assert.equal(localeForLang('es'), 'es-ES')
  assert.equal(localeForLang('de'), 'de-DE')
  assert.equal(localeForLang('fr'), 'fr-FR')
  assert.equal(localeForLang('it'), 'it-IT')
  assert.equal(localeForLang('ja'), 'ja-JP')
  assert.equal(localeForLang('nl'), 'nl-NL')
  assert.equal(localeForLang('sv'), 'sv-SE')
  assert.equal(localeForLang('zh'), 'zh-CN')
  assert.equal(localeForLang('ar'), 'ar-AE')
  assert.equal(localeForLang('ko'), 'ko-KR')
})
