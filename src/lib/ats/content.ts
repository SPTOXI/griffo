import type { Language } from '../i18n'
import type { AtsContent, AtsLocale } from './content-types'
import { ATS_META } from './meta'
import { atsPt } from './locales/pt'
import { atsEn } from './locales/en'
import { atsDe } from './locales/de'
import { atsEs } from './locales/es'
import { atsFr } from './locales/fr'
import { atsIt } from './locales/it'
import { atsJa } from './locales/ja'
import { atsNl } from './locales/nl'
import { atsSv } from './locales/sv'
import { atsZh } from './locales/zh'
import { atsAr } from './locales/ar'
import { atsKo } from './locales/ko'

/**
 * Conteúdo dos guias de ATS, por idioma.
 *
 * Um idioma só aparece aqui se existir arquivo em `locales/`. Idioma
 * ausente NÃO cai em português: `atsContentFor` devolve `null`, e a rota
 * responde 404 — ver o porquê ali embaixo.
 */
const LOCALES: Partial<Record<Language, AtsLocale>> = {
  pt: atsPt,
  en: atsEn,
  es: atsEs,
  de: atsDe,
  fr: atsFr,
  it: atsIt,
  ja: atsJa,
  nl: atsNl,
  sv: atsSv,
  zh: atsZh,
  ar: atsAr,
  ko: atsKo,
}

/**
 * O guia daquele ATS naquele idioma, ou `null` se a combinação não existe.
 *
 * ## Por que `null` e 404, e não recuo para português
 *
 * Recuar para PT devolveria 200 numa página em idioma errado — exatamente
 * o defeito que o §2.49 nomeou como regra permanente (nada fixo em
 * português) e que o §2.81 reencontrou nestas mesmas páginas. Pior para
 * SEO: uma URL que promete alemão e entrega português é conteúdo enganoso
 * do ponto de vista do buscador, e some do índice junto com a confiança nas
 * outras.
 *
 * 404 é a resposta honesta: aquela combinação não existe. `generateStaticParams`
 * e o `sitemap` só declaram as que existem, então nenhum link interno nem o
 * hreflang apontam para cá.
 */
export function atsContentFor(slug: string, lang: Language): AtsContent | null {
  const meta = ATS_META[slug]
  if (!meta) return null
  if (!meta.languages.includes(lang)) return null
  return LOCALES[lang]?.[slug] ?? null
}

/** Os idiomas que têm arquivo de conteúdo — não os que `meta` deseja. */
export function availableAtsLanguages(): Language[] {
  return Object.keys(LOCALES) as Language[]
}

/**
 * Os slugs escritos no arquivo daquele idioma, SEM filtrar por
 * `meta.languages`.
 *
 * Existe para o teste de conteúdo órfão: `atsContentFor` filtra pelo meta,
 * então conteúdo que nenhum meta declara jamais apareceria — nem numa
 * página, nem numa falha de teste. Só olhando o arquivo cru dá para ver.
 */
export function rawLocaleSlugs(lang: Language): string[] {
  return Object.keys(LOCALES[lang] ?? {})
}

/**
 * Os idiomas em que a página daquele ATS existe DE FATO.
 *
 * Interseção entre o que `meta.languages` declara (intenção editorial) e os
 * locales que já foram escritos (realidade). É a única fonte que
 * `generateStaticParams`, o `sitemap` e o hreflang podem usar: declarar a
 * intenção geraria rota, entrada de sitemap e alternativa de hreflang
 * apontando para 404 — e hreflang quebrado faz o Google descartar o bloco
 * inteiro, defeito que o §2.69 já pagou uma vez neste projeto.
 */
export function atsLanguagesFor(slug: string): Language[] {
  const meta = ATS_META[slug]
  if (!meta) return []
  return meta.languages.filter((lang) => LOCALES[lang]?.[slug] != null)
}

/** Todas as combinações ATS×idioma que existem — para rotas e sitemap. */
export function atsRoutePairs(): { slug: string; lang: Language }[] {
  return Object.keys(ATS_META).flatMap((slug) =>
    atsLanguagesFor(slug).map((lang) => ({ slug, lang }))
  )
}
