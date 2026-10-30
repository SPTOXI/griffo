/**
 * Regra de reembolso (§2.163), decidida pelo operador em 30/10/2026:
 *
 * - Só se o serviço não foi executado, e só até 7 dias depois da compra (o
 *   direito de arrependimento do CDC, art. 49, aplicado a todos os países):
 *   análise ainda não usada, ou paga e não entregue (falha nossa — o sistema
 *   abre esse caso sozinho). Um segundo depois dos 7 dias, nada.
 * - Não há botão para o cliente: o pedido chega pelo suporte e o admin o
 *   registra na aba "Reembolsos".
 * - O dinheiro volta em até 24 h depois de o pedido ser aberto (`dueAt`). Quem
 *   aprova é o admin; o sistema avisa por e-mail na abertura e 4 h antes do fim.
 *
 * Puro, sem banco: o servidor busca os dados e pergunta aqui.
 */

export const REFUND_WINDOW_DAYS = 7
export const REFUND_SLA_HOURS = 24
export const REMINDER_BEFORE_HOURS = 4
/** Análise destravada e não pronta depois disto conta como falha de entrega. */
export const DELIVERY_FAILURE_AFTER_HOURS = 2

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export type RefundEligibility = 'unused' | 'failure' | 'outside_rules'

export interface PurchaseFacts {
  purchasedAt: Date
  /** Análises que a compra deu (1 no Essencial, 5 no Recolocação). */
  quantity: number
  /** Saldo atual da conta. */
  balance: number
  /** Algum currículo destravado depois da compra ficou sem a análise pronta. */
  hasFailedDelivery: boolean
}

/**
 * "Não usada" = o saldo ainda cobre tudo o que a compra deu. Conservador de
 * propósito: com duas compras e um uso, a mais recente não sai como "não usada"
 * se o saldo não cobre as duas — o admin decide.
 */
export function eligibilityOf(f: PurchaseFacts, now: Date = new Date()): RefundEligibility {
  // Prazo rígido (operador, 30/10/2026): um segundo depois dos 7 dias não há
  // reembolso, nem por falha. Análise que falhou pode ser gerada de novo sem
  // pagar outra vez — o currículo continua destravado.
  const withinWindow = now.getTime() - f.purchasedAt.getTime() <= REFUND_WINDOW_DAYS * DAY
  if (!withinWindow) return 'outside_rules'
  if (f.hasFailedDelivery) return 'failure'
  if (f.balance >= f.quantity) return 'unused'
  return 'outside_rules'
}

/** Até quando a pessoa pode pedir pelo arrependimento. */
export function windowEndsAt(purchasedAt: Date): Date {
  return new Date(purchasedAt.getTime() + REFUND_WINDOW_DAYS * DAY)
}

export function dueAtFor(openedAt: Date): Date {
  return new Date(openedAt.getTime() + REFUND_SLA_HOURS * HOUR)
}

/** Hora de lembrar o admin: falta pouco e ainda não lembrou. */
export function needsReminder(r: { status: string; dueAt: Date; remindedAt: Date | null }, now: Date = new Date()): boolean {
  return r.status === 'pending' && !r.remindedAt && r.dueAt.getTime() - now.getTime() <= REMINDER_BEFORE_HOURS * HOUR
}

/** Destravado há mais de 2 h e a análise não está pronta: falha de entrega. */
export function isDeliveryFailure(
  r: { unlockedAt: Date | null; analysisReady: boolean; jobFailed: boolean },
  now: Date = new Date()
): boolean {
  if (!r.unlockedAt || r.analysisReady) return false
  return r.jobFailed || now.getTime() - r.unlockedAt.getTime() > DELIVERY_FAILURE_AFTER_HOURS * HOUR
}

/** Horas e minutos que faltam (negativo quando venceu), para a tela do admin. */
export function timeLeft(dueAt: Date, now: Date = new Date()): { overdue: boolean; hours: number; minutes: number } {
  const ms = dueAt.getTime() - now.getTime()
  const abs = Math.abs(ms)
  return { overdue: ms < 0, hours: Math.floor(abs / HOUR), minutes: Math.floor((abs % HOUR) / 60000) }
}
