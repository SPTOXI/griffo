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
      { rawSlug: r.rawSlug, kind: r.kind as CityRule['kind'], canonicalSlug: r.canonicalSlug, displayName: r.displayName, decidedBy: r.decidedBy },
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

export const WORK_FILTERS = ['remote', 'hybrid', 'onsite'] as const
export const LEVEL_FILTERS = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'executive'] as const

export interface JobListQuery {
  country: string
  /** Grafias cruas da cidade; `null` = o país inteiro (página de vagas remotas). */
  rawCities: string[] | null
  area: string | null
  work: string | null
  level: string | null
  /** Quantas levas de `JOBS_PER_PAGE` mostrar, somadas (o "ver mais"). */
  page: number
}

const JOB_SELECT = {
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
} as const

/**
 * Uma página da lista de vagas, com o total para a paginação. Guardada por uma
 * hora pelos argumentos: filtros e páginas são combinações finitas, e a mesma
 * página não precisa ir ao banco a cada visita.
 */
export const listJobs = unstable_cache(
  async (q: JobListQuery) => {
    const where = {
      ...freshOpenJobWhere(),
      country: q.country,
      ...(q.rawCities ? { city: { in: q.rawCities } } : {}),
      ...(q.area ? { category: q.area } : {}),
      ...(q.work ? { remoteType: q.work } : {}),
      ...(q.level ? { seniority: q.level } : {}),
    }
    const [total, jobs] = await Promise.all([
      db.job.count({ where }),
      db.job.findMany({
        where,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { lastSeenAt: 'desc' }],
        // "Ver mais" acumula: a página N mostra as N primeiras levas de uma vez.
        take: q.page * JOBS_PER_PAGE,
        select: JOB_SELECT,
      }),
    ])
    return { total, jobs }
  },
  ['city-jobs-list-v1'],
  { revalidate: 3600, tags: [CITY_JOBS_CACHE_TAG] }
)

export type CityJob = Awaited<ReturnType<typeof listJobs>>['jobs'][number]
