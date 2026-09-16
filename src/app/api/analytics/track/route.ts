import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { edgeCountry } from '@/lib/pricing/edge-country'

export const dynamic = 'force-dynamic'

const schema = z.object({
  event: z.enum(['page_view', 'checkout_initiated', 'upsell_viewed']),
  visitorId: z.string().max(100).optional(),
  sku: z.enum(['single', 'quarterly']).optional(),
  // Antes era `z.any()` sem teto: o corpo inteiro ia para o banco numa rota
  // pública. E estes eventos são a base da decisão de preço — lixo aqui é
  // decisão errada lá.
  meta: z
    .record(z.string().max(40), z.union([z.string().max(300), z.number(), z.boolean(), z.null()]))
    .refine((m) => Object.keys(m).length <= 20, 'meta grande demais')
    .optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Evento inválido' }, { status: 400 })
    }

    const user = await getCurrentUser().catch(() => null)
    const { event, visitorId, sku, meta = {} } = parsed.data

    // Detecta país pelos headers de geolocalização da borda (Vercel / Cloudflare)
    // País só de fonte do servidor: o `meta.country` enviado pelo navegador é
    // descartado.
    const metaCountry = edgeCountry(req) || user?.paymentCountry || null

    const { country: _ignored, ...clientMeta } = meta
    const enrichedMeta = {
      ...clientMeta,
      ...(metaCountry ? { country: metaCountry } : {}),
    }

    await db.analyticsEvent.create({
      data: {
        event,
        userId: user?.id || null,
        visitorId: visitorId || null,
        sku: sku || null,
        meta: JSON.stringify(enrichedMeta),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Falha silenciosa de telemetria para não impactar a navegação do usuário
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
