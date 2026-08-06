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
  let userId: string | undefined = undefined
  const costCredits = CREDIT_COSTS.rewrite_experience

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }
    userId = user.id

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

    // Extract ATS keywords from analysis if present
    let keywordsHint = ''
    if (resume.analysisJson) {
      try {
        const parsedAnalysis = JSON.parse(resume.analysisJson)
        if (Array.isArray(parsedAnalysis.keywords) && parsedAnalysis.keywords.length > 0) {
          keywordsHint = `\n\nPalavras-Chave Estratégicas (ATS) obrigatórias a serem incorporadas organicamente na reescrita: ${parsedAnalysis.keywords.join(', ')}.`
        }
      } catch {}
    }

    // Execute via AI Router
    const routerResult = await executeAiTask({
      taskType: 'rewrite',
      userId: user.id,
      systemPrompt: 'Você é um Redator Executivo Sênior especialista em currículos de alto impacto e otimização para sistemas ATS (Gupy, LinkedIn, Workday, Greenhouse). Sua função é reescrever o currículo COMPLETO de ponta a ponta sem cortar nada, utilizando marcações Markdown perfeitamente estruturadas (títulos H1/H2, marcadores de lista, negritos). Responda sempre em Português (pt-BR).',
      userPrompt: `REESCREVA O CURRÍCULO COMPLETO DO INÍCIO AO FIM SEM OMITIR NEM SINTETIZAR NENHUMA SEÇÃO OU EXPERIÊNCIA.

Diretrizes Obrigatórias:
1. Reescreva TODAS as seções presentes no currículo original: Dados Pessoais/Cabeçalho, Resumo Profissional, TODAS as Experiências Profissionais completas (com empresas, cargos, datas), Formação Acadêmica, Habilidades Técnicas/Comportamentais, Idiomas e Certificações.
2. Aplique a metodologia STAR (Situação, Tarefa, Ação, Resultado) e a fórmula Google XYZ (Conseguiu [X], medido por [Y], fazendo [Z]) em cada experiência profissional.
3. Mantenha 100% da veracidade dos fatos originais.${keywordsHint}
4. Estruture a resposta usando formatação Markdown rica (títulos '# ' e '## ', marcadores '- ', negritos '**').

Currículo Original Completo para Reescrita:
${resume.originalContent}`,
      maxTokens: 8000,
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
    console.error('rewrite error:', e?.diagnostic || e?.message || e)
    if (deducted && userId) {
      try {
        const refundRes = await refundCredits(userId, costCredits, 'Falha no processamento de IA')
        return NextResponse.json(
          {
            error: `Ocorreu uma falha durante o processamento da IA. Seus ${costCredits} créditos foram REEMBOLSADOS automaticamente!`,
            refunded: true,
            currentBalance: refundRes.currentBalance,
          },
          { status: 500 }
        )
      } catch (refundErr) {
        console.error('Failed to refund credits:', refundErr)
      }
    }
    return NextResponse.json({ error: 'Ocorreu um erro ao reescrever o currículo. Tente novamente em instantes.' }, { status: 500 })
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
