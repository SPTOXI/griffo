import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
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
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || configs.STRIPE_SECRET_KEY || ''
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
        ? `${PACK_SIZE} análises completas de currículo. Cada uma entrega laudo das 8 dimensões, comparação com a vaga, trechos a ajustar, reescrita, orientação, presença digital, carta, resumo e PDF.`
        : 'Uma análise completa de currículo: laudo das 8 dimensões, comparação com a vaga, trechos a ajustar, reescrita, orientação, presença digital, carta, resumo e PDF.'

    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe(stripeSecretKey)

      const buildSession = (
        paymentMethodTypes: string[]
      ): Stripe.Checkout.SessionCreateParams => ({
        payment_method_types:
          paymentMethodTypes as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
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

      // O método local é uma vantagem, não um requisito de funcionamento.
      //
      // A Stripe recusa a sessão INTEIRA quando recebe um `payment_method_type`
      // que a conta não tem habilitado. Com o Pix fixo para o Brasil, uma conta
      // sem Pix ativado não deixava de vender por Pix: deixava de vender —
      // nem cartão passava. Um recurso opcional não pode derrubar a compra.
      //
      // A segunda tentativa usa uma lista estritamente menor e sempre válida.
      // Se ela funcionar, o registro no log diz o que habilitar para recuperar
      // o método local.
      const desired = stripePaymentMethodTypes(context.country, price.currency)
      let session
      try {
        session = await stripe.checkout.sessions.create(buildSession(desired))
      } catch (methodErr: any) {
        const localOnly = desired.filter((m) => m !== 'card')
        if (localOnly.length === 0) throw methodErr

        console.error(
          `[checkout] Sessão recusada com ${desired.join('+')} em ${context.country} ` +
            `(${methodErr?.raw?.code || methodErr?.code || 'erro'}: ${methodErr?.raw?.message || methodErr?.message}). ` +
            `Repetindo só com cartão — habilite ${localOnly.join(', ')} no painel da Stripe para recuperá-lo.`
        )
        session = await stripe.checkout.sessions.create(buildSession(['card']))
      }

      // Registra evento de funil: checkout_initiated
      try {
        await db.analyticsEvent.create({
          data: {
            event: 'checkout_initiated',
            userId: user.id,
            sku,
            meta: JSON.stringify({
              country: context.country,
              currency: price.currency,
              amount: price.amount,
              amountUsd: price.amountUsd,
            }),
          },
        })
      } catch (e) {
        console.warn('[checkout] Falha ao registrar evento analytics:', e)
      }

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
        {
          error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
          // O código da Stripe não é segredo — é o que transforma "não funciona"
          // em algo diagnosticável sem acesso ao log do servidor. A mensagem
          // completa continua fora da resposta.
          stripeCode: stripeErr?.raw?.code || stripeErr?.code || null,
        },
        { status: 400 }
      )
    }
  } catch (e: any) {
    console.error('checkout API error:', e)
    return NextResponse.json({ error: 'Erro ao iniciar a compra.' }, { status: 500 })
  }
}
