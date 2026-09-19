export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'
import { parsePdfBase64 } from '@/lib/pdf-text'
import { scoreAtsReadability } from '@/lib/ats-check/score'
import { ATS_FREE_WINDOW_MS, ipKeyFor, ipMetaNeedle } from '@/lib/ats-check/quota'
import { isLikelyBot } from '@/lib/analytics/funnel'
import { clientIpFrom } from '@/lib/request-ip'
import { edgeCountry } from '@/lib/pricing/edge-country'
import { MAX_RESUME_CHARS } from '@/lib/validation'

/**
 * Teste de legibilidade ATS — PÚBLICO, sem login, UM por pessoa a cada 24h.
 *
 * - A cota vive no banco (vale para todas as instâncias), por navegador E por
 *   hash de IP — ver `lib/ats-check/quota.ts`. Quem já testou recebe 402 e a
 *   tela oferece o cadastro, que dá as 8 notas (a prévia, também uma só).
 * - Não chama IA nem grava o currículo. PDF sem camada de texto NÃO vai para
 *   a leitura por visão (paga): vira o próprio resultado "o ATS não lê".
 * - O middleware ainda limita rajadas por IP (`/api/public/ats-check`).
 * - Admin é isento, para testar o produto.
 */

const PUBLIC_MAX_PDF_BYTES = 5 * 1024 * 1024
const PUBLIC_MAX_BASE64 = Math.ceil((PUBLIC_MAX_PDF_BYTES * 4) / 3) + 1024

const schema = z
  .object({
    pdfBase64: z.string().max(PUBLIC_MAX_BASE64).optional(),
    text: z.string().max(MAX_RESUME_CHARS).optional(),
    visitorId: z.string().max(100).optional(),
  })
  .refine((b) => Boolean(b.pdfBase64) !== Boolean(b.text), 'Envie um PDF ou um texto.')

const limitReached = () =>
  NextResponse.json({ error: 'LIMIT_REACHED' }, { status: 402, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: Request) {
  let claimId: string | null = null
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const tooLarge = parsed.error.issues.some((i) => i.code === 'too_big' && i.path[0] === 'pdfBase64')
      return NextResponse.json(
        { error: tooLarge ? 'TOO_LARGE' : 'INVALID' },
        { status: tooLarge ? 413 : 400 }
      )
    }

    const { pdfBase64, visitorId } = parsed.data
    let pages: number | undefined
    const bot = isLikelyBot(req.headers.get('user-agent'))
    const ipKey = ipKeyFor(clientIpFrom(req.headers))
    const admin = await getAdminUser().catch(() => null)

    if (!admin) {
      const since = new Date(Date.now() - ATS_FREE_WINDOW_MS)
      const used = await db.analyticsEvent.findFirst({
        where: {
          event: { in: ['ats_check_done', 'ats_check_bot'] },
          createdAt: { gte: since },
          OR: [
            { meta: { contains: ipMetaNeedle(ipKey) } },
            ...(visitorId ? [{ visitorId }] : []),
          ],
        },
        select: { id: true },
      })
      if (used) return limitReached()

      // Reserva a cota ANTES de ler o PDF. Se o arquivo for inválido, a
      // reserva é desfeita e a pessoa pode tentar de novo com o arquivo certo.
      const country = edgeCountry(req) || null
      const claim = await db.analyticsEvent.create({
        data: {
          event: bot ? 'ats_check_bot' : 'ats_check_done',
          visitorId: visitorId || null,
          meta: JSON.stringify({ ipKey, pending: true, ...(country ? { country } : {}) }),
        },
        select: { id: true },
      })
      claimId = claim.id
    }

    let text = parsed.data.text ?? ''
    const source = pdfBase64 ? 'pdf' : 'text'

    if (pdfBase64) {
      const decoded = await parsePdfBase64(pdfBase64)
      if (decoded.code === 'INVALID' || decoded.code === 'EMPTY' || decoded.code === 'TOO_LARGE') {
        await releaseClaim(claimId)
        claimId = null
        return decoded.code === 'TOO_LARGE'
          ? NextResponse.json({ error: 'TOO_LARGE' }, { status: 413 })
          : NextResponse.json({ error: 'NOT_PDF' }, { status: 400 })
      }
      // NO_TEXT_LAYER: `text` fica vazio e o avaliador devolve `no_text`.
      text = decoded.text || ''
      pages = decoded.pages
    }

    // `pages` só existe para a checagem de densidade, que detecta texto
    // escondido. Texto colado não tem páginas, e aí a checagem não roda —
    // dado ausente não acusa.
    const result = scoreAtsReadability(text, { pages })

    if (claimId) {
      const country = edgeCountry(req) || null
      await db.analyticsEvent
        .update({
          where: { id: claimId },
          data: {
            meta: JSON.stringify({
              ipKey,
              score: result.score,
              level: result.level,
              source,
              issues: result.issues.length,
              ...(country ? { country } : {}),
            }),
          },
        })
        .catch(() => {})
    }

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    // Falha nossa não pode consumir o único teste da pessoa.
    await releaseClaim(claimId)
    console.error('ats-check error:', e?.message || e)
    return NextResponse.json({ error: 'GENERIC' }, { status: 500 })
  }
}

async function releaseClaim(id: string | null) {
  if (!id) return
  await db.analyticsEvent.delete({ where: { id } }).catch(() => {})
}
