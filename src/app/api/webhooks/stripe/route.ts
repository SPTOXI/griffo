import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getGlobalSettings } from '@/lib/settings'
import { getStripe } from '@/lib/stripe'
import { fulfillCheckoutSession } from '@/lib/payments/fulfill'

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
      // `metadata` é preenchida por nós em /api/checkout e não carrega PII.
      metadata: session.metadata,
    },
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') || ''
    const configs = await getGlobalSettings()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || configs.STRIPE_WEBHOOK_SECRET || ''
    const secretKey = process.env.STRIPE_SECRET_KEY || configs.STRIPE_SECRET_KEY || ''

    if (!webhookSecret || !secretKey) {
      console.error('STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY não configuradas.')
      return NextResponse.json(
        { error: 'Configuração de webhook incompleta no servidor.' },
        { status: 500 }
      )
    }

    const stripe = getStripe(secretKey)

    let event: any
    try {
      // Verificação HMAC do corpo cru. Sem isto, qualquer um que conheça a URL
      // credita análises para qualquer conta.
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err: any) {
      console.error('Stripe Webhook Signature Verification Failed:', err.message)
      return NextResponse.json({ error: 'Assinatura de webhook inválida.' }, { status: 400 })
    }

    // Idempotência por `event.id`, garantida pelo índice único da coluna.
    //
    // A Stripe reentrega eventos: por retry, por reprocessamento manual, ou
    // simplesmente por entregar duas vezes. Fazer a verificação com uma
    // consulta ANTES da escrita não resolve — duas entregas simultâneas leem
    // "não existe" antes de qualquer uma gravar. Deixar a inserção falhar é o
    // que de fato serializa.
    //
    // O registro é sem PII: o evento da Stripe traz e-mail, nome e endereço de
    // cobrança do comprador em texto puro, uma segunda cópia de dado pessoal
    // que ninguém precisa para conciliar um pagamento.
    try {
      await prisma.webhookEvent.create({
        data: {
          eventName: event.type || 'stripe_event',
          eventId: event.id,
          body: JSON.stringify(redactStripeEvent(event)),
        },
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      throw e
    }

    if (event.type === 'checkout.session.completed') {
      const result = await fulfillCheckoutSession(stripe, event.data?.object || {}, event.id)
      if (result.reason === 'missing_metadata') {
        return NextResponse.json({ error: 'Missing metadata in session' }, { status: 400 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e)
    return NextResponse.json({ error: 'Webhook handler error.' }, { status: 500 })
  }
}
