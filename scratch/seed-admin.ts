import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

const connectionString = 'postgresql://postgres.viqtmnhiejoacyevfjhy:711882GRiffo@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
const db = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
})

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function seedAdmin() {
  const email = 'admin@griffowork.com'
  const password = '711882GRiffo'
  const passwordHash = hashPassword(password)

  console.log('Connecting with Supabase pooler connection string...')

  const admin = await db.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
      credits: 1000,
      name: 'GriffoWork Admin',
    },
    create: {
      email,
      name: 'GriffoWork Admin',
      passwordHash,
      role: 'admin',
      credits: 1000,
      plan: 'carreira',
    },
  })

  console.log('✅ ADMIN CREATED/UPDATED IN SUPABASE DATABASE!')
  console.log('   ID:', admin.id)
  console.log('   Email:', admin.email)
  console.log('   Role:', admin.role)
  console.log('   Credits:', admin.credits)
}

seedAdmin()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e)
  })
  .finally(() => {
    db.$disconnect()
  })
