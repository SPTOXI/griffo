export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

import { NextResponse } from 'next/server'
import { runRadar } from '@/lib/radar/runner'
import type { JobSourceAdapter } from '@/lib/jobs/adapter'

/**
 * O gatilho do Radar (§28).
 *
 * O Radar "precisa funcionar mesmo quando ninguém estiver olhando a tela", e é
 * por isso que a entrada é um cron e não uma ação de usuário.
 *
 * ## Autenticação
 *
 * `CRON_SECRET`, comparado por igualdade simples com o cabeçalho
 * `Authorization`. A Vercel envia esse cabeçalho automaticamente nos crons
 * declarados em `vercel.json`.
 *
 * Sem o segredo configurado a rota responde 503 e NÃO roda. Uma rota que
 * dispara coleta e escreve no banco não pode ficar aberta porque alguém
 * esqueceu de definir uma variável de ambiente.
 *
 * ## Por que a lista de fontes está vazia
 *
 * O único adapter escrito — Greenhouse — nunca foi verificado contra a API
 * real (ver o cabeçalho de `lib/jobs/adapters/greenhouse.ts`). Ligá-lo aqui
 * antes dessa verificação colocaria em produção uma coleta cujo comportamento
 * ninguém observou, que é exatamente o cenário que o §12 existe para conter.
 *
 * A rodada roda assim mesmo: sem fontes ela não coleta nada, mas continua
 * avaliando as vagas já existentes e decidindo alertas. Acrescentar a primeira
 * fonte é acrescentar uma entrada em `ACTIVE_ADAPTERS`.
 */
const ACTIVE_ADAPTERS: JobSourceAdapter[] = []

/** Prazo de cada fonte. O teto da função é 300s; sobra tempo para avaliar. */
const COLLECTION_BUDGET_MS = 20_000

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado. A rodada não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const summary = await runRadar({
      adapters: ACTIVE_ADAPTERS,
      collectionBudgetMs: COLLECTION_BUDGET_MS,
    })

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      sourcesConfigured: ACTIVE_ADAPTERS.length,
      ...summary,
    })
  } catch (e: any) {
    console.error('[cron/radar] rodada falhou:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Falha na rodada do Radar.', durationMs: Date.now() - startedAt },
      { status: 500 }
    )
  }
}
