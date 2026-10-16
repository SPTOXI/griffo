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
  /**
   * Quando o texto do guia foi conferido contra as fontes abaixo (AAAA-MM-DD).
   *
   * Só se preenche com uma conferência que ACONTECEU. Guia sem esta data não
   * mostra "conferido em" — melhor omitir do que carimbar o que ninguém leu.
   * Aparece na tela e em `dateModified` do JSON-LD; os dois dizem o mesmo.
   */
  reviewedAt?: string
  /** Páginas oficiais do fornecedor que embasam o texto. Exigem `reviewedAt`. */
  sources?: { label: string; url: string }[]
  /**
   * Idiomas em que a conferência de fato aconteceu. Sem este campo, vale para
   * todos os idiomas do guia. Existe porque a data é por guia, mas o texto é por
   * idioma: carimbar um idioma que ninguém reviu seria afirmar uma conferência
   * que não houve.
   */
  reviewedLangs?: Language[]
}

/** Todos os 12 — para os ATS que operam globalmente. */
const GLOBAL: Language[] = ['pt', 'en', 'es', 'de', 'fr', 'it', 'ja', 'nl', 'sv', 'zh', 'ar', 'ko']

export const ATS_META: Record<string, AtsMeta> = {
  gupy: {
    slug: 'gupy',
    name: 'Gupy',
    fullName: 'Gupy Recrutamento & Seleção',
    country: 'BR',
    // Opera só no Brasil.
    languages: ['pt'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-16',
    sources: [{ label: "Gupy — Como os agentes de IA da Gupy funcionam (30/01/2026)", url: 'https://www.gupy.io/blog-do-emprego/gupy-ia' }],
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
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en', 'pt', 'es', 'de', 'ko'],
    sources: [{ label: "Workday — Talent Acquisition (site oficial)", url: 'https://www.workday.com/en-us/products/talent-management/talent-acquisition.html' }],
  },
  greenhouse: {
    slug: 'greenhouse',
    name: 'Greenhouse',
    fullName: 'Greenhouse Recruiting Software',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en', 'pt', 'es', 'de', 'ko'],
    sources: [{ label: "Greenhouse — site oficial", url: 'https://www.greenhouse.com/' }],
  },
  lever: {
    slug: 'lever',
    name: 'Lever',
    fullName: 'Lever Talent Acquisition Suite',
    country: 'US',
    languages: GLOBAL,
    marketShare: {
      kind: 'sourced',
      source: 'Lever (site oficial)',
      sourceUrl: 'https://www.lever.co/',
      asOf: '2026',
    },
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en', 'pt', 'es', 'de', 'ko'],
    sources: [{ label: "Lever — site oficial", url: 'https://www.lever.co/' }],
  },
  taleo: {
    slug: 'taleo',
    name: 'Taleo',
    fullName: 'Oracle Taleo Enterprise',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en', 'pt', 'es', 'de', 'ko'],
    sources: [{ label: "Oracle — Taleo (página oficial)", url: 'https://www.oracle.com/human-capital-management/taleo/' }],
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
      sourceUrl: 'https://www.icims.com/',
      asOf: '2026',
    },
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en'],
    sources: [{ label: "iCIMS — site oficial", url: 'https://www.icims.com/' }],
  },
  ashby: {
    slug: 'ashby',
    name: 'Ashby',
    fullName: 'Ashby All-in-One Recruiting',
    country: 'US',
    languages: GLOBAL,
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-16',
    reviewedLangs: ['en', 'pt', 'es', 'de', 'ko'],
    sources: [{ label: "Ashby — site oficial", url: 'https://www.ashbyhq.com/' }],
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
    reviewedAt: '2026-10-09',
    sources: [{ label: "SmartRecruiters — site oficial", url: 'https://www.smartrecruiters.com/' }],
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
    reviewedAt: '2026-10-09',
    sources: [{ label: "Workable — site oficial", url: 'https://www.workable.com/' }],
  },
  teamtailor: {
    slug: 'teamtailor',
    name: 'Teamtailor',
    fullName: 'Teamtailor Recruitment Software',
    country: 'SE',
    // Sede sueca; alemão porque o público DACH já converte nas outras páginas.
    languages: ['en', 'de', 'sv'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Teamtailor — site oficial", url: 'https://www.teamtailor.com/en/' }],
  },
  oraclerecruiting: {
    slug: 'oraclerecruiting',
    name: 'Oracle Recruiting',
    fullName: 'Oracle Recruiting (Oracle Fusion Cloud HCM)',
    country: 'US',
    // Sucessor de nuvem do Taleo; o público de Taleo já aparece no Search Console.
    languages: ['en', 'pt', 'es', 'de'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Oracle Recruiting — página oficial", url: 'https://www.oracle.com/human-capital-management/recruiting/' }],
  },
  bamboohr: {
    slug: 'bamboohr',
    name: 'BambooHR',
    fullName: 'BambooHR Applicant Tracking',
    country: 'US',
    languages: ['en', 'es'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "BambooHR — site oficial", url: 'https://www.bamboohr.com/' }],
  },
  jobvite: {
    slug: 'jobvite',
    name: 'Jobvite',
    fullName: 'Jobvite Talent Acquisition Suite',
    country: 'US',
    // Só inglês: geografia dos clientes não confirmada no site, então não declaramos região.
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Jobvite — site oficial", url: 'https://www.jobvite.com/' }],
  },
  recruitee: {
    slug: 'recruitee',
    name: 'Recruitee',
    fullName: 'Tellent Recruitee Collaborative Hiring Software',
    country: 'NL',
    languages: ['en', 'nl', 'de'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Tellent Recruitee — site oficial", url: 'https://recruitee.com/' }],
  },
  breezyhr: {
    slug: 'breezyhr',
    name: 'Breezy HR',
    fullName: 'Breezy HR Applicant Tracking System',
    country: 'US',
    languages: ['en', 'pt', 'es'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Breezy HR — site oficial", url: 'https://breezy.hr/' }],
  },
  softgarden: {
    slug: 'softgarden',
    name: 'softgarden',
    fullName: 'softgarden Bewerbermanagement',
    country: 'DE',
    // A Alemanha é o melhor país do Search Console; o eixo germânico vem primeiro.
    languages: ['de', 'en'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "softgarden — site oficial", url: 'https://softgarden.com/en/' }],
  },
  join: {
    slug: 'join',
    name: 'JOIN',
    fullName: 'JOIN Recruiting Software',
    country: 'CH',
    languages: ['de', 'en'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "JOIN — site oficial", url: 'https://join.com/' }],
  },
  rexx: {
    slug: 'rexx',
    name: 'rexx systems',
    fullName: 'rexx systems Recruiting',
    country: 'DE',
    languages: ['de'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "rexx systems — site oficial", url: 'https://www.rexx-systems.com/' }],
  },
  zohorecruit: {
    slug: 'zohorecruit',
    name: 'Zoho Recruit',
    fullName: 'Zoho Recruit Applicant Tracking System',
    country: 'IN',
    languages: ['en', 'es', 'pt'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Zoho Recruit — site oficial", url: 'https://www.zoho.com/recruit/' }],
  },
  jazzhr: {
    slug: 'jazzhr',
    name: 'JazzHR',
    fullName: 'JazzHR Applicant Tracking',
    country: 'US',
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "JazzHR — site oficial", url: 'https://www.jazzhr.com/' }],
  },
  bullhorn: {
    slug: 'bullhorn',
    name: 'Bullhorn',
    fullName: 'Bullhorn Applicant Tracking & CRM',
    country: 'US',
    // Plataforma de agências de recrutamento; público de língua inglesa.
    languages: ['en'],
    marketShare: { kind: 'qualitative' },
    reviewedAt: '2026-10-09',
    sources: [{ label: "Bullhorn — site oficial", url: 'https://www.bullhorn.com/' }],
  },
}

export const ATS_SLUGS = Object.keys(ATS_META)

/** Os ATS que têm página em determinado idioma. */
export function atsSlugsForLanguage(lang: Language): string[] {
  return ATS_SLUGS.filter((slug) => ATS_META[slug].languages.includes(lang))
}
