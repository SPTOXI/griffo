import { NextResponse } from 'next/server'
import { detectLanguageFromCountry, Language } from '@/lib/i18n'
import { edgeCountry } from '@/lib/pricing/resolve'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Mesma leitura de país do resto do produto — inclusive a ordem dos
    // cabeçalhos, que aqui estava errada pelo mesmo motivo: atrás do
    // Cloudflare, a leitura da Vercel descreve o data center e não o visitante,
    // e o idioma da tela saía do país errado.
    const country = edgeCountry(req)

    const acceptLang = req.headers.get('accept-language') || ''
    
    let detectedLang: Language = 'pt'

    if (country) {
      detectedLang = detectLanguageFromCountry(country)
    } else if (acceptLang) {
      const lower = acceptLang.toLowerCase()
      if (lower.includes('es')) {
        detectedLang = 'es'
      } else if (lower.includes('en')) {
        detectedLang = 'en'
      } else if (lower.includes('pt')) {
        detectedLang = 'pt'
      }
    }

    return NextResponse.json({
      country: country || 'BR',
      lang: detectedLang,
    })
  } catch {
    return NextResponse.json({ country: 'BR', lang: 'pt' })
  }
}
