import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getGlobalSettings } from '@/lib/settings'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') || ''
    const configs = await getGlobalSettings()
    const webhookSecret = configs.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''
    const secretKey = configs.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''

    let event: any

    if (webhookSecret && signature && secretKey) {
      try {
        const stripe = getStripe(secretKey)
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (err: any) {
        console.error('Stripe Webhook Signature Verification Failed:', err.message)
        return NextResponse.json({ error: `Signature Error: ${err.message}` }, { status: 400 })
      }
    } else {
      // Fallback parse body if webhook secret is not set yet
      try {
        event = JSON.parse(rawBody)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
      }
    }

    // Save webhook event for audit/debug
    await prisma.webhookEvent.create({
      data: {
        eventName: event.type || 'stripe_event',
        body: JSON.stringify(event),
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
        const totalAmountBrl = (session.amount_total || 0) / 100

        // Add credits to user
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: { increment: creditAmount },
            plan: metadata.package_id || 'credit_pack',
          },
        })

        // Record credit transaction
        await prisma.creditTransaction.create({
          data: {
            userId,
            amount: creditAmount,
            type: 'purchase',
            description: `Compra de ${creditAmount} créditos via Stripe`,
            paymentRef: sessionId,
            costBrl: totalAmountBrl,
            status: 'completed',
          },
        })

        // Audit Log
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'stripe_credit_purchase',
            meta: JSON.stringify({ sessionId, creditAmount, totalAmountBrl }),
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e)
    return NextResponse.json({ error: `Webhook Handler Error: ${e.message || e}` }, { status: 500 })
  }
}
