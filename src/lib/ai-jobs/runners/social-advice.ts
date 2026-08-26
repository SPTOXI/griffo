import 'server-only'
import { db } from '../../db'
import { claimAiJob, completeAiJob, createStepWriter, failAiJob, registerAiJobRunner } from '../engine'
import { analyzeSocialPresence } from '../../social/analysis'
import type { SocialProfileData } from '../../social/fetchers'
import { marketById } from '../../market'
import type { Language } from '../../i18n'

/**
 * Entrada preparada pela rota antes de criar o job — ver o comentário de
 * `AiJob.inputJson` no schema. A busca dos perfis (rede, GitHub, Jina, PDF do
 * LinkedIn) é cara e específica da requisição; refazê-la aqui dentro do
 * `after()` duplicaria chamadas externas e perderia conteúdo colado à mão que
 * só existiu naquele POST.
 */
export interface SocialAdviceInput {
  profiles: SocialProfileData[]
  resumeExcerpt: string
  marketId: string
  sources: { platform: string; url: string; status: string; note?: string }[]
}

/** Mesmo orçamento que a rota síncrona usava, calibrado para caber no `after()`. */
const TIME_BUDGET_MS = 50_000

/**
 * Leitura de presença digital — cada perfil (mais a avaliação geral) é uma
 * etapa real gravada assim que termina, via `onStepSettled` em
 * `analyzeSocialPresence`. É a única das cinco tarefas convertidas que já
 * decompõe naturalmente em sub-chamadas paralelas (ver 2.35 na auditoria).
 *
 * Persistência final e auditoria movidas de
 * `api/resume/social-analysis/route.ts` sem alteração.
 */
export async function processSocialAdviceJob(jobId: string): Promise<void> {
  if (!(await claimAiJob(jobId))) return

  const job = await db.aiJob.findUnique({ where: { id: jobId } })
  if (!job) return
  if (job.status === 'completed' || job.status === 'failed') return

  let input: SocialAdviceInput
  try {
    const parsed = JSON.parse(job.inputJson || 'null')
    if (!parsed || !Array.isArray(parsed.profiles)) throw new Error('vazio')
    input = parsed
  } catch {
    await failAiJob(jobId, 'Entrada inválida para a leitura de perfil social.')
    return
  }

  const writeStep = createStepWriter(jobId)
  const steps: Record<string, unknown> = {}

  try {
    const analysis = await analyzeSocialPresence({
      profiles: input.profiles,
      resumeExcerpt: input.resumeExcerpt,
      lang: job.lang as Language,
      market: marketById(input.marketId),
      userId: job.userId,
      resumeId: job.resumeId,
      userCountry: job.userCountry,
      timeBudgetMs: TIME_BUDGET_MS,
      onStepSettled: (key) => {
        steps[key] = { at: new Date().toISOString() }
        void writeStep({ ...steps })
      },
    })

    const stored = {
      ...analysis,
      // Guarda o que foi lido de fato: sem isso não há como auditar depois se
      // uma recomendação veio de conteúdo real ou de orientação genérica.
      sources: input.sources,
      analyzedAt: new Date().toISOString(),
    }

    await db.resume.update({
      where: { id: job.resumeId },
      data: { socialAnalysisJson: JSON.stringify(stored) },
    })

    const analyzedCount = input.sources.filter((s) => s.status === 'fetched').length

    await db.auditLog.create({
      data: {
        userId: job.userId,
        resumeId: job.resumeId,
        action: 'social_analysis',
        // Modelo e custo saem do AiLog: a auditoria virou N chamadas
        // paralelas, cada uma com sua própria linha de telemetria.
        meta: JSON.stringify({
          analyzedCount,
          totalProfiles: input.sources.length,
          aiCalls: input.profiles.length + 1,
          failedProfiles: analysis.failedProfiles,
        }),
      },
    })

    await completeAiJob(jobId, JSON.stringify({ socialAnalysis: stored, analyzedCount }))
  } catch (e: any) {
    const message = e?.diagnostic
      ? 'Os provedores de IA não responderam a tempo nesta tentativa. Tente de novo.'
      : e?.message && typeof e.message === 'string' && e.message.length < 200
        ? e.message
        : 'Ocorreu uma falha durante o processamento.'
    await failAiJob(jobId, message, e?.diagnostic || e?.message)
  }
}

registerAiJobRunner('social_advice', processSocialAdviceJob)
