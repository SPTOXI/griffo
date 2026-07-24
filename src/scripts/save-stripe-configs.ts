import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:711882GRiffo@db.viqtmnhiejoacyevfjhy.supabase.co:5432/postgres',
    },
  },
})

const secretKey = 'sk_test_51Twl2qCj91meBoFNJ99PxV9bodntxDv0BK2nfLcyZhbYgI4lXOnAsVryex8W0aWaddG6vNmATEL5na3NDj0SftMI00sxKXm9Od'
const publishableKey = 'pk_test_51Twl2qCj91meBoFNPM3CvKk9GSu8bTh9z8UxUfs5lWfOPRJM9DYkbNxqYz3XvBe4hPxG3dWHQSum54ePTmv8sGmE00IONktykv'

async function main() {
  console.log('--- Saving Stripe Keys to Supabase SystemConfig Table ---')
  
  await db.systemConfig.upsert({
    where: { key: 'STRIPE_SECRET_KEY' },
    update: { value: secretKey },
    create: { key: 'STRIPE_SECRET_KEY', value: secretKey },
  })

  await db.systemConfig.upsert({
    where: { key: 'STRIPE_PUBLISHABLE_KEY' },
    update: { value: publishableKey },
    create: { key: 'STRIPE_PUBLISHABLE_KEY', value: publishableKey },
  })

  console.log('✓ SUCCESS: Stripe Secret Key and Publishable Key saved to Supabase Database!')
  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error saving configs:', err)
  process.exit(1)
})
