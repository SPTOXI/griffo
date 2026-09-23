import 'server-only'
import { wrapUntrustedDocument } from '@/lib/analysis/untrusted'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { LANGUAGE_DIRECTIVE } from '../../i18n/server'
import {
  detectProfileConflicts,
  parseProfileExtraction,
  PROFILE_EXTRACTION_JSON_SCHEMA,
  profileExtractionSystemPrompt,
} from '../../profile/extract'
import { fromRecord } from '../../profile'
import { parseStoredOrientation, rolesFromOrientation } from '../../profile/from-orientation'
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

    const systemPrompt = profileExtractionSystemPrompt(LANGUAGE_DIRECTIVE[lang])

    const aiResponse = await executeAiTask({
      taskType: 'profile_extraction',
      userId: job.userId,
      resumeId: resume.id,
      systemPrompt,
      userPrompt: wrapUntrustedDocument(resume.originalContent.slice(0, 14000), 'currículo do candidato'),
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
