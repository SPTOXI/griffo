export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { openRefundRequest, purchasesForUser } from '@/lib/refunds/server'

/**
 * Reembolso pelo cliente (§2.163): lista as compras recentes com o que a regra
 * diz de cada uma, e abre o pedido. Quem decide é o admin.
 */
const noStore = { 'Cache-Control': 'no-store' }

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401, headers: noStore })
  return NextResponse.json({ purchases: await purchasesForUser(user.id) }, { headers: noStore })
}

const schema = z.object({
  paymentRef: z.string().min(1).max(200),
  reason: z.string().trim().max(1000).optional(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401, headers: noStore })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers: noStore })
  const r = await openRefundRequest({ userId: user.id, paymentRef: parsed.data.paymentRef, source: 'customer', reason: parsed.data.reason })
  if (!r) return NextResponse.json({ error: 'Compra não encontrada.' }, { status: 404, headers: noStore })
  if (r.eligibility === 'outside_rules' && !r.id) {
    return NextResponse.json(
      { error: 'Reembolso só quando o serviço não foi executado.', code: 'NOT_ELIGIBLE' },
      { status: 403, headers: noStore }
    )
  }
  return NextResponse.json({ ok: true, created: r.created, eligibility: r.eligibility }, { headers: noStore })
}
