export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { DEFAULT_RADAR_PREFERENCES } from '@/lib/radar/curation'

/**
 * Quanto da atenção do usuário o Radar pode consumir (§22).
 *
 * O padrão vem de `DEFAULT_RADAR_PREFERENCES` e é exigente de propósito. Quem
 * nunca abriu esta tela recebe o comportamento mais silencioso, não o mais
 * falante — o §15 manda o silêncio ser o padrão, e um padrão só é padrão se
 * vale para quem não configurou nada.
 */
const schema = z.object({
  frequency: z.enum(['immediate', 'daily', 'weekly', 'off']).optional(),
  minimumFit: z.enum(['strong', 'good', 'partial']).optional(),
  maxPerDigest: z.number().int().min(1).max(10).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const row = await db.radarPreference.findUnique({ where: { userId: user.id } })

  return NextResponse.json({
    preferences: row
      ? { frequency: row.frequency, minimumFit: row.minimumFit, maxPerDigest: row.maxPerDigest }
      : DEFAULT_RADAR_PREFERENCES,
    lastRunAt: row?.lastRunAt ?? null,
  })
}

export async function PUT(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
  }

  const row = await db.radarPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  })

  return NextResponse.json({
    preferences: { frequency: row.frequency, minimumFit: row.minimumFit, maxPerDigest: row.maxPerDigest },
    lastRunAt: row.lastRunAt,
  })
}
