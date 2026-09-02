/**
 * Em que ponto da própria curva este mercado está.
 *
 * ## A ideia, e o que ela não é
 *
 * A inspiração é a curva de J da economia: um indicador cai depois de um
 * choque, encontra o fundo, sobe, e por fim passa de onde estava. A adaptação
 * é que **não há um choque comum**. Cada país tem a curva dele, e a fase sai
 * do próprio histórico daquele país — nunca de comparação com outro.
 *
 * Isso não é preciosismo metodológico, é a única leitura defensável. Os
 * institutos de estatística europeus medem a mesma taxa com amostras que vão
 * de 2.500 a 75.000 empresas e taxas de resposta de 11,4% a 98,8%; o próprio
 * Eurostat não publica um total da UE por causa disso. Dizer "a Alemanha está
 * mais quente que a Espanha" seria comparar dois instrumentos diferentes.
 * Dizer "a Alemanha está mais quente do que estava há um ano" compara o
 * instrumento com ele mesmo, que é o que ele consegue fazer.
 *
 * ## Por que média móvel de 3 períodos, e não o número do mês
 *
 * Porque o número do mês costuma mudar. A taxa de resposta do JOLTS caiu de
 * 58% (2019) para ~30% e a revisão da segunda divulgação vale hoje ~180 mil
 * vagas em média — cerca do dobro da norma histórica. Uma tela que reagisse à
 * primeira impressão diria "o mercado virou" e se desdiria no mês seguinte.
 *
 * A média móvel entra como **regra do módulo**, não como opção de quem chama:
 * não há caminho aqui que classifique fase a partir do valor cru.
 *
 * ## Por que existe `stable`, se a curva de J tem quatro trechos
 *
 * Porque uma série genuinamente parada, num nível normal, não é nenhum dos
 * quatro. Encaixá-la à força em "recuperando" ou "no fundo" seria inventar um
 * movimento que o dado não mostra — e inventar é justamente o que este produto
 * não faz. `stable` é a resposta honesta para "não está indo a lugar nenhum".
 *
 * ## Por que existe `null`, se dá para calcular alguma coisa com 3 pontos
 *
 * Dá para calcular. Não dá para *saber*. Com menos de seis períodos não há
 * média móvel suficiente para separar tendência de oscilação, e a saída certa
 * é dizer que não se sabe — o mesmo princípio de `lib/market/countries.ts`,
 * que prefere dizer "não existe convenção de currículo para este país" a
 * fingir cobertura.
 */

import type { ConfidenceTier } from './types'

/**
 * Onde o mercado está na própria curva.
 *
 * Identificadores em inglês porque são chave interna, persistida e comparada
 * em código. O RÓTULO que o usuário lê é outra coisa, vem do dicionário de
 * i18n em todos os idiomas, e não existe ainda (fase 2).
 */
export type HiringPhase =
  /** Média móvel caindo. */
  | 'cooling'
  /** Parou de cair, e parou perto do fundo da própria série. */
  | 'bottoming_out'
  /** Subindo, mas ainda abaixo do normal do próprio país. */
  | 'recovering'
  /** Subindo e já acima do normal do próprio país. */
  | 'heating_up'
  /** Sem movimento relevante, e não no fundo. */
  | 'stable'

/** Por que não deu para classificar. Nunca é um palpite disfarçado. */
export type InsufficientDataReason =
  /** Nenhum ponto utilizável chegou. */
  | 'no_points'
  /** Menos períodos do que o mínimo. */
  | 'too_few_points'
  /** A série tem quebra recente e sobrou pouco depois dela. */
  | 'series_break_too_recent'

/** Um ponto da série de UM país, para UMA métrica de UMA fonte. */
export interface HiringSeriesPoint {
  /** Início do período coberto. Aceita `Date` ou algo que `Date` entenda. */
  period: Date | string | number
  value: number
  /** `false` = impressão preliminar. Ausente = desconhecido, tratado como revisado. */
  revised?: boolean
  /** A fonte declarou quebra de série neste período. */
  seriesBreak?: boolean
  confidence?: ConfidenceTier
}

export interface MovingAveragePoint {
  /** O período do ÚLTIMO ponto da janela — a média descreve "até aqui". */
  period: Date
  value: number
  /**
   * Algum ponto da janela ainda é preliminar.
   *
   * Serve para a tela poder dizer que aquele trecho pode mudar, em vez de
   * apresentar tudo com a mesma firmeza.
   */
  windowHasPreliminary: boolean
}

export interface PhaseAnalysis {
  /** `null` quando não deu para classificar. Nunca um chute. */
  phase: HiringPhase | null
  /** Preenchido exatamente quando `phase` é `null`. */
  insufficientDataReason: InsufficientDataReason | null
  /** A série suavizada, na ordem cronológica. Vazia quando não houve pontos. */
  movingAverage: MovingAveragePoint[]
  /** Último valor da média móvel. */
  latest: number | null
  /** O normal do próprio país: mediana da média móvel. Ver `referenceLevel` abaixo. */
  reference: number | null
  /** Menor valor da média móvel na janela observada. */
  trough: number | null
  /**
   * Inclinação recente, em fração do nível por período.
   *
   * Relativa, e não em pontos percentuais, porque 0,1 p.p. sobre uma taxa de
   * 0,8% (Polônia) e sobre 4,4% (EUA) não são o mesmo acontecimento.
   */
  slope: number | null
  /** Quantos pontos crus sobreviveram à limpeza e entraram na conta. */
  pointsUsed: number
  minimumPoints: number
  /** O pior nível de confiança presente na série. Vale para a análise inteira. */
  confidence: ConfidenceTier
  /** Algum ponto da janela final ainda é preliminar. */
  latestIsPreliminary: boolean
}

export interface PhaseOptions {
  /** Tamanho da janela da média móvel. Ver o cabeçalho: 3, e por um motivo. */
  window?: number
  /** Mínimo de pontos crus para arriscar uma classificação. */
  minimumPoints?: number
  /**
   * Abaixo disto, em módulo, a inclinação é considerada nula.
   *
   * 0,015 = 1,5% do nível por período. O valor foi calibrado contra dois casos
   * concretos, não escolhido por ser redondo: uma série que oscila ±0,1 p.p.
   * em torno de 2,5% sem ir a lugar nenhum produz inclinação de ~0,013 e
   * PRECISA sair como `stable`; uma que cai 0,05 p.p. por trimestre de forma
   * consistente produz ~0,019 e PRECISA sair como `cooling`. O limiar mora
   * entre os dois.
   */
  flatSlope?: number
  /**
   * Quão perto do fundo é "no fundo", em fração do nível. Padrão 4%.
   */
  troughBand?: number
}

export const DEFAULT_WINDOW = 3
export const DEFAULT_MINIMUM_POINTS = 6
export const DEFAULT_FLAT_SLOPE = 0.015
export const DEFAULT_TROUGH_BAND = 0.04

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

/** Mediana. Lista já ordenada não é exigida. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Ordena, descarta lixo e resolve períodos repetidos.
 *
 * O período repetido é o caso do JOLTS: a mesma competência é buscada várias
 * vezes e volta primeiro preliminar, depois revisada. **A última ocorrência
 * vence** — a leitura mais recente é a boa, e somar as duas daria peso duplo a
 * um mês só.
 */
export function normalizeSeries(points: readonly HiringSeriesPoint[]): {
  period: Date
  value: number
  revised: boolean
  seriesBreak: boolean
  confidence: ConfidenceTier
}[] {
  const byPeriod = new Map<
    number,
    { period: Date; value: number; revised: boolean; seriesBreak: boolean; confidence: ConfidenceTier }
  >()

  for (const point of points) {
    if (!point || typeof point.value !== 'number' || !Number.isFinite(point.value)) continue
    const period = toDate(point.period)
    if (!period) continue

    byPeriod.set(period.getTime(), {
      period,
      value: point.value,
      revised: point.revised !== false,
      seriesBreak: point.seriesBreak === true,
      confidence: point.confidence === 'low' ? 'low' : 'high',
    })
  }

  return [...byPeriod.values()].sort((a, b) => a.period.getTime() - b.period.getTime())
}

/**
 * Média móvel de `window` períodos.
 *
 * A média é datada pelo ÚLTIMO ponto da janela, não pelo do meio: ela responde
 * "onde o mercado está agora", e centralizá-la faria o valor mais recente da
 * saída descrever um mês já passado.
 */
export function movingAverage(
  series: readonly { period: Date; value: number; revised: boolean }[],
  window = DEFAULT_WINDOW
): MovingAveragePoint[] {
  const size = Math.max(1, Math.floor(window))
  if (series.length < size) return []

  const out: MovingAveragePoint[] = []

  for (let end = size - 1; end < series.length; end++) {
    let sum = 0
    let hasPreliminary = false
    for (let i = end - size + 1; i <= end; i++) {
      sum += series[i].value
      if (!series[i].revised) hasPreliminary = true
    }
    out.push({
      period: series[end].period,
      value: sum / size,
      windowHasPreliminary: hasPreliminary,
    })
  }

  return out
}

/**
 * Inclinação por mínimos quadrados sobre os últimos `count` pontos, em unidade
 * do valor por período.
 *
 * Mínimos quadrados, e não a diferença entre o primeiro e o último, porque a
 * diferença dá o mesmo resultado para uma subida constante e para uma queda
 * seguida de repique — e são coisas diferentes.
 */
export function trailingSlope(values: readonly number[], count: number): number | null {
  const used = values.slice(-Math.max(2, count))
  if (used.length < 2) return null

  const n = used.length
  const meanX = (n - 1) / 2
  const meanY = used.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (used[i] - meanY)
    denominator += (i - meanX) * (i - meanX)
  }

  return denominator === 0 ? null : numerator / denominator
}

/**
 * A fase deste país, a partir da própria série.
 *
 * Nenhum parâmetro aponta para outro país, de propósito. Se um dia alguém
 * precisar de "acima da média europeia", isso é outra função — e vai precisar
 * responder antes por que a comparação seria válida.
 */
export function classifyHiringPhase(
  points: readonly HiringSeriesPoint[],
  options: PhaseOptions = {}
): PhaseAnalysis {
  const window = Math.max(1, Math.floor(options.window ?? DEFAULT_WINDOW))
  const minimumPoints = Math.max(window + 1, Math.floor(options.minimumPoints ?? DEFAULT_MINIMUM_POINTS))
  const flatSlope = Math.abs(options.flatSlope ?? DEFAULT_FLAT_SLOPE)
  const troughBand = Math.abs(options.troughBand ?? DEFAULT_TROUGH_BAND)

  const empty = (reason: InsufficientDataReason, used: number, confidence: ConfidenceTier): PhaseAnalysis => ({
    phase: null,
    insufficientDataReason: reason,
    movingAverage: [],
    latest: null,
    reference: null,
    trough: null,
    slope: null,
    pointsUsed: used,
    minimumPoints,
    confidence,
    latestIsPreliminary: false,
  })

  const all = normalizeSeries(points)
  if (all.length === 0) return empty('no_points', 0, 'high')

  const confidence: ConfidenceTier = all.some((p) => p.confidence === 'low') ? 'low' : 'high'

  // Quebra de série: o que veio antes dela não é comparável com o que veio
  // depois, e comparar o país com a própria história é a única coisa que este
  // módulo faz. A série começa na quebra mais recente.
  let start = 0
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].seriesBreak) {
      start = i
      break
    }
  }
  const series = all.slice(start)

  if (series.length < minimumPoints) {
    return empty(
      start > 0 ? 'series_break_too_recent' : 'too_few_points',
      series.length,
      confidence
    )
  }

  const ma = movingAverage(series, window)
  const values = ma.map((p) => p.value)

  const latest = values[values.length - 1]
  const trough = Math.min(...values)
  const reference = median(values)!

  // Inclinação sobre os últimos três pontos da média móvel — cerca de um
  // semestre em série mensal, um ano e meio em série trimestral.
  const rawSlope = trailingSlope(values, 3)
  const level = Math.abs(latest) > 1e-9 ? Math.abs(latest) : 1
  const slope = rawSlope === null ? 0 : rawSlope / level

  let phase: HiringPhase

  if (slope > flatSlope) {
    // Subindo. Acima do próprio normal é aquecimento; abaixo ainda é volta.
    //
    // A referência é a MEDIANA da média móvel, e não o primeiro ponto da
    // janela — a curva de J diria "voltou ao ponto de partida", mas o ponto de
    // partida aqui é onde a janela por acaso começou. Uma janela que começasse
    // no meio da queda faria qualquer repique parecer aquecimento.
    phase = latest >= reference ? 'heating_up' : 'recovering'
  } else if (slope < -flatSlope) {
    phase = 'cooling'
  } else {
    // Parado. Parado no fundo, depois de ter estado bem mais alto, é fundo de
    // poço; parado em qualquer outro lugar é só parado.
    const band = troughBand * level
    const nearTrough = latest - trough <= band
    const cameDown = Math.max(...values) - latest > band
    phase = nearTrough && cameDown ? 'bottoming_out' : 'stable'
  }

  return {
    phase,
    insufficientDataReason: null,
    movingAverage: ma,
    latest,
    reference,
    trough,
    slope,
    pointsUsed: series.length,
    minimumPoints,
    confidence,
    latestIsPreliminary: ma[ma.length - 1].windowHasPreliminary,
  }
}
