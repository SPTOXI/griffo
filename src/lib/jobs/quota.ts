/**
 * Cota das APIs externas: quanto já foi gasto, e quando parar.
 *
 * ## Por que isto existe
 *
 * Cota estourada é **invisível até a fonte parar de responder** — e nem sempre
 * ela responde com erro. A Adzuna devolve 200 com um campo `exception` quando o
 * limite passa, o que, sem alguém olhando, se parece com "não há vaga".
 *
 * Uma fonte que falha em silêncio é pior que uma fonte desligada: o Radar
 * continua rodando, entrega menos, e ninguém sabe por quê.
 *
 * ## A regra que protege o compartilhado
 *
 * A rodada diária serve **todos os usuários**; a busca sob demanda serve **um**.
 * Quando a cota aperta, quem cede é o individual. Por isso o orçamento é
 * dividido: uma reserva é intocável pela busca sob demanda, mesmo que sobre
 * cota no mês.
 */

/** Tetos conhecidos, por provedor. Nulo = sem limite declarado. */
export const MONTHLY_QUOTA: Record<string, number | null> = {
  // 2.500/mês na camada gratuita — verificado no painel em 18/08/2026.
  adzuna: 2500,
  // Sem cota publicada. Não significa ilimitado: significa que não sabemos, e
  // por isso a moderação vem do orçamento de tempo da coleta, não daqui.
  gupy: null,
  remotive: null,
  remoteok: null,
}

/**
 * Fatia reservada à rodada agendada, que a busca sob demanda não toca.
 *
 * 20% da cota. Com a Adzuna, são 500 requisições — bem acima das ~372 que a
 * rodada diária consome no mês, deixando folga para um dia atípico sem que a
 * busca sob demanda possa consumi-la.
 */
export const SCHEDULED_RESERVE_RATIO = 0.2

/** `2026-08`, em UTC — para não mudar de bucket conforme o fuso de quem roda. */
export function periodKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface QuotaState {
  provider: string
  used: number
  limit: number | null
}

export type QuotaVerdict = 'ok' | 'reserve_only' | 'exhausted' | 'unknown'

export interface QuotaDecision {
  verdict: QuotaVerdict
  remaining: number | null
  /** Quanto ainda cabe fora da reserva da rodada agendada. */
  remainingForOnDemand: number | null
  explanation: string
}

/**
 * O que ainda dá para gastar, e por quem.
 *
 * `unknown` não é `ok`: um provedor sem teto declarado não autoriza consumo
 * ilimitado — só significa que a decisão precisa vir de outro lugar. Confundir
 * os dois faria uma fonte sem cota conhecida virar barra livre.
 */
export function quotaDecision(state: QuotaState, options: { reserveRatio?: number } = {}): QuotaDecision {
  const reserveRatio = options.reserveRatio ?? SCHEDULED_RESERVE_RATIO

  if (state.limit == null) {
    return {
      verdict: 'unknown',
      remaining: null,
      remainingForOnDemand: null,
      explanation: 'Provedor sem teto declarado. O consumo é limitado pelo orçamento de tempo da coleta.',
    }
  }

  const remaining = Math.max(0, state.limit - state.used)
  const reserve = Math.ceil(state.limit * reserveRatio)
  const remainingForOnDemand = Math.max(0, remaining - reserve)

  if (remaining === 0) {
    return {
      verdict: 'exhausted',
      remaining: 0,
      remainingForOnDemand: 0,
      explanation: 'Cota do mês esgotada. A fonte não é chamada até virar o mês.',
    }
  }

  if (remainingForOnDemand === 0) {
    return {
      verdict: 'reserve_only',
      remaining,
      remainingForOnDemand: 0,
      explanation:
        'O que resta é a reserva da rodada agendada, que serve todos os usuários. A busca sob demanda fica indisponível até virar o mês.',
    }
  }

  return {
    verdict: 'ok',
    remaining,
    remainingForOnDemand,
    explanation: `${remainingForOnDemand} requisições disponíveis para busca sob demanda, além da reserva da rodada agendada.`,
  }
}

/** Nível de alerta para o painel. */
export type QuotaAlertLevel = 'none' | 'attention' | 'critical'

/**
 * Quando o painel deve chamar atenção.
 *
 * Os limiares são de uso, não de sobra, porque é assim que a pergunta chega:
 * "quanto já gastei do mês?". `critical` em 90% dá tempo de reagir antes de a
 * fonte parar; `attention` em 70% dá tempo de decidir sem pressa.
 */
export function quotaAlertLevel(state: QuotaState): QuotaAlertLevel {
  if (state.limit == null || state.limit <= 0) return 'none'
  const ratio = state.used / state.limit
  if (ratio >= 0.9) return 'critical'
  if (ratio >= 0.7) return 'attention'
  return 'none'
}
