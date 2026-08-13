import { NextResponse } from 'next/server'
import {
  ANALYSIS_DIRECT_COST_USD,
  ANALYSIS_FLOOR_USD,
  formatPrice,
  priceFor,
} from '@/lib/pricing/catalog'
import { edgeCountry } from '@/lib/pricing/resolve'
import { localMethodLabels, pendingLocalMethods } from '@/lib/pricing/payment-methods'

export const dynamic = 'force-dynamic'

/**
 * Preço público, para quem ainda não entrou.
 *
 * O país aqui vem da borda, e isso é explicitamente um palpite: serve para
 * escolher a moeda que a landing exibe, nunca para decidir o que será cobrado.
 * A cobrança usa o país do meio de pagamento — ver `lib/pricing/resolve.ts`.
 *
 * Esta rota devolvia a tabela de planos de assinatura (diário, mensal, anual),
 * que deixou de existir: não há assinatura, plano ilimitado nem vitalício.
 */
export async function GET(req: Request) {
  const country = edgeCountry(req) || 'US'
  const single = priceFor(country, 'single')
  const pack = priceFor(country, 'pack5')

  return NextResponse.json({
    country,
    countrySource: 'edge',
    tier: single.tier,
    currency: single.currency,
    paymentMethods: localMethodLabels(country),
    pendingLocalMethods: pendingLocalMethods(country),
    single: {
      amount: single.amount,
      formatted: single.formatted,
      amountUsd: single.amountUsd,
    },
    pack5: {
      amount: pack.amount,
      formatted: pack.formatted,
      analyses: pack.analyses,
      amountUsd: pack.amountUsd,
      perAnalysisFormatted: formatPrice(pack.amount / pack.analyses, pack.currency, country),
    },
    economics: {
      floorUsd: ANALYSIS_FLOOR_USD,
      directCostUsd: ANALYSIS_DIRECT_COST_USD,
    },
  })
}
