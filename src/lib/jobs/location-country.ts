import { foldTitle } from '../market/taxonomy'

/**
 * Infere país a partir de texto de localização livre — ver `normalize.ts`.
 *
 * ## Por que isto não é "inventar dado"
 *
 * O cabeçalho de `normalize.ts` proíbe inventar, com uma única exceção: "a
 * única inferência permitida é a que se lê do próprio texto da vaga". É
 * exatamente essa exceção que já autoriza `normalizeRemoteType` a ler
 * "remote"/"hybrid" dentro do texto de localização. Ler "Brazil"/"São Paulo"
 * no mesmo texto para decidir o país é a MESMA classe de inferência — não
 * uma nova.
 *
 * ## Por que é uma lista fechada, não geocoding
 *
 * Nenhuma API paga, nenhuma biblioteca de geocoding: a lista de países e
 * cidades abaixo foi extraída direto das 725 strings distintas que hoje
 * chegam sem país (consulta ao banco de produção, 13/09/2026) — cobre o que
 * REALMENTE aparece nos dados, na ordem de volume. Texto que não bate com
 * nada aqui devolve `null`, nunca um palpite — mesma regra de "não sei ≠
 * inventar" do resto do arquivo.
 *
 * ## Localização com mais de um lugar
 *
 * "San Francisco, CA | New York City, NY | Seattle, WA" — nos casos reais
 * observados, todos os trechos de uma mesma vaga sempre caem no mesmo país.
 * Por isso só o PRIMEIRO trecho (antes do primeiro `|`/`;`) é considerado:
 * suficiente pela amostra real, e mais barato que resolver e comparar todos.
 */

/** Nome de país/gentílico que aparece por extenso no texto. EN + PT, porque
 *  a mistura de idiomas nas strings observadas ("Brazil", "Brasil") é real. */
const COUNTRY_NAME_TO_CODE: [string, string][] = [
  ['united states of america', 'US'],
  ['united states', 'US'],
  ['usa', 'US'],
  // `us` sozinho é arriscado em prosa geral (é também o pronome), mas este
  // campo é sempre localização de vaga, nunca frase — "US - Remote" é padrão
  // real observado (32 vagas), não risco de falso positivo neste contexto.
  ['us', 'US'],
  ['united kingdom', 'GB'],
  ['uk', 'GB'],
  ['brazil', 'BR'],
  ['brasil', 'BR'],
  ['canada', 'CA'],
  ['ireland', 'IE'],
  ['japan', 'JP'],
  ['france', 'FR'],
  ['germany', 'DE'],
  ['mexico', 'MX'],
  ['south korea', 'KR'],
  ['australia', 'AU'],
  ['singapore', 'SG'],
  ['india', 'IN'],
  ['spain', 'ES'],
  ['netherlands', 'NL'],
  ['poland', 'PL'],
  ['china', 'CN'],
  ['philippines', 'PH'],
  ['south africa', 'ZA'],
  ['united arab emirates', 'AE'],
  ['new zealand', 'NZ'],
  ['hungary', 'HU'],
  ['vietnam', 'VN'],
  ['indonesia', 'ID'],
  ['italy', 'IT'],
  ['turkey', 'TR'],
  ['czech republic', 'CZ'],
  ['czechia', 'CZ'],
  ['thailand', 'TH'],
  ['belgium', 'BE'],
  ['austria', 'AT'],
  ['estonia', 'EE'],
]

/** Cidade sem país explícito no texto — só as que apareceram de fato nos
 *  dados reais, em ordem de volume observado. */
const CITY_NAME_TO_CODE: [string, string][] = [
  ['san francisco', 'US'],
  ['new york city', 'US'],
  ['new york', 'US'],
  ['washington', 'US'],
  ['seattle', 'US'],
  ['menlo park', 'US'],
  ['chicago', 'US'],
  ['romeoville', 'US'],
  ['london', 'GB'],
  ['dublin', 'IE'],
  ['toronto', 'CA'],
  ['bengaluru', 'IN'],
  ['bangalore', 'IN'],
  ['tokyo', 'JP'],
  ['sydney', 'AU'],
  ['seoul', 'KR'],
  ['paris', 'FR'],
  ['munich', 'DE'],
  ['mexico city', 'MX'],
  ['sao paulo', 'BR'],
  ['curitiba', 'BR'],
  ['cuiaba', 'BR'],
  ['salvador', 'BR'],
  ['fortaleza', 'BR'],
  ['rio de janeiro', 'BR'],
]

const US_STATE_CODES = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks',
  'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny',
  'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv',
  'wi', 'wy', 'dc',
])

function findByWord(folded: string, table: [string, string][]): string | null {
  for (const [name, code] of table) {
    if (new RegExp(`\\b${name}\\b`).test(folded)) return code
  }
  return null
}

/** Sigla de estado americano após vírgula: "San Francisco, CA". Roda no
 *  texto ORIGINAL (não dobrado) porque depende da vírgula literal. */
function findUsStateAbbreviation(segment: string): boolean {
  const match = segment.match(/,\s*([A-Za-z]{2})\b/)
  return !!match && US_STATE_CODES.has(match[1].toLowerCase())
}

/**
 * Tenta achar o país a partir de cidade/região em texto livre. `null` quando
 * não bate com nada da lista — nunca um palpite.
 */
export function inferCountryFromLocation(
  city?: string | null,
  region?: string | null
): string | null {
  const raw = [city, region].filter((v): v is string => typeof v === 'string' && v.trim().length > 0).join(' ')
  if (!raw.trim()) return null

  // Só o primeiro trecho de localizações múltiplas — ver o cabeçalho.
  const firstSegment = raw.split(/[|;]/)[0] ?? raw

  const folded = foldTitle(firstSegment)
  if (!folded) return null

  return (
    findByWord(folded, COUNTRY_NAME_TO_CODE) ??
    findByWord(folded, CITY_NAME_TO_CODE) ??
    (findUsStateAbbreviation(firstSegment) ? 'US' : null)
  )
}
