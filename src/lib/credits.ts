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

export async function deductCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; currentBalance: number; error?: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, role: true, disabled: true },
      })

      if (!user) {
        return { success: false, currentBalance: 0, error: 'Usuário não encontrado.' }
      }

      if (user.disabled) {
        return { success: false, currentBalance: 0, error: 'Sua conta está suspensa.' }
      }

      // Admins are exempt from spending credits
      if (user.role === 'admin') {
        return { success: true, currentBalance: user.credits }
      }

      if (user.credits < amount) {
        return {
          success: false,
          currentBalance: user.credits,
          error: `Saldo insuficiente (${user.credits} créditos). Esta ação requer ${amount} créditos.`,
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId, credits: { gte: amount } },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'spend',
          description,
        },
      })

      return { success: true, currentBalance: updatedUser.credits }
    })

    return result
  } catch (error: unknown) {
    // If the conditional update fails (credits went below threshold), it's a race condition
    return { success: false, currentBalance: 0, error: 'Saldo insuficiente (operação concorrente detectada).' }
  }
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
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
        type: 'refund',
        description: `Reembolso automático: ${reason}`,
      },
    })

    return updatedUser
  })

  return { success: true, currentBalance: updated.credits }
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
