import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getGlobalSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const sessionId = body.sessionId

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID não fornecido.' }, { status: 400 })
    }

    const configs = await getGlobalSettings()
    const defaultStripeSecretKey =
      'sk_test_51Twl2qCj91meBoFNJ99PxV9bodntxDv0BK2nfLcyZhbYgI4lXOnAsVryex8W0aWaddG6vNmATEL5na3NDj0SftMI00sxKXm9Od'
    const secretKey = configs.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || defaultStripeSecretKey

    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe Secret Key não configurada.' }, { status: 400 })
    }

    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe(secretKey)

    // Retrieve session from Stripe directly
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento ainda não foi concluído.' }, { status: 400 })
    }

    const metadata = session.metadata || {}
    const creditAmount = parseInt(metadata.credit_amount || '0', 10)
    const targetUserId = metadata.user_id || session.client_reference_id || user.id

    // Ensure session belongs to current user
    if (targetUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Sessão pertence a outro usuário.' }, { status: 403 })
    }

    // Idempotency check: has this session already been credited?
    const existingTx = await prisma.creditTransaction.findFirst({
      where: { paymentRef: sessionId },
    })

    if (!existingTx && creditAmount > 0) {
      const totalAmountBrl = (session.amount_total || 0) / 100

      // Increment credits in DB
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: { increment: creditAmount },
          plan: metadata.package_id || 'credit_pack',
        },
      })

      // Record transaction
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditAmount,
          type: 'purchase',
          description: `Compra de ${creditAmount} créditos via Stripe Checkout (Verificação Direta)`,
          paymentRef: sessionId,
          costBrl: totalAmountBrl,
          status: 'completed',
        },
      })

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'stripe_direct_verify_credit',
          meta: JSON.stringify({ sessionId, creditAmount, totalAmountBrl }),
        },
      })

      return NextResponse.json({
        success: true,
        creditsAdded: creditAmount,
        totalCredits: updatedUser.credits,
        alreadyProcessed: false,
      })
    }

    // Already processed previously by Webhook or previous call
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
    return NextResponse.json({
      success: true,
      creditsAdded: 0,
      totalCredits: freshUser?.credits ?? user.credits,
      alreadyProcessed: true,
    })
  } catch (e: any) {
    console.error('Verify session API error:', e)
    return NextResponse.json({ error: `Erro ao verificar pagamento: ${e.message || e}` }, { status: 500 })
  }
}
