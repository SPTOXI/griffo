import 'server-only'
import { db } from '../db'
import {
  onDemandSearchAvailability,
  onDemandSearchDecision,
  type OnDemandSearchAvailability,
  type OnDemandSearchDecision,
} from './on-demand-search'

/** Quantas buscas avulsas sobram agora, sem gastar nenhuma. Para exibir na tela. */
export async function peekOnDemandSearch(
  userId: string,
  limit?: number
): Promise<OnDemandSearchAvailability> {
  const pref = await db.radarPreference.findUnique({
    where: { userId },
    select: { onDemandSearchCount: true, onDemandSearchWindowStart: true },
  })

  return onDemandSearchAvailability(
    {
      count: pref?.onDemandSearchCount ?? 0,
      windowStart: pref?.onDemandSearchWindowStart ?? null,
    },
    new Date(),
    limit
  )
}

/**
 * Consome uma busca avulsa, se houver, e grava o novo estado.
 *
 * Leitura e escrita não estão na mesma transação: o pior caso de dois cliques
 * simultâneos é o contador passar do limite por uma unidade, não um saldo negativo
 * nem uma coleta duplicada gravada errado — o mesmo nível de tolerância que
 * `MIN_INTERVAL_MS` já assume em `/api/radar/run`.
 */
export async function consumeOnDemandSearch(
  userId: string,
  limit?: number
): Promise<OnDemandSearchDecision> {
  const pref = await db.radarPreference.findUnique({
    where: { userId },
    select: { onDemandSearchCount: true, onDemandSearchWindowStart: true },
  })

  const decision = onDemandSearchDecision(
    {
      count: pref?.onDemandSearchCount ?? 0,
      windowStart: pref?.onDemandSearchWindowStart ?? null,
    },
    new Date(),
    limit
  )

  if (!decision.allowed) return decision

  await db.radarPreference.upsert({
    where: { userId },
    create: { userId, onDemandSearchCount: decision.nextCount!, onDemandSearchWindowStart: decision.windowStart },
    update: { onDemandSearchCount: decision.nextCount!, onDemandSearchWindowStart: decision.windowStart },
  })

  return decision
}
