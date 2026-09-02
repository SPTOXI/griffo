/**
 * Gerador do desenho do mapa-múndi de `lib/hiring-index/world-map.ts`.
 *
 * Rode à mão, e só quando a base cartográfica precisar mudar:
 *
 * ```
 * npx tsx src/scripts/build-world-map.ts
 * ```
 *
 * ## De onde vem a geometria, exatamente
 *
 * **Natural Earth 1:110m Admin 0 – Countries**, versão `v5.1.2`, lida do
 * repositório oficial de vetores:
 *
 * ```
 * https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson
 * https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_tiny_countries.geojson
 * ```
 *
 * **Licença: domínio público.** O `LICENSE.md` do repositório abre com "Everything
 * here is public domain" e os termos de uso do projeto dizem, com estas palavras:
 * "All versions of Natural Earth raster + vector map data found on this website
 * are in the public domain. You may use the maps in any manner, including
 * modifying the content and design, electronic dissemination, and offset
 * printing." e "No permission is needed to use Natural Earth. Crediting the
 * authors is unnecessary." O crédito ("Made with Natural Earth") é dado na tela
 * mesmo assim, porque atribuir a origem de um dado é regra desta base de código,
 * não exigência de licença.
 *
 * A versão está **fixada em tag**, não em `master`, pelo mesmo motivo pelo qual
 * os conectores registram a data da leitura: `master` muda, e um mapa que muda
 * sozinho entre dois deploys é impossível de conferir.
 *
 * ## Por que gerar em vez de instalar um pacote
 *
 * Os SVGs prontos de mapa-múndi com `id` em ISO 3166-1 alfa-2 que existem hoje
 * são ou grandes demais (o `worldMapSvg` do Stephan Wagner tem 13,5 MB no
 * arquivo `world.svg`) ou publicados sob CC BY-SA — cujo *ShareAlike* é uma
 * pergunta jurídica que uma página de marketing de produto proprietário não
 * precisa fazer. Renderizar TopoJSON em tempo de execução resolveria a licença
 * mas traria `d3-geo` + `topojson-client` para o pacote do cliente por causa de
 * uma página só.
 *
 * Gerar aqui e versionar o resultado dá as três coisas ao mesmo tempo: dado de
 * domínio público, ~100 KB de `path` no HTML, e zero dependência nova.
 *
 * ## Projeção: Miller cilíndrica
 *
 * ```
 * x = R · λ
 * y = 1,25 · R · ln( tan( π/4 + 0,4 · φ ) )
 * ```
 *
 * Fórmula fechada, sem biblioteca. Miller e não Mercator porque Mercator faz a
 * Groenlândia parecer maior que a África — numa tela cujo assunto é "quantos
 * países estão em cada fase", inflar países grandes e frios distorce a leitura
 * visual do próprio indicador. Miller e não equirretangular porque a
 * equirretangular achata tanto o Norte que Escandinávia e Bálticos, que são
 * cobertos pelo Eurostat com confiança alta, viram uma faixa ilegível.
 *
 * ## O que fica de fora, e por quê
 *
 * - **Antártida (`AQ`)**: não há força de trabalho medida por instituto de
 *   estatística nenhum, e em qualquer projeção cilíndrica ela ocupa a faixa
 *   inferior inteira. A latitude é cortada em -58°, que é ao sul do ponto mais
 *   austral do Chile continental (-55,98°).
 * - **Países pequenos demais para ter polígono em 1:110m**: entram pela camada
 *   `tiny_countries` do PRÓPRIO Natural Earth, que é uma camada de PONTOS feita
 *   exatamente para isto. Vira um círculo pequeno no lugar do país. Sem ela,
 *   quatro países que o índice cobre de verdade — Barbados, Malta, Maurício e
 *   Singapura — sumiriam do mapa, e sumir é indistinguível de "sem dado".
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const NE_TAG = 'v5.1.2'
const BASE = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_TAG}/geojson`
const COUNTRIES_URL = `${BASE}/ne_110m_admin_0_countries.geojson`
const TINY_URL = `${BASE}/ne_110m_admin_0_tiny_countries.geojson`

/** Largura do `viewBox`. A altura sai da projeção, não de um palpite. */
const WIDTH = 1000
/** Casas decimais do `path`. 1 casa em 1000 px ≈ 4 km no equador. */
const PRECISION = 1
/** Corte ao sul. Ver o cabeçalho. */
const SOUTH_CLIP = -58
/** Corte ao norte: acima disto só há gelo, e Miller estica sem limite. */
const NORTH_CLIP = 84

const DEG = Math.PI / 180

/** Miller cilíndrica, em unidades de raio. */
function millerY(latDeg: number): number {
  return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latDeg * DEG))
}

const Y_TOP = millerY(NORTH_CLIP)
const Y_BOTTOM = millerY(SOUTH_CLIP)
const X_SPAN = 2 * Math.PI
const SCALE = WIDTH / X_SPAN
const HEIGHT = (Y_TOP - Y_BOTTOM) * SCALE

function projectX(lonDeg: number): number {
  return (lonDeg * DEG + Math.PI) * SCALE
}

function projectY(latDeg: number): number {
  const clamped = Math.min(NORTH_CLIP, Math.max(SOUTH_CLIP, latDeg))
  return (Y_TOP - millerY(clamped)) * SCALE
}

const round = (n: number) => Number(n.toFixed(PRECISION))

interface GeoFeature {
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: any } | null
}

/**
 * Um anel vira um subcaminho fechado.
 *
 * Pontos consecutivos que caem no mesmo pixel arredondado são descartados: em
 * 1:110m há muitos, e cada um custa bytes no HTML sem mudar um pixel.
 */
function ringToPath(ring: [number, number][]): string {
  let out = ''
  let lastX: number | null = null
  let lastY: number | null = null

  for (const [lon, lat] of ring) {
    const x = round(projectX(lon))
    const y = round(projectY(lat))
    if (x === lastX && y === lastY) continue
    out += `${out === '' ? 'M' : 'L'}${x} ${y}`
    lastX = x
    lastY = y
  }

  return out === '' ? '' : `${out}Z`
}

function geometryToPath(geometry: GeoFeature['geometry']): string {
  if (!geometry) return ''
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as [number, number][][]).map(ringToPath).join('')
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as [number, number][][][])
      .flatMap((polygon) => polygon.map(ringToPath))
      .join('')
  }
  return ''
}

/**
 * O alfa-2 do registro.
 *
 * `ISO_A2_EH` antes de `ISO_A2` de propósito: o Natural Earth grava `-99` em
 * `ISO_A2` para territórios de soberania disputada e usa a variante `_EH`
 * ("effective hegemony") para dizer qual código vale na prática. Sem código
 * utilizável o registro é DESCARTADO — inventar um alfa-2 aqui gravaria um país
 * fantasma no mapa, que é a mesma classe de erro que os conectores já rejeitam
 * em `connectors/iso3.ts`.
 */
function iso2Of(feature: GeoFeature): string | null {
  for (const key of ['ISO_A2_EH', 'ISO_A2']) {
    const raw = feature.properties[key]
    if (typeof raw === 'string') {
      const code = raw.trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) return code
    }
  }
  return null
}

async function fetchGeoJson(url: string): Promise<{ features: GeoFeature[] }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`)
  return (await res.json()) as { features: GeoFeature[] }
}

async function main() {
  const [countries, tiny] = await Promise.all([fetchGeoJson(COUNTRIES_URL), fetchGeoJson(TINY_URL)])

  // Um país pode aparecer em mais de um registro (o Natural Earth separa
  // dependências). Os `path` são concatenados no mesmo código: o mapa desenha
  // "o país", não "o registro".
  const shapes = new Map<string, string>()
  for (const feature of countries.features) {
    const code = iso2Of(feature)
    if (!code || code === 'AQ') continue
    const d = geometryToPath(feature.geometry)
    if (!d) continue
    shapes.set(code, (shapes.get(code) ?? '') + d)
  }

  const markers = new Map<string, [number, number]>()
  for (const feature of tiny.features) {
    const code = iso2Of(feature)
    if (!code || shapes.has(code) || markers.has(code)) continue
    const geometry = feature.geometry
    if (!geometry || geometry.type !== 'Point') continue
    const [lon, lat] = geometry.coordinates as [number, number]
    markers.set(code, [round(projectX(lon)), round(projectY(lat))])
  }

  const sortedShapes = [...shapes.entries()].sort(([a], [b]) => a.localeCompare(b))
  const sortedMarkers = [...markers.entries()].sort(([a], [b]) => a.localeCompare(b))

  const header = `/**
 * Desenho do mapa-múndi — ARQUIVO GERADO, não edite à mão.
 *
 * Gerado por \`src/scripts/build-world-map.ts\`, que documenta a fonte, a
 * licença e a projeção. Resumo do que está aqui:
 *
 * - **Fonte:** Natural Earth 1:110m Admin 0 (Countries + Tiny Countries), tag
 *   \`${NE_TAG}\` de \`github.com/nvkelso/natural-earth-vector\`.
 * - **Licença:** domínio público ("Everything here is public domain"; "No
 *   permission is needed to use Natural Earth"). Crédito dado na tela por
 *   política desta base de código, não por exigência da licença.
 * - **Projeção:** Miller cilíndrica, \`y = 1,25·ln(tan(π/4 + 0,4·φ))\`.
 * - **Fora:** Antártida; latitudes fora de [${SOUTH_CLIP}°, ${NORTH_CLIP}°].
 *
 * Chave: ISO 3166-1 alfa-2, a mesma de \`LaborMarketPoint.country\` e de
 * \`lib/market/countries.ts\`. Nenhum código fora dessa norma entra aqui.
 */

/** \`viewBox\` do \`<svg>\`. A altura vem da projeção, não de arredondamento. */
export const WORLD_MAP_VIEWBOX = '0 0 ${WIDTH} ${round(HEIGHT)}'

export interface WorldMapShape {
  /** ISO 3166-1 alfa-2. */
  code: string
  /** Atributo \`d\` do \`<path>\`, já projetado. */
  d: string
}

/**
 * Países com polígono próprio na escala 1:110m, em ordem alfabética de código.
 *
 * A ordem é alfabética e não tem exceção: nenhum país é desenhado primeiro,
 * por último ou de forma diferente dos outros.
 */
export const WORLD_MAP_SHAPES: WorldMapShape[] = [
`

  const shapeLines = sortedShapes.map(([code, d]) => `  { code: '${code}', d: '${d}' },`).join('\n')

  const markerHeader = `
]

export interface WorldMapMarker {
  code: string
  cx: number
  cy: number
}

/**
 * Países pequenos demais para ter polígono em 1:110m.
 *
 * Vêm da camada \`ne_110m_admin_0_tiny_countries\` do próprio Natural Earth —
 * uma camada de PONTOS publicada exatamente para este caso — e são desenhados
 * como um círculo pequeno. Sem isto, Barbados, Malta, Maurício e Singapura
 * (que o índice cobre com dado real) simplesmente não apareceriam, e um país
 * ausente é indistinguível de um país sem dado.
 */
export const WORLD_MAP_MARKERS: WorldMapMarker[] = [
`

  const markerLines = sortedMarkers.map(([code, [cx, cy]]) => `  { code: '${code}', cx: ${cx}, cy: ${cy} },`).join('\n')

  const body = `${header}${shapeLines}${markerHeader}${markerLines}\n]\n`

  const out = resolve(process.cwd(), 'src/lib/hiring-index/world-map.ts')
  writeFileSync(out, body, 'utf8')

  console.log(`Natural Earth ${NE_TAG} → ${out}`)
  console.log(`  ${sortedShapes.length} polígono(s), ${sortedMarkers.length} ponto(s)`)
  console.log(`  viewBox 0 0 ${WIDTH} ${round(HEIGHT)} — ${(body.length / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
