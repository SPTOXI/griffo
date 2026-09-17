import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { jsonLd } from '@/lib/json-ld'
import { detectLanguageFromCountry, dirForLang, localeForLang } from '@/lib/i18n'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { AtsCheckClient } from '@/components/ats-check/ats-check-client'
import {
  ATS_CHECK_COPY,
  ATS_CHECK_LANGS,
  ATS_CHECK_PATH,
  isAtsCheckLang,
  type AtsCheckLang,
} from '@/lib/ats-check/copy'

const BASE = 'https://griffo.work'

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

/**
 * Idioma: `?lang=` → cookie de escolha manual → país da borda → inglês.
 * Mesmo esquema de `/ats/[slug]` e `/market-pulse`. O teste é global: existe
 * nos 12 idiomas e o recuo é o inglês.
 */
async function resolveLang(searchParams: PageProps['searchParams']): Promise<AtsCheckLang> {
  const { lang } = await searchParams
  if (isAtsCheckLang(lang)) return lang
  const jar = await cookies()
  const chosen = jar.get('griffo_lang')?.value
  if (isAtsCheckLang(chosen)) return chosen
  const h = await headers()
  const country = (h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(country)) {
    const byGeo = detectLanguageFromCountry(country)
    if (isAtsCheckLang(byGeo)) return byGeo
  }
  return 'en'
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = await resolveLang(searchParams)
  const c = ATS_CHECK_COPY[lang]
  const canonical = `${BASE}${ATS_CHECK_PATH}`
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: lang === 'en' ? canonical : `${canonical}?lang=${lang}`,
      languages: {
        ...Object.fromEntries(ATS_CHECK_LANGS.map((l) => [localeForLang(l), `${canonical}?lang=${l}`])),
        'x-default': canonical,
      },
    },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `${canonical}?lang=${lang}`,
      siteName: 'GriffoWork',
      images: [{ url: '/logo-full.png', width: 693, height: 694, alt: c.title }],
      type: 'website',
      locale: localeForLang(lang),
    },
    twitter: { card: 'summary_large_image', title: c.metaTitle, description: c.metaDescription, images: ['/logo-full.png'] },
  }
}

export default async function AtsCheckPage({ searchParams }: PageProps) {
  const lang = await resolveLang(searchParams)
  const c = ATS_CHECK_COPY[lang]

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: c.title,
    url: `${BASE}${ATS_CHECK_PATH}?lang=${lang}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: localeForLang(lang),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'GriffoWork', url: BASE },
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/60 via-white to-white">
      <DocumentLanguage lang={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />

      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="GriffoWork" width={110} height={84} className="h-10 w-auto object-contain" />
            <span className="font-extrabold text-[#0B192E] tracking-tight">
              griffo<span className="text-[#0B63E5]">work</span>
            </span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-x-2.5 gap-y-1 text-[11px] font-semibold text-slate-500 max-w-[60%]">
            {ATS_CHECK_LANGS.map((l) => (
              <Link key={l} href={`${ATS_CHECK_PATH}?lang=${l}`} className={l === lang ? 'text-[#0B63E5]' : 'hover:text-slate-800'}>
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">{c.badge}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{c.title}</h1>
          <p className="text-slate-600">{c.subtitle}</p>
        </div>

        <AtsCheckClient lang={lang} />

        <section className="space-y-4 pt-4">
          {c.faq.map((f) => (
            <div key={f.q}>
              <h2 className="font-bold text-[#0B192E]">{f.q}</h2>
              <p className="text-sm text-slate-600 mt-1">{f.a}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800">GriffoWork</Link> ·{' '}
        <Link href="/privacy" className="hover:text-slate-800">Privacy</Link>
      </footer>
    </div>
  )
}
