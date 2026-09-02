/**
 * Conector do BLS JOLTS — taxa de vagas em aberto dos Estados Unidos.
 *
 * ## Verificado contra a API real
 *
 * Em 01/09/2026, por `POST` em
 * `https://api.bls.gov/publicAPI/v2/timeseries/data/` com o corpo
 * `{"seriesid":["JTS000000000000000JOR"],"startyear":"2025","endyear":"2026"}`.
 * A resposta trouxe `2026 M07 = 4.4` com `footnotes: [{"code":"P","text":
 * "preliminary"}]` e os meses anteriores sem nota — foi essa observação, e não
 * a documentação, que definiu como `revised` é preenchido aqui.
 *
 * ## A série
 *
 * `JTS000000000000000JOR` = todas as áreas, vagas em aberto, total não
 * agrícola, **taxa**, com ajuste sazonal, todas as faixas de tamanho, EUA.
 * A taxa, e não o nível absoluto, porque é ela que se compara com a própria
 * história sem depender do tamanho da força de trabalho.
 *
 * ## Por que a chave é opcional
 *
 * A v2 responde sem `registrationkey`, com teto de 25 consultas por dia e 10
 * anos por consulta. Com chave (gratuita, em bls.gov/developers), sobe para
 * 500 por dia e 20 anos. Uma busca por dia cabe folgado no teto sem chave — a
 * chave existe para não depender disso.
 *
 * ## O JOLTS não é um número, é um número que muda
 *
 * A taxa de resposta da pesquisa caiu de 58% (2019) para ~30-32% (2023 em
 * diante), e a revisão entre a primeira e a segunda divulgação passou a valer
 * ~180 mil vagas em média, aproximadamente o dobro da norma histórica. A
 * impressão do mês recém-divulgado é a menos confiável da série inteira.
 *
 * Este conector não esconde nem conserta isso: marca o ponto como preliminar
 * (`revised: false`) e devolve. Quem lê a série usa média móvel de 3 períodos
 * — ver `../phase.ts` — e é a média móvel, nunca a impressão crua, que vira
 * sinal de produto.
 *
 * ## HTTP 200 não quer dizer que deu certo
 *
 * O BLS responde 200 mesmo quando não processou o pedido. Quem manda é o campo
 * `status` do corpo. E uma série que volta com `data: []` — o que acontece com
 * `seriesid` inválido, com a mensagem `Invalid Series for Series X` — é FALHA
 * de coleta, não "os EUA não têm vagas". Ler resposta vazia como mercado vazio
 * é o defeito que a Adzuna já ensinou aqui (§ do adapter dela).
 */

import type {
  ConnectorResult,
  FetchContext,
  LaborMarketConnector,
  LaborMarketPointInput,
} from '../types'

export const BLS_ENDPOINT = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

/** Todas as áreas · vagas em aberto · total não agrícola · TAXA · ajuste sazonal · EUA. */
export const JOLTS_OPENINGS_RATE_SERIES = 'JTS000000000000000JOR'

export const BLS_JOLTS_DESCRIPTOR = {
  slug: 'bls_jolts',
  name: 'BLS JOLTS (Estados Unidos)',
  metric: 'job_openings_rate' as const,
  // Pesquisa direta com empregadores sobre vagas em aberto. Mesmo com a queda
  // de resposta, mede a grandeza certa — o que a taxa de desemprego modelada
  // de outras regiões não faz.
  confidence: 'high' as const,
  countries: ['US'],
  accessNote:
    'API pública v2 do Bureau of Labor Statistics. Sem chave: 25 consultas/dia, 10 anos por consulta. Com registrationkey gratuita: 500/dia, 20 anos.',
}

interface BlsFootnote {
  code?: string
  text?: string
}

interface BlsDataPoint {
  year?: string
  period?: string
  periodName?: string
  latest?: string
  value?: string
  footnotes?: BlsFootnote[]
}

interface BlsSeries {
  seriesID?: string
  data?: BlsDataPoint[]
}

interface BlsPayload {
  status?: string
  message?: string[]
  Results?: { series?: BlsSeries[] }
}

/**
 * `M07` → 7. Devolve `null` para o que não é mês de calendário.
 *
 * `M13` é a MÉDIA ANUAL, e o BLS a entrega no meio da lista mensal como se
 * fosse mais um período. Deixá-la entrar poria um ponto anual dentro de uma
 * série mensal, e a média móvel de 3 períodos passaria a somar um ano inteiro
 * com dois meses.
 */
export function monthFromBlsPeriod(period: unknown): number | null {
  if (typeof period !== 'string') return null
  const match = /^M(\d{2})$/.exec(period.trim())
  if (!match) return null
  const month = Number(match[1])
  return month >= 1 && month <= 12 ? month : null
}

/**
 * O ponto é preliminar?
 *
 * O BLS marca com a nota de rodapé de código `P`. Ausência da nota significa
 * que o valor já passou por pelo menos uma revisão — que é o que `revised`
 * quer dizer aqui, e não "revisado nesta divulgação".
 */
export function isPreliminary(footnotes: unknown): boolean {
  if (!Array.isArray(footnotes)) return false
  return footnotes.some((f) => typeof f?.code === 'string' && f.code.trim().toUpperCase() === 'P')
}

/** As notas de rodapé reais, juntas, para guardar o rastro. Nulo quando não há. */
function noteFrom(footnotes: unknown): string | null {
  if (!Array.isArray(footnotes)) return null
  const codes = footnotes
    .map((f) => (typeof f?.code === 'string' ? f.code.trim() : ''))
    .filter((c) => c.length > 0)
  return codes.length > 0 ? codes.join(',') : null
}

/**
 * Converte o corpo da resposta em pontos.
 *
 * Devolve os pontos e os problemas encontrados separadamente: um `seriesid`
 * inválido não deve virar exceção nem lista vazia silenciosa — quem chama
 * decide se aquilo é `partial` ou `failed`.
 */
export function parseBlsPayload(payload: unknown): {
  points: LaborMarketPointInput[]
  problems: string[]
} {
  const body = payload as BlsPayload | null
  const problems: string[] = []

  const status = typeof body?.status === 'string' ? body.status : ''
  if (status !== 'REQUEST_SUCCEEDED') {
    const message = Array.isArray(body?.message) ? body!.message!.join('; ') : ''
    return {
      points: [],
      problems: [`BLS não processou o pedido (status "${status || 'ausente'}")${message ? `: ${message}` : ''}`],
    }
  }

  const series = body?.Results?.series
  if (!Array.isArray(series)) {
    return { points: [], problems: ['Resposta do BLS sem Results.series'] }
  }

  const points: LaborMarketPointInput[] = []

  for (const s of series) {
    const id = typeof s?.seriesID === 'string' ? s.seriesID : '(sem id)'
    const data = Array.isArray(s?.data) ? s.data : []

    if (data.length === 0) {
      // Série pedida que voltou sem nenhum dado. Ver o cabeçalho: isto é falha,
      // não ausência de contratação.
      problems.push(`Série ${id} voltou sem nenhum ponto`)
      continue
    }

    let accepted = 0

    for (const item of data) {
      const month = monthFromBlsPeriod(item?.period)
      if (month === null) continue

      const year = Number(item?.year)
      if (!Number.isInteger(year) || year < 1900) continue

      // `value` vem como TEXTO, e `"-"` ou vazio aparecem em série suprimida.
      //
      // O `trim()` e a checagem de string vazia não são zelo: `Number('')` é
      // `0`, e `0` é finito. Sem eles, um mês sem valor entraria na série como
      // "taxa de vagas em aberto de 0,0%" — um número que ninguém publicou.
      const raw = typeof item?.value === 'string' ? item.value.trim() : item?.value
      if (raw === '' || raw === null || raw === undefined) continue
      const value = Number(raw)
      if (!Number.isFinite(value)) continue

      points.push({
        country: 'US',
        source: BLS_JOLTS_DESCRIPTOR.slug,
        metric: BLS_JOLTS_DESCRIPTOR.metric,
        value,
        unit: 'percent',
        period: new Date(Date.UTC(year, month - 1, 1)),
        periodType: 'month',
        revised: !isPreliminary(item?.footnotes),
        // O BLS não expõe quebra de série na API: o reprocessamento anual do
        // ajuste sazonal reescreve a série inteira no lugar, em vez de marcar
        // um ponto de corte. Sempre `false`, e não um palpite.
        seriesBreak: false,
        confidence: BLS_JOLTS_DESCRIPTOR.confidence,
        note: noteFrom(item?.footnotes),
      })
      accepted++
    }

    if (accepted === 0 && data.length > 0) {
      problems.push(`Série ${id} voltou com ${data.length} registro(s), nenhum aproveitável`)
    }
  }

  return { points, problems }
}

export interface BlsJoltsOptions {
  /** Chave de registro do BLS. Opcional — ver o cabeçalho. */
  registrationKey?: string | null
  /** Quantos anos para trás buscar. Padrão 5: sobra para média móvel e para ver a curva. */
  years?: number
  /** Injetado nos testes. */
  fetchImpl?: typeof fetch
  /** Injetado nos testes, para a janela de anos ser determinística. */
  now?: () => Date
}

export function createBlsJoltsConnector(options: BlsJoltsOptions = {}): LaborMarketConnector {
  const doFetch = options.fetchImpl ?? fetch
  const now = options.now ?? (() => new Date())
  // O teto sem chave é 10 anos; com chave, 20. 5 é o que a classificação de
  // fase usa de fato, e pedir mais só engorda a resposta.
  const years = Math.max(1, Math.min(options.years ?? 5, 10))

  return {
    descriptor: BLS_JOLTS_DESCRIPTOR,

    async fetchPoints(context: FetchContext): Promise<ConnectorResult> {
      const endYear = now().getUTCFullYear()
      const startYear = endYear - (years - 1)

      const body: Record<string, unknown> = {
        seriesid: [JOLTS_OPENINGS_RATE_SERIES],
        startyear: String(startYear),
        endyear: String(endYear),
      }
      const key = options.registrationKey?.trim()
      if (key) body.registrationkey = key

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.max(1000, context.timeBudgetMs))

      try {
        const response = await doFetch(BLS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!response.ok) {
          return { outcome: 'failed', points: [], error: `HTTP ${response.status} no BLS` }
        }

        const { points, problems } = parseBlsPayload(await response.json())

        if (points.length === 0) {
          return {
            outcome: 'failed',
            points: [],
            error: problems.join('; ') || 'BLS respondeu sem nenhum ponto aproveitável',
          }
        }

        return {
          outcome: problems.length > 0 ? 'partial' : 'complete',
          points,
          error: problems.length > 0 ? problems.join('; ') : null,
        }
      } catch (e: any) {
        return {
          outcome: 'failed',
          points: [],
          error: e?.name === 'AbortError' ? 'Tempo esgotado no BLS' : e?.message || String(e),
        }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
