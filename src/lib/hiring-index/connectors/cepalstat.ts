/**
 * Conector do CEPALSTAT — taxa de desemprego trimestral da América Latina e Caribe.
 *
 * ## Verificado contra a API real
 *
 * Em 01/09/2026, por `GET` em
 * `https://api-cepalstat.cepal.org/cepalstat/api/v1/indicator/2182/data?lang=en&format=json`.
 * Voltaram 803 registros do indicador 2182 ("Unemployment rate by quarter"),
 * cobrindo 2014-Q1 a 2025-Q2 em 15 países — `ARG`, `BOL`, `BRA`, `CHL`, `COL`,
 * `CRI`, `DOM`, `ECU`, `JAM`, `MEX`, `NIC`, `PER`, `PRY`, `TTO`, `URY` — mais
 * três agregados. Uma linha real: `{"value":"5.8","source_id":36,
 * "notes_ids":"15090","iso3":"BRA","dim_208":222,"dim_29117":29195,
 * "dim_26677":26680}`.
 *
 * O identificador 2182 foi achado em
 * `GET /cepalstat/api/v1/thematic-tree?lang=en&format=json` (nó
 * `Social > Labour > Unemployment`), e não adivinhado. A API não pede chave: as
 * chamadas acima respondem sem nenhum cabeçalho de autenticação.
 *
 * ## Por que o indicador trimestral, e não o anual
 *
 * O CEPALSTAT publica também o 127 ("Unemployment rate by sex"), anual e com
 * mais países. Não serve: `periodType` do produto é `month | quarter` (ver
 * `../types.ts`), e um ponto anual gravado como se fosse mensal seria formatado
 * na tela como um mês que ninguém publicou. Mesma decisão, pelo mesmo motivo,
 * que a de `./ilostat.ts`.
 *
 * ## Agregados não são países, e a própria resposta diz qual é qual
 *
 * "Latin America", "Caribbean" e "Latin America and the Caribbean" vêm na mesma
 * lista dos países, com `iso3: null`. São médias ponderadas de séries que a
 * própria nota de rodapé 15090 declara não comparáveis entre si ("Data for
 * individual countries are not comparable due to differences in coverage and
 * definition of the working-age population"). O filtro é o `iso3`: sem ele, o
 * registro não é país e não entra.
 *
 * ## As notas de rodapé são lidas, e uma delas é a mais importante da tabela
 *
 * A resposta traz `footnotes` com o texto de cada nota e, em cada registro, os
 * `notes_ids` que se aplicam a ele. Três dessas notas dizem, com estas palavras,
 * "New measurement since [ano]; data are not comparable with previous years" —
 * e cada uma está presa a UM único registro, o primeiro da medição nova
 * (conferido na resposta real: 8604 na República Dominicana em 2015, 8800 no
 * Brasil em 2016, 8801 no Paraguai em 2017; um registro cada). Isso é
 * exatamente `seriesBreak`, e sem ele a mudança de metodologia apareceria na
 * tela como um mercado virando de repente.
 *
 * A leitura é pelo TEXTO da nota, não pelo `id`: um número de nota é uma chave
 * interna do CEPALSTAT que pode ser reemitida, enquanto a frase é o que a fonte
 * afirma. Por isso a chamada fixa `lang=en` — o padrão da conta que a nota é
 * lida em inglês.
 *
 * O casamento é deliberadamente estreito. A nota 15092, presa a 46 registros da
 * Argentina, também fala de comparabilidade ("INDEC ... recommends disregarding
 * the series published between 2007 and 2015 for purposes of comparison"), mas
 * é ressalva geral do período inteiro, não um ponto de corte — e marcá-la como
 * quebra faria `classifyHiringPhase` cortar a série argentina em 46 lugares.
 * Nota que não casa não vira nada: fica só em `note`, e o ponto segue normal.
 *
 * ## A confiança é `low` SEMPRE
 *
 * A mesma posição de `./ilostat.ts` e de `prisma/schema.prisma`, e aqui ela é
 * mais aguda do que em qualquer outra fonte do produto: a informalidade na
 * região é grande e documentada, e taxa de desemprego conta quem trabalha
 * informalmente como "empregado". Some-se a isso que a própria definição do
 * indicador diz que os dados "correspond to the open unemployment and urban
 * coverage unless it is indicated" — cobertura urbana, não nacional, na maior
 * parte da série.
 *
 * Nenhum país é tratado de forma especial aqui, e a ordem em que aparecem é a
 * da resposta. Onde o ILOSTAT também cobre o mesmo país, `selectSeries` (em
 * `../lookup.ts`) decide sozinho qual série tem mais pontos — não há, e não
 * deve haver, exclusão escrita neste arquivo.
 */

import { fetchJsonWithBudget } from './fetch-with-budget'
import { iso2FromIso3 } from './iso3'
import type {
  ConnectorResult,
  FetchContext,
  LaborMarketConnector,
  LaborMarketPointInput,
} from '../types'

export const CEPALSTAT_BASE = 'https://api-cepalstat.cepal.org/cepalstat/api/v1'

/** "Unemployment rate by quarter", em `Social > Labour > Unemployment`. */
export const CEPALSTAT_INDICATOR = 2182

export const CEPALSTAT_DESCRIPTOR = {
  slug: 'cepalstat_une',
  name: 'CEPALSTAT — taxa de desemprego trimestral (América Latina e Caribe)',
  metric: 'unemployment_rate' as const,
  // Ver o cabeçalho: incondicional.
  confidence: 'low' as const,
  // Nulo: quem entrega o trimestre muda, e a lista da resposta é a verdade.
  countries: null,
  accessNote:
    'API de dados abertos do CEPALSTAT (api-cepalstat.cepal.org), aberta e sem chave, sob a política de dados abertos da CEPAL/ONU.',
}

/**
 * A frase com que o CEPALSTAT declara quebra de série. Ver o cabeçalho.
 *
 * Estreita de propósito: casa "New measurement since 2016; data are not
 * comparable with previous years" e não casa a ressalva geral da nota 15092.
 */
export const CEPALSTAT_BREAK_PHRASE = /not comparable with previous years/i

/** A frase com que o CEPALSTAT marca dado provisório ("Preliminary data"). */
export const CEPALSTAT_PRELIMINARY_PHRASE = /\bpreliminary\b/i

interface CepalMember {
  id?: number
  name?: string
}

interface CepalDimension {
  id?: number
  name?: string
  members?: CepalMember[]
}

interface CepalFootnote {
  id?: number
  description?: string
}

interface CepalRecord {
  value?: string | number | null
  iso3?: string | null
  notes_ids?: string | null
  [key: string]: unknown
}

interface CepalPayload {
  header?: { success?: boolean; code?: number; message?: string }
  body?: {
    data?: CepalRecord[]
    dimensions?: CepalDimension[]
    footnotes?: CepalFootnote[]
  }
}

/**
 * Descobre quais dimensões são o ano e o trimestre, pelos MEMBROS delas.
 *
 * Os identificadores numéricos (208, 26677, 29117 na leitura de 01/09/2026) são
 * chaves internas do CEPALSTAT e valem por indicador; os nomes vêm parte em
 * inglês, parte em espanhol ("Trimestre"), mesmo com `lang=en`. Nenhum dos dois
 * é base confiável. O formato dos membros é: quatro dígitos são anos, `Q1`..`Q4`
 * são trimestres. É o que a resposta afirma de si mesma.
 */
export function locateTimeDimensions(dimensions: readonly CepalDimension[] | undefined): {
  yearKey: string | null
  quarterKey: string | null
  years: Map<number, number>
  quarters: Map<number, number>
} {
  let yearKey: string | null = null
  let quarterKey: string | null = null
  const years = new Map<number, number>()
  const quarters = new Map<number, number>()

  for (const dimension of dimensions ?? []) {
    const members = Array.isArray(dimension?.members) ? dimension.members : []
    if (members.length === 0 || typeof dimension?.id !== 'number') continue

    const named = members.filter((m) => typeof m?.name === 'string' && typeof m?.id === 'number')
    if (named.length === 0) continue

    if (yearKey === null && named.every((m) => /^\d{4}$/.test(m.name!.trim()))) {
      yearKey = `dim_${dimension.id}`
      for (const m of named) years.set(m.id!, Number(m.name!.trim()))
      continue
    }

    if (quarterKey === null && named.every((m) => /^Q[1-4]$/i.test(m.name!.trim()))) {
      quarterKey = `dim_${dimension.id}`
      for (const m of named) quarters.set(m.id!, Number(m.name!.trim().slice(1)))
    }
  }

  return { yearKey, quarterKey, years, quarters }
}

/** Ano e trimestre → primeiro dia do trimestre, em UTC. */
export function periodFromYearQuarter(year: number, quarter: number): Date | null {
  if (!Number.isInteger(year) || year < 1900 || year > 2999) return null
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) return null
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1))
}

/**
 * Converte o corpo da resposta em pontos.
 *
 * `since` recorta a janela: a API devolve a série inteira desde 2014, e gravar
 * doze anos de todos os países a cada coleta multiplica a escrita sem
 * acrescentar sinal — `classifyHiringPhase` olha os últimos períodos.
 */
export function parseCepalstatPayload(
  payload: unknown,
  since: Date | null = null
): { points: LaborMarketPointInput[]; problems: string[] } {
  const body = payload as CepalPayload | null

  if (body?.header && body.header.success === false) {
    const code = body.header.code ?? 'sem código'
    return {
      points: [],
      problems: [`CEPALSTAT não processou o pedido (${code}): ${body.header.message || 'sem mensagem'}`],
    }
  }

  const records = body?.body?.data
  if (!Array.isArray(records) || records.length === 0) {
    // Resposta sem registro é FALHA de coleta, não região sem desemprego — o
    // mesmo defeito que a Adzuna já ensinou aqui (ver `../collect.ts`).
    return { points: [], problems: ['CEPALSTAT respondeu sem nenhum registro'] }
  }

  const { yearKey, quarterKey, years, quarters } = locateTimeDimensions(body?.body?.dimensions)
  if (!yearKey || !quarterKey) {
    return {
      points: [],
      problems: ['Resposta do CEPALSTAT sem as dimensões de ano e trimestre'],
    }
  }

  const footnotes = new Map<number, string>()
  for (const note of body?.body?.footnotes ?? []) {
    if (typeof note?.id === 'number' && typeof note?.description === 'string') {
      footnotes.set(note.id, note.description)
    }
  }

  const points: LaborMarketPointInput[] = []
  const skippedAreas = new Set<string>()
  let aggregates = 0

  for (const record of records) {
    const iso3 = typeof record?.iso3 === 'string' ? record.iso3.trim() : ''
    if (iso3 === '') {
      // Agregado regional. Ver o cabeçalho: não é país e não é problema.
      aggregates++
      continue
    }

    const country = iso2FromIso3(iso3)
    if (!country) {
      skippedAreas.add(iso3.toUpperCase())
      continue
    }

    const year = years.get(record[yearKey] as number)
    const quarter = quarters.get(record[quarterKey] as number)
    if (year === undefined || quarter === undefined) continue

    const period = periodFromYearQuarter(year, quarter)
    if (!period) continue
    if (since && period.getTime() < since.getTime()) continue

    // `value` vem como TEXTO. `Number('')` é `0`, e `0` é finito: sem a checagem
    // de string vazia, um trimestre sem medição entraria na série como
    // "desemprego de 0,0%".
    const raw = typeof record?.value === 'string' ? record.value.trim() : record?.value
    if (raw === '' || raw === null || raw === undefined) continue
    const value = Number(raw)
    if (!Number.isFinite(value)) continue

    const noteIds = typeof record?.notes_ids === 'string' ? record.notes_ids.trim() : ''
    const descriptions = noteIds
      .split(',')
      .map((id) => footnotes.get(Number(id.trim())))
      .filter((d): d is string => typeof d === 'string')

    points.push({
      country,
      source: CEPALSTAT_DESCRIPTOR.slug,
      metric: CEPALSTAT_DESCRIPTOR.metric,
      value,
      unit: 'percent',
      period,
      periodType: 'quarter',
      revised: !descriptions.some((d) => CEPALSTAT_PRELIMINARY_PHRASE.test(d)),
      seriesBreak: descriptions.some((d) => CEPALSTAT_BREAK_PHRASE.test(d)),
      // Incondicional. Ver o cabeçalho.
      confidence: CEPALSTAT_DESCRIPTOR.confidence,
      // Os identificadores como vieram, e não o texto: é rastro de origem, do
      // mesmo jeito que o código de nota de rodapé do BLS.
      note: noteIds === '' ? null : noteIds,
    })
  }

  const problems: string[] = []
  if (skippedAreas.size > 0) {
    problems.push(`Códigos de país desconhecidos ignorados: ${[...skippedAreas].sort().join(', ')}`)
  }
  if (points.length === 0 && aggregates > 0) {
    problems.push(`CEPALSTAT respondeu só com agregados regionais (${aggregates} registros)`)
  }

  return { points, problems }
}

export interface CepalstatOptions {
  /** Quantos trimestres para trás. Padrão 24 (6 anos), igual às outras fontes. */
  lastPeriods?: number
  /** Injetado nos testes. */
  fetchImpl?: typeof fetch
  /** Injetado nos testes, para a janela ser determinística. */
  now?: () => Date
}

/** O primeiro dia do trimestre que abre a janela de `lastPeriods` trimestres. */
export function windowStart(now: Date, lastPeriods: number): Date {
  const quarterIndex = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3)
  const start = quarterIndex - (lastPeriods - 1)
  return new Date(Date.UTC(Math.floor(start / 4), (start % 4) * 3, 1))
}

export function createCepalstatConnector(options: CepalstatOptions = {}): LaborMarketConnector {
  const doFetch = options.fetchImpl ?? fetch
  const now = options.now ?? (() => new Date())
  const lastPeriods = Math.max(6, Math.min(options.lastPeriods ?? 24, 100))

  return {
    descriptor: CEPALSTAT_DESCRIPTOR,

    async fetchPoints(context: FetchContext): Promise<ConnectorResult> {
      // A API não filtra período: devolve a série inteira e o recorte é nosso.
      // `lang=en` é obrigatório para a leitura das notas — ver o cabeçalho.
      const url = `${CEPALSTAT_BASE}/indicator/${CEPALSTAT_INDICATOR}/data?lang=en&format=json`

      const fetched = await fetchJsonWithBudget(url, {
        timeBudgetMs: context.timeBudgetMs,
        sourceName: 'CEPALSTAT',
        fetchImpl: doFetch,
      })

      if (!fetched.ok) {
        return { outcome: 'failed', points: [], error: fetched.error }
      }

      const { points, problems } = parseCepalstatPayload(fetched.json, windowStart(now(), lastPeriods))

      if (points.length === 0) {
        return {
          outcome: 'failed',
          points: [],
          error: problems.join('; ') || 'CEPALSTAT respondeu sem nenhum ponto aproveitável',
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
