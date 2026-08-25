/**
 * Market Adapter — a camada que sabe como o mercado de trabalho funciona em
 * cada lugar.
 *
 * O núcleo do Griffo (currículo, competências, análise, orientação, matching) é
 * universal e não deve conter regra de país nenhuma. Tudo que muda de um
 * mercado para outro — ATS predominantes, fontes de vagas, convenções de
 * currículo, tipos de contrato, moeda de salário — vive aqui, declarado por
 * mercado, e é lido por `resolveMarket`.
 *
 * ## Por que isto existe
 *
 * Antes, o contexto de mercado dos prompts saía de `ATS_BY_MARKET[lang]`: uma
 * tabela indexada pelo IDIOMA DA INTERFACE. Isso confunde três coisas
 * diferentes e produz conselho errado no caso mais comum do produto global:
 *
 *   pessoa no Brasil, interface em português, buscando vaga nos Estados Unidos
 *   → recebia recomendação de palavra-chave otimizada para a Gupy.
 *
 * Idioma não é mercado. País de residência não é mercado. País de pagamento
 * MUITO menos — ele decide preço, e só (ver `lib/pricing/`).
 *
 * ## Client-safe de propósito
 *
 * Sem `server-only`, sem Prisma, sem segredo: a interface precisa dos mesmos
 * rótulos de mercado que os prompts usam, e duas listas divergentes é
 * exatamente o defeito que este arquivo existe para impedir.
 *
 * ## O que ainda NÃO está aqui
 *
 * Fontes de vagas aparecem como nomes declarados, não como adapters que
 * coletam — os adapters são a Etapa 5 do plano de evolução. Declarar o nome
 * antes é deliberado: é o que permite ao painel administrativo mostrar quais
 * fontes um mercado ainda não cobre, em vez de fingir cobertura total.
 */

import type { Language } from '../i18n'

/** Identificador do mercado. ISO-3166 alpha-2, ou `GLOBAL` para o genérico. */
export type MarketId = string

/** Como o currículo é esperado neste mercado. Difere mais do que se imagina. */
export interface ResumeConventions {
  /**
   * Foto no currículo. `avoid` não é estética: em mercados com legislação
   * antidiscriminação forte (EUA, Reino Unido), a foto é motivo de descarte.
   */
  photo: 'expected' | 'optional' | 'avoid'
  /** Número de páginas que o mercado tolera sem penalizar. */
  maxPages: number
  /**
   * Dados pessoais que o mercado espera ou proíbe no documento. Texto livre
   * porque a regra é jurídica e local, e resumi-la em enum perderia o que
   * importa.
   */
  personalData: string
}

export interface EmploymentRules {
  /** Vínculos usuais. O primeiro é o predominante. */
  contractTypes: string[]
  /**
   * Autorização de trabalho é obstáculo real neste mercado para candidato
   * estrangeiro? Alimenta o filtro duro do Radar (Etapa 6) — não o prompt.
   */
  workAuthorizationMatters: boolean
}

export interface MarketConfig {
  id: MarketId
  /** Nome do mercado para exibição, em inglês. Traduzido na interface. */
  name: string
  /** Países atendidos por esta configuração. */
  countries: string[]
  /**
   * Idioma em que as vagas deste mercado costumam ser publicadas — e em que o
   * currículo costuma ser lido. NÃO é o idioma da interface do usuário, e não
   * deve ser usado para escolher textos de tela.
   */
  jobLanguage: Language
  /**
   * Moeda em que salários são cotados aqui. NÃO é a moeda de cobrança: quem
   * define quanto o usuário paga pelo produto é `lib/pricing/catalog.ts`, a
   * partir do país do meio de pagamento. Um brasileiro mirando Londres vê
   * salário em GBP e paga em BRL.
   */
  salaryCurrency: string
  /** ATS predominantes. Ordem importa: o primeiro é o mais presente. */
  ats: string[]
  /** Fontes de vaga relevantes. Nomes por enquanto; adapters na Etapa 5. */
  jobSources: string[]
  /** Plataformas de presença profissional que pesam neste mercado. */
  socialPlatforms: string[]
  resume: ResumeConventions
  employment: EmploymentRules
}

/**
 * Mercado genérico.
 *
 * É o destino de todo país sem configuração própria, e também o mercado do
 * trabalho remoto internacional, que não pertence a país nenhum. Suas listas
 * são deliberadamente globais: um ATS de nicho nacional num mercado
 * desconhecido é pior que nenhum ATS.
 */
export const GLOBAL_MARKET: MarketConfig = {
  id: 'GLOBAL',
  name: 'Global / International remote',
  countries: [],
  jobLanguage: 'en',
  salaryCurrency: 'USD',
  ats: ['Greenhouse', 'Lever', 'Workday', 'Ashby', 'SmartRecruiters', 'LinkedIn Talent Solutions'],
  jobSources: ['Company career pages', 'LinkedIn Jobs', 'Remote-first job boards'],
  socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
  resume: {
    photo: 'avoid',
    maxPages: 2,
    personalData: 'Nome, e-mail, telefone com código de país, cidade/país e fuso horário. Sem foto, sem data de nascimento, sem estado civil.',
  },
  employment: {
    contractTypes: ['Full-time employment', 'Contractor / B2B', 'Freelance'],
    workAuthorizationMatters: true,
  },
}

/**
 * Os mercados declarados.
 *
 * A lista é o começo, não o fim: acrescentar um mercado é acrescentar uma
 * entrada aqui, sem tocar em nenhum outro arquivo. Nenhum deles é o padrão do
 * sistema — o Brasil é um mercado entre os demais, e o padrão de quem não se
 * encaixa em nenhum é `GLOBAL_MARKET`.
 */
export const MARKETS: MarketConfig[] = [
  {
    id: 'BR',
    name: 'Brazil',
    countries: ['BR'],
    jobLanguage: 'pt',
    salaryCurrency: 'BRL',
    ats: ['Gupy', 'Solides', 'Catho', 'Vagas.com', 'InfoJobs Brasil', 'LinkedIn Talent Solutions'],
    jobSources: ['Gupy', 'Vagas.com', 'Catho', 'LinkedIn Jobs', 'Páginas de carreira das empresas'],
    socialPlatforms: ['LinkedIn', 'Gupy', 'GitHub', 'Behance', 'Portfólio próprio'],
    resume: {
      photo: 'optional',
      maxPages: 2,
      personalData: 'Nome, e-mail, telefone, cidade/estado e LinkedIn. Foto é tolerada mas não exigida; CPF e RG nunca vão no currículo.',
    },
    employment: {
      contractTypes: ['CLT', 'PJ', 'Estágio', 'Temporário'],
      workAuthorizationMatters: false,
    },
  },
  {
    id: 'PT',
    name: 'Portugal',
    countries: ['PT'],
    jobLanguage: 'pt',
    salaryCurrency: 'EUR',
    ats: ['Landing.jobs', 'SAP SuccessFactors', 'Workday', 'LinkedIn Talent Solutions', 'Greenhouse'],
    jobSources: ['Net-Empregos', 'ITJobs', 'Landing.jobs', 'LinkedIn Jobs', 'Páginas de carreira das empresas'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Portfólio próprio'],
    resume: {
      photo: 'optional',
      maxPages: 2,
      personalData: 'Nome, e-mail, telefone com indicativo, cidade e LinkedIn. Indicar autorização de residência/trabalho quando aplicável.',
    },
    employment: {
      contractTypes: ['Contrato sem termo', 'Contrato a termo', 'Recibos verdes', 'Estágio profissional'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'US',
    name: 'United States',
    countries: ['US'],
    jobLanguage: 'en',
    salaryCurrency: 'USD',
    ats: ['Workday', 'Greenhouse', 'Lever', 'iCIMS', 'Taleo', 'Ashby', 'SmartRecruiters'],
    jobSources: ['Company career pages', 'LinkedIn Jobs', 'Indeed', 'Greenhouse job boards'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio', 'Stack Overflow'],
    resume: {
      photo: 'avoid',
      maxPages: 1,
      personalData: 'Name, email, phone, city/state and LinkedIn. No photo, no date of birth, no marital status, no nationality — including them invites discrimination-law screening issues.',
    },
    employment: {
      contractTypes: ['Full-time (W-2)', 'Contract (C2C / 1099)', 'Internship'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'CA',
    name: 'Canada',
    countries: ['CA'],
    jobLanguage: 'en',
    salaryCurrency: 'CAD',
    ats: ['Workday', 'Greenhouse', 'Lever', 'iCIMS', 'LinkedIn Talent Solutions'],
    jobSources: ['Company career pages', 'LinkedIn Jobs', 'Indeed Canada', 'Job Bank'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'avoid',
      maxPages: 2,
      personalData: 'Name, email, phone, city/province and LinkedIn. No photo and no personal details; state work authorization status explicitly when not a citizen or permanent resident.',
    },
    employment: {
      contractTypes: ['Full-time permanent', 'Contract', 'Internship / Co-op'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'GB',
    name: 'United Kingdom',
    countries: ['GB'],
    jobLanguage: 'en',
    salaryCurrency: 'GBP',
    ats: ['Workday', 'Greenhouse', 'Lever', 'Teamtailor', 'SmartRecruiters', 'LinkedIn Talent Solutions'],
    jobSources: ['Company career pages', 'LinkedIn Jobs', 'Indeed UK', 'Reed', 'Otta'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'avoid',
      maxPages: 2,
      personalData: 'Name, email, phone, city and LinkedIn. No photo, no date of birth. Right-to-work status is asked separately, not on the CV.',
    },
    employment: {
      contractTypes: ['Permanent', 'Fixed-term', 'Contract (inside/outside IR35)', 'Apprenticeship'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'ES',
    name: 'Spain',
    countries: ['ES'],
    jobLanguage: 'es',
    salaryCurrency: 'EUR',
    ats: ['InfoJobs', 'SAP SuccessFactors', 'Workday', 'Talent Clue', 'LinkedIn Talent Solutions'],
    jobSources: ['InfoJobs', 'LinkedIn Jobs', 'Tecnoempleo', 'Páginas de carrera de las empresas'],
    socialPlatforms: ['LinkedIn', 'InfoJobs', 'GitHub', 'Portafolio propio'],
    resume: {
      photo: 'expected',
      maxPages: 2,
      personalData: 'Nombre, email, teléfono, ciudad y LinkedIn. La foto sigue siendo habitual; indicar permiso de trabajo cuando proceda.',
    },
    employment: {
      contractTypes: ['Contrato indefinido', 'Contrato temporal', 'Autónomo', 'Prácticas'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'MX',
    name: 'Mexico',
    countries: ['MX'],
    jobLanguage: 'es',
    salaryCurrency: 'MXN',
    ats: ['OCCMundial', 'Workday', 'SAP SuccessFactors', 'LinkedIn Talent Solutions', 'Greenhouse'],
    jobSources: ['OCCMundial', 'LinkedIn Jobs', 'Computrabajo', 'Páginas de carrera de las empresas'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Portafolio propio'],
    resume: {
      photo: 'optional',
      maxPages: 2,
      personalData: 'Nombre, email, teléfono, ciudad y LinkedIn. La foto es común pero opcional; no incluir CURP ni RFC.',
    },
    employment: {
      contractTypes: ['Tiempo indeterminado', 'Por obra o tiempo determinado', 'Honorarios', 'Prácticas profesionales'],
      workAuthorizationMatters: false,
    },
  },
  {
    id: 'DE',
    name: 'Germany',
    countries: ['DE', 'AT'],
    jobLanguage: 'en',
    salaryCurrency: 'EUR',
    ats: ['Personio', 'SAP SuccessFactors', 'Workday', 'Greenhouse', 'Softgarden'],
    jobSources: ['StepStone', 'LinkedIn Jobs', 'Xing Jobs', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'Xing', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'expected',
      maxPages: 2,
      personalData: 'Name, email, phone, city and LinkedIn/Xing. A photo is still customary in the German Lebenslauf; reverse-chronological order and no gaps left unexplained.',
    },
    employment: {
      contractTypes: ['Unbefristet (permanent)', 'Befristet (fixed-term)', 'Werkstudent', 'Freiberuflich'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'FR',
    name: 'France',
    countries: ['FR', 'BE', 'LU'],
    jobLanguage: 'en',
    salaryCurrency: 'EUR',
    ats: ['Workday', 'SmartRecruiters', 'Lever', 'Taleo', 'LinkedIn Talent Solutions'],
    jobSources: ['Welcome to the Jungle', 'APEC', 'LinkedIn Jobs', 'Indeed France', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'optional',
      maxPages: 1,
      personalData: 'Name, email, phone, city and LinkedIn. Photo is tolerated but declining; keep the CV to one page for non-executive roles.',
    },
    employment: {
      contractTypes: ['CDI', 'CDD', 'Freelance / Portage salarial', 'Alternance', 'Stage'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'IN',
    name: 'India',
    countries: ['IN'],
    jobLanguage: 'en',
    salaryCurrency: 'INR',
    ats: ['Naukri RMS', 'Workday', 'Greenhouse', 'iCIMS', 'Darwinbox', 'LinkedIn Talent Solutions'],
    jobSources: ['Naukri', 'LinkedIn Jobs', 'Instahyre', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'optional',
      maxPages: 2,
      personalData: 'Name, email, phone with country code, city and LinkedIn. Notice period and current/expected CTC are commonly asked and expected.',
    },
    employment: {
      contractTypes: ['Full-time permanent', 'Contract', 'Internship'],
      workAuthorizationMatters: false,
    },
  },
  {
    id: 'AU',
    name: 'Australia',
    countries: ['AU', 'NZ'],
    jobLanguage: 'en',
    salaryCurrency: 'AUD',
    ats: ['Workday', 'PageUp', 'SmartRecruiters', 'Greenhouse', 'LinkedIn Talent Solutions'],
    jobSources: ['Seek', 'LinkedIn Jobs', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'avoid',
      maxPages: 3,
      personalData: 'Name, email, phone, city/state and LinkedIn. No photo. State visa/work rights explicitly — it is asked upfront here.',
    },
    employment: {
      contractTypes: ['Full-time permanent', 'Part-time', 'Casual', 'Fixed-term contract'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'JP',
    name: 'Japan',
    countries: ['JP'],
    jobLanguage: 'en',
    salaryCurrency: 'JPY',
    ats: ['Workday', 'HERP', 'Greenhouse', 'LinkedIn Talent Solutions'],
    jobSources: ['LinkedIn Jobs', 'Japan Dev', 'TokyoDev', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'expected',
      maxPages: 2,
      personalData: 'Japanese hiring often expects the 履歴書 (rirekisho) format with photo alongside a Western-style CV. Japanese proficiency level (JLPT) and visa status are routinely required.',
    },
    employment: {
      contractTypes: ['正社員 (permanent)', '契約社員 (contract)', '派遣 (dispatch)', 'Internship'],
      workAuthorizationMatters: true,
    },
  },
  {
    id: 'IT',
    name: 'Italy',
    countries: ['IT'],
    jobLanguage: 'en',
    salaryCurrency: 'EUR',
    ats: ['Workday', 'SAP SuccessFactors', 'InfoJobs', 'Cornerstone', 'LinkedIn Talent Solutions'],
    jobSources: ['InfoJobs Italia', 'Indeed Italia', 'LinkedIn Jobs', 'Company career pages'],
    socialPlatforms: ['LinkedIn', 'GitHub', 'Personal portfolio'],
    resume: {
      photo: 'expected',
      maxPages: 2,
      personalData: 'Nome, cognome, email, telefono, città e LinkedIn. La foto e la clausola sul trattamento dei dati (GDPR / D.Lgs. 196/2003) sono prassi consueta.',
    },
    employment: {
      contractTypes: ['Tempo indeterminato', 'Tempo determinato', 'Apprendistato', 'Partita IVA'],
      workAuthorizationMatters: true,
    },
  },
]

/** Padrão de mercado por idioma — o palpite mais fraco, e o último da fila. */
const MARKET_BY_LANGUAGE: Record<Language, MarketId> = {
  pt: 'BR',
  en: 'US',
  es: 'ES',
}

const BY_COUNTRY: Map<string, MarketConfig> = (() => {
  const map = new Map<string, MarketConfig>()
  for (const market of MARKETS) {
    for (const country of market.countries) map.set(country, market)
  }
  return map
})()

export function normalizeMarketCountry(country: string | null | undefined): string {
  return (country || '').toUpperCase().trim()
}

/** Mercado de um país, ou o genérico. Nunca lança. */
export function marketForCountry(country: string | null | undefined): MarketConfig {
  return BY_COUNTRY.get(normalizeMarketCountry(country)) ?? GLOBAL_MARKET
}

/** Mercado por `id`, ou o genérico. */
export function marketById(id: string | null | undefined): MarketConfig {
  const code = normalizeMarketCountry(id)
  if (code === 'GLOBAL') return GLOBAL_MARKET
  return MARKETS.find((m) => m.id === code) ?? GLOBAL_MARKET
}

/** De onde saiu o mercado escolhido. Existe para o painel e para o log. */
export type MarketSource = 'target' | 'residence' | 'language' | 'default'

export interface MarketResolution {
  market: MarketConfig
  source: MarketSource
}

export interface MarketResolutionInput {
  /**
   * País-alvo profissional declarado pelo usuário — onde ele QUER trabalhar.
   * É a única origem realmente correta, e vem do Perfil Profissional (Etapa 2).
   */
  targetCountry?: string | null
  /**
   * País onde a pessoa está, vindo da borda. Palpite razoável enquanto não há
   * alvo declarado: a maioria procura vaga onde mora, mas não todos.
   */
  residenceCountry?: string | null
  /** Idioma da interface. Último recurso, e o mais fraco dos três. */
  language?: Language | null
}

/**
 * O mercado que vale para esta pessoa, nesta operação.
 *
 * A ordem é deliberada e não deve ser afrouxada: alvo declarado > residência >
 * idioma da interface > genérico. O idioma vem por último porque é o sinal que
 * mais engana — interface em português não quer dizer carreira no Brasil.
 *
 * `paymentCountry` NÃO entra nesta função, em nenhuma posição. País de
 * pagamento decide preço; misturá-lo aqui faria um brasileiro pagando em real e
 * mirando Lisboa receber orientação de mercado brasileiro.
 */
export function resolveMarket(input: MarketResolutionInput): MarketResolution {
  const target = normalizeMarketCountry(input.targetCountry)
  if (target) {
    return { market: target === 'GLOBAL' ? GLOBAL_MARKET : marketForCountry(target), source: 'target' }
  }

  const residence = normalizeMarketCountry(input.residenceCountry)
  if (residence && BY_COUNTRY.has(residence)) {
    return { market: BY_COUNTRY.get(residence)!, source: 'residence' }
  }

  if (input.language && MARKET_BY_LANGUAGE[input.language]) {
    return { market: marketById(MARKET_BY_LANGUAGE[input.language]), source: 'language' }
  }

  return { market: GLOBAL_MARKET, source: 'default' }
}

/**
 * O bloco de contexto de mercado injetado nos prompts.
 *
 * É a única forma pela qual regra de mercado chega à IA. Nenhum prompt deve
 * escrever "Gupy" — ou qualquer outro nome de ATS — diretamente: quando o faz,
 * o nome vale para todos os usuários do mundo, que é exatamente o defeito que
 * esta camada corrige.
 */
export function marketPromptContext(market: MarketConfig): string {
  const photo = {
    expected: 'foto é usual e esperada',
    optional: 'foto é tolerada mas não exigida',
    avoid: 'foto NÃO deve ser incluída',
  }[market.resume.photo]

  return `CONTEXTO DE MERCADO (${market.name}):
- ATS predominantes: ${market.ats.join(', ')}.
- Fontes de vagas relevantes: ${market.jobSources.join(', ')}.
- Presença profissional que pesa aqui: ${market.socialPlatforms.join(', ')}.
- Convenção de currículo: até ${market.resume.maxPages} página(s), ${photo}. ${market.resume.personalData}
- Vínculos usuais: ${market.employment.contractTypes.join(', ')}.
- Idioma predominante das vagas: ${market.jobLanguage}. Moeda usual de salário: ${market.salaryCurrency}.

Use estas referências ao recomendar palavras-chave, formato e estratégia. NÃO cite ATS, portais ou convenções de outros mercados.`
}
