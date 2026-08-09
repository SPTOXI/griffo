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
import { getRequestLanguage, LANGUAGE_DIRECTIVE, ATS_BY_MARKET, SOCIAL_PLATFORMS_BY_MARKET } from '@/lib/i18n/server'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

const DIMENSION_KEYS = [
  'structure',
  'summary',
  'impact',
  'skills',
  'experience',
  'keywords',
  'career',
  'upskilling',
] as const

const str = { type: 'string' } as const
const strArray = { type: 'array', items: str } as const

// Aplicado como restrição de geração (`output_config.format`), não como pedido
// no prompt: a API impede o modelo de produzir qualquer coisa fora deste
// formato. `overall` não aparece aqui de propósito — é calculado a partir das
// dimensões, porque nenhum modelo é confiável em aritmética auto-consistente.
const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'atsFriendly',
    'dimensions',
    'jobMatch',
    'targetedChanges',
    'strengths',
    'weaknesses',
    'recommendations',
    'keywords',
    'socialAdvice',
  ],
  properties: {
    summary: str,
    atsFriendly: { type: 'boolean' },
    dimensions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'label', 'score', 'rationale'],
        properties: {
          key: { type: 'string', enum: DIMENSION_KEYS },
          label: str,
          score: { type: 'number' },
          rationale: str,
        },
      },
    },
    jobMatch: {
      type: 'object',
      additionalProperties: false,
      required: [
        'targetJob',
        'matchPercentage',
        'verdict',
        'matchedRequirements',
        'missingRequirements',
        'actionPlan',
      ],
      properties: {
        targetJob: str,
        matchPercentage: { type: 'number' },
        verdict: str,
        matchedRequirements: strArray,
        missingRequirements: strArray,
        actionPlan: strArray,
      },
    },
    targetedChanges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['section', 'originalText', 'rationale', 'suggestedText'],
        properties: {
          section: str,
          originalText: str,
          rationale: str,
          suggestedText: str,
        },
      },
    },
    strengths: strArray,
    weaknesses: strArray,
    recommendations: strArray,
    keywords: strArray,
    socialAdvice: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['platform', 'url', 'headline', 'aboutSummary', 'tips'],
        properties: {
          platform: str,
          url: str,
          headline: str,
          aboutSummary: str,
          tips: strArray,
        },
      },
    },
  },
} as const

/**
 * Valida o laudo e calcula a nota geral.
 *
 * Lança em vez de devolver dados aproximados: o chamador reembolsa os créditos.
 * A versão anterior gravava um laudo inventado — nota 7,5 em todas as dimensões
 * com textos genéricos — e o cobrava como se fosse real.
 */
function parseAnalysis(rawText: string): any {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu um laudo em formato inválido.')
  }

  const dimensions = parsed?.dimensions
  if (!Array.isArray(dimensions) || dimensions.length !== DIMENSION_KEYS.length) {
    throw new Error('O laudo veio incompleto: faltam dimensões de avaliação.')
  }

  const scores = dimensions.map((d: any) => Number(d?.score))
  if (scores.some((s) => !Number.isFinite(s) || s < 0 || s > 10)) {
    throw new Error('O laudo veio com notas inválidas nas dimensões.')
  }

  if (typeof parsed.summary !== 'string' || parsed.summary.trim().length < 30) {
    throw new Error('O laudo veio sem parecer executivo.')
  }

  // A nota geral é derivada aqui, não pedida ao modelo.
  const overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10

  return { ...parsed, overall }
}

export async function POST(req: Request) {
  let reservation: CreditReservation | null = null
  const costCredits = CREDIT_COSTS.full_analysis

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
    // Reserva em vez de debitar: o crédito só vira cobrança definitiva
    // depois que a entrega confirma. Ver lib/credits.ts.
    const deduction = await reserveCredits(
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

    reservation = deduction.reservation

    const lang = getRequestLanguage(req)
    const atsList = ATS_BY_MARKET[lang]
    const socialPlatforms = SOCIAL_PLATFORMS_BY_MARKET[lang]

    // Collect all social media links (from resume upload and user profile)
    let combinedSocialLinks: Record<string, string> = {}
    if (user.socialLinks) {
      try {
        combinedSocialLinks = { ...combinedSocialLinks, ...JSON.parse(user.socialLinks) }
      } catch {}
    }
    if (resume.socialLinksJson) {
      try {
        combinedSocialLinks = { ...combinedSocialLinks, ...JSON.parse(resume.socialLinksJson) }
      } catch {}
    }

    const socialLinksText = Object.keys(combinedSocialLinks).length > 0
      ? `\n\nREDES SOCIAIS E PERFIS PROFISSIONAIS CADASTRADOS:\n${JSON.stringify(combinedSocialLinks, null, 2)}`
      : `\n\n(Nenhum link de rede social cadastrado previamente pelo usuário. Forneça recomendações gerais estratégicas para ${socialPlatforms}).`

    const SYSTEM_ANALYZE_PROMPT = `${LANGUAGE_DIRECTIVE[lang]}

Você é um avaliador executivo sênior de currículos, especialista mundial em triagem ATS (Applicant Tracking Systems — ${atsList}) e estrategista de personal branding internacional.

Sua tarefa é realizar uma ANÁLISE DE ALTA PROFUNDIDADE TÉCNICA E JUSTIFICADA do currículo. Você NÃO deve ser genérico. Você deve apontar EXATAMENTE onde estão as falhas, POR QUE elas prejudicam o candidato e COMO corrigi-las.

REGRAS DE PRESENÇA DIGITAL & REDES SOCIAIS (SE FORNECIDAS):
Se o candidato informou perfis profissionais (${socialPlatforms}, Dribbble, StackOverflow, Kaggle, Medium, Substack), gere no campo "socialAdvice" orientações práticas de otimização para cada perfil: Título/Headline otimizado para algoritmos de recrutamento, seção "Sobre" com palavras-chave de busca, e dicas de SEO/engajamento para cada plataforma.
Se nenhum perfil foi informado, gere recomendações estratégicas gerais para ${socialPlatforms} no campo "socialAdvice".

Retorne EXATAMENTE um JSON válido (sem blocos de markdown adicionais) com o seguinte esquema estrito.
NÃO calcule nota geral: ela é derivada das 8 dimensões pelo sistema.
{
  "summary": "Parecer executivo detalhado sobre o currículo e seu nível de competitividade no mercado.",
  "atsFriendly": boolean,
  "dimensions": [
    {
      "key": "structure",
      "label": "Estrutura & Compatibilidade ATS",
      "score": number (0-10),
      "rationale": "Justificativa técnica aprofundada explicando a pontuação e os critérios atendidos ou violados."
    },
    {
      "key": "summary",
      "label": "Resumo & Posicionamento Profissional",
      "score": number (0-10),
      "rationale": "Justificativa detalhada."
    },
    {
      "key": "impact",
      "label": "Resultados Quantificados (Fórmula STAR/XYZ)",
      "score": number (0-10),
      "rationale": "Justificativa detalhada."
    },
    {
      "key": "skills",
      "label": "Habilidades & Palavras-Chave de Busca",
      "score": number (0-10),
      "rationale": "Justificativa detalhada."
    },
    {
      "key": "experience",
      "label": "Experiência Profissional & Verbos de Ação",
      "score": number (0-10),
      "rationale": "Justificativa detalhada sobre escopo de responsabilidade, autonomia, verbos de ação fortes."
    },
    {
      "key": "keywords",
      "label": "Palavras-Chave & Match com Vagas",
      "score": number (0-10),
      "rationale": "Justificativa detalhada sobre termos estratégicos para os filtros de ${atsList}."
    },
    {
      "key": "career",
      "label": "Trajetória & Plano de Carreira",
      "score": number (0-10),
      "rationale": "Justificativa detalhada sobre progressão de carreira, estabilidade, lacunas de crescimento, projeção do próximo passo."
    },
    {
      "key": "upskilling",
      "label": "Capacitação & Cursos Recomendados",
      "score": number (0-10),
      "rationale": "Justificativa detalhada sobre lacunas de conhecimento identificadas e recomendações objetivas de cursos/certificações (AWS, Azure, Scrum Master, PMP, etc.)."
    }
  ],
  "jobMatch": {
    "targetJob": "Cargo/Vaga analisada",
    "matchPercentage": number (0 a 100),
    "verdict": "Veredito rápido sobre a aderência do candidato à vaga",
    "matchedRequirements": ["Requisito 1 que o candidato possui", "Requisito 2"],
    "missingRequirements": ["Requisito 1 exigido pela vaga mas ausente no currículo", "Requisito 2"],
    "actionPlan": ["Passo 1 para aumentar as chances", "Passo 2 de capacitação/ajuste"]
  },
  "targetedChanges": [
    {
      "section": "Nome da seção (ex: Resumo Profissional, Experiência 1, Habilidades)",
      "originalText": "Trecho exato do currículo atual que apresenta problema ou pode melhorar",
      "rationale": "Justificativa clara e técnica do PORQUE esse trecho prejudica o currículo (ex: falta de dados quantificáveis, adjetivos vagos, ausência de termos buscados por recrutadores).",
      "suggestedText": "Sugestão reescrita e otimizada do trecho aplicando fórmula STAR/XYZ."
    }
  ],
  "strengths": ["Lista de 3 a 5 pontos fortes marcantes com justificativa"],
  "weaknesses": ["Lista de 3 a 5 vulnerabilidades identificadas com impacto na triagem"],
  "recommendations": ["Plano de ação prioritário com passos claros para o candidato"],
  "keywords": ["Lista de 10 a 15 palavras-chave estratégicas cruciais para o segmento"],
  "socialAdvice": [
    {
      "platform": "Nome da Plataforma (ex: ${socialPlatforms})",
      "url": "URL informada ou 'Geral/Plataformas de Mercado'",
      "headline": "Título executivo altamente otimizado para o algoritmo da plataforma e atração de recrutadores",
      "aboutSummary": "Texto persuasivo de bio/resumo otimizado com palavras-chave de busca",
      "tips": [
        "Dica prática 1 de SEO de perfil",
        "Dica prática 2 de engajamento e visibilidade"
      ]
    }
  ]
}`

    const jobText = (resume.targetJob || resume.targetJobDescription)
      ? `\n\nVAGA / CARGO ALVO DESEJADO PELO CANDIDATO:\nCargo: ${resume.targetJob || 'Não especificado'}\nDescrição/Requisitos da Vaga:\n${resume.targetJobDescription || 'Nenhuma descrição fornecida.'}`
      : '\n\n(Nenhuma vaga alvo específica fornecida. Avalie a aderência geral para a área de atuação do currículo).'

    // Execute via AI Router
    const routerResult = await executeAiTask({
      taskType: 'full_analysis',
      userId: user.id,
      systemPrompt: SYSTEM_ANALYZE_PROMPT,
      userPrompt: `Realize a análise preditiva completa e detalhada do seguinte currículo, mídias sociais e aderência à vaga alvo:\n\nCONTEÚDO DO CURRÍCULO:\n${resume.originalContent.slice(0, 15000)}${socialLinksText}${jobText}`,
      maxTokens: 3800,
      jsonSchema: ANALYSIS_JSON_SCHEMA as unknown as Record<string, unknown>,
    })

    // Falha aqui cai no catch abaixo, que reembolsa os créditos. Antes, um
    // laudo inventado era gravado e cobrado como se fosse real.
    const analysis = parseAnalysis(routerResult.content)

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

    // Entrega confirmada e persistida: só agora a reserva vira cobrança.
    await settleReservation(reservation)

    return NextResponse.json({
      success: true,
      analysis,
      resume: updated,
      modelUsed: routerResult.usedModel,
      provider: routerResult.usedProvider,
    })
  } catch (e: any) {
    console.error('analyze error:', e?.diagnostic || e?.message || e)
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
    return NextResponse.json({ error: 'Ocorreu um erro ao analisar o currículo. Tente novamente em instantes.' }, { status: 500 })
  }
}
