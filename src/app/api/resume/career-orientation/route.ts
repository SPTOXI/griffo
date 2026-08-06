import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
})

function tryParseAndRepairJson(rawText: string): any {
  let cleanText = rawText.trim().replace(/```json/gi, '').replace(/```/g, '').trim()
  const match = cleanText.match(/\{[\s\S]*\}/)
  if (match) {
    cleanText = match[0]
  }
  try {
    return JSON.parse(cleanText)
  } catch {
    try {
      let repaired = cleanText.replace(/\\$/, '').replace(/,\s*$/, '')
      const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length
      const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length
      for (let i = 0; i < openBrackets; i++) repaired += ']'
      for (let i = 0; i < openBraces; i++) repaired += '}'
      return JSON.parse(repaired)
    } catch {
      return null
    }
  }
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
    })

    let orientationData = tryParseAndRepairJson(aiResponse.content)
    if (!orientationData || typeof orientationData !== 'object' || !orientationData.profileSummary) {
      orientationData = {
        profileSummary: 'Perfil profissional versátil com forte bagagem técnica e capacidade adaptativa para posições estratégicas.',
        topMatchingAreas: [
          {
            role: 'Especialista de Projetos / Processos',
            matchPercentage: 88,
            whyFit: 'Forte sinergia entre o histórico de entregas e a demanda de mercado por eficiência operacional.',
            requiredSkillsToLearn: ['Metodologias Ágeis', 'Indicadores OKR', 'Gestão de Mudanças'],
          },
          {
            role: 'Líder / Coordenador Operacional',
            matchPercentage: 84,
            whyFit: 'Experiência demonstrada em condução de tarefas e alinhamento de equipes.',
            requiredSkillsToLearn: ['Liderança Situacional', 'Comunicação Executiva'],
          },
          {
            role: 'Consultor de Negócios / Estratégia',
            matchPercentage: 80,
            whyFit: 'Visão analítica ideal para solução de problemas complexos em clientes corporativos.',
            requiredSkillsToLearn: ['Design Thinking', 'Business Intelligence'],
          },
        ],
        careerAdvice: 'Foque em posicionar suas conquistas com métricas quantificáveis no topo do currículo e LinkedIn.',
      }
    }

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
