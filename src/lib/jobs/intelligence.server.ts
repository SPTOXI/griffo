import 'server-only'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'
import { daysAgo, freshOpenJobWhere } from './lifecycle'
import { fetchJobBaseRequirementTexts, jobBaseCredentials } from './adapters/jobbase'
import {
  intelligenceMarker,
  isEmptyList,
  JOB_INTELLIGENCE_JSON_SCHEMA,
  jobIntelligenceSystemPrompt,
  jobIntelligenceUserPrompt,
  parseJobIntelligence,
  pickExtractionText,
} from './intelligence'

/**
 * Lê as vagas que ainda não têm ficha e grava o que elas pedem (§2.136).
 *
 * Roda por cron (`/api/cron/job-intelligence`), não na coleta: a coleta já usa
 * quase todo o orçamento de 60s da invocação, e extrair ali faria uma vaga
 * nova esperar o próximo dia se o prazo acabasse. Aqui cada rodada pega as
 * mais recentes ainda não lidas, até o prazo, e a seguinte continua de onde
 * esta parou — o estoque inteiro se resolve em poucos dias, e depois disso
 * cada rodada só pega o que entrou desde a anterior.
 */

/**
 * Chamadas simultâneas por modo.
 *
 * - `cron` (DeepSeek): 6 — o DeepSeek aguenta, e a rodada tem ~27s para
 *   começar leituras.
 * - `backfill` (Kimi): 3, o teto do Kimi por organização (ver 2.34 na
 *   auditoria). Acima disso ele devolve 429 e o excedente cai no DeepSeek.
 */
/**
 * Orçamento de uma chamada, por modo. O roteador o DIVIDE entre as duas
 * tentativas (primário e suplente), então cada uma fica com pouco menos da
 * metade:
 *
 * - `cron`: 25s → ~12s para o DeepSeek (3,4s na mediana) e ~12s para o suplente.
 *   Cabe no prazo de 60s da função.
 * - `backfill`: 60s → ~29s para o Kimi e ~29s para o DeepSeek. Com 25s aqui o
 *   Kimi ficaria com ~12s — a mediana dele (AiLog, set/2026) —, metade das
 *   chamadas estouraria, e o estoque que devia sair do crédito do Kimi iria
 *   para o DeepSeek em silêncio. O script não tem o prazo de 60s, então pode.
 */
const MODES = {
  cron: { taskType: 'job_intelligence', concurrency: 6, order: 'desc', callBudgetMs: 25_000 },
  backfill: { taskType: 'job_intelligence_backfill', concurrency: 3, order: 'asc', callBudgetMs: 60_000 },
} as const

export type JobIntelligenceMode = keyof typeof MODES

/**
 * Falhas seguidas que encerram a rodada. Provedor fora do ar não é defeito da
 * vaga: a rodada para e a próxima tenta de novo, sem marcar nada.
 */
const MAX_CONSECUTIVE_FAILURES = 3

const PAGE = 60

/**
 * Só vaga vista numa coleta recente vale a leitura (§2.137). O JobBase passou
 * a marcar vaga encerrada, e ela some da resposta dele — mas aqui ela só fecha
 * depois de `STALE_AFTER_DAYS` sem reaparecer. Sem este corte, pagaríamos para
 * ler milhares de vagas que a própria fonte já deu como encerradas.
 */
const SEEN_WITHIN_DAYS = 3

export interface JobIntelligenceRun {
  read: number
  /** Lidas pela seção de requisitos do JobBase, e não pela descrição inteira. */
  fromRequirementsText: number
  /**
   * Lidas pelo SUPLENTE, porque o primário não respondeu. No backfill é o
   * sinal de que o Kimi está fora: o script avisa quando isto passa de um
   * terço das lidas.
   */
  viaFallback: number
  withItems: number
  empty: number
  tooShort: number
  unparseable: number
  failed: number
  costUsd: number
  stoppedBy: 'done' | 'deadline' | 'provider_failures'
}

type Candidate = {
  id: string
  sourceId: string
  sourceJobId: string | null
  title: string
  company: string
  description: string | null
  skills: string | null
}

function pendingWhere() {
  return {
    AND: [
      freshOpenJobWhere(),
      { lastSeenAt: { gte: daysAgo(new Date(), SEEN_WITHIN_DAYS) } },
      { description: { not: null } },
      { intelligenceJson: null },
      // Nenhuma fonte manda requisito hoje; se uma passar a mandar, a lista
      // dela vale mais que a nossa leitura, e a vaga não entra aqui.
      { OR: [{ requirements: null }, { requirements: '[]' }] },
    ],
  }
}

/**
 * `mode` escolhe provedor, concorrência e ORDEM: o cron pega as mais recentes
 * e o backfill as mais antigas, para que os dois rodando ao mesmo tempo não
 * disputem as mesmas vagas — e, se disputarem uma, o pior caso é ela ser lida
 * duas vezes.
 */
export async function extractPendingJobIntelligence(
  deadlineAt: number,
  mode: JobIntelligenceMode = 'cron'
): Promise<JobIntelligenceRun> {
  const { taskType, concurrency, order, callBudgetMs } = MODES[mode]
  const run: JobIntelligenceRun = {
    read: 0,
    fromRequirementsText: 0,
    viaFallback: 0,
    withItems: 0,
    empty: 0,
    tooShort: 0,
    unparseable: 0,
    failed: 0,
    costUsd: 0,
    stoppedBy: 'done',
  }
  let consecutiveFailures = 0
  // Falhou nesta rodada: não volta para a fila dela, senão a mesma vaga
  // seria buscada de novo em cada página.
  const skip = new Set<string>()

  const hasTime = () => Date.now() + callBudgetMs < deadlineAt

  const jobBaseSourceId = (await db.jobSource.findUnique({ where: { slug: 'jobbase' }, select: { id: true } }))?.id

  async function processOne(job: Candidate, requirementsText: string | undefined): Promise<void> {
    const picked = pickExtractionText({ requirementsText, description: job.description })
    if (!picked) {
      await db.job.update({ where: { id: job.id }, data: { intelligenceJson: intelligenceMarker('too_short') } })
      run.tooShort++
      return
    }

    try {
      const ai = await executeAiTask({
        taskType,
        systemPrompt: jobIntelligenceSystemPrompt(),
        userPrompt: jobIntelligenceUserPrompt({ title: job.title, company: job.company, description: picked.text }),
        jsonSchema: JOB_INTELLIGENCE_JSON_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 600,
        disableThinking: true,
        internal: true,
        timeBudgetMs: callBudgetMs,
      })
      run.costUsd += ai.costUsd ?? 0
      if (ai.failoverCount > 0) run.viaFallback++
      consecutiveFailures = 0

      const parsed = parseJobIntelligence(ai.content)
      if (!parsed) {
        await db.job.update({ where: { id: job.id }, data: { intelligenceJson: intelligenceMarker('unparseable') } })
        run.unparseable++
        return
      }

      await db.job.update({
        where: { id: job.id },
        data: {
          requirements: JSON.stringify(parsed.requirements),
          // As competências que a fonte mandou (quadros remotos mandam
          // etiquetas) ficam; a leitura só preenche o que está vazio.
          ...(isEmptyList(job.skills) ? { skills: JSON.stringify(parsed.skills) } : {}),
          intelligenceJson: intelligenceMarker('ok'),
        },
      })
      run.read++
      if (picked.source === 'requirements') run.fromRequirementsText++
      if (parsed.requirements.length + parsed.skills.length > 0) run.withItems++
      else run.empty++
    } catch (e: any) {
      consecutiveFailures++
      run.failed++
      skip.add(job.id)
      console.warn('[job-intelligence] falha ao ler a vaga:', e?.message || e)
    }
  }

  while (true) {
    if (!hasTime()) {
      run.stoppedBy = 'deadline'
      break
    }

    const batch: Candidate[] = await db.job.findMany({
      where: { ...pendingWhere(), ...(skip.size ? { id: { notIn: [...skip] } } : {}) },
      orderBy: { publishedAt: { sort: order, nulls: 'last' } },
      take: PAGE,
      select: { id: true, sourceId: true, sourceJobId: true, title: true, company: true, description: true, skills: true },
    })
    if (batch.length === 0) break

    const fromJobBase = batch.filter((j) => j.sourceId === jobBaseSourceId && j.sourceJobId)
    const requirementTexts = fromJobBase.length
      ? await fetchJobBaseRequirementTexts(
          fromJobBase.map((j) => j.sourceJobId!),
          { credentials: jobBaseCredentials(process.env.JOBBASE_URL, process.env.JOBBASE_ANON_KEY) }
        )
      : new Map<string, string>()

    const queue = [...batch]
    const worker = async () => {
      while (queue.length > 0 && hasTime() && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        const job = queue.shift()!
        const fromSource = job.sourceId === jobBaseSourceId && job.sourceJobId ? requirementTexts.get(job.sourceJobId) : undefined
        await processOne(job, fromSource)
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker))

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      run.stoppedBy = 'provider_failures'
      break
    }
  }

  return run
}

/** Quantas vagas ainda esperam leitura — para o retorno do cron e o painel. */
export async function countPendingJobIntelligence(): Promise<number> {
  return db.job.count({ where: pendingWhere() })
}
