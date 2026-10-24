import { marketForCountry } from '@/lib/market'
import { countryLabel } from '@/lib/jobs/country-labels'
import { localeForLang } from '@/lib/i18n'
import type { Language } from '@/lib/i18n/types'
import { SUPPORTED_COUNTRY_SLUGS } from '@/lib/market/supported-slugs'
import { CITY_JOBS_COPY, type CityJobsCopy } from './copy'

/** O que toda página de vagas por cidade precisa saber do país da rota. */
export interface CityJobsContext {
  /** Slug da rota (`br`). */
  slug: string
  /** ISO do país, como em `Job.country` (`BR`). */
  code: string
  /** Idioma do mercado do país — o mesmo de `/[country]`. */
  lang: Language
  locale: string
  countryName: string
  c: CityJobsCopy
}

/** Países com página de vagas: os mesmos com rota própria, menos `global` (não tem cidade). */
export const CITY_JOBS_COUNTRY_SLUGS = SUPPORTED_COUNTRY_SLUGS.filter((s) => s !== 'global')

export function cityJobsContext(slugParam: string): CityJobsContext | null {
  const slug = slugParam.toLowerCase()
  if (!CITY_JOBS_COUNTRY_SLUGS.includes(slug)) return null
  const code = slug.toUpperCase()
  const lang = marketForCountry(code).jobLanguage
  return { slug, code, lang, locale: localeForLang(lang), countryName: countryLabel(code, lang), c: CITY_JOBS_COPY[lang] }
}
