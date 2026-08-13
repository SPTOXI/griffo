import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const totalUsers = await db.user.count()
    const totalResumes = await db.resume.count()
    const totalSubscriptions = await db.subscription.count({ where: { status: 'active' } })

    const tokenStats = await db.aiLog.aggregate({
      _sum: {
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
      },
    })

    const totalTokensIn = tokenStats._sum.tokensIn || 0
    const totalTokensOut = tokenStats._sum.tokensOut || 0
    const totalCostUsd = tokenStats._sum.costUsd || 0

    // A receita passa a ser lida em dólar, a moeda base do catálogo. Somar
    // valores locais seria somar reais com rúpias; `priceUsd` é justamente a
    // coluna que o ledger grava já normalizada.
    const revenueStats = await db.analysisLedger.aggregate({
      where: { type: 'purchase' },
      _sum: { priceUsd: true },
      _count: true,
    })
    const totalRevenueUsd = revenueStats._sum.priceUsd || 0
    const purchaseCount = revenueStats._count || 0

    // Receita do modelo antigo de créditos, encerrado. Fica separada em vez de
    // somada: são preços de outro produto, e juntá-las esconderia a virada.
    const legacyRevenue = await db.creditTransaction.aggregate({
      where: { type: 'purchase' },
      _sum: { costBrl: true },
    })

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalResumes,
        activeSubscriptions: totalSubscriptions,
        aiUsage: {
          totalTokensIn,
          totalTokensOut,
          totalCostUsd,
          totalCostBrl: totalCostUsd * 5.4,
        },
        financial: {
          totalRevenueUsd,
          purchaseCount,
          estimatedProfitUsd: totalRevenueUsd - totalCostUsd,
          legacyCreditRevenueBrl: legacyRevenue._sum.costBrl || 0,
        },
      },
    })
  } catch (e: any) {
    console.error('admin metrics get error', e)
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}
