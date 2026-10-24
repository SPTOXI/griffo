import 'server-only'
import { ATS_CHECK_COPY } from '@/lib/ats-check/copy'
import { percentileBelow } from '@/lib/analytics/social-proof'
import { loadAtsScoreDistribution } from '@/lib/analytics/social-proof.server'
import { randomBytes } from 'node:crypto'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'
import { wrapUntrustedDocument } from '../analysis/untrusted'
import { LANGUAGE_DIRECTIVE } from '../i18n/server'
import { LANGUAGES, type Language } from '../i18n/types'
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
import { MAX_STORED_MATCHES, PROCESSING_TIMEOUT_MS, expiresAtFor, nurtureAt, teaserFrom, type NurtureStep } from './rules'
import { buildPublicResult, parseStoredMatches, type PublicJobRow, type PublicResult, type StoredMatch } from './result'
import { buildLeadEmail } from './email'
import { buildNurtureEmail } from './nurture-email'
import { leadClickUrl } from './links'

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
  /** Pediu vagas e dicas por e-mail: entra na sequência de `sendDueNurtureEmails`. */
  marketingOptIn: boolean
  /** Só é gravado quando `recruiterOptIn`. */
  resumeText: string
  visitorId: string | null
  ipKey: string | null
}

export async function createLead(input: CreateLeadInput): Promise<void> {
  const now = new Date()
  await db.visitorLead.create({
    data: {
      id: input.id,
      email: input.email,
      lang: input.lang,
      country: input.country,
      atsJson: JSON.stringify(input.ats),
      recruiterOptIn: input.recruiterOptIn,
      marketingOptIn: input.marketingOptIn,
      nurtureNextAt: input.marketingOptIn ? nurtureAt(1, now) : null,
      resumeText: input.recruiterOptIn ? input.resumeText : null,
      expiresAt: expiresAtFor(input.recruiterOptIn, now, input.marketingOptIn),
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
      select: {
        email: true,
        lang: true,
        matchesJson: true,
        recruiterOptIn: true,
        marketingOptIn: true,
        notifiedAt: true,
        atsJson: true,
        visitorId: true,
      },
    })
    if (!lead || lead.notifiedAt) return

    const message = buildLeadEmail({
      to: lead.email,
      lang: lead.lang,
      resultUrl: leadClickUrl(getAppUrl(), id, 'result'),
      matches: parseStoredMatches(lead.matchesJson).length,
      issue: revealedIssueFor(lead.atsJson, lead.lang),
      recruiterOptIn: lead.recruiterOptIn,
      marketingOptIn: lead.marketingOptIn,
    })
    await sendEmail(message, { apiKey, from: getDigestFrom(), replyTo: getDigestReplyTo() })
    await db.visitorLead.update({ where: { id }, data: { notifiedAt: new Date() } })
    await trackServerEvent('lead_email_sent', { visitorId: lead.visitorId, meta: { step: 'result' } })
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

/** Título e motivo do problema mais grave, no idioma do lead. `null` sem problema. */
function revealedIssueFor(atsJson: string, langRaw: string): { title: string; why: string } | null {
  try {
    const code = teaserFrom(JSON.parse(atsJson)).revealed
    if (!code) return null
    const lang: Language = (LANGUAGES as string[]).includes(langRaw) ? (langRaw as Language) : 'en'
    return ATS_CHECK_COPY[lang].issues[code]
  } catch {
    return null
  }
}

/** O resultado público, ou `null` quando não existe ou já venceu. */
export async function loadLeadResult(id: string, now: Date = new Date()): Promise<PublicResult | null> {
  const lead = await db.visitorLead.findFirst({ where: { id, expiresAt: { gt: now } } })
  if (!lead) return null

  const timedOut = lead.status === 'processing' && now.getTime() - lead.createdAt.getTime() > PROCESSING_TIMEOUT_MS
  const ids = parseStoredMatches(lead.matchesJson).map((m) => m.jobId)
  const rows: PublicJobRow[] = ids.length
    ? await db.job.findMany({ where: { id: { in: ids } }, select: PUBLIC_JOB_SELECT })
    : []

  const result = buildPublicResult(
    {
      status: timedOut ? 'failed' : lead.status,
      failureCode: timedOut ? 'timeout' : lead.failureCode,
      atsJson: lead.atsJson,
      matchesJson: lead.matchesJson,
      profileInsufficient: lead.profileInsufficient,
      recruiterOptIn: lead.recruiterOptIn,
      marketingOptIn: lead.marketingOptIn && !lead.unsubscribedAt,
      expiresAt: lead.expiresAt,
    },
    new Map(rows.map((r) => [r.id, r]))
  )
  // O texto do problema revelado sai pronto, no idioma do envio: a tela não
  // precisa carregar o dicionário inteiro do teste ATS (12 idiomas).
  const code = result.teaser.revealed
  const lang: Language = (LANGUAGES as string[]).includes(lead.lang) ? (lead.lang as Language) : 'en'
  const percentile = percentileBelow(await loadAtsScoreDistribution().catch(() => []), result.ats.score)
  return { ...result, revealedIssue: code ? ATS_CHECK_COPY[lang].issues[code] : null, percentile }
}

/** Apaga o que venceu. É a metade física da promessa de 24 horas. */
export async function purgeExpiredVisitorLeads(now: Date = new Date()): Promise<number> {
  const r = await db.visitorLead.deleteMany({ where: { expiresAt: { lt: now } } })
  return r.count
}

/**
 * Cruza o perfil guardado com as vagas abertas de novo. Sem IA: é o mesmo
 * pipeline do Radar, só regras. Devolve as oportunidades na ordem de exibição.
 */
async function rematchLead(profileJson: string, country: string | null): Promise<StoredMatch[]> {
  const suggestion = parseProfileExtraction(profileJson)
  const { profile } = applySuggestion({ ...EMPTY_PROFILE, residenceCountry: country }, suggestion)
  if (!hasMatchableSignal(profile)) return []
  const { opportunities } = await evaluateOpenJobsForProfile(profile)
  const curated = curate(opportunities, {
    preferences: { ...DEFAULT_RADAR_PREFERENCES, maxPerDigest: MAX_STORED_MATCHES },
  })
  return curated.selected.map((o) => ({ jobId: o.jobId, overall: o.match.overall, recommendation: o.match.recommendation }))
}

/** Por rodada do cron. O resto fica para a hora seguinte. */
const NURTURE_BATCH = 15

/**
 * A sequência de e-mails para quem pediu vagas e dicas (dias 1, 3 e 7). Roda
 * de hora em hora junto com a purga. Desliga com `LEAD_NURTURE_ENABLED=false`.
 *
 * Um passo que não tem o que dizer é pulado, não enviado vazio: sem problema
 * no currículo não há dica do dia 1; sem perfil legível não há vagas no dia 3.
 */
export async function sendDueNurtureEmails(now: Date = new Date()): Promise<{ sent: number; skipped: number }> {
  if (process.env.LEAD_NURTURE_ENABLED?.trim() === 'false') return { sent: 0, skipped: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { sent: 0, skipped: 0 }

  const due = await db.visitorLead.findMany({
    where: {
      marketingOptIn: true,
      unsubscribedAt: null,
      status: 'ready',
      nurtureNextAt: { lte: now },
      expiresAt: { gt: now },
    },
    orderBy: { nurtureNextAt: 'asc' },
    take: NURTURE_BATCH,
  })

  let sent = 0
  let skipped = 0
  for (const lead of due) {
    const step = (lead.nurtureStep + 1) as NurtureStep
    try {
      const appUrl = getAppUrl()
      const base = {
        to: lead.email,
        lang: lead.lang,
        step,
        resultUrl: leadClickUrl(appUrl, lead.id, `nurture${step}`),
        unsubscribeUrl: `${appUrl}/api/public/lead-unsubscribe?t=${lead.id}`,
      }
      let message: ReturnType<typeof buildNurtureEmail> | null = null

      if (step === 1) {
        const teaser = teaserFrom(JSON.parse(lead.atsJson))
        if (teaser.revealed) {
          message = buildNurtureEmail({ ...base, issue: revealedIssueFor(lead.atsJson, lead.lang), moreIssues: teaser.total - 1 })
        }
      } else if (step === 2) {
        if (lead.profileJson && !lead.profileInsufficient) {
          const known = parseStoredMatches(lead.matchesJson)
          const knownIds = new Set(known.map((m) => m.jobId))
          const current = await rematchLead(lead.profileJson, lead.country)
          const fresh = current.filter((m) => !knownIds.has(m.jobId))
          if (current.length > 0) {
            // As novas entram no fim da lista guardada: a tela passa a mostrá-las.
            const merged = [...known, ...fresh].slice(0, MAX_STORED_MATCHES)
            await db.visitorLead.update({ where: { id: lead.id }, data: { matchesJson: JSON.stringify(merged) } })
            message = buildNurtureEmail({ ...base, newJobs: fresh.length, openJobs: current.length })
          }
        }
      } else {
        message = buildNurtureEmail(base)
      }

      if (message) {
        await sendEmail(message, { apiKey, from: getDigestFrom(), replyTo: getDigestReplyTo() })
        await trackServerEvent('lead_email_sent', { visitorId: lead.visitorId, meta: { step: `nurture${step}` } })
        sent++
      } else {
        skipped++
      }
      await db.visitorLead.update({
        where: { id: lead.id },
        data: { nurtureStep: step, nurtureNextAt: nurtureAt(step + 1, lead.createdAt) },
      })
    } catch (e: any) {
      // Falha de envio: fica para a próxima rodada, sem avançar o passo.
      console.warn('[match-preview] e-mail da sequência não saiu:', e?.message || e)
    }
  }
  return { sent, skipped }
}

/**
 * Sai da sequência. Quem não pediu para guardar o currículo tem os dados
 * apagados na hora: eles só existiam para os e-mails.
 */
export async function unsubscribeLead(id: string, now: Date = new Date()): Promise<boolean> {
  const lead = await db.visitorLead.findUnique({ where: { id }, select: { recruiterOptIn: true } })
  if (!lead) return false
  if (lead.recruiterOptIn) {
    await db.visitorLead.update({ where: { id }, data: { unsubscribedAt: now, nurtureNextAt: null, marketingOptIn: false } })
  } else {
    await db.visitorLead.delete({ where: { id } })
  }
  return true
}
