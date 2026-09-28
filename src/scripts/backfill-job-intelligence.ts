import { loadEnvFile } from './load-env'

/**
 * Lê de uma vez o estoque de vagas ainda sem ficha (§2.138, §2.143).
 *
 *   npm run jobs:backfill-intelligence
 *   npm run jobs:backfill-intelligence -- --max-usd 5 --hours 3
 *
 * ## Por que um script, e não o cron
 *
 * O cron roda numa função de 60s e só começa leituras nos primeiros ~27s dela
 * (~48 vagas por rodada), e o agendador do GitHub Actions o dispara a cada
 * 3–5h, não a cada 30 min (§2.140). Aqui não há teto de 60s: o script lê sem
 * parar, 6 de cada vez no DeepSeek. Pega as MAIS ANTIGAS primeiro; o cron pega
 * as mais recentes, então os dois podem rodar juntos.
 *
 * ## Travas
 *
 * - `--max-usd` (padrão 120): para quando o custo somado da rodada passa disto.
 *   No DeepSeek o estoque inteiro custa poucos dólares; a trava é contra erro.
 * - `--hours` (padrão 12): para depois disto, termine ou não.
 * - Ctrl+C para no fim da vaga em andamento; o que foi lido fica gravado.
 * - Queda de rede (banco): espera e segue, até 6 quedas seguidas (§2.145).
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

/**
 * Queda de rede na máquina de quem roda (§2.145). O pool do `pg` emite `error`
 * quando uma conexão OCIOSA cai e, sem ouvinte (o adapter do Prisma não põe
 * um), o Node derruba o processo. O pool já descartou a conexão morta e abre
 * outra na próxima consulta, então aqui basta não morrer.
 */
function isDroppedDbConnection(e: unknown): boolean {
  const err = e as { message?: string; code?: string } | null
  return (
    /Connection terminated unexpectedly|Connection terminated due to connection timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|Can't reach database server/i.test(
      err?.message ?? ''
    ) || ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'P1001', 'P1017'].includes(err?.code ?? '')
  )
}

process.on('uncaughtException', (e) => {
  if (isDroppedDbConnection(e)) {
    console.log(`${new Date().toISOString().slice(11, 19)}  conexão com o banco caiu; seguindo com uma nova.`)
    return
  }
  console.error(e)
  process.exit(1)
})

/** Quedas seguidas toleradas antes de desistir; cada uma espera um pouco mais. */
const MAX_NETWORK_RETRIES = 6

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

  let networkRetries = 0
  while (!stopping && Date.now() < endsAt && total.costUsd < MAX_USD) {
    let run: Awaited<ReturnType<typeof extractPendingJobIntelligence>>
    let pending: number
    try {
      run = await extractPendingJobIntelligence(Math.min(Date.now() + LAP_MS, endsAt), 'backfill')
      for (const key of Object.keys(total) as (keyof typeof total)[]) total[key] += run[key]
      pending = await countPendingJobIntelligence()
      networkRetries = 0
    } catch (e) {
      // Uma consulta em andamento na hora da queda rejeita aqui. O que já foi
      // lido está gravado; a volta seguinte pega o resto.
      if (!isDroppedDbConnection(e) || ++networkRetries > MAX_NETWORK_RETRIES) throw e
      const waitS = 15 * networkRetries
      console.log(
        `${new Date().toISOString().slice(11, 19)}  sem conexão (${(e as Error).message}). ` +
          `Tentando de novo em ${waitS}s (${networkRetries}/${MAX_NETWORK_RETRIES}).`
      )
      await new Promise((r) => setTimeout(r, waitS * 1000))
      continue
    }

    console.log(
      `${new Date().toISOString().slice(11, 19)}  lidas ${total.read} (seção de requisitos: ${total.fromRequirementsText},` +
        ` pelo suplente: ${total.viaFallback})  curtas ${total.tooShort}  falhas ${total.failed}` +
        `  US$ ${total.costUsd.toFixed(2)}  pendentes ${pending}`
    )

    // O sinal de que o provedor principal parou de responder: as leituras
    // seguem, mas pelo suplente — que pode ser bem mais caro.
    if (run.read >= 6 && run.viaFallback / run.read > 1 / 3) {
      console.log(
        `\n  ATENÇÃO: ${run.viaFallback} de ${run.read} vagas desta volta foram lidas pelo suplente porque o` +
          ` provedor principal não respondeu a tempo. Confira saldo e status dele, ou pare com Ctrl+C.\n`
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
