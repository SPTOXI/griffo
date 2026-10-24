export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAppUrl } from '@/lib/env'
import { isLikelyBot } from '@/lib/analytics/funnel'
import { trackServerEvent } from '@/lib/analytics/track.server'
import { isValidToken } from '@/lib/match-preview/rules'
import { isLeadEmailStep, leadResultUrl } from '@/lib/match-preview/links'

/**
 * Clique num link dos e-mails do envio sem conta: grava `lead_email_clicked`
 * e redireciona ao resultado. Token ou passo inválido vai para a página inicial,
 * sem gravar nada. Robô conhecido (pré-visualizador de link) redireciona sem
 * contar o clique.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const step = req.nextUrl.searchParams.get('s')
  const appUrl = getAppUrl()
  if (!isValidToken(token) || !isLeadEmailStep(step)) return NextResponse.redirect(appUrl, 302)

  if (!isLikelyBot(req.headers.get('user-agent'))) {
    const lead = await db.visitorLead.findUnique({ where: { id: token }, select: { visitorId: true } }).catch(() => null)
    if (lead) await trackServerEvent('lead_email_clicked', { req, visitorId: lead.visitorId, meta: { step } })
  }
  return NextResponse.redirect(leadResultUrl(appUrl, token, step), 302)
}
