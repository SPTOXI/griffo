export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { NextRequest, NextResponse } from 'next/server'
import { countPendingJobIntelligence, extractPendingJobIntelligence } from '@/lib/jobs/intelligence.server'

/**
 * Lê as vagas ainda sem ficha e grava o que elas pedem (§2.136).
 *
 * Roda a cada 30 minutos (`.github/workflows/job-intelligence.yml`), fora do
 * `vercel.json` pelo mesmo motivo da retenção: o plano Hobby agenda só dois
 * crons e os dois estão ocupados. Cada rodada trabalha até o prazo e para; a
 * seguinte continua de onde esta parou.
 *
 * Mesma autenticação das outras rotas de cron: sem `CRON_SECRET`, 503 e nada roda.
 */

/** Folga para gravar a última ficha e responder antes do `maxDuration`. */
const SAFETY_MS = 8_000

export async function GET(req: NextRequest) {
  const startedAt = Date.now()
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/job-intelligence] CRON_SECRET não configurado — a leitura não é executada.')
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado. A leitura não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (!cronAuthorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const run = await extractPendingJobIntelligence(startedAt + maxDuration * 1000 - SAFETY_MS)
    const pending = await countPendingJobIntelligence()
    return NextResponse.json({ ok: true, ...run, costUsd: Number(run.costUsd.toFixed(4)), pending })
  } catch (e: any) {
    console.error('[cron/job-intelligence] Falha:', e?.message || e)
    return NextResponse.json({ ok: false, error: 'Falha na leitura das vagas.' }, { status: 500 })
  }
}
