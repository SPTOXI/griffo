/**
 * Conector do ILOSTAT — taxa de desemprego trimestral, cobertura global.
 *
 * ## Verificado contra a API real
 *
 * Em 01/09/2026, por `GET` em
 * `https://sdmx.ilo.org/rest/data/ILO,DF_UNE_DEAP_SEX_AGE_RT,1.0/.Q.UNE_DEAP_RT.SEX_T.AGE_YTHADULT_YGE15`
 * com `?startPeriod=2024-Q1&dimensionAtObservation=AllDimensions` e o cabeçalho
 * `Accept: application/vnd.sdmx.data+json;version=1.0`. Voltaram **95 países**
 * em 10 trimestres (698 observações), entre eles `DEU 2025-Q4 = 3.7`,
 * `USA 2025-Q4 = 4.209` e `BRA`, `AGO`, `GHA`, `NGA`, `RWA`, `ZAF`, `ZMB` — ou
 * seja, países que nem o BLS nem o Eurostat alcançam.
 *
 * A ordem das dimensões (`REF_AREA.FREQ.MEASURE.SEX.AGE.TIME_PERIOD`) saiu de
 * `GET /rest/datastructure/ILO/UNE_DEAP_SEX_AGE_RT`, e não de suposição: numa
 * chave SDMX posicional, trocar duas dimensões de lugar não dá erro — dá
 * resposta vazia, que é o defeito que o Eurostat já ensinou aqui.
 *
 * ## O cabeçalho `Accept-Language` é obrigatório, e o motivo é feio
 *
 * A mesma chamada que responde 200 no `curl` respondia **HTTP 500** pelo `fetch`
 * do Node, com o corpo de doze caracteres `languageTag1`. A diferença é que o
 * `curl` não manda `Accept-Language` nenhum e o `fetch` do Node manda
 * `Accept-Language: *` por padrão — e o NSI Web Service (v8.19.6.0, o que o ILO
 * usa) estoura ao interpretar `*` como etiqueta de idioma. Mandar
 * `Accept-Language: en` resolve.
 *
 * Isso não veio da documentação e não sairia de leitura de código: apareceu na
 * primeira coleta real contra as quatro fontes, quando o ILOSTAT foi a única a
 * voltar `failed` enquanto o `curl` da mesma URL continuava respondendo 200.
 *
 * ## Trimestral, e só trimestral
 *
 * O mesmo fluxo publica em `A` (anual), `Q` e `M`. Escolhido `Q` por três
 * razões, nesta ordem:
 *
 * 1. `periodType` do produto é `month | quarter` (ver `../types.ts`). Uma série
 *    anual entraria como se fosse mensal e a tela a formataria como "janeiro de
 *    2024" — um período que ninguém publicou.
 * 2. Misturar `M` e `Q` sob o mesmo `source|metric` seria pior que inútil:
 *    `selectSeries` agrupa por fonte e métrica, não por ritmo, e uma série com
 *    dois compassos faria a média móvel de 3 períodos somar um trimestre com
 *    dois meses.
 * 3. Não se perde nada. Conferido na resposta real de 01/09/2026: os 48 países
 *    com série mensal são um SUBCONJUNTO exato dos 95 com série trimestral —
 *    nenhum país existe só em `M`.
 *
 * ## Por que os dados relatados, e não as estimativas modeladas do ILO
 *
 * O ILOSTAT também publica `DF_UNE_2EAP_SEX_AGE_RT`, "ILO modelled estimates",
 * que chega perto de 190 países. É aí que mora a diferença entre ~95 e "o mundo
 * todo" — e é justamente por isso que ele NÃO é usado: para um país sem pesquisa
 * de força de trabalho, o número da série modelada é imputado por regressão a
 * partir de covariáveis, não medido. Gravá-lo produziria "fase de contratação"
 * para países onde ninguém contou nada, que é a mesma classe de erro do
 * incidente da Adzuna (ver `../collect.ts`), só que mais difícil de perceber
 * porque o número chega com aparência de dado.
 *
 * Cobertura menor e verdadeira; não maior e inventada.
 *
 * ## A confiança é `low` SEMPRE, e não caso a caso
 *
 * Não é juízo sobre este ou aquele instituto: é a posição documentada do
 * produto (ver `prisma/schema.prisma` e `../types.ts`). Taxa de desemprego mede
 * coisa diferente de taxa de vaga em aberto, e em economia com setor informal
 * grande mede mal — quem trabalha informalmente conta como "empregado", sem que
 * exista contratação formal nenhuma por trás. Um mercado formal parado e um
 * mercado formal aquecido podem devolver a mesma taxa de desemprego.
 *
 * Por isso todo ponto sai `low`, inclusive os da Alemanha e dos Estados Unidos.
 * E é por isso que não existe filtro de país aqui: onde o BLS ou o Eurostat
 * também cobrem, `selectSeries` (em `../lookup.ts`) prefere a série de vaga em
 * aberto sozinho, por ter mais pontos e confiança maior. Duplicar essa exclusão
 * aqui seria manter duas cópias da mesma regra.
 *
 * ## `OBS_STATUS` é código, nunca posição
 *
 * O SDMX-JSON entrega os atributos da observação como ÍNDICES para as listas de
 * `structure.attributes.observation[i].values`, e essas listas contêm só os
 * valores presentes NESTA resposta. Na leitura de 01/09/2026 a lista de
 * `OBS_STATUS` tinha um único elemento, `B` — quebra de série, marcada na
 * Guatemala (2024-Q4 a 2025-Q3) e nos EUA (2025-Q4). Ler "índice 0" como "é
 * `B`" funcionaria hoje e quebraria em silêncio na primeira resposta que
 * trouxesse `P` antes de `B`. Aqui o índice é sempre resolvido para o código.
 */

import { fetchJsonWithBudget } from './fetch-with-budget'
import { iso2FromIso3 } from './iso3'
import type {
  ConnectorResult,
  FetchContext,
  LaborMarketConnector,
  LaborMarketPointInput,
} from '../types'

export const ILOSTAT_BASE = 'https://sdmx.ilo.org/rest/data'

/** Taxa de desemprego por sexo e idade, dados relatados pelos países. */
export const ILOSTAT_DATAFLOW = 'ILO,DF_UNE_DEAP_SEX_AGE_RT,1.0'

/**
 * A chave posicional: `REF_AREA.FREQ.MEASURE.SEX.AGE`.
 *
 * `REF_AREA` vazio = todos os países. `SEX_T` = ambos os sexos; `AGE_YTHADULT_YGE15`
 * = 15 anos ou mais, o recorte mais amplo publicado. Sem o recorte total, a
 * resposta viria repartida por sexo e faixa etária e o mesmo país apareceria
 * várias vezes no mesmo trimestre.
 */
export const ILOSTAT_KEY = '.Q.UNE_DEAP_RT.SEX_T.AGE_YTHADULT_YGE15'

export const ILOSTAT_DESCRIPTOR = {
  slug: 'ilostat_une',
  name: 'ILOSTAT — taxa de desemprego trimestral (global)',
  metric: 'unemployment_rate' as const,
  // Ver o cabeçalho: incondicional, e não uma média de julgamentos por país.
  confidence: 'low' as const,
  // Nulo: quem entrega pesquisa de força de trabalho no trimestre muda, e uma
  // lista fixa mentiria na primeira ausência.
  countries: null,
  accessNote:
    'Web service SDMX do ILOSTAT (sdmx.ilo.org), aberto e sem chave, sob os termos de uso de dados da OIT.',
}

/**
 * Marcações do `OBS_STATUS` que dizem que o número ainda pode mudar.
 *
 * `P` provisório · `E` estimativa · `F` previsão · `I` imputação ·
 * `M` extrapolação por modelo · `Z` estimativa não oficial.
 *
 * As três últimas não são o mesmo que as três primeiras, e a diferença importa:
 * `I`, `M` e `Z` são número calculado, não medido. Não são descartadas porque a
 * fonte as publica como parte da série e apagá-las abriria buraco de calendário
 * no meio dela — mas entram como não revisadas e o código cru fica em `note`,
 * para que quem for auditar veja de onde veio. Os códigos são os da codelist
 * `CL_OBS_STATUS` do ILOSTAT, lida na mesma verificação de 01/09/2026.
 */
export const ILOSTAT_UNSETTLED_STATUS = new Set(['P', 'E', 'F', 'I', 'M', 'Z'])

/** Quebra de série, no vocabulário do ILOSTAT. */
export const ILOSTAT_BREAK_STATUS = 'B'

interface SdmxValue {
  id?: string
  name?: string
}

interface SdmxComponent {
  id?: string
  values?: SdmxValue[]
}

interface SdmxStructure {
  dimensions?: { observation?: SdmxComponent[] }
  attributes?: { observation?: SdmxComponent[] }
}

interface SdmxDataSet {
  observations?: Record<string, (number | string | null)[]>
}

interface SdmxPayload {
  data?: { structure?: SdmxStructure; dataSets?: SdmxDataSet[] }
  errors?: unknown
  error?: unknown
}

/** `2025-Q4` → 1º de outubro de 2025 em UTC. Nulo para qualquer outro formato. */
export function periodFromIlostatTime(time: unknown): Date | null {
  if (typeof time !== 'string') return null
  const match = /^(\d{4})-?Q([1-4])$/.exec(time.trim().toUpperCase())
  if (!match) return null
  return new Date(Date.UTC(Number(match[1]), (Number(match[2]) - 1) * 3, 1))
}

/**
 * Converte o corpo da resposta em pontos.
 *
 * Devolve pontos e problemas separadamente, como os outros conectores: um país
 * cujo código o produto não conhece não deve virar exceção nem sumir calado.
 */
export function parseIlostatPayload(payload: unknown): {
  points: LaborMarketPointInput[]
  problems: string[]
} {
  const body = payload as SdmxPayload | null

  // `errors: []` VEM EM TODA RESPOSTA BEM-SUCEDIDA, e um array vazio é
  // "truthy" em JavaScript. Testar só a presença da chave rejeitaria a coleta
  // inteira do ILOSTAT em silêncio — foi o que aconteceu na primeira coleta
  // real, com a mensagem `ILOSTAT devolveu erro: []`.
  const reported = body?.errors ?? body?.error
  const hasError = Array.isArray(reported)
    ? reported.length > 0
    : reported !== null && reported !== undefined

  if (hasError) {
    return { points: [], problems: [`ILOSTAT devolveu erro: ${JSON.stringify(reported)}`] }
  }

  const dims = body?.data?.structure?.dimensions?.observation
  const dataSet = body?.data?.dataSets?.[0]
  const observations = dataSet?.observations

  if (!Array.isArray(dims) || dims.length === 0 || !observations) {
    return { points: [], problems: ['Resposta do ILOSTAT sem estrutura de observações'] }
  }

  const areaPos = dims.findIndex((d) => d?.id === 'REF_AREA')
  const timePos = dims.findIndex((d) => d?.id === 'TIME_PERIOD')
  if (areaPos < 0 || timePos < 0) {
    return { points: [], problems: ['Resposta do ILOSTAT sem as dimensões REF_AREA/TIME_PERIOD'] }
  }

  const attrs = body?.data?.structure?.attributes?.observation ?? []
  // `+1` porque a posição 0 do vetor da observação é o valor, não um atributo.
  const statusAttrPos = attrs.findIndex((a) => a?.id === 'OBS_STATUS')
  const statusValues = statusAttrPos >= 0 ? (attrs[statusAttrPos]?.values ?? []) : []

  const areaCodes = dims[areaPos]?.values ?? []
  const timeCodes = dims[timePos]?.values ?? []

  const points: LaborMarketPointInput[] = []
  const skippedAreas = new Set<string>()

  for (const [key, cell] of Object.entries(observations)) {
    if (!Array.isArray(cell)) continue

    const positions = key.split(':')
    const area = areaCodes[Number(positions[areaPos])]?.id
    const time = timeCodes[Number(positions[timePos])]?.id
    if (!area || !time) continue

    const country = iso2FromIso3(area)
    if (!country) {
      skippedAreas.add(area)
      continue
    }

    const period = periodFromIlostatTime(time)
    if (!period) continue

    // A observação ausente vem como `null` na posição do valor — e `Number(null)`
    // é `0`. Sem esta checagem, um trimestre sem pesquisa entraria na série como
    // "desemprego de 0,0%", que é um número que ninguém publicou.
    const raw = cell[0]
    if (raw === null || raw === undefined || raw === '') continue
    const value = Number(raw)
    if (!Number.isFinite(value)) continue

    const statusIndex = statusAttrPos >= 0 ? cell[statusAttrPos + 1] : null
    const status =
      typeof statusIndex === 'number' ? (statusValues[statusIndex]?.id ?? null) : null

    points.push({
      country,
      source: ILOSTAT_DESCRIPTOR.slug,
      metric: ILOSTAT_DESCRIPTOR.metric,
      value,
      unit: 'percent',
      period,
      periodType: 'quarter',
      revised: !(status !== null && ILOSTAT_UNSETTLED_STATUS.has(status)),
      seriesBreak: status === ILOSTAT_BREAK_STATUS,
      // Incondicional. Ver o cabeçalho.
      confidence: ILOSTAT_DESCRIPTOR.confidence,
      note: status,
    })
  }

  const problems: string[] = []
  if (skippedAreas.size > 0) {
    problems.push(`Códigos de país desconhecidos ignorados: ${[...skippedAreas].sort().join(', ')}`)
  }

  return { points, problems }
}

export interface IlostatOptions {
  /** Quantos trimestres para trás. Padrão 24 (6 anos), igual ao Eurostat. */
  lastPeriods?: number
  /** Injetado nos testes. */
  fetchImpl?: typeof fetch
  /** Injetado nos testes, para a janela ser determinística. */
  now?: () => Date
}

/**
 * `startPeriod` a partir de quantos trimestres se quer para trás.
 *
 * O ILOSTAT não tem o `lastTimePeriod` do Eurostat: a janela se declara por data
 * inicial, e por isso ela é calculada aqui a partir do trimestre corrente.
 */
export function startPeriodFor(now: Date, lastPeriods: number): string {
  const quarterIndex = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3)
  const start = quarterIndex - (lastPeriods - 1)
  const year = Math.floor(start / 4)
  const quarter = (start % 4) + 1
  return `${year}-Q${quarter}`
}

export function createIlostatConnector(options: IlostatOptions = {}): LaborMarketConnector {
  const doFetch = options.fetchImpl ?? fetch
  const now = options.now ?? (() => new Date())
  const lastPeriods = Math.max(6, Math.min(options.lastPeriods ?? 24, 100))

  return {
    descriptor: ILOSTAT_DESCRIPTOR,

    async fetchPoints(context: FetchContext): Promise<ConnectorResult> {
      const url =
        `${ILOSTAT_BASE}/${ILOSTAT_DATAFLOW}/${ILOSTAT_KEY}` +
        `?startPeriod=${startPeriodFor(now(), lastPeriods)}` +
        // Sem isto o SDMX devolve as observações aninhadas por série e a chave
        // deixa de conter o trimestre, que é justamente o que se precisa ler.
        `&dimensionAtObservation=AllDimensions`

      const fetched = await fetchJsonWithBudget(url, {
        timeBudgetMs: context.timeBudgetMs,
        sourceName: 'ILOSTAT',
        fetchImpl: doFetch,
        init: {
          headers: {
            // Sem `Accept` explícito o web service devolve SDMX-ML (XML), não JSON.
            Accept: 'application/vnd.sdmx.data+json;version=1.0',
            // `Accept-Language` NÃO é zelo. Ver o cabeçalho: sem ele o serviço
            // responde HTTP 500 com o corpo `languageTag1`.
            'Accept-Language': 'en',
          },
        },
      })

      if (!fetched.ok) {
        return { outcome: 'failed', points: [], error: fetched.error }
      }

      const { points, problems } = parseIlostatPayload(fetched.json)

      if (points.length === 0) {
        return {
          outcome: 'failed',
          points: [],
          error: problems.join('; ') || 'ILOSTAT respondeu sem nenhum ponto aproveitável',
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
