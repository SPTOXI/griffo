export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { buildJobFit } from '@/lib/matching/job-fit'
import { fromRecord as profileFromRecord } from '@/lib/profile'
import { summarizeDigest } from '@/lib/radar/curation'
import type { MatchResult } from '@/lib/matching/compatibility'
import type { NormalizedJob } from '@/lib/jobs/types'

/**
 * As oportunidades que o Radar separou para este usuário.
 *
 * Lê `RadarAlert`, e NÃO recalcula o match. O veredito gravado é o que motivou
 * o alerta; recalcular na leitura mostraria um resultado diferente do que a
 * pessoa foi avisada — o perfil dela pode ter mudado no meio — e tornaria
 * impossível auditar por que aquele aviso saiu.
 *
 * Isolamento por usuário é estrutural: a consulta sempre parte do `userId` da
 * sessão. Não há parâmetro por onde pedir o alerta de outra pessoa.
 */

function list(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function jobFromRow(row: any): NormalizedJob {
  return {
    sourceJobId: row.sourceJobId,
    company: row.company,
    companyKey: row.companyKey,
    title: row.title,
    normalizedTitle: row.normalizedTitle,
    country: row.country,
    region: row.region,
    city: row.city,
    remoteType: row.remoteType,
    market: row.market,
    employmentType: row.employmentType,
    seniority: row.seniority,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    salaryPeriod: row.salaryPeriod,
    description: row.description,
    requirements: list(row.requirements),
    skills: list(row.skills),
    language: row.language,
    applicationUrl: row.applicationUrl,
    dedupeKey: row.dedupeKey,
    publishedAt: row.publishedAt,
    unknownFields: {},
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const [alerts, profileRow] = await Promise.all([
    db.radarAlert.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
      include: { job: true },
    }),
    db.professionalProfile.findUnique({ where: { userId: user.id } }),
  ])

  const profile = profileFromRecord(profileRow)

  const opportunities = alerts.map((alert) => {
    let match: MatchResult | null = null
    try {
      match = JSON.parse(alert.matchJson)
    } catch {
      match = null
    }

    const job = jobFromRow(alert.job)

    return {
      alertId: alert.id,
      jobId: alert.jobId,
      applicationUrl: alert.job.applicationUrl,
      createdAt: alert.createdAt,
      seenAt: alert.seenAt,
      feedback: alert.feedback,
      // Sem o match gravado não há Job Fit — e a tela mostra a ausência em vez
      // de reconstruir um veredito que não foi o que motivou o alerta.
      fit: match ? buildJobFit(job, match, profile) : null,
    }
  })

  const digest = summarizeDigest(
    alerts
      .map((a) => {
        try {
          return { job: null, jobId: a.jobId, match: JSON.parse(a.matchJson) as MatchResult }
        } catch {
          return null
        }
      })
      .filter((o): o is { job: null; jobId: string; match: MatchResult } => o !== null)
  )

  return NextResponse.json({
    opportunities,
    digest,
    unseen: alerts.filter((a) => !a.seenAt).length,
    hasProfile: Boolean(profileRow),
  })
}

const actionSchema = z.object({
  alertId: z.string().min(1),
  action: z.enum(['seen', 'clicked', 'feedback']),
  feedback: z.enum(['interested', 'not_useful']).optional(),
  reason: z
    .enum(['wrong_role', 'location', 'salary', 'seniority', 'skills', 'company', 'work_mode', 'other'])
    .optional(),
})

/**
 * Marca visto/clique e registra o feedback do §30.
 *
 * O prompt é explícito sobre o limite: o feedback "pode melhorar o perfil do
 * usuário e o sistema de matching", mas "NÃO usar feedback para alterar
 * silenciosamente o perfil sem transparência".
 *
 * Por isso ele é gravado no alerta e não escrito de volta no
 * `ProfessionalProfile`. Quando o produto for sugerir um ajuste de preferência
 * a partir de rejeições repetidas — o §31 —, a sugestão é feita ao usuário, e
 * quem altera o perfil é ele.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
  }

  const { alertId, action, feedback, reason } = parsed.data

  // A cláusula `userId` é o isolamento: um alerta de outra pessoa não é
  // encontrado, e a resposta é a mesma de um alerta inexistente.
  const alert = await db.radarAlert.findFirst({ where: { id: alertId, userId: user.id }, select: { id: true } })
  if (!alert) return NextResponse.json({ error: 'Oportunidade não encontrada.' }, { status: 404 })

  const now = new Date()
  const data =
    action === 'seen'
      ? { seenAt: now }
      : action === 'clicked'
        ? { clickedAt: now, seenAt: now }
        : { feedback: feedback ?? null, feedbackReason: reason ?? null, feedbackAt: now, seenAt: now }

  await db.radarAlert.update({ where: { id: alertId }, data })

  return NextResponse.json({ ok: true })
}
