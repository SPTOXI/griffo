import { normalizeCountry, tierConfig, tierForCountry } from './catalog'

/**
 * Métodos de pagamento locais — o que é obrigatório e o que a Stripe entrega.
 *
 * A regra do brief é econômica, não estética: nas Faixas 3 e 4 a taxa fixa do
 * cartão internacional come cerca de 10% da receita, e sem método local a
 * Faixa 4 simplesmente não fecha. Por isso o método local é requisito, não
 * enfeite.
 *
 * O que a Stripe cobre hoje, e o que não cobre, está declarado aqui em vez de
 * escondido numa chamada que falha em produção. `pix` é um `payment_method_type`
 * da Stripe e funciona com conta brasileira e cobrança em BRL. `upi` (Índia) e
 * `gopay`/`ovo` (Indonésia) NÃO são: exigem adquirente local. Ficam declarados
 * no catálogo como requisito do mercado e reportados por
 * `pendingLocalMethods`, para que a lacuna seja visível — e não descoberta pela
 * queda de conversão.
 */

/**
 * Métodos locais que a Stripe aceita, por país, quando a moeda bate.
 *
 * Habilitar um método aqui só faz sentido se ele estiver ATIVO na conta Stripe.
 * A Stripe recusa a sessão inteira quando recebe um método desabilitado; o
 * checkout se recupera repetindo só com cartão, mas isso custa uma ida e volta
 * perdida em cada compra — no caminho quente, com o comprador esperando.
 *
 * `STRIPE_PIX_ENABLED=true` liga o Pix. Fica desligado por padrão porque o Pix
 * exige conta Stripe registrada no Brasil: contas de outros países cobram em
 * reais normalmente, mas não têm acesso a ele. Ligar sem ter a conta certa não
 * quebra a venda — a recuperação continua lá —, só desperdiça a chamada.
 */
const PIX_ENABLED = process.env.STRIPE_PIX_ENABLED === 'true'

const STRIPE_LOCAL_METHODS: Record<string, { methods: string[]; currency: string }> = {
  ...(PIX_ENABLED ? { BR: { methods: ['pix'], currency: 'BRL' } } : {}),
}

/** Métodos declarados no catálogo que a Stripe não cobre. */
export function pendingLocalMethods(country: string | null | undefined): string[] {
  const code = normalizeCountry(country)
  const declared = tierConfig(tierForCountry(code)).localPaymentMethods.filter((m) => m !== 'card')
  const served = STRIPE_LOCAL_METHODS[code]?.methods ?? []
  return declared.filter((m) => !served.includes(m))
}

/**
 * `payment_method_types` da sessão de checkout.
 *
 * Cartão sempre; o método local entra quando a Stripe o serve naquele país com
 * aquela moeda. Passar um método que a conta não tem habilitado faz a criação
 * da sessão falhar inteira — por isso a lista é conservadora por construção.
 */
export function stripePaymentMethodTypes(
  country: string | null | undefined,
  currency: string
): string[] {
  const code = normalizeCountry(country)
  const local = STRIPE_LOCAL_METHODS[code]
  if (local && local.currency === currency.toUpperCase()) {
    return ['card', ...local.methods]
  }
  return ['card']
}

/** Rótulos para a interface. O paywall anuncia o método local antes do clique. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Cartão',
  pix: 'Pix',
  upi: 'UPI',
  gopay: 'GoPay',
  ovo: 'OVO',
}

export function localMethodLabels(country: string | null | undefined): string[] {
  const code = normalizeCountry(country)
  const served = stripePaymentMethodTypes(code, '')
  const local = STRIPE_LOCAL_METHODS[code]
  const methods = local ? ['card', ...local.methods] : served
  return methods.map((m) => PAYMENT_METHOD_LABELS[m] || m)
}
