export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { NextRequest, NextResponse } from 'next/server'
import { runRetentionPurge } from '@/lib/retention'

/**
 * Gatilho automático da retenção.
 *
 * ## O buraco que isto fecha
 *
 * `runRetentionPurge` existia desde sempre, mas o único caminho até ele era
 * `POST /api/admin/retention` — acionado **por um humano clicando no painel**.
 * O comentário daquela rota dizia, com todas as letras, que o agendamento
 * "fica como passo operacional, não de código".
 *
 * Ficou, e o resultado previsível é que não aconteceu. Isso não atrasava só a
 * faxina de vagas: a mesma função aplica os tetos de retenção de DADO PESSOAL
 * — currículo de conta inativa, log de IA, trilha de auditoria, evento de
 * webhook, histórico de ofertas do Radar. Uma política de retenção que depende
 * de alguém lembrar de clicar não é uma política de retenção; é uma intenção.
 *
 * ## Por que não entrou no `vercel.json`
 *
 * O plano Hobby dá direito a **dois** crons, e os dois já estão ocupados
 * (`radar` 06:00, `dedup` 18:00). Um terceiro ali não falharia ruidosamente —
 * seria ignorado, que é exatamente o tipo de configuração que parece feita e
 * não está.
 *
 * O precedente da casa é o §2.101: quando o limite bateu para o
 * `hiring-index`, o gatilho virou GitHub Actions chamando esta mesma forma de
 * rota com `Bearer $CRON_SECRET`. É o que `.github/workflows/retention-daily.yml`
 * faz aqui.
 *
 * ## Por que não pendurar no cron do Radar
 *
 * Mesmo motivo do `hiring-index`: orçamento. O Radar divide 60s entre coleta
 * de todas as fontes, avaliação e digest, e `purgeAgedJobs` sozinho pode gastar
 * quase tudo num acervo acumulado (até 20 transações de 20s). Somar as duas
 * cargas faria as duas terminarem pela metade — e a interrompida seria a que
 * roda por último, sempre.
 *
 * ## Autenticação
 *
 * Idêntica à do `radar` e à do `dedup`, inclusive na parte que importa: sem
 * `CRON_SECRET` configurado a rota responde **503 e não roda**. Uma rota que
 * apaga dado em produção não pode ficar aberta porque alguém esqueceu de
 * definir uma variável de ambiente.
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now()

  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/retention] CRON_SECRET não configurado — a retenção não é executada.')
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado. A retenção não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (!cronAuthorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const report = await runRetentionPurge()

    /**
     * `runRetentionPurge` isola cada etapa e NUNCA lança: um erro numa delas
     * vira linha em `report.errors` e as outras seguem. Por isso o sucesso da
     * chamada não significa sucesso do expurgo, e devolver 200 com erros
     * dentro faria o workflow do GitHub Actions passar verde sobre uma
     * retenção quebrada.
     *
     * Etapa com erro devolve 500. O corpo vai junto nos dois casos, com o
     * relatório inteiro — é o que se lê na aba Actions quando algo falha.
     */
    const status = report.errors.length > 0 ? 500 : 200

    return NextResponse.json(
      { ok: report.errors.length === 0, durationMs: Date.now() - startedAt, report },
      { status }
    )
  } catch (e: any) {
    console.error('[cron/retention] Falha inesperada:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Falha na retenção automática.', durationMs: Date.now() - startedAt },
      { status: 500 }
    )
  }
}
