/**
 * A coleta do índice de temperatura de contratação, num lugar só.
 *
 * ## Por que este arquivo existe
 *
 * Na fase 1 a coleta morava dentro de `scripts/fetch-hiring-index.ts`. Na fase
 * 2 ela passou a ter dois gatilhos — o script manual e o cron — e duplicar o
 * laço de conectores e o `upsert` em dois arquivos garantiria que um dia eles
 * divergissem: o `upsert` do cron esqueceria um campo que o script grava, e o
 * defeito só apareceria meses depois, num país só.
 *
 * ## Por que o cliente de banco chega por parâmetro
 *
 * Porque os dois gatilhos usam clientes diferentes, e por um motivo real: o
 * script instancia um `PrismaClient` próprio (`lib/db` carrega `server-only`,
 * cujo `index.js` é um `throw` — num processo de linha de comando ele mata o
 * processo no import), e a rota usa o `db` compartilhado. Recebendo o cliente,
 * este módulo não importa nenhum dos dois e continua rodando sob `tsx --test`
 * com um cliente falso.
 *
 * ## O que NÃO mudou da fase 1
 *
 * Fonte que falhou não grava nada dela. Uma resposta vazia não é um mercado
 * vazio — é falha de coleta —, e meia série gravada é pior que nenhuma: a média
 * móvel leria o buraco como movimento. A regra veio do incidente da Adzuna (200
 * com `exception` lido como "nenhuma vaga") e continua valendo linha por linha.
 */

import { createBlsJoltsConnector } from './connectors/bls-jolts'
import { createCepalstatConnector } from './connectors/cepalstat'
import { createEurostatConnector } from './connectors/eurostat'
import { createIlostatConnector } from './connectors/ilostat'
import { classifyHiringPhase } from './phase'
import type { HiringPhase, InsufficientDataReason } from './phase'
import type { ConfidenceTier, LaborMarketConnector, LaborMarketPointInput } from './types'

/** Teto por fonte. Nenhuma das duas APIs chega perto disso em condição normal. */
export const DEFAULT_TIME_BUDGET_MS = 30_000

export interface CollectOptions {
  /** Chave de registro do BLS. Sem ela a API pública ainda responde, com cota menor. */
  blsApiKey?: string | null
  /** Teto de tempo POR fonte, em ms. */
  timeBudgetMs?: number
  /**
   * Conectores a usar. Só existe para o teste injetar dublês — em produção os
   * dois reais são montados aqui, e não na lista de quem chama, para que o
   * script e o cron coletem exatamente as mesmas fontes.
   */
  connectors?: LaborMarketConnector[]
}

/** O desfecho de UMA fonte, para log e para a resposta do cron. */
export interface SourceOutcome {
  slug: string
  outcome: 'complete' | 'partial' | 'failed'
  /** Quantos pontos a fonte devolveu (mesmo quando descartados por falha). */
  points: number
  error: string | null
  elapsedMs: number
}

export interface CollectionResult {
  sources: SourceOutcome[]
  /** Só os pontos aproveitáveis: fonte `failed` não contribui com nenhum. */
  points: LaborMarketPointInput[]
}

/**
 * As quatro fontes reais.
 *
 * Duas de vaga em aberto e confiança `high` (BLS, Eurostat) e duas de taxa de
 * desemprego e confiança `low` (ILOSTAT, CEPALSTAT). A ordem aqui é só a de
 * chegada das fases — não é prioridade, e nenhum país é ordenado primeiro.
 *
 * NÃO existe aqui, nem dentro dos conectores, filtro para evitar que ILOSTAT e
 * CEPALSTAT tragam países que o BLS ou o Eurostat já cobrem. É de propósito:
 * `selectSeries`, em `./lookup.ts`, já escolhe a série de mais pontos e maior
 * confiança por país. Escrever a exclusão também aqui seria manter duas cópias
 * da mesma regra, e um dia elas discordariam.
 */
export function defaultConnectors(blsApiKey: string | null | undefined): LaborMarketConnector[] {
  return [
    createBlsJoltsConnector({ registrationKey: blsApiKey ?? null }),
    createEurostatConnector(),
    createIlostatConnector(),
    createCepalstatConnector(),
  ]
}

/**
 * Busca as séries oficiais. Não toca no banco.
 *
 * As fontes são buscadas em PARALELO, não em sequência: BLS e Eurostat são
 * chamadas de rede independentes, cada uma com o próprio teto de tempo — em
 * sequência, o pior caso soma os dois tetos (~60s); em paralelo, o pior caso é
 * o maior dos dois (~30s). `Promise.all` preserva a ordem de `connectors` na
 * saída independente de qual responde primeiro, então `sources`/`points`
 * saem determinísticos como antes.
 */
export async function collectHiringIndexPoints(options: CollectOptions = {}): Promise<CollectionResult> {
  const timeBudgetMs = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS
  const connectors = options.connectors ?? defaultConnectors(options.blsApiKey)

  const outcomes = await Promise.all(
    connectors.map(async (connector) => {
      const startedAt = Date.now()
      try {
        const result = await connector.fetchPoints({ timeBudgetMs })
        return {
          source: {
            slug: connector.descriptor.slug,
            outcome: result.outcome,
            points: result.points.length,
            error: result.error,
            elapsedMs: Date.now() - startedAt,
          } satisfies SourceOutcome,
          points: result.outcome === 'failed' ? [] : result.points,
        }
      } catch (e: any) {
        // Um conector que lança em vez de devolver `failed` não pode derrubar a
        // coleta das outras fontes: o Eurostat cobre 29 países, e perdê-los
        // porque o BLS mudou de formato seria um estrago desproporcional.
        return {
          source: {
            slug: connector.descriptor.slug,
            outcome: 'failed',
            points: 0,
            error: e?.message || String(e),
            elapsedMs: Date.now() - startedAt,
          } satisfies SourceOutcome,
          points: [] as LaborMarketPointInput[],
        }
      }
    })
  )

  return {
    sources: outcomes.map((o) => o.source),
    points: outcomes.flatMap((o) => o.points),
  }
}

/**
 * O mínimo do cliente Prisma que a gravação usa.
 *
 * Declarado à mão para que este módulo não importe `@prisma/client` nem
 * `lib/db` — é o que o mantém importável por um teste.
 */
export interface LaborMarketPointWriter {
  laborMarketPoint: {
    upsert(args: unknown): Promise<unknown>
  }
}

/**
 * Quantos `upsert` viajam ao mesmo tempo.
 *
 * Existe por causa de um número medido, não por gosto: a coleta inteira leva
 * ~2s, mas gravar as 729 linhas uma a uma levou **35s** contra o banco de
 * produção — praticamente tudo ida-e-volta de rede. Sob o teto de 60s da
 * função da Vercel isso é margem curta demais para uma tabela que só cresce
 * (cada divulgação mensal acrescenta uma linha por país).
 *
 * Oito, e não "o máximo possível": o `upsert` divide o mesmo pool de conexões
 * com as requisições de usuário, e um cron noturno não deve poder segurar a
 * tela de ninguém. Oito derruba o tempo em quase uma ordem de grandeza e ainda
 * deixa o pool com folga.
 */
const WRITE_CONCURRENCY = 8

/**
 * Grava os pontos. Idempotente por construção.
 *
 * `upsert` na chave `(country, source, metric, period)`: rodar duas vezes no
 * mesmo dia não duplica nada, e a segunda leitura de um mês que o JOLTS revisou
 * substitui a primeira — que é exatamente o comportamento desejado.
 *
 * `fetchedAt` é reescrito de propósito no `update`: o que interessa é quando o
 * número foi lido pela última vez, não quando foi visto pela primeira.
 *
 * A ordem de gravação não importa e nenhum ponto depende de outro — cada linha
 * é independente pela própria chave —, o que é o que torna o paralelismo acima
 * seguro aqui e não o tornaria em qualquer escrita.
 */
export async function persistHiringIndexPoints(
  client: LaborMarketPointWriter,
  points: readonly LaborMarketPointInput[]
): Promise<number> {
  let written = 0

  for (let i = 0; i < points.length; i += WRITE_CONCURRENCY) {
    const batch = points.slice(i, i + WRITE_CONCURRENCY)
    await Promise.all(
      batch.map((point) =>
        client.laborMarketPoint.upsert({
          where: {
            country_source_metric_period: {
              country: point.country,
              source: point.source,
              metric: point.metric,
              period: point.period,
            },
          },
          create: { ...point, fetchedAt: new Date() },
          update: {
            value: point.value,
            unit: point.unit,
            periodType: point.periodType,
            revised: point.revised,
            seriesBreak: point.seriesBreak,
            confidence: point.confidence,
            note: point.note,
            fetchedAt: new Date(),
          },
        })
      )
    )
    written += batch.length
  }

  return written
}

/** Uma série de país classificada, para o log do script e a resposta do cron. */
export interface SeriesSummary {
  country: string
  source: string
  metric: string
  phase: HiringPhase | null
  insufficientDataReason: InsufficientDataReason | null
  pointsUsed: number
  confidence: ConfidenceTier
  latest: number | null
  latestIsPreliminary: boolean
}

/**
 * Classifica cada série coletada, um país por vez.
 *
 * Agrupado por `country|source|metric`, e NUNCA por país só: emendar a taxa do
 * JOLTS com a do Eurostat criaria um degrau artificial que a classificação
 * leria como virada de mercado (ver o cabeçalho de `types.ts`). Nada aqui
 * compara um país com outro — não há ranking, e não deve haver.
 */
export function summarizeCollection(points: readonly LaborMarketPointInput[]): SeriesSummary[] {
  const groups = new Map<string, LaborMarketPointInput[]>()

  for (const point of points) {
    const key = `${point.country}|${point.source}|${point.metric}`
    const list = groups.get(key)
    if (list) list.push(point)
    else groups.set(key, [point])
  }

  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, series]) => {
      const [country, source, metric] = key.split('|')
      const analysis = classifyHiringPhase(series)
      return {
        country,
        source,
        metric,
        phase: analysis.phase,
        insufficientDataReason: analysis.insufficientDataReason,
        pointsUsed: analysis.pointsUsed,
        confidence: analysis.confidence,
        latest: analysis.latest,
        latestIsPreliminary: analysis.latestIsPreliminary,
      }
    })
}
