/**
 * Leitura de progresso de um `AiJob` — separada de `engine.ts` porque lá o
 * módulo importa `server-only` e o Prisma, o que o torna impossível de
 * exercitar num teste. Mesmo motivo da separação `registry.ts`/`pricing.ts`
 * no roteador de IA. `engine.ts` reexporta tudo, então os importadores
 * antigos continuam valendo.
 */

export function readSteps(json: string | null): Record<string, unknown> {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** Progresso observável do job, no formato que a tela consome. */
export function describeAiJobProgress(job: {
  status: string
  stepsJson: string | null
  totalSteps: number
}): { completedSteps: number; totalSteps: number; progress: number } {
  const done = readSteps(job.stepsJson)
  const completed = Object.keys(done).length
  const total = Math.max(1, job.totalSteps)

  return {
    completedSteps: completed,
    totalSteps: job.totalSteps,
    progress: job.status === 'completed' ? 100 : Math.round((completed / total) * 100),
  }
}
