export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getRequestLanguage } from '@/lib/i18n/server'
import { requireUnlockedResume } from '@/lib/entitlements'
import { edgeCountry } from '@/lib/pricing/resolve'
import { processInterviewPrepJob } from '@/lib/ai-jobs/runners/interview-prep'

const schema = z.object({
  alertId: z.string().min(1, 'Alerta obrigatório.'),
  /** Currículo a considerar. Sem ele, o mais recente. */
  resumeId: z.string().min(1).optional(),
})

/**
 * Abre a ação `interview_prep` já declarada em `lib/matching/job-fit.ts`
 * (rótulo existia, geração nunca tinha sido implementada).
 *
 * Grátis para quem já desbloqueou o currículo — mesmo padrão de
 * `career_orientation`/`cover_letter`: um dos itens que a Análise Completa
 * entrega, não um produto à parte.
 *
 * Gerado uma vez por (usuário, vaga) e cacheado em
 * `RadarAlert.interviewPrepJson`: se já existe, a resposta vem síncrona,
 * dentro de um `AiJob` já criado como `completed` — o que mantém
 * `useAiJob`/`GET /api/ai-jobs/status` (genéricos, usados por toda a família
 * de jobs) sem precisar saber que este caminho existe.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    // O alerta precisa ser DESTE usuário — mesmo motivo de `radar/prepare.ts`:
    // um id adivinhado não pode ler a vaga recomendada a outra pessoa.
    const alert = await db.radarAlert.findFirst({
      where: { id: parsed.data.alertId, userId: user.id },
      select: { id: true, interviewPrepJson: true },
    })
    if (!alert) {
      return NextResponse.json({ error: 'Oportunidade não encontrada.' }, { status: 404 })
    }

    const resume = parsed.data.resumeId
      ? await db.resume.findFirst({ where: { id: parsed.data.resumeId, userId: user.id }, select: { id: true } })
      : await db.resume.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })

    if (!resume) {
      return NextResponse.json(
        { error: 'Você ainda não enviou um currículo. Envie um e depois volte para se preparar para esta vaga.', code: 'no_resume' },
        { status: 409 }
      )
    }

    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    // Já gerado para esta vaga: cria o job já concluído, para que o cliente
    // continue chamando `useAiJob.start()` normalmente — sem chamar a IA de
    // novo, sem round-trip de polling.
    if (alert.interviewPrepJson) {
      const job = await db.aiJob.create({
        data: {
          userId: user.id,
          resumeId: resume.id,
          kind: 'interview_prep',
          status: 'completed',
          totalSteps: 1,
          resultJson: JSON.stringify({ interviewPrep: JSON.parse(alert.interviewPrepJson) }),
          finishedAt: new Date(),
          lang: getRequestLanguage(req),
          userCountry: edgeCountry(req),
        },
        select: { id: true },
      })
      return NextResponse.json({ jobId: job.id, status: 'completed' })
    }

    const inFlight = await db.aiJob.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        kind: 'interview_prep',
        status: { in: ['queued', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })
    if (inFlight) {
      return NextResponse.json({ jobId: inFlight.id, status: inFlight.status }, { status: 202 })
    }

    const job = await db.aiJob.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        kind: 'interview_prep',
        status: 'queued',
        totalSteps: 4,
        inputJson: JSON.stringify({ alertId: alert.id }),
        lang: getRequestLanguage(req),
        userCountry: edgeCountry(req),
      },
      select: { id: true },
    })

    after(() =>
      processInterviewPrepJob(job.id).catch((e) =>
        console.error('[interview-prep] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    console.error('[radar/interview-prep]', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível preparar as perguntas de entrevista agora.' },
      { status: 500 }
    )
  }
}
