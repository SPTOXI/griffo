import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const schema = z.object({
  event: z.enum(['page_view', 'checkout_initiated', 'upsell_viewed']),
  visitorId: z.string().max(100).optional(),
  sku: z.enum(['single', 'pack5']).optional(),
  meta: z.record(z.string(), z.any()).optional(),
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
    const headerCountry =
      req.headers.get('x-vercel-ip-country')?.toUpperCase() ||
      req.headers.get('cf-ipcountry')?.toUpperCase() ||
      null

    const metaCountry = (meta.country as string | undefined)?.toUpperCase() || headerCountry || user?.paymentCountry || null

    const enrichedMeta = {
      ...meta,
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
