/**
 * Quais países a Adzuna varre nesta rodada.
 *
 * ## O problema que isto resolve
 *
 * A Adzuna cobre dez dos doze mercados do produto, e a cota gratuita é de
 * **2.500 requisições por mês** — cerca de 83 por dia. Varrer todos os países
 * com todos os termos toda noite estouraria isso na primeira semana:
 * 10 países × 6 termos × 2 páginas = 120 requisições por rodada.
 *
 * A saída não é cortar arbitrariamente: é **rodízio**. Cada rodada atende
 * alguns países, sempre os que esperaram mais, e em poucos dias todos foram
 * cobertos. Ninguém fica para trás — só espera.
 *
 * É a mesma decisão que a rodada do Radar já toma com usuários, pelo mesmo
 * motivo: tentar atender todos e ser cortado no meio deixa metade sem
 * atendimento e sem registro disso.
 *
 * ## O que ordena a fila
 *
 * `lastCollectionAt` da fonte daquele país (`adzuna:br`, `adzuna:us`...). País
 * nunca coletado vem primeiro — ele nunca teve vez. Isso reusa estado que já
 * existe no banco, em vez de inventar um contador de rodízio que precisaria ser
 * mantido em sincronia com a realidade.
 */

export interface CountryPlanInput {
  /** Código no formato da Adzuna: `br`, `us`, `gb`... */
  country: string
  /** Cargos que os usuários daquele país declararam buscar. */
  terms: string[]
  /** Última coleta daquele país. Nulo = nunca. */
  lastCollectionAt: Date | null
}

export interface CountryPlan {
  country: string
  terms: string[]
}

export interface PlanOptions {
  /** Quantos países por rodada. Multiplica direto o consumo de cota. */
  maxCountries?: number
  /** Quantos termos por país. Idem. */
  maxTermsPerCountry?: number
}

/**
 * Países cobertos pela Adzuna, **verificados um a um**: os dez originais em
 * 18/08/2026, a Itália (`it`) em 25/08/2026 — depois de acrescentada ao
 * catálogo de mercados (`lib/market/index.ts`) sem verificação, o gap ficou
 * registrado até aqui.
 *
 * Cada código foi testado contra `/v1/api/jobs/{country}/search/1`: os onze
 * abaixo responderam 200. Portugal e Japão responderam 404 — a Adzuna não os
 * atende, e supor que atende faria a fonte falhar toda rodada para quem mora
 * lá, gastando cota e enchendo o log.
 *
 * A Itália devolve o nome do país em italiano ("Italia") — o alias mora em
 * `lib/market/countries.ts`, junto dos outros nomes fora do português.
 *
 * Antes de acrescentar um país aqui, teste. É uma requisição.
 */
export const ADZUNA_COUNTRIES = ['br', 'us', 'ca', 'gb', 'es', 'mx', 'de', 'fr', 'in', 'au', 'it'] as const

const COVERED = new Set<string>(ADZUNA_COUNTRIES)

/** A Adzuna atende este país? */
export function adzunaCovers(country: string | null | undefined): boolean {
  return typeof country === 'string' && COVERED.has(country.trim().toLowerCase())
}

/**
 * Monta a rodada.
 *
 * País sem termo nenhum fica de fora: não há o que buscar, e gastar requisição
 * numa busca vazia é gastar cota de quem tem o que procurar.
 */
export function planAdzunaRound(inputs: CountryPlanInput[], options: PlanOptions = {}): CountryPlan[] {
  const maxCountries = options.maxCountries ?? 4
  const maxTermsPerCountry = options.maxTermsPerCountry ?? 3

  return inputs
    .filter((input) => adzunaCovers(input.country) && input.terms.length > 0)
    .sort((a, b) => {
      // Nunca coletado vem primeiro: nunca teve vez.
      const at = a.lastCollectionAt?.getTime() ?? 0
      const bt = b.lastCollectionAt?.getTime() ?? 0
      if (at !== bt) return at - bt
      // Empate: ordem estável, para a rodada ser reproduzível.
      return a.country.localeCompare(b.country)
    })
    .slice(0, Math.max(0, maxCountries))
    .map((input) => ({
      country: input.country.toLowerCase(),
      terms: input.terms.slice(0, Math.max(0, maxTermsPerCountry)),
    }))
    .filter((plan) => plan.terms.length > 0)
}

/**
 * Quantas requisições esta rodada vai gastar, no pior caso.
 *
 * Serve para a rodada declarar o consumo em vez de deixá-lo implícito — e para
 * o teste travar o número, que é o que impede alguém de subir um limite sem
 * perceber que estourou a cota do mês.
 */
export function estimatedRequests(plans: CountryPlan[], pagesPerTerm: number): number {
  return plans.reduce((sum, plan) => sum + plan.terms.length * pagesPerTerm, 0)
}
