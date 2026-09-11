import type { Language } from '../i18n'
import type { EnterpriseLocale } from './content-types'
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
 * Conteúdo do Griffo Enterprise, por idioma.
 *
 * Diferente de `ats/content.ts`, aqui é `Record` completo (não `Partial`):
 * as três páginas (`landing`, `externalRecruitment`, `internalMobility`) são
 * globais por natureza — nenhuma é regional como Gupy/Sólides —, então os
 * 12 idiomas de `LANGUAGES` precisam estar todos presentes desde o início.
 */
export const ENTERPRISE_LOCALES: Record<Language, EnterpriseLocale> = {
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

export function enterpriseContentFor(lang: Language): EnterpriseLocale {
  return ENTERPRISE_LOCALES[lang]
}
