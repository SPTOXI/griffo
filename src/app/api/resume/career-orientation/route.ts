import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
})

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

Responda APENAS um JSON válido no seguinte formato:
{
  "profileSummary": "Resumo do perfil e vocação identificados",
  "topMatchingAreas": [
    {
      "role": "Nome do Cargo/Área Sugerida 1",
      "matchPercentage": number (0 a 100),
      "whyFit": "Justificativa técnica de porque o candidato se encaixa perfeitamente nesta área",
      "requiredSkillsToLearn": ["Skill ou ferramenta 1 a estudar", "Skill 2"]
    },
    {
      "role": "Nome do Cargo/Área Sugerida 2",
      "matchPercentage": number (0 a 100),
      "whyFit": "Justificativa técnica",
      "requiredSkillsToLearn": ["Skill 1", "Skill 2"]
    },
    {
      "role": "Nome do Cargo/Área Sugerida 3",
      "matchPercentage": number (0 a 100),
      "whyFit": "Justificativa técnica",
      "requiredSkillsToLearn": ["Skill 1", "Skill 2"]
    }
  ],
  "careerAdvice": "Orientação geral e dicas para o candidato decidir seu próximo passo profissional com confiança."
}`

    const aiResponse = await executeAiTask({
      taskType: 'full_analysis',
      userId: user.id,
      systemPrompt,
      userPrompt: `Realize o Diagnóstico de Orientação Vocacional para este currículo:\n\n${resume.originalContent.slice(0, 12000)}`,
      maxTokens: 2500,
    })

    let cleanJson = aiResponse.content.trim().replace(/```json/gi, '').replace(/```/g, '').trim()
    const orientationData = JSON.parse(cleanJson)

    return NextResponse.json({ careerOrientation: orientationData })
  } catch (e: any) {
    console.error('Error generating career orientation:', e)
    return NextResponse.json({ error: 'Erro ao gerar orientação de carreira.' }, { status: 500 })
  }
}
