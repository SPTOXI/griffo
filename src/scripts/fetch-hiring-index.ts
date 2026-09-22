import { createPrismaClient, databaseUrlFromEnv } from '../lib/prisma-client'
import { loadEnvFile } from './load-env'
import {
  DEFAULT_TIME_BUDGET_MS,
  collectHiringIndexPoints,
  persistHiringIndexPoints,
  summarizeCollection,
} from '../lib/hiring-index/collect'

/**
 * Busca as séries oficiais de mercado de trabalho e grava os pontos.
 *
 * ## Para que serve
 *
 * É o gatilho MANUAL: existe para que a coleta possa ser rodada sob os olhos de
 * uma pessoa, e o resultado conferido antes de se confiar nele. O gatilho
 * automático é `/api/cron/hiring-index` (§2.52), e os dois rodam exatamente a
 * mesma lógica — `lib/hiring-index/collect.ts` — de propósito: dois laços de
 * coleta escritos separadamente divergiriam, e o defeito apareceria num país
 * só, meses depois.
 *
 *   npx tsx src/scripts/fetch-hiring-index.ts --dry-run
 *   npx tsx src/scripts/fetch-hiring-index.ts
 *
 * `--dry-run` não toca no banco: busca, classifica e imprime.
 *
 * ## Por que o Prisma é instanciado aqui
 *
 * `lib/db` carrega `server-only`, um pacote cujo `index.js` é um `throw`. Num
 * script de linha de comando ele mata o processo no import. Mesma razão de
 * `migrate-credits-to-analyses.ts` — e é por isso que `collect.ts` recebe o
 * cliente por parâmetro em vez de importar um dos dois.
 *
 * ## Idempotente por construção
 *
 * `upsert` na chave `(country, source, metric, period)`. Rodar duas vezes no
 * mesmo dia não duplica nada, e a segunda leitura de um mês que o JOLTS
 * revisou substitui a primeira.
 */

loadEnvFile()

const DRY_RUN = process.argv.includes('--dry-run')

if (!DRY_RUN && !process.env.POSTGRES_PRISMA_URL) {
  throw new Error(
    'POSTGRES_PRISMA_URL não encontrada. Defina as URLs do banco no .env da raiz, ' +
      'ou rode com --dry-run para só buscar e imprimir.'
  )
}

async function run(): Promise<void> {
  const { sources, points } = await collectHiringIndexPoints({
    blsApiKey: process.env.BLS_API_KEY ?? null,
    timeBudgetMs: DEFAULT_TIME_BUDGET_MS,
  })

  for (const source of sources) {
    console.log(
      `[${source.slug}] ${source.outcome} — ${source.points} ponto(s) em ${source.elapsedMs}ms` +
        (source.error ? `\n  aviso: ${source.error}` : '')
    )
  }

  if (points.length === 0) {
    console.log('\nNenhum ponto coletado. Nada foi gravado.')
    return
  }

  // Um país por vez, cada um contra a própria história. Nunca um ranking —
  // ver o cabeçalho de lib/hiring-index/types.ts.
  const series = summarizeCollection(points)

  console.log(`\n${series.length} série(s) de país, ${points.length} ponto(s) no total:\n`)

  for (const s of series) {
    const situation = s.phase ?? `sem classificação (${s.insufficientDataReason})`
    console.log(
      `  ${`${s.country}|${s.source}|${s.metric}`.padEnd(34)} ${situation.padEnd(28)} ` +
        `n=${String(s.pointsUsed).padStart(3)} ` +
        `conf=${s.confidence} ` +
        `mm=${s.latest?.toFixed(2) ?? '—'} ` +
        `${s.latestIsPreliminary ? '(janela com preliminar)' : ''}`
    )
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: nada foi gravado.')
    return
  }

  const db = createPrismaClient(databaseUrlFromEnv())
  try {
    const written = await persistHiringIndexPoints(db, points)
    console.log(`\n${written} ponto(s) gravado(s).`)
  } finally {
    await db.$disconnect()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
