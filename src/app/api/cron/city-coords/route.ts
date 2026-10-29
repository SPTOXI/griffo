export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { syncCityCoords } from '@/lib/city-jobs/city-coords.server'
import { CITY_JOBS_CACHE_TAG } from '@/lib/city-jobs/city-index.server'

/**
 * Coordenadas das cidades novas para o mapa de vagas (`city-jobs/city-coords.server.ts`).
 * Roda depois do agente de cidades, no fim da sincronização diária da base de
 * vagas (`.github/workflows/jobbase-sync.yml`).
 *
 * Mesma autenticação das outras rotas de cron: sem `CRON_SECRET`, 503.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET não configurado.' }, { status: 503 })
  }
  if (!cronAuthorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const run = await syncCityCoords()
    if (run.found) revalidateTag(CITY_JOBS_CACHE_TAG, { expire: 0 })
    return NextResponse.json({ ok: true, ...run })
  } catch (e: any) {
    console.error('[cron/city-coords] falhou:', e?.message || e)
    return NextResponse.json({ ok: false, error: 'Falha ao buscar as coordenadas.' }, { status: 500 })
  }
}
