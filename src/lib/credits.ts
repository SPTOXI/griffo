import { db } from './db'

// Pure catalog/pricing data lives in a db-free module so Client Components can
// import it without pulling Prisma into the browser bundle. Re-exported here so
// server-side callers can keep using a single `@/lib/credits` import.
export {
  CREDIT_COSTS,
  CREDIT_PACKAGES,
  getPackagePriceDisplay,
} from './credits-catalog'
export type { CreditPackage } from './credits-catalog'

export async function getUserCredits(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  return user?.credits ?? 0
}

/**
 * Reserva de créditos em duas fases.
 *
 * O modelo anterior era débito imediato + reembolso no `catch`. Três defeitos
 * vinham daí:
 *
 * 1. **Reembolso creditando administrador.** O débito tinha isenção para
 *    `role === 'admin'` e saía sem descontar nada; o reembolso incrementava sem
 *    conferir. Cada falha de IA numa conta administrativa criava créditos do
 *    nada.
 * 2. **Reembolso sem idempotência.** Duas passagens pelo `catch` — ou um
 *    retry — creditavam duas vezes. Nada ligava o estorno ao débito original.
 * 3. **Cobrança sem entrega.** Se a função morresse antes do `catch` (o
 *    timeout de 60s da Vercel), o débito ficava e o estorno nunca acontecia.
 *
 * Agora o débito nasce `pending` e só vira `completed` quando a entrega
 * confirma. Liberar é uma atualização condicional em cima da própria linha, o
 * que a torna idempotente por construção. E reservas que ninguém fechou são
 * varridas na reserva seguinte do mesmo usuário — cobrindo o caso em que a
 * função é morta sem executar nenhum dos dois desfechos.
 */

/** Reserva em aberto. `id` nulo = usuário isento (admin): nada a liquidar. */
export interface CreditReservation {
  id: string | null
  userId: string
  amount: number
  exempt: boolean
}

/**
 * Uma reserva pendente por mais tempo que isto só pode ter ficado órfã: as
 * rotas que consomem crédito têm `maxDuration = 60`.
 */
const STALE_RESERVATION_MS = 5 * 60 * 1000

export type ReserveResult =
  | { success: true; reservation: CreditReservation; currentBalance: number }
  | { success: false; currentBalance: number; error: string }

export async function reserveCredits(
  userId: string,
  amount: number,
  description: string
): Promise<ReserveResult> {
  // Devolve ao saldo o que ficou preso em execuções mortas antes de avaliar a
  // reserva atual — senão o usuário fica bloqueado por crédito que já é dele.
  await releaseStaleReservations(userId)

  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, role: true, disabled: true },
      })

      if (!user) {
        return { success: false as const, currentBalance: 0, error: 'Usuário não encontrado.' }
      }
      if (user.disabled) {
        return { success: false as const, currentBalance: 0, error: 'Sua conta está suspensa.' }
      }

      // Administrador não consome crédito. Sem linha de transação: era ela que,
      // ao ser estornada, criava saldo do nada.
      if (user.role === 'admin') {
        return {
          success: true as const,
          reservation: { id: null, userId, amount, exempt: true },
          currentBalance: user.credits,
        }
      }

      if (user.credits < amount) {
        return {
          success: false as const,
          currentBalance: user.credits,
          error: `Saldo insuficiente (${user.credits} créditos). Esta ação requer ${amount} créditos.`,
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId, credits: { gte: amount } },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      })

      const reservation = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'spend',
          description,
          status: 'pending',
        },
        select: { id: true },
      })

      return {
        success: true as const,
        reservation: { id: reservation.id, userId, amount, exempt: false },
        currentBalance: updatedUser.credits,
      }
    })
  } catch {
    // A atualização condicional falhou: outra requisição consumiu o saldo entre
    // a leitura e a escrita.
    return {
      success: false,
      currentBalance: 0,
      error: 'Saldo insuficiente (operação concorrente detectada).',
    }
  }
}

/** Confirma a entrega: a reserva vira cobrança definitiva. Idempotente. */
export async function settleReservation(
  reservation: CreditReservation | null | undefined
): Promise<void> {
  if (!reservation?.id) return
  try {
    await db.creditTransaction.updateMany({
      where: { id: reservation.id, status: 'pending' },
      data: { status: 'completed' },
    })
  } catch (e) {
    // Falhar aqui não pode derrubar uma entrega que já deu certo. A reserva
    // segue `pending` e será varrida como órfã — devolvendo o crédito. Errar a
    // favor do usuário é a direção certa.
    console.error('[credits] Falha ao liquidar reserva:', e)
  }
}

/**
 * Desfaz a reserva e devolve o crédito.
 *
 * O `updateMany` condicionado a `status: 'pending'` é o que garante a
 * idempotência: se a linha já saiu de `pending`, `count` vem 0 e o saldo não é
 * tocado. Dois `catch` concorrentes, ou um retry, não conseguem creditar duas
 * vezes.
 */
export async function releaseReservation(
  reservation: CreditReservation | null | undefined,
  reason: string
): Promise<{ refunded: boolean; currentBalance: number | null }> {
  if (!reservation?.id) return { refunded: false, currentBalance: null }

  try {
    return await db.$transaction(async (tx) => {
      // Condicionar a `status: 'pending'` é o que torna a operação idempotente:
      // quem chegar depois encontra `count === 0` e não credita nada.
      const claimed = await tx.creditTransaction.updateMany({
        where: { id: reservation.id!, status: 'pending' },
        data: {
          status: 'refunded',
          description: `Reserva liberada: ${reason}`,
        },
      })

      if (claimed.count === 0) {
        return { refunded: false, currentBalance: null }
      }

      const updatedUser = await tx.user.update({
        where: { id: reservation.userId },
        data: { credits: { increment: reservation.amount } },
        select: { credits: true },
      })

      return { refunded: true, currentBalance: updatedUser.credits }
    })
  } catch (e) {
    console.error('[credits] Falha ao liberar reserva:', e)
    return { refunded: false, currentBalance: null }
  }
}

/**
 * Devolve o saldo preso em reservas que nunca foram fechadas — o rastro de
 * execuções mortas pelo limite de tempo da função.
 *
 * Roda na reserva seguinte do próprio usuário, então não precisa de cron nem
 * de infraestrutura nova. O custo é um `updateMany` indexado por
 * `(userId, status)`.
 */
export async function releaseStaleReservations(userId: string): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_RESERVATION_MS)

  try {
    return await db.$transaction(async (tx) => {
      const stale = await tx.creditTransaction.findMany({
        where: { userId, status: 'pending', createdAt: { lt: cutoff } },
        select: { id: true, amount: true },
      })
      if (stale.length === 0) return 0

      // Uma reserva por vez, somando só o que esta transação realmente
      // arrematou. Marcar todas de uma vez e somar a leitura anterior
      // devolveria crédito a mais se outra execução tivesse fechado alguma
      // delas nesse intervalo.
      let restored = 0
      let count = 0
      for (const row of stale) {
        const claimed = await tx.creditTransaction.updateMany({
          where: { id: row.id, status: 'pending' },
          data: { status: 'refunded', description: 'Reserva expirada sem conclusão' },
        })
        if (claimed.count === 1) {
          restored += Math.abs(row.amount) // `amount` da reserva é negativo
          count += 1
        }
      }
      if (count === 0) return 0

      await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: restored } },
      })

      return count
    })
  } catch (e) {
    console.error('[credits] Falha ao varrer reservas expiradas:', e)
    return 0
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'welcome' | 'purchase' | 'admin_gift',
  description: string,
  costBrl?: number
): Promise<{ success: boolean; currentBalance: number }> {
  const updated = await db.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        costBrl,
      },
    })

    return updatedUser
  })

  return { success: true, currentBalance: updated.credits }
}
