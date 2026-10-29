import 'server-only'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { CITY_JOBS_COUNTRY_SLUGS } from './context'
import { CITY_JOBS_CACHE_TAG, loadCityIndex } from './city-index.server'
import { buildGazetteer, findCoords, GEONAMES_CITIES_FILE, GEONAMES_CITIES_URL, lookupSlugs, unzipEntry, type MapPoint } from './city-coords'
import type { CityEntry } from './city-index'
import type { ResultMapPin } from '@/lib/match-preview/result'

const COUNTRY_CODES = CITY_JOBS_COUNTRY_SLUGS.map((s) => s.toUpperCase())

/** Cidade que a GeoNames não achou é tentada de novo depois disso: o nome pode ter mudado no cadastro. */
const RETRY_MISSING_MS = 7 * 24 * 3600_000

async function loadAllIndexes(): Promise<{ country: string; cities: CityEntry[] }[]> {
  return Promise.all(COUNTRY_CODES.map(async (country) => ({ country, cities: await loadCityIndex(country) })))
}

/**
 * Preenche `CityCoord` para as cidades das vagas que ainda não têm coordenada.
 * Roda no fim da sincronização diária da base de vagas, depois do agente de
 * cidades (`.github/workflows/jobbase-sync.yml`). Sem cidade nova, não baixa nada.
 */
export async function syncCityCoords(): Promise<{ needed: number; found: number; missing: number }> {
  const [indexes, known] = await Promise.all([
    loadAllIndexes(),
    db.cityCoord.findMany({ select: { country: true, slug: true, source: true, updatedAt: true } }),
  ])
  const retryBefore = Date.now() - RETRY_MISSING_MS
  const done = new Set(
    known.filter((k) => k.source !== 'none' || k.updatedAt.getTime() > retryBefore).map((k) => `${k.country}|${k.slug}`)
  )
  const needed = indexes.flatMap(({ country, cities }) =>
    cities.filter((c) => !done.has(`${country}|${c.slug}`)).map((city) => ({ country, city }))
  )
  if (!needed.length) return { needed: 0, found: 0, missing: 0 }

  const res = await fetch(GEONAMES_CITIES_URL, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`GeoNames respondeu HTTP ${res.status}`)
  const text = unzipEntry(Buffer.from(await res.arrayBuffer()), GEONAMES_CITIES_FILE).toString('utf8')
  const gaz = buildGazetteer(text, new Set(needed.map((n) => n.country)))

  let found = 0
  const writes = needed.map(({ country, city }) => {
    const hit = findCoords(gaz, country, lookupSlugs(city))
    if (hit) found++
    const data = hit
      ? { lat: hit.lat, lng: hit.lng, source: 'geonames', geonameId: hit.geonameId }
      : { lat: null, lng: null, source: 'none', geonameId: null }
    return db.cityCoord.upsert({
      where: { country_slug: { country, slug: city.slug } },
      create: { country, slug: city.slug, ...data },
      // Só chega aqui linha sem coordenada (`none` vencida): uma de `admin` nunca é sobrescrita.
      update: data,
    })
  })
  for (let i = 0; i < writes.length; i += 100) await db.$transaction(writes.slice(i, i + 100))
  return { needed: needed.length, found, missing: needed.length - found }
}

/**
 * Os pontos do mapa: cada cidade com vaga aberta e coordenada. Lê os mesmos
 * índices das páginas de cidade, então o número da bolha é o mesmo da página.
 */
export const loadMapPoints = unstable_cache(
  async (): Promise<MapPoint[]> => {
    const [indexes, coords] = await Promise.all([
      loadAllIndexes(),
      db.cityCoord
        .findMany({ where: { lat: { not: null }, lng: { not: null } }, select: { country: true, slug: true, lat: true, lng: true } })
        .catch((e: any): { country: string; slug: string; lat: number | null; lng: number | null }[] => {
          console.warn('[city-jobs] coordenadas indisponíveis:', e?.message || e)
          return []
        }),
    ])
    const byKey = new Map(coords.map((c) => [`${c.country}|${c.slug}`, c]))
    const points: MapPoint[] = []
    for (const { country, cities } of indexes) {
      for (const city of cities) {
        const at = byKey.get(`${country}|${city.slug}`)
        if (at?.lat == null || at.lng == null) continue
        points.push({ c: country, s: city.slug, n: city.name, t: city.total, lat: at.lat, lng: at.lng })
      }
    }
    return points
  },
  // Trocar a versão quando a lista de países mudar: o cache sobrevive a deploys, e a
  // página continuaria sem o país novo por até uma hora (aconteceu com a Suíça).
  ['city-jobs-map-points-v2'],
  { revalidate: 3600, tags: [CITY_JOBS_CACHE_TAG] }
)

export interface PlaceToPin {
  country: string | null
  city: string | null
  kind: 'free' | 'locked'
  title?: string
  count: number
}

/**
 * Coordenada das vagas de um resultado da home (a grátis e as trancadas). A
 * cidade crua da vaga vira a cidade da página pelo mesmo índice das páginas de
 * cidade, então "Sao Paulo, SP" cai no mesmo ponto de "São Paulo". Vaga sem
 * cidade, ou de cidade sem coordenada, simplesmente não aparece no mapa.
 */
export async function pinsFor(places: readonly PlaceToPin[]): Promise<ResultMapPin[]> {
  const points = await loadMapPoints()
  const at = new Map(points.map((p) => [`${p.c}|${p.s}`, p]))
  const indexes = new Map<string, CityEntry[]>()
  const pins: ResultMapPin[] = []
  for (const place of places) {
    const country = place.country?.toUpperCase()
    if (!country || !place.city || !COUNTRY_CODES.includes(country)) continue
    if (!indexes.has(country)) indexes.set(country, await loadCityIndex(country))
    const city = indexes.get(country)!.find((c) => c.rawCities.includes(place.city!))
    const point = city && at.get(`${country}|${city.slug}`)
    if (!point) continue
    pins.push({ kind: place.kind, lat: point.lat, lng: point.lng, city: point.n, count: place.count, ...(place.title ? { title: place.title } : {}) })
  }
  return pins
}
