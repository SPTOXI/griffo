import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getGlobalSettings } from '@/lib/settings'
import { assertAboveFloor, PACK_SIZE } from '@/lib/pricing/catalog'
import { priceForRequest } from '@/lib/pricing/resolve'
import { stripePaymentMethodTypes } from '@/lib/pricing/payment-methods'

export const dynamic = 'force-dynamic'

/**
 * Abre o checkout da Análise Completa.
 *
 * Há dois SKUs e nada mais: uma análise, ou o pacote de cinco do upsell. Não
 * há assinatura, plano, vitalício nem crédito.
 *
 * O preço NÃO vem do cliente. Vem do catálogo, resolvido pelo país do meio de
 * pagamento quando ele é conhecido — ver `lib/pricing/resolve.ts`. A rota
 * antiga aceitava `currency` no corpo da requisição, e como o preço em real era
 * ~8% mais barato, bastava enviar `brl` de qualquer lugar do mundo.
 */
const schema = z.object({
  sku: z.enum(['single', 'pack5']),
  /** Para onde voltar depois de pagar. Recompra de um clique dentro do laudo. */
  resumeId: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 })
    }

    const { sku, resumeId } = parsed.data

    // O upsell do pacote só existe DEPOIS da primeira compra. Barrar aqui, e
    // não só na interface, é o que impede que ele seja acessível por URL antes
    // da hora.
    if (sku === 'pack5') {
      const previous = await db.analysisLedger.findFirst({
        where: { userId: user.id, type: 'purchase' },
        select: { id: true },
      })
      if (!previous) {
        return NextResponse.json(
          { error: 'O pacote de análises fica disponível depois da primeira compra.' },
          { status: 403 }
        )
      }
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { paymentCountry: true },
    })

    const { price, context } = priceForRequest(req, dbUser, sku)
    // Falha antes de virar cobrança. Um preço abaixo do custo tem que quebrar o
    // checkout, não aparecer depois num relatório de margem.
    assertAboveFloor(price)

    const configs = await getGlobalSettings()
    const stripeSecretKey = configs.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://griffo.work'

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Configuração do Stripe pendente no Painel Admin: cadastre a Stripe Secret Key.' },
        { status: 400 }
      )
    }

    const productName =
      sku === 'pack5' ? `Griffo — ${PACK_SIZE} Análises Completas` : 'Griffo — Análise Completa'
    const productDesc =
      sku === 'pack5'
        ? `${PACK_SIZE} análises completas de currículo. Cada uma entrega laudo das 8 dimensões, comparação com a vaga, reescrita, orientação, otimização de perfil, mídias sociais, carta, resumo e PDF.`
        : 'Uma análise completa de currículo: laudo das 8 dimensões, comparação com a vaga, reescrita, orientação, otimização de perfil, mídias sociais, carta, resumo e PDF.'

    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe(stripeSecretKey)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: stripePaymentMethodTypes(context.country, price.currency) as any,
        line_items: [
          {
            price_data: {
              currency: price.currency.toLowerCase(),
              product_data: { name: productName, description: productDesc },
              unit_amount: price.amountMinor,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        // O endereço de cobrança é o que permite conferir, DEPOIS do pagamento,
        // se a faixa cobrada corresponde ao país de onde o dinheiro saiu.
        billing_address_collection: 'required',
        success_url: `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}${
          resumeId ? `&resume=${encodeURIComponent(resumeId)}` : ''
        }`,
        cancel_url: `${appUrl}/?payment=cancelled`,
        client_reference_id: user.id,
        customer_email: user.email || undefined,
        metadata: {
          user_id: user.id,
          sku,
          analyses: price.analyses.toString(),
          tier: price.tier.toString(),
          price_usd: price.amountUsd.toFixed(2),
          currency: price.currency,
          amount_local: price.amount.toString(),
          country: context.country,
          country_source: context.source,
          resume_id: resumeId || '',
        },
      })

      return NextResponse.json({
        success: true,
        gateway: 'stripe',
        checkoutUrl: session.url,
        price: {
          sku,
          tier: price.tier,
          currency: price.currency,
          amount: price.amount,
          formatted: price.formatted,
          analyses: price.analyses,
        },
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
    console.error('checkout API error:', e)
    return NextResponse.json({ error: 'Erro ao iniciar a compra.' }, { status: 500 })
  }
}
