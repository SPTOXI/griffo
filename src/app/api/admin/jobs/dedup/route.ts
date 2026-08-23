import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { runAiDeduplicationClean } from '@/lib/jobs/agent-dedup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Endpoint administrativo para acionar a faxina de deduplicação semântica via IA
 * (Kimi K3 -> DeepSeek -> Gemini).
 * POST /api/admin/jobs/dedup
 *
 * ## A permissão fica AQUI, não na tela
 *
 * Esta rota não tinha verificação nenhuma. A única coisa que a mantinha
 * "administrativa" era o botão que a chama viver dentro de `AdminView`, e um
 * botão escondido não é controle de acesso: `curl -X POST .../api/admin/jobs/dedup`
 * rodava para qualquer pessoa da internet, sem sessão.
 *
 * O que isso custava, a cada chamada: até 50 pares de vagas enviados a um
 * provedor de IA pago — despesa direta na conta —, e escrita no banco marcando
 * vagas como duplicadas. Repetido em laço, é conta de IA queimada e o Radar
 * degradado para todos os usuários, sem nada no log que identificasse quem
 * pediu.
 *
 * O prefixo `/api/admin/` no caminho descrevia uma intenção que o código não
 * cumpria. Agora cumpre — e a ação fica registrada em `AuditLog`, como as
 * demais ações administrativas.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const maxPairs = typeof body?.maxPairs === 'number' ? Math.min(body.maxPairs, 50) : 20
    const timeBudgetMs = typeof body?.timeBudgetMs === 'number' ? Math.min(body.timeBudgetMs, 50_000) : 35_000

    const summary = await runAiDeduplicationClean({
      maxPairsToAnalyze: maxPairs,
      timeBudgetMs,
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_jobs_dedup',
        meta: JSON.stringify({ maxPairs, timeBudgetMs }),
      },
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
