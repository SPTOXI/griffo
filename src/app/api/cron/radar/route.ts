export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { runRadar } from '@/lib/radar/runner'
import { greenhouseAdapters } from '@/lib/jobs/adapters/greenhouse'

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
 * ## As fontes
 *
 * O Greenhouse foi conferido contra a API real e está ligado — o que foi
 * observado, e o que continua sem observação, está no cabeçalho de
 * `lib/jobs/adapters/greenhouse.ts`.
 *
 * Quais boards a instalação varre sai de `GREENHOUSE_BOARDS`; sem essa
 * variável valem os boards já conferidos. Acrescentar um board é mudar a
 * variável, não o código — mas conferir o board antes continua sendo
 * obrigatório, pelo motivo descrito lá.
 *
 * A lista é montada **dentro** do handler, e não no módulo: assim ela lê o
 * ambiente de execução, e não o do build.
 *
 * ## Limites do plano, não do desenho
 *
 * O agendamento é DIÁRIO e o teto da função é 60s porque a conta Vercel é
 * Hobby, que não aceita mais que um cron por dia nem função além de um minuto.
 * A primeira tentativa usava `0 * * * *` e 300s, e o deploy foi recusado com
 * essa mensagem.
 *
 * Isso tem custo real e visível: com uma rodada por dia e `USERS_PER_RUN`
 * usuários por rodada, a fila gira devagar. No plano Pro basta trocar o cron
 * para de hora em hora, subir `maxDuration` e aumentar `USERS_PER_RUN` — nada
 * na lógica muda.
 */
/** Prazo de cada fonte. Precisa deixar folga dentro dos 60s para a avaliação. */
const COLLECTION_BUDGET_MS = 12_000

/**
 * Quanto da janela de 60s a rodada pode usar antes de parar por conta própria.
 *
 * A margem existe para que a função **responda** em vez de ser morta pela
 * plataforma. Um 504 não diz o que rodou nem o que faltou; uma resposta com
 * `ranOutOfTime: true` diz as duas coisas — e é ela que permite saber se a
 * fila está girando.
 */
const RUN_BUDGET_MS = 45_000

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
  const adapters = greenhouseAdapters(process.env.GREENHOUSE_BOARDS)

  try {
    const summary = await runRadar({
      adapters,
      collectionBudgetMs: COLLECTION_BUDGET_MS,
      deadlineAt: startedAt + RUN_BUDGET_MS,
    })

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      sourcesConfigured: adapters.length,
      sources: adapters.map((a) => a.descriptor.slug),
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
