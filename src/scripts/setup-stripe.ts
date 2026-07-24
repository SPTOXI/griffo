import Stripe from 'stripe'

const secretKey = 'sk_test_51Twl2qCj91meBoFNJ99PxV9bodntxDv0BK2nfLcyZhbYgI4lXOnAsVryex8W0aWaddG6vNmATEL5na3NDj0SftMI00sxKXm9Od'
const stripe = new Stripe(secretKey)

const PACKAGES = [
  { id: 'entrada', name: 'Plano de Entrada', credits: 40, priceBrl: 9.90, desc: '40 Créditos (30 + 10 Bônus)' },
  { id: 'starter', name: 'Pacote Starter', credits: 100, priceBrl: 29.90, desc: '100 Créditos de Análise' },
  { id: 'carreira', name: 'Pacote Carreira', credits: 500, priceBrl: 99.90, desc: '500 Créditos de Análise' },
  { id: 'profissional', name: 'Pacote Profissional', credits: 1500, priceBrl: 249.90, desc: '1.500 Créditos de Análise' },
]

async function main() {
  console.log('--- Creating Products and Prices on Stripe Account ---')
  const results = []

  for (const pkg of PACKAGES) {
    // Create product on Stripe
    const product = await stripe.products.create({
      name: `GriffoWork - ${pkg.name}`,
      description: pkg.desc,
      metadata: {
        package_id: pkg.id,
        credits: pkg.credits.toString(),
      },
    })

    // Create price on Stripe
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(pkg.priceBrl * 100),
      currency: 'brl',
      metadata: {
        package_id: pkg.id,
        credits: pkg.credits.toString(),
      },
    })

    console.log(`✓ Produto Criado: ${product.name}`)
    console.log(`  └ Product ID: ${product.id}`)
    console.log(`  └ Price ID: ${price.id}`)
    console.log(`  └ Valor: R$ ${pkg.priceBrl.toFixed(2)}\n`)

    results.push({ name: pkg.name, productId: product.id, priceId: price.id, amountBrl: pkg.priceBrl })
  }

  console.log('--- Todos os produtos foram criados com sucesso na sua conta Stripe! ---')
}

main().catch((err) => {
  console.error('Error creating Stripe products:', err)
  process.exit(1)
})
