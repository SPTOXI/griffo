import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { analyzeAiLogs } from '@/lib/agents/log-analyst'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Leitura correlacional do `AiLog` (P11).
 *
 * Em lote e sob demanda: é análise sobre dados já agregados, não algo que
 * precise rodar a cada requisição.
 */
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const requested = Number(body?.windowDays)
    const windowDays = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), 90)
      : 7

    const report = await analyzeAiLogs(windowDays)

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ai_insights',
        meta: JSON.stringify({
          windowDays: report.windowDays,
          totalCalls: report.totalCalls,
          failures: report.failures,
        }),
      },
    })

    return NextResponse.json({ success: true, report })
  } catch (e: any) {
    console.error('ai-insights error', e?.message || e)
    return NextResponse.json({ error: 'Erro ao analisar os registros de IA.' }, { status: 500 })
  }
}
