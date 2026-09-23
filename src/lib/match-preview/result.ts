import type { AtsLevel } from '../ats-check/score'
import type { OverallFit, Recommendation } from '../matching/compatibility'
import { safeHttpUrl } from '../safe-url'
import { FREE_OPPORTUNITIES, teaserFrom, type Teaser } from './rules'

/**
 * O que a tela recebe — e, principalmente, o que ela NÃO recebe.
 *
 * A lista trancada é trancada aqui, no servidor, e não com CSS: a resposta
 * leva a vaga grátis inteira e, das outras, só a contagem. Esconder na tela o
 * que já veio no JSON seria entregar a lista a qualquer um que abra o
 * inspetor do navegador.
 *
 * Também não saem `evidence` nem `gaps` do `MatchResult`: são frases em
 * português (o produto tem 12 idiomas) e as lacunas são exatamente o
 * diagnóstico que se vende (decisão 5 do §2.132).
 */

export interface StoredMatch {
  jobId: string
  overall: OverallFit
  recommendation: Recommendation
}

export interface PublicJobRow {
  id: string
  title: string
  company: string
  city: string | null
  region: string | null
  country: string | null
  remoteType: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  salaryPeriod: string | null
  publishedAt: Date | null
  applicationUrl: string
  closedAt: Date | null
}

export interface PublicOpportunity {
  title: string
  company: string
  city: string | null
  region: string | null
  country: string | null
  remoteType: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  salaryPeriod: string | null
  publishedAt: string | null
  applicationUrl: string
  overall: OverallFit
}

export type PublicStatus = 'processing' | 'ready' | 'failed'

export interface PublicResult {
  status: PublicStatus
  failureCode: string | null
  ats: { score: number; level: AtsLevel }
  teaser: Teaser
  /** O currículo não trouxe cargo, área nem competências para comparar. */
  profileInsufficient: boolean
  totalMatches: number
  free: PublicOpportunity[]
  lockedCount: number
  /** Quantas das trancadas são de alta compatibilidade — número, sem nome. */
  lockedStrong: number
  recruiterOptIn: boolean
  expiresAt: string
}

export interface LeadForResult {
  status: string
  failureCode: string | null
  atsJson: string
  matchesJson: string | null
  profileInsufficient: boolean
  recruiterOptIn: boolean
  expiresAt: Date
}

export function parseStoredMatches(raw: string | null): StoredMatch[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is StoredMatch =>
        m && typeof m.jobId === 'string' && typeof m.overall === 'string' && typeof m.recommendation === 'string'
    )
  } catch {
    return []
  }
}

function toPublic(row: PublicJobRow, overall: OverallFit): PublicOpportunity {
  return {
    title: row.title,
    company: row.company,
    city: row.city,
    region: row.region,
    country: row.country,
    remoteType: row.remoteType,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    salaryPeriod: row.salaryPeriod,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    applicationUrl: safeHttpUrl(row.applicationUrl)!,
    overall,
  }
}

/**
 * Monta a resposta pública.
 *
 * `jobs` traz as linhas ainda existentes das vagas guardadas. Vaga que sumiu
 * (expurgo) ou fechou depois do envio sai da conta: a grátis passa a ser a
 * próxima ainda aberta, e a contagem trancada não promete vaga que não existe
 * mais.
 */
export function buildPublicResult(lead: LeadForResult, jobs: Map<string, PublicJobRow>): PublicResult {
  const ats = JSON.parse(lead.atsJson) as { score: number; level: AtsLevel; issues: { code: any; severity: any }[] }
  // Vaga sem link http(s) válido não tem como ser aberta pela pessoa, e o link
  // vai para um `href`: fica de fora como se tivesse fechado.
  const stillOpen = parseStoredMatches(lead.matchesJson).filter((m) => {
    const row = jobs.get(m.jobId)
    return row && !row.closedAt && safeHttpUrl(row.applicationUrl) !== null
  })

  const free = stillOpen.slice(0, FREE_OPPORTUNITIES).map((m) => toPublic(jobs.get(m.jobId)!, m.overall))
  const locked = stillOpen.slice(FREE_OPPORTUNITIES)

  return {
    status: (['processing', 'ready', 'failed'] as const).includes(lead.status as PublicStatus)
      ? (lead.status as PublicStatus)
      : 'failed',
    failureCode: lead.failureCode,
    ats: { score: ats.score, level: ats.level },
    teaser: teaserFrom(ats),
    profileInsufficient: lead.profileInsufficient,
    totalMatches: stillOpen.length,
    free,
    lockedCount: locked.length,
    lockedStrong: locked.filter((m) => m.overall === 'strong').length,
    recruiterOptIn: lead.recruiterOptIn,
    expiresAt: lead.expiresAt.toISOString(),
  }
}
