import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, hasActivePlan } from '@/lib/auth'
import { analyzeResume, costPerCycleUsd, TOKEN_COST } from '@/lib/llm'

const schema = z.object({
  resumeId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para analisar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID do currículo inválido.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
    })
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    // Phase-1 plan check: allow free users to analyze one resume as trial? 
    // For simplicity and to drive conversion, require active plan OR allow free users to analyze (1st) but block rewrite.
    // Decision: free users CAN analyze (so they see value), but CANNOT rewrite or download.

    // Call LLM
    let analysis, tokensIn, tokensOut
    try {
      const r = await analyzeResume(resume.originalContent)
      analysis = r.analysis
      tokensIn = r.tokensIn
      tokensOut = r.tokensOut
    } catch (e: any) {
      console.error('LLM analyze error', e)
      const errorMsg = e?.message || 'Falha ao gerar análise. Tente novamente em alguns segundos.'
      return NextResponse.json({ error: errorMsg }, { status: 502 })
    }

    const costIn = (tokensIn / 1000) * TOKEN_COST.inputPer1k
    const costOut = (tokensOut / 1000) * TOKEN_COST.outputPer1k
    const costUsd = costIn + costOut

    const updated = await db.resume.update({
      where: { id: resume.id },
      data: {
        analysisJson: JSON.stringify(analysis),
        status: 'analyzed',
        analysisTokensIn: tokensIn,
        analysisTokensOut: tokensOut,
        analysisCostUsd: costUsd,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'analyze',
        meta: JSON.stringify({ tokensIn, tokensOut, costUsd }),
      },
    })

    return NextResponse.json({
      analysis,
      resume: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt },
      usage: { tokensIn, tokensOut, costUsd },
      planActive: hasActivePlan(user),
    })
  } catch (e: any) {
    console.error('analyze error', e)
    return NextResponse.json({ error: 'Erro ao analisar currículo.' }, { status: 500 })
  }
}
