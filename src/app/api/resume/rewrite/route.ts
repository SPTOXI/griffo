import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, hasActivePlan } from '@/lib/auth'
import { rewriteResume, TOKEN_COST } from '@/lib/llm'

const schema = z.object({
  resumeId: z.string().min(1),
  authorized: z.boolean().refine(v => v === true, 'Autorização necessária para reescrever.'),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para reescrever.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }

    // Rewriting requires an active plan (paid). Free users can analyze but not rewrite.
    if (!hasActivePlan(user)) {
      return NextResponse.json({ error: 'Assine um plano para reescrever seu currículo.', code: 'PLAN_REQUIRED' }, { status: 403 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
    })
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }
    if (!resume.analysisJson) {
      return NextResponse.json({ error: 'Analise o currículo antes de reescrever.' }, { status: 400 })
    }

    let content, tokensIn, tokensOut
    try {
      const r = await rewriteResume(resume.originalContent, resume.analysisJson)
      content = r.content
      tokensIn = r.tokensIn
      tokensOut = r.tokensOut
    } catch (e: any) {
      console.error('LLM rewrite error', e)
      return NextResponse.json({ error: 'Falha ao reescrever. Tente novamente.' }, { status: 502 })
    }

    const costIn = (tokensIn / 1000) * TOKEN_COST.inputPer1k
    const costOut = (tokensOut / 1000) * TOKEN_COST.outputPer1k
    const costUsd = costIn + costOut

    const updated = await db.resume.update({
      where: { id: resume.id },
      data: {
        rewrittenContent: content,
        status: 'rewritten',
        rewriteTokensIn: tokensIn,
        rewriteTokensOut: tokensOut,
        rewriteCostUsd: costUsd,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'rewrite',
        meta: JSON.stringify({ tokensIn, tokensOut, costUsd }),
      },
    })

    return NextResponse.json({
      content,
      resume: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt },
      usage: { tokensIn, tokensOut, costUsd },
    })
  } catch (e: any) {
    console.error('rewrite error', e)
    return NextResponse.json({ error: 'Erro ao reescrever.' }, { status: 500 })
  }
}

// PATCH to confirm/cancel rewrite
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const body = await req.json()
    const { resumeId, action } = body as { resumeId: string; action: 'confirm' | 'reject' }
    if (!resumeId || !action) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const resume = await db.resume.findFirst({ where: { id: resumeId, userId: user.id } })
    if (!resume) return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })

    const newStatus = action === 'confirm' ? 'confirmed' : 'analyzed'
    const updated = await db.resume.update({
      where: { id: resume.id },
      data: { status: newStatus },
    })

    await db.auditLog.create({
      data: { userId: user.id, resumeId: resume.id, action: action === 'confirm' ? 'rewrite_confirmed' : 'rewrite_rejected' },
    })

    return NextResponse.json({ resume: { id: updated.id, status: updated.status } })
  } catch (e: any) {
    console.error('rewrite patch error', e)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }
}
