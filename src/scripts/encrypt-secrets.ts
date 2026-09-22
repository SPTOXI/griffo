/**
 * Cifra os segredos que ainda estão em TEXTO PURO no banco.
 * Rode com: `npm run db:encrypt-secrets`
 *
 * `crypto.ts` só cifra na gravação. Tudo que foi salvo antes dele continuou
 * legível — e em 16/09/2026 isso incluía `STRIPE_SECRET_KEY`,
 * `STRIPE_WEBHOOK_SECRET` e três chaves de `AiApiKey`. Quem lê o banco (dump,
 * backup, painel, credencial vazada) lia essas chaves prontas para uso; com o
 * webhook secret, forja pagamento e credita análises.
 *
 * Idempotente: `encryptSecret` devolve intacto o que já está cifrado.
 * Precisa de `ENCRYPTION_KEY` no `.env` — a MESMA da Vercel.
 */
import { createPrismaClient } from '../lib/prisma-client'
import { loadEnvFile } from './load-env'
import { encryptSecret, isEncrypted, decryptSecret } from '../lib/crypto'
import { isSensitiveConfigKey } from '../lib/system-config'

loadEnvFile()

async function main() {
  const url = process.env.POSTGRES_URL_NON_POOLING?.trim() || process.env.POSTGRES_PRISMA_URL?.trim()
  if (!url) throw new Error('Defina POSTGRES_URL_NON_POOLING no .env.')
  const db = createPrismaClient(url)

  try {
    let changed = 0

    const keys = await db.aiApiKey.findMany({ select: { id: true, provider: true, apiKey: true } })
    for (const k of keys) {
      if (!k.apiKey || isEncrypted(k.apiKey)) continue
      const enc = encryptSecret(k.apiKey)
      if (decryptSecret(enc) !== k.apiKey) throw new Error(`Verificação falhou em AiApiKey ${k.provider}`)
      await db.aiApiKey.update({ where: { id: k.id }, data: { apiKey: enc } })
      console.log(`[ok] AiApiKey ${k.provider} cifrada`)
      changed++
    }

    const configs = await db.systemConfig.findMany({ select: { key: true, value: true } })
    for (const c of configs) {
      if (!isSensitiveConfigKey(c.key)) {
        // Chaves fora do catálogo com cara de segredo (ex.: LEMON_*) são
        // resíduo de integração antiga: apague, não cifre.
        if (/(KEY|SECRET|TOKEN|PASSWORD)/i.test(c.key) && !/PUBLISHABLE/i.test(c.key)) {
          console.warn(`[atenção] ${c.key} parece segredo e não está no catálogo: apague a linha.`)
        }
        continue
      }
      if (!c.value || isEncrypted(c.value)) continue
      const enc = encryptSecret(c.value)
      if (decryptSecret(enc) !== c.value) throw new Error(`Verificação falhou em ${c.key}`)
      await db.systemConfig.update({ where: { key: c.key }, data: { value: enc } })
      console.log(`[ok] SystemConfig ${c.key} cifrada`)
      changed++
    }

    console.log(changed ? `\n${changed} segredo(s) cifrado(s).` : '\nNada em texto puro.')
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
