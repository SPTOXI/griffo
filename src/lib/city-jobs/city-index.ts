import { JOB_CATEGORY_SLUGS, type JobCategorySlug } from '@/lib/jobs/category-labels'

/**
 * Páginas `/[país]/jobs`, `/[país]/jobs/[cidade]` e `/[país]/jobs/[cidade]/[área]`
 * — a parte pura.
 *
 * Ideia tirada do meuemprego.com.br (`/buscar-candidatos/vendedor-campinas`):
 * uma página por combinação de função e cidade pega a busca "vagas de X em Y"
 * no Google. Aqui a "função" é a área (`Job.category`, ~76% de cobertura no
 * Brasil), não o cargo fino (`normalizedTitle`, ~24%): uma página por cargo
 * com 24% de cobertura mostraria quase nada.
 *
 * Vale para todos os países com rota própria, no idioma do mercado de cada um
 * (regra do produto: funcionalidade nova atende todas as regiões).
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

/**
 * Valores de `city` que não são cidade, em qualquer idioma. O nome do próprio
 * país ("Brasil", "Deutschland", "United States") entra à parte, por
 * `buildCityIndex(rows, exclude)`, a partir da tabela de nomes de país.
 */
const NOT_A_CITY = new Set([
  'todo-brasil', 'nacional', 'nationwide', 'anywhere', 'multiple-locations', 'various-locations',
  'bundesweit', 'deutschlandweit', 'toda-espana', 'todo-mexico', 'france-entiere', 'tutta-italia',
  'n-a', 'na', 'unknown',
])
const NOT_A_CITY_PREFIX = ['remote', 'remoto', 'remota', 'home-office', 'homeoffice', 'teletrabajo', 'telearbeit', 'teletravail', 'hybrid']

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Slug de URL. Mantém letras de qualquer escrita (Tóquio em japonês, Seul em
 * coreano): só tira acento e troca o resto por hífen.
 */
export function slugify(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nome da cidade como veio, sem estado/país depois da vírgula. `null` se não é cidade. */
export function cityName(raw: string | null | undefined, exclude: ReadonlySet<string> = new Set()): string | null {
  const name = (raw ?? '').split(',')[0].trim()
  if (!name) return null
  const slug = slugify(name)
  if (!slug || NOT_A_CITY.has(slug) || exclude.has(slug)) return null
  if (NOT_A_CITY_PREFIX.some((p) => slug === p || slug.startsWith(`${p}-`))) return null
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

/**
 * Grafia exibida: a mais comum entre as acentuadas, se houver alguma — senão a
 * mais comum. Sem isso "Brasilia" (fonte sem acento, mais vagas) vencia
 * "Brasília".
 */
function displayName(names: Map<string, number>): string {
  const all = [...names.entries()].sort((a, b) => b[1] - a[1])
  const accented = all.filter(([n]) => n !== stripAccents(n))
  return (accented[0] ?? all[0])[0]
}

/** Agrupa as contagens por (cidade crua, área) em cidades normalizadas, maiores primeiro. */
export function buildCityIndex(rows: readonly CityRow[], exclude: ReadonlySet<string> = new Set()): CityEntry[] {
  const acc = new Map<string, { names: Map<string, number>; raw: Set<string>; areas: Map<string, number>; total: number }>()
  for (const r of rows) {
    const name = cityName(r.city, exclude)
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
      name: displayName(e.names),
      total: e.total,
      rawCities: [...e.raw].sort(),
      areas: [...e.areas.entries()]
        .map(([area, count]) => ({ area: area as JobCategorySlug, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug))
}
