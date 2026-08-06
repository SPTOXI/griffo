import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const secretKey = process.env.STRIPE_SECRET_KEY || ''
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

if (!secretKey || !publishableKey) {
  throw new Error('STRIPE_SECRET_KEY ou NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não foram informadas.')
}

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
