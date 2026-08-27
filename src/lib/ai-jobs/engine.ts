import 'server-only'
import { after } from 'next/server'
import { db } from '../db'

// A tabela de progresso vive em ./progress (sem dependência de banco, para
// poder ser testada). Reexportada aqui porque este é o módulo que o resto do
// sistema importa.
export { describeAiJobProgress } from './progress'

/**
 * Motor genérico de jobs de IA fora do laudo principal (ver
 * HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento", e 2.35 na
 * auditoria).
 *
 * Mesmo desenho de concessão/retomada do `lib/analysis/job.ts` — que continua
 * intacto, dedicado ao laudo —, generalizado por `AiJob.kind`. Diferente do
 * laudo, nenhum destes fluxos precisa sobreviver a várias invocações da
 * função: o mais longo (reescrita, 3 seções) ainda cabe dentro de um único
 * `after()`. Por isso não há aqui o equivalente a `MAX_JOB_ATTEMPTS`/orçamento
 * fatiado — só a concessão de exclusividade, para o caso raro de a plataforma
 * encerrar a execução no meio e a próxima consulta de status precisar
 * reativar o trabalho.
 */

const LEASE_MS = 60_000

export type AiJobKind =
  | 'social_advice'
  | 'profile_extraction'
  | 'career_orientation'
  | 'cover_letter'
  | 'rewrite'

/** Roda um job até o fim. Um runner por `kind` implementa isto. */
export type AiJobRunner = (jobId: string) => Promise<void>

/**
 * Registro de runners por `kind`, para que `resumeIfStalled` saiba qual
 * função retomar sem precisar de um `switch` cravado aqui — que exigiria este
 * arquivo importar todos os runners e arriscar dependência circular
 * (runner → engine → runner). Populado por `lib/ai-jobs/runners/index.ts`,
 * que toda rota que consulta status importa.
 */
const runnerRegistry: Partial<Record<string, AiJobRunner>> = {}

export function registerAiJobRunner(kind: AiJobKind, runner: AiJobRunner): void {
  runnerRegistry[kind] = runner
}

/**
 * Toma posse do job para esta execução.
 *
 * Mesma exclusão mútua do `AnalysisJob`: só um `updateMany` encontra a linha
 * com a concessão vencida, os demais recebem `count === 0`.
 */
export async function claimAiJob(jobId: string): Promise<boolean> {
  const now = new Date()
  const claimed = await db.aiJob.updateMany({
    where: {
      id: jobId,
      status: { in: ['queued', 'running'] },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
    },
    data: {
      status: 'running',
      leaseUntil: new Date(now.getTime() + LEASE_MS),
      attempts: { increment: 1 },
    },
  })
  return claimed.count === 1
}

/**
 * Serializador de escritas, igual ao de `lib/analysis/job.ts`: etapas
 * terminam em paralelo e todas escrevem na mesma linha, então precisam de
 * fila, não de escrita concorrente.
 */
export function createStepWriter(jobId: string) {
  let chain: Promise<unknown> = Promise.resolve()

  return function writeStep(steps: Record<string, unknown>): Promise<void> {
    const next = chain.then(() =>
      db.aiJob.update({
        where: { id: jobId },
        data: {
          stepsJson: JSON.stringify(steps),
          attempts: 0,
          leaseUntil: new Date(Date.now() + LEASE_MS),
        },
      })
    )
    chain = next.catch(() => undefined)
    return next.then(() => undefined)
  }
}

export async function failAiJob(jobId: string, userMessage: string, diagnostic?: string): Promise<void> {
  await db.aiJob.update({
    where: { id: jobId },
    data: { status: 'failed', errorMessage: userMessage, finishedAt: new Date(), leaseUntil: null },
  })
  if (diagnostic) console.warn(`[AiJob] Job ${jobId} encerrado:`, diagnostic)
}

export async function completeAiJob(jobId: string, resultJson: string): Promise<void> {
  await db.aiJob.update({
    where: { id: jobId },
    data: { status: 'completed', resultJson, finishedAt: new Date(), leaseUntil: null, errorMessage: null },
  })
}

/**
 * Retoma um job que ficou sem dono — mesma lógica de `resumeIfStalled` do
 * laudo, generalizada: quem sabe RODAR o job é o runner registrado para o
 * `kind` dele.
 */
export async function resumeIfStalled(jobId: string): Promise<boolean> {
  const stalled = await db.aiJob.findFirst({
    where: {
      id: jobId,
      status: { in: ['queued', 'running'] },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    select: { id: true, kind: true },
  })

  if (!stalled) return false

  const runner = runnerRegistry[stalled.kind]
  if (!runner) {
    console.warn(`[AiJob] Job ${jobId}: nenhum runner registrado para kind '${stalled.kind}'.`)
    return false
  }

  console.warn(`[AiJob] Job ${jobId} (${stalled.kind}) sem dono; reativando.`)

  const run = () => runner(jobId).catch((e) => console.error('[AiJob] Falha ao retomar job:', e))

  try {
    after(run)
  } catch {
    // Fora de um contexto de requisição `after()` não existe.
    void run()
  }
  return true
}
