import { db } from '@/lib/db'

export async function getGlobalSettings() {
  const configs = await db.systemConfig.findMany()
  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)
  return configMap
}
