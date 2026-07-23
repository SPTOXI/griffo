import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { TOKEN_COST } from '@/lib/llm'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const totalUsers = await db.user.count()
    const totalResumes = await db.resume.count()
    const totalSubscriptions = await db.subscription.count({ where: { status: 'active' } })

    const tokenStats = await db.resume.aggregate({
      _sum: {
        analysisTokensIn: true,
        analysisTokensOut: true,
        rewriteTokensIn: true,
        rewriteTokensOut: true,
      }
    })

    const totalTokensIn = (tokenStats._sum.analysisTokensIn || 0) + (tokenStats._sum.rewriteTokensIn || 0)
    const totalTokensOut = (tokenStats._sum.analysisTokensOut || 0) + (tokenStats._sum.rewriteTokensOut || 0)
    const totalCostUsd = (totalTokensIn / 1000) * TOKEN_COST.inputPer1k + (totalTokensOut / 1000) * TOKEN_COST.outputPer1k

    const revenueStats = await db.subscription.aggregate({
      _sum: { priceBrl: true }
    })
    const totalRevenueBrl = revenueStats._sum.priceBrl || 0

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
          totalRevenueBrl,
          estimatedProfitBrl: totalRevenueBrl - (totalCostUsd * 5.4)
        }
      }
    })
  } catch (e: any) {
    console.error('admin metrics error', e)
    return NextResponse.json({ error: 'Erro ao carregar métricas' }, { status: 500 })
  }
}
