import { db } from '@/lib/db'
import { tryDecryptSecret } from '@/lib/crypto'
import { isSensitiveConfigKey } from '@/lib/system-config'

/**
 * Configurações globais já decifradas, para uso do servidor.
 *
 * Nunca devolva o resultado disto numa resposta HTTP: contém a chave secreta
 * da Stripe e as chaves das IAs em claro. Para exibição no painel existe
 * `maskSecret` em `lib/crypto.ts`.
 */
export async function getGlobalSettings() {
  const configs = await db.systemConfig.findMany()
  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = isSensitiveConfigKey(curr.key)
      ? tryDecryptSecret(curr.value, `SystemConfig.${curr.key}`)
      : curr.value
    return acc
  }, {} as Record<string, string>)
  return configMap
}
