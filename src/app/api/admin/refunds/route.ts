export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { executeRefund, rejectRefund } from '@/lib/refunds/server'

/** Fila de reembolsos do admin (§2.163): pendentes primeiro, pelo prazo. */
export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const rows = await db.refundRequest.findMany({
    orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    take: 200,
    include: { user: { select: { email: true, name: true } } },
  })
  // A análise pode ter saído depois que o caso abriu (a pessoa tentou de novo):
  // o admin precisa ver isso antes de devolver.
  const resumeIds = rows.map((r) => r.resumeId).filter((v): v is string => Boolean(v))
  const ready = new Set(
    (await db.resume.findMany({ where: { id: { in: resumeIds }, analysisJson: { not: null } }, select: { id: true } })).map((r) => r.id)
  )
  return NextResponse.json({
    refunds: rows.map((r) => ({ ...r, analysisReadyNow: r.resumeId ? ready.has(r.resumeId) : null })),
  })
}

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(['refund', 'reject']),
  note: z.string().trim().max(1000).optional(),
})

export async function PATCH(req: Request) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  const { id, action, note } = parsed.data
  const result = action === 'refund' ? await executeRefund(id, admin.id) : await rejectRefund(id, admin.id, note || '')
  return NextResponse.json(result, { status: result.ok ? 200 : 409 })
}
