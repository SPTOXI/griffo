export const revalidate = 3600

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'

/**
 * Depoimentos aprovados para a página inicial. Os do idioma da tela primeiro,
 * completados pelos de outros idiomas. Nunca devolve quem escreveu além do
 * nome e da cidade autorizados.
 */
export async function GET(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get('lang') || 'en').slice(0, 5)
  try {
    const rows = await db.testimonial.findMany({
      where: { status: 'approved' },
      orderBy: { reviewedAt: 'desc' },
      take: 60,
      select: { id: true, displayName: true, city: true, role: true, text: true, lang: true },
    })
    const sorted = [...rows.filter((r) => r.lang === lang), ...rows.filter((r) => r.lang !== lang)].slice(0, 6)
    return NextResponse.json(
      { testimonials: sorted.map(({ lang: _l, ...t }) => t) },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json({ testimonials: [] })
  }
}
