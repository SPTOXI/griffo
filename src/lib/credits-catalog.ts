// Client-safe credit catalog: pure constants and formatting helpers.
// Kept free of any Prisma/`@/lib/db` import so Client Components can use it
// without pulling the database client (and its env-var requirements) into the
// browser bundle. Server-side credit operations live in `@/lib/credits`.

import { currencyForCountry } from './currency'

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
  priceUsd: number
  priceEur: number
  pricePerCreditBrl: number
  pricePerCreditUsd: number
  pricePerCreditEur: number
  popular?: boolean
  entryOnly?: boolean
  desc: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'entrada',
    name: 'Plano de Entrada',
    credits: 40,
    paidCredits: 30,
    bonusCredits: 10,
    priceBrl: 9.90,
    priceUsd: 1.99,
    priceEur: 1.99,
    pricePerCreditBrl: 0.2475,
    pricePerCreditUsd: 0.049,
    pricePerCreditEur: 0.049,
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
    priceUsd: 5.99,
    priceEur: 5.99,
    pricePerCreditBrl: 0.299,
    pricePerCreditUsd: 0.059,
    pricePerCreditEur: 0.059,
    desc: '100 créditos no saldo (suficiente para 5 avaliações completas de currículo)',
  },
  {
    id: 'carreira',
    name: 'Pacote Carreira',
    credits: 500,
    paidCredits: 500,
    bonusCredits: 0,
    priceBrl: 99.90,
    priceUsd: 19.99,
    priceEur: 19.99,
    pricePerCreditBrl: 0.199,
    pricePerCreditUsd: 0.039,
    pricePerCreditEur: 0.039,
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
    priceUsd: 49.99,
    priceEur: 49.99,
    pricePerCreditBrl: 0.166,
    pricePerCreditUsd: 0.033,
    pricePerCreditEur: 0.033,
    desc: '1.500 créditos no saldo (suficiente para 75 avaliações completas de currículo)',
  },
]

/**
 * Preço formatado para exibição.
 *
 * A moeda vem de `currencyForCountry`, a MESMA função que o servidor usa para
 * cobrar (`credits/purchase`). Antes cada lado tinha sua própria lista de
 * países, e elas haviam divergido: um comprador na Eslováquia via preço em
 * dólar e era cobrado em euro.
 *
 * O parâmetro `lang` é ignorado — a moeda depende de onde a pessoa está, não
 * do idioma em que ela lê o site. Mantido na assinatura para não quebrar as
 * chamadas existentes.
 */
export function getPackagePriceDisplay(
  pkg: CreditPackage,
  country: string = 'BR',
  _lang: string = 'pt'
): { priceFormatted: string; perCreditFormatted: string; currencySymbol: string; code: 'BRL' | 'USD' | 'EUR' } {
  switch (currencyForCountry(country || 'BR')) {
    case 'brl':
      return {
        priceFormatted: `R$ ${pkg.priceBrl.toFixed(2).replace('.', ',')}`,
        perCreditFormatted: `R$ ${pkg.pricePerCreditBrl.toFixed(3).replace('.', ',')}`,
        currencySymbol: 'R$',
        code: 'BRL',
      }
    case 'eur':
      return {
        priceFormatted: `€ ${pkg.priceEur.toFixed(2).replace('.', ',')}`,
        perCreditFormatted: `€ ${pkg.pricePerCreditEur.toFixed(3).replace('.', ',')}`,
        currencySymbol: '€',
        code: 'EUR',
      }
    default:
      return {
        priceFormatted: `$ ${pkg.priceUsd.toFixed(2)}`,
        perCreditFormatted: `$ ${pkg.pricePerCreditUsd.toFixed(3)}`,
        currencySymbol: '$',
        code: 'USD',
      }
  }
}
