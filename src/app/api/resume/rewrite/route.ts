export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireUnlockedResume } from '@/lib/entitlements'
import { getRequestLanguage } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { processRewriteJob } from '@/lib/ai-jobs/runners/rewrite'
import { REWRITE_SEGMENT_IDS } from '@/lib/resume-rewrite/segments'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
  targetLang: z.enum(['pt', 'en', 'es', 'de', 'fr', 'it', 'ja', 'nl', 'sv', 'zh', 'ar', 'ko']).optional(),
  targetMarket: z.string().max(10).optional(),
})

/**
 * Abre a reescrita do currículo, em 3 seções paralelas, e responde na hora.
 *
 * Prompt, contexto e persistência movidos para
 * `lib/ai-jobs/runners/rewrite.ts` e `lib/resume-rewrite/segments.ts` — a
 * chamada única de até 8.000 tokens virou três chamadas menores, cada uma uma
 * etapa real de progresso (ver 2.35 na auditoria e a regra em
 * HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento"). A tela
 * acompanha por `GET /api/ai-jobs/status`.
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
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { resumeId, targetLang, targetMarket } = parsed.data

    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: user.id },
      select: { id: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })
    }

    // A reescrita não é cobrada à parte: ela é um dos nove itens da Análise
    // Completa. A única pergunta é se este currículo já foi liberado.
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
        kind: 'rewrite',
        status: { in: ['queued', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })

    if (inFlight) {
      return NextResponse.json({ jobId: inFlight.id, status: inFlight.status }, { status: 202 })
    }

    const effectiveLang = targetLang || getRequestLanguage(req)
    const effectiveCountry = targetMarket || edgeCountry(req)

    const job = await db.aiJob.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        kind: 'rewrite',
        status: 'queued',
        totalSteps: REWRITE_SEGMENT_IDS.length,
        lang: effectiveLang,
        userCountry: effectiveCountry,
      },
      select: { id: true },
    })

    after(() =>
      processRewriteJob(job.id).catch((e) =>
        console.error('[rewrite] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    console.error('rewrite error:', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a reescrita. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const { resumeId, action } = body
    if (!resumeId) return NextResponse.json({ error: 'ID do currículo obrigatório.' }, { status: 400 })

    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })
    }

    if (action === 'reject') {
      await db.resume.update({
        where: { id: resume.id },
        data: { rewrittenContent: null },
      })
    }

    // In both "confirm" and "reject" we return success, "confirm" doesn't strictly need a db change,
    // as it just allows the UI to proceed to the downloads section since the resume already has rewrittenContent.
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('rewrite PATCH error:', e)
    return NextResponse.json({ error: 'Erro ao processar.' }, { status: 500 })
  }
}
