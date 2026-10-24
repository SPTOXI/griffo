import 'server-only'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { freshOpenJobWhere } from '@/lib/jobs/lifecycle'
import { countryLabel } from '@/lib/jobs/country-labels'
import { LANGUAGES } from '@/lib/i18n/types'
import { buildCityIndex, slugify, type CityEntry, type CityRule, type CityRules } from './city-index'

export const CITY_JOBS_CACHE_TAG = 'city-jobs'

/** O nome do próprio país em qualquer idioma ("Brasil", "Deutschland") e o código ISO ("US") não são cidade. */
export function countryExclusions(country: string): Set<string> {
  return new Set([country.toLowerCase(), ...LANGUAGES.map((l) => slugify(countryLabel(country, l)))])
}

/** O cadastro de cidades do país (`CityAlias`). Sem a tabela ainda, segue sem regras. */
export async function loadCityRules(country: string): Promise<CityRules> {
  const rows = await db.cityAlias.findMany({ where: { country } }).catch((e: any) => {
    console.warn('[city-jobs] cadastro de cidades indisponível:', e?.message || e)
    return []
  })
  return new Map(
    rows.map((r): [string, CityRule] => [
      r.rawSlug,
      { rawSlug: r.rawSlug, kind: r.kind as CityRule['kind'], canonicalSlug: r.canonicalSlug, displayName: r.displayName },
    ])
  )
}

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
    return buildCityIndex(
      rows.map((r) => ({ city: r.city, category: r.category, count: r._count._all })),
      countryExclusions(country),
      await loadCityRules(country)
    )
  },
  // Trocar a versão quando a regra de agrupamento mudar: o cache sobrevive a deploys.
  ['city-jobs-index-v4'],
  // O painel de cidades invalida pela etiqueta: a regra nova aparece na hora.
  { revalidate: 3600, tags: [CITY_JOBS_CACHE_TAG] }
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
