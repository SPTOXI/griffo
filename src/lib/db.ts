import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const rawUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres.viqtmnhiejoacyevfjhy:711882GRiffo@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

// Auto-repair deprecated Supabase host or user format
let fixedUrl = rawUrl
if (fixedUrl.includes('db.viqtmnhiejoacyevfjhy.supabase.co')) {
  fixedUrl = fixedUrl.replace(
    'db.viqtmnhiejoacyevfjhy.supabase.co',
    'aws-1-sa-east-1.pooler.supabase.com'
  )
}
if (fixedUrl.includes('postgres:711882GRiffo@aws-1-sa-east-1')) {
  fixedUrl = fixedUrl.replace(
    'postgres:711882GRiffo@aws-1-sa-east-1',
    'postgres.viqtmnhiejoacyevfjhy:711882GRiffo@aws-1-sa-east-1'
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: fixedUrl,
      },
    },
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db