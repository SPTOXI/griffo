/**
 * O teste que o brief exige: nenhum preço do catálogo pode ficar abaixo do
 * piso, e nenhum país fora da Faixa 1 pode ser cobrado em dólar.
 *
 * Usa `node:test` e `node:assert`, ambos da biblioteca padrão — nada de
 * dependência nova, e roda tanto com `npm` (via `tsx --test`) quanto com `bun`.
 * A primeira versão usava `bun:test`, o que tornava o teste do piso executável
 * só por quem tivesse o bun instalado. Um teste que protege o preço do produto
 * e que o dono do produto não consegue rodar protege pouco.
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
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
    assert.ok(
      ANALYSIS_FLOOR_USD > ANALYSIS_DIRECT_COST_USD,
      `piso US$ ${ANALYSIS_FLOOR_USD} não cobre o custo direto US$ ${ANALYSIS_DIRECT_COST_USD}`
    )
  })

  for (const country of allPricedCountries()) {
    for (const sku of SKUS) {
      test(`${country} ${sku} fica acima do piso`, () => {
        const price = priceFor(country, sku)
        assert.equal(floorViolation(price), null)
        assert.ok(
          price.perAnalysisUsd >= ANALYSIS_FLOOR_USD,
          `${country} ${sku}: US$ ${price.perAnalysisUsd} por análise`
        )
      })
    }
  }

  test('um preço abaixo do piso é recusado, não apenas relatado', () => {
    const price = priceFor('BR', 'single')
    assert.throws(
      () => assertAboveFloor({ ...price, perAnalysisUsd: 1.99 }),
      /Piso de preço violado/
    )
  })

  test('país desconhecido não vira o caminho barato', () => {
    // Faixa 1 é o preço de tabela. Se um país não mapeado caísse numa faixa
    // barata, "país não mapeado" seria a forma mais fácil de pagar menos.
    assert.equal(tierForCountry('ZZ'), 1)
    assert.ok(priceFor('ZZ').perAnalysisUsd >= ANALYSIS_FLOOR_USD)
  })
})

describe('moeda local', () => {
  test('USD nunca é exibido fora da Faixa 1', () => {
    for (const tier of TIERS) {
      if (tier.tier === 1) continue
      for (const country of tier.countries) {
        assert.notEqual(priceFor(country).currency, 'USD', `${country} está em dólar`)
      }
    }
  })

  test('todo país listado tem moeda declarada', () => {
    for (const country of allPricedCountries()) {
      assert.ok(COUNTRY_CURRENCY[country], `${country} sem moeda declarada`)
    }
  })

  test('toda moeda declarada tem preço local e cotação de referência', () => {
    for (const country of allPricedCountries()) {
      const currency = currencyForCountry(country)
      assert.ok(USD_TO_LOCAL[currency] > 0, `${currency} sem cotação de referência`)
      // EUR na Faixa 1 tem tabela própria; nas demais moedas o preço vem de
      // LOCAL_PRICES. Em ambos os casos `priceFor` tem de produzir um valor.
      assert.ok(priceFor(country).amount > 0, `${country} sem preço`)
      if (currency !== 'EUR') {
        assert.ok(LOCAL_PRICES[currency], `${currency} sem preço local declarado`)
      }
    }
  })

  test('o preço formatado sai no padrão do país', () => {
    assert.ok(priceFor('BR').formatted.includes('29,90'), priceFor('BR').formatted)
    assert.equal(priceFor('US').formatted, '$12.90')
  })

  test('moeda sem subunidade não é multiplicada por cem', () => {
    assert.equal(toMinorUnits(1980, 'JPY'), 1980)
    assert.equal(toMinorUnits(29.9, 'BRL'), 2990)
    assert.equal(priceFor('JP').amountMinor, 1980)
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
          assert.ok(
            drift <= ANCHOR_TOLERANCE,
            `${country} ${sku}: US$ ${price.amountUsd} contra âncora US$ ${anchor} (${Math.round(drift * 100)}% de desvio)`
          )
        }
      }
    }
  })

  test('as faixas estão em ordem decrescente de preço', () => {
    const units = TIERS.map((t) => t.unitPriceUSD)
    assert.deepEqual(units, [...units].sort((a, b) => b - a))
  })

  test('nenhum país aparece em duas faixas', () => {
    const all = allPricedCountries()
    assert.equal(new Set(all).size, all.length)
  })

  test('o pacote de 5 é mais barato por análise que a compra avulsa', () => {
    for (const country of allPricedCountries()) {
      const single = priceFor(country, 'single')
      const pack = priceFor(country, 'pack5')
      assert.equal(pack.analyses, PACK_SIZE)
      assert.ok(
        pack.perAnalysisUsd < single.perAnalysisUsd,
        `${country}: pacote US$ ${pack.perAnalysisUsd} não é menor que avulso US$ ${single.perAnalysisUsd}`
      )
    }
  })

  test('Brasil é Faixa 3 e custa R$ 29,90', () => {
    const price = priceFor('BR')
    assert.equal(price.tier, 3)
    assert.equal(price.currency, 'BRL')
    assert.equal(price.amount, 29.9)
    assert.ok(price.localPaymentMethods.includes('pix'))
  })

  test('Índia é Faixa 4 e declara UPI', () => {
    const price = priceFor('IN')
    assert.equal(price.tier, 4)
    assert.equal(price.currency, 'INR')
    assert.ok(price.localPaymentMethods.includes('upi'))
  })
})
