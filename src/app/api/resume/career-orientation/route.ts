export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'

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

    const systemPrompt = `Você é o Agente Especialista em Orientação de Carreira e Diagnóstico Vocacional do GriffoWork.
Analise o histórico, hard skills, soft skills e conquistas do candidato e determine as 3 melhores áreas ou cargos do mercado atual em que ele possui maior afinidade e chances imediatas de sucesso.

Responda APENAS um JSON válido no seguinte formato. NÃO adicione nenhum texto antes ou depois do JSON:
{
  "profileSummary": "Resumo do perfil e vocação identificados (em Português PT-BR)",
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
      taskType: 'full_analysis',
      userId: user.id,
      systemPrompt,
      userPrompt: `Realize o Diagnóstico de Orientação Vocacional para este currículo:\n\n${resume.originalContent.slice(0, 12000)}`,
      maxTokens: 3000,
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

    return NextResponse.json({ careerOrientation: orientationData })
  } catch (e: any) {
    console.error('Error generating career orientation:', e?.diagnostic || e?.message || e)
    return NextResponse.json({ error: 'Erro ao gerar orientação de carreira. Tente novamente.' }, { status: 500 })
  }
}
