/**
 * O Radar — e a decisão mais difícil dele, que é ficar calado.
 *
 * O §15 define o Radar assim:
 *
 * > monitorar oportunidades relevantes para aquele perfil e interromper o
 * > usuário somente quando encontrar algo que mereça sua atenção.
 * >
 * > O princípio do produto é: "Silêncio por padrão."
 *
 * E o §23 completa: "Não enviar 30 vagas. O valor está na curadoria."
 *
 * ## O que este arquivo NÃO faz
 *
 * Ele não decide quais vagas existem, nem quão compatíveis elas são — isso é
 * `lib/matching/`. Ele decide **se vale interromper alguém**, o que é uma
 * pergunta diferente e mais difícil.
 *
 * ## A economia da atenção
 *
 * Um alerta custa ao usuário mais do que parece. Ele para o que está fazendo,
 * abre, avalia e decide. Se a oportunidade não valia, ele não perdeu só o
 * minuto: perdeu um pouco da confiança de que vale abrir o próximo. Três
 * alertas ruins e o quarto — que era bom — não é aberto.
 *
 * É por isso que os limiares aqui são altos e o padrão é o silêncio. Um Radar
 * que avisa demais não é um Radar generoso: é um Radar que se desliga sozinho
 * na cabeça do usuário.
 */

import type { MatchResult } from '../matching/compatibility'
import { internalSignalScore } from '../matching/compatibility'

/** Uma vaga já avaliada, pronta para a decisão de curadoria. */
export interface EvaluatedOpportunity<T = unknown> {
  job: T
  jobId: string
  match: MatchResult
  /** Quando esta vaga foi publicada. Vaga velha compete pior por atenção. */
  publishedAt?: Date | null
}

/** O que o usuário configurou (§22). */
export interface RadarPreferences {
  /** immediate | daily | weekly | off */
  frequency: 'immediate' | 'daily' | 'weekly' | 'off'
  /**
   * Relevância mínima para interromper. É o controle mais importante da tela,
   * e o padrão é alto de propósito.
   */
  minimumFit: 'strong' | 'good' | 'partial'
  /** Teto de itens por envio. Acima disto vira curadoria, não lista. */
  maxPerDigest: number
}

export const DEFAULT_RADAR_PREFERENCES: RadarPreferences = {
  frequency: 'daily',
  minimumFit: 'good',
  // Quatro é o número do exemplo do §23, e é aproximadamente quantas
  // oportunidades alguém consegue avaliar de verdade numa sentada.
  maxPerDigest: 4,
}

const FIT_RANK: Record<string, number> = { weak: 0, partial: 1, good: 2, strong: 3 }

/** A oportunidade alcança o mínimo que o usuário pediu? */
export function meetsMinimumFit(match: MatchResult, minimum: RadarPreferences['minimumFit']): boolean {
  return FIT_RANK[match.overall] >= FIT_RANK[minimum]
}

export type SilenceReason =
  | 'radar_off'
  | 'no_opportunities'
  | 'below_minimum_fit'
  | 'all_blocked'
  | 'already_alerted'

export interface CurationResult<T = unknown> {
  /** Vale interromper? Quando `false`, NADA é enviado. */
  shouldAlert: boolean
  /** As oportunidades selecionadas, já ordenadas. Vazio quando não se alerta. */
  selected: EvaluatedOpportunity<T>[]
  /** Por que ficou em silêncio. Vai para o log — nunca para o usuário. */
  silenceReason: SilenceReason | null
  /** Quantas foram avaliadas e descartadas nesta rodada. Métrica do §29. */
  evaluated: number
  discarded: number
}

export interface CurateOptions {
  preferences: RadarPreferences
  /** Vagas sobre as quais este usuário já foi alertado. Não se avisa duas vezes. */
  alreadyAlertedJobIds?: string[]
}

/**
 * Decide se interrompe, e com o quê.
 *
 * Função pura. Recebe o que já foi avaliado e devolve a decisão — sem tocar em
 * banco, e-mail ou fila. É isso que permite testar "o Radar fica calado quando
 * deve" sem infraestrutura nenhuma, que é a garantia mais importante do §15.
 */
export function curate<T>(
  opportunities: EvaluatedOpportunity<T>[],
  options: CurateOptions
): CurationResult<T> {
  const { preferences } = options
  const alerted = new Set(options.alreadyAlertedJobIds ?? [])
  const evaluated = opportunities.length

  const silent = (reason: SilenceReason): CurationResult<T> => ({
    shouldAlert: false,
    selected: [],
    silenceReason: reason,
    evaluated,
    discarded: evaluated,
  })

  if (preferences.frequency === 'off') return silent('radar_off')
  if (evaluated === 0) return silent('no_opportunities')

  // 1. Nada com impedimento chega ao usuário. Uma vaga que ele não pode aceitar
  //    não é uma oportunidade — é uma frustração com etiqueta de oportunidade.
  const viable = opportunities.filter((o) => o.match.blockers.length === 0)
  if (viable.length === 0) return silent('all_blocked')

  // 2. Nada abaixo do mínimo que ELE pediu.
  const relevant = viable.filter((o) => meetsMinimumFit(o.match, preferences.minimumFit))
  if (relevant.length === 0) return silent('below_minimum_fit')

  // 3. Nada sobre o que ele já foi avisado.
  const fresh = relevant.filter((o) => !alerted.has(o.jobId))
  if (fresh.length === 0) return silent('already_alerted')

  // 4. Ordena e corta. O corte é o produto: mandar as 30 seria mais fácil e
  //    seria pior.
  const ranked = [...fresh].sort((a, b) => {
    const fitDelta = FIT_RANK[b.match.overall] - FIT_RANK[a.match.overall]
    if (fitDelta !== 0) return fitDelta

    const signalDelta = internalSignalScore(b.match) - internalSignalScore(a.match)
    if (signalDelta !== 0) return signalDelta

    // Empate: a mais recente primeiro. Vaga velha já pode ter avançado.
    return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  })

  const selected = ranked.slice(0, Math.max(1, preferences.maxPerDigest))

  return {
    shouldAlert: true,
    selected,
    silenceReason: null,
    evaluated,
    discarded: evaluated - selected.length,
  }
}

export interface DigestSummary {
  total: number
  strong: number
  good: number
  partial: number
  /** Linha de abertura do digest, no formato do exemplo do §23. */
  headline: string
}

/**
 * O resumo do "Seu Radar de hoje" (§23).
 *
 * O exemplo do prompt é:
 *
 *     Encontramos 4 oportunidades relevantes.
 *     2 altamente compatíveis
 *     1 compatível
 *     1 oportunidade alternativa
 *
 * Repare no que ele NÃO diz: quantas vagas foram varridas, quantas foram
 * descartadas, qual o percentual de nada. O usuário não quer saber do trabalho
 * — quer saber do resultado.
 */
export function summarizeDigest(selected: EvaluatedOpportunity[]): DigestSummary {
  const strong = selected.filter((o) => o.match.overall === 'strong').length
  const good = selected.filter((o) => o.match.overall === 'good').length
  const partial = selected.filter((o) => o.match.overall === 'partial').length
  const total = selected.length

  const parts: string[] = []
  if (strong) parts.push(`${strong} altamente compatível${strong > 1 ? 'eis' : ''}`)
  if (good) parts.push(`${good} compatível${good > 1 ? 'eis' : ''}`)
  if (partial) parts.push(`${partial} oportunidade${partial > 1 ? 's' : ''} alternativa${partial > 1 ? 's' : ''}`)

  return {
    total,
    strong,
    good,
    partial,
    headline:
      total === 1
        ? 'Encontramos 1 oportunidade relevante.'
        : `Encontramos ${total} oportunidades relevantes.`,
  }
}

/**
 * Métricas de uma rodada (§29).
 *
 * A métrica principal do produto, segundo o §42, não é "quantas vagas
 * encontramos?" — é "quantas oportunidades realmente úteis encontramos para a
 * pessoa?". `alertRate` alto não é sinal de sucesso: pode ser o filtro frouxo.
 */
export interface RadarMetrics {
  collected: number
  eligible: number
  evaluated: number
  alerted: number
  silenced: number
  /** Proporção do que foi avaliado e virou alerta. Baixo é normal e saudável. */
  alertRate: number
}

export function radarMetrics(input: {
  collected: number
  eligible: number
  results: CurationResult[]
}): RadarMetrics {
  const evaluated = input.results.reduce((sum, r) => sum + r.evaluated, 0)
  const alerted = input.results.reduce((sum, r) => sum + r.selected.length, 0)
  const silenced = input.results.filter((r) => !r.shouldAlert).length

  return {
    collected: input.collected,
    eligible: input.eligible,
    evaluated,
    alerted,
    silenced,
    alertRate: evaluated > 0 ? Math.round((alerted / evaluated) * 100) / 100 : 0,
  }
}
