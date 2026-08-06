import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!rawUrl) {
  throw new Error(
    'DATABASE_URL ou POSTGRES_PRISMA_URL não foi configurada. ' +
    'Defina uma dessas variáveis de ambiente antes de iniciar a aplicação.'
  )
}

let fixedUrl = rawUrl

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