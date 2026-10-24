import { JOB_CATEGORY_SLUGS, type JobCategorySlug } from '@/lib/jobs/category-labels'

/**
 * Páginas `/vagas/[cidade]` e `/vagas/[cidade]/[area]` — a parte pura.
 *
 * Ideia tirada do meuemprego.com.br (`/buscar-candidatos/vendedor-campinas`):
 * uma página por combinação de função e cidade pega a busca "vagas de X em Y"
 * no Google. Aqui a "função" é a área (`Job.category`, ~76% de cobertura no
 * Brasil), não o cargo fino (`normalizedTitle`, ~24%): uma página por cargo
 * com 24% de cobertura mostraria quase nada.
 *
 * Só Brasil por enquanto: é onde está a maior base (~7 mil vagas abertas) e a
 * página é em português.
 *
 * ## Por que a cidade precisa ser normalizada
 *
 * A mesma cidade chega das fontes de vários jeitos: "São Paulo" com região
 * "SP", "São Paulo" com região "Estado de São Paulo", "São Paulo, São Paulo,
 * Brazil". O slug é o trecho antes da primeira vírgula, sem acento — e o nome
 * exibido é a grafia mais comum entre as que caem no mesmo slug.
 */

/** Abaixo disso a página existe mas sai do sitemap e leva `noindex`: página rala é penalizada. */
export const MIN_JOBS_TO_INDEX = 5

/** Valores de `city` que não são cidade. */
const NOT_A_CITY = new Set(['brasil', 'brazil', 'todo-brasil', 'remoto', 'remote', 'home-office', 'nacional'])

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nome da cidade como veio, sem estado/país depois da vírgula. `null` se não é cidade. */
export function cityName(raw: string | null | undefined): string | null {
  const name = (raw ?? '').split(',')[0].trim()
  if (!name) return null
  const slug = slugify(name)
  if (!slug || NOT_A_CITY.has(slug)) return null
  return name
}

/** `recursos_humanos` ↔ `recursos-humanos`: hífen na URL, sublinhado no banco. */
export const areaToUrl = (slug: JobCategorySlug) => slug.replace(/_/g, '-')
export function areaFromUrl(param: string): JobCategorySlug | null {
  const slug = param.replace(/-/g, '_')
  return (JOB_CATEGORY_SLUGS as readonly string[]).includes(slug) ? (slug as JobCategorySlug) : null
}

export interface CityEntry {
  slug: string
  name: string
  total: number
  /** Valores crus de `Job.city` que caem neste slug — é com eles que a página consulta. */
  rawCities: string[]
  areas: { area: JobCategorySlug; count: number }[]
}

export interface CityRow {
  city: string | null
  category: string | null
  count: number
}

/** Agrupa as contagens por (cidade crua, área) em cidades normalizadas, maiores primeiro. */
export function buildCityIndex(rows: readonly CityRow[]): CityEntry[] {
  const acc = new Map<string, { names: Map<string, number>; raw: Set<string>; areas: Map<string, number>; total: number }>()
  for (const r of rows) {
    const name = cityName(r.city)
    if (!name || !r.city) continue
    const slug = slugify(name)
    let e = acc.get(slug)
    if (!e) acc.set(slug, (e = { names: new Map(), raw: new Set(), areas: new Map(), total: 0 }))
    e.total += r.count
    e.raw.add(r.city)
    e.names.set(name, (e.names.get(name) ?? 0) + r.count)
    if (r.category && areaFromUrl(r.category.replace(/_/g, '-'))) {
      e.areas.set(r.category, (e.areas.get(r.category) ?? 0) + r.count)
    }
  }
  return [...acc.entries()]
    .map(([slug, e]) => ({
      slug,
      name: [...e.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
      total: e.total,
      rawCities: [...e.raw].sort(),
      areas: [...e.areas.entries()]
        .map(([area, count]) => ({ area: area as JobCategorySlug, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug))
}
