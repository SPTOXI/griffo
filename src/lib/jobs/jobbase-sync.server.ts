import 'server-only'
import { db } from '../db'
import { runCollection } from '../radar/runner'
import type { JobSourceAdapter } from './adapter'
import {
  fetchJobBaseClosedKeys,
  fetchJobBaseOpenPage,
  JOBBASE_DESCRIPTOR,
  type JobBaseCredentials,
} from './adapters/jobbase'

/**
 * A sincronização do JobBase, fora da rodada do Radar (§2.144).
 *
 * ## Por que existe
 *
 * O Radar coleta todas as fontes numa função de 60s, com 12s para cada uma. No
 * JobBase isso cabia nas 5 mil vagas mais novas; em 28/09/2026 ele tinha 12.230
 * abertas. As ~7 mil de fora nunca eram relidas: ficavam sem descrição (e sem
 * ficha), e seguiam "abertas" aqui até 45 dias depois de encerradas lá. Das
 * 15.770 que contávamos como abertas, ~9.500 não eram vistas havia 3 dias.
 *
 * ## Como funciona
 *
 * 1. `syncJobBaseOpen`: percorre as abertas por cursor, uma página por vez, e
 *    grava cada página pelo mesmo caminho do Radar (`runCollection`). Para
 *    antes do prazo e devolve o cursor; a próxima chamada continua dali.
 * 2. `closeJobBaseExpired`: fecha aqui o que o JobBase declarou encerrado.
 *    Só fecha pelo que a fonte DISSE (§12) — nunca pela vaga ter faltado numa
 *    página.
 *
 * Quem encadeia as chamadas é o workflow `jobbase-sync.yml`.
 */

/** Uma página do JobBase por `runCollection`: ~1000 vagas cabem folgadas. */
const PAGE_SIZE = 1000

/**
 * A página já coletada, entregue a `runCollection` como se fosse uma fonte.
 *
 * `complete` porque a página em si veio inteira. Se a GRAVAÇÃO não terminar
 * antes do prazo, `runCollection` rebaixa para `partial` — e é esse sinal que
 * impede o cursor de avançar sobre vagas não gravadas.
 */
function pageAdapter(jobs: Awaited<ReturnType<typeof fetchJobBaseOpenPage>>['jobs']): JobSourceAdapter {
  return {
    descriptor: JOBBASE_DESCRIPTOR,
    collect: async () => ({ outcome: 'complete', jobs, pagesFetched: 1 }),
  }
}

export interface JobBaseSyncRun {
  pages: number
  read: number
  inserted: number
  updated: number
  /** Onde a próxima chamada começa; `null` quando a base inteira foi lida. */
  nextCursor: number | null
  done: boolean
  stoppedBy: 'done' | 'deadline' | 'write_incomplete'
}

export async function syncJobBaseOpen(options: {
  credentials: JobBaseCredentials
  cursor: number | null
  /** Instante em que a última gravação tem de ter terminado. */
  deadlineAt: number
  /** Não começa uma página nova depois disto. */
  startBefore: number
  fetchImpl?: typeof fetch
}): Promise<JobBaseSyncRun> {
  const run: JobBaseSyncRun = {
    pages: 0,
    read: 0,
    inserted: 0,
    updated: 0,
    nextCursor: options.cursor,
    done: false,
    stoppedBy: 'deadline',
  }

  while (Date.now() < options.startBefore) {
    const page = await fetchJobBaseOpenPage({
      credentials: options.credentials,
      cursor: run.nextCursor,
      pageSize: PAGE_SIZE,
      fetchImpl: options.fetchImpl,
    })

    const result = await runCollection(pageAdapter(page.jobs), {
      timeBudgetMs: Math.max(1000, options.deadlineAt - Date.now()),
      deadlineAt: options.deadlineAt,
    })
    if (result.status === 'partial') {
      // Gravação cortada pelo prazo: o cursor fica onde estava, e a próxima
      // chamada refaz esta página inteira. Regravar é inofensivo.
      run.stoppedBy = 'write_incomplete'
      return run
    }

    run.pages++
    run.read += page.rows
    run.inserted += result.inserted
    run.updated += result.updated
    run.nextCursor = page.nextCursor

    if (page.nextCursor === null) {
      run.done = true
      run.stoppedBy = 'done'
      return run
    }
  }

  return run
}

export interface JobBaseCloseRun {
  /** Encerradas no JobBase, segundo a lista dele. */
  reportedClosed: number
  /** Abertas aqui que passaram a encerradas. */
  closed: number
}

/** `updateMany` com `in` de milhares de ids vira uma consulta enorme; em lotes. */
const CLOSE_CHUNK = 1000

export async function closeJobBaseExpired(options: {
  credentials: JobBaseCredentials
  now?: Date
  fetchImpl?: typeof fetch
}): Promise<JobBaseCloseRun> {
  const now = options.now ?? new Date()
  const source = await db.jobSource.findUnique({ where: { slug: JOBBASE_DESCRIPTOR.slug }, select: { id: true } })
  if (!source) return { reportedClosed: 0, closed: 0 }

  const keys = await fetchJobBaseClosedKeys({ credentials: options.credentials, fetchImpl: options.fetchImpl })

  let closed = 0
  for (let i = 0; i < keys.length; i += CLOSE_CHUNK) {
    const res = await db.job.updateMany({
      where: { sourceId: source.id, closedAt: null, sourceJobId: { in: keys.slice(i, i + CLOSE_CHUNK) } },
      data: { closedAt: now, closedReason: 'source_reported' },
    })
    closed += res.count
  }

  return { reportedClosed: keys.length, closed }
}
