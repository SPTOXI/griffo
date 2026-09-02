/**
 * Conector do Eurostat — taxa de postos vagos, todos os países numa chamada.
 *
 * ## Verificado contra a API real
 *
 * Em 01/09/2026, por `GET` em
 * `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/jvs_q_nace2`
 * com `format=JSON&lang=EN&freq=Q&s_adj=SA&nace_r2=B-S&sizeclas=TOTAL&indic_em=JVR&lastTimePeriod=4`.
 * Voltaram 36 entidades (33 países + 3 agregados) em 4 trimestres, com
 * `2025-Q4`: Bélgica 3,5 · Alemanha 2,6 · França 2,3[d] · Polônia 0,8 ·
 * Países Baixos 4,0[p] · Dinamarca ausente.
 *
 * Os códigos das dimensões foram descobertos assim, e não pela documentação:
 * a primeira tentativa usou `indic_em=JOBRATE` e `s_adj=SCA`, e a API devolveu
 * 200 com `value: {}` — filtro que não casa não dá erro, dá vazio. Os códigos
 * certos são `JVR` e `SA`, lidos de `dimension.indic_em.category.index` numa
 * chamada sem filtro.
 *
 * ## Uma chamada, todos os países — e nenhum ranking
 *
 * Ter todo mundo na mesma resposta convida a ordenar a lista. **Não faça
 * isso.** O próprio Eurostat não publica total da UE para esta série porque os
 * países não são comparáveis: a amostra vai de ~2.500 empresas (Finlândia) a
 * ~75.000 (Polônia); a taxa de resposta vai de 11,4% (Alemanha) a 98,8%
 * (Romênia); a França pesquisa só empresas com 10+ empregados e exclui
 * administração pública — é por isso que a França vem marcada `d` ("definição
 * difere") em todos os trimestres.
 *
 * A marcação `d` **não** rebaixa a confiança aqui, e a razão é o desenho
 * inteiro do produto: o índice compara um país com a própria história, não com
 * o vizinho. Uma definição própria e estável não atrapalha nada disso.
 *
 * A marcação que importa de verdade é `b` — quebra de série. Ela diz que os
 * valores antes e depois daquele ponto não são comparáveis **entre si**, o que
 * é exatamente a única comparação que este produto faz. Por isso ela vai para
 * `note`, e `../phase.ts` corta a série no ponto de quebra.
 *
 * ## Agregados não são países
 *
 * `EU27_2020`, `EA20` e `EA21` vêm na mesma lista dos países. São médias
 * ponderadas de séries que o próprio Eurostat diz não serem comparáveis;
 * guardá-las como se fossem um "país" chamado União Europeia daria ao número
 * mais autoridade do que ele tem. Ficam de fora.
 *
 * ## Dois códigos que não são ISO
 *
 * O Eurostat escreve `EL` para a Grécia e `UK` para o Reino Unido. O ISO 3166-1
 * diz `GR` e `GB`, e é ISO que o resto do produto guarda. A tradução acontece
 * aqui, na fronteira, e não no consumidor — senão a Grécia viraria dois países
 * no banco.
 */

import { isKnownCountry } from '../../market/countries'
import { fetchJsonWithBudget } from './fetch-with-budget'
import type {
  ConnectorResult,
  FetchContext,
  LaborMarketConnector,
  LaborMarketPointInput,
} from '../types'

export const EUROSTAT_BASE =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

/** Estatísticas de postos vagos por atividade NACE Rev. 2, trimestral. */
export const EUROSTAT_DATASET = 'jvs_q_nace2'

export const EUROSTAT_DESCRIPTOR = {
  slug: 'eurostat_jvs',
  name: 'Eurostat — taxa de postos vagos (UE/EEE)',
  metric: 'job_vacancy_rate' as const,
  // Pesquisa direta com empregadores, como o JOLTS. A ressalva do Eurostat é
  // sobre comparar países ENTRE SI — e isso este produto não faz.
  confidence: 'high' as const,
  // Nulo de propósito: quem responde no trimestre muda, e uma lista fixa aqui
  // ficaria mentindo na primeira adesão ou na primeira ausência.
  countries: null,
  accessNote:
    'API de disseminação do Eurostat, aberta e sem chave, sob a política de reutilização de dados da Comissão Europeia.',
}

/**
 * Códigos do Eurostat que não são países.
 *
 * A checagem de formato (`^[A-Z]{2}$`) já barraria os três, mas a lista existe
 * escrita para que fique registrado que a exclusão é deliberada, e não um
 * efeito colateral de uma expressão regular.
 */
export const EUROSTAT_AGGREGATES = new Set(['EU27_2020', 'EU28', 'EA', 'EA19', 'EA20', 'EA21'])

/** `EL` → `GR`, `UK` → `GB`. Ver o cabeçalho. */
export function isoFromEurostatGeo(geo: string): string | null {
  const code = geo.trim().toUpperCase()
  if (EUROSTAT_AGGREGATES.has(code)) return null
  const iso = code === 'EL' ? 'GR' : code === 'UK' ? 'GB' : code
  if (!/^[A-Z]{2}$/.test(iso)) return null
  // O país precisa existir na lista do produto: um código novo que ninguém
  // mapeou é melhor descartado do que gravado como país fantasma.
  return isKnownCountry(iso) ? iso : null
}

/** `2025-Q4` → 1º de outubro de 2025 em UTC. Nulo para qualquer outro formato. */
export function periodFromEurostatTime(time: string): Date | null {
  const match = /^(\d{4})-?Q([1-4])$/.exec(time.trim().toUpperCase())
  if (!match) return null
  const year = Number(match[1])
  const quarter = Number(match[2])
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1))
}

interface JsonStatCategory {
  index?: Record<string, number>
  label?: Record<string, string>
}

interface JsonStatDimension {
  label?: string
  category?: JsonStatCategory
}

interface JsonStatDataset {
  id?: string[]
  size?: number[]
  dimension?: Record<string, JsonStatDimension>
  value?: Record<string, number | null>
  status?: Record<string, string>
  updated?: string
  error?: unknown
}

/**
 * Um valor decodificado do JSON-stat, já com os códigos das dimensões.
 *
 * O JSON-stat 2.0 guarda os valores num objeto esparso cuja chave é o índice
 * ACHATADO de uma matriz n-dimensional. Nada na resposta diz "este 2.3 é da
 * França no 4º trimestre" — isso se calcula a partir de `id`, `size` e dos
 * `category.index` de cada dimensão. É o único trecho não óbvio deste arquivo.
 */
export interface JsonStatCell {
  dims: Record<string, string>
  value: number
  status: string | null
}

/**
 * Desfaz o achatamento e devolve as células preenchidas.
 *
 * Genérico de propósito: se um dia o filtro deixar mais de uma dimensão com
 * tamanho > 1 (por setor NACE, por exemplo), isto continua funcionando sem
 * mudança. Células ausentes (o `:` do Eurostat) simplesmente não estão no
 * objeto `value` — país sem dado no trimestre não vira zero, nem vira nada.
 */
export function decodeJsonStat(payload: unknown): JsonStatCell[] {
  const data = payload as JsonStatDataset | null
  const ids = data?.id
  const sizes = data?.size
  const dimensions = data?.dimension
  const values = data?.value

  if (!Array.isArray(ids) || !Array.isArray(sizes) || !dimensions || !values) return []
  if (ids.length !== sizes.length) return []

  // Códigos por posição, para cada dimensão.
  const codesByDim: string[][] = ids.map((id) => {
    const index = dimensions[id]?.category?.index ?? {}
    const codes: string[] = []
    for (const [code, position] of Object.entries(index)) codes[position] = code
    return codes
  })

  // Passo de cada dimensão no índice achatado (ordem "row-major": a última
  // dimensão anda de um em um).
  const strides: number[] = new Array(ids.length).fill(1)
  for (let i = ids.length - 2; i >= 0; i--) strides[i] = strides[i + 1] * sizes[i + 1]

  const cells: JsonStatCell[] = []

  for (const [rawKey, rawValue] of Object.entries(values)) {
    const flat = Number(rawKey)
    if (!Number.isInteger(flat) || flat < 0) continue
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) continue

    const dims: Record<string, string> = {}
    let ok = true
    let rest = flat

    for (let i = 0; i < ids.length; i++) {
      const position = Math.floor(rest / strides[i])
      rest -= position * strides[i]
      const code = codesByDim[i][position]
      if (code === undefined) {
        ok = false
        break
      }
      dims[ids[i]] = code
    }

    if (!ok) continue

    const status = data?.status?.[rawKey]
    cells.push({ dims, value: rawValue, status: typeof status === 'string' ? status : null })
  }

  return cells
}

/**
 * As marcações do Eurostat que mudam a leitura de um ponto.
 *
 * `p` provisório · `e` estimado · `b` quebra de série · `d` definição difere ·
 * `u` baixa confiabilidade · `f` previsão.
 *
 * Só `u` rebaixa a confiança, porque só ele é a fonte dizendo que o número
 * dela não é confiável. `d` não rebaixa — ver o cabeçalho.
 */
export function flagsFrom(status: string | null): {
  revised: boolean
  breakInSeries: boolean
  lowConfidence: boolean
} {
  const flags = (status ?? '').toLowerCase()
  return {
    revised: !(flags.includes('p') || flags.includes('e') || flags.includes('f')),
    breakInSeries: flags.includes('b'),
    lowConfidence: flags.includes('u'),
  }
}

/** Converte o corpo da resposta em pontos. */
export function parseEurostatPayload(payload: unknown): {
  points: LaborMarketPointInput[]
  problems: string[]
} {
  const data = payload as JsonStatDataset | null

  if (data?.error) {
    return { points: [], problems: [`Eurostat devolveu erro: ${JSON.stringify(data.error)}`] }
  }

  const cells = decodeJsonStat(payload)
  if (cells.length === 0) {
    // Filtro que não casa devolve 200 com `value: {}`. Ver o cabeçalho: isto é
    // filtro errado, não Europa sem vagas.
    return { points: [], problems: ['Eurostat respondeu sem nenhum valor (filtro sem correspondência?)'] }
  }

  const points: LaborMarketPointInput[] = []
  const skippedGeos = new Set<string>()

  for (const cell of cells) {
    const geo = cell.dims.geo
    const time = cell.dims.time
    if (!geo || !time) continue

    const country = isoFromEurostatGeo(geo)
    if (!country) {
      if (!EUROSTAT_AGGREGATES.has(geo.toUpperCase())) skippedGeos.add(geo)
      continue
    }

    const period = periodFromEurostatTime(time)
    if (!period) continue

    const { revised, breakInSeries, lowConfidence } = flagsFrom(cell.status)

    points.push({
      country,
      source: EUROSTAT_DESCRIPTOR.slug,
      metric: EUROSTAT_DESCRIPTOR.metric,
      value: cell.value,
      unit: 'percent',
      period,
      periodType: 'quarter',
      revised,
      seriesBreak: breakInSeries,
      confidence: lowConfidence ? 'low' : EUROSTAT_DESCRIPTOR.confidence,
      note: cell.status,
    })
  }

  const problems: string[] = []
  if (skippedGeos.size > 0) {
    problems.push(`Códigos de país desconhecidos ignorados: ${[...skippedGeos].sort().join(', ')}`)
  }

  return { points, problems }
}

export interface EurostatOptions {
  /** Quantos trimestres para trás. Padrão 24 (6 anos) — sobra para ver a curva. */
  lastPeriods?: number
  fetchImpl?: typeof fetch
}

export function createEurostatConnector(options: EurostatOptions = {}): LaborMarketConnector {
  const doFetch = options.fetchImpl ?? fetch
  const lastPeriods = Math.max(6, Math.min(options.lastPeriods ?? 24, 100))

  return {
    descriptor: EUROSTAT_DESCRIPTOR,

    async fetchPoints(context: FetchContext): Promise<ConnectorResult> {
      const url =
        `${EUROSTAT_BASE}/${EUROSTAT_DATASET}` +
        `?format=JSON&lang=EN` +
        `&freq=Q` +
        // Com ajuste sazonal: sem ele, todo país "esfria" no mesmo trimestre
        // todo ano e a classificação de fase viraria um calendário.
        `&s_adj=SA` +
        // Indústria, construção e serviços — o agregado mais amplo publicado.
        `&nace_r2=B-S` +
        `&sizeclas=TOTAL` +
        `&indic_em=JVR` +
        `&lastTimePeriod=${lastPeriods}`

      const fetched = await fetchJsonWithBudget(url, {
        timeBudgetMs: context.timeBudgetMs,
        sourceName: 'Eurostat',
        fetchImpl: doFetch,
      })

      if (!fetched.ok) {
        return { outcome: 'failed', points: [], error: fetched.error }
      }

      const { points, problems } = parseEurostatPayload(fetched.json)

      if (points.length === 0) {
        return {
          outcome: 'failed',
          points: [],
          error: problems.join('; ') || 'Eurostat respondeu sem nenhum ponto aproveitável',
        }
      }

      return {
        outcome: problems.length > 0 ? 'partial' : 'complete',
        points,
        error: problems.length > 0 ? problems.join('; ') : null,
      }
    },
  }
}
