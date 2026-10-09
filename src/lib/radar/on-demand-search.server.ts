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
 * Leitura e escrita na mesma transação, sob trava por usuário: sem ela, N
 * requisições paralelas liam o mesmo contador e todas eram liberadas — cada
 * uma disparando uma coleta inteira no JobBase.
 */
export async function consumeOnDemandSearch(
  userId: string,
  limit?: number
): Promise<OnDemandSearchDecision> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`on-demand-search:${userId}`}))`
    const pref = await tx.radarPreference.findUnique({
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

    await tx.radarPreference.upsert({
      where: { userId },
      create: { userId, onDemandSearchCount: decision.nextCount!, onDemandSearchWindowStart: decision.windowStart },
      update: { onDemandSearchCount: decision.nextCount!, onDemandSearchWindowStart: decision.windowStart },
    })

    return decision
  })
}
