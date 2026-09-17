import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { FUNNEL_STEPS, summarizeFunnel } from '@/lib/analytics/funnel'

export const dynamic = 'force-dynamic'

/** Funil de pessoas distintas nos últimos `days` dias (padrão 30, até 180). */
export async function GET(req: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }
  const url = new URL(req.url)
  const days = Math.min(180, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await db.analyticsEvent.findMany({
    where: { createdAt: { gte: since }, event: { in: FUNNEL_STEPS.map((s) => s.event) } },
    select: { event: true, userId: true, visitorId: true },
    take: 200_000,
  })

  return NextResponse.json({ days, since: since.toISOString(), steps: summarizeFunnel(rows) })
}
