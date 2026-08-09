import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getGlobalSettings } from '@/lib/settings'
import { resolveCurrency, getRequestCountry } from '@/lib/currency'

export const dynamic = 'force-dynamic'

// `currency` saiu do schema de propósito: a moeda passa a ser decidida pelo
// servidor a partir da geolocalização da borda. Ver lib/currency.ts.
const schema = z.object({
  packageId: z.enum(['entrada', 'starter', 'carreira', 'profissional']),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para adquirir créditos.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Pacote de créditos inválido.' }, { status: 400 })
    }

    const packageId = parsed.data.packageId
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 400 })
    }

    const currencyCode = resolveCurrency(req)
    const priceByCurrency = {
      brl: pkg.priceBrl,
      usd: pkg.priceUsd,
      eur: pkg.priceEur,
    }
    const unitAmount = Math.round(priceByCurrency[currencyCode] * 100)

    // Load configs
    const configs = await getGlobalSettings()
    const stripeSecretKey = configs.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://griffo.work'

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Configuração do Stripe pendente no Painel Admin: Cadastre a Stripe Secret Key.' },
        { status: 400 }
      )
    }

    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe(stripeSecretKey)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currencyCode,
              product_data: {
                name: `GriffoWork - ${pkg.name}`,
                description: pkg.desc,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}&credits=${pkg.credits}`,
        cancel_url: `${appUrl}/?payment=cancelled`,
        client_reference_id: user.id,
        customer_email: user.email || undefined,
        metadata: {
          user_id: user.id,
          credit_amount: pkg.credits.toString(),
          package_id: pkg.id,
          currency: currencyCode,
          country: getRequestCountry(req) || 'unknown',
        },
      })

      return NextResponse.json({
        success: true,
        gateway: 'stripe',
        checkoutUrl: session.url,
      })
    } catch (stripeErr: any) {
      // A mensagem da Stripe pode citar a chave, o modo (test/live) e a conta.
      // O detalhe fica no log; ao cliente vai só o que ele pode agir.
      console.error('Stripe Checkout Error:', stripeErr)
      return NextResponse.json(
        { error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.' },
        { status: 400 }
      )
    }
  } catch (e: any) {
    console.error('credit purchase API error:', e)
    return NextResponse.json({ error: 'Erro ao processar aquisição de créditos.' }, { status: 500 })
  }
}
