import { ANALYSIS_DIRECT_COST_USD } from '../pricing/catalog'
import { countryName } from '../market/countries'

export interface RawAnalyticsEvent {
  event: string
  visitorId?: string | null
  userId?: string | null
  sku?: string | null
  meta?: string | null
  createdAt?: Date | string
}

export interface RawPurchaseRecord {
  priceUsd: number
  paymentCountry?: string | null
  delta?: number
  userId?: string | null
  createdAt?: Date | string
}

export interface MarketPerformanceItem {
  countryCode: string
  countryName: string
  flag: string
  visitors: number
  checkouts: number
  purchases: number
  visitorConversionRate: number
  checkoutConversionRate: number
  revenueUsd: number
  revenueBrl: number
  aiCostUsd: number
  netProfitUsd: number
  netMarginPercent: number
  decision: 'scale' | 'test' | 'optimize'
  decisionLabel: string
  decisionBadge: string
}

/**
 * Converte código ISO de 2 letras na bandeira Unicode correspondente.
 */
export function countryFlag(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐'
  const upper = code.toUpperCase()
  // Se contiver caracteres fora de A-Z, retorna ícone genérico
  if (!/^[A-Z]{2}$/.test(upper)) return '🌐'
  const offset = 127397
  return String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset)
}

/**
 * Agrega eventos de funil e compras por país, calculando conversões, unit economics
 * e gerando recomendação algorítmica de alocação de verba (Global Day 1).
 */
export function calculateMarketPerformance(
  events: RawAnalyticsEvent[] = [],
  purchases: RawPurchaseRecord[] = [],
  usdToBrlRate: number = 5.4
): MarketPerformanceItem[] {
  interface CountryAccumulator {
    countryCode: string
    visitors: Set<string>
    checkouts: number
    purchases: number
    analysesCount: number
    revenueUsd: number
    buyers: Set<string>
  }

  const map = new Map<string, CountryAccumulator>()

  function getOrCreate(code: string): CountryAccumulator {
    const key = code.toUpperCase()
    let acc = map.get(key)
    if (!acc) {
      acc = {
        countryCode: key,
        visitors: new Set<string>(),
        checkouts: 0,
        purchases: 0,
        analysesCount: 0,
        revenueUsd: 0,
        buyers: new Set<string>(),
      }
      map.set(key, acc)
    }
    return acc
  }

  // 1. Processa eventos de telemetria
  for (const ev of events) {
    let metaCountry: string | null = null
    if (ev.meta) {
      try {
        const parsed = typeof ev.meta === 'string' ? JSON.parse(ev.meta) : ev.meta
        if (parsed?.country && typeof parsed.country === 'string') {
          metaCountry = parsed.country.trim().toUpperCase()
        }
      } catch {
        // Ignora meta inválido
      }
    }

    const country = metaCountry || 'GLOBAL'
    const acc = getOrCreate(country)

    if (ev.event === 'page_view' && ev.visitorId) {
      acc.visitors.add(ev.visitorId)
    } else if (ev.event === 'checkout_initiated') {
      acc.checkouts += 1
    }
  }

  // 2. Processa compras do AnalysisLedger
  for (const pur of purchases) {
    const country = (pur.paymentCountry || 'GLOBAL').trim().toUpperCase()
    const acc = getOrCreate(country)

    acc.purchases += 1
    acc.analysesCount += pur.delta || 1
    acc.revenueUsd += pur.priceUsd || 0
    if (pur.userId) {
      acc.buyers.add(pur.userId)
    }
  }

  // 3. Monta resultado consolidado
  const items: MarketPerformanceItem[] = []

  for (const [code, acc] of map.entries()) {
    // Garante que o número de visitantes seja pelo menos o número de compradores
    const rawVisitors = acc.visitors.size
    const visitors = Math.max(rawVisitors, acc.buyers.size, acc.purchases > 0 ? acc.purchases : 0)
    const checkouts = acc.checkouts
    const purchasesCount = acc.purchases
    const revenueUsd = acc.revenueUsd
    const revenueBrl = revenueUsd * usdToBrlRate

    const visitorConversionRate =
      visitors > 0 ? (purchasesCount / visitors) * 100 : purchasesCount > 0 ? 100 : 0

    const checkoutConversionRate =
      checkouts > 0 ? (purchasesCount / checkouts) * 100 : purchasesCount > 0 ? 100 : 0

    const aiCostUsd = acc.analysesCount * ANALYSIS_DIRECT_COST_USD
    const gatewayFeesUsd = revenueUsd * 0.04
    const netProfitUsd = revenueUsd - aiCostUsd - gatewayFeesUsd
    const netMarginPercent = revenueUsd > 0 ? (netProfitUsd / revenueUsd) * 100 : 0

    // Algoritmo de Priorização Dinâmica:
    // • Escalar: Boa conversão (>= 3.5%) e margem positiva (>= 50%), ou volume com lucro líquido sólido
    // • Otimizar / Reduzir: Tráfego expressivo (>= 20 visitantes) mas conversão pífia (< 1.5%) ou prejuízo
    // • Testar: Tráfego inicial / em fase de amostragem
    let decision: 'scale' | 'test' | 'optimize' = 'test'
    let decisionLabel = '🟡 Testar mais'
    let decisionBadge = 'Testar'

    if (purchasesCount >= 1 && (visitorConversionRate >= 3.5 || netMarginPercent >= 50)) {
      decision = 'scale'
      decisionLabel = '🚀 Escalar Verba'
      decisionBadge = 'Aumentar'
    } else if (visitors >= 20 && (visitorConversionRate < 1.5 || netProfitUsd < 0)) {
      decision = 'optimize'
      decisionLabel = '🔻 Otimizar / Reduzir'
      decisionBadge = 'Reduzir'
    }

    const name = code === 'GLOBAL' ? 'Global / Outros' : countryName(code) || code

    items.push({
      countryCode: code,
      countryName: name,
      flag: countryFlag(code),
      visitors,
      checkouts,
      purchases: purchasesCount,
      visitorConversionRate,
      checkoutConversionRate,
      revenueUsd,
      revenueBrl,
      aiCostUsd,
      netProfitUsd,
      netMarginPercent,
      decision,
      decisionLabel,
      decisionBadge,
    })
  }

  // Ordena por receita descendente, depois por número de visitantes
  return items.sort((a, b) => b.revenueUsd - a.revenueUsd || b.visitors - a.visitors)
}
