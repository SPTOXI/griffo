import 'server-only'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { loadProfileContext, seedProfileFromOrientation } from '../../profile/server'
import { buildResumeContext } from '../../analysis/resume-context'
import { runForUserQuietly } from '../../radar/runner'
import { registerAiJobRunner } from '../engine'
import { runSingleCallJob } from './single-call'

const str = { type: 'string' } as const

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
 * Valida a orientação vocacional. Lança em vez de devolver um resultado
 * plausível — a versão anterior inventava três áreas com percentuais fixos.
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
 * Diagnóstico vocacional e de transição de carreira.
 *
 * Prompt, schema e pós-processamento movidos de
 * `api/resume/career-orientation/route.ts` sem alteração — só o desfecho
 * mudou, de resposta síncrona para job com progresso real.
 */
export async function processCareerOrientationJob(jobId: string): Promise<void> {
  await runSingleCallJob(jobId, async (job, onAttempt) => {
    const resume = await db.resume.findUnique({
      where: { id: job.resumeId },
      select: { id: true, originalContent: true, targetJob: true, targetJobDescription: true },
    })
    if (!resume) throw new Error('Currículo não encontrado.')

    const lang = job.lang as 'pt' | 'en' | 'es'

    const { market, promptContext: profileContext } = await loadProfileContext(job.userId, {
      scope: 'career',
      edgeCountry: job.userCountry,
      language: lang,
    })

    const cacheableContext = buildResumeContext({
      resumeContent: resume.originalContent.slice(0, 12000),
      targetJob: resume.targetJob,
      targetJobDescription: resume.targetJobDescription,
      lang,
      market,
      profileContext,
    })

    const systemPrompt = `Você é o Agente Especialista em Orientação de Carreira e Diagnóstico Vocacional do GriffoWork.

Use a nomenclatura de cargo praticada NESTE mercado — o mesmo trabalho tem nomes diferentes em mercados diferentes.

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
      taskType: 'career_orientation',
      userId: job.userId,
      userCountry: job.userCountry,
      cacheableContext,
      systemPrompt,
      userPrompt: 'Realize o Diagnóstico de Orientação Vocacional para o candidato do contexto acima.',
      maxTokens: 3000,
      disableThinking: true,
      maxProviderAttempts: 1,
      jsonSchema: ORIENTATION_JSON_SCHEMA as unknown as Record<string, unknown>,
      onProviderAttempt: onAttempt,
    })

    const orientationData = parseOrientation(aiResponse.content)
    const orientationJson = JSON.stringify(orientationData)

    await db.resume.update({
      where: { id: resume.id },
      data: { careerOrientationJson: orientationJson },
    })

    // O diagnóstico abre a porta do Radar: só preenche o que está vazio, e o
    // que preencheu vai no resultado — perfil que muda sozinho e em silêncio
    // é o que o §30 proíbe.
    const seededFields = await seedProfileFromOrientation(job.userId, orientationJson, {
      fallbackCountry: job.userCountry,
    })

    if (seededFields.length > 0) await runForUserQuietly(job.userId)

    return JSON.stringify({ careerOrientation: orientationData, profileSeeded: seededFields })
  })
}

registerAiJobRunner('career_orientation', processCareerOrientationJob)
