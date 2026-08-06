import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET não definida. Defina via variável de ambiente.'
    )
  }
  await db.systemConfig.upsert({
    where: { key: 'STRIPE_WEBHOOK_SECRET' },
    update: { value: webhookSecret },
    create: { key: 'STRIPE_WEBHOOK_SECRET', value: webhookSecret },
  })
  console.log('Webhook secret saved successfully!')
}

main().catch(console.error).finally(() => db.$disconnect())
