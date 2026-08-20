import 'server-only'
import { normalizeCountry, priceFor, type ResolvedPrice, type Sku } from './catalog'

/**
 * De onde saiu o país que definiu o preço.
 *
 * A distinção não é decorativa: `payment` é a única origem que a regra do brief
 * aceita como definitiva. `edge` é palpite — vale para escolher a moeda que a
 * pessoa vê antes de existir qualquer pagamento, e é substituído assim que um
 * pagamento confirma de onde o dinheiro veio.
 */
export type CountrySource = 'payment' | 'edge' | 'default'

export interface PricingContext {
  country: string
  source: CountrySource
}

/** País informado pela borda (Vercel/Cloudflare). Não é falsificável pelo cliente. */
/**
 * O país de onde a requisição veio.
 *
 * `cf-ipcountry` vem PRIMEIRO, e a ordem é a correção de um erro real.
 *
 * O domínio está atrás do Cloudflare. Quando ele proxia, quem se conecta à
 * Vercel é um nó do Cloudflare, não a pessoa — e `x-vercel-ip-country`, que a
 * Vercel calcula do IP conectante, passa a descrever o data center do
 * Cloudflare. `cf-ipcountry` é calculado do IP do VISITANTE de verdade.
 *
 * Com a ordem antiga, um usuário no Brasil podia ser lido como outro país. Isso
 * não é cosmético: o país de borda decide a FAIXA DE PREÇO (um brasileiro veria
 * US$ 12,90 da Faixa 1 em vez do preço em real) e alimenta o mercado
 * profissional da análise (o laudo saía com convenção de currículo americano).
 *
 * Quando o Cloudflare não está proxiando, o cabeçalho simplesmente não existe e
 * a leitura cai na da Vercel, como antes.
 *
 * `x-country-code` saiu: nada no produto o emite, e qualquer cliente pode
 * mandá-lo para escolher a própria faixa de preço. Os dois que ficaram são
 * postos pela infraestrutura e sobrescrevem o que o cliente enviar.
 */
export function edgeCountry(req: Request): string {
  return normalizeCountry(
    req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || ''
  )
}

/**
 * O país que decide a faixa.
 *
 * Ordem deliberada: país de pagamento conhecido > borda > padrão. O IP entra
 * só enquanto ninguém pagou nada ainda; a partir da primeira cobrança
 * confirmada é o país do cartão (ou do método local) que manda, e trocar de
 * VPN deixa de mudar o preço.
 */
export function resolvePricingContext(
  req: Request,
  user?: { paymentCountry?: string | null } | null
): PricingContext {
  const paid = normalizeCountry(user?.paymentCountry)
  if (paid) return { country: paid, source: 'payment' }

  const edge = edgeCountry(req)
  if (edge) return { country: edge, source: 'edge' }

  return { country: 'US', source: 'default' }
}

export function priceForRequest(
  req: Request,
  user: { paymentCountry?: string | null } | null | undefined,
  sku: Sku
): { price: ResolvedPrice; context: PricingContext } {
  const context = resolvePricingContext(req, user)
  return { price: priceFor(context.country, sku), context }
}

/**
 * País do meio de pagamento, extraído do que a Stripe devolve.
 *
 * A ordem vai do mais específico para o mais frouxo: o país emissor do cartão
 * (o "BIN" do brief) é o dado mais difícil de forjar; o endereço de cobrança é
 * digitado pelo comprador; o país da conta do cliente é o último recurso. Só o
 * primeiro é realmente o país do dinheiro, e é por isso que ele vem primeiro.
 */
export function paymentCountryFromStripe(payload: {
  charge?: any
  session?: any
}): string {
  const { charge, session } = payload
  const card = charge?.payment_method_details?.card
  const candidates = [
    card?.country,
    charge?.payment_method_details?.pix?.country,
    charge?.billing_details?.address?.country,
    session?.customer_details?.address?.country,
    session?.metadata?.country,
  ]
  for (const candidate of candidates) {
    const code = normalizeCountry(candidate)
    if (code) return code
  }
  return ''
}
