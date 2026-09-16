/**
 * Regra da busca avulsa do Radar: quantas por semana, e quando a janela vira.
 *
 * Separada do acesso ao banco pelo mesmo motivo de `lib/jobs/quota.ts`: a
 * decisão fica testável sem Prisma.
 *
 * A janela é ROLANTE de 7 dias a partir do primeiro uso, não a semana do
 * calendário — calendário exigiria decidir fuso horário e dia de virada, e
 * quem usa só precisa saber "3 por semana", não "3 de segunda a domingo".
 *
 * Isto NÃO é a cota de `lib/jobs/quota.ts`: aquela protege o teto mensal de um
 * provedor de terceiro contra o conjunto dos usuários. Esta é um benefício do
 * pacote — quantas vezes ESTE usuário pode pedir coleta ao vivo — e por isso
 * não tem relação com `onDemandAllowed()`.
 */

export const ON_DEMAND_SEARCH_WEEKLY_LIMIT = 3

/**
 * Busca ativa do Passe Trimestral: o limite semanal de quem tem passe ativo.
 * É o benefício que diferencia o passe da análise avulsa no Radar.
 */
export const PASS_ON_DEMAND_SEARCH_WEEKLY_LIMIT = 10

/** Limite semanal conforme o passe. */
export function onDemandWeeklyLimit(hasPass: boolean): number {
  return hasPass ? PASS_ON_DEMAND_SEARCH_WEEKLY_LIMIT : ON_DEMAND_SEARCH_WEEKLY_LIMIT
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface OnDemandSearchState {
  count: number
  windowStart: Date | null
}

/** A mesma janela, calculada uma vez — decisão de consumo e leitura sem consumir partem daqui. */
function currentWindow(state: OnDemandSearchState, now: Date) {
  const expired = !state.windowStart || now.getTime() - state.windowStart.getTime() >= WEEK_MS
  const windowStart = expired ? now : state.windowStart!
  const usedInWindow = expired ? 0 : state.count
  const resetAt = new Date(windowStart.getTime() + WEEK_MS)
  return { windowStart, usedInWindow, resetAt }
}

export interface OnDemandSearchDecision {
  allowed: boolean
  /** Quantas sobram DEPOIS de consumir esta, quando `allowed`. */
  remaining: number
  /** Início da janela a persistir. */
  windowStart: Date
  /** Quando a janela atual vira — para a mensagem de espera. */
  resetAt: Date
  /** Contador a persistir. Só existe quando `allowed`. */
  nextCount?: number
}

export function onDemandSearchDecision(
  state: OnDemandSearchState,
  now: Date = new Date(),
  limit: number = ON_DEMAND_SEARCH_WEEKLY_LIMIT
): OnDemandSearchDecision {
  const { windowStart, usedInWindow, resetAt } = currentWindow(state, now)

  if (usedInWindow >= limit) {
    return { allowed: false, remaining: 0, windowStart, resetAt }
  }

  return {
    allowed: true,
    remaining: limit - usedInWindow - 1,
    windowStart,
    resetAt,
    nextCount: usedInWindow + 1,
  }
}

export interface OnDemandSearchAvailability {
  /** Quantas cabem AGORA, sem consumir nenhuma. */
  available: number
  resetAt: Date
}

/**
 * Para exibir na tela sem gastar uma busca só de olhar.
 *
 * Não decide se uma busca específica é permitida — `onDemandSearchDecision`
 * faz isso, no momento de gastar. Isto só responde "quantas sobram".
 */
export function onDemandSearchAvailability(
  state: OnDemandSearchState,
  now: Date = new Date(),
  limit: number = ON_DEMAND_SEARCH_WEEKLY_LIMIT
): OnDemandSearchAvailability {
  const { usedInWindow, resetAt } = currentWindow(state, now)
  return { available: Math.max(0, limit - usedInWindow), resetAt }
}
