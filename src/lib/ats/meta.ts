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
  smartrecruiters: {
    slug: 'smartrecruiters',
    name: 'SmartRecruiters',
    fullName: 'SmartRecruiters Talent Acquisition Suite',
    country: 'US',
    // Idiomas em que o público já aparece no Search Console e que têm guia
    // escrito; os demais entram quando houver demanda, não por simetria.
    languages: ['en', 'pt', 'es', 'de'],
    marketShare: { kind: 'qualitative' },
  },
  successfactors: {
    slug: 'successfactors',
    name: 'SuccessFactors',
    fullName: 'SAP SuccessFactors Recruiting',
    country: 'DE',
    languages: ['en', 'pt', 'es', 'de'],
    marketShare: { kind: 'qualitative' },
  },
  workable: {
    slug: 'workable',
    name: 'Workable',
    fullName: 'Workable Recruiting Software',
    country: 'US',
    languages: ['en', 'pt', 'es', 'de'],
    marketShare: { kind: 'qualitative' },
  },
  teamtailor: {
    slug: 'teamtailor',
    name: 'Teamtailor',
    fullName: 'Teamtailor Recruitment Software',
    country: 'SE',
    // Sede sueca; alemão porque o público DACH já converte nas outras páginas.
    languages: ['en', 'de', 'sv'],
    marketShare: { kind: 'qualitative' },
  },
  oraclerecruiting: {
    slug: 'oraclerecruiting',
    name: 'Oracle Recruiting',
    fullName: 'Oracle Recruiting (Oracle Fusion Cloud HCM)',
    country: 'US',
    // Sucessor de nuvem do Taleo; o público de Taleo já aparece no Search Console.
    languages: ['en', 'pt', 'es', 'de'],
    marketShare: { kind: 'qualitative' },
  },
  bamboohr: {
    slug: 'bamboohr',
    name: 'BambooHR',
    fullName: 'BambooHR Applicant Tracking',
    country: 'US',
    languages: ['en', 'es'],
    marketShare: { kind: 'qualitative' },
  },
  jobvite: {
    slug: 'jobvite',
    name: 'Jobvite',
    fullName: 'Jobvite Talent Acquisition Suite',
    country: 'US',
    // Só inglês: geografia dos clientes não confirmada no site, então não declaramos região.
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
  },
  recruitee: {
    slug: 'recruitee',
    name: 'Recruitee',
    fullName: 'Tellent Recruitee Collaborative Hiring Software',
    country: 'NL',
    languages: ['en', 'nl', 'de'],
    marketShare: { kind: 'qualitative' },
  },
  breezyhr: {
    slug: 'breezyhr',
    name: 'Breezy HR',
    fullName: 'Breezy HR Applicant Tracking System',
    country: 'US',
    languages: ['en', 'pt', 'es'],
    marketShare: { kind: 'qualitative' },
  },
  softgarden: {
    slug: 'softgarden',
    name: 'softgarden',
    fullName: 'softgarden Bewerbermanagement',
    country: 'DE',
    // A Alemanha é o melhor país do Search Console; o eixo germânico vem primeiro.
    languages: ['de', 'en'],
    marketShare: { kind: 'qualitative' },
  },
  join: {
    slug: 'join',
    name: 'JOIN',
    fullName: 'JOIN Recruiting Software',
    country: 'CH',
    languages: ['de', 'en'],
    marketShare: { kind: 'qualitative' },
  },
  rexx: {
    slug: 'rexx',
    name: 'rexx systems',
    fullName: 'rexx systems Recruiting',
    country: 'DE',
    languages: ['de'],
    marketShare: { kind: 'qualitative' },
  },
  zohorecruit: {
    slug: 'zohorecruit',
    name: 'Zoho Recruit',
    fullName: 'Zoho Recruit Applicant Tracking System',
    country: 'IN',
    languages: ['en', 'es', 'pt'],
    marketShare: { kind: 'qualitative' },
  },
  jazzhr: {
    slug: 'jazzhr',
    name: 'JazzHR',
    fullName: 'JazzHR Applicant Tracking',
    country: 'US',
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
  },
  bullhorn: {
    slug: 'bullhorn',
    name: 'Bullhorn',
    fullName: 'Bullhorn Applicant Tracking & CRM',
    country: 'US',
    // Plataforma de agências de recrutamento; público de língua inglesa.
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
  },
}

export const ATS_SLUGS = Object.keys(ATS_META)

/** Os ATS que têm página em determinado idioma. */
export function atsSlugsForLanguage(lang: Language): string[] {
  return ATS_SLUGS.filter((slug) => ATS_META[slug].languages.includes(lang))
}
