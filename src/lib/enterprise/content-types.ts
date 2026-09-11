/**
 * O que uma página do Griffo Enterprise (B2B) tem que MUDA por idioma.
 *
 * Espelha o padrão de `lib/ats/content-types.ts`: um arquivo por idioma em
 * `locales/`, agregado em `content.ts`. Diferente do `ats/`, aqui as três
 * seções (`landing`, `externalRecruitment`, `internalMobility`) são globais
 * por natureza — nenhuma delas é regional como Gupy/Sólides —, então todo
 * idioma de `LANGUAGES` precisa ter as três preenchidas.
 */

export interface EnterprisePillarContent {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  eyebrow: string
  title: string
  subtitle: string
  points: { title: string; body: string }[]
  ctaLabel: string
}

export interface EnterpriseLandingContent {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  eyebrow: string
  title: string
  subtitle: string
  useCases: { title: string; body: string }[]
  ctaLabel: string
  /**
   * Perguntas reais de comprador B2B (Fase 2 — GEO), sem nenhuma alegação
   * numérica: são explicações qualitativas de como o produto funciona, não
   * estatística de mercado. `FAQPage` do schema.org exige que o texto aqui
   * seja o MESMO exibido na tela — nada de pergunta sem resposta visível.
   */
  faqs: { question: string; answer: string }[]
}

export interface EnterpriseLocale {
  /** Rótulo de "Início" no `BreadcrumbList` das 3 páginas (Fase 3). */
  breadcrumbHome: string
  landing: EnterpriseLandingContent
  externalRecruitment: EnterprisePillarContent
  internalMobility: EnterprisePillarContent
}
