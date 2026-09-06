/**
 * O que um guia de ATS tem que MUDA por idioma.
 *
 * Espelha o padrão de `lib/i18n/`: um arquivo por idioma em `locales/`, com
 * um teste de paridade garantindo que nenhum idioma perca chave nem entregue
 * string vazia. Nome de produto ("Workday") fica de fora, em `meta.ts` —
 * não se traduz nome próprio.
 */
export interface AtsContent {
  /**
   * Como o mercado do ATS é descrito na tela. Traduzível porque é frase
   * ("Bancos, Governos & Grandes Corporações"), não sigla de país.
   */
  marketName: string
  description: string
  /**
   * Texto da afirmação de posição de mercado. A FONTE fica em `meta.ts`,
   * porque não muda por idioma; aqui fica só a frase.
   *
   * Se `meta.marketShare.kind === 'qualitative'`, este texto não pode conter
   * número que pareça estatística — há teste travando isso em TODOS os
   * idiomas, não só no português onde o defeito original apareceu (§2.81).
   */
  marketShare: string
  howItWorks: { title: string; description: string }[]
  eliminationFactors: string[]
  howGriffoWorkHelps: string[]
  faqs: { question: string; answer: string }[]
}

/** Conteúdo de todos os ATS que existem em um idioma. */
export type AtsLocale = Record<string, AtsContent>
