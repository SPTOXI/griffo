import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getGlobalSettings } from '@/lib/settings'
import { normalizeCurrency, toBrl } from '@/lib/currency'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Reduz o evento da Stripe ao que é necessário para conciliação: identificadores,
 * valores e estado. Tudo que identifica a pessoa fica de fora.
 */
function redactStripeEvent(event: any) {
  const session = event?.data?.object || {}
  return {
    id: event?.id,
    type: event?.type,
    created: event?.created,
    livemode: event?.livemode,
    object: {
      id: session.id,
      object: session.object,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: session.status,
      mode: session.mode,
      client_reference_id: session.client_reference_id,
      payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      // `metadata` é preenchida por nós em credits/purchase e não carrega PII.
      metadata: session.metadata,
    },
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') || ''
    const configs = await getGlobalSettings()
    const webhookSecret = configs.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''
    const secretKey = configs.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''

    if (!webhookSecret || !secretKey) {
      console.error('STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY não configuradas.')
      return NextResponse.json(
        { error: 'Configuração de webhook incompleta no servidor.' },
        { status: 500 }
      )
    }

    let event: any
    try {
      const stripe = getStripe(secretKey)
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err: any) {
      console.error('Stripe Webhook Signature Verification Failed:', err.message)
      return NextResponse.json({ error: 'Assinatura de webhook inválida.' }, { status: 400 })
    }

    // Registro para auditoria, sem PII.
    //
    // Antes gravava o evento inteiro da Stripe, que traz e-mail, nome e
    // endereço de cobrança do comprador em texto puro — uma segunda cópia de
    // dado pessoal, guardada indefinidamente, que ninguém precisa para
    // conciliar um pagamento e que o titular não tem como pedir para apagar.
    await prisma.webhookEvent.create({
      data: {
        eventName: event.type || 'stripe_event',
        body: JSON.stringify(redactStripeEvent(event)),
      },
    })

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {}
      const metadata = session.metadata || {}
      const userId = metadata.user_id || session.client_reference_id
      const creditAmount = parseInt(metadata.credit_amount, 10)
      const sessionId = session.id

      if (!userId || isNaN(creditAmount)) {
        console.error('Stripe webhook missing user_id or credit_amount:', session)
        return NextResponse.json({ error: 'Missing metadata in session' }, { status: 400 })
      }

      // Idempotency check
      const existing = await prisma.creditTransaction.findFirst({
        where: { paymentRef: sessionId },
      })

      if (!existing) {
        // Mesma correção do verify-session: a moeda do checkout é registrada,
        // o valor fica sem conversão e a conversão passa a ser da leitura.
        const paidCurrency = normalizeCurrency(session.currency)
        const paidAmount = (session.amount_total || 0) / 100

        // Atomic transaction: credit user + record transaction + audit log
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              credits: { increment: creditAmount },
              plan: metadata.package_id || 'credit_pack',
            },
          })

          await tx.creditTransaction.create({
            data: {
              userId,
              amount: creditAmount,
              type: 'purchase',
              description: `Compra de ${creditAmount} créditos via Stripe`,
              paymentRef: sessionId,
              currency: paidCurrency,
              amountOriginal: paidAmount,
              costBrl: toBrl(paidAmount, paidCurrency),
              status: 'completed',
            },
          })

          await tx.auditLog.create({
            data: {
              userId,
              action: 'stripe_credit_purchase',
              meta: JSON.stringify({ sessionId, creditAmount, paidAmount, paidCurrency }),
            },
          })
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e)
    return NextResponse.json({ error: 'Webhook handler error.' }, { status: 500 })
  }
}
