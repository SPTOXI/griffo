export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { requireUnlockedResume } from '@/lib/entitlements'
import { getRequestLanguage, LANGUAGE_DIRECTIVE, ATS_BY_MARKET } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

// A análise já corta a entrada em 15.000 caracteres; a reescrita enviava o
// currículo inteiro. Como o upload não impõe teto de tamanho, um documento
// muito grande fazia o custo e o tempo desta rota crescerem sem limite.
const REWRITE_INPUT_LIMIT = 20000

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

    // A reescrita não é cobrada à parte: ela é um dos nove itens da Análise
    // Completa. A única pergunta é se este currículo já foi liberado.
    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

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
      userCountry: edgeCountry(req),
      systemPrompt: `${LANGUAGE_DIRECTIVE[lang]}\n\nVocê é um Redator Executivo Sênior especialista em currículos de alto impacto e otimização para sistemas ATS (${ATS_BY_MARKET[lang]}). Sua função é reescrever o currículo COMPLETO de ponta a ponta sem cortar nada, utilizando marcações Markdown perfeitamente estruturadas (títulos H1/H2, marcadores de lista, negritos).`,
      userPrompt: `REESCREVA O CURRÍCULO COMPLETO DO INÍCIO AO FIM SEM OMITIR NEM SINTETIZAR NENHUMA SEÇÃO OU EXPERIÊNCIA.

Diretrizes Obrigatórias:
1. Reescreva TODAS as seções presentes no currículo original: Dados Pessoais/Cabeçalho, Resumo Profissional, TODAS as Experiências Profissionais completas (com empresas, cargos, datas), Formação Acadêmica, Habilidades Técnicas/Comportamentais, Idiomas e Certificações.
2. Em cada experiência, escreva realizações que tragam o RESULTADO alcançado, a EVIDÊNCIA desse resultado e a AÇÃO que o produziu — é o conteúdo das metodologias STAR e XYZ.
   NÃO reproduza a fórmula como texto. As construções "medido por ..." e "fazendo ..." estão PROIBIDAS: repetidas em vinte itens seguidos, elas produzem um currículo de sintaxe idêntica do começo ao fim, que é exatamente o oposto do efeito pretendido. Varie a construção entre os itens e escreva em português natural, como um profissional sênior escreveria.
3. Mantenha 100% da veracidade dos fatos originais. Só cite número, percentual ou indicador que exista no currículo original — quando não houver métrica, descreva o escopo real (tamanho da equipe, número de unidades, sistemas operados, porte da operação). Inventar métrica é falsificar o currículo do candidato.${keywordsHint}
4. Estruture a resposta usando formatação Markdown rica (títulos '# ' e '## ', marcadores '- ', negritos '**').
5. NÃO invente dados de contato. Se o currículo original não traz e-mail, telefone ou LinkedIn, omita o campo — nunca escreva marcadores como "[seu e-mail]" ou "[link]", que chegam ao recrutador exatamente assim, como se fossem o conteúdo.
6. NÃO use emojis, ícones ou símbolos decorativos em nenhuma parte do documento. Ele é lido por sistemas de triagem (ATS), que os descartam ou corrompem, e a exportação em PDF não possui glifo para eles.

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

    return NextResponse.json({
      success: true,
      rewrittenContent: routerResult.content,
      resume: updated,
      modelUsed: routerResult.usedModel,
      provider: routerResult.usedProvider,
    })
  } catch (e: any) {
    console.error('rewrite error:', e?.diagnostic || e?.message || e)
    // Não há estorno a fazer: a falha não custou nada ao usuário. O currículo
    // continua liberado e ele pode pedir a reescrita de novo.
    return NextResponse.json(
      { error: 'Ocorreu um erro ao reescrever o currículo. Tente novamente em instantes.' },
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
