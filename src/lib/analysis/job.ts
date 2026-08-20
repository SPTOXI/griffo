import 'server-only'
import { after } from 'next/server'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'
import type { Language } from '../i18n'
import { loadProfileContext } from '../profile/server'
import {
  ANALYSIS_SEGMENTS,
  buildSharedContext,
  mergeSegments,
  type AnalysisSegmentSpec,
} from './segments'
import { SEGMENT_IDS, type SegmentId } from './stages'
import { executionDeadline, leaseUntil, segmentBudgetMs } from './budget'

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

/**
 * Retomadas SEM PROGRESSO antes de desistir.
 *
 * Conta tentativas infrutíferas, não tentativas: `attempts` volta a zero
 * sempre que um segmento é gravado. A distinção importa porque uma análise
 * legítima pode precisar de várias invocações — cinco segmentos nem sempre
 * cabem nos 60s de uma só. Contando tentativas absolutas, um job que estava
 * avançando normalmente era declarado falho na quarta passada.
 *
 * O que este limite existe para pegar é o job que roda e não sai do lugar. Esse
 * continua pego.
 */
const MAX_JOB_ATTEMPTS = 3

/** Uma repetição por segmento cobre a falha esporádica sem dobrar o custo. */
const SEGMENT_ATTEMPTS = 2

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

// `reservationOf`, `settleReservation` e `releaseReservation` viviam aqui: o
// job carregava uma reserva de crédito e precisava liquidá-la no fecho ou
// estorná-la na falha. Nada disso existe mais. O que se compra é o destrave do
// currículo, feito na rota que abre a análise, e ele não é desfeito por uma
// falha de processamento — o currículo continua liberado e a análise pode ser
// repetida sem custo. Um job que falha não deve nada a ninguém.

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

/**
 * Acabou o tempo DESTA invocação — o que não é falha da análise.
 *
 * O progresso já gravado continua no banco, a concessão vence junto com a
 * invocação, e a próxima consulta de status retoma de onde parou. Tratar isto
 * como falha marcaria o job como `failed` e faria o usuário perder um laudo que
 * estava a um segmento de ficar pronto.
 */
class ExecutionBudgetExhausted extends Error {
  constructor(segmentId: string) {
    super(`Sem tempo nesta invocação para o segmento '${segmentId}'.`)
    this.name = 'ExecutionBudgetExhausted'
  }
}

async function executeSegment(
  spec: AnalysisSegmentSpec,
  ctx: {
    sharedContext: string
    userId: string
    resumeId: string
    userCountry: string | null
    /** Instante em que esta invocação para de começar trabalho novo. */
    deadlineAt: number
  }
): Promise<Record<string, unknown>> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= SEGMENT_ATTEMPTS; attempt++) {
    // O orçamento sai do que sobra da INVOCAÇÃO, e não do padrão do roteador.
    //
    // Sem isto, cada tentativa pedia os 52s padrão dentro de uma função de 60s:
    // a segunda tentativa era impossível por construção, e a primeira, quando
    // usava o orçamento inteiro, garantia que a plataforma encerrasse tudo no
    // meio — inclusive as gravações dos outros segmentos, que rodam junto.
    const budget = segmentBudgetMs(Date.now(), ctx.deadlineAt)
    if (budget === null) {
      if (lastError) throw lastError
      throw new ExecutionBudgetExhausted(spec.id)
    }

    try {
      const result = await executeAiTask({
        timeBudgetMs: budget,
        taskType: 'analysis_segment',
        userId: ctx.userId,
        resumeId: ctx.resumeId,
        userCountry: ctx.userCountry,
        cacheableContext: ctx.sharedContext,
        // Extração estruturada com schema estrito: o raciocínio do modelo não
        // acrescenta qualidade aqui e disputa o mesmo orçamento de `max_tokens`
        // que a resposta. Desligá-lo é o que faz os segmentos caberem no
        // orçamento curto — e é também metade do ganho de latência.
        disableThinking: true,
        // Sem `temperature`: a geração Claude 5 recusa o parâmetro (ver o
        // comentário em ai-router/router.ts). A estabilidade das notas vem dos
        // critérios ancorados na instrução de cada segmento, não da API.
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
  // Marcado ANTES da posse: é a partir daqui que a plataforma conta os 60s, e
  // é este instante — não "agora" — que limita até quando a concessão pode
  // alegar que esta invocação está viva.
  const executionStartedAt = Date.now()
  const deadlineAt = executionDeadline(executionStartedAt)

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


  // Desistir depois de esgotar as retomadas SEM PROGRESSO evita que um job que
  // falha sempre fique preso em `running` para sempre. `attempts` volta a zero
  // a cada segmento gravado, então uma análise que está avançando nunca cai
  // aqui, por mais invocações que precise.
  if (job.attempts > MAX_JOB_ATTEMPTS) {
    await failJob(jobId, 'A análise não pôde ser concluída após várias tentativas.')
    return
  }

  // Mercado profissional da análise: o alvo declarado no Perfil Profissional
  // manda; sem ele, o país onde a pessoa está, capturado no pedido. Nunca o
  // país de pagamento, que responde por preço e não por carreira.
  //
  // A leitura acontece aqui, e não na rota que enfileirou o trabalho, porque
  // esta função também roda ao RETOMAR um job numa invocação posterior, onde
  // não existe requisição nenhuma para consultar.
  const { market, promptContext: profileContext } = await loadProfileContext(job.userId, {
    edgeCountry: job.userCountry,
    language: job.lang as Language,
  })

  const sharedContext = buildSharedContext({
    resumeContent: job.resume.originalContent.slice(0, 15000),
    targetJob: job.resume.targetJob,
    targetJobDescription: job.resume.targetJobDescription,
    lang: job.lang as Language,
    market,
    profileContext,
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
    deadlineAt,
  }

  // `allSettled`, e não `Promise.all`: com `all`, o primeiro segmento a
  // terminar mal derrubava o bloco inteiro enquanto os outros ainda estavam em
  // voo, e o que eles já tinham produzido se perdia sem ser gravado. Aqui todos
  // chegam ao fim e gravam o que conseguiram, e só depois se decide o desfecho.
  const outcomes = await Promise.allSettled(
    pending.map(async (spec) => {
      const output = await executeSegment(spec, ctx)
      done[spec.id] = output

      // Gravar já, e não no fim: é isto que alimenta a tela com conteúdo real
      // enquanto o resto ainda está sendo gerado, e o que permite retomar sem
      // refazer o que já foi pago.
      //
      // `attempts: 0` porque este segmento é progresso: o contador existe para
      // pegar job que roda e não sai do lugar, não job que precisa de mais de
      // uma invocação.
      await serialize(() =>
        db.analysisJob.update({
          where: { id: jobId },
          data: {
            segmentsJson: JSON.stringify(done),
            attempts: 0,
            leaseUntil: leaseUntil({
              now: Date.now(),
              executionStartedAt,
              leaseMs: LEASE_MS,
            }),
          },
        })
      )
    })
  )

  await serialize(async () => undefined)

  const errors = outcomes
    .filter((o): o is PromiseRejectedResult => o.status === 'rejected')
    .map((o) => o.reason)

  const realErrors = errors.filter((e) => !(e instanceof ExecutionBudgetExhausted))

  if (realErrors.length > 0) {
    const message = realErrors
      .map((e: any) => e?.diagnostic || e?.message || String(e))
      .join(' | ')
    console.error(`[Analysis] Job ${jobId} falhou:`, message)
    await failJob(jobId, 'Falha ao gerar o laudo com a IA.', message)
    return
  }

  if (errors.length > 0) {
    // Só faltou tempo NESTA invocação. O job continua `running`, a concessão
    // vence junto com ela, e a próxima consulta de status retoma o que falta —
    // sem refazer, sem cobrar de novo e sem declarar falha de um laudo que está
    // quase pronto.
    console.warn(
      `[Analysis] Job ${jobId}: ${errors.length} segmento(s) sem tempo nesta invocação; retomará.`
    )
    return
  }

  let analysis: Record<string, unknown>
  try {
    analysis = mergeSegments(done)
  } catch (e: any) {
    await failJob(jobId, e?.message || 'Laudo incompleto.', e?.message)
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

  if (diagnostic) console.warn(`[Analysis] Job ${jobId} encerrado:`, diagnostic)
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
