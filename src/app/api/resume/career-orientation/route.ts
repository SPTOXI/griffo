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
import { processCareerOrientationJob } from '@/lib/ai-jobs/runners/career-orientation'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
})

/**
 * Agente de Orientação Vocacional e Transição de Carreira.
 *
 * Abre o job e responde na hora — a tela acompanha por
 * `GET /api/ai-jobs/status`, com progresso real em vez do spinner com aviso
 * de tempo que existia antes (ver `lib/ai-jobs/runners/career-orientation.ts`
 * e a regra em HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento").
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
      select: { id: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    // A orientação profissional é um dos nove itens da Análise Completa, e não
    // um produto à parte com preço próprio.
    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    const inFlight = await db.aiJob.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        kind: 'career_orientation',
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
        kind: 'career_orientation',
        status: 'queued',
        totalSteps: 4,
        lang: getRequestLanguage(req),
        userCountry: edgeCountry(req),
      },
      select: { id: true },
    })

    after(() =>
      processCareerOrientationJob(job.id).catch((e) =>
        console.error('[career-orientation] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    console.error('Error opening career orientation job:', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o diagnóstico. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
