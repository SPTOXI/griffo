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
  pricePerCredit: number
  popular?: boolean
  entryOnly?: boolean
  desc: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'entrada',
    name: 'Plano de Entrada',
    credits: 40, // 30 pagos + 10 bônus pós-compra = 40 cr (2 avaliações completas de 20 cr)
    paidCredits: 30,
    bonusCredits: 10,
    priceBrl: 9.90,
    pricePerCredit: 0.2475,
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
    pricePerCredit: 0.299,
    desc: '100 créditos no saldo (suficiente para 5 avaliações completas de currículo)',
  },
  {
    id: 'carreira',
    name: 'Pacote Carreira',
    credits: 500,
    paidCredits: 500,
    bonusCredits: 0,
    priceBrl: 99.90,
    pricePerCredit: 0.199,
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
    pricePerCredit: 0.166,
    desc: '1.500 créditos no saldo (suficiente para 75 avaliações completas de currículo)',
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
    select: { credits: true, role: true, disabled: true },
  })

  if (user?.disabled) {
    return {
      success: false,
      currentBalance: 0,
      error: 'Sua conta está desabilitada pelo administrador do sistema.',
    }
  }

  // Admin users have unlimited credits and bypass deductions
  if (user?.role === 'admin') {
    return {
      success: true,
      currentBalance: 999999,
    }
  }

  const currentBalance = user?.credits ?? 0

  if (currentBalance < amount) {
    return {
      success: false,
      currentBalance,
      error: 'Seu saldo de créditos é insuficiente. Adquira o Plano de Entrada (R$ 9,90) ou recarregue seu saldo para continuar utilizando a IA.',
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

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'admin') {
    return { success: true, newBalance: 999999 }
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      credits: { increment: amount },
    },
  })

  await db.creditTransaction.create({
    data: {
      userId,
      amount: amount,
      type: 'refund',
      description: `Reembolso automático: ${reason}`,
    },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'credit_refund',
      meta: JSON.stringify({ amount, reason, newBalance: updatedUser.credits }),
    },
  })

  return {
    success: true,
    newBalance: updatedUser.credits,
  }
}

export async function purchaseCreditPackage(
  userId: string,
  packageId: string
): Promise<{ success: boolean; packageInfo?: CreditPackage; newBalance?: number; postPurchaseMessage?: string; error?: string }> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) {
    return { success: false, error: 'Pacote de créditos inválido.' }
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      credits: { increment: pkg.credits },
      plan: pkg.id,
    },
  })

  const transactionDesc = pkg.bonusCredits > 0
    ? `${pkg.name} (${pkg.credits} créditos ativados)`
    : `${pkg.name} (${pkg.credits} créditos ativados)`

  await db.creditTransaction.create({
    data: {
      userId,
      amount: pkg.credits,
      type: 'purchase',
      description: transactionDesc,
      costBrl: pkg.priceBrl,
    },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'credit_purchase',
      meta: JSON.stringify({ packageId, credits: pkg.credits, bonusCredits: pkg.bonusCredits, priceBrl: pkg.priceBrl }),
    },
  })

  const postPurchaseMessage = pkg.bonusCredits > 0
    ? `Parabéns! ${pkg.name} ativado com sucesso. Você ganhou 10 créditos adicionais!`
    : `${pkg.name} ativado com sucesso! +${pkg.credits} créditos adicionados ao seu saldo.`

  return {
    success: true,
    packageInfo: pkg,
    newBalance: updatedUser.credits,
    postPurchaseMessage,
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
