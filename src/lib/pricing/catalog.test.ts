/**
 * O teste que o brief exige: nenhum preço do catálogo pode ficar abaixo do
 * piso, e nenhum país fora da Faixa 1 pode ser cobrado em dólar.
 *
 * Roda em `bun test`, sem dependência nova — o catálogo é um módulo puro, sem
 * Prisma e sem rede.
 */

import { describe, expect, test } from 'bun:test'
import {
  ANALYSIS_FLOOR_USD,
  ANALYSIS_DIRECT_COST_USD,
  COUNTRY_CURRENCY,
  LOCAL_PRICES,
  PACK_SIZE,
  TIERS,
  USD_TO_LOCAL,
  allPricedCountries,
  assertAboveFloor,
  currencyForCountry,
  floorViolation,
  priceFor,
  tierForCountry,
  toMinorUnits,
} from './catalog'

const SKUS = ['single', 'pack5'] as const

/** Quanto o preço local pode se afastar da âncora em dólar da faixa. */
const ANCHOR_TOLERANCE = 0.15

describe('piso de preço', () => {
  test('o piso cobre o custo direto medido', () => {
    expect(ANALYSIS_FLOOR_USD).toBeGreaterThan(ANALYSIS_DIRECT_COST_USD)
  })

  for (const country of allPricedCountries()) {
    for (const sku of SKUS) {
      test(`${country} ${sku} fica acima do piso`, () => {
        const price = priceFor(country, sku)
        expect(floorViolation(price)).toBeNull()
        expect(price.perAnalysisUsd).toBeGreaterThanOrEqual(ANALYSIS_FLOOR_USD)
      })
    }
  }

  test('um preço abaixo do piso é recusado, não apenas relatado', () => {
    const price = priceFor('BR', 'single')
    expect(() => assertAboveFloor({ ...price, perAnalysisUsd: 1.99 })).toThrow(/Piso de preço violado/)
  })

  test('país desconhecido não vira o caminho barato', () => {
    // Faixa 1 é o preço de tabela. Se um país não mapeado caísse numa faixa
    // barata, "país não mapeado" seria a forma mais fácil de pagar menos.
    expect(tierForCountry('ZZ')).toBe(1)
    expect(priceFor('ZZ').perAnalysisUsd).toBeGreaterThanOrEqual(ANALYSIS_FLOOR_USD)
  })
})

describe('moeda local', () => {
  test('USD nunca é exibido fora da Faixa 1', () => {
    for (const tier of TIERS) {
      if (tier.tier === 1) continue
      for (const country of tier.countries) {
        expect(priceFor(country).currency).not.toBe('USD')
      }
    }
  })

  test('todo país listado tem moeda declarada', () => {
    for (const country of allPricedCountries()) {
      expect(COUNTRY_CURRENCY[country]).toBeDefined()
    }
  })

  test('toda moeda declarada tem preço local e cotação de referência', () => {
    for (const country of allPricedCountries()) {
      const currency = currencyForCountry(country)
      expect(USD_TO_LOCAL[currency]).toBeGreaterThan(0)
      // EUR na Faixa 1 tem tabela própria; nas demais moedas o preço vem de
      // LOCAL_PRICES. Em ambos os casos `priceFor` tem de produzir um valor.
      expect(priceFor(country).amount).toBeGreaterThan(0)
      if (currency !== 'EUR') expect(LOCAL_PRICES[currency]).toBeDefined()
    }
  })

  test('o preço formatado sai no padrão do país', () => {
    expect(priceFor('BR').formatted).toContain('29,90')
    expect(priceFor('US').formatted).toBe('$12.90')
  })

  test('moeda sem subunidade não é multiplicada por cem', () => {
    expect(toMinorUnits(1980, 'JPY')).toBe(1980)
    expect(toMinorUnits(29.9, 'BRL')).toBe(2990)
    expect(priceFor('JP').amountMinor).toBe(1980)
  })
})

describe('faixas', () => {
  test('o preço local acompanha a âncora em dólar da faixa', () => {
    for (const tier of TIERS) {
      for (const country of tier.countries) {
        for (const sku of SKUS) {
          const anchor = sku === 'pack5' ? tier.packOf5PriceUSD : tier.unitPriceUSD
          const price = priceFor(country, sku)
          const drift = Math.abs(price.amountUsd - anchor) / anchor
          expect(drift).toBeLessThanOrEqual(ANCHOR_TOLERANCE)
        }
      }
    }
  })

  test('as faixas estão em ordem decrescente de preço', () => {
    const units = TIERS.map((t) => t.unitPriceUSD)
    expect(units).toEqual([...units].sort((a, b) => b - a))
  })

  test('nenhum país aparece em duas faixas', () => {
    const all = allPricedCountries()
    expect(new Set(all).size).toBe(all.length)
  })

  test('o pacote de 5 é mais barato por análise que a compra avulsa', () => {
    for (const country of allPricedCountries()) {
      const single = priceFor(country, 'single')
      const pack = priceFor(country, 'pack5')
      expect(pack.analyses).toBe(PACK_SIZE)
      expect(pack.perAnalysisUsd).toBeLessThan(single.perAnalysisUsd)
    }
  })

  test('Brasil é Faixa 3 e custa R$ 29,90', () => {
    const price = priceFor('BR')
    expect(price.tier).toBe(3)
    expect(price.currency).toBe('BRL')
    expect(price.amount).toBe(29.9)
    expect(price.localPaymentMethods).toContain('pix')
  })

  test('Índia é Faixa 4 e declara UPI', () => {
    const price = priceFor('IN')
    expect(price.tier).toBe(4)
    expect(price.currency).toBe('INR')
    expect(price.localPaymentMethods).toContain('upi')
  })
})
