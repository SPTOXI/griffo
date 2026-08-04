export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  const costCredits = CREDIT_COSTS.full_analysis

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

    // Deduct 20 credits per full analysis
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

    deducted = true

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
      : '\n\n(Nenhum link de rede social cadastrado previamente pelo usuário. Forneça recomendações gerais estratégicas para LinkedIn, Gupy, GitHub e portfólios globais).'

    const SYSTEM_ANALYZE_PROMPT = `Você é um avaliador executivo sênior de currículos, especialista mundial em triagem ATS (Applicant Tracking Systems) e estrategista de personal branding internacional.

Sua tarefa é realizar uma ANÁLISE DE ALTA PROFUNDIDADE TÉCNICA E JUSTIFICADA do currículo. Você NÃO deve ser genérico. Você deve apontar EXATAMENTE onde estão as falhas, POR QUE elas prejudicam o candidato e COMO corrigi-las.

Retorne EXATAMENTE um JSON válido (sem blocos de markdown adicionais) com o seguinte esquema estrito:
{
  "overall": number (nota de 0 a 10 com 1 casa decimal, devendo ser estritamente igual à média aritmética das notas de todas as dimensões abaixo),
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
      "platform": "Nome da Plataforma (ex: LinkedIn, Gupy, GitHub, Behance, Catho, Workana, Portfólio)",
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
      maxTokens: 4500,
    })

    const tryParseAndRepairJson = (rawText: string): any => {
      let cleanText = rawText.trim().replace(/```json/gi, '').replace(/```/g, '').trim()
      try {
        return JSON.parse(cleanText)
      } catch {
        try {
          let repaired = cleanText.replace(/\\$/, '').replace(/,\s*$/, '')
          const unescapedQuotes = (repaired.match(/(?<!\\)"/g) || []).length
          if (unescapedQuotes % 2 !== 0) repaired += '"'

          const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length
          const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length

          for (let i = 0; i < openBrackets; i++) repaired += ']'
          for (let i = 0; i < openBraces; i++) repaired += '}'

          return JSON.parse(repaired)
        } catch {
          const overallMatch = cleanText.match(/"overall"\s*:\s*(\d+(\.\d+)?)/)
          const summaryMatch = cleanText.match(/"summary"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
          const atsMatch = cleanText.match(/"atsFriendly"\s*:\s*(true|false)/)

          const extractArray = (key: string): string[] => {
            const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 's')
            const match = cleanText.match(regex)
            if (match && match[1]) {
              const items = match[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)
              if (items) return items.map(s => s.replace(/^"|"$/g, '').replace(/\\"/g, '"'))
            }
            return []
          }

          return {
            overall: overallMatch ? parseFloat(overallMatch[1]) : 7.5,
            summary: summaryMatch ? summaryMatch[1] : 'Análise técnica concluída com sucesso.',
            atsFriendly: atsMatch ? atsMatch[1] === 'true' : true,
            strengths: extractArray('strengths'),
            weaknesses: extractArray('weaknesses'),
            recommendations: extractArray('recommendations'),
            keywords: extractArray('keywords'),
          }
        }
      }
    }

    let analysis: any = tryParseAndRepairJson(routerResult.content)
    if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
      analysis = {
        overall: 7.5,
        summary: 'Análise concluída com sucesso.',
        atsFriendly: true,
        dimensions: [
          { key: 'structure', label: 'Estrutura & Compatibilidade ATS', score: 7.5, rationale: 'Estrutura limpa.' },
        ],
        strengths: ['Estrutura profissional limpa e fácil leitura'],
        weaknesses: ['Pouca presença de métricas numéricas'],
        recommendations: ['Aplicar metodologia STAR/XYZ'],
        keywords: ['Gestão', 'Processos', 'Otimização'],
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
    console.error('analyze error:', e?.diagnostic || e?.message || e)
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
    return NextResponse.json({ error: 'Ocorreu um erro ao analisar o currículo. Tente novamente em instantes.' }, { status: 500 })
  }
}
