import type { Language } from '@/lib/i18n'

/**
 * Vocabulário de "emprego"/"mercado de trabalho" no registro institucional
 * — o que BLS, Eurostat, ILOSTAT e CEPALSTAT usam, e o `/market-pulse`
 * ainda não declarava em `keywords` nenhum.
 *
 * ## Por que isto existe separado de `job-search-terms.ts`
 *
 * `job-search-terms.ts` cobre quem está CANDIDATO — "busca de emprego",
 * "job hunting". Este arquivo cobre outro público: quem procura DADO sobre
 * o mercado — jornalista, pesquisador, RH — no registro formal que as
 * próprias fontes do atlas usam. Direção diferente, lista diferente; ver o
 * comentário de `job-search-terms.ts` sobre a hashtag que não se traduz
 * para o mesmo raciocínio aplicado a outro par de termos.
 *
 * ## Como cada item foi decidido — nunca por tradução literal solta
 *
 * Cada idioma leva DOIS termos, e os dois já existem verificados em outro
 * lugar, nunca inventados aqui:
 *
 * 1. **A frase de mercado de trabalho** — copiada do próprio
 *    `hiringMap.metaDescription`/`intro` daquele idioma em
 *    `lib/i18n/locales/*.ts`, já em produção. "Mercado de trabalho",
 *    "Arbeitsmarkt", "marché du travail", "労働市場" etc. — zero tradução
 *    nova, zero risco de registro errado.
 * 2. **A palavra "emprego" isolada** — para japonês, chinês, coreano e
 *    árabe, confirmada em fonte oficial antes de entrar aqui (pt/en/es/de/
 *    fr/it/nl/sv usam vocabulário básico de estatística pública, sem a
 *    ambiguidade que motivou a verificação nos quatro):
 *    - **Japonês `雇用`**: confirmado em `雇用動向調査` (Employment Trend
 *      Survey), pesquisa oficial do 厚生労働省 (mhlw.go.jp).
 *    - **Chinês `就业`**: confirmado na página do 国家统计局
 *      (stats.gov.cn/hd/lyzx/zxgk/jy) dedicada a "就业" (emprego).
 *    - **Coreano `고용`**: confirmado em `고용률`/`고용동향`, termos do
 *      Ministry of Employment and Labor e do antigo 통계청 (KOSTAT).
 *    - **Árabe `العمالة`**: confirmado em fontes oficiais regionais (GCC
 *      Statistical Center, `مكتب إحصاءات العمل`) — usado ao lado de `سوق
 *      العمل`, nunca sozinho como `التوظيف`, que já é a palavra de
 *      "contratação" usada no `pageTitle` desta mesma página (mesma
 *      distinção de direção do §2.84: "contratação" ≠ "emprego").
 *
 *    **Não testei compostos como "雇用統計"/"就业统计"/"고용 통계" contra
 *    fonte** — a busca não confirmou nenhum como termo oficial padrão, só a
 *    palavra-base isolada. Por isso a lista leva a palavra sozinha, não o
 *    composto que pareceria mais natural em português/inglês.
 */
const EMPLOYMENT_KEYWORD: Record<Language, string[]> = {
  pt: ['mercado de trabalho', 'emprego'],
  en: ['labour-market', 'labour market', 'labor market', 'employment'],
  es: ['mercado laboral', 'empleo'],
  de: ['Arbeitsmarkt', 'Beschäftigung'],
  fr: ['marché du travail', 'emploi'],
  it: ['mercato del lavoro', 'occupazione'],
  ja: ['労働市場', '雇用'],
  nl: ['arbeidsmarkt', 'werkgelegenheid'],
  sv: ['arbetsmarknad', 'sysselsättning'],
  zh: ['劳动力市场', '就业'],
  ar: ['سوق العمل', 'العمالة'],
  ko: ['노동시장', '고용'],
}

/** As keywords de mercado de trabalho/emprego para o idioma da página. */
export function employmentKeywords(lang: Language): string[] {
  return EMPLOYMENT_KEYWORD[lang] ?? EMPLOYMENT_KEYWORD.en
}
