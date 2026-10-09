export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { assertPublicUrl, fetchPublicUrl, BlockedUrlError } from '@/lib/url-guard'
import { metaContent, readTextCapped, stripTagBlocks, stripTags, tagBlocks } from '@/lib/html-scan'

const schema = z.object({
  url: z.string().url('Informe uma URL válida.'),
})

function extractMetadataFromHtml(html: string): { title?: string; description?: string } {
  let title: string | undefined
  let description: string | undefined

  // 1. JSON-LD JobPosting Schema (LinkedIn, Gupy, Catho, Glassdoor, Indeed, etc.)
  const jsonLdMatches = tagBlocks(html, 'script').filter((b) => /application\/ld\+json/i.test(b.open))
  if (jsonLdMatches.length) {
    for (const match of jsonLdMatches) {
      try {
        const jsonText = match.body.trim()
        const parsed = JSON.parse(jsonText)
        const items = Array.isArray(parsed) ? parsed : [parsed]
        const job = items.find(i => i && (i['@type'] === 'JobPosting' || i['@type'] === 'JobDeclaration'))
        if (job) {
          if (job.title || job.name) title = String(job.title || job.name).trim()
          let desc = job.description || job.responsibilities || job.skills
          if (typeof desc === 'string') {
            desc = stripTags(desc).replace(/\s+/g, ' ').trim()
            if (desc.length > 30) description = desc
          }
          if (title || description) break
        }
      } catch {}
    }
  }

  // 2. OpenGraph and Twitter Meta Tags
  if (!title) {
    const titleMatch = metaContent(html, 'property', 'og:title') ||
                       metaContent(html, 'name', 'twitter:title') ||
                       tagBlocks(html, 'title')[0]?.body.slice(0, 500)
    if (titleMatch) title = titleMatch.trim()
  }

  if (!description) {
    const descMatch = metaContent(html, 'property', 'og:description') ||
                      metaContent(html, 'name', 'description') ||
                      metaContent(html, 'name', 'twitter:description')
    if (descMatch && descMatch.trim().length > 30) {
      description = descMatch.trim()
    }
  }

  return { title, description }
}

/**
 * Raspa e extrai o texto principal de uma vaga de emprego a partir de uma URL.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    let rawUrl = String(body?.url || '').trim()
    if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl
    }

    const parsed = schema.safeParse({ url: rawUrl })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Informe uma URL válida (ex: https://linkedin.com/jobs/view/...)' }, { status: 400 })
    }

    const targetUrl = parsed.data.url

    // Proteção contra SSRF: resolve o hostname e confere todos os endereços
    // contra as faixas reservadas. Ver lib/url-guard.ts.
    try {
      await assertPublicUrl(targetUrl)
    } catch (e) {
      if (e instanceof BlockedUrlError) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
      return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
    }

    let extractedContent = ''
    let pageTitle = 'Vaga Importada via Link'

    // 1. Try Jina Reader API with 10s timeout to extract clean text
    try {
      const jinaUrl = `https://r.jina.ai/${targetUrl}`
      const res = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (res.ok) {
        const text = await readTextCapped(res)
        const titleMatch = text.match(/^Title:\s*(.+)/m)
        if (titleMatch) pageTitle = titleMatch[1].trim()
        extractedContent = text.trim()
      }
    } catch (jinaErr) {
      console.warn('[job-fetch] Jina reader failed, trying direct fetch fallback:', jinaErr)
    }

    // 2. Fallback to direct HTML fetch with JSON-LD and Meta Tags extraction if Jina yielded nothing
    if (!extractedContent || extractedContent.length < 50) {
      try {
        // `fetchPublicUrl` revalida cada redirecionamento: seguir um 302 sem
        // conferir o destino anularia a checagem feita acima.
        const fallbackRes = await fetchPublicUrl(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          timeoutMs: 10000,
        })

        if (fallbackRes.ok) {
          const html = await readTextCapped(fallbackRes)
          const meta = extractMetadataFromHtml(html)
          if (meta.title) pageTitle = meta.title

          if (meta.description && meta.description.length > 50) {
            extractedContent = meta.description
          } else {
            const cleanText = stripTags(stripTagBlocks(stripTagBlocks(html, 'script'), 'style'))
              .replace(/\s+/g, ' ')
              .trim()
            extractedContent = cleanText
          }
        }
      } catch (fbErr) {
        console.warn('[job-fetch] Direct fallback fetch failed:', fbErr)
      }
    }

    if (!extractedContent || extractedContent.length < 30) {
      return NextResponse.json({ error: 'Não foi possível extrair a vaga deste link. Verifique se a vaga exige login ou se o link está correto.' }, { status: 400 })
    }

    const isBlocked = 
      pageTitle.toLowerCase().includes('security measure') ||
      pageTitle.toLowerCase().includes('cloudflare') ||
      pageTitle.toLowerCase().includes('attention required') ||
      (extractedContent.toLowerCase().includes('please enable js') && extractedContent.length < 200) ||
      (extractedContent.toLowerCase().includes('verify you are human') && extractedContent.length < 200)

    if (isBlocked) {
      return NextResponse.json({ error: 'A importação foi bloqueada pela proteção do site (ex: Cloudflare/LinkedIn). Copie e cole o texto da vaga no campo de descrição.' }, { status: 400 })
    }

    // Limita tamanho a 10.000 caracteres para otimização
    extractedContent = extractedContent.slice(0, 10000)

    // Clean title
    pageTitle = pageTitle.replace(/^Title:\s*/i, '').replace(/\|\s*LinkedIn$/i, '').replace(/\|\s*Gupy$/i, '').trim()

    return NextResponse.json({
      title: pageTitle || 'Vaga Importada via Link',
      description: extractedContent,
      sourceUrl: targetUrl,
    })
  } catch (e: any) {
    console.error('Error fetching job URL:', e)
    return NextResponse.json({ error: 'Erro ao processar o link da vaga. Copie e cole o texto da vaga no campo de descrição.' }, { status: 500 })
  }
}
