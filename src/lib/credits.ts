import { db } from './db'

export const CREDIT_COSTS = {
  pdf_download: 1,
  professional_summary: 5,
  section_improvement: 5,
  rewrite_experience: 10,
  cover_letter: 15,
  social_optimization: 20,
  full_analysis: 20,
  resume_comparison: 25,
} as const

export interface CreditPackage {
  id: 'entrada' | 'starter' | 'carreira' | 'profissional'
  name: string
  credits: number
  paidCredits: number
  bonusCredits: number
  priceBrl: number
  priceUsd: number
  priceEur: number
  pricePerCreditBrl: number
  pricePerCreditUsd: number
  pricePerCreditEur: number
  popular?: boolean
  entryOnly?: boolean
  desc: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'entrada',
    name: 'Plano de Entrada',
    credits: 40,
    paidCredits: 30,
    bonusCredits: 10,
    priceBrl: 9.90,
    priceUsd: 1.99,
    priceEur: 1.99,
    pricePerCreditBrl: 0.2475,
    pricePerCreditUsd: 0.049,
    pricePerCreditEur: 0.049,
    entryOnly: true,
    desc: '40 créditos no saldo (suficiente para 2 avaliações completas de currículo)',
  },
  {
    id: 'starter',
    name: 'Pacote Starter',
    credits: 100,
    paidCredits: 100,
    bonusCredits: 0,
    priceBrl: 29.90,
    priceUsd: 5.99,
    priceEur: 5.99,
    pricePerCreditBrl: 0.299,
    pricePerCreditUsd: 0.059,
    pricePerCreditEur: 0.059,
    desc: '100 créditos no saldo (suficiente para 5 avaliações completas de currículo)',
  },
  {
    id: 'carreira',
    name: 'Pacote Carreira',
    credits: 500,
    paidCredits: 500,
    bonusCredits: 0,
    priceBrl: 99.90,
    priceUsd: 19.99,
    priceEur: 19.99,
    pricePerCreditBrl: 0.199,
    pricePerCreditUsd: 0.039,
    pricePerCreditEur: 0.039,
    popular: true,
    desc: '500 créditos no saldo (suficiente para 25 avaliações completas de currículo)',
  },
  {
    id: 'profissional',
    name: 'Pacote Profissional',
    credits: 1500,
    paidCredits: 1500,
    bonusCredits: 0,
    priceBrl: 249.90,
    priceUsd: 49.99,
    priceEur: 49.99,
    pricePerCreditBrl: 0.166,
    pricePerCreditUsd: 0.033,
    pricePerCreditEur: 0.033,
    desc: '1.500 créditos no saldo (suficiente para 75 avaliações completas de currículo)',
  },
]

export function getPackagePriceDisplay(
  pkg: CreditPackage,
  country: string = 'BR',
  lang: string = 'pt'
): { priceFormatted: string; perCreditFormatted: string; currencySymbol: string; code: 'BRL' | 'USD' | 'EUR' } {
  const c = (country || 'BR').toUpperCase().trim()

  // Eurozone countries
  const euroCountries = ['ES', 'PT', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'IE', 'FI', 'GR']

  if (c === 'BR' || (lang === 'pt' && c === 'BR')) {
    return {
      priceFormatted: `R$ ${pkg.priceBrl.toFixed(2).replace('.', ',')}`,
      perCreditFormatted: `R$ ${pkg.pricePerCreditBrl.toFixed(3).replace('.', ',')}`,
      currencySymbol: 'R$',
      code: 'BRL',
    }
  }

  if (euroCountries.includes(c)) {
    return {
      priceFormatted: `€ ${pkg.priceEur.toFixed(2).replace('.', ',')}`,
      perCreditFormatted: `€ ${pkg.pricePerCreditEur.toFixed(3).replace('.', ',')}`,
      currencySymbol: '€',
      code: 'EUR',
    }
  }

  // Default USD for rest of the world (US, LATAM, Asia, UK, etc.)
  return {
    priceFormatted: `$ ${pkg.priceUsd.toFixed(2)}`,
    perCreditFormatted: `$ ${pkg.pricePerCreditUsd.toFixed(3)}`,
    currencySymbol: '$',
    code: 'USD',
  }
}

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
