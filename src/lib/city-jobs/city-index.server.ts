import 'server-only'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { freshOpenJobWhere } from '@/lib/jobs/lifecycle'
import { countryLabel } from '@/lib/jobs/country-labels'
import { LANGUAGES } from '@/lib/i18n/types'
import { buildCityIndex, slugify, type CityEntry } from './city-index'

/**
 * Índice de cidades de um país, guardado por uma hora: o hub, as páginas de
 * cidade e o sitemap leem o MESMO índice, então mil visitas custam um
 * `groupBy`, não mil. A chave do cache inclui o país (argumento da função).
 */
export const loadCityIndex = unstable_cache(
  async (country: string): Promise<CityEntry[]> => {
    const rows = await db.job.groupBy({
      by: ['city', 'category'],
      where: { ...freshOpenJobWhere(), country, city: { not: null } },
      _count: { _all: true },
    })
    // O nome do próprio país, em qualquer idioma, não é cidade ("Brasil", "Deutschland").
    // O código ISO também aparece sozinho como cidade ("US").
    const exclude = new Set([country.toLowerCase(), ...LANGUAGES.map((l) => slugify(countryLabel(country, l)))])
    return buildCityIndex(
      rows.map((r) => ({ city: r.city, category: r.category, count: r._count._all })),
      exclude
    )
  },
  ['city-jobs-index-v1'],
  { revalidate: 3600 }
)

export async function findCity(country: string, slug: string): Promise<CityEntry | null> {
  let wanted = slug
  try {
    wanted = decodeURIComponent(slug)
  } catch {}
  return (await loadCityIndex(country)).find((c) => c.slug === wanted) ?? null
}

export const JOBS_PER_PAGE = 40

export async function listCityJobs(country: string, city: CityEntry, area: string | null) {
  return db.job.findMany({
    where: {
      ...freshOpenJobWhere(),
      country,
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
