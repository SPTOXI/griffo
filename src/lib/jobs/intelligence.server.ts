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

/** Chamadas simultâneas. O DeepSeek aguenta; o Kimi (3 por organização) fica fora da cadeia. */
const CONCURRENCY = 6

/** Orçamento de uma chamada. Uma extração curta leva 3–8s no DeepSeek Flash. */
const CALL_BUDGET_MS = 25_000

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

export async function extractPendingJobIntelligence(deadlineAt: number): Promise<JobIntelligenceRun> {
  const run: JobIntelligenceRun = {
    read: 0,
    fromRequirementsText: 0,
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

  const hasTime = () => Date.now() + CALL_BUDGET_MS < deadlineAt

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
        taskType: 'job_intelligence',
        systemPrompt: jobIntelligenceSystemPrompt(),
        userPrompt: jobIntelligenceUserPrompt({ title: job.title, company: job.company, description: picked.text }),
        jsonSchema: JOB_INTELLIGENCE_JSON_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 600,
        disableThinking: true,
        internal: true,
        timeBudgetMs: CALL_BUDGET_MS,
      })
      run.costUsd += ai.costUsd ?? 0
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
      orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
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
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))

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
