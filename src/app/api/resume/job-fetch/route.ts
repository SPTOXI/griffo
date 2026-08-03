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

    // Requisita a página web
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Não foi possível acessar a URL fornecida (HTTP ${res.status}).` }, { status: 400 })
    }

    const html = await res.text()

    // Extrai texto limpando tags HTML basico
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanText.length < 50) {
      return NextResponse.json({ error: 'Não foi possível extrair o texto do anúncio desta URL.' }, { status: 400 })
    }

    // Tenta extrair título da página
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const pageTitle = titleMatch ? titleMatch[1].trim() : ''

    // Limita tamanho a 10.000 caracteres para otimização
    const extractedContent = cleanText.slice(0, 10000)

    return NextResponse.json({
      title: pageTitle || 'Vaga Importada via Link',
      description: extractedContent,
      sourceUrl: targetUrl,
    })
  } catch (e: any) {
    console.error('Error fetching job URL:', e)
    return NextResponse.json({ error: 'Erro ao processar o link da vaga. Cole o texto do anúncio diretamente.' }, { status: 500 })
  }
}
