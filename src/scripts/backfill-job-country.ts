import { createPrismaClient, databaseUrlFromEnv } from '../lib/prisma-client'
import { loadEnvFile } from './load-env'
import { inferCountryFromLocation } from '../lib/jobs/location-country'

/**
 * Backfill único: infere `Job.country` a partir de `city`/`region` nas
 * vagas já gravadas que nunca tiveram país (48% do total em 13/09/2026—
 * ver a auditoria). A partir de agora `normalize.ts` já faz isso em toda
 * vaga NOVA (§ ver `location-country.ts`); este script só alcança o que já
 * estava no banco antes da mudança.
 *
 *   npx tsx src/scripts/backfill-job-country.ts --dry-run
 *   npx tsx src/scripts/backfill-job-country.ts
 *
 * `--dry-run` não grava nada: lê, infere, e só imprime quantas e quais
 * mudariam. Roda uma vez; rodar de novo depois é inofensivo (idempotente —
 * só toca `country IS NULL`, nunca sobrescreve um país já preenchido).
 *
 * ## Por que não é geocoding, é resolução de texto contra lista fechada
 *
 * Ver o cabeçalho de `location-country.ts`. Vaga cujo texto não bate com
 * nada da lista continua sem país — não é este script que inventa o que
 * não dá pra saber.
 */

loadEnvFile()

const DRY_RUN = process.argv.includes('--dry-run')

if (!DRY_RUN && !process.env.POSTGRES_PRISMA_URL) {
  throw new Error(
    'POSTGRES_PRISMA_URL não encontrada. Defina as URLs do banco no .env da raiz, ' +
      'ou rode com --dry-run para só ler e imprimir.'
  )
}

const BATCH_SIZE = 500

async function run(): Promise<void> {
  const db = createPrismaClient(databaseUrlFromEnv())
  try {
    const candidates = await db.job.findMany({
      where: { closedAt: null, country: null, city: { not: null } },
      select: { id: true, city: true, region: true },
    })

    console.log(`${candidates.length} vaga(s) aberta(s) sem país, com cidade preenchida.`)

    const resolved: { id: string; country: string }[] = []
    const byCountry = new Map<string, number>()

    for (const job of candidates) {
      const country = inferCountryFromLocation(job.city, job.region)
      if (!country) continue
      resolved.push({ id: job.id, country })
      byCountry.set(country, (byCountry.get(country) ?? 0) + 1)
    }

    console.log(`\n${resolved.length} de ${candidates.length} resolvidas para um país:\n`)
    for (const [country, n] of [...byCountry.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${country.padEnd(4)} ${n}`)
    }
    console.log(
      `\n${candidates.length - resolved.length} continuam sem país — texto sem match na lista, ` +
        'não é um palpite forçado.'
    )

    if (DRY_RUN) {
      console.log('\n--dry-run: nada foi gravado.')
      return
    }

    let written = 0
    for (let i = 0; i < resolved.length; i += BATCH_SIZE) {
      const batch = resolved.slice(i, i + BATCH_SIZE)
      await db.$transaction(
        batch.map((r) => db.job.update({ where: { id: r.id }, data: { country: r.country } }))
      )
      written += batch.length
      console.log(`  ${written}/${resolved.length} gravadas...`)
    }

    console.log(`\n${written} vaga(s) atualizada(s) com país inferido.`)
  } finally {
    await db.$disconnect()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
