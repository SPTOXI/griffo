/**
 * Da tabela para a tela: escolher a série de um país e classificá-la.
 *
 * ## Por que este arquivo não fala com o banco
 *
 * `lib/db` carrega `server-only`, um pacote cujo `index.js` é um `throw` fora
 * do pipeline de build do Next — qualquer teste rodado por `tsx` que o importe
 * morre no import. A mesma separação que já existe entre `phase.ts` (puro) e
 * `scripts/fetch-hiring-index.ts` (com Prisma) vale aqui: a decisão de qual
 * série vale e o que a tela recebe mora AQUI, testável; a consulta mora em
 * `lookup.server.ts`, que é uma linha de Prisma e nada mais.
 *
 * ## Por que existe escolha de série, se hoje cada país só tem uma
 *
 * Hoje sim: os EUA vêm do BLS e os 29 países da UE/EEE vêm do Eurostat, um
 * `source` e um `metric` cada. Mas o esquema aceita mais de um por país desde a
 * fase 1 (a chave única é `country + source + metric + period`), e a fase 3
 * traz ILOSTAT e CEPALSTAT, que cobrem países já cobertos aqui com OUTRA
 * métrica. Uma consulta que assumisse "uma linha por país" passaria a emendar
 * duas medições diferentes na mesma série no dia em que a terceira fonte
 * entrasse — exatamente o degrau artificial que `types.ts` proíbe.
 *
 * A escolha é: mais pontos ganha; empate desempata por confiança (`high` antes
 * de `low`, porque taxa de vaga em aberto pesquisada com empregador não é a
 * mesma coisa que taxa de desemprego modelada) e depois pelo período mais
 * recente. Determinística, para que a mesma tabela produza sempre a mesma tela.
 *
 * ## O que este módulo nunca faz
 *
 * Não inventa fase, não esconde país sem cobertura e não omite a fonte. Os três
 * desfechos — classificado, coberto mas sem histórico bastante, e não coberto —
 * saem distintos daqui porque a tela precisa dizer os três com todas as letras.
 */

import { classifyHiringPhase, type HiringPhase, type HiringSeriesPoint, type InsufficientDataReason } from './phase'
import type { ConfidenceTier } from './types'

/**
 * Uma linha de `LaborMarketPoint` como o Prisma a devolve.
 *
 * Declarada à mão, e não importada de `@prisma/client`, para que este módulo
 * continue sem dependência de banco — é o que permite testá-lo com objetos
 * literais.
 */
export interface LaborMarketRow {
  country: string
  source: string
  metric: string
  value: number
  unit: string
  period: Date
  periodType: string
  revised: boolean
  seriesBreak: boolean
  confidence: string
  note: string | null
}

/**
 * Nome próprio da instituição, para a tela.
 *
 * NÃO passa pelo dicionário de i18n de propósito: "Eurostat" é "Eurostat" em
 * qualquer idioma, e traduzir nome de órgão de estatística inventaria uma
 * entidade que não existe. O rótulo que envolve o nome (`Fonte: {source}`) é
 * que é traduzido.
 *
 * `descriptor.name` dos conectores não serve aqui: ele descreve a série para
 * quem lê o código ("Eurostat — taxa de postos vagos (UE/EEE)") e está em
 * português.
 */
export const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  bls_jolts: 'U.S. Bureau of Labor Statistics (JOLTS)',
  eurostat_jvs: 'Eurostat',
  ilostat_une: 'ILOSTAT (International Labour Organization)',
  // Em espanhol porque é assim que a instituição se chama. "Comissão Econômica
  // para a América Latina" não é o nome dela traduzido: é um nome que não
  // existe em documento nenhum.
  cepalstat_une: 'CEPALSTAT (Comisión Económica para América Latina y el Caribe)',
}

/**
 * O nome da fonte para exibição. Sem correspondência, devolve o próprio
 * identificador — mostrar `ilostat_x` é feio, esconder a origem é pior.
 */
export function sourceDisplayName(source: string): string {
  return SOURCE_DISPLAY_NAMES[source] ?? source
}

/** O que a rota devolve e o componente consome. Fases em enum, nunca texto. */
export interface HiringIndexSummary {
  /** ISO2 já normalizado em maiúsculas. */
  country: string
  /**
   * Existe pelo menos uma linha deste país na tabela.
   *
   * `false` é um estado normal e frequente: o índice cobre 30 países hoje e o
   * mundo tem quase 200. Separado de `phase: null` porque as duas frases que a
   * tela precisa dizer são diferentes — "ainda não há histórico suficiente" e
   * "nenhuma fonte oficial cobre este país".
   */
  covered: boolean
  source: string | null
  sourceName: string | null
  metric: string | null
  phase: HiringPhase | null
  insufficientDataReason: InsufficientDataReason | null
  /** Período mais recente da série escolhida, em ISO. Formatado na tela. */
  latestPeriod: string | null
  /** `month` | `quarter`. */
  periodType: string | null
  latestIsPreliminary: boolean
  confidence: ConfidenceTier
  pointsUsed: number
}

/** ISO2 em maiúsculas, ou `null` quando não é um código de país plausível. */
export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

/**
 * Agrupa por `source|metric` e devolve a série que deve ser exibida.
 *
 * `null` quando não há linha nenhuma. Ver o cabeçalho para o critério.
 */
export function selectSeries(rows: readonly LaborMarketRow[]): LaborMarketRow[] | null {
  if (rows.length === 0) return null

  const groups = new Map<string, LaborMarketRow[]>()
  for (const row of rows) {
    const key = `${row.source}|${row.metric}`
    const list = groups.get(key)
    if (list) list.push(row)
    else groups.set(key, [row])
  }

  let best: LaborMarketRow[] | null = null
  let bestKey = ''

  for (const [key, series] of groups) {
    if (best === null) {
      best = series
      bestKey = key
      continue
    }

    if (series.length !== best.length) {
      if (series.length > best.length) {
        best = series
        bestKey = key
      }
      continue
    }

    const seriesHigh = series.every((r) => r.confidence !== 'low')
    const bestHigh = best.every((r) => r.confidence !== 'low')
    if (seriesHigh !== bestHigh) {
      if (seriesHigh) {
        best = series
        bestKey = key
      }
      continue
    }

    const latestOf = (list: readonly LaborMarketRow[]) =>
      Math.max(...list.map((r) => r.period.getTime()))
    const seriesLatest = latestOf(series)
    const bestLatest = latestOf(best)
    if (seriesLatest !== bestLatest) {
      if (seriesLatest > bestLatest) {
        best = series
        bestKey = key
      }
      continue
    }

    // Empate completo: o identificador desempata, só para que a saída seja
    // estável entre execuções. Não há critério melhor a inventar aqui.
    if (key.localeCompare(bestKey) < 0) {
      best = series
      bestKey = key
    }
  }

  return best
}

/** Uma linha do banco no formato que `classifyHiringPhase` entende. */
export function toSeriesPoint(row: LaborMarketRow): HiringSeriesPoint {
  return {
    period: row.period,
    value: row.value,
    revised: row.revised,
    seriesBreak: row.seriesBreak,
    confidence: row.confidence === 'low' ? 'low' : 'high',
  }
}

/**
 * O resumo para a tela, a partir das linhas cruas de um país.
 *
 * País sem linha nenhuma NÃO é erro e não vira exceção: sai
 * `covered: false`, e a tela diz isso.
 */
export function summarizeHiringIndex(country: string, rows: readonly LaborMarketRow[]): HiringIndexSummary {
  const code = normalizeCountryCode(country) ?? country.toUpperCase()
  const series = selectSeries(rows)

  if (!series) {
    return {
      country: code,
      covered: false,
      source: null,
      sourceName: null,
      metric: null,
      phase: null,
      insufficientDataReason: null,
      latestPeriod: null,
      periodType: null,
      latestIsPreliminary: false,
      confidence: 'high',
      pointsUsed: 0,
    }
  }

  const analysis = classifyHiringPhase(series.map(toSeriesPoint))
  const latest = series.reduce((a, b) => (a.period.getTime() >= b.period.getTime() ? a : b))

  return {
    country: code,
    covered: true,
    source: latest.source,
    sourceName: sourceDisplayName(latest.source),
    metric: latest.metric,
    phase: analysis.phase,
    insufficientDataReason: analysis.insufficientDataReason,
    latestPeriod: latest.period.toISOString(),
    periodType: latest.periodType,
    latestIsPreliminary: analysis.latestIsPreliminary,
    confidence: analysis.confidence,
    pointsUsed: analysis.pointsUsed,
  }
}
