export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { NextRequest, NextResponse } from 'next/server'
import { jobBaseCredentials } from '@/lib/jobs/adapters/jobbase'
import { closeJobBaseExpired, syncJobBaseOpen } from '@/lib/jobs/jobbase-sync.server'

/**
 * Sincroniza o JobBase inteiro, fora da rodada do Radar (§2.144).
 *
 * - `?cursor=<id>` (ou sem cursor, para começar): lê as vagas abertas a partir
 *   dali até o prazo e devolve `nextCursor`. O workflow chama de novo até
 *   `done: true`.
 * - `?phase=close`: fecha aqui o que o JobBase declarou encerrado.
 *
 * Agendada por `.github/workflows/jobbase-sync.yml`, pelo mesmo motivo das
 * outras rotas fora do `vercel.json`: o plano Hobby só agenda dois crons.
 * `JOBBASE=off` desliga, como na coleta do Radar.
 */

/** Não começa página nova depois disto: uma página leva alguns segundos. */
const START_BEFORE_MS = 35_000
/** A gravação em curso tem de terminar até aqui, com folga para responder. */
const DEADLINE_MS = 52_000

export async function GET(req: NextRequest) {
  const startedAt = Date.now()
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/jobbase-sync] CRON_SECRET não configurado — a sincronização não é executada.')
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado. A sincronização não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (!cronAuthorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }

  if ((process.env.JOBBASE ?? '').trim().toLowerCase() === 'off') {
    return NextResponse.json({ ok: true, skipped: 'JOBBASE=off', done: true })
  }

  const credentials = jobBaseCredentials(process.env.JOBBASE_URL, process.env.JOBBASE_ANON_KEY)
  const params = req.nextUrl.searchParams

  try {
    if (params.get('phase') === 'close') {
      const run = await closeJobBaseExpired({ credentials })
      return NextResponse.json({ ok: true, phase: 'close', ...run, durationMs: Date.now() - startedAt })
    }

    const rawCursor = params.get('cursor')
    const cursor = rawCursor && /^\d+$/.test(rawCursor) ? Number(rawCursor) : null
    const run = await syncJobBaseOpen({
      credentials,
      cursor,
      startBefore: startedAt + START_BEFORE_MS,
      deadlineAt: startedAt + DEADLINE_MS,
    })
    return NextResponse.json({ ok: true, phase: 'open', ...run, durationMs: Date.now() - startedAt })
  } catch (e: any) {
    console.error('[cron/jobbase-sync] Falha:', e?.message || e)
    return NextResponse.json({ ok: false, error: e?.message || 'Falha na sincronização do JobBase.' }, { status: 500 })
  }
}
