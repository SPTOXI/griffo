import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getGlobalSettings } from '@/lib/settings'
import { fulfillCheckoutSession } from '@/lib/payments/fulfill'
import { getAnalysisBalance } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

/**
 * Confirma o pagamento pelo lado do navegador, na volta do checkout.
 *
 * Existe porque o webhook pode demorar — ou não chegar — e a pessoa está
 * olhando a tela agora. As duas entradas convergem em `fulfillCheckoutSession`,
 * e a idempotência é do índice único de `paymentRef`: quem chegar em segundo
 * lugar não credita de novo.
 */
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
    const secretKey = process.env.STRIPE_SECRET_KEY || configs.STRIPE_SECRET_KEY || ''
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe Secret Key não configurada.' }, { status: 400 })
    }

    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento ainda não foi concluído.' }, { status: 400 })
    }

    // A sessão tem que ser desta conta. Sem esta conferência, um `session_id`
    // de outra pessoa creditaria a análise para quem colasse o identificador.
    const targetUserId = session.metadata?.user_id || session.client_reference_id
    if (targetUserId && targetUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Sessão pertence a outro usuário.' }, { status: 403 })
    }

    const result = await fulfillCheckoutSession(stripe, session, null)

    return NextResponse.json({
      success: true,
      analysesAdded: result.granted ? result.analyses : 0,
      balance: result.granted ? result.balance : await getAnalysisBalance(user.id),
      alreadyProcessed: !result.granted,
      resumeId: session.metadata?.resume_id || null,
    })
  } catch (e: any) {
    console.error('Verify checkout API error:', e)
    return NextResponse.json(
      { error: 'Erro ao verificar pagamento. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
