import type { Language } from '../i18n'
import type { PrivacyContent } from './content-types'
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

/**
 * Conteúdo da política de privacidade pública (`/privacy`), por idioma.
 * Mesmo padrão de `lib/enterprise/content.ts` — `Record` completo, os 12
 * idiomas presentes desde o início, nunca `Partial`.
 */
export const PRIVACY_LOCALES: Record<Language, PrivacyContent> = {
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

export function privacyContentFor(lang: Language): PrivacyContent {
  return PRIVACY_LOCALES[lang]
}
