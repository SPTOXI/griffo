/**
 * Catálogo de preços — ponto único de verdade.
 *
 * O produto é UM: a Análise Completa. Uma compra entrega todos os itens de
 * `ANALYSIS_DELIVERABLES`, sem contagem e sem escolha. O que varia é o preço,
 * por faixa de renda do país, e a moeda, que é sempre a local.
 *
 * Nenhum preço pode existir fora deste arquivo. O modelo anterior tinha preço
 * no catálogo de créditos, no script de setup da Stripe, na landing e na tabela
 * de consumo da tela de planos — quatro lugares que divergiram entre si.
 *
 * Client-safe de propósito: sem Prisma, sem `server-only`, sem segredo. A
 * landing e o paywall importam daqui.
 */

export type Tier = 1 | 2 | 3 | 4

/**
 * O que se compra. Não há mais nada à venda.
 *
 * - `single`: uma Análise Completa.
 * - `quarterly`: o Passe Trimestral — `QUARTERLY_ANALYSES` análises e
 *   `QUARTERLY_PASS_DAYS` dias de passe ativo (Radar com buscas automáticas
 *   por e-mail), pago UMA vez, sem renovação automática.
 *
 * O pacote de 5 (`pack5`) saiu em set/2026: o trimestral entrega as mesmas
 * cinco análises e mais, por menos — manter os dois deixaria o pacote
 * invendável (escada invertida).
 */
export type Sku = 'single' | 'quarterly'

/** Quantas análises o Passe Trimestral entrega. */
export const QUARTERLY_ANALYSES = 5

/** Duração do Passe Trimestral. */
export const QUARTERLY_PASS_DAYS = 90

/** Nome interno gravado em `User.plan` enquanto o passe está ativo. */
export const QUARTERLY_PLAN = 'quarterly'

/**
 * Piso absoluto por análise, em USD.
 *
 * Custo direto medido: US$ 1,04 por análise (API com overrun de 1,6x e 8% de
 * retry, mais suporte e infra rateada). Abaixo de US$ 2,60 a venda não paga o
 * custo direto somado aos percentuais sobre a receita — imposto, reserva de
 * chargeback e taxa do meio de pagamento.
 *
 * Nenhum preço, cupom ou promoção pode ficar abaixo disto. `catalog.test.ts`
 * falha se algum preço do catálogo violar o piso, incluindo o unitário dentro
 * do Passe Trimestral.
 */
export const ANALYSIS_FLOOR_USD = 2.6

/** Custo direto total por análise, da planilha `Custo_por_Analise`. */
export const ANALYSIS_DIRECT_COST_USD = 1.0449

export interface RegionalPrice {
  tier: Tier
  countries: string[] // ISO-3166 alpha-2
  displayCurrency: string
  unitPriceUSD: number
  quarterlyPriceUSD: number
  localPaymentMethods: string[]
}

/**
 * As quatro faixas.
 *
 * `displayCurrency` é a moeda de referência da faixa — a que vale para um país
 * da faixa sem entrada própria em `COUNTRY_CURRENCY`. Na prática só a Faixa 1
 * cai nesse caso: ela é também o preço do resto do mundo. Fora da Faixa 1 todo
 * país listado tem moeda própria declarada, porque exibir dólar fora da Faixa 1
 * é proibido (regra 3).
 *
 * `unitPriceUSD` e `quarterlyPriceUSD` são a âncora. O valor efetivamente cobrado
 * é o de `LOCAL_PRICES`, arredondado para o formato de preço da moeda — e
 * validado contra a âncora e contra o piso pelo teste do catálogo.
 */
export const TIERS: RegionalPrice[] = [
  {
    tier: 1,
    countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'SG', 'NL', 'IE'],
    displayCurrency: 'USD',
    unitPriceUSD: 17.9,
    quarterlyPriceUSD: 35.9,
    localPaymentMethods: ['card'],
  },
  {
    tier: 2,
    countries: ['PT', 'ES', 'IT', 'PL', 'CZ', 'CL', 'MY', 'TR', 'ZA', 'AE'],
    displayCurrency: 'EUR',
    unitPriceUSD: 11.9,
    quarterlyPriceUSD: 23.9,
    localPaymentMethods: ['card'],
  },
  {
    tier: 3,
    countries: ['BR', 'MX', 'CO', 'AR', 'TH', 'RO', 'BG'],
    displayCurrency: 'BRL',
    unitPriceUSD: 7.9,
    quarterlyPriceUSD: 15.9,
    localPaymentMethods: ['card', 'pix'],
  },
  {
    tier: 4,
    countries: ['IN', 'ID', 'PH', 'VN', 'NG', 'EG', 'PK', 'BD', 'KE'],
    displayCurrency: 'INR',
    unitPriceUSD: 5.2,
    quarterlyPriceUSD: 13.1,
    localPaymentMethods: ['card', 'upi', 'gopay', 'ovo'],
  },
]

/**
 * Faixa de quem não está em nenhuma lista.
 *
 * Faixa 1 não é punição: é o preço de tabela, e a Faixa 1 é a única que pode
 * ser cobrada em dólar. Rebaixar o desconhecido para uma faixa barata
 * transformaria "país não mapeado" na forma mais fácil de pagar menos.
 */
export const DEFAULT_TIER: Tier = 1

/** Moeda de cobrança por país. Fora da Faixa 1, nenhum país pode faltar aqui. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  // Faixa 1
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  AU: 'AUD',
  JP: 'JPY',
  SG: 'SGD',
  // Faixa 2
  PT: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PL: 'PLN',
  CZ: 'CZK',
  CL: 'CLP',
  MY: 'MYR',
  TR: 'TRY',
  ZA: 'ZAR',
  AE: 'AED',
  // Faixa 3
  BR: 'BRL',
  MX: 'MXN',
  CO: 'COP',
  AR: 'ARS',
  TH: 'THB',
  RO: 'RON',
  BG: 'BGN',
  // Faixa 4
  IN: 'INR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  NG: 'NGN',
  EG: 'EGP',
  PK: 'PKR',
  BD: 'BDT',
  KE: 'KES',
}

/**
 * Cotações de referência (USD → moeda local).
 *
 * Servem para DUAS coisas e nenhuma terceira: arredondar o preço local na hora
 * de defini-lo, e converter de volta para dólar no teste do piso. O valor
 * cobrado é o de `LOCAL_PRICES`, fixo — nada aqui é consultado em tempo de
 * cobrança, então uma cotação desatualizada não muda o que o cliente paga.
 *
 * Moedas voláteis (ARS, TRY, NGN, EGP) merecem revisão trimestral: quando a
 * cotação anda, é o preço local que precisa ser reescrito, e o teste do piso é
 * quem avisa que ele ficou para trás.
 */
export const USD_TO_LOCAL: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.5,
  JPY: 150,
  SGD: 1.34,
  PLN: 3.95,
  CZK: 23,
  CLP: 950,
  MYR: 4.5,
  TRY: 34,
  ZAR: 18.5,
  AED: 3.67,
  BRL: 5.4,
  MXN: 18.5,
  COP: 4000,
  ARS: 1300,
  THB: 35,
  RON: 4.6,
  BGN: 1.8,
  INR: 84,
  IDR: 16000,
  PHP: 57,
  VND: 25000,
  NGN: 1600,
  EGP: 48,
  PKR: 278,
  BDT: 120,
  KES: 129,
}

/**
 * Moedas sem subunidade. A Stripe recebe o valor inteiro, não centavos —
 * multiplicar por 100 aqui cobraria cem vezes o preço.
 */
export const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'CLP', 'VND', 'KRW', 'XOF', 'XAF', 'PYG', 'UGX'])

export interface LocalPrice {
  /** Preço de uma análise, na unidade principal da moeda. */
  single: number
  /** Preço do Passe Trimestral, na unidade principal da moeda. */
  quarterly: number
}

/**
 * O preço que o cliente vê e paga, por moeda.
 *
 * Não é conversão em tempo real: é preço de tabela, arredondado para o formato
 * a que cada mercado está acostumado. R$ 39,90 é o preço do Brasil, decidido
 * assim — não `5.90 × cotação do dia`.
 */
export const LOCAL_PRICES: Record<string, LocalPrice> = {
  // Faixa 1 — âncora $17,90 / $35,90
  USD: { single: 17.9, quarterly: 35.9 },
  CAD: { single: 23.9, quarterly: 47.9 },
  GBP: { single: 14.9, quarterly: 29.9 },
  AUD: { single: 26.9, quarterly: 53.9 },
  JPY: { single: 2690, quarterly: 5390 },
  SGD: { single: 23.9, quarterly: 47.9 },
  // Faixa 2 — âncora $11,90 / $23,90. EUR vive aqui: os países de euro da
  // Faixa 1 (DE, FR, NL, IE) usam `EUR_TIER1`, resolvido por país.
  EUR: { single: 10.9, quarterly: 21.9 },
  PLN: { single: 46.9, quarterly: 93.9 },
  CZK: { single: 269, quarterly: 539 },
  CLP: { single: 10990, quarterly: 21990 },
  MYR: { single: 53.9, quarterly: 109 },
  TRY: { single: 399, quarterly: 799 },
  ZAR: { single: 219, quarterly: 439 },
  AED: { single: 43.9, quarterly: 87.9 },
  // Faixa 3 — âncora $7,90 / $15,90
  BRL: { single: 39.9, quarterly: 79.9 },
  MXN: { single: 149, quarterly: 299 },
  COP: { single: 31990, quarterly: 63990 },
  ARS: { single: 10990, quarterly: 21990 },
  THB: { single: 269, quarterly: 539 },
  RON: { single: 35.9, quarterly: 71.9 },
  BGN: { single: 14.9, quarterly: 29.9 },
  // Faixa 4 — âncora $5,20 / $13,10. O trimestral fica
  // no piso (5 × US$ 2,60), por isso ~2,5× o avulso e não 2× como nas demais.
  INR: { single: 439, quarterly: 1099 },
  IDR: { single: 79000, quarterly: 209000 },
  PHP: { single: 299, quarterly: 749 },
  VND: { single: 129000, quarterly: 329000 },
  NGN: { single: 7900, quarterly: 20990 },
  EGP: { single: 259, quarterly: 629 },
  PKR: { single: 1490, quarterly: 3690 },
  BDT: { single: 629, quarterly: 1590 },
  KES: { single: 669, quarterly: 1690 },
}

/**
 * Euro na Faixa 1.
 *
 * Alemanha e Portugal usam a mesma moeda e faixas diferentes. A moeda não pode
 * decidir o preço sozinha — quem decide é o par (país, faixa). Esta tabela
 * cobre a única sobreposição real do catálogo.
 */
const EUR_TIER1: LocalPrice = { single: 15.9, quarterly: 31.9 }

/** Locale de formatação por país. Separador e posição do símbolo são locais. */
const COUNTRY_LOCALE: Record<string, string> = {
  US: 'en-US', CA: 'en-CA', GB: 'en-GB', IE: 'en-IE', AU: 'en-AU', SG: 'en-SG',
  DE: 'de-DE', FR: 'fr-FR', NL: 'nl-NL', JP: 'ja-JP',
  PT: 'pt-PT', ES: 'es-ES', IT: 'it-IT', PL: 'pl-PL', CZ: 'cs-CZ', CL: 'es-CL',
  MY: 'ms-MY', TR: 'tr-TR', ZA: 'en-ZA', AE: 'ar-AE',
  BR: 'pt-BR', MX: 'es-MX', CO: 'es-CO', AR: 'es-AR', TH: 'th-TH', RO: 'ro-RO', BG: 'bg-BG',
  IN: 'en-IN', ID: 'id-ID', PH: 'en-PH', VN: 'vi-VN', NG: 'en-NG', EG: 'ar-EG',
  PK: 'en-PK', BD: 'bn-BD', KE: 'en-KE',
}

/**
 * Os nove itens que UMA compra entrega. Sem contagem, sem escolha.
 *
 * A lista é a promessa comercial do produto, e por isso cada item precisa
 * apontar para uma função que existe. Duas correções foram necessárias:
 *
 * - `profile_optimization` saiu. Ele era o mesmo trabalho que
 *   `social_analysis` já entrega: a auditoria de presença digital produz
 *   headline, texto "Sobre" e ações por perfil (ver `lib/social/analysis.ts`).
 *   Vender os dois contava o mesmo benefício duas vezes para inflar a lista.
 * - `targeted_changes` entrou. Ele é produzido de verdade — é o segmento
 *   homônimo da análise, que devolve trechos reais do currículo com a
 *   substituição sugerida — e não era anunciado em lugar nenhum.
 *
 * A troca é deliberada: um item real que ninguém sabia que existia no lugar de
 * um item duplicado. `catalog.test.ts` verifica que a lista continua com nove.
 */
export const ANALYSIS_DELIVERABLES = [
  'dimensions',
  'job_match',
  'targeted_changes',
  'rewrite',
  'career_orientation',
  'job_radar',
  'social_analysis',
  'cover_letter',
  'professional_summary',
  'pdf_download',
] as const

export type AnalysisDeliverable = (typeof ANALYSIS_DELIVERABLES)[number]

/**
 * Onde cada entrega é produzida.
 *
 * Existe para que a promessa possa ser conferida contra o código, e não apenas
 * lida. Um item sem produtor aqui é um item que a landing vende e o produto não
 * entrega — foi exatamente o caso de `cover_letter` e `professional_summary`
 * antes de `app/api/resume/cover-letter/route.ts` existir.
 */
export const DELIVERABLE_PRODUCERS: Record<AnalysisDeliverable, string> = {
  dimensions: 'lib/analysis/segments.ts (segmentos dimensions_a e dimensions_b)',
  job_match: 'lib/analysis/segments.ts (segmento job_match)',
  targeted_changes: 'lib/analysis/segments.ts (segmento targeted_changes)',
  rewrite: 'app/api/resume/rewrite/route.ts',
  career_orientation: 'app/api/resume/career-orientation/route.ts',
  job_radar: 'lib/radar/digest.server.ts + app/api/radar/route.ts',
  social_analysis: 'app/api/resume/social-analysis/route.ts + lib/social/analysis.ts',
  cover_letter: 'app/api/resume/cover-letter/route.ts',
  professional_summary: 'app/api/resume/cover-letter/route.ts (mesma chamada da carta)',
  pdf_download: 'app/api/resume/download/route.ts + lib/pdf.ts',
}

export function normalizeCountry(country: string | null | undefined): string {
  return (country || '').toUpperCase().trim()
}

/** Faixa do país. Desconhecido cai na Faixa 1 — ver `DEFAULT_TIER`. */
export function tierForCountry(country: string | null | undefined): Tier {
  const code = normalizeCountry(country)
  if (!code) return DEFAULT_TIER
  const found = TIERS.find((t) => t.countries.includes(code))
  return found ? found.tier : DEFAULT_TIER
}

export function tierConfig(tier: Tier): RegionalPrice {
  const found = TIERS.find((t) => t.tier === tier)
  if (!found) throw new Error(`Faixa de preço inexistente: ${tier}`)
  return found
}

/** Moeda de cobrança do país. Fora do mapa, dólar — e isso só ocorre na Faixa 1. */
export function currencyForCountry(country: string | null | undefined): string {
  const code = normalizeCountry(country)
  return COUNTRY_CURRENCY[code] || tierConfig(tierForCountry(code)).displayCurrency
}

function localPriceFor(country: string, currency: string, tier: Tier): LocalPrice {
  if (currency === 'EUR' && tier === 1) return EUR_TIER1
  const table = LOCAL_PRICES[currency]
  if (!table) throw new Error(`Sem preço local declarado para ${currency} (país ${country})`)
  return table
}

export interface ResolvedPrice {
  sku: Sku
  tier: Tier
  country: string
  currency: string
  /** Valor na unidade principal da moeda (29.9 em BRL, 1980 em JPY). */
  amount: number
  /** Valor em centavos — ou em unidades inteiras, nas moedas sem subunidade. */
  amountMinor: number
  /** Quantas análises esta compra entrega. */
  analyses: number
  /** Equivalente em dólar pela cotação de referência. Telemetria e piso. */
  amountUsd: number
  /** Preço por análise em dólar. É este valor que o piso limita. */
  perAnalysisUsd: number
  /** Preço já formatado no padrão do país. */
  formatted: string
  /** Métodos de pagamento locais declarados para a faixa. */
  localPaymentMethods: string[]
}

/** Converte para a menor unidade que a Stripe cobra. */
export function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100)
}

export function formatPrice(amount: number, currency: string, country: string): string {
  const locale = COUNTRY_LOCALE[normalizeCountry(country)] || 'en-US'
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: zeroDecimal ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    }).format(amount)
  } catch {
    // Locale ou moeda que o runtime não conhece: melhor um preço legível que
    // uma exceção no meio do paywall.
    return `${currency} ${amount.toFixed(zeroDecimal ? 0 : 2)}`
  }
}

/**
 * O preço de um país.
 *
 * `country` tem que ser o país do MEIO DE PAGAMENTO sempre que ele for
 * conhecido. IP e locale do navegador só entram como palpite inicial, antes de
 * existir um pagamento — ver `lib/pricing/resolve.ts`, que é quem aplica essa
 * regra.
 */
export function priceFor(country: string | null | undefined, sku: Sku = 'single'): ResolvedPrice {
  const code = normalizeCountry(country) || 'US'
  const tier = tierForCountry(code)
  const currency = currencyForCountry(code)
  const local = localPriceFor(code, currency, tier)
  const amount = sku === 'quarterly' ? local.quarterly : local.single
  const analyses = sku === 'quarterly' ? QUARTERLY_ANALYSES : 1
  const rate = USD_TO_LOCAL[currency] ?? 1
  const amountUsd = Math.round((amount / rate) * 100) / 100

  return {
    sku,
    tier,
    country: code,
    currency,
    amount,
    amountMinor: toMinorUnits(amount, currency),
    analyses,
    amountUsd,
    perAnalysisUsd: Math.round((amountUsd / analyses) * 100) / 100,
    formatted: formatPrice(amount, currency, code),
    localPaymentMethods: tierConfig(tier).localPaymentMethods,
  }
}

/** Violação do piso, ou `null`. É o que o teste do catálogo verifica. */
export function floorViolation(price: ResolvedPrice): string | null {
  if (price.perAnalysisUsd < ANALYSIS_FLOOR_USD) {
    return `${price.country}/${price.currency} ${price.sku}: US$ ${price.perAnalysisUsd.toFixed(2)} por análise, abaixo do piso de US$ ${ANALYSIS_FLOOR_USD.toFixed(2)}`
  }
  return null
}

/**
 * Lança se o preço violar o piso.
 *
 * Chamado no caminho da criação do checkout, não só no teste: um preço abaixo
 * do custo tem que falhar antes de virar cobrança, e não depois, num relatório.
 */
export function assertAboveFloor(price: ResolvedPrice): ResolvedPrice {
  const violation = floorViolation(price)
  if (violation) throw new Error(`Piso de preço violado — ${violation}`)
  return price
}

/** Todos os países com preço declarado. Usado pelo teste e pelo setup da Stripe. */
export function allPricedCountries(): string[] {
  return TIERS.flatMap((t) => t.countries)
}
