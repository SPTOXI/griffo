import { PrismaClient } from '@prisma/client'

const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
]

const usernames = [
  'postgres.viqtmnhiejoacyevfjhy',
  'postgres',
]

async function testConnection() {
  for (const host of hosts) {
    for (const user of usernames) {
      const url = `postgresql://${user}:711882GRiffo@${host}:6543/postgres?pgbouncer=true`
      console.log(`Testing ${host} with user ${user}...`)
      const client = new PrismaClient({ datasources: { db: { url } } })
      try {
        await client.$connect()
        const count = await client.user.count()
        console.log(`✅ SUCCESS! Host: ${host}, User: ${user}, User Count: ${count}`)
        await client.$disconnect()
        return url
      } catch (e: any) {
        console.log(`   Failed: ${e.message?.split('\n')[0]}`)
      } finally {
        await client.$disconnect()
      }
    }
  }
}

testConnection()
