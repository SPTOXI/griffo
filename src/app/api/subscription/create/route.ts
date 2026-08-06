import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { computePricing } from '@/lib/llm'

const schema = z.object({
  plan: z.enum(['day', 'monthly', 'annual']),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Apenas admins podem ativar planos diretamente (sem pagamento via gateway)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso restrito. Utilize a página de planos para adquirir créditos.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    const plan = parsed.data.plan
    const pricingMap = computePricing()
    const pricing = pricingMap[plan]
    if (!pricing) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 })

    // In Phase 1 we simulate activation (no payment gateway yet).
    // Phase 2 will integrate Stripe/PagSeguro webhook and only activate after confirmation.
    const now = new Date()
    let endsAt = new Date(now)
    if (plan === 'day') endsAt.setDate(now.getDate() + 1)
    else if (plan === 'monthly') endsAt.setMonth(now.getMonth() + 1)
    else if (plan === 'annual') endsAt.setFullYear(now.getFullYear() + 1)

    const [updatedUser] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          plan,
          planStartsAt: now,
          planEndsAt: endsAt,
        },
      }),
      db.subscription.create({
        data: {
          userId: user.id,
          plan,
          priceBrl: pricing.priceBrl,
          startsAt: now,
          endsAt,
          status: 'active',
          paymentRef: `sim_phase1_${Date.now()}`,
        },
      }),
    ])

    await db.auditLog.create({
      data: { userId: user.id, action: 'subscribe', meta: JSON.stringify({ plan, priceBrl: pricing.priceBrl, endsAt }) },
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        plan: updatedUser.plan,
        planStartsAt: updatedUser.planStartsAt,
        planEndsAt: updatedUser.planEndsAt,
        planActive: true,
      },
      subscription: { plan, priceBrl: pricing.priceBrl, endsAt },
      note: 'Plano ativado em modo simulação (Fase 1). Na Fase 2, a ativação ocorrerá após confirmação do gateway de pagamento.',
    })
  } catch (e: any) {
    console.error('subscription create error', e)
    return NextResponse.json({ error: 'Erro ao ativar plano' }, { status: 500 })
  }
}
