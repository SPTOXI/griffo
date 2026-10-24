export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { LANGUAGES } from '@/lib/i18n/types'

/**
 * Envio de depoimento. Só quem comprou a análise (algum currículo com
 * `unlockedAt`) pode enviar, e só com o consentimento marcado. Entra como
 * `pending`: nada aparece no site sem aprovação no painel. Um depoimento
 * pendente por pessoa — reenviar substitui o anterior.
 */
const schema = z.object({
  displayName: z.string().trim().min(2).max(60),
  city: z.string().trim().max(60).optional(),
  role: z.string().trim().max(80).optional(),
  text: z.string().trim().min(20).max(1000),
  lang: z.string().max(5),
  consent: z.literal(true),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID' }, { status: 400 })

  const bought = await db.resume.count({ where: { userId: user.id, unlockedAt: { not: null } } })
  if (!bought) return NextResponse.json({ error: 'NOT_ELIGIBLE' }, { status: 403 })

  const d = parsed.data
  const data = {
    displayName: d.displayName,
    city: d.city || null,
    role: d.role || null,
    text: d.text,
    lang: (LANGUAGES as string[]).includes(d.lang) ? d.lang : 'en',
    status: 'pending',
  }
  const pending = await db.testimonial.findFirst({ where: { userId: user.id, status: 'pending' }, select: { id: true } })
  if (pending) await db.testimonial.update({ where: { id: pending.id }, data })
  else await db.testimonial.create({ data: { userId: user.id, ...data } })
  return NextResponse.json({ ok: true })
}
