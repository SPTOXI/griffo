import 'server-only'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { LANGUAGE_DIRECTIVE } from '../../i18n/server'
import {
  detectProfileConflicts,
  parseProfileExtraction,
  PROFILE_EXTRACTION_JSON_SCHEMA,
} from '../../profile/extract'
import { fromRecord } from '../../profile'
import { parseStoredOrientation, rolesFromOrientation } from '../../profile/from-orientation'
import { EDUCATION_LEVELS, SENIORITY_LEVELS } from '../../profile'
import { registerAiJobRunner } from '../engine'
import { runSingleCallJob } from './single-call'

/**
 * Sugere o Perfil Profissional a partir do currículo mais recente.
 *
 * Prompt, schema e pós-processamento movidos de
 * `api/user/professional-profile/suggest/route.ts` sem alteração — só o
 * desfecho mudou, de resposta síncrona para job com progresso real. Ver o
 * cabeçalho daquela rota (mantido lá) para o raciocínio de por que esta
 * sugestão existe e por que não grava direto no perfil.
 */
export async function processProfileExtractionJob(jobId: string): Promise<void> {
  await runSingleCallJob(jobId, async (job, onAttempt) => {
    const resume = await db.resume.findUnique({
      where: { id: job.resumeId },
      select: { id: true, originalContent: true, careerOrientationJson: true },
    })
    if (!resume || !resume.originalContent?.trim()) {
      throw new Error('Currículo não encontrado.')
    }

    const lang = job.lang as 'pt' | 'en' | 'es'

    const systemPrompt = `${LANGUAGE_DIRECTIVE[lang]}

Você lê currículos e extrai o que ESTÁ ESCRITO neles. Você não avalia, não recomenda e não melhora nada.

REGRA ÚNICA E INEGOCIÁVEL: se o currículo não diz, o campo é null (ou lista vazia). Não deduza, não estime, não complete com o que "costuma ser". Um campo nulo é uma resposta correta; um campo inventado corrompe o perfil da pessoa e muda as vagas que ela vai receber.

CAMPOS:

- "currentTitle": o cargo mais recente, exatamente como escrito. Se a pessoa está entre empregos, o último que teve.
- "seniority": um de ${SENIORITY_LEVELS.join(', ')}. Baseie-se no cargo declarado e no tempo de carreira — NÃO em quão impressionante o currículo parece. Se o cargo não indica nível, null.
- "field": a área de atuação em duas ou três palavras (ex: "enfermagem", "engenharia de software", "logística").
- "specializations": até 8 subáreas ou domínios em que a pessoa efetivamente trabalhou.
- "skills": até 20 competências, ferramentas e tecnologias CITADAS no currículo. Não acrescente as que "quem faz isso costuma ter".
- "yearsExperience": anos de experiência profissional, somando os períodos declarados. Se as datas não permitem somar, null. Nunca arredonde para cima.
- "educationLevel": um de ${EDUCATION_LEVELS.join(', ')} — a MAIOR formação CONCLUÍDA. Curso em andamento não conta.
- "targetRoles": cargos que a pessoa declara buscar, se o currículo tiver objetivo profissional. Se não tiver, lista vazia — NÃO deduza a partir do cargo atual.

Responda APENAS o JSON do schema, sem texto antes ou depois.`

    const aiResponse = await executeAiTask({
      taskType: 'profile_extraction',
      userId: job.userId,
      resumeId: resume.id,
      systemPrompt,
      userPrompt: `CURRÍCULO:\n${resume.originalContent.slice(0, 14000)}`,
      maxTokens: 1200,
      disableThinking: true,
      jsonSchema: PROFILE_EXTRACTION_JSON_SCHEMA as unknown as Record<string, unknown>,
      // Cadeia desta tarefa: DeepSeek → Claude → Kimi (ver registry.ts, 2.34
      // na auditoria). Três tentativas para que o Claude — que nunca falhou
      // esta tarefa — seja alcançável quando os dois primeiros falharem.
      maxProviderAttempts: 3,
      modelOverride: 'deepseek-v4-pro',
      onProviderAttempt: onAttempt,
    })

    const suggestion = parseProfileExtraction(aiResponse.content)

    const roles = rolesFromOrientation(parseStoredOrientation(resume.careerOrientationJson))
    if (roles.length > 0) suggestion.targetRoles = roles

    if (Object.keys(suggestion).length === 0) {
      throw new Error('Não consegui extrair nada aproveitável do seu currículo.')
    }

    const record = await db.professionalProfile.findUnique({ where: { userId: job.userId } })
    const conflicts = detectProfileConflicts(fromRecord(record), suggestion)

    return JSON.stringify({ suggestion, conflicts, resumeId: resume.id })
  })
}

registerAiJobRunner('profile_extraction', processProfileExtractionJob)
