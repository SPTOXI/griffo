import 'server-only'
import { db } from '../../db'
import { claimAiJob, completeAiJob, createStepWriter, failAiJob } from '../engine'
import type { ProviderId } from '../../ai-router/types'

/**
 * Motor comum aos três `kind`s de chamada única: extração de perfil,
 * orientação vocacional, carta de apresentação.
 *
 * Nenhum deles decompõe em etapas reais (uma chamada de IA só cada) — o
 * progresso real que existe é o `onProviderAttempt` do roteador, gravado
 * como marco (`attempt_1`, `attempt_2`, ...) conforme acontece de verdade.
 * Ver a decisão registrada em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` §2.35: não
 * decompor esses três em sub-chamadas arriscaria a qualidade de um fluxo que
 * já funciona bem, por um ganho de granularidade pequeno numa espera curta.
 */

type AiJobRow = NonNullable<Awaited<ReturnType<typeof db.aiJob.findUnique>>>

export async function runSingleCallJob(
  jobId: string,
  run: (
    job: AiJobRow,
    onAttempt: (info: { providerId: ProviderId; attemptNumber: number }) => void
  ) => Promise<string>
): Promise<void> {
  if (!(await claimAiJob(jobId))) return

  const job = await db.aiJob.findUnique({ where: { id: jobId } })
  if (!job) return
  if (job.status === 'completed' || job.status === 'failed') return

  const writeStep = createStepWriter(jobId)
  const steps: Record<string, unknown> = {}

  // Cada marco é um evento REAL do roteador, não uma estimativa — ver
  // `AiTaskRequest.onProviderAttempt` em `lib/ai-router/types.ts`.
  const onAttempt = (info: { providerId: ProviderId; attemptNumber: number }) => {
    steps[`attempt_${info.attemptNumber}`] = { provider: info.providerId, at: new Date().toISOString() }
    void writeStep({ ...steps })
  }

  try {
    const resultJson = await run(job, onAttempt)
    await completeAiJob(jobId, resultJson)
  } catch (e: any) {
    const message = e?.diagnostic
      ? 'Os provedores de IA não responderam a tempo nesta tentativa. Tente de novo.'
      : e?.message && typeof e.message === 'string' && e.message.length < 200
        ? e.message
        : 'Ocorreu uma falha durante o processamento.'
    await failAiJob(jobId, message, e?.diagnostic || e?.message)
  }
}
