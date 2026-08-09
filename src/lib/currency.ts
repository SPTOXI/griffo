/**
 * Moeda da cobrança, decidida no servidor — e o mesmo mapa usado pelo cliente
 * para exibir o preço. Sem uma fonte única, a página mostrava um valor e o
 * checkout cobrava em outra moeda: as duas listas de países da zona do euro
 * haviam divergido (11 entradas no catálogo contra 20 aqui).
 *
 * Sem `server-only` de propósito — o arquivo não toca banco nem segredo, e
 * precisa ser importável pelo componente de planos.
 *
 * `POST /api/credits/purchase` aceitava `currency` no corpo da requisição, sem
 * conferir contra a origem do usuário. Como `priceUsd`/`priceEur` são cerca de
 * 8% mais caros que `priceBrl` na cotação de referência, bastava enviar
 * `currency: 'brl'` de qualquer lugar do mundo para pagar o preço brasileiro.
 * Com público só no Brasil isso era fuga marginal; num produto global vira o
 * comportamento padrão de qualquer usuário atento.
 */

export type Currency = 'brl' | 'usd' | 'eur'

export const SUPPORTED_CURRENCIES: Currency[] = ['brl', 'usd', 'eur']

/** Zona do euro. Fora dela, a Europa não usa EUR (GB, CH, PL, SE…). */
const EUR_COUNTRIES = [
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
]

const BRL_COUNTRIES = ['BR']

/** País informado pela borda (Vercel/Cloudflare). Não é falsificável pelo cliente. */
export function getRequestCountry(req: Request): string {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code') ||
    ''
  ).toUpperCase().trim()
}

export function currencyForCountry(country: string): Currency {
  const code = country.toUpperCase().trim()
  if (BRL_COUNTRIES.includes(code)) return 'brl'
  if (EUR_COUNTRIES.includes(code)) return 'eur'
  if (!code) return 'brl' // sem geolocalização (dev, testes): mantém o padrão histórico
  return 'usd'
}

export function resolveCurrency(req: Request): Currency {
  return currencyForCountry(getRequestCountry(req))
}

/**
 * Cotações de referência para converter na LEITURA.
 *
 * Deliberadamente aproximadas e centralizadas: servem para consolidar o painel
 * numa moeda só, não para contabilidade. O valor cobrado fica gravado sem
 * conversão em `CreditTransaction.amountOriginal` + `currency`, então a
 * cotação pode ser corrigida depois sem reescrever histórico — que é
 * exatamente o que a versão anterior impedia, ao gravar `amount_total / 100`
 * direto em `costBrl` qualquer que fosse a moeda.
 */
export const FX_TO_BRL: Record<Currency, number> = {
  brl: 1,
  usd: 5.4,
  eur: 5.9,
}

export function toBrl(amount: number, currency: string): number {
  const rate = FX_TO_BRL[(currency || 'brl').toLowerCase() as Currency] ?? 1
  return Math.round(amount * rate * 100) / 100
}

/** Normaliza o que a Stripe devolve (`session.currency`) para o tipo interno. */
export function normalizeCurrency(raw: string | null | undefined): Currency {
  const lower = (raw || 'brl').toLowerCase()
  return (SUPPORTED_CURRENCIES as string[]).includes(lower) ? (lower as Currency) : 'brl'
}
