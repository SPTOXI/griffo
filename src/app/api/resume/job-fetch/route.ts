import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

const schema = z.object({
  url: z.string().url('Informe uma URL válida.'),
})

/**
 * Raspa e extrai o texto principal de um anúncio de vaga a partir de uma URL.
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

    // SSRF Protection: Block requests to private/internal networks
    try {
      const parsedUrl = new URL(targetUrl)
      const hostname = parsedUrl.hostname.toLowerCase()
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']
      const blockedPrefixes = ['10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.', '169.254.']
      
      if (
        blockedHosts.includes(hostname) ||
        blockedPrefixes.some(prefix => hostname.startsWith(prefix)) ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        !['http:', 'https:'].includes(parsedUrl.protocol)
      ) {
        return NextResponse.json({ error: 'URL não permitida. Utilize apenas URLs públicas.' }, { status: 400 })
      }
    } catch {
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
        const text = await res.text()
        const titleMatch = text.match(/^Title:\s*(.+)/m)
        if (titleMatch) pageTitle = titleMatch[1].trim()
        extractedContent = text.trim()
      }
    } catch (jinaErr) {
      console.warn('[job-fetch] Jina reader failed, trying fallback fetch:', jinaErr)
    }

    // 2. Fallback to direct HTML fetch if Jina yielded nothing
    if (!extractedContent || extractedContent.length < 50) {
      try {
        const fallbackRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (fallbackRes.ok) {
          const html = await fallbackRes.text()
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
          if (titleMatch) pageTitle = titleMatch[1].trim()

          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

          extractedContent = cleanText
        }
      } catch (fbErr) {
        console.warn('[job-fetch] Direct fallback fetch failed:', fbErr)
      }
    }

    if (!extractedContent || extractedContent.length < 30) {
      return NextResponse.json({ error: 'Não foi possível extrair a vaga deste link. Verifique se o anúncio exige login ou se o link está correto.' }, { status: 400 })
    }

    const isBlocked = 
      pageTitle.toLowerCase().includes('security measure') ||
      pageTitle.toLowerCase().includes('cloudflare') ||
      pageTitle.toLowerCase().includes('attention required') ||
      extractedContent.toLowerCase().includes('please enable js') ||
      extractedContent.toLowerCase().includes('verify you are human')

    if (isBlocked) {
      return NextResponse.json({ error: 'A importação foi bloqueada pela proteção do site (ex: Cloudflare/LinkedIn). Copie e cole o texto do anúncio no campo de descrição.' }, { status: 400 })
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
    return NextResponse.json({ error: 'Erro ao processar o link da vaga. Copie e cole o texto do anúncio no campo de descrição.' }, { status: 500 })
  }
}
