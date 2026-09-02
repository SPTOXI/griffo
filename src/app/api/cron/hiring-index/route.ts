export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  collectHiringIndexPoints,
  persistHiringIndexPoints,
  summarizeCollection,
} from '@/lib/hiring-index/collect'

/**
 * O gatilho automático do índice de temperatura de contratação (§2.52).
 *
 * ## Por que uma rota separada, e não uma etapa do `/api/cron/radar`
 *
 * O cron do Radar tem teto de 12s POR fonte dentro de uma janela de 60s que já
 * divide com o envio do digest, e a conta é apertada de propósito (ver o
 * cabeçalho daquele arquivo). Enfiar duas APIs de estatística oficial ali
 * disputaria o tempo da coleta de vagas — que é diária porque vaga expira — com
 * uma coleta que não tem pressa nenhuma: o JOLTS publica uma vez por mês e o
 * Eurostat, uma vez por trimestre. São dois trabalhos com relógios diferentes.
 *
 * ## Frequência
 *
 * Rodar isto por dia é desperdício: entre duas divulgações, a coleta reescreve
 * as mesmas linhas com os mesmos valores. Algo entre semanal e mensal cobre
 * qualquer atraso de publicação com folga.
 *
 * **TODO (decisão do operador, não do código):** declarar o agendamento em
 * `vercel.json`. Não foi feito aqui de propósito, por dois motivos que são de
 * plataforma e custam dinheiro: (1) o plano Hobby limita o número de crons e a
 * frequência — a conta já tem dois declarados (`/api/cron/radar` às 06:00 e
 * `/api/cron/dedup` às 18:00), e a primeira tentativa de agendar o Radar de
 * hora em hora foi RECUSADA no deploy com essa mensagem; (2) qual dia e qual
 * hora é escolha de quem paga a invocação. Enquanto não for agendado, a rota
 * funciona e pode ser chamada à mão com o mesmo `Authorization: Bearer
 * $CRON_SECRET` dos outros crons — e o script manual
 * `src/scripts/fetch-hiring-index.ts` continua valendo, compartilhando
 * exatamente a mesma lógica (`lib/hiring-index/collect.ts`).
 *
 * ## Autenticação
 *
 * Idêntica à do `/api/cron/radar`: `CRON_SECRET` comparado com o cabeçalho
 * `Authorization`, e 503 quando o segredo não está configurado. Uma rota que
 * dispara coleta e escreve no banco não fica aberta porque alguém esqueceu uma
 * variável de ambiente. O teto de requisições do `/api/cron` no
 * `src/middleware.ts` (20 por 10 minutos) já vale para este caminho sem
 * nenhuma mudança lá.
 */

/** Teto por fonte. As duas juntas levaram ~1,2s na coleta real de 01/09/2026. */
const SOURCE_BUDGET_MS = 20_000

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado. A coleta não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const { sources, points } = await collectHiringIndexPoints({
      blsApiKey: process.env.BLS_API_KEY ?? null,
      timeBudgetMs: SOURCE_BUDGET_MS,
    })

    const series = summarizeCollection(points)
    const written = points.length > 0 ? await persistHiringIndexPoints(db, points) : 0

    // O log estruturado é o que permite ver, nos Runtime Logs da Vercel, se uma
    // fonte parou de responder sem esperar alguém abrir a tela e estranhar.
    console.log(
      `[cron/hiring-index] ${sources.map((s) => `${s.slug}=${s.outcome}(${s.points})`).join(' ')} ` +
        `séries=${series.length} gravados=${written} em ${Date.now() - startedAt}ms`
    )

    return NextResponse.json({
      ok: true,
      elapsedMs: Date.now() - startedAt,
      sources,
      seriesCount: series.length,
      written,
      /**
       * Quantas séries não deram para classificar. NÃO é contagem de erro: com
       * poucos períodos ou quebra de série recente, `null` é a resposta certa
       * (ver `phase.ts`). Está aqui para que uma queda brusca deste número, ou
       * um salto, seja visível no log.
       */
      unclassified: series.filter((s) => s.phase === null).length,
    })
  } catch (e: any) {
    console.error('[cron/hiring-index] falhou:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Falha na coleta.', elapsedMs: Date.now() - startedAt },
      { status: 500 }
    )
  }
}
