import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { getAiMetricsData } from '@/lib/ai-router/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const [users, totalUsers, totalResumes, activeSubscriptions, tokenStats, revenueStats, configsRaw, aiMetrics, rawKeys] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          credits: true,
          disabled: true,
          createdAt: true,
          _count: {
            select: { resumes: true, subscriptions: true },
          },
        },
      }),
      db.user.count(),
      db.resume.count(),
      db.subscription.count({ where: { status: 'active' } }),
      db.aiLog.aggregate({
        _sum: {
          tokensIn: true,
          tokensOut: true,
          costUsd: true,
        },
      }),
      db.creditTransaction.aggregate({
        where: { type: 'purchase' },
        _sum: { costBrl: true },
      }),
      db.systemConfig.findMany(),
      getAiMetricsData().catch((e) => {
        console.warn('getAiMetricsData failed gracefully:', e)
        return null
      }),
      db.aiApiKey.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const totalTokensIn = tokenStats._sum.tokensIn || 0
    const totalTokensOut = tokenStats._sum.tokensOut || 0
    const totalCostUsd = tokenStats._sum.costUsd || 0
    const totalRevenueBrl = revenueStats._sum.costBrl || 0

    const configMap = configsRaw.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    const keys = rawKeys.map((k) => ({
      id: k.id,
      name: k.name,
      provider: k.provider,
      baseUrl: k.baseUrl,
      model: k.model,
      status: k.status,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      maskedKey: k.apiKey.length > 8 ? `${k.apiKey.slice(0, 4)}...${k.apiKey.slice(-4)}` : '****',
    }))

    return NextResponse.json({
      users,
      metrics: {
        totalUsers,
        totalResumes,
        activeSubscriptions,
        aiUsage: {
          totalTokensIn,
          totalTokensOut,
          totalCostUsd,
          totalCostBrl: totalCostUsd * 5.4,
        },
        financial: {
          totalRevenueBrl,
          estimatedProfitBrl: totalRevenueBrl - totalCostUsd * 5.4,
        },
      },
      config: configMap,
      aiMetrics,
      keys,
    })
  } catch (e: any) {
    console.error('admin dashboard get error', e)
    return NextResponse.json({ error: 'Erro ao carregar dados do painel administrativo.' }, { status: 500 })
  }
}
