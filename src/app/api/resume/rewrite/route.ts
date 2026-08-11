export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import {
  reserveCredits,
  settleReservation,
  releaseReservation,
  CREDIT_COSTS,
  type CreditReservation,
} from '@/lib/credits'
import { getRequestLanguage, LANGUAGE_DIRECTIVE, ATS_BY_MARKET } from '@/lib/i18n/server'
import { getRequestCountry } from '@/lib/currency'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

// A análise já corta a entrada em 15.000 caracteres; a reescrita enviava o
// currículo inteiro. Como o upload não impõe teto de tamanho, um documento
// muito grande fazia o custo e o tempo desta rota crescerem sem limite.
const REWRITE_INPUT_LIMIT = 20000

export async function POST(req: Request) {
  let reservation: CreditReservation | null = null
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
    // Reserva em vez de debitar: o crédito só vira cobrança definitiva
    // depois que a entrega confirma. Ver lib/credits.ts.
    const deduction = await reserveCredits(
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

    reservation = deduction.reservation

    const lang = getRequestLanguage(req)

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
      userCountry: getRequestCountry(req),
      systemPrompt: `${LANGUAGE_DIRECTIVE[lang]}\n\nVocê é um Redator Executivo Sênior especialista em currículos de alto impacto e otimização para sistemas ATS (${ATS_BY_MARKET[lang]}). Sua função é reescrever o currículo COMPLETO de ponta a ponta sem cortar nada, utilizando marcações Markdown perfeitamente estruturadas (títulos H1/H2, marcadores de lista, negritos).`,
      userPrompt: `REESCREVA O CURRÍCULO COMPLETO DO INÍCIO AO FIM SEM OMITIR NEM SINTETIZAR NENHUMA SEÇÃO OU EXPERIÊNCIA.

Diretrizes Obrigatórias:
1. Reescreva TODAS as seções presentes no currículo original: Dados Pessoais/Cabeçalho, Resumo Profissional, TODAS as Experiências Profissionais completas (com empresas, cargos, datas), Formação Acadêmica, Habilidades Técnicas/Comportamentais, Idiomas e Certificações.
2. Aplique a metodologia STAR (Situação, Tarefa, Ação, Resultado) e a fórmula Google XYZ (Conseguiu [X], medido por [Y], fazendo [Z]) em cada experiência profissional.
3. Mantenha 100% da veracidade dos fatos originais.${keywordsHint}
4. Estruture a resposta usando formatação Markdown rica (títulos '# ' e '## ', marcadores '- ', negritos '**').

Currículo Original Completo para Reescrita:
${resume.originalContent.slice(0, REWRITE_INPUT_LIMIT)}`,
      maxTokens: 8000,
      // Reescrever um currículo inteiro são milhares de tokens de saída, e
      // geração é serial: esses tokens SÃO a latência. Com o raciocínio
      // estendido ligado — o padrão do Sonnet 5 quando o parâmetro é omitido —
      // ele ainda disputava o mesmo orçamento antes de a resposta começar.
      disableThinking: true,
      // Uma tentativa só, com o prazo inteiro. Duas tentativas de 25s garantiam
      // duas falhas: nenhum provedor reescreve um currículo completo em 25s. A
      // redundância aqui custava exatamente o recurso que faltava.
      maxProviderAttempts: 1,
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

    // Entrega confirmada e persistida: só agora a reserva vira cobrança.
    await settleReservation(reservation)

    return NextResponse.json({
      success: true,
      rewrittenContent: routerResult.content,
      resume: updated,
      modelUsed: routerResult.usedModel,
      provider: routerResult.usedProvider,
    })
  } catch (e: any) {
    console.error('rewrite error:', e?.diagnostic || e?.message || e)
    // Liberar é idempotente: se a reserva já tiver sido liquidada ou liberada,
    // nada é creditado. Não há mais como um retry devolver o crédito duas vezes.
    const release = await releaseReservation(reservation, 'Falha no processamento de IA')
    if (release.refunded) {
      return NextResponse.json(
        {
          error: `Ocorreu uma falha durante o processamento da IA. Seus ${costCredits} créditos foram REEMBOLSADOS automaticamente!`,
          refunded: true,
          currentBalance: release.currentBalance,
        },
        { status: 500 }
      )
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
