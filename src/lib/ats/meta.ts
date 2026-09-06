import type { Language } from '../i18n'

/**
 * Atribuição de uma afirmação de posição de mercado — a parte que NÃO
 * traduz.
 *
 * O texto da afirmação vive no conteúdo por idioma (`locales/{lang}.ts`);
 * aqui fica só de onde ele veio. Separado assim porque a fonte é a mesma nos
 * 12 idiomas: o 8-K da Workday não muda de URL porque a página está em
 * japonês.
 *
 * ## Por que continua sendo união discriminada
 *
 * Mesma razão do §2.81: a página da Gupy afirmou por meses "presente em mais
 * de 70% das vagas corporativas do Brasil", número que não se sustenta (os
 * ~75% de fonte pública são de adoção de ATS EM GERAL, não da fatia da
 * Gupy). Enquanto isto fosse campo livre, nada exigiria fonte de quem
 * escrevesse o próximo percentual. `sourced` **obriga** `source`,
 * `sourceUrl` e `asOf` — não compila sem.
 *
 * `asOf` é obrigatório porque número de fornecedor envelhece: a Workday
 * declarou "mais de 30% da Fortune 500" em 2017 e "mais de 60%" em 2024.
 * Sem a data na tela, quem lê não sabe qual dos dois está vendo.
 */
export type MarketShareAttribution =
  /** Afirmação sem número — não precisa de fonte porque não afirma quantidade. */
  | { kind: 'qualitative' }
  /** Afirmação com número. Fonte e data obrigatórias por construção. */
  | { kind: 'sourced'; source: string; sourceUrl: string; asOf: string }

/**
 * O que um guia de ATS tem que é igual em todos os idiomas.
 *
 * Nome de produto (`name`, `fullName`) NÃO entra no conteúdo traduzível de
 * propósito: "Workday" é "Workday" em alemão e em japonês. É a mesma regra
 * que mantém nome de instituição (`Eurostat`, `BLS`) fora do dicionário no
 * índice de contratação.
 */
export interface AtsMeta {
  slug: string
  name: string
  fullName: string
  /** País de origem/sede do fornecedor. */
  country: string
  /**
   * Idiomas em que esta página existe — e portanto em que ela é gerada,
   * entra no sitemap e declara hreflang.
   *
   * ## Por que não são sempre os 12
   *
   * Vários destes ATS são regionais por natureza: a Gupy e a Sólides só
   * operam no Brasil, o InfoJobs em Espanha/Brasil/Itália, o Personio no
   * eixo germânico. Uma página `/ats/gupy` em coreano não teria leitor
   * nenhum — e um bloco de ~120 páginas quase idênticas, metade sem
   * audiência, é exatamente o padrão que o sistema de conteúdo útil do
   * Google mira ("páginas feitas para buscador, não para gente"). Gerar
   * todas prejudicaria o alcance em vez de ampliá-lo.
   *
   * A lista de cada um sai do alcance que o PRÓPRIO guia já declarava em
   * `marketName` antes desta separação, não de palpite novo.
   */
  languages: Language[]
  marketShare: MarketShareAttribution
}

/** Todos os 12 — para os ATS que operam globalmente. */
const GLOBAL: Language[] = ['pt', 'en', 'es', 'de', 'fr', 'it', 'ja', 'nl', 'sv', 'zh', 'ar', 'ko']

export const ATS_META: Record<string, AtsMeta> = {
  gupy: {
    slug: 'gupy',
    name: 'Gupy',
    fullName: 'Gupy Recrutamento & Seleção (IA Gaia)',
    country: 'BR',
    // Opera só no Brasil.
    languages: ['pt'],
    marketShare: { kind: 'qualitative' },
  },
  workday: {
    slug: 'workday',
    name: 'Workday',
    fullName: 'Workday Recruiting / Human Capital Management',
    country: 'US',
    languages: GLOBAL,
    marketShare: {
      kind: 'sourced',
      source: 'Workday (Form 8-K, SEC)',
      sourceUrl:
        'https://www.sec.gov/Archives/edgar/data/1327811/000132781124000089/wday-04302024x991.htm',
      asOf: '2024',
    },
  },
  greenhouse: {
    slug: 'greenhouse',
    name: 'Greenhouse',
    fullName: 'Greenhouse Recruiting Software',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
  },
  lever: {
    slug: 'lever',
    name: 'Lever',
    fullName: 'Lever Talent Acquisition Suite',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
  },
  taleo: {
    slug: 'taleo',
    name: 'Taleo',
    fullName: 'Oracle Taleo Enterprise',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
  },
  solides: {
    slug: 'solides',
    name: 'Solides',
    fullName: 'Sólides Tecnologia (Recrutamento e Seleção)',
    country: 'BR',
    // Opera só no Brasil.
    languages: ['pt'],
    marketShare: {
      kind: 'sourced',
      source: 'Sólides (site oficial)',
      sourceUrl: 'https://solides.com.br/sobre-nos/',
      asOf: '2026',
    },
  },
  icims: {
    slug: 'icims',
    name: 'iCIMS',
    fullName: 'iCIMS Talent Cloud',
    country: 'US',
    // O próprio guia declarava "Estados Unidos & Reino Unido".
    languages: ['en'],
    marketShare: {
      kind: 'sourced',
      source: 'iCIMS (site oficial)',
      sourceUrl: 'https://www.icims.com/icims-talent-cloud-3/',
      asOf: '2026',
    },
  },
  ashby: {
    slug: 'ashby',
    name: 'Ashby',
    fullName: 'Ashby All-in-One Recruiting',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
  },
  infojobs: {
    slug: 'infojobs',
    name: 'InfoJobs',
    fullName: 'InfoJobs (Grupo Adevinta)',
    country: 'ES',
    // O próprio guia declarava "Espanha, Brasil e Itália".
    languages: ['es', 'pt', 'it'],
    marketShare: { kind: 'qualitative' },
  },
  personio: {
    slug: 'personio',
    name: 'Personio',
    fullName: 'Personio HR & Recruiting',
    country: 'DE',
    // O próprio guia declarava "Alemanha, Áustria, Suíça e Europa" — o eixo
    // germânico é `de`; o resto da Europa encontra Workday/Greenhouse, que
    // são globais.
    languages: ['de'],
    marketShare: { kind: 'qualitative' },
  },
}

export const ATS_SLUGS = Object.keys(ATS_META)

/** Os ATS que têm página em determinado idioma. */
export function atsSlugsForLanguage(lang: Language): string[] {
  return ATS_SLUGS.filter((slug) => ATS_META[slug].languages.includes(lang))
}
