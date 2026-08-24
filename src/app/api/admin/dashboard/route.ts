import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { getAiMetricsData } from '@/lib/ai-router/metrics'
import { maskSecret } from '@/lib/crypto'
import { isSensitiveConfigKey } from '@/lib/system-config'
import { calculateMarketPerformance } from '@/lib/analytics/market-performance'

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
    const [
      users,
      totalUsers,
      totalResumes,
      activeSubscriptions,
      tokenStats,
      revenueStats,
      configsRaw,
      aiMetrics,
      rawKeys,
      uniqueVisitorsRows,
      checkoutsCount,
      upsellViewsCount,
      upsellPurchasesCount,
      distinctBuyersRows,
      rawPurchasesRows,
      rawEventsRows,
    ] = await Promise.all([
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
      // Funil: Visitantes únicos
      db.analyticsEvent.findMany({
        where: { event: 'page_view', visitorId: { not: null } },
        distinct: ['visitorId'],
        select: { visitorId: true },
      }).catch(() => []),
      // Funil: Checkouts iniciados
      db.analyticsEvent.count({ where: { event: 'checkout_initiated' } }).catch(() => 0),
      // Upsell: Visualizações do banner de upsell
      db.analyticsEvent.count({ where: { event: 'upsell_viewed' } }).catch(() => 0),
      // Upsell: Compras do Pacote de 5 (delta = 5)
      db.analysisLedger.count({ where: { type: 'purchase', delta: 5 } }).catch(() => 0),
      // Compradores únicos
      db.analysisLedger.findMany({
        where: { type: 'purchase' },
        distinct: ['userId'],
        select: { userId: true },
      }).catch(() => []),
      // Compras detalhadas para quebra por mercado
      db.analysisLedger.findMany({
        where: { type: 'purchase' },
        select: { priceUsd: true, paymentCountry: true, delta: true, userId: true, createdAt: true },
      }).catch(() => []),
      // Eventos detalhados para quebra de visitantes/checkouts por país
      db.analyticsEvent.findMany({
        select: { event: true, visitorId: true, meta: true, createdAt: true },
      }).catch(() => []),
    ])

    const rawPurchases = (rawPurchasesRows as any[]) || []
    const rawEvents = (rawEventsRows as any[]) || []
    const marketPerformance = calculateMarketPerformance(rawEvents, rawPurchases)

    const totalTokensIn = tokenStats._sum.tokensIn || 0
    const totalTokensOut = tokenStats._sum.tokensOut || 0
    const totalCostUsd = tokenStats._sum.costUsd || 0
    const totalRevenueUsd = revenueStats._sum.priceUsd || 0
    const purchasesCount = revenueStats._count || 0
    const uniqueBuyersCount = distinctBuyersRows.length

    // Se a telemetria acabou de ser instalada e ainda não acumulou histórico de pageviews,
    // usamos o piso dos usuários cadastrados para não mostrar 0 visitantes quando já temos base.
    const rawVisitors = uniqueVisitorsRows.length
    const visitorsCount = Math.max(rawVisitors, totalUsers)

    // Funil
    const visitorConversionRate = visitorsCount > 0 ? (purchasesCount / visitorsCount) * 100 : 0
    const checkoutConversionRate = checkoutsCount > 0 ? (purchasesCount / checkoutsCount) * 100 : 0

    // Upsell
    const upsellConversionRate =
      upsellViewsCount > 0
        ? (upsellPurchasesCount / upsellViewsCount) * 100
        : uniqueBuyersCount > 0
          ? (upsellPurchasesCount / uniqueBuyersCount) * 100
          : 0

    // Unit Economics
    const aovUsd = purchasesCount > 0 ? totalRevenueUsd / purchasesCount : 0
    const aovBrl = aovUsd * 5.4
    const arpuUsd = uniqueBuyersCount > 0 ? totalRevenueUsd / uniqueBuyersCount : aovUsd
    const arpuBrl = arpuUsd * 5.4
    const avgAiCostPerBuyerUsd = uniqueBuyersCount > 0 ? totalCostUsd / uniqueBuyersCount : 0
    const avgAiCostPerBuyerBrl = avgAiCostPerBuyerUsd * 5.4

    // Margem Líquida estimada (Receita - IA - Taxas de Gateway ~4%)
    const gatewayFeesUsd = totalRevenueUsd * 0.04
    const netProfitUsd = totalRevenueUsd - totalCostUsd - gatewayFeesUsd
    const netMarginPercent = totalRevenueUsd > 0 ? (netProfitUsd / totalRevenueUsd) * 100 : 0

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
          totalRevenueBrl: totalRevenueUsd * 5.4,
          purchaseCount: purchasesCount,
          uniqueBuyersCount,
          estimatedProfitUsd: totalRevenueUsd - totalCostUsd,
          netProfitUsd,
          netProfitBrl: netProfitUsd * 5.4,
          netMarginPercent,
          aovUsd,
          aovBrl,
          arpuUsd,
          arpuBrl,
          avgAiCostPerBuyerUsd,
          avgAiCostPerBuyerBrl,
        },
        funnel: {
          visitorsCount,
          checkoutsCount,
          purchasesCount,
          visitorConversionRate,
          checkoutConversionRate,
        },
        upsell: {
          upsellViewsCount,
          upsellPurchasesCount,
          upsellConversionRate,
        },
        marketPerformance,
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
