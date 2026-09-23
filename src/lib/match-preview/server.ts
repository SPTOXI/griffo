import 'server-only'
import { randomBytes } from 'node:crypto'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'
import { wrapUntrustedDocument } from '../analysis/untrusted'
import { LANGUAGE_DIRECTIVE } from '../i18n/server'
import type { Language } from '../i18n/types'
import {
  applySuggestion,
  parseProfileExtraction,
  PROFILE_EXTRACTION_JSON_SCHEMA,
  profileExtractionSystemPrompt,
} from '../profile/extract'
import { EMPTY_PROFILE } from '../profile'
import { hasMatchableSignal } from '../matching/filters'
import { evaluateOpenJobsForProfile } from '../radar/runner'
import { curate, DEFAULT_RADAR_PREFERENCES } from '../radar/curation'
import { sendEmail } from '../email/send'
import { getAppUrl, getDigestFrom, getDigestReplyTo } from '../env'
import { trackServerEvent } from '../analytics/track.server'
import type { AtsCheckResult } from '../ats-check/score'
import { MAX_STORED_MATCHES, PROCESSING_TIMEOUT_MS, expiresAtFor } from './rules'
import { buildPublicResult, parseStoredMatches, type PublicJobRow, type PublicResult, type StoredMatch } from './result'
import { buildLeadEmail } from './email'

/**
 * O envio de currículo sem conta da landing, do lado do servidor (§2.132).
 *
 * O caminho é: a rota grava a linha com o teste de legibilidade (instantâneo,
 * sem IA) e responde; `processLead` roda depois da resposta, lê o perfil com
 * IA, cruza com as vagas pelo MESMO pipeline do Radar e manda o e-mail. A tela
 * consulta o resultado até ficar pronto.
 */

export function newLeadToken(): string {
  return randomBytes(16).toString('hex')
}

export interface CreateLeadInput {
  id: string
  email: string
  lang: Language
  country: string | null
  ats: AtsCheckResult
  recruiterOptIn: boolean
  /** Só é gravado quando `recruiterOptIn`. */
  resumeText: string
  visitorId: string | null
  ipKey: string | null
}

export async function createLead(input: CreateLeadInput): Promise<void> {
  await db.visitorLead.create({
    data: {
      id: input.id,
      email: input.email,
      lang: input.lang,
      country: input.country,
      atsJson: JSON.stringify(input.ats),
      recruiterOptIn: input.recruiterOptIn,
      resumeText: input.recruiterOptIn ? input.resumeText : null,
      expiresAt: expiresAtFor(input.recruiterOptIn),
      visitorId: input.visitorId,
      ipKey: input.ipKey,
    },
  })
}

/**
 * Lê o perfil, cruza com as vagas e grava o resultado. Nunca lança: a tela
 * depende de `status` sair de `processing`, e uma exceção aqui a deixaria
 * esperando até o tempo limite.
 */
export async function processLead(
  id: string,
  input: {
    text: string
    lang: Language
    country: string | null
    visitorId: string | null
    /** A reserva da cota diária, devolvida se a falha for nossa. */
    claimId: string | null
  }
): Promise<void> {
  try {
    // Currículo sem camada de texto (PDF escaneado) não tem o que ler. O teste
    // de legibilidade já disse isso à pessoa; não se paga IA para repetir.
    if (input.text.trim().length < 30) {
      await db.visitorLead.update({
        where: { id },
        data: { status: 'ready', profileInsufficient: true, matchesJson: '[]' },
      })
      await notifyLead(id)
      return
    }

    const ai = await executeAiTask({
      taskType: 'lead_profile_extraction',
      systemPrompt: profileExtractionSystemPrompt(LANGUAGE_DIRECTIVE[input.lang] ?? LANGUAGE_DIRECTIVE.en),
      userPrompt: wrapUntrustedDocument(input.text.slice(0, 14000), 'currículo do candidato'),
      maxTokens: 1200,
      disableThinking: true,
      jsonSchema: PROFILE_EXTRACTION_JSON_SCHEMA as unknown as Record<string, unknown>,
      modelOverride: 'claude-haiku-4-5',
      userCountry: input.country,
      timeBudgetMs: 45_000,
    })

    const suggestion = parseProfileExtraction(ai.content)
    const { profile } = applySuggestion({ ...EMPTY_PROFILE, residenceCountry: input.country }, suggestion)

    if (!hasMatchableSignal(profile)) {
      await db.visitorLead.update({
        where: { id },
        data: {
          status: 'ready',
          profileJson: JSON.stringify(suggestion),
          profileInsufficient: true,
          matchesJson: '[]',
        },
      })
      await notifyLead(id)
      return
    }

    const { opportunities } = await evaluateOpenJobsForProfile(profile)
    // A mesma régua do Radar (`minimumFit: 'good'`): o que se mostra como
    // "combina com você" é o que o Radar aceitaria avisar. O teto é maior
    // porque aqui é uma lista, não uma interrupção.
    const curated = curate(opportunities, {
      preferences: { ...DEFAULT_RADAR_PREFERENCES, maxPerDigest: MAX_STORED_MATCHES },
    })
    const matches: StoredMatch[] = curated.selected.map((o) => ({
      jobId: o.jobId,
      overall: o.match.overall,
      recommendation: o.match.recommendation,
    }))

    await db.visitorLead.update({
      where: { id },
      data: {
        status: 'ready',
        profileJson: JSON.stringify(suggestion),
        matchesJson: JSON.stringify(matches),
      },
    })

    if (matches.length > 0) {
      await trackServerEvent('lead_matched', {
        visitorId: input.visitorId,
        meta: { matches: matches.length, ...(input.country ? { country: input.country } : {}) },
      })
    }

    await notifyLead(id)
  } catch (e: any) {
    console.error('[match-preview] processamento falhou:', e?.message || e)
    await db.visitorLead
      .update({ where: { id }, data: { status: 'failed', failureCode: 'processing_failed' } })
      .catch(() => {})
    // Falha nossa (IA fora do ar, banco) não pode gastar o único envio grátis
    // do dia: sem isto, o "enviar de novo" da tela bateria no limite.
    if (input.claimId) await db.analyticsEvent.delete({ where: { id: input.claimId } }).catch(() => {})
  }
}

/**
 * O e-mail de resultado. Best-effort: sem chave do Resend, ou com falha no
 * envio, o resultado continua na tela e a linha fica sem `notifiedAt`.
 */
async function notifyLead(id: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  try {
    const lead = await db.visitorLead.findUnique({
      where: { id },
      select: { email: true, lang: true, matchesJson: true, recruiterOptIn: true, notifiedAt: true },
    })
    if (!lead || lead.notifiedAt) return

    const message = buildLeadEmail({
      to: lead.email,
      lang: lead.lang,
      resultUrl: `${getAppUrl()}/?lead=${id}`,
      matches: parseStoredMatches(lead.matchesJson).length,
      recruiterOptIn: lead.recruiterOptIn,
    })
    await sendEmail(message, { apiKey, from: getDigestFrom(), replyTo: getDigestReplyTo() })
    await db.visitorLead.update({ where: { id }, data: { notifiedAt: new Date() } })
  } catch (e: any) {
    console.warn('[match-preview] e-mail de resultado não saiu:', e?.message || e)
  }
}

const PUBLIC_JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  city: true,
  region: true,
  country: true,
  remoteType: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  salaryPeriod: true,
  publishedAt: true,
  applicationUrl: true,
  closedAt: true,
} as const

/** O resultado público, ou `null` quando não existe ou já venceu. */
export async function loadLeadResult(id: string, now: Date = new Date()): Promise<PublicResult | null> {
  const lead = await db.visitorLead.findFirst({ where: { id, expiresAt: { gt: now } } })
  if (!lead) return null

  const timedOut = lead.status === 'processing' && now.getTime() - lead.createdAt.getTime() > PROCESSING_TIMEOUT_MS
  const ids = parseStoredMatches(lead.matchesJson).map((m) => m.jobId)
  const rows: PublicJobRow[] = ids.length
    ? await db.job.findMany({ where: { id: { in: ids } }, select: PUBLIC_JOB_SELECT })
    : []

  return buildPublicResult(
    {
      status: timedOut ? 'failed' : lead.status,
      failureCode: timedOut ? 'timeout' : lead.failureCode,
      atsJson: lead.atsJson,
      matchesJson: lead.matchesJson,
      profileInsufficient: lead.profileInsufficient,
      recruiterOptIn: lead.recruiterOptIn,
      expiresAt: lead.expiresAt,
    },
    new Map(rows.map((r) => [r.id, r]))
  )
}

/** Apaga o que venceu. É a metade física da promessa de 24 horas. */
export async function purgeExpiredVisitorLeads(now: Date = new Date()): Promise<number> {
  const r = await db.visitorLead.deleteMany({ where: { expiresAt: { lt: now } } })
  return r.count
}
