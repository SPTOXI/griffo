import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { deductCredits, CREDIT_COSTS } from '@/lib/credits'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

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

    const { resumeId } = parsed.data

    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })
    }

    // Deduct 20 credits per full analysis
    const costCredits = CREDIT_COSTS.full_analysis
    const deduction = await deductCredits(
      user.id,
      costCredits,
      `Análise completa em 8 Dimensões (${costCredits} cr)`
    )

    if (!deduction.success) {
      return NextResponse.json(
        {
          error: deduction.error || 'Seu saldo de créditos é insuficiente. Adquira o Plano de Entrada (R$ 9,90) ou recarregue seu saldo para continuar utilizando a IA.',
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: deduction.currentBalance,
        },
        { status: 402 }
      )
    }

    // Execute via AI Router
    const routerResult = await executeAiTask({
      taskType: 'full_analysis',
      userId: user.id,
      userPrompt: `Analise o seguinte currículo em 8 Dimensões executivas:\n${resume.originalContent}`,
      systemPrompt: 'Você é um Consultor Sênior de Carreiras e Especialista em ATS.',
    })

    let analysis: any = null
    try {
      let cleanText = routerResult.content.trim()
      cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim()
      analysis = JSON.parse(cleanText)
    } catch {
      analysis = {
        scoreOverall: 75,
        dimensao1_posicionamento: { score: 75, parecer: routerResult.content },
      }
    }

    const updated = await db.resume.update({
      where: { id: resume.id },
      data: {
        analysisJson: JSON.stringify(analysis),
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'analyze',
        meta: JSON.stringify({ usedModel: routerResult.usedModel, provider: routerResult.usedProvider, costUsd: routerResult.costUsd }),
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
      resume: updated,
      modelUsed: routerResult.usedModel,
      provider: routerResult.usedProvider,
    })
  } catch (e: any) {
    console.error('analyze error', e)
    return NextResponse.json({ error: 'Erro ao analisar currículo.' }, { status: 500 })
  }
}
