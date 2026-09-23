import { loadEnvFile } from './load-env'

/**
 * Lê de uma vez o estoque de vagas ainda sem ficha, no Kimi K3 (§2.138).
 *
 *   npm run jobs:backfill-intelligence
 *   npm run jobs:backfill-intelligence -- --max-usd 50 --hours 3
 *
 * ## Por que um script, e não o cron
 *
 * O cron roda a cada 30 minutos numa função de 60s, e só começa leituras nos
 * primeiros ~27s dela. No DeepSeek (3,4s, 6 em paralelo) isso dá ~48 vagas por
 * rodada, ~2.300 por dia. No Kimi (~12s, teto de 3 simultâneas por
 * organização) daria ~9 por rodada, ~430 por dia — e com ~230 vagas novas por
 * dia entrando, o estoque de ~6,5 mil levaria um mês para acabar.
 *
 * Aqui não há teto de 60s: o script lê sem parar, 3 de cada vez, ~15 vagas por
 * minuto — o estoque inteiro em algumas horas. Pega as MAIS ANTIGAS primeiro;
 * o cron pega as mais recentes, então os dois podem rodar juntos.
 *
 * ## Travas
 *
 * - `--max-usd` (padrão 120): para quando o custo somado da rodada passa disto.
 *   É crédito do Kimi, mas crédito também acaba.
 * - `--hours` (padrão 12): para depois disto, termine ou não.
 * - Ctrl+C para no fim da vaga em andamento; o que foi lido fica gravado.
 * - Idempotente: vaga lida ganha marcador e não volta. Rodar de novo continua
 *   de onde parou.
 *
 * Precisa só de `POSTGRES_PRISMA_URL` no `.env`: as chaves de IA vêm do banco,
 * como na produção.
 */

loadEnvFile()

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`)
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const MAX_USD = arg('max-usd', 120)
const HOURS = arg('hours', 12)
/** Cada volta dura isto; entre voltas o script imprime o progresso. */
const LAP_MS = 5 * 60_000

let stopping = false
process.on('SIGINT', () => {
  if (stopping) process.exit(130)
  stopping = true
  console.log('\nParando no fim da volta em andamento (Ctrl+C de novo encerra na hora).')
})

async function main() {
  if (!process.env.POSTGRES_PRISMA_URL) {
    throw new Error('POSTGRES_PRISMA_URL não encontrada. Defina a URL do banco no .env da raiz.')
  }

  // Depois do `.env`: `lib/db` lê a URL ao ser importado.
  const { extractPendingJobIntelligence, countPendingJobIntelligence } = await import(
    '../lib/jobs/intelligence.server'
  )

  const endsAt = Date.now() + HOURS * 3_600_000
  const total = { read: 0, fromRequirementsText: 0, viaFallback: 0, empty: 0, tooShort: 0, unparseable: 0, failed: 0, costUsd: 0 }

  console.log(`Pendentes: ${await countPendingJobIntelligence()}. Teto: US$ ${MAX_USD}, ${HOURS}h.`)

  while (!stopping && Date.now() < endsAt && total.costUsd < MAX_USD) {
    const run = await extractPendingJobIntelligence(Math.min(Date.now() + LAP_MS, endsAt), 'backfill')
    for (const key of Object.keys(total) as (keyof typeof total)[]) total[key] += run[key]

    const pending = await countPendingJobIntelligence()
    console.log(
      `${new Date().toISOString().slice(11, 19)}  lidas ${total.read} (seção de requisitos: ${total.fromRequirementsText},` +
        ` no DeepSeek por falha do Kimi: ${total.viaFallback})  curtas ${total.tooShort}  falhas ${total.failed}` +
        `  US$ ${total.costUsd.toFixed(2)}  pendentes ${pending}`
    )

    // O sinal de que o Kimi parou de responder: as leituras seguem, mas pelo
    // DeepSeek. Não é erro — a vaga é lida do mesmo jeito —, mas não é o que
    // foi decidido, e quem roda precisa saber.
    if (run.read >= 6 && run.viaFallback / run.read > 1 / 3) {
      console.log(
        `\n  ATENÇÃO: ${run.viaFallback} de ${run.read} vagas desta volta foram lidas pelo DeepSeek porque o Kimi` +
          ` não respondeu a tempo. Confira o saldo e o status da Moonshot, ou pare com Ctrl+C.\n`
      )
    }

    if (pending === 0) break
    if (run.stoppedBy === 'provider_failures') {
      console.log('Três falhas seguidas do provedor. Parando; rode de novo mais tarde.')
      break
    }
    if (run.stoppedBy === 'done' && run.read + run.tooShort + run.unparseable === 0) {
      console.log('Nada lido nesta volta. Parando.')
      break
    }
  }

  console.log('\nFim.', JSON.stringify({ ...total, costUsd: Number(total.costUsd.toFixed(4)) }))
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
