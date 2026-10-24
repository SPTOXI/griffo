export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'

/** Moderação dos depoimentos: lista os recentes e aprova ou recusa. */
export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const rows = await db.testimonial.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ testimonials: rows })
}

export async function PATCH(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const parsed = z
    .object({ id: z.string().min(1), status: z.enum(['approved', 'rejected', 'pending']) })
    .safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  await db.testimonial.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, reviewedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
