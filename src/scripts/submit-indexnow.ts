import { loadEnvFile } from './load-env'
import sitemap from '../app/sitemap'
import { submitUrlsToIndexNow } from '../lib/seo/indexnow'

/**
 * Envia todas as URLs do `sitemap.ts` pro IndexNow (Bing e demais motores
 * participantes) — gatilho MANUAL, pra rodar depois de qualquer mudança
 * grande de conteúdo/rota sem esperar o rastreio natural.
 *
 * Reaproveita `app/sitemap.ts` como única fonte da lista de URLs — a mesma
 * razão de `[country]/page.tsx` reaproveitar `SUPPORTED_COUNTRY_SLUGS` em vez
 * de manter uma segunda lista que diverge da primeira.
 *
 *   npx tsx src/scripts/submit-indexnow.ts
 */

loadEnvFile()

async function main() {
  const urls = sitemap().map((route) => route.url)
  console.log(`Enviando ${urls.length} URLs ao IndexNow...`)

  const result = await submitUrlsToIndexNow(urls)

  console.log(`Status: ${result.status}${result.ok ? ' (aceito)' : ' (FALHOU)'}`)
  if (result.body) console.log(result.body)

  if (!result.ok) process.exitCode = 1
}

main()
