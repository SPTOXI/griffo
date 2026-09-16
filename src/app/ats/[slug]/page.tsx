import { jsonLd } from '@/lib/json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { ATS_META } from '@/lib/ats/meta'
import { atsContentFor, atsLanguagesFor } from '@/lib/ats/content'
import { resumeTermFor } from '@/lib/market/regional-terms'
import {
  DICTIONARIES,
  LANGUAGES,
  detectLanguageFromCountry,
  dirForLang,
  localeForLang,
  type Language,
} from '@/lib/i18n'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ArrowRight, Brain,
  AlertTriangle, Check, HelpCircle, ChevronRight, Globe
} from 'lucide-react'

export const dynamicParams = false

export function generateStaticParams() {
  // Só os slugs — o idioma vem de `?lang=`, seguindo o mesmo padrão de
  // `/market-pulse` (§2.55) em vez de inventar um terceiro esquema de URL.
  // Mantém as URLs `/ats/{slug}` que já estão no sitemap e possivelmente
  // indexadas.
  return Object.keys(ATS_META).map((slug) => ({ slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

/**
 * Idioma da página: `?lang=` explícito → cookie de escolha manual → país da
 * borda → o primeiro idioma que aquele ATS tem.
 *
 * A diferença para `/market-pulse` é a última etapa: lá o recuo é inglês
 * fixo, aqui é o primeiro idioma DAQUELE ATS. A Gupy só existe em
 * português; cair em inglês devolveria 404 para quem chega em `/ats/gupy`
 * sem nenhum sinal de idioma — que é a maioria de quem vem da busca.
 */
async function resolveLanguage(
  slug: string,
  searchParams: Promise<{ lang?: string }>
): Promise<Language | null> {
  const available = atsLanguagesFor(slug)
  if (available.length === 0) return null

  const pick = (candidate?: string): Language | null => {
    const v = candidate?.toLowerCase().trim()
    if (v && (LANGUAGES as string[]).includes(v) && available.includes(v as Language)) {
      return v as Language
    }
    return null
  }

  const { lang } = await searchParams
  const requested = pick(lang)
  if (requested) return requested

  const jar = await cookies()
  const chosen = pick(jar.get('griffo_lang')?.value)
  if (chosen) return chosen

  const h = await headers()
  const country = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(country)) {
    const byGeo = pick(detectLanguageFromCountry(country))
    if (byGeo) return byGeo
  }

  return available.includes('en') ? 'en' : available[0]
}

const BASE = 'https://griffo.work'

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const meta = ATS_META[slug]
  const lang = meta ? await resolveLanguage(slug, searchParams) : null
  const content = lang ? atsContentFor(slug, lang) : null
  if (!meta || !lang || !content) return {}

  const t = DICTIONARIES[lang].atsPage
  // O termo que o candidato digita é sempre a combinação das duas coisas —
  // "currículo ATS", "ATS resume", "CV ATS". A palavra do documento vem de
  // `resumeTermFor`, a mesma fonte única do §2.79, para não repetir aqui a
  // decisão de "CV" vs "resume" por idioma.
  const term = resumeTermFor(meta.country, lang)
  const title = t.metaTitle.replace('{ats}', meta.name).replace('{resume}', term.noun)
  const description = t.metaDescription.replace('{fullName}', meta.fullName)

  // hreflang só entre os idiomas que a página REALMENTE tem. Declarar um
  // idioma sem conteúdo apontaria para 404, e o Google descarta o bloco
  // inteiro de hreflang quando ele não fecha — defeito que o §2.69 já
  // custou uma vez a este projeto.
  const langs = atsLanguagesFor(slug)
  const canonical = `${BASE}/ats/${slug}`

  return {
    title,
    description,
    // O candidato digita a COMBINAÇÃO — "currículo ATS Workday", nunca só a
    // sigla. `resumeTermFor` dá a palavra do documento no idioma da rota
    // (§2.79); antes daqui as keywords não traziam nenhuma delas.
    keywords: [
      `ats ${meta.name.toLowerCase()}`,
      `${term.nounLower.toLowerCase()} ${meta.name.toLowerCase()}`,
      `${term.nounLower.toLowerCase()} ats`,
      `${meta.name.toLowerCase()} ${t.breadcrumbSystems.toLowerCase()}`,
      'griffowork',
    ],
    alternates: {
      canonical,
      languages: Object.fromEntries(
        langs.map((l) => [localeForLang(l), `${canonical}?lang=${l}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'GriffoWork',
      images: [{ url: '/logo-full.png', width: 693, height: 694, alt: title }],
      type: 'article',
      locale: localeForLang(lang),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo-full.png'],
    },
  }
}

export default async function AtsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const meta = ATS_META[slug]
  const lang = meta ? await resolveLanguage(slug, searchParams) : null
  const ats = lang ? atsContentFor(slug, lang) : null

  // 404 só quando o SLUG não existe ou não tem conteúdo em idioma nenhum.
  //
  // Um `?lang=` que aquele ATS não tem (ex.: `/ats/gupy?lang=de`) NÃO é 404:
  // `resolveLanguage` recua para o idioma próprio do ATS. Isso é seguro
  // porque o canonical desta página aponta sempre para `/ats/{slug}` sem
  // parâmetro, e o hreflang só lista os idiomas que existem — então o
  // buscador nunca vê nem indexa a combinação inválida. Devolver 404 para
  // um parâmetro digitado à mão seria hostil sem ganhar nada.
  if (!meta || !lang || !ats) notFound()

  const t = DICTIONARIES[lang].atsPage
  const withName = (s: string) => s.replace('{ats}', meta.name)
  const dims = [t.auditDim1, t.auditDim2, t.auditDim3, t.auditDim4]

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: withName(t.heroTitle),
    description: ats.description,
    inLanguage: localeForLang(lang),
    author: { '@type': 'Organization', name: 'GriffoWork', url: BASE },
    publisher: {
      '@type': 'Organization',
      name: 'GriffoWork',
      logo: { '@type': 'ImageObject', url: `${BASE}/logo-full.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/ats/${slug}` },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ats.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: BASE },
      { '@type': 'ListItem', position: 2, name: t.breadcrumbSystems, item: `${BASE}/ats/${slug}` },
      { '@type': 'ListItem', position: 3, name: meta.name, item: `${BASE}/ats/${slug}` },
    ],
  }

  return (
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">
      <DocumentLanguage lang={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-icon.png" alt="GriffoWork" width={90} height={69} className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-[#0B192E] text-lg tracking-tight">
              griffo<span className="text-[#0B63E5]">work</span>
            </span>
          </Link>
          <Button asChild size="sm" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white font-semibold shrink-0">
            <Link href="/">{t.heroCta}</Link>
          </Button>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="bg-slate-50 border-b border-slate-200/60 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">{t.breadcrumbHome}</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span>{t.breadcrumbSystems}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-900 font-bold">{meta.name}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative pt-12 pb-16 md:py-20 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary px-3.5 py-1 text-xs font-bold rounded-full whitespace-normal leading-snug">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary inline shrink-0" /> {t.heroBadge}
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B192E] leading-tight">
            {withName(t.heroTitle)}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {ats.description}
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-slate-100/80 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <span>{t.marketLabel}: <strong>{ats.marketName}</strong> ({ats.marketShare})</span>
            {/* Afirmação com número mostra de onde veio e de quando é. Sem a
                data, o dado certo de hoje vira o errado do ano que vem sem
                quem lê ter como perceber — ver `MarketShareAttribution`. */}
            {meta.marketShare.kind === 'sourced' && (
              <a
                href={meta.marketShare.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-primary transition-colors"
              >
                {t.sourceLabel}: {meta.marketShare.source}, {meta.marketShare.asOf}
              </a>
            )}
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-auto min-h-13 py-3 px-8 shadow-xl font-bold whitespace-normal">
              <Link href="/">
                {t.heroCta} <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs whitespace-normal">{t.mechanismBadge}</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] mt-2 mb-2">
              {withName(t.mechanismTitle)}
            </h2>
            <p className="text-sm text-slate-600">{t.mechanismSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ats.howItWorks.map((step, idx) => (
              <Card key={idx} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-6 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary font-bold flex items-center justify-center text-sm border border-blue-100">
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-base text-[#0B192E]">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ELIMINATION & GRIFFOWORK VALUE */}
      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-red-100 shadow-xs space-y-4">
            <div className="flex items-start gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {withName(t.eliminationTitle)}
            </div>
            <ul className="space-y-3">
              {ats.eliminationFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-4">
            <div className="flex items-start gap-2 text-[#0B63E5] font-bold text-base">
              <Brain className="w-5 h-5 shrink-0 mt-0.5" /> {t.helpsTitle}
            </div>
            <ul className="space-y-3">
              {ats.howGriffoWorkHelps.map((help, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {help}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8 DIMENSIONS AUDIT */}
      <section className="py-14 bg-[#0B192E] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-[#0B63E5]/20 text-blue-300 border-blue-500/30 px-3 py-1 font-bold whitespace-normal">
            {t.auditBadge}
          </Badge>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">{t.auditTitle}</h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.auditSubtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {dims.map((dim, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Brain className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">{dim}</p>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="bg-white text-[#0B192E] hover:bg-blue-50 font-extrabold h-auto min-h-12 py-2.5 px-8 whitespace-normal">
              <Link href="/">
                {t.auditCta} <ArrowRight className="w-4 h-4 ml-2 text-primary shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs whitespace-normal">{t.faqBadge}</Badge>
            <h2 className="text-2xl font-extrabold text-[#0B192E] mt-2">{withName(t.faqTitle)}</h2>
          </div>

          <div className="space-y-3">
            {ats.faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <h3 className="font-bold text-sm text-[#0B192E] flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {faq.question}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="GriffoWork" width={60} height={46} className="h-6 w-auto object-contain" />
            <span>© {new Date().getFullYear()} GriffoWork</span>
          </div>
          <Link href="/" className="hover:text-primary transition-colors">{t.footerHome}</Link>
        </div>
      </footer>
    </div>
  )
}
