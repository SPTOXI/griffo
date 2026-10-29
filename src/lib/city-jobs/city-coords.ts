import { inflateRawSync } from 'node:zlib'
import { cityName, citySlug, slugify, type CityEntry } from './city-index'

/**
 * Coordenadas das cidades para o mapa de vagas — a parte pura.
 *
 * A fonte é o arquivo `cities5000` da GeoNames: todas as cidades do mundo com
 * 5 mil habitantes ou mais, com nome, nome sem acento e nomes alternativos
 * ("München", "Munich", "Muenchen"), em licença CC BY 4.0. A gente não grava o
 * arquivo inteiro (seriam ~200 mil nomes, uns 6 MB): baixa, procura só as
 * cidades que existem nas vagas e guarda essas em `CityCoord`.
 *
 * Ideia do map.rezi.ai: ver no mapa onde há vaga aberta.
 */

/** Abaixo disso o mapa do país sai do sitemap e leva `noindex`: um mapa quase vazio não ajuda ninguém. */
export const MIN_CITIES_TO_INDEX_MAP = 3

export const GEONAMES_CITIES_URL = 'https://download.geonames.org/export/dump/cities5000.zip'

export interface GazetteerHit {
  lat: number
  lng: number
  geonameId: number
  population: number
  /** Bairro ou distrito de uma cidade (`PPLX` na GeoNames), não a cidade. */
  section: boolean
}

/**
 * Busca por país e slug, em dois índices: nome principal e nome alternativo.
 * O principal vence, a não ser que o alternativo seja uma cidade dez vezes
 * maior: "Juárez" é o nome de uma cidade pequena de Tabasco e o apelido de
 * Ciudad Juárez, e a vaga quase sempre quer dizer a grande. Sigla de até três
 * letras não entra nessa troca.
 */
export interface Gazetteer {
  primary: Map<string, GazetteerHit>
  alternate: Map<string, GazetteerHit>
}

const key = (country: string, slug: string) => `${country}|${slug}`

function keep(map: Map<string, GazetteerHit>, k: string, hit: GazetteerHit) {
  const prev = map.get(k)
  // Duas com o mesmo nome no mesmo país: a cidade vence o bairro homônimo (Cachoeirinha, RS,
  // e não o distrito de São Paulo), e entre iguais fica a maior, que é a que as vagas querem dizer.
  const better = !prev || (prev.section !== hit.section ? prev.section : prev.population < hit.population)
  if (better) map.set(k, hit)
}

/**
 * Lê o texto do `cities5000.txt` (uma cidade por linha, colunas separadas por
 * tab) e indexa só os países pedidos.
 */
export function buildGazetteer(text: string, countries: ReadonlySet<string>): Gazetteer {
  const gaz: Gazetteer = { primary: new Map(), alternate: new Map() }
  for (const line of text.split('\n')) {
    const f = line.split('\t')
    if (f.length < 15) continue
    const country = f[8]
    if (!countries.has(country)) continue
    const lat = Number(f[4])
    const lng = Number(f[5])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const hit = { lat, lng, geonameId: Number(f[0]), population: Number(f[14]) || 0, section: f[7] === 'PPLX' }
    for (const n of [f[1], f[2]]) {
      const s = slugify(n)
      if (s) keep(gaz.primary, key(country, s), hit)
    }
    for (const n of f[3].split(',')) {
      const s = slugify(n)
      if (s) keep(gaz.alternate, key(country, s), hit)
    }
  }
  return gaz
}

/**
 * Os slugs pelos quais uma cidade das vagas pode estar na GeoNames, do mais
 * confiável ao menos: o slug da página, o nome exibido e cada grafia crua.
 */
export function lookupSlugs(entry: Pick<CityEntry, 'slug' | 'name' | 'rawCities'>): string[] {
  const out = [entry.slug, slugify(entry.name)]
  for (const raw of entry.rawCities) {
    const name = cityName(raw)
    if (name) out.push(slugify(name), citySlug(name))
  }
  return [...new Set(out.filter(Boolean))]
}

export function findCoords(gaz: Gazetteer, country: string, slugs: readonly string[]): GazetteerHit | null {
  for (const s of slugs) {
    const main = gaz.primary.get(key(country, s))
    const alt = gaz.alternate.get(key(country, s))
    // Sigla fica com a cidade que se chama assim: "POA" é Porto Alegre, mas "Poá" é Poá.
    if (main && alt && s.length > 3 && alt.population > 10 * main.population && !alt.section) return alt
    if (main || alt) return main ?? alt!
  }
  return null
}

/**
 * Extrai um arquivo de um .zip, sem dependência nova. Lê o diretório central
 * (no fim do arquivo) em vez do cabeçalho local, porque o tamanho comprimido
 * pode vir só depois dos dados, no "data descriptor".
 */
export function unzipEntry(zip: Buffer, name: string): Buffer {
  const EOCD = 0x06054b50
  let eocd = -1
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (zip.readUInt32LE(i) === EOCD) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('zip sem diretório central')
  const count = zip.readUInt16LE(eocd + 10)
  let p = zip.readUInt32LE(eocd + 16)
  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('zip com diretório central inválido')
    const method = zip.readUInt16LE(p + 10)
    const compressed = zip.readUInt32LE(p + 20)
    const nameLen = zip.readUInt16LE(p + 28)
    const extraLen = zip.readUInt16LE(p + 30)
    const commentLen = zip.readUInt16LE(p + 32)
    const localOffset = zip.readUInt32LE(p + 42)
    const entryName = zip.toString('utf8', p + 46, p + 46 + nameLen)
    if (entryName === name) {
      const dataStart = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28)
      const data = zip.subarray(dataStart, dataStart + compressed)
      if (method === 0) return Buffer.from(data)
      if (method === 8) return inflateRawSync(data)
      throw new Error(`zip com compressão ${method} não suportada`)
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  throw new Error(`${name} não está no zip`)
}

/** Um ponto do mapa: uma cidade com vaga aberta e coordenada conhecida. */
export interface MapPoint {
  /** País (ISO). */
  c: string
  /** Slug da página da cidade. */
  s: string
  /** Nome exibido. */
  n: string
  /** Vagas abertas. */
  t: number
  lat: number
  lng: number
}
