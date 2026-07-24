import { NextResponse } from 'next/server'
import { detectLanguageFromCountry, Language } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-country-code') ||
      ''

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
