import Stripe from 'stripe'
import {
  LOCAL_PRICES,
  PACK_SIZE,
  TIERS,
  allPricedCountries,
  assertAboveFloor,
  priceFor,
  type Sku,
} from '../lib/pricing/catalog'

/**
 * Põe a conta da Stripe no formato novo: um produto, um preço por moeda/faixa.
 *
 * Faz duas coisas, nesta ordem:
 *
 * 1. **Arquiva** os pacotes de crédito (`entrada`, `starter`, `carreira`,
 *    `profissional`). Arquivar, não apagar: um `Price` deletado quebra o
 *    histórico dos pagamentos que o referenciam, e a Stripe nem permite
 *    deletá-lo depois de usado. `active: false` tira da venda e preserva o
 *    passado.
 * 2. **Cria** os preços da Análise Completa e do pacote de 5, um por
 *    moeda-faixa do catálogo.
 *
 * O checkout monta o preço inline a partir do catálogo, então estes `Price`
 * existem para o relatório da Stripe, não para a cobrança. É por isso que o
 * script pode rodar quantas vezes for preciso: ele reconcilia, não duplica.
 *
 *   STRIPE_SECRET_KEY=sk_... bun run src/scripts/setup-stripe.ts
 *   STRIPE_SECRET_KEY=sk_... bun run src/scripts/setup-stripe.ts --dry-run
 */

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) throw new Error('STRIPE_SECRET_KEY not set')
const stripe = new Stripe(secretKey)

const DRY_RUN = process.argv.includes('--dry-run')

/** Pacotes do modelo de créditos, que saem de venda. */
const LEGACY_PACKAGE_IDS = ['entrada', 'starter', 'carreira', 'profissional']

const PRODUCT_KEYS: Record<Sku, string> = {
  single: 'griffo_analise_completa',
  pack5: `griffo_analise_completa_x${PACK_SIZE}`,
}

const PRODUCT_NAMES: Record<Sku, string> = {
  single: 'Griffo — Análise Completa',
  pack5: `Griffo — ${PACK_SIZE} Análises Completas`,
}

const PRODUCT_DESCRIPTIONS: Record<Sku, string> = {
  single:
    'Uma análise completa de currículo: laudo das 8 dimensões, comparação com a vaga, reescrita STAR/XYZ, orientação profissional, otimização de perfil, análise de mídias sociais, carta de apresentação, resumo profissional e PDF.',
  pack5: `${PACK_SIZE} análises completas de currículo. Oferta de recompra, disponível depois da primeira compra.`,
}

async function archiveLegacyCreditProducts(): Promise<number> {
  console.log('\n--- Arquivando os pacotes de crédito ---')
  let archived = 0

  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    const packageId = product.metadata?.package_id
    const isLegacy =
      (packageId && LEGACY_PACKAGE_IDS.includes(packageId)) ||
      /pacote (starter|carreira|profissional)|plano de entrada/i.test(product.name || '')

    if (!isLegacy) continue

    console.log(`• ${product.name} (${product.id})`)
    if (DRY_RUN) {
      archived += 1
      continue
    }

    for await (const price of stripe.prices.list({ product: product.id, active: true, limit: 100 })) {
      await stripe.prices.update(price.id, { active: false })
      console.log(`  └ price ${price.id} arquivado`)
    }
    await stripe.products.update(product.id, { active: false })
    archived += 1
  }

  if (archived === 0) console.log('(nada a arquivar)')
  return archived
}

async function findOrCreateProduct(sku: Sku): Promise<Stripe.Product> {
  const key = PRODUCT_KEYS[sku]
  const existing = await stripe.products.search({ query: `metadata['griffo_sku']:'${key}'` })
  if (existing.data.length > 0) return existing.data[0]

  if (DRY_RUN) {
    return { id: `(dry-run:${key})`, name: PRODUCT_NAMES[sku] } as Stripe.Product
  }

  return stripe.products.create({
    name: PRODUCT_NAMES[sku],
    description: PRODUCT_DESCRIPTIONS[sku],
    metadata: {
      griffo_sku: key,
      sku,
      analyses: (sku === 'pack5' ? PACK_SIZE : 1).toString(),
    },
  })
}

/**
 * Um preço por par (moeda, faixa).
 *
 * O par existe porque a moeda sozinha não determina o preço: Alemanha e
 * Portugal cobram em euro e estão em faixas diferentes. Agrupar só por moeda
 * daria um preço só para os dois — e o errado para um deles.
 */
function currencyTierPairs(): Array<{ currency: string; tier: number; country: string }> {
  const seen = new Set<string>()
  const pairs: Array<{ currency: string; tier: number; country: string }> = []

  for (const country of allPricedCountries()) {
    const price = priceFor(country)
    const key = `${price.currency}:${price.tier}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ currency: price.currency, tier: price.tier, country })
  }

  return pairs
}

async function syncPrices(sku: Sku, product: Stripe.Product): Promise<number> {
  console.log(`\n--- ${PRODUCT_NAMES[sku]} (${product.id}) ---`)
  let created = 0

  for (const pair of currencyTierPairs()) {
    const price = assertAboveFloor(priceFor(pair.country, sku))
    const lookupKey = `${PRODUCT_KEYS[sku]}_${price.currency.toLowerCase()}_t${price.tier}`

    const existing = await stripe.prices
      .list({ product: product.id, active: true, limit: 100 })
      .then((r) => r.data.find((p) => p.lookup_key === lookupKey))

    if (existing && existing.unit_amount === price.amountMinor) {
      console.log(`  = ${lookupKey} já correto (${price.formatted})`)
      continue
    }

    if (DRY_RUN) {
      console.log(`  + ${lookupKey} → ${price.formatted} (${price.amountMinor} ${price.currency})`)
      created += 1
      continue
    }

    // O preço anterior sai de circulação em vez de ser editado: `unit_amount`
    // é imutável na Stripe, e um `Price` arquivado mantém legíveis as cobranças
    // que já apontam para ele.
    if (existing) {
      await stripe.prices.update(existing.id, { active: false, lookup_key: null } as any)
    }

    const stripePrice = await stripe.prices.create({
      product: product.id,
      currency: price.currency.toLowerCase(),
      unit_amount: price.amountMinor,
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      metadata: {
        sku,
        tier: price.tier.toString(),
        analyses: price.analyses.toString(),
        price_usd: price.amountUsd.toFixed(2),
        countries: TIERS.find((t) => t.tier === price.tier)!.countries.join(','),
      },
    })

    console.log(`  + ${lookupKey} → ${price.formatted} (${stripePrice.id})`)
    created += 1
  }

  return created
}

async function main() {
  console.log(DRY_RUN ? '=== SIMULAÇÃO (--dry-run): nada será alterado ===' : '=== Aplicando na conta Stripe ===')

  // Falha antes de tocar na Stripe se algum preço do catálogo violar o piso.
  for (const country of allPricedCountries()) {
    assertAboveFloor(priceFor(country, 'single'))
    assertAboveFloor(priceFor(country, 'pack5'))
  }
  console.log(
    `Catálogo validado: ${allPricedCountries().length} países, ${Object.keys(LOCAL_PRICES).length} moedas, piso respeitado.`
  )

  const archived = await archiveLegacyCreditProducts()

  let createdPrices = 0
  for (const sku of ['single', 'pack5'] as Sku[]) {
    const product = await findOrCreateProduct(sku)
    createdPrices += await syncPrices(sku, product)
  }

  console.log(
    `\n--- Fim. ${archived} produto(s) de crédito arquivado(s), ${createdPrices} preço(s) criado(s)/atualizado(s). ---`
  )
  if (DRY_RUN) console.log('Nada foi alterado. Rode sem --dry-run para aplicar.')
}

main().catch((err) => {
  console.error('Erro ao configurar a Stripe:', err)
  process.exit(1)
})
