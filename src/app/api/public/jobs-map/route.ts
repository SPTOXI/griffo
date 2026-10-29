export const revalidate = 3600

import { NextResponse } from 'next/server'
import { loadMapPoints } from '@/lib/city-jobs/city-coords.server'

/** Pontos do mapa de vagas: cada cidade com vaga aberta e coordenada, de todos os países. */
export async function GET() {
  try {
    return NextResponse.json(
      { points: await loadMapPoints() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  } catch (e: any) {
    console.error('[jobs-map] pontos indisponíveis:', e?.message || e)
    return NextResponse.json({ points: [] }, { status: 503 })
  }
}
