import 'server-only'
import { db } from '../db'
import { getStripe } from '../stripe'
import { sendEmail } from '../email/send'
import { getAppUrl, getDigestFrom, getDigestReplyTo } from '../env'
import { QUARTERLY_ANALYSES } from '../pricing/catalog'
import {
  REFUND_WINDOW_DAYS,
  dueAtFor,
  eligibilityOf,
  isDeliveryFailure,
  needsReminder,
  type RefundEligibility,
} from './rules'

/**
 * Reembolso (§2.163): abrir o pedido, achar sozinho a análise paga que não
 * foi entregue, avisar o admin e devolver o dinheiro pela Stripe quando ele
 * aprovar. As regras ficam em `rules.ts`; aqui só os dados e os efeitos.
 */

const DAY = 24 * 60 * 60 * 1000

type Purchase = {
  userId: string
  paymentRef: string | null
  createdAt: Date
  delta: number
  currency: string | null
  amountLocal: number | null
}

/** A análise de algum currículo destravado depois da compra ficou sem sair. */
async function failedResumeAfter(userId: string, since: Date, now: Date): Promise<string | null> {
  const unlocks = await db.analysisLedger.findMany({
    where: { userId, type: 'unlock', createdAt: { gte: since }, resumeId: { not: null } },
    select: { resumeId: true },
  })
  for (const u of unlocks) {
    const resume = await db.resume.findUnique({
      where: { id: u.resumeId! },
      select: { id: true, unlockedAt: true, analysisJson: true },
    })
    if (!resume) continue
    const job = await db.analysisJob.findFirst({
      where: { resumeId: resume.id },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    })
    // Sem job a análise nunca foi pedida: não é falha nossa.
    if (!job) continue
    if (
      isDeliveryFailure(
        { unlockedAt: resume.unlockedAt, analysisReady: Boolean(resume.analysisJson), jobFailed: job.status === 'failed' },
        now
      ) &&
      job.status !== 'completed'
    ) {
      return resume.id
    }
  }
  return null
}

async function factsFor(p: Purchase, now: Date) {
  const user = await db.user.findUnique({ where: { id: p.userId }, select: { analysisBalance: true } })
  const failedResumeId = await failedResumeAfter(p.userId, p.createdAt, now)
  const eligibility = eligibilityOf(
    { purchasedAt: p.createdAt, quantity: p.delta, balance: user?.analysisBalance ?? 0, hasFailedDelivery: Boolean(failedResumeId) },
    now
  )
  return { eligibility, failedResumeId }
}

/**
 * Abre o pedido. Um por pagamento (`paymentRef` único): pedir de novo devolve
 * o que já existe. Fora da regra (serviço já executado) não abre: devolve
 * `outside_rules` sem `id`, e a rota responde 403.
 */
export async function openRefundRequest(input: {
  userId: string
  paymentRef: string
  source: 'support' | 'auto_failure'
  reason?: string | null
  now?: Date
}): Promise<{ created: boolean; id: string; eligibility: RefundEligibility } | null> {
  const now = input.now ?? new Date()
  const purchase = await db.analysisLedger.findFirst({
    where: { userId: input.userId, type: 'purchase', paymentRef: input.paymentRef },
    select: { userId: true, paymentRef: true, createdAt: true, delta: true, currency: true, amountLocal: true },
  })
  if (!purchase) return null
  const existing = await db.refundRequest.findUnique({ where: { paymentRef: input.paymentRef } })
  if (existing) return { created: false, id: existing.id, eligibility: existing.eligibility as RefundEligibility }

  const { eligibility, failedResumeId } = await factsFor(purchase, now)
  // Regra do operador (30/10/2026): reembolso só se o serviço não foi
  // executado — análise não usada (até 7 dias) ou paga e não entregue.
  if (eligibility === 'outside_rules') return { created: false, id: '', eligibility }
  try {
    const row = await db.refundRequest.create({
      data: {
        userId: input.userId,
        paymentRef: input.paymentRef,
        source: input.source,
        eligibility,
        reason: input.reason?.slice(0, 1000) || null,
        resumeId: failedResumeId,
        quantity: purchase.delta,
        currency: purchase.currency,
        amountLocal: purchase.amountLocal,
        dueAt: dueAtFor(now),
      },
    })
    // Pedido registrado pelo próprio admin (veio pelo suporte) não precisa de
    // aviso de abertura; o lembrete de 4 h vale para os dois.
    if (input.source === 'auto_failure') {
      await notifyAdmin(row.id, 'new').catch((e: any) => console.warn('[refunds] aviso ao admin não saiu:', e?.message || e))
    }
    return { created: true, id: row.id, eligibility }
  } catch (e: any) {
    // Dois pedidos ao mesmo tempo: o segundo colide no índice único.
    if (e?.code === 'P2002') {
      const row = await db.refundRequest.findUnique({ where: { paymentRef: input.paymentRef } })
      return row ? { created: false, id: row.id, eligibility: row.eligibility as RefundEligibility } : null
    }
    throw e
  }
}

/**
 * Análise paga que não saiu: abre o caso sem a pessoa pedir. Roda de hora em
 * hora no cron `visitor-leads`.
 */
export async function detectDeliveryFailures(now: Date = new Date()): Promise<number> {
  const unlocks = await db.analysisLedger.findMany({
    where: { type: 'unlock', resumeId: { not: null }, createdAt: { gte: new Date(now.getTime() - REFUND_WINDOW_DAYS * DAY) } },
    select: { userId: true, createdAt: true },
    take: 500,
  })
  let opened = 0
  const seen = new Set<string>()
  for (const u of unlocks) {
    // A compra que pagou este destrave: a última paga antes dele.
    const purchase = await db.analysisLedger.findFirst({
      where: { userId: u.userId, type: 'purchase', paymentRef: { not: null }, createdAt: { lte: u.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, paymentRef: true, createdAt: true, delta: true, currency: true, amountLocal: true },
    })
    if (!purchase?.paymentRef || seen.has(purchase.paymentRef)) continue
    seen.add(purchase.paymentRef)
    const { eligibility } = await factsFor(purchase, now)
    if (eligibility !== 'failure') continue
    const r = await openRefundRequest({ userId: u.userId, paymentRef: purchase.paymentRef, source: 'auto_failure', now })
    if (r?.created) opened++
  }
  return opened
}

/** Lembra o admin dos pedidos a 4 h do fim do prazo. */
export async function sendRefundReminders(now: Date = new Date()): Promise<number> {
  const pending = await db.refundRequest.findMany({
    where: { status: 'pending', remindedAt: null },
    select: { id: true, status: true, dueAt: true, remindedAt: true },
  })
  let sent = 0
  for (const r of pending) {
    if (!needsReminder(r, now)) continue
    if (await notifyAdmin(r.id, 'reminder').catch(() => false)) sent++
  }
  return sent
}

const ELIGIBILITY_LABEL: Record<RefundEligibility, string> = {
  unused: 'dentro da regra: até 7 dias e análise não usada',
  failure: 'dentro da regra: até 7 dias, análise paga e não entregue',
  outside_rules: 'FORA da regra (fora dos 7 dias ou análise já usada) — decisão sua',
}

/**
 * E-mail ao admin (`ADMIN_ALERT_EMAIL`, no painel; sem ele, as contas de admin). Só marca como avisado se
 * o e-mail saiu: um aviso que não chegou não pode contar como dado.
 */
async function notifyAdmin(id: string, kind: 'new' | 'reminder'): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  // Sem `ADMIN_ALERT_EMAIL` configurado (era o caso em 30/10/2026), vai para
  // as contas de admin: um prazo de 24 h não pode depender de alguém lembrar
  // de preencher a configuração.
  const configured = (await db.systemConfig.findUnique({ where: { key: 'ADMIN_ALERT_EMAIL' } }))?.value?.trim()
  const to =
    configured ||
    (await db.user.findMany({ where: { role: 'admin' }, select: { email: true }, take: 3 })).map((u) => u.email).join(',')
  if (!apiKey || !to) return false
  const r = await db.refundRequest.findUnique({ where: { id }, include: { user: { select: { email: true } } } })
  if (!r) return false
  const amount = r.amountLocal != null && r.currency ? `${r.currency.toUpperCase()} ${r.amountLocal.toFixed(2)}` : '—'
  const due = r.dueAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
  const subject =
    kind === 'new'
      ? `[GriffoWork] Pedido de reembolso ${r.source === 'auto_failure' ? '(falha de entrega)' : ''} — prazo ${due}`
      : `[GriffoWork] Faltam 4 h: reembolso pendente — prazo ${due}`
  const lines = [
    kind === 'new' ? 'Novo pedido de reembolso.' : 'Lembrete: este reembolso vence em até 4 horas.',
    `Cliente: ${r.user.email}`,
    `Origem: ${r.source === 'auto_failure' ? 'aberto pelo sistema (análise paga não entregue)' : 'pedido do cliente pelo suporte'}`,
    `Regra: ${ELIGIBILITY_LABEL[r.eligibility as RefundEligibility] ?? r.eligibility}`,
    `Valor: ${amount} (${r.quantity} análise${r.quantity > 1 ? 's' : ''})`,
    r.reason ? `Motivo: ${r.reason}` : null,
    `Prazo para devolver: ${due}`,
    `Aprovar ou recusar: ${getAppUrl()}/?view=admin (aba Reembolsos)`,
  ].filter(Boolean) as string[]
  for (const addr of to.split(',').map((x) => x.trim()).filter(Boolean)) {
    await sendEmail(
      {
        to: addr,
        subject,
        text: lines.join('\n'),
        html: lines.map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join(''),
      },
      { apiKey, from: getDigestFrom(), replyTo: getDigestReplyTo() }
    )
  }
  await db.refundRequest.update({ where: { id }, data: kind === 'new' ? { notifiedAt: new Date() } : { remindedAt: new Date() } })
  return true
}

/**
 * Devolve o dinheiro pela Stripe e tira da conta o que a compra deu.
 *
 * - Análise não usada (ou fora da regra, quando o saldo ainda cobre): o saldo
 *   volta a não ter aquelas análises; no Recolocação, o passe termina agora.
 * - Falha de entrega: a análise já foi consumida pelo destrave e não saiu; o
 *   saldo não muda.
 *
 * A chave de idempotência da Stripe é o id do pedido: clicar duas vezes não
 * devolve duas vezes.
 */
export async function executeRefund(id: string, adminId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await db.refundRequest.findUnique({ where: { id } })
  if (!r) return { ok: false, error: 'Pedido não encontrado.' }
  if (r.status !== 'pending') return { ok: false, error: 'Este pedido já foi decidido.' }

  const stripe = getStripe()
  let refundId: string
  try {
    const session = await stripe.checkout.sessions.retrieve(r.paymentRef)
    const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    if (!pi) return { ok: false, error: 'A Stripe não tem pagamento ligado a esta compra.' }
    const refund = await stripe.refunds.create(
      { payment_intent: pi, metadata: { refundRequestId: r.id, userId: r.userId } },
      { idempotencyKey: `griffo-refund-${r.id}` }
    )
    refundId = refund.id
  } catch (e: any) {
    console.error('[refunds] Stripe recusou o reembolso:', e?.message || e)
    return { ok: false, error: `A Stripe recusou: ${e?.message || 'erro desconhecido'}` }
  }

  await db.$transaction(async (tx) => {
    if (r.eligibility !== 'failure') {
      const user = await tx.user.findUnique({ where: { id: r.userId }, select: { analysisBalance: true } })
      const take = Math.min(r.quantity, user?.analysisBalance ?? 0)
      if (take > 0) {
        await tx.user.update({ where: { id: r.userId }, data: { analysisBalance: { decrement: take } } })
      }
      await tx.analysisLedger.create({
        data: { userId: r.userId, type: 'refund', delta: -take, description: 'Reembolso da compra' },
      })
      if (r.quantity === QUARTERLY_ANALYSES) {
        await tx.user.updateMany({
          where: { id: r.userId, planEndsAt: { gt: new Date() } },
          data: { planEndsAt: new Date() },
        })
      }
    }
    await tx.refundRequest.update({
      where: { id: r.id },
      data: { status: 'refunded', stripeRefundId: refundId, decidedAt: new Date(), decidedBy: adminId },
    })
  })
  return { ok: true }
}

export async function rejectRefund(id: string, adminId: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const r = await db.refundRequest.updateMany({
    where: { id, status: 'pending' },
    data: { status: 'rejected', decidedAt: new Date(), decidedBy: adminId, adminNote: note.slice(0, 1000) },
  })
  return r.count ? { ok: true } : { ok: false, error: 'Este pedido já foi decidido.' }
}

/**
 * O cliente pede pelo suporte; o admin registra aqui, pelo e-mail da conta.
 * Abre um pedido para cada compra paga dos últimos 7 dias que esteja dentro
 * da regra, e devolve o que encontrou — inclusive o que ficou de fora e por quê.
 */
export async function registerSupportRequest(
  email: string,
  reason: string | null,
  now: Date = new Date()
): Promise<{ found: boolean; opened: number; items: { paymentRef: string; purchasedAt: Date; eligibility: RefundEligibility; already: boolean }[] }> {
  const user = await db.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } }, select: { id: true } })
  if (!user) return { found: false, opened: 0, items: [] }
  const purchases = await db.analysisLedger.findMany({
    where: { userId: user.id, type: 'purchase', paymentRef: { not: null }, createdAt: { gte: new Date(now.getTime() - REFUND_WINDOW_DAYS * DAY) } },
    orderBy: { createdAt: 'desc' },
    select: { userId: true, paymentRef: true, createdAt: true, delta: true, currency: true, amountLocal: true },
  })
  let opened = 0
  const items: { paymentRef: string; purchasedAt: Date; eligibility: RefundEligibility; already: boolean }[] = []
  for (const p of purchases) {
    const existing = await db.refundRequest.findUnique({ where: { paymentRef: p.paymentRef! }, select: { id: true } })
    const { eligibility } = await factsFor(p, now)
    if (!existing && eligibility !== 'outside_rules') {
      const r = await openRefundRequest({ userId: user.id, paymentRef: p.paymentRef!, source: 'support', reason, now })
      if (r?.created) opened++
    }
    items.push({ paymentRef: p.paymentRef!, purchasedAt: p.createdAt, eligibility, already: Boolean(existing) })
  }
  return { found: true, opened, items }
}
