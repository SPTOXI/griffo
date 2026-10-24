export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { cronAuthorized } from '@/lib/cron-auth'
import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredVisitorLeads, sendDueNurtureEmails } from '@/lib/match-preview/server'

/**
 * Purga horária dos currículos enviados sem conta na landing (§2.132).
 *
 * A promessa pública é "apagamos em até 24 horas". A retenção diária
 * (`/api/cron/retention`) não basta para isso: rodando uma vez por dia, uma
 * linha vencida esperaria até quase 24 horas A MAIS. Por isso esta rota roda de
 * hora em hora (`.github/workflows/visitor-leads-hourly.yml`), e a linha vence
 * em 22h (`DELETE_AFTER_HOURS`), com folga para o atraso de agendamento do
 * GitHub Actions.
 *
 * Na mesma rodada sai a sequência de e-mails de quem pediu vagas e dicas
 * (`sendDueNurtureEmails`, dias 1, 3 e 7), para não ocupar outro agendamento.
 *
 * Mesma autenticação das outras rotas de cron: sem `CRON_SECRET`, 503 e nada roda.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/visitor-leads] CRON_SECRET não configurado — a purga não é executada.')
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado. A purga não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (!cronAuthorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const deleted = await purgeExpiredVisitorLeads()
    // A purga é a promessa pública; a sequência não pode derrubá-la.
    const nurture = await sendDueNurtureEmails().catch((e: any) => {
      console.error('[cron/visitor-leads] Falha na sequência de e-mails:', e?.message || e)
      return null
    })
    return NextResponse.json({ ok: true, deleted, nurture })
  } catch (e: any) {
    console.error('[cron/visitor-leads] Falha na purga:', e?.message || e)
    return NextResponse.json({ ok: false, error: 'Falha na purga.' }, { status: 500 })
  }
}
