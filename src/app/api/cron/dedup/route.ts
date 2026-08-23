export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { runAiDeduplicationClean } from '@/lib/jobs/agent-dedup'

/**
 * Cron de Faxina Semântica de Vagas Duplicadas (§14).
 *
 * Roda automaticamente 12 horas após a coleta principal do Radar (às 18:00 UTC),
 * garantindo que a base de dados permaneça limpa e unificada sem impactar
 * as buscas em tempo real dos usuários.
 *
 * Autenticação via `CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now()

  /**
   * 1. Autenticação estrita do Cron — e "estrita" quer dizer fechada quando
   *    falta configuração, não aberta.
   *
   * A forma anterior era `if (secret) { ...confere... }`: sem `CRON_SECRET`
   * definida, o bloco inteiro era pulado e a rota executava para qualquer um.
   * Ou seja, a única situação em que a verificação realmente precisava valer —
   * o ambiente mal configurado — era exatamente aquela em que ela não valia, e
   * o sintoma era nenhum: a rota respondia 200 normalmente.
   *
   * `/api/cron/radar` já responde 503 nesse caso, pelo mesmo motivo escrito no
   * cabeçalho de lá: uma rota que gasta IA paga e escreve no banco não pode
   * ficar aberta porque alguém esqueceu de definir uma variável.
   */
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/dedup] CRON_SECRET não configurado — a faxina não é executada.')
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado. A faxina não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    // Executa a faxina semântica por até 45s (com folga para o timeout de 60s da Vercel)
    const summary = await runAiDeduplicationClean({
      maxPairsToAnalyze: 25,
      timeBudgetMs: 45_000,
    })

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      summary,
    })
  } catch (error: any) {
    console.error('[cron/dedup] Erro na execução da faxina automática:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Falha na faxina automática de duplicadas.', durationMs: Date.now() - startedAt },
      { status: 500 }
    )
  }
}
