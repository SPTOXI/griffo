import 'server-only'
import type Stripe from 'stripe'
import { db } from '../db'
import { grantAnalyses, unlockAnalysis } from '../entitlements'
import {
  PACK_SIZE,
  ZERO_DECIMAL_CURRENCIES,
  priceFor,
  tierForCountry,
  type Tier,
} from '../pricing/catalog'
import { paymentCountryFromStripe } from '../pricing/resolve'

/**
 * Entrega do que foi pago, num lugar só.
 *
 * O webhook e a verificação direta da sessão sempre fizeram a mesma coisa em
 * dois códigos diferentes — e por isso divergiram: a descrição da transação,
 * o campo `plan` gravado e o tratamento de moeda eram distintos entre eles. Um
 * pagamento entregue por caminhos diferentes produzia registros diferentes do
 * mesmo fato.
 *
 * Aqui é um caminho só, chamado pelos dois. A idempotência mora em
 * `grantAnalyses`, no índice único de `paymentRef`.
 */

export interface FulfillResult {
  granted: boolean
  analyses: number
  balance: number
  reason?: 'not_paid' | 'missing_metadata' | 'already_fulfilled'
}

/**
 * País de onde o dinheiro realmente saiu.
 *
 * Vale a chamada extra: o país do cartão é o único dado que a regra de faixas
 * aceita, e ele só existe no `charge`, não na sessão. Sem ele restaria o
 * endereço digitado pelo comprador — que é exatamente o que a regra recusa.
 */
async function chargeFor(stripe: Stripe, session: any): Promise<any | null> {
  const intentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (!intentId) return null
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId, {
      expand: ['latest_charge'],
    })
    const charge = (intent as any).latest_charge
    return typeof charge === 'object' ? charge : null
  } catch (e) {
    console.error('[fulfill] Não foi possível ler o charge do pagamento:', e)
    return null
  }
}

export async function fulfillCheckoutSession(
  stripe: Stripe,
  session: any,
  eventId?: string | null
): Promise<FulfillResult> {
  if (session?.payment_status !== 'paid') {
    return { granted: false, analyses: 0, balance: 0, reason: 'not_paid' }
  }

  const metadata = session.metadata || {}
  const userId: string | undefined = metadata.user_id || session.client_reference_id
  const sku: string = metadata.sku === 'pack5' ? 'pack5' : 'single'
  const analyses = parseInt(metadata.analyses || '', 10) || (sku === 'pack5' ? PACK_SIZE : 1)

  if (!userId) {
    console.error('[fulfill] Sessão sem user_id:', session.id)
    return { granted: false, analyses: 0, balance: 0, reason: 'missing_metadata' }
  }

  const charge = await chargeFor(stripe, session)
  const paymentCountry = paymentCountryFromStripe({ charge, session })
  const chargedTier = (parseInt(metadata.tier || '', 10) || tierForCountry(metadata.country)) as Tier

  // O valor gravado é o que a Stripe cobrou, sem conversão. `price_usd` é a
  // conversão de referência, para telemetria — não é o que entrou no caixa.
  const currency = (session.currency || metadata.currency || 'usd').toUpperCase()
  const amountLocal =
    (session.amount_total || 0) / (ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100)
  const priceUsd = parseFloat(metadata.price_usd || '') || 0

  const result = await grantAnalyses({
    userId,
    quantity: analyses,
    tier: chargedTier,
    priceUsd,
    paymentCountry,
    currency,
    amountLocal,
    paymentRef: session.id,
    stripeEventId: eventId || null,
    description:
      analyses > 1
        ? `Compra de ${analyses} Análises Completas (Faixa ${chargedTier})`
        : `Compra de 1 Análise Completa (Faixa ${chargedTier})`,
  })

  if (!result.granted) {
    return { granted: false, analyses, balance: result.balance, reason: 'already_fulfilled' }
  }

  await recordTierAudit({ userId, sessionId: session.id, chargedTier, paymentCountry, metadata })

  // Compra avulsa feita a partir de um currículo: destrava esse currículo aqui,
  // no servidor. Sem isto o usuário volta do checkout, já pagou, e ainda
  // precisa clicar de novo no mesmo botão que o levou a pagar — o que é
  // exatamente a fricção que a recompra de um clique existe para eliminar.
  //
  // Só para o SKU avulso: no pacote de 5 o usuário escolhe onde gastar, e
  // gastar por ele seria decidir no lugar dele.
  const resumeId = metadata.resume_id
  let balance = result.balance
  if (sku === 'single' && resumeId) {
    const unlock = await unlockAnalysis(userId, resumeId)
    if (unlock.ok) balance = unlock.balance
  }

  return { granted: true, analyses, balance }
}

/**
 * Registra a faixa cobrada contra a faixa do país do pagamento.
 *
 * Quando o checkout é criado, o país do dinheiro ainda não existe: o preço sai
 * da borda, que é palpite. Só o pagamento revela o país do cartão — e aí já não
 * dá para recobrar. O que dá para fazer é anotar a divergência: a próxima
 * compra do mesmo usuário já usa o país do pagamento (`User.paymentCountry`,
 * gravado por `grantAnalyses`), e uma divergência recorrente aparece na
 * auditoria em vez de sumir na margem.
 */
async function recordTierAudit(input: {
  userId: string
  sessionId: string
  chargedTier: Tier
  paymentCountry: string
  metadata: Record<string, string>
}): Promise<void> {
  const { userId, sessionId, chargedTier, paymentCountry, metadata } = input
  const actualTier = paymentCountry ? tierForCountry(paymentCountry) : chargedTier
  const mismatch = Boolean(paymentCountry) && actualTier !== chargedTier

  try {
    await db.auditLog.create({
      data: {
        userId,
        action: mismatch ? 'purchase_tier_mismatch' : 'purchase_fulfilled',
        meta: JSON.stringify({
          sessionId,
          chargedTier,
          actualTier,
          paymentCountry,
          suggestedCountry: metadata.country || null,
          countrySource: metadata.country_source || null,
          expectedUsd: paymentCountry ? priceFor(paymentCountry, metadata.sku === 'pack5' ? 'pack5' : 'single').amountUsd : null,
          chargedUsd: parseFloat(metadata.price_usd || '') || null,
        }),
      },
    })
  } catch (e) {
    // Auditoria não pode derrubar uma entrega já concluída.
    console.error('[fulfill] Falha ao registrar auditoria de faixa:', e)
  }
}
