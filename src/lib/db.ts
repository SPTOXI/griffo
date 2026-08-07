// Fails the build if this module is ever pulled into a Client Component graph.
// Without it, the env check below throws in the browser instead, which crashes
// hydration and renders Next's "This page couldn't load" screen.
import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const rawUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres.viqtmnhiejoacyevfjhy:711882GRiffo@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

  let fixedUrl = rawUrl
  if (fixedUrl.includes('db.viqtmnhiejoacyevfjhy.supabase.co')) {
    fixedUrl = fixedUrl.replace(
      'db.viqtmnhiejoacyevfjhy.supabase.co',
      'aws-1-sa-east-1.pooler.supabase.com'
    )
  }

  return new PrismaClient({
    datasources: { db: { url: fixedUrl } },
    log: ['error'],
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

// The client is built on first use rather than at import time. `next build`
// imports every route module while collecting page data, so constructing it
// eagerly made a database URL a *build-time* requirement — a deploy with the
// env var missing (or scoped to the wrong environment) failed the whole build
// instead of just the requests that actually touch the database.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
