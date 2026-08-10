import 'server-only'
import { after } from 'next/server'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'
import { settleReservation, releaseReservation, type CreditReservation } from '../credits'
import type { Language } from '../i18n'
import {
  ANALYSIS_SEGMENTS,
  buildSharedContext,
  mergeSegments,
  type AnalysisSegmentSpec,
} from './segments'
import { SEGMENT_IDS, type SegmentId } from './stages'

/**
 * Execução da análise fora da requisição que a pediu.
 *
 * Três garantias, nesta ordem de importância:
 *
 * 1. **Não se perde.** O trabalho vive numa linha do banco, não na conexão. O
 *    usuário pode fechar o navegador no meio e encontrar o laudo pronto depois.
 * 2. **Retoma de onde parou.** Cada segmento é gravado assim que termina. Se a
 *    plataforma encerrar a função no meio, quem reassume refaz só o que falta —
 *    e a consulta de status é quem detecta e reassume, sem cron nem fila.
 * 3. **Um de cada vez.** A concessão (`leaseUntil`) impede que duas execuções
 *    processem o mesmo job em paralelo e paguem a IA duas vezes.
 */

/**
 * Duração da concessão. Precisa cobrir com folga o segmento mais lento
 * (`PROVIDER_TIMEOUT_MS` de 25s, mais um fallback), senão uma execução viva
 * seria considerada morta e teria o trabalho duplicado. É renovada a cada
 * segmento concluído, então o valor limita a detecção de morte, não a duração
 * total do job.
 */
const LEASE_MS = 60_000

/** Tentativas de retomada antes de desistir e devolver os créditos. */
const MAX_JOB_ATTEMPTS = 3

/** Uma repetição por segmento cobre a falha esporádica sem dobrar o custo. */
const SEGMENT_ATTEMPTS = 2

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

function reservationOf(job: {
  reservationId: string | null
  userId: string
  creditsCost: number
}): CreditReservation | null {
  // Sem `reservationId` o usuário é isento (admin): não há linha a liquidar nem
  // a estornar, e `settle`/`release` já tratam `id` nulo como no-op.
  if (!job.reservationId) return null
  return { id: job.reservationId, userId: job.userId, amount: job.creditsCost, exempt: false }
}

function parseJsonLoose(raw: string): any {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(cleaned)
}

function readSegments(json: string | null): Record<string, any> {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Toma posse do job para esta execução.
 *
 * A condição da atualização é o que garante a exclusão mútua: só um `updateMany`
 * encontra a linha com a concessão vencida e a atualiza; os demais recebem
 * `count === 0`. Um job já concluído nunca é reaberto.
 */
async function claimJob(jobId: string): Promise<boolean> {
  const now = new Date()
  const claimed = await db.analysisJob.updateMany({
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

async function executeSegment(
  spec: AnalysisSegmentSpec,
  ctx: {
    sharedContext: string
    userId: string
    resumeId: string
    userCountry: string | null
  }
): Promise<Record<string, unknown>> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= SEGMENT_ATTEMPTS; attempt++) {
    try {
      const result = await executeAiTask({
        taskType: 'analysis_segment',
        userId: ctx.userId,
        resumeId: ctx.resumeId,
        userCountry: ctx.userCountry,
        cacheableContext: ctx.sharedContext,
        systemPrompt: spec.instruction,
        userPrompt:
          'Produza agora, para o currículo do contexto, exatamente o que a sua tarefa pede. ' +
          'Responda somente com o JSON do schema.',
        maxTokens: spec.maxTokens,
        jsonSchema: spec.schema,
      })

      return spec.parse(parseJsonLoose(result.content))
    } catch (e) {
      lastError = e
      console.warn(
        `[Analysis] Segmento '${spec.id}' falhou na tentativa ${attempt}/${SEGMENT_ATTEMPTS}:`,
        (e as any)?.message || e
      )
    }
  }

  throw lastError
}

/**
 * Processa o job até o fim, ou até a plataforma interromper.
 *
 * Seguro para chamar mais de uma vez sobre o mesmo `jobId`: quem não conseguir a
 * concessão sai em silêncio, e quem retomar pula os segmentos já gravados.
 */
export async function processAnalysisJob(jobId: string): Promise<void> {
  if (!(await claimJob(jobId))) return

  const job = await db.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      resume: {
        select: {
          id: true,
          originalContent: true,
          targetJob: true,
          targetJobDescription: true,
        },
      },
    },
  })

  if (!job || !job.resume) return
  if (job.status === 'completed' || job.status === 'failed') return

  const reservation = reservationOf(job)

  // Desistir depois de esgotar as retomadas evita que um job que falha sempre
  // fique preso em `running` para sempre, com o crédito do usuário retido.
  if (job.attempts > MAX_JOB_ATTEMPTS) {
    await failJob(jobId, reservation, 'A análise não pôde ser concluída após várias tentativas.')
    return
  }

  const sharedContext = buildSharedContext({
    resumeContent: job.resume.originalContent.slice(0, 15000),
    targetJob: job.resume.targetJob,
    targetJobDescription: job.resume.targetJobDescription,
    lang: job.lang as Language,
  })

  const done = readSegments(job.segmentsJson)
  const pending = ANALYSIS_SEGMENTS.filter((spec) => !done[spec.id])

  // As gravações de progresso são encadeadas para não perderem umas às outras:
  // os segmentos terminam em paralelo e todos escrevem na mesma linha.
  let writeChain: Promise<unknown> = Promise.resolve()
  const serialize = <T,>(fn: () => Promise<T>): Promise<T> => {
    const next = writeChain.then(fn, fn)
    writeChain = next.catch(() => undefined)
    return next
  }

  const ctx = {
    sharedContext,
    userId: job.userId,
    resumeId: job.resumeId,
    userCountry: job.userCountry,
  }

  try {
    // Todos de uma vez: é o paralelismo aqui que troca ~82s por ~18s. O tempo
    // total passa a ser o do segmento mais lento, não a soma dos cinco.
    await Promise.all(
      pending.map(async (spec) => {
        const output = await executeSegment(spec, ctx)
        done[spec.id] = output

        // Gravar já, e não no fim: é isto que alimenta a tela com conteúdo real
        // enquanto o resto ainda está sendo gerado, e o que permite retomar sem
        // refazer o que já foi pago.
        await serialize(() =>
          db.analysisJob.update({
            where: { id: jobId },
            data: {
              segmentsJson: JSON.stringify(done),
              leaseUntil: new Date(Date.now() + LEASE_MS),
            },
          })
        )
      })
    )
  } catch (e: any) {
    const message = e?.diagnostic || e?.message || String(e)
    console.error(`[Analysis] Job ${jobId} falhou:`, message)
    await failJob(jobId, reservation, 'Falha ao gerar o laudo com a IA.', message)
    return
  }

  await serialize(async () => undefined)

  let analysis: Record<string, unknown>
  try {
    analysis = mergeSegments(done)
  } catch (e: any) {
    await failJob(jobId, reservation, e?.message || 'Laudo incompleto.', e?.message)
    return
  }

  const analysisJson = JSON.stringify(analysis)

  await db.resume.update({
    where: { id: job.resumeId },
    data: { analysisJson },
  })

  await db.analysisJob.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      resultJson: analysisJson,
      segmentsJson: JSON.stringify(done),
      finishedAt: new Date(),
      leaseUntil: null,
      errorMessage: null,
    },
  })

  // Entrega confirmada e persistida: só agora a reserva vira cobrança.
  await settleReservation(reservation)

  try {
    await db.auditLog.create({
      data: {
        userId: job.userId,
        resumeId: job.resumeId,
        action: 'analyze',
        meta: JSON.stringify({ jobId, segments: Object.keys(done).length }),
      },
    })
  } catch (e) {
    console.warn('[Analysis] Falha ao registrar auditoria:', e)
  }
}

async function failJob(
  jobId: string,
  reservation: CreditReservation | null,
  userMessage: string,
  diagnostic?: string
): Promise<void> {
  await db.analysisJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      errorMessage: userMessage,
      finishedAt: new Date(),
      leaseUntil: null,
    },
  })

  // O crédito volta aqui, no desfecho do trabalho — não mais no `catch` de uma
  // rota que podia ser encerrada antes de chegar nele.
  await releaseReservation(reservation, diagnostic ? `IA: ${diagnostic}` : userMessage)
}

/**
 * Retoma um job que ficou sem dono.
 *
 * Chamado pela consulta de status: se a execução que segurava o trabalho foi
 * encerrada pela plataforma, a concessão vence e a próxima consulta do próprio
 * usuário o traz de volta à vida. É o que dispensa fila e cron — quem está
 * esperando o resultado é quem reativa o processamento.
 */
export async function resumeIfStalled(jobId: string): Promise<boolean> {
  const stalled = await db.analysisJob.findFirst({
    where: {
      id: jobId,
      status: { in: ['queued', 'running'] },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    select: { id: true },
  })

  if (!stalled) return false

  const run = () =>
    processAnalysisJob(jobId).catch((e) => console.error('[Analysis] Falha ao retomar job:', e))

  // Via `after()`, e não com um `void` solto: quem consulta o status não deve
  // esperar a análise inteira, mas a plataforma precisa saber que ainda há
  // trabalho — uma promessa largada depois da resposta pode ser congelada junto
  // com a execução, e o job voltaria a ficar parado esperando o próximo poll.
  try {
    after(run)
  } catch {
    // Fora de um contexto de requisição `after()` não existe. Aí a única opção
    // é tocar direto, sem esperar.
    void run()
  }
  return true
}

/** Progresso observável do job, no formato que a tela consome. */
export function describeProgress(job: {
  status: string
  segmentsJson: string | null
}): { completedSegments: SegmentId[]; totalSegments: number; progress: number } {
  const done = readSegments(job.segmentsJson)
  const completed = SEGMENT_IDS.filter((id) => Boolean(done[id]))
  const total = SEGMENT_IDS.length

  return {
    completedSegments: completed,
    totalSegments: total,
    progress:
      job.status === 'completed' ? 100 : Math.round((completed.length / total) * 100),
  }
}

/** Laudo parcial montado com o que já chegou, para exibição durante a espera. */
export function partialAnalysis(segmentsJson: string | null): Record<string, unknown> | null {
  const done = readSegments(segmentsJson)
  if (Object.keys(done).length === 0) return null

  const dimensions = [
    ...(done.dimensions_a?.dimensions ?? []),
    ...(done.dimensions_b?.dimensions ?? []),
  ]

  // Sem `overall`: a nota geral é a média das oito dimensões e só existe quando
  // todas chegaram. Mostrar a média parcial daria um número que muda sozinho na
  // tela e não corresponde a nada.
  return {
    ...(done.executive ?? {}),
    dimensions,
    jobMatch: done.job_match?.jobMatch ?? null,
    targetedChanges: done.targeted_changes?.targetedChanges ?? [],
  }
}
