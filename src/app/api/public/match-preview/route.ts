export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'
import { parsePdfBase64 } from '@/lib/pdf-text'
import { scoreAtsReadability } from '@/lib/ats-check/score'
import { ipKeyFor, ipMetaNeedle } from '@/lib/ats-check/quota'
import { isLikelyBot } from '@/lib/analytics/funnel'
import { clientIpFrom } from '@/lib/request-ip'
import { edgeCountry } from '@/lib/pricing/edge-country'
import { LANGUAGES, type Language } from '@/lib/i18n/types'
import { MAX_RESUME_CHARS } from '@/lib/validation'
import { createLead, newLeadToken, processLead } from '@/lib/match-preview/server'

/**
 * Envio de currículo sem conta, no topo da landing (§2.132).
 *
 * - UM envio por pessoa a cada 24h, contado como o teste ATS: por navegador E
 *   por hash de IP, reservado ANTES do trabalho e devolvido se a falha for
 *   nossa ou o arquivo for inválido. Admin é isento, para testar o produto.
 * - O teste de legibilidade roda aqui, sem IA. A leitura do perfil e o
 *   cruzamento com vagas rodam depois da resposta (`after`), e a tela consulta
 *   `/api/public/match-result/[token]` até ficar pronto.
 * - PDF sem camada de texto NÃO vai para leitura por visão (paga), mesma regra
 *   do teste ATS: vira o próprio resultado.
 * - Robô não dispara IA: a reserva é gravada (conta para a cota) e a resposta
 *   é a de erro genérico.
 */

const PUBLIC_MAX_PDF_BYTES = 5 * 1024 * 1024
const PUBLIC_MAX_BASE64 = Math.ceil((PUBLIC_MAX_PDF_BYTES * 4) / 3) + 1024
const WINDOW_MS = 24 * 60 * 60 * 1000

const schema = z
  .object({
    pdfBase64: z.string().max(PUBLIC_MAX_BASE64).optional(),
    text: z.string().max(MAX_RESUME_CHARS).optional(),
    email: z.string().trim().toLowerCase().email().max(254),
    keep: z.boolean(),
    lang: z.string().max(5),
    country: z.string().regex(/^[A-Za-z]{2}$/).optional(),
    visitorId: z.string().max(100).optional(),
  })
  .refine((b) => Boolean(b.pdfBase64) !== Boolean(b.text), 'Envie um PDF ou um texto.')

const noStore = { 'Cache-Control': 'no-store' }

export async function POST(req: Request) {
  let claimId: string | null = null
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const code =
        issue?.path[0] === 'pdfBase64' && issue.code === 'too_big'
          ? 'TOO_LARGE'
          : issue?.path[0] === 'email'
            ? 'INVALID_EMAIL'
            : 'INVALID'
      return NextResponse.json({ error: code }, { status: code === 'TOO_LARGE' ? 413 : 400, headers: noStore })
    }

    const { pdfBase64, email, keep, visitorId } = parsed.data
    const lang: Language = (LANGUAGES as string[]).includes(parsed.data.lang) ? (parsed.data.lang as Language) : 'en'
    const country = edgeCountry(req) || parsed.data.country?.toUpperCase() || null
    const bot = isLikelyBot(req.headers.get('user-agent'))
    const ipKey = ipKeyFor(clientIpFrom(req.headers))
    const admin = await getAdminUser().catch(() => null)

    if (!admin) {
      const used = await db.analyticsEvent.findFirst({
        where: {
          event: { in: ['lead_submitted', 'lead_bot'] },
          createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
          OR: [{ meta: { contains: ipMetaNeedle(ipKey) } }, ...(visitorId ? [{ visitorId }] : [])],
        },
        select: { id: true },
      })
      if (used) return NextResponse.json({ error: 'LIMIT_REACHED' }, { status: 402, headers: noStore })

      const claim = await db.analyticsEvent.create({
        data: {
          event: bot ? 'lead_bot' : 'lead_submitted',
          visitorId: visitorId || null,
          meta: JSON.stringify({ ipKey, keep, ...(country ? { country } : {}) }),
        },
        select: { id: true },
      })
      claimId = claim.id
      if (bot) return NextResponse.json({ error: 'GENERIC' }, { status: 400, headers: noStore })
    }

    let text = parsed.data.text ?? ''
    let pages: number | undefined
    if (pdfBase64) {
      const decoded = await parsePdfBase64(pdfBase64)
      if (decoded.code === 'INVALID' || decoded.code === 'EMPTY' || decoded.code === 'TOO_LARGE') {
        await releaseClaim(claimId)
        claimId = null
        return decoded.code === 'TOO_LARGE'
          ? NextResponse.json({ error: 'TOO_LARGE' }, { status: 413, headers: noStore })
          : NextResponse.json({ error: 'NOT_PDF' }, { status: 400, headers: noStore })
      }
      text = decoded.text || ''
      pages = decoded.pages
    }

    const ats = scoreAtsReadability(text, { pages })
    const token = newLeadToken()

    await createLead({
      id: token,
      email,
      lang,
      country,
      ats,
      recruiterOptIn: keep,
      resumeText: text,
      visitorId: visitorId || null,
      ipKey,
    })

    const claim = claimId
    // Daqui em diante a reserva pertence ao processamento: é ele que a devolve
    // se falhar. O `catch` abaixo não deve devolvê-la de novo.
    claimId = null
    after(() => processLead(token, { text, lang, country, visitorId: visitorId || null, claimId: claim }))

    return NextResponse.json({ token, status: 'processing' }, { status: 202, headers: noStore })
  } catch (e: any) {
    // Falha nossa não pode consumir o único envio grátis da pessoa.
    await releaseClaim(claimId)
    console.error('match-preview error:', e?.message || e)
    return NextResponse.json({ error: 'GENERIC' }, { status: 500, headers: noStore })
  }
}

async function releaseClaim(id: string | null) {
  if (!id) return
  await db.analyticsEvent.delete({ where: { id } }).catch(() => {})
}
