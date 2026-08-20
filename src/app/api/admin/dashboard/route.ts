import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { getAiMetricsData } from '@/lib/ai-router/metrics'
import { maskSecret } from '@/lib/crypto'
import { isSensitiveConfigKey } from '@/lib/system-config'

export const dynamic = 'force-dynamic'

/** Amostra recente exibida no painel. Os totais vêm de `count`, não daqui. */
const DASHBOARD_USER_LIMIT = 100

export async function GET() {
  const startTime = Date.now()
  console.log('[API Admin Dashboard] Iniciando processamento da requisição GET /api/admin/dashboard')
  try {
    const admin = await getAdminUser()
    if (!admin) {
      console.warn('[API Admin Dashboard] Acesso negado: usuário não é administrado ou sessão inválida.')
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    // Sem o e-mail: o log de produção é lido por qualquer pessoa com acesso ao
    // painel da Vercel, e este identificava a conta administrativa em texto puro.
    console.log('[API Admin Dashboard] Administrador autenticado. Executando consultas no banco de dados...')
    const [users, totalUsers, totalResumes, activeSubscriptions, tokenStats, revenueStats, configsRaw, aiMetrics, rawKeys] = await Promise.all([
      // Mesmo motivo da rota de usuários: sem `take`, o painel carregava a
      // base inteira a cada abertura. Os totais vêm dos `count` abaixo, então
      // a lista pode ser recortada sem falsear nenhuma métrica.
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: DASHBOARD_USER_LIMIT,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profession: true,
          role: true,
          plan: true,
          analysisBalance: true,
          disabled: true,
          paymentCountry: true,
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
      db.analysisLedger.aggregate({
        where: { type: 'purchase' },
        _sum: { priceUsd: true },
        _count: true,
      }),
      db.systemConfig.findMany(),
      getAiMetricsData().catch((e) => {
        console.error('[API Admin Dashboard Error] getAiMetricsData falhou:', e)
        return {
          costs: { totalAiCostUsd: 0, totalAiCostBrl: 0, avgCostPerUserUsd: 0, avgCostPerAnalysisUsd: 0, costByProvider: {}, costByTask: {} },
          usage: { totalAiCalls: 0, totalFailovers: 0, callsByProvider: {}, callsByTask: {}, latencyByProvider: {} },
          rankings: { topTasks: [], topModels: [], topUsers: [] },
          benchmarks: [],
          operationalFailures: []
        }
      }),
      db.aiApiKey.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    const totalTokensIn = tokenStats._sum.tokensIn || 0
    const totalTokensOut = tokenStats._sum.tokensOut || 0
    const totalCostUsd = tokenStats._sum.costUsd || 0
    // Receita em dólar, a moeda base do catálogo — `priceUsd` já vem
    // normalizada no ledger, então somar linhas de países diferentes é válido.
    const totalRevenueUsd = revenueStats._sum.priceUsd || 0

    // Mesma regra de `GET /api/admin/settings`: segredos só saem mascarados.
    const configMap = configsRaw.reduce((acc, curr) => {
      acc[curr.key] = isSensitiveConfigKey(curr.key) ? maskSecret(curr.value) : curr.value
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
      maskedKey: maskSecret(k.apiKey),
    }))

    const duration = Date.now() - startTime
    console.log(`[API Admin Dashboard] Concluído com sucesso em ${duration}ms. Retornando ${users.length} usuários e ${keys.length} chaves de IA.`)

    return NextResponse.json({
      users,
      usersTruncated: users.length >= DASHBOARD_USER_LIMIT,
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
          totalRevenueUsd,
          purchaseCount: revenueStats._count || 0,
          estimatedProfitUsd: totalRevenueUsd - totalCostUsd,
        },
      },
      config: configMap,
      aiMetrics,
      keys,
    })
  } catch (e: any) {
    console.error('[API Admin Dashboard ERRO FATAL]', e?.message || e, e?.stack)
    return NextResponse.json({ error: 'Erro ao carregar dados do painel administrativo.' }, { status: 500 })
  }
}
