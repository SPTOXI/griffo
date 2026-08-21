import { NextRequest, NextResponse } from 'next/server'
import { runAiDeduplicationClean } from '@/lib/jobs/agent-dedup'

export const maxDuration = 60

/**
 * Endpoint administrativo para acionar a faxina de deduplicação semântica via IA (Kimi K3 -> DeepSeek -> Gemini).
 * POST /api/admin/jobs/dedup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const maxPairs = typeof body?.maxPairs === 'number' ? Math.min(body.maxPairs, 50) : 20
    const timeBudgetMs = typeof body?.timeBudgetMs === 'number' ? Math.min(body.timeBudgetMs, 50_000) : 35_000

    const summary = await runAiDeduplicationClean({
      maxPairsToAnalyze: maxPairs,
      timeBudgetMs,
    })

    return NextResponse.json({
      ok: true,
      summary,
    })
  } catch (error: any) {
    console.error('[AdminJobDedup] Erro ao executar deduplicação:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro ao executar deduplicação semântica.' },
      { status: 500 }
    )
  }
}
