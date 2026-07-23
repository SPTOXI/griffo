import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { analyzeResume, TOKEN_COST } from '@/lib/llm'
import { deductCredits, CREDIT_COSTS } from '@/lib/credits'

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

    // Deduct 20 credits for full analysis
    const costCredits = CREDIT_COSTS.full_analysis
    const deduction = await deductCredits(
      user.id,
      costCredits,
      `Análise completa do currículo (${costCredits} cr)`
    )

    if (!deduction.success) {
      return NextResponse.json(
        {
          error: 'Seu saldo Griffo acabou. Continue utilizando a IA adquirindo créditos.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: costCredits,
          currentCredits: deduction.currentBalance,
        },
        { status: 402 }
      )
    }

    let socialLinks = null
    if (resume.socialLinksJson) {
      try {
        socialLinks = JSON.parse(resume.socialLinksJson)
      } catch {}
    }

    // Call LLM via AI Router
    let analysis, tokensIn, tokensOut
    try {
      const r = await analyzeResume(
        resume.originalContent,
        socialLinks,
        resume.socialConsent,
        user.id,
        resume.id
      )
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
        meta: JSON.stringify({ tokensIn, tokensOut, costUsd, creditsDeducted: costCredits }),
      },
    })

    return NextResponse.json({
      analysis,
      resume: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt },
      usage: { tokensIn, tokensOut, costUsd },
      creditsRemaining: deduction.currentBalance,
    })
  } catch (e: any) {
    console.error('analyze error', e)
    return NextResponse.json({ error: 'Erro ao analisar currículo.' }, { status: 500 })
  }
}
