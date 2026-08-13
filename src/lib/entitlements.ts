import 'server-only'
import { db } from './db'
import { PACK_SIZE, type Tier } from './pricing/catalog'
import { CREDITS_PER_ANALYSIS, analysesForCredits } from './pricing/migration'

/**
 * Direito de uso, no lugar do saldo de créditos.
 *
 * O modelo antigo cobrava por ação: 20 créditos pela análise, 10 pela
 * reescrita, 15 pela carta, 1 pelo download. Cada rota reservava, liquidava e
 * estornava — e cada uma podia falhar sozinha, deixando o usuário com um laudo
 * pago e uma carta que ele ainda precisava comprar.
 *
 * Agora existe UM movimento cobrável: destravar um currículo. Ele consome uma
 * análise do saldo e libera os nove itens daquele currículo para sempre. As
 * rotas derivadas não cobram nada; elas só perguntam se o currículo está
 * destravado.
 *
 * Isso muda a natureza do erro possível. Antes, uma falha de IA no meio do
 * caminho tinha que devolver crédito, e devolver crédito duas vezes criava
 * saldo do nada. Agora uma falha na carta de apresentação não custa nada ao
 * usuário: o currículo continua destravado e ele pede de novo.
 */

export interface PurchaseGrant {
  userId: string
  quantity: number
  tier: Tier
  priceUsd: number
  paymentCountry: string
  currency: string
  amountLocal: number
  /** `checkout.session.id`. É a chave de idempotência da compra. */
  paymentRef: string
  stripeEventId?: string | null
  description: string
}

export async function getAnalysisBalance(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { analysisBalance: true },
  })
  return user?.analysisBalance ?? 0
}

/**
 * Credita análises compradas.
 *
 * A idempotência é a restrição única de `paymentRef` no banco, não uma consulta
 * anterior: o webhook e a verificação direta da sessão correm em paralelo por
 * construção — o navegador volta do checkout no mesmo instante em que a Stripe
 * entrega o evento —, e qualquer verificação feita ANTES da escrita perde essa
 * corrida. Aqui, quem chega em segundo lugar colide com o índice e desiste.
 */
export async function grantAnalyses(grant: PurchaseGrant): Promise<{
  granted: boolean
  balance: number
}> {
  try {
    const user = await db.$transaction(async (tx) => {
      await tx.analysisLedger.create({
        data: {
          userId: grant.userId,
          type: 'purchase',
          delta: grant.quantity,
          description: grant.description,
          tier: grant.tier,
          priceUsd: grant.priceUsd,
          paymentCountry: grant.paymentCountry || null,
          currency: grant.currency,
          amountLocal: grant.amountLocal,
          paymentRef: grant.paymentRef,
          stripeEventId: grant.stripeEventId || null,
        },
      })

      return tx.user.update({
        where: { id: grant.userId },
        data: {
          analysisBalance: { increment: grant.quantity },
          // O país do pagamento passa a mandar na faixa das compras seguintes.
          ...(grant.paymentCountry ? { paymentCountry: grant.paymentCountry } : {}),
        },
        select: { analysisBalance: true },
      })
    })

    return { granted: true, balance: user.analysisBalance }
  } catch (e: any) {
    // P2002 = violação de índice único em `paymentRef`: este pagamento já foi
    // creditado pelo outro caminho. Não é erro, é a idempotência funcionando.
    if (e?.code === 'P2002') {
      return { granted: false, balance: await getAnalysisBalance(grant.userId) }
    }
    throw e
  }
}

export interface UnlockResult {
  ok: boolean
  /** Já estava destravado: nada foi cobrado nesta chamada. */
  alreadyUnlocked: boolean
  balance: number
  error?: string
}

/**
 * Destrava um currículo, consumindo uma análise do saldo.
 *
 * Duas propriedades importam:
 *
 * 1. **Idempotente.** Um currículo já destravado não é cobrado de novo, nem
 *    por duplo clique nem por reprocessamento. O destrave é um estado do
 *    currículo, não um evento repetível.
 * 2. **Condicional na escrita.** O decremento exige `analysisBalance >= 1` na
 *    própria cláusula do update, então duas requisições simultâneas com saldo
 *    1 não conseguem destravar dois currículos.
 */
export async function unlockAnalysis(
  userId: string,
  resumeId: string
): Promise<UnlockResult> {
  const [user, resume] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true, disabled: true, analysisBalance: true } }),
    db.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true, unlockedAt: true } }),
  ])

  if (!user) return { ok: false, alreadyUnlocked: false, balance: 0, error: 'Usuário não encontrado.' }
  if (user.disabled) return { ok: false, alreadyUnlocked: false, balance: 0, error: 'Sua conta está suspensa.' }
  if (!resume) return { ok: false, alreadyUnlocked: false, balance: user.analysisBalance, error: 'Currículo não encontrado.' }

  if (resume.unlockedAt) {
    return { ok: true, alreadyUnlocked: true, balance: user.analysisBalance }
  }

  // Administrador não consome saldo — e não gera linha no ledger, porque não
  // houve movimento de valor nenhum para auditar.
  if (user.role === 'admin') {
    await db.resume.update({ where: { id: resumeId }, data: { unlockedAt: new Date() } })
    return { ok: true, alreadyUnlocked: false, balance: user.analysisBalance }
  }

  if (user.analysisBalance < 1) {
    return {
      ok: false,
      alreadyUnlocked: false,
      balance: user.analysisBalance,
      error: 'Você ainda não tem uma análise disponível.',
    }
  }

  try {
    const balance = await db.$transaction(async (tx) => {
      // A cláusula `unlockedAt: null` fecha a corrida entre dois destraves do
      // mesmo currículo: o segundo não encontra a linha e o saldo não é tocado.
      const claimed = await tx.resume.updateMany({
        where: { id: resumeId, userId, unlockedAt: null },
        data: { unlockedAt: new Date() },
      })
      if (claimed.count === 0) {
        // Outra requisição destravou primeiro. Sem cobrança dupla.
        const current = await tx.user.findUnique({
          where: { id: userId },
          select: { analysisBalance: true },
        })
        return current?.analysisBalance ?? 0
      }

      const updated = await tx.user.update({
        where: { id: userId, analysisBalance: { gte: 1 } },
        data: { analysisBalance: { decrement: 1 } },
        select: { analysisBalance: true },
      })

      await tx.analysisLedger.create({
        data: {
          userId,
          type: 'unlock',
          delta: -1,
          description: 'Análise Completa liberada para um currículo',
          resumeId,
        },
      })

      return updated.analysisBalance
    })

    return { ok: true, alreadyUnlocked: false, balance }
  } catch {
    // A atualização condicional falhou: o saldo acabou entre a leitura e a
    // escrita. Nada a desfazer — a transação inteira reverte, incluindo a marca
    // de destrave. Uma compensação manual aqui seria pior que inútil: ela
    // apagaria o `unlockedAt` que OUTRA requisição concorrente acabou de
    // gravar e cobrar.
    return {
      ok: false,
      alreadyUnlocked: false,
      balance: await getAnalysisBalance(userId),
      error: 'Saldo insuficiente (operação concorrente detectada).',
    }
  }
}

/**
 * O currículo está liberado?
 *
 * É a única pergunta que as rotas derivadas — reescrita, carta, orientação,
 * mídias sociais, download — precisam fazer. Nenhuma delas cobra nada.
 */
export async function isResumeUnlocked(userId: string, resumeId: string): Promise<boolean> {
  const [resume, user] = await Promise.all([
    db.resume.findFirst({ where: { id: resumeId, userId }, select: { unlockedAt: true } }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])
  if (user?.role === 'admin') return true
  return Boolean(resume?.unlockedAt)
}

export interface EntitlementCheck {
  ok: boolean
  status: number
  error?: string
  code?: 'ANALYSIS_REQUIRED' | 'RESUME_NOT_FOUND'
  balance?: number
}

/** Guarda das rotas derivadas: currículo destravado libera tudo; senão, paywall. */
export async function requireUnlockedResume(
  userId: string,
  resumeId: string
): Promise<EntitlementCheck> {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
    select: { unlockedAt: true },
  })
  if (!resume) {
    return { ok: false, status: 404, error: 'Currículo não encontrado.', code: 'RESUME_NOT_FOUND' }
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, analysisBalance: true } })
  if (user?.role === 'admin' || resume.unlockedAt) return { ok: true, status: 200 }

  return {
    ok: false,
    status: 402,
    error: 'Este currículo ainda não tem uma Análise Completa. Libere a análise para receber todos os itens.',
    code: 'ANALYSIS_REQUIRED',
    balance: user?.analysisBalance ?? 0,
  }
}

/**
 * Converte o saldo antigo de créditos de UM usuário.
 *
 * A regra de conversão vive em `pricing/migration.ts`, que é puro e pode ser
 * importado por scripts de linha de comando. Esta função é a parte que toca o
 * banco. Idempotente por `creditsMigratedAt`.
 */
export async function migrateCreditBalance(userId: string): Promise<{
  migrated: boolean
  credits: number
  analyses: number
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true, creditsMigratedAt: true },
  })
  if (!user || user.creditsMigratedAt) {
    return { migrated: false, credits: user?.credits ?? 0, analyses: 0 }
  }

  const analyses = analysesForCredits(user.credits)

  await db.$transaction(async (tx) => {
    // A condição `creditsMigratedAt: null` é o que impede converter duas vezes
    // se o script for executado em paralelo com ele mesmo.
    const claimed = await tx.user.updateMany({
      where: { id: userId, creditsMigratedAt: null },
      data: { creditsMigratedAt: new Date(), analysisBalance: { increment: analyses } },
    })
    if (claimed.count === 1 && analyses > 0) {
      await tx.analysisLedger.create({
        data: {
          userId,
          type: 'migration',
          delta: analyses,
          description: `Conversão de ${user.credits} créditos em ${analyses} ${
            analyses === 1 ? 'análise completa' : 'análises completas'
          } (${CREDITS_PER_ANALYSIS} créditos = 1 análise, arredondado a favor do usuário)`,
        },
      })
    }
  })

  return { migrated: true, credits: user.credits, analyses }
}

export { PACK_SIZE }
export { CREDITS_PER_ANALYSIS, analysesForCredits }
