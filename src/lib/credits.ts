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
  id: 'free' | 'starter' | 'carreira' | 'profissional'
  name: string
  credits: number
  priceBrl: number
  pricePerCredit: number
  popular?: boolean
  desc: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'free',
    name: 'Gratuito',
    credits: 20,
    priceBrl: 0.0,
    pricePerCredit: 0.0,
    desc: 'Boas-vindas ao se cadastrar (permite 1 análise completa)',
  },
  {
    id: 'starter',
    name: 'Pacote Starter',
    credits: 100,
    priceBrl: 29.90,
    pricePerCredit: 0.299,
    desc: 'Ideal para ajustes rápidos e melhorias pontuais',
  },
  {
    id: 'carreira',
    name: 'Pacote Carreira',
    credits: 500,
    priceBrl: 99.90,
    pricePerCredit: 0.199,
    popular: true,
    desc: 'Melhor custo-benefício para processos seletivos',
  },
  {
    id: 'profissional',
    name: 'Pacote Profissional',
    credits: 1500,
    priceBrl: 249.90,
    pricePerCredit: 0.166,
    desc: 'Indicado para uso intensivo e transição de carreira',
  },
]

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
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })

  const currentBalance = user?.credits ?? 0

  if (currentBalance < amount) {
    return {
      success: false,
      currentBalance,
      error: 'Seu saldo Griffo acabou. Continue utilizando a IA adquirindo créditos.',
    }
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: amount },
    },
  })

  await db.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: 'consume',
      description,
    },
  })

  return {
    success: true,
    currentBalance: updatedUser.credits,
  }
}

export async function purchaseCreditPackage(
  userId: string,
  packageId: string
): Promise<{ success: boolean; packageInfo?: CreditPackage; newBalance?: number; error?: string }> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!pkg || pkg.id === 'free') {
    return { success: false, error: 'Pacote de créditos inválido.' }
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      credits: { increment: pkg.credits },
      plan: pkg.id,
    },
  })

  await db.creditTransaction.create({
    data: {
      userId,
      amount: pkg.credits,
      type: 'purchase',
      description: `${pkg.name} (${pkg.credits} créditos)`,
      costBrl: pkg.priceBrl,
    },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'credit_purchase',
      meta: JSON.stringify({ packageId, credits: pkg.credits, priceBrl: pkg.priceBrl }),
    },
  })

  return {
    success: true,
    packageInfo: pkg,
    newBalance: updatedUser.credits,
  }
}

export async function getCreditAdminMetrics() {
  const [totalUsers, buyersCount, purchases, consumes, aiLogs] = await Promise.all([
    db.user.count(),
    db.creditTransaction.groupBy({
      by: ['userId'],
      where: { type: 'purchase' },
    }),
    db.creditTransaction.aggregate({
      where: { type: 'purchase' },
      _sum: { amount: true, costBrl: true },
      _count: { id: true },
    }),
    db.creditTransaction.aggregate({
      where: { type: 'consume' },
      _sum: { amount: true },
    }),
    db.aiLog.aggregate({
      _sum: { costUsd: true },
    }),
  ])

  const freeUsers = Math.max(0, totalUsers - buyersCount.length)
  const purchasingUsers = buyersCount.length
  const conversionRate = totalUsers > 0 ? (purchasingUsers / totalUsers) * 100 : 0

  const creditsSold = purchases._sum.amount || 0
  const revenueBrl = purchases._sum.costBrl || 0
  const creditsConsumed = Math.abs(consumes._sum.amount || 0)

  const ticketMédioBrl = purchasingUsers > 0 ? revenueBrl / purchasingUsers : 0

  // Estimated AI Cost (USD converted to BRL @ 5.4 rate)
  const aiCostUsd = aiLogs._sum.costUsd || 0
  const estimatedAiCostBrl = aiCostUsd * 5.4

  const marginBrl = Math.max(0, revenueBrl - estimatedAiCostBrl)
  const marginPercent = revenueBrl > 0 ? (marginBrl / revenueBrl) * 100 : 300 // 300% standard baseline margin

  return {
    finance: {
      creditsSold,
      revenueBrl,
      creditsConsumed,
      estimatedAiCostBrl,
      marginBrl,
      marginPercent,
    },
    users: {
      freeUsers,
      purchasingUsers,
      conversionRate,
      ticketMédioBrl,
    },
  }
}
