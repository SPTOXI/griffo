export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAppUrl } from '@/lib/env'
import { escapeHtml } from '@/lib/email/digest'
import { isValidToken } from '@/lib/match-preview/rules'
import { nurtureCopy } from '@/lib/match-preview/nurture-copy'
import { unsubscribeLead } from '@/lib/match-preview/server'

/**
 * Sair da sequência de e-mails de quem enviou o currículo pela página inicial.
 *
 * Mesmo desenho do descadastro do Radar (`/api/radar/unsubscribe`): **GET
 * mostra uma página e não desliga nada**, porque antivírus e pré-visualização
 * de link abrem as URLs de um e-mail sozinhos; **POST desliga**, e é o que o
 * botão nativo do Gmail/Outlook manda (RFC 8058, `List-Unsubscribe-Post`).
 *
 * O token é o id do lead — a mesma credencial do link de resultado que a
 * pessoa já recebeu. Link inválido ou já usado responde a mesma página de
 * "pronto": não há o que revelar sobre quem existe ou não.
 */

function page(lang: string, body: string): NextResponse {
  const html = [
    `<!doctype html><html lang="${escapeHtml(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">`,
    '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">',
    '<title>GriffoWork</title></head>',
    '<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:48px 16px">',
    '<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;color:#18181b">',
    body,
    '</div></body></html>',
  ].join('')
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

async function langFor(token: string | null): Promise<string> {
  if (!isValidToken(token)) return 'en'
  const lead = await db.visitorLead.findUnique({ where: { id: token }, select: { lang: true } }).catch(() => null)
  return lead?.lang ?? 'en'
}

function donePage(lang: string): NextResponse {
  const c = nurtureCopy(lang)
  return page(
    lang,
    [
      `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(c.unsubscribedTitle)}</h1>`,
      `<p style="color:#3f3f46;line-height:1.6;margin:0 0 20px">${escapeHtml(c.unsubscribedText)}</p>`,
      `<a href="${escapeHtml(getAppUrl())}" style="color:#0B63E5">GriffoWork</a>`,
    ].join('')
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const lang = await langFor(token)
  const c = nurtureCopy(lang)
  if (!isValidToken(token)) return donePage(lang)
  return page(
    lang,
    [
      `<h1 style="font-size:20px;margin:0 0 20px">${escapeHtml(c.unsubscribeConfirm)}</h1>`,
      `<form method="post" action="/api/public/lead-unsubscribe?t=${token}">`,
      `<button type="submit" style="background:#0B192E;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-weight:bold;cursor:pointer">${escapeHtml(c.unsubscribe)}</button>`,
      '</form>',
    ].join('')
  )
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const lang = await langFor(token)
  if (isValidToken(token)) {
    await unsubscribeLead(token).catch((e: any) => console.error('[lead-unsubscribe] falhou:', e?.message || e))
  }
  return donePage(lang)
}
