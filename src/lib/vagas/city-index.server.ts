import 'server-only'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { freshOpenJobWhere } from '@/lib/jobs/lifecycle'
import { buildCityIndex, type CityEntry } from './city-index'

export const VAGAS_COUNTRY = 'BR'

/**
 * Índice de cidades do Brasil com vagas abertas, guardado por uma hora: as
 * páginas de cidade, o hub e o sitemap leem o MESMO índice, então mil visitas
 * custam um `groupBy`, não mil.
 */
export const loadCityIndex = unstable_cache(
  async (): Promise<CityEntry[]> => {
    const rows = await db.job.groupBy({
      by: ['city', 'category'],
      where: { ...freshOpenJobWhere(), country: VAGAS_COUNTRY, city: { not: null } },
      _count: { _all: true },
    })
    return buildCityIndex(rows.map((r) => ({ city: r.city, category: r.category, count: r._count._all })))
  },
  ['vagas-city-index-v1'],
  { revalidate: 3600 }
)

export async function findCity(slug: string): Promise<CityEntry | null> {
  return (await loadCityIndex()).find((c) => c.slug === slug) ?? null
}

export const JOBS_PER_PAGE = 40

export async function listCityJobs(city: CityEntry, area: string | null) {
  return db.job.findMany({
    where: {
      ...freshOpenJobWhere(),
      country: VAGAS_COUNTRY,
      city: { in: city.rawCities },
      ...(area ? { category: area } : {}),
    },
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { lastSeenAt: 'desc' }],
    take: JOBS_PER_PAGE,
    select: {
      id: true,
      title: true,
      company: true,
      city: true,
      region: true,
      remoteType: true,
      seniority: true,
      category: true,
      applicationUrl: true,
      publishedAt: true,
    },
  })
}

export type CityJob = Awaited<ReturnType<typeof listCityJobs>>[number]
