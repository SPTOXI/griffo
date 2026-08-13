import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, priceFor } from '@/lib/pricing/catalog'
import { resolvePricingContext } from '@/lib/pricing/resolve'
import { localMethodLabels } from '@/lib/pricing/payment-methods'

export const dynamic = 'force-dynamic'

/**
 * Saldo de análises, extrato e o preço que vale para esta pessoa.
 *
 * O preço vem junto de propósito: a interface não deve calcular preço a partir
 * do IP do navegador. O servidor já sabe se existe um país de pagamento
 * conhecido, e é ele quem manda.
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const [userData, ledger, purchases] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { analysisBalance: true, paymentCountry: true, freePreviewAt: true },
      }),
      db.analysisLedger.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.analysisLedger.count({ where: { userId: user.id, type: 'purchase' } }),
    ])

    const context = resolvePricingContext(req, userData)
    const single = priceFor(context.country, 'single')
    const pack = priceFor(context.country, 'pack5')

    return NextResponse.json({
      balance: userData?.analysisBalance ?? 0,
      freePreviewUsed: Boolean(userData?.freePreviewAt),
      // O upsell do pacote só existe depois da primeira compra.
      hasPurchased: purchases > 0,
      pricing: {
        tier: single.tier,
        country: context.country,
        countrySource: context.source,
        currency: single.currency,
        paymentMethods: localMethodLabels(context.country),
        single: { amount: single.amount, formatted: single.formatted },
        pack5: {
          amount: pack.amount,
          formatted: pack.formatted,
          analyses: pack.analyses,
          perAnalysisFormatted: formatPrice(pack.amount / pack.analyses, pack.currency, context.country),
        },
      },
      ledger,
    })
  } catch (e: any) {
    console.error('analyses balance API error:', e)
    return NextResponse.json({ error: 'Erro ao consultar seu saldo de análises.' }, { status: 500 })
  }
}
