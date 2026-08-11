export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { getRequestLanguage, LANGUAGE_DIRECTIVE } from '@/lib/i18n/server'
import {
  reserveCredits,
  settleReservation,
  releaseReservation,
  CREDIT_COSTS,
  type CreditReservation,
} from '@/lib/credits'
import { getRequestCountry } from '@/lib/currency'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
})

const str = { type: 'string' } as const

// Restringe a geração ao formato (`output_config.format`) em vez de apenas
// pedi-lo no prompt.
const ORIENTATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['profileSummary', 'topMatchingAreas', 'careerAdvice'],
  properties: {
    profileSummary: str,
    topMatchingAreas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['role', 'matchPercentage', 'whyFit', 'requiredSkillsToLearn'],
        properties: {
          role: str,
          matchPercentage: { type: 'number' },
          whyFit: str,
          requiredSkillsToLearn: { type: 'array', items: str },
        },
      },
    },
    careerAdvice: str,
  },
} as const

/**
 * Valida a orientação vocacional.
 *
 * Lança em vez de devolver um resultado plausível: a versão anterior inventava
 * três áreas com percentuais fixos (88%, 84%, 80%) e as apresentava ao usuário
 * como diagnóstico.
 */
function parseOrientation(rawText: string): any {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu a orientação em formato inválido.')
  }

  if (typeof parsed?.profileSummary !== 'string' || !parsed.profileSummary.trim()) {
    throw new Error('A orientação veio sem resumo de perfil.')
  }
  if (!Array.isArray(parsed?.topMatchingAreas) || parsed.topMatchingAreas.length === 0) {
    throw new Error('A orientação veio sem áreas sugeridas.')
  }

  return parsed
}

/**
 * Agente de Orientação Vocacional e Transição de Carreira
 * Avalia o currículo de candidatos indecisos e indica as 3 áreas/cargos ideais e o plano de qualificação.
 */
export async function POST(req: Request) {
  let reservation: CreditReservation | null = null
  const costCredits = CREDIT_COSTS.career_orientation

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    // Passou a cobrar. O pré-requisito era a Sessão 2: enquanto a rota podia
    // devolver três áreas com percentuais fixos inventados (88%, 84%, 80%),
    // cobrar por isso seria pior que oferecer de graça.
    const reservationResult = await reserveCredits(
      user.id,
      costCredits,
      `Diagnóstico de orientação vocacional (${costCredits} cr)`
    )

    if (!reservationResult.success) {
      return NextResponse.json(
        {
          error: reservationResult.error || 'Seu saldo de créditos é insuficiente.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: costCredits,
          currentCredits: reservationResult.currentBalance,
        },
        { status: 402 }
      )
    }

    reservation = reservationResult.reservation

    const lang = getRequestLanguage(req)

    // Vaga real que o usuário importou, quando houver. É o único dado de
    // mercado concreto disponível hoje — melhor do que raciocinar só sobre o
    // currículo, e honesto quanto à origem.
    const marketContext = resume.targetJobDescription
      ? `\n\nVAGA DE EMPREGO REAL QUE O CANDIDATO IMPORTOU (use as exigências dela como referência concreta do mercado, citando-as quando pertinente):\n${resume.targetJobDescription.slice(0, 4000)}`
      : resume.targetJob
        ? `\n\nCARGO ALVO INFORMADO PELO CANDIDATO: ${resume.targetJob}`
        : ''

    const systemPrompt = `${LANGUAGE_DIRECTIVE[lang]}

Você é o Agente Especialista em Orientação de Carreira e Diagnóstico Vocacional do GriffoWork.
Analise o histórico, hard skills, soft skills e conquistas do candidato e determine as 3 melhores áreas ou cargos do mercado atual em que ele possui maior afinidade e chances imediatas de sucesso.

TAMANHO DA RESPOSTA (o que controla a latência — respeite):
- "profileSummary": 2 a 3 frases.
- "topMatchingAreas": exatamente 3 itens; cada "whyFit" com 2 frases; "requiredSkillsToLearn" com 3 a 4 itens curtos.
- "careerAdvice": 3 a 4 frases.
- "matchPercentage": número inteiro entre 0 e 100, derivado do currículo — não use valores de exemplo.

Responda APENAS um JSON válido no seguinte formato. NÃO adicione nenhum texto antes ou depois do JSON:
{
  "profileSummary": "Resumo do perfil e vocação identificados",
  "topMatchingAreas": [
    {
      "role": "Nome do Cargo/Área Sugerida 1",
      "matchPercentage": 90,
      "whyFit": "Justificativa técnica de porque o candidato se encaixa perfeitamente nesta área",
      "requiredSkillsToLearn": ["Skill ou ferramenta 1 a estudar", "Skill 2"]
    }
  ],
  "careerAdvice": "Orientação geral e dicas para o candidato decidir seu próximo passo profissional com confiança."
}`

    const aiResponse = await executeAiTask({
      // Tipo próprio, e não `full_analysis`: o Agente de Qualidade valida cada
      // tarefa pelo formato que ela produz, e as regras de `full_analysis`
      // exigem `dimensions` — que este diagnóstico nunca gerou. Enquanto os dois
      // compartilharam o tipo, toda resposta correta era reprovada como
      // "Dimensões de análise incompletas" e a rota terminava em falha
      // operacional depois de esgotar os provedores.
      taskType: 'career_orientation',
      userId: user.id,
      userCountry: getRequestCountry(req),
      systemPrompt,
      userPrompt: `Realize o Diagnóstico de Orientação Vocacional para este currículo:\n\n${resume.originalContent.slice(0, 12000)}${marketContext}`,
      maxTokens: 3000,
      // Extração estruturada não ganha nada com raciocínio estendido, e no
      // Sonnet 5 ele vem LIGADO por padrão: consumia parte do orçamento de
      // tokens e empurrava a chamada para além do teto de 25s por provedor.
      disableThinking: true,
      jsonSchema: ORIENTATION_JSON_SCHEMA as unknown as Record<string, unknown>,
    })

    const orientationData = parseOrientation(aiResponse.content)

    // Persist to database so orientation is preserved across page refreshes
    await db.resume.update({
      where: { id: resume.id },
      data: {
        careerOrientationJson: JSON.stringify(orientationData),
      },
    })

    await settleReservation(reservation)

    return NextResponse.json({ careerOrientation: orientationData })
  } catch (e: any) {
    console.error('Error generating career orientation:', e?.diagnostic || e?.message || e)

    const release = await releaseReservation(reservation, 'Falha na orientação de carreira')

    const isProviderFailure = Boolean(e?.diagnostic)
    const base = isProviderFailure
      ? 'Os provedores de IA não responderam a tempo nesta tentativa. Clique em gerar novamente.'
      : 'Ocorreu uma falha ao montar o diagnóstico vocacional.'

    return NextResponse.json(
      {
        error: release.refunded
          ? `${base} Seus ${costCredits} créditos foram REEMBOLSADOS automaticamente.`
          : `${base} Nenhum crédito foi cobrado.`,
        refunded: release.refunded,
        currentBalance: release.currentBalance,
        code: isProviderFailure ? 'AI_PROVIDERS_UNAVAILABLE' : 'ORIENTATION_FAILED',
      },
      { status: 500 }
    )
  }
}
