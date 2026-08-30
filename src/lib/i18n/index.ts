import { Language, LANGUAGES, TranslationDictionary } from './types'
import { pt } from './locales/pt'
import { en } from './locales/en'
import { es } from './locales/es'
import { de } from './locales/de'
import { fr } from './locales/fr'
import { it } from './locales/it'
import { ja } from './locales/ja'
import { nl } from './locales/nl'
import { sv } from './locales/sv'
import { zh } from './locales/zh'
import { ar } from './locales/ar'
import { ko } from './locales/ko'

export * from './types'

export const DICTIONARIES: Record<Language, TranslationDictionary> = {
  pt,
  en,
  es,
  de,
  fr,
  it,
  ja,
  nl,
  sv,
  zh,
  ar,
  ko,
}

// Country code to Language mapping helper
export function detectLanguageFromCountry(countryCode?: string | null): Language {
  if (!countryCode) return 'pt'
  const code = countryCode.toUpperCase().trim()

  // Portuguese countries
  if (['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(code)) {
    return 'pt'
  }

  // German countries
  if (['DE', 'AT', 'CH', 'LI'].includes(code)) {
    return 'de'
  }

  // French countries
  if (['FR', 'MC', 'SN', 'CI', 'CD', 'MG', 'CM'].includes(code)) {
    return 'fr'
  }

  // Italian countries
  if (['IT', 'SM', 'VA'].includes(code)) {
    return 'it'
  }

  // Dutch countries
  if (['NL', 'AW', 'CW', 'SX', 'SR'].includes(code)) {
    return 'nl'
  }

  // Swedish / Nordic
  if (['SE'].includes(code)) {
    return 'sv'
  }

  // Chinese countries/regions
  if (['CN', 'HK', 'MO', 'TW'].includes(code)) {
    return 'zh'
  }

  // Arabic countries
  if (['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'EG', 'MA', 'JO', 'LB', 'DZ', 'TN', 'IQ'].includes(code)) {
    return 'ar'
  }

  // Korean
  if (['KR'].includes(code)) {
    return 'ko'
  }

  // Japanese
  if (['JP'].includes(code)) {
    return 'ja'
  }

  // Spanish countries
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CUB', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ'].includes(code)) {
    return 'es'
  }

  // All other countries default to English
  return 'en'
}

// Client-side browser language detection
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'pt'
  
  // Check stored preference first
  const stored = localStorage.getItem('griffo_lang') as Language
  if (stored && LANGUAGES.includes(stored)) {
    return stored
  }

  const navLangs = navigator.languages || [navigator.language || '']
  for (const l of navLangs) {
    const langLower = l.toLowerCase()
    if (langLower.startsWith('pt')) return 'pt'
    if (langLower.startsWith('es')) return 'es'
    if (langLower.startsWith('de')) return 'de'
    if (langLower.startsWith('fr')) return 'fr'
    if (langLower.startsWith('it')) return 'it'
    if (langLower.startsWith('ja')) return 'ja'
    if (langLower.startsWith('nl')) return 'nl'
    if (langLower.startsWith('sv')) return 'sv'
    if (langLower.startsWith('zh')) return 'zh'
    if (langLower.startsWith('ar')) return 'ar'
    if (langLower.startsWith('ko')) return 'ko'
    if (langLower.startsWith('en')) return 'en'
  }

  return 'pt' // Default fallback
}

const LOCALE_BY_LANG: Record<Language, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  nl: 'nl-NL',
  sv: 'sv-SE',
  zh: 'zh-CN',
  ar: 'ar-AE',
  ko: 'ko-KR',
}

/** Locale do `Intl`/`toLocaleDateString` para o idioma da tela — não é o mercado da vaga. */
export function localeForLang(lang: Language): string {
  return LOCALE_BY_LANG[lang] || 'pt-BR'
}
