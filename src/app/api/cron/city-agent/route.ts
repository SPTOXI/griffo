export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { NextRequest, NextResponse } from 'next/server'
import { runCityAgent } from '@/lib/city-jobs/city-agent.server'

/**
 * Revisão automática das grafias de cidade das páginas de vagas, no DeepSeek
 * Flash (`city-jobs/city-agent.server.ts`). Roda como último passo da
 * sincronização diária da base de vagas (`.github/workflows/jobbase-sync.yml`),
 * logo depois que as vagas novas chegam; cada chamada trabalha até o prazo e
 * para, e a seguinte continua.
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
    const run = await runCityAgent({ deadlineMs: 50_000 })
    return NextResponse.json({ ok: true, ...run })
  } catch (e: any) {
    console.error('[cron/city-agent] falhou:', e?.message || e)
    return NextResponse.json({ ok: false, error: 'Falha na revisão de cidades.' }, { status: 500 })
  }
}
