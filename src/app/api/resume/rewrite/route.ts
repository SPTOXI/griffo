import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { deductCredits, refundCredits, CREDIT_COSTS } from '@/lib/credits'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

export async function POST(req: Request) {
  let deducted = false
  const costCredits = CREDIT_COSTS.rewrite_experience

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

    // Deduct 10 credits per experience rewrite
    const deduction = await deductCredits(
      user.id,
      costCredits,
      `Reescrita de currículo em fórmula STAR/XYZ (${costCredits} cr)`
    )

    if (!deduction.success) {
      return NextResponse.json(
        {
          error: deduction.error || 'Seu saldo de créditos é insuficiente. Adquira o Plano de Entrada (R$ 9,90) ou recarregue seu saldo para continuar utilizando a IA.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: costCredits,
          currentCredits: deduction.currentBalance,
        },
        { status: 402 }
      )
    }

    deducted = true

    // Execute via AI Router
    const routerResult = await executeAiTask({
      taskType: 'rewrite',
      userId: user.id,
      userPrompt: `Reescreva o seguinte currículo aplicando a fórmula STAR (Situação, Tarefa, Ação, Resultado) e a fórmula Google XYZ mantendo 100% de veracidade dos fatos:\n${resume.originalContent}`,
      systemPrompt: 'Você é um Redator Executivo Sênior especialista em currículos de alto impacto.',
    })

    const updated = await db.resume.update({
      where: { id: resume.id },
      data: {
        rewrittenContent: routerResult.content,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'rewrite',
        meta: JSON.stringify({ usedModel: routerResult.usedModel, provider: routerResult.usedProvider, costUsd: routerResult.costUsd }),
      },
    })

    return NextResponse.json({
      success: true,
      rewrittenContent: routerResult.content,
      resume: updated,
      modelUsed: routerResult.usedModel,
      provider: routerResult.usedProvider,
    })
  } catch (e: any) {
    console.error('rewrite error', e)
    if (deducted) {
      try {
        const user = await getCurrentUser()
        if (user) {
          const refundRes = await refundCredits(user.id, costCredits, `Falha na IA: ${e?.message || 'Erro de execução'}`)
          return NextResponse.json(
            {
              error: `Ocorreu uma falha durante o processamento da IA (${e?.message || 'Erro de conexão'}). Seus ${costCredits} créditos foram REEMBOLSADOS automaticamente!`,
              refunded: true,
              currentBalance: refundRes.newBalance,
            },
            { status: 500 }
          )
        }
      } catch (refundErr) {
        console.error('Failed to refund credits:', refundErr)
      }
    }
    return NextResponse.json({ error: e?.message || 'Erro ao reescrever currículo.' }, { status: 500 })
  }
}
