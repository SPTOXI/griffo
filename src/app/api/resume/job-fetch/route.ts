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
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'URL inválida.' }, { status: 400 })
    }

    const targetUrl = parsed.data.url

    // Use Jina Reader API to bypass basic anti-bot blocks and extract clean markdown
    const jinaUrl = `https://r.jina.ai/${targetUrl}`
    const res = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    let extractedContent = ''
    let pageTitle = 'Vaga Importada via Link'

    if (res.ok) {
      const text = await res.text()
      // Jina returns markdown, usually the title is "Title: ..." at the top
      const titleMatch = text.match(/^Title:\s*(.+)/m)
      if (titleMatch) pageTitle = titleMatch[1].trim()
      
      extractedContent = text.trim()
    } else {
      // Fallback to direct fetch if Jina fails
      const fallbackRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      })

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: `Não foi possível acessar a URL fornecida (HTTP ${fallbackRes.status}).` }, { status: 400 })
      }

      const html = await fallbackRes.text()
      let cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
      if (titleMatch) pageTitle = titleMatch[1].trim()
      
      extractedContent = cleanText
    }

    if (extractedContent.length < 50) {
      return NextResponse.json({ error: 'Não foi possível extrair o texto do anúncio desta URL. Verifique se a página exige login.' }, { status: 400 })
    }

    const isBlocked = 
      pageTitle.toLowerCase().includes('security measure') ||
      pageTitle.toLowerCase().includes('cloudflare') ||
      pageTitle.toLowerCase().includes('attention required') ||
      extractedContent.toLowerCase().includes('please enable js') ||
      extractedContent.toLowerCase().includes('verify you are human')

    if (isBlocked) {
      return NextResponse.json({ error: 'A importação foi bloqueada pelo sistema de segurança do site (ex: Glassdoor/LinkedIn). Por favor, copie e cole o texto da vaga manualmente.' }, { status: 400 })
    }

    // Limita tamanho a 10.000 caracteres para otimização
    extractedContent = extractedContent.slice(0, 10000)

    return NextResponse.json({
      title: pageTitle,
      description: extractedContent,
      sourceUrl: targetUrl,
    })
  } catch (e: any) {
    console.error('Error fetching job URL:', e)
    return NextResponse.json({ error: 'Erro ao processar o link da vaga. Cole o texto do anúncio diretamente.' }, { status: 500 })
  }
}
