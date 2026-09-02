import { PrismaClient } from '@prisma/client'
import { loadEnvFile } from './load-env'
import { createBlsJoltsConnector } from '../lib/hiring-index/connectors/bls-jolts'
import { createEurostatConnector } from '../lib/hiring-index/connectors/eurostat'
import { classifyHiringPhase } from '../lib/hiring-index/phase'
import type { LaborMarketConnector, LaborMarketPointInput } from '../lib/hiring-index/types'

/**
 * Busca as séries oficiais de mercado de trabalho e grava os pontos.
 *
 * ## Para que serve, e para que NÃO serve
 *
 * É o gatilho manual da fase 1: existe para que a coleta possa ser rodada de
 * verdade contra as APIs de verdade, e o resultado conferido por uma pessoa,
 * antes de qualquer coisa disto virar tela ou cron. **Não é o pipeline de
 * produção** — ligar isto no `/api/cron/radar` é fase 2, e a decisão de ligar é
 * de quem ler a saída daqui primeiro.
 *
 *   npx tsx src/scripts/fetch-hiring-index.ts --dry-run
 *   npx tsx src/scripts/fetch-hiring-index.ts
 *
 * `--dry-run` não toca no banco: busca, classifica e imprime. É o modo
 * recomendado para a primeira execução.
 *
 * ## Por que o Prisma é instanciado aqui
 *
 * `lib/db` carrega `server-only`, um pacote cujo `index.js` é um `throw`. Num
 * script de linha de comando ele mata o processo no import. Mesma razão de
 * `migrate-credits-to-analyses.ts`.
 *
 * ## Idempotente por construção
 *
 * `upsert` na chave `(country, source, metric, period)`. Rodar duas vezes no
 * mesmo dia não duplica nada, e a segunda leitura de um mês que o JOLTS
 * revisou substitui a primeira — que é exatamente o comportamento desejado.
 */

loadEnvFile()

const DRY_RUN = process.argv.includes('--dry-run')

if (!DRY_RUN && !process.env.POSTGRES_PRISMA_URL) {
  throw new Error(
    'POSTGRES_PRISMA_URL não encontrada. Defina as URLs do banco no .env da raiz, ' +
      'ou rode com --dry-run para só buscar e imprimir.'
  )
}

/** Teto por fonte. Nenhuma das duas APIs demora perto disso em condição normal. */
const TIME_BUDGET_MS = 30_000

async function run(): Promise<void> {
  const connectors: LaborMarketConnector[] = [
    createBlsJoltsConnector({ registrationKey: process.env.BLS_API_KEY ?? null }),
    createEurostatConnector(),
  ]

  const collected: LaborMarketPointInput[] = []

  for (const connector of connectors) {
    const startedAt = Date.now()
    const result = await connector.fetchPoints({ timeBudgetMs: TIME_BUDGET_MS })
    const elapsed = Date.now() - startedAt

    console.log(
      `[${connector.descriptor.slug}] ${result.outcome} — ${result.points.length} ponto(s) em ${elapsed}ms` +
        (result.error ? `\n  aviso: ${result.error}` : '')
    )

    // Coleta que falhou não grava nada dessa fonte. Uma resposta vazia não é
    // um mercado vazio, e meia série gravada é pior que nenhuma: a média móvel
    // leria o buraco como movimento.
    if (result.outcome === 'failed') continue

    collected.push(...result.points)
  }

  if (collected.length === 0) {
    console.log('\nNenhum ponto coletado. Nada foi gravado.')
    return
  }

  // Um país por vez, cada um contra a própria história. Nunca um ranking —
  // ver o cabeçalho de lib/hiring-index/types.ts.
  const byCountry = new Map<string, LaborMarketPointInput[]>()
  for (const point of collected) {
    const key = `${point.country}|${point.source}|${point.metric}`
    const list = byCountry.get(key) ?? []
    list.push(point)
    byCountry.set(key, list)
  }

  console.log(`\n${byCountry.size} série(s) de país, ${collected.length} ponto(s) no total:\n`)

  for (const [key, points] of [...byCountry].sort(([a], [b]) => a.localeCompare(b))) {
    const analysis = classifyHiringPhase(points)
    const situation =
      analysis.phase ?? `sem classificação (${analysis.insufficientDataReason})`
    console.log(
      `  ${key.padEnd(34)} ${situation.padEnd(28)} ` +
        `n=${String(analysis.pointsUsed).padStart(3)} ` +
        `conf=${analysis.confidence} ` +
        `mm=${analysis.latest?.toFixed(2) ?? '—'} ` +
        `${analysis.latestIsPreliminary ? '(janela com preliminar)' : ''}`
    )
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: nada foi gravado.')
    return
  }

  const db = new PrismaClient()
  try {
    let written = 0
    for (const point of collected) {
      await db.laborMarketPoint.upsert({
        where: {
          country_source_metric_period: {
            country: point.country,
            source: point.source,
            metric: point.metric,
            period: point.period,
          },
        },
        create: { ...point, fetchedAt: new Date() },
        // `fetchedAt` reescrito de propósito: o que interessa é quando o
        // número foi lido pela última vez, não quando foi visto pela primeira.
        update: {
          value: point.value,
          unit: point.unit,
          periodType: point.periodType,
          revised: point.revised,
          seriesBreak: point.seriesBreak,
          confidence: point.confidence,
          note: point.note,
          fetchedAt: new Date(),
        },
      })
      written++
    }
    console.log(`\n${written} ponto(s) gravado(s).`)
  } finally {
    await db.$disconnect()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
