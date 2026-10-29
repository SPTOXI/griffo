import { NextResponse, type NextRequest } from 'next/server'
import { findCity, listJobs } from '@/lib/city-jobs/city-index.server'
import { CITY_JOBS_COUNTRY_SLUGS } from '@/lib/city-jobs/context'

/**
 * As vagas mais novas de uma cidade, para o painel do mapa. Mesma consulta e
 * mesmo cache da página da cidade (`listJobs`); o painel mostra a primeira
 * página e manda para a página da cidade para o resto.
 */
export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get('country') || '').toLowerCase()
  const slug = req.nextUrl.searchParams.get('city') || ''
  if (!CITY_JOBS_COUNTRY_SLUGS.includes(country) || !slug || slug.length > 120) {
    return NextResponse.json({ error: 'Cidade inválida.' }, { status: 400 })
  }
  try {
    const city = await findCity(country.toUpperCase(), slug)
    if (!city) return NextResponse.json({ error: 'Cidade não encontrada.' }, { status: 404 })
    const { total, jobs } = await listJobs({
      country: country.toUpperCase(),
      rawCities: city.rawCities,
      area: null,
      work: null,
      level: null,
      page: 1,
    })
    return NextResponse.json(
      {
        total,
        jobs: jobs.slice(0, 20).map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          city: j.city,
          remoteType: j.remoteType,
          seniority: j.seniority,
          applicationUrl: j.applicationUrl,
          publishedAt: j.publishedAt,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  } catch (e: any) {
    console.error('[jobs-map] vagas da cidade indisponíveis:', e?.message || e)
    return NextResponse.json({ error: 'Indisponível.' }, { status: 503 })
  }
}
