import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateMarketPerformance,
  countryFlag,
} from './market-performance'

test('countryFlag gera a bandeira emoji correta a partir do código ISO', () => {
  assert.equal(countryFlag('BR'), '🇧🇷')
  assert.equal(countryFlag('US'), '🇺🇸')
  assert.equal(countryFlag('GB'), '🇬🇧')
  assert.equal(countryFlag('DE'), '🇩🇪')
  assert.equal(countryFlag('IN'), '🇮🇳')
  assert.equal(countryFlag('GLOBAL'), '🌐')
  assert.equal(countryFlag(''), '🌐')
  assert.equal(countryFlag(null), '🌐')
})

test('calculateMarketPerformance com dados vazios retorna array vazio', () => {
  const result = calculateMarketPerformance([], [])
  assert.deepEqual(result, [])
})

test('calculateMarketPerformance calcula métricas por país e recomendações algorítmicas', () => {
  const events = [
    // Brasil: 100 visitantes, 10 checkouts
    ...Array.from({ length: 100 }, (_, i) => ({
      event: 'page_view',
      visitorId: `v_br_${i}`,
      meta: JSON.stringify({ country: 'BR' }),
    })),
    ...Array.from({ length: 10 }, () => ({
      event: 'checkout_initiated',
      meta: JSON.stringify({ country: 'BR' }),
    })),
    // EUA: 50 visitantes, 5 checkouts
    ...Array.from({ length: 50 }, (_, i) => ({
      event: 'page_view',
      visitorId: `v_us_${i}`,
      meta: JSON.stringify({ country: 'US' }),
    })),
    ...Array.from({ length: 5 }, () => ({
      event: 'checkout_initiated',
      meta: JSON.stringify({ country: 'US' }),
    })),
    // Índia: 100 visitantes, 1 checkout (baixa conversão)
    ...Array.from({ length: 100 }, (_, i) => ({
      event: 'page_view',
      visitorId: `v_in_${i}`,
      meta: JSON.stringify({ country: 'IN' }),
    })),
    {
      event: 'checkout_initiated',
      meta: JSON.stringify({ country: 'IN' }),
    },
  ]

  const purchases = [
    // Brasil: 6 compras de R$ 29,90 (US$ 5.90) = US$ 35.40
    ...Array.from({ length: 6 }, (_, i) => ({
      priceUsd: 5.9,
      paymentCountry: 'BR',
      delta: 1,
      userId: `u_br_${i}`,
    })),
    // EUA: 4 compras de US$ 12.90 = US$ 51.60
    ...Array.from({ length: 4 }, (_, i) => ({
      priceUsd: 12.9,
      paymentCountry: 'US',
      delta: 1,
      userId: `u_us_${i}`,
    })),
    // Índia: 0 compras
  ]

  const result = calculateMarketPerformance(events, purchases)

  // Deve ter 3 países
  assert.equal(result.length, 3)

  // Primeiro país por receita deve ser US (US$ 51.60)
  const us = result.find((r) => r.countryCode === 'US')!
  assert.ok(us)
  assert.equal(us.purchases, 4)
  assert.equal(us.visitors, 50)
  assert.equal(us.visitorConversionRate, 8.0) // 4 / 50 = 8%
  assert.equal(us.decision, 'scale')
  assert.ok(us.netProfitUsd > 0)
  assert.ok(us.netMarginPercent > 70)

  // Segundo país por receita: BR (US$ 35.40)
  const br = result.find((r) => r.countryCode === 'BR')!
  assert.ok(br)
  assert.equal(br.purchases, 6)
  assert.equal(br.visitors, 100)
  assert.equal(br.visitorConversionRate, 6.0) // 6 / 100 = 6%
  assert.equal(br.decision, 'scale')

  // Terceiro país: IN (100 visitantes, 0 compras) -> optimize/reduce
  const ind = result.find((r) => r.countryCode === 'IN')!
  assert.ok(ind)
  assert.equal(ind.purchases, 0)
  assert.equal(ind.visitors, 100)
  assert.equal(ind.visitorConversionRate, 0)
  assert.equal(ind.decision, 'optimize')
})
