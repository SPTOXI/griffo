import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const webhookSecret = 'whsec_evYQHp0EFVUGPWp7uRM37MfSZvLfQ6qC'
  await db.systemConfig.upsert({
    where: { key: 'STRIPE_WEBHOOK_SECRET' },
    update: { value: webhookSecret },
    create: { key: 'STRIPE_WEBHOOK_SECRET', value: webhookSecret },
  })
  console.log('Webhook secret saved successfully!')
}

main().catch(console.error).finally(() => db.$disconnect())
