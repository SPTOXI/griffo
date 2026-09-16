/**
 * Passe Trimestral — regras puras, sem banco.
 *
 * O passe mora em `User.plan` / `User.planStartsAt` / `User.planEndsAt`,
 * campos que já existiam do modelo antigo de planos. Nada de migração.
 *
 * Client-safe: a tela de planos usa `passStatus` para mostrar a validade.
 */
import { QUARTERLY_PASS_DAYS, QUARTERLY_PLAN } from './catalog'

const DAY_MS = 24 * 60 * 60 * 1000

export interface PassFields {
  plan?: string | null
  planEndsAt?: Date | string | null
}

/** Passe ativo agora? Plano antigo (`day`, `monthly`, `annual`) não conta. */
export function hasActivePass(user: PassFields | null | undefined, now: Date = new Date()): boolean {
  if (!user || user.plan !== QUARTERLY_PLAN || !user.planEndsAt) return false
  return new Date(user.planEndsAt).getTime() > now.getTime()
}

/**
 * Nova validade ao comprar outro passe.
 *
 * Passe ainda ativo: soma ao fim do atual — comprar antes de vencer não pode
 * fazer a pessoa perder os dias que já pagou. Vencido ou inexistente: conta de
 * agora.
 */
export function extendPass(
  user: PassFields | null | undefined,
  now: Date = new Date(),
  days: number = QUARTERLY_PASS_DAYS
): { startsAt: Date; endsAt: Date } {
  const base = hasActivePass(user, now) ? new Date(user!.planEndsAt as Date | string) : now
  return { startsAt: now, endsAt: new Date(base.getTime() + days * DAY_MS) }
}

/** Dias inteiros que ainda restam (0 se vencido). */
export function passDaysLeft(user: PassFields | null | undefined, now: Date = new Date()): number {
  if (!hasActivePass(user, now)) return 0
  return Math.ceil((new Date(user!.planEndsAt as Date | string).getTime() - now.getTime()) / DAY_MS)
}
