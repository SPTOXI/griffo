import type { AtsCheckResult, AtsIssueCode } from '@/lib/ats-check/score'
import type { HiringAtlas } from '@/lib/hiring-index/atlas'
import { LANGUAGES } from '@/lib/i18n/types'

/**
 * Ferramentas WebMCP do GriffoWork — a parte pura (sem `window`, testável).
 *
 * WebMCP deixa um agente de IA que roda no navegador (Chrome, extensões de
 * assistente) chamar funções da página em vez de clicar nela. O registro em
 * `navigator.modelContext` fica em `components/webmcp/webmcp-tools.tsx`.
 *
 * Regra das ferramentas: só fazem o que um visitante anônimo já faz na tela,
 * pelas MESMAS rotas públicas e com a MESMA cota (o teste ATS continua um por
 * pessoa a cada 24h). Nada pago, nada que exija conta, nenhum dado pessoal sai.
 * O produto pago entra como link no fim da resposta, para o agente apresentar.
 */

export const SITE = 'https://griffo.work'

export const PAGES = ['home', 'ats_check', 'hiring', 'enterprise', 'market_pulse', 'country'] as const
export type GriffoPage = (typeof PAGES)[number]

const PAGE_PATHS: Record<Exclude<GriffoPage, 'country'>, string> = {
  home: '/',
  ats_check: '/ats-check',
  hiring: '/hiring',
  enterprise: '/enterprise',
  market_pulse: '/market-pulse',
}

/** Caminho relativo da página pedida, ou `null` se os parâmetros não fecham. */
export function buildPagePath(page: string, opts: { country?: string; lang?: string } = {}): string | null {
  const lang = opts.lang && (LANGUAGES as string[]).includes(opts.lang) ? opts.lang : null
  let path: string
  if (page === 'country') {
    const cc = (opts.country || '').trim().toLowerCase()
    if (!/^[a-z]{2}$/.test(cc)) return null
    path = `/${cc}`
  } else if (page in PAGE_PATHS) {
    path = PAGE_PATHS[page as keyof typeof PAGE_PATHS]
  } else {
    return null
  }
  return lang ? `${path}?lang=${lang}` : path
}

export const HOW_IT_WORKS = [
  'GriffoWork is an AI career platform for job seekers, available in 12 languages.',
  '',
  'For job seekers:',
  `- Free ATS check (${SITE}/ats-check): shows how an applicant tracking system reads a resume. No sign-up, one per person every 24h.`,
  `- Free preview (${SITE}): after sign-up, scores the resume 0-10 across 8 dimensions (structure, summary, impact, skills, experience, ATS keywords, education, language).`,
  '- Paid full analysis (one purchase per resume): written diagnosis, job-fit comparison, ATS-optimized rewrite, cover letter, career orientation, digital-presence review, job radar with e-mail alerts and PDF downloads. Prices are set per country.',
  `- Just applied to a job? ${SITE}/hiring compares the resume with that job.`,
  '',
  `For companies: Griffo Enterprise (${SITE}/enterprise) scores and ranks applicants against the company's openings and matches employees to internal openings.`,
  '',
  `Public data: hiring-temperature index per country at ${SITE}/market-pulse (CC BY 4.0).`,
].join('\n')

// Em inglês de propósito: quem lê é o agente, que traduz para a pessoa.
const ISSUE_TEXT: Record<AtsIssueCode, string> = {
  no_text: 'No readable text: an ATS sees an empty resume (likely a scanned image).',
  too_short: 'Too short for an ATS to find enough content.',
  too_long: 'Too long: too many words per page.',
  no_email: 'No e-mail address found.',
  no_phone: 'No phone number found.',
  no_experience_section: 'No recognizable work-experience section.',
  no_education_section: 'No recognizable education section.',
  no_skills_section: 'No recognizable skills section.',
  no_dates: 'No dates found for jobs or education.',
  garbled_chars: 'Garbled characters: the PDF text extracts incorrectly.',
  columns_suspected: 'Multi-column layout suspected: an ATS may mix the reading order.',
  no_metrics: 'No numbers or results in the achievements.',
  no_linkedin: 'No LinkedIn profile link.',
  keyword_stuffing: 'A keyword is repeated so often it looks like stuffing.',
  hidden_text_suspected: 'Hidden text suspected (e.g. white text): ATS and recruiters penalize it.',
  invisible_chars: 'Invisible characters inside the text break keyword matching.',
}

/** Texto que o agente recebe depois do teste ATS. */
export function formatAtsResult(r: AtsCheckResult): string {
  const lines = [
    `ATS readability score: ${r.score}/100 (${r.level}).`,
    `Words: ${r.stats.words}, lines: ${r.stats.lines}.`,
  ]
  if (r.issues.length) {
    lines.push('Issues found:')
    for (const i of r.issues) lines.push(`- [${i.severity}] ${ISSUE_TEXT[i.code]}`)
  } else {
    lines.push('No readability issues found.')
  }
  lines.push(
    '',
    `This only checks whether an ATS can read the resume. For content scores in 8 dimensions and an ATS-optimized rewrite, the user can continue at ${SITE}.`
  )
  return lines.join('\n')
}

export const ATS_LIMIT_TEXT =
  `The free ATS check was already used in this browser in the last 24 hours. ` +
  `The user can create a free account at ${SITE} to get the 8-dimension preview.`

/** Resumo de um país do índice de contratação, sem texto de tela traduzido. */
export function formatCountryTemperature(atlas: Pick<HiringAtlas, 'countries'>, country: string): string {
  const cc = country.trim().toUpperCase()
  const s = atlas.countries.find((c) => c.country === cc)
  const link = `${SITE}/market-pulse`
  if (!s || !s.covered) return `No official source covers ${cc} in the hiring index yet. Covered countries: ${link}`
  if (!s.phase) return `${cc} is tracked (${s.sourceName ?? s.source}) but there is not enough history to classify it yet. ${link}`
  return [
    `Hiring temperature for ${cc}: ${s.phase}.`,
    `Compared only with ${cc}'s own history, never ranked against other countries.`,
    `Source: ${s.sourceName ?? s.source}${s.metric ? ` (${s.metric})` : ''}, latest period ${s.latestPeriod ?? 'n/a'}.`,
    `Details: ${link}`,
  ].join('\n')
}
