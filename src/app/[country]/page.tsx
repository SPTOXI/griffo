import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MARKETS, GLOBAL_MARKET, marketForCountry, marketById } from '@/lib/market'
import { countryName, COUNTRIES } from '@/lib/market/countries'
import { priceFor } from '@/lib/pricing/catalog'
import { CountryPageClient } from './country-client'

export const dynamicParams = true

// Todos os mercados suportados diretamente para geração estática (SSG)
const SUPPORTED_COUNTRY_SLUGS = [
  'br', 'us', 'pt', 'es', 'mx', 'gb', 'ca', 'de', 'at', 'fr', 'be', 'lu',
  'it', 'au', 'nz', 'in', 'jp', 'global',
  'pl', 'cz', 'cl', 'my', 'tr', 'za', 'ae', 'co', 'ar', 'th', 'ro', 'bg',
  'id', 'ph', 'vn', 'ng', 'eg', 'pk', 'bd', 'ke', 'sg', 'nl', 'ie'
]

export function generateStaticParams() {
  return SUPPORTED_COUNTRY_SLUGS.map((country) => ({
    country,
  }))
}

interface PageProps {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params
  const slug = country.toLowerCase().trim()
  const code = slug.toUpperCase()

  const isGlobal = slug === 'global'
  const isKnown = isGlobal || COUNTRIES.some((c) => c.code === code)

  if (!isKnown && !SUPPORTED_COUNTRY_SLUGS.includes(slug)) {
    return {}
  }

  const market = isGlobal ? GLOBAL_MARKET : marketForCountry(code)
  const cName = isGlobal ? 'Global' : countryName(code) || code
  const price = priceFor(isGlobal ? 'US' : code, 'single')
  const atsList = market.ats.slice(0, 4).join(', ')

  const titles: Record<string, string> = {
    pt: `GriffoWork ${cName} — Análise de Currículo por IA e Pontuação ATS`,
    es: `GriffoWork ${cName} — Auditoría de Currículum con IA y Puntuación ATS`,
    en: `GriffoWork ${cName} — Global AI Career Intelligence & ATS Resume Audit`,
    de: `GriffoWork ${cName} — KI-Lebenslauf-Analyse & ATS-Score-Prüfung`,
    fr: `GriffoWork ${cName} — Audit de CV par IA & Score de Compatibilité ATS`,
    it: `GriffoWork ${cName} — Analisi del Curriculum con IA & Punteggio ATS`,
    ja: `GriffoWork ${cName} — AI職務経歴書診断＆ATS適合度スコア`,
  }

  const descriptions: Record<string, string> = {
    pt: `Otimize seu currículo para os padrões de recrutamento de ${cName}. Avaliação de compatibilidade com ${atsList} e laudo executivo em 8 dimensões por apenas ${price.formatted}.`,
    es: `Optimiza tu currículum para los estándares de contratación en ${cName}. Evaluación de compatibilidad con ${atsList} e informe ejecutivo en 8 dimensiones por solo ${price.formatted}.`,
    en: `Optimize your resume for hiring standards in ${cName}. Audit ATS compatibility with ${atsList} and get an 8-dimension executive career report for just ${price.formatted}.`,
    de: `Optimieren Sie Ihren Lebenslauf für den Arbeitsmarkt in ${cName}. ATS-Kompatibilitätsprüfung für ${atsList} und 8-Dimensionen-Prüfbericht für nur ${price.formatted}.`,
    fr: `Optimisez votre CV selon les standards de recrutement en ${cName}. Audit de compatibilité avec ${atsList} et rapport exécutif en 8 dimensions pour seulement ${price.formatted}.`,
    it: `Ottimizza il tuo curriculum per gli standard di selezione in ${cName}. Valutazione di compatibilità con ${atsList} e report esecutivo in 8 dimensioni per soli ${price.formatted}.`,
    ja: `${cName} の採用基準に合わせて職務経歴書を最適化。${atsList} のATS適合度判定と8次元診断レポートをわずか ${price.formatted} でご提供。`,
  }

  const title = titles[market.jobLanguage] || titles.en
  const description = descriptions[market.jobLanguage] || descriptions.en

  return {
    title,
    description,
    keywords: [
      'griffowork',
      `griffowork ${cName.toLowerCase()}`,
      `curriculo ${cName.toLowerCase()}`,
      `resume ${cName.toLowerCase()}`,
      'ATS score',
      ...market.ats,
    ],
    alternates: {
      canonical: `https://griffo.work/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://griffo.work/${slug}`,
      siteName: 'GriffoWork',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
    },
  }
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params
  const slug = country.toLowerCase().trim()
  const code = slug.toUpperCase()

  const isGlobal = slug === 'global'
  const isKnown = isGlobal || COUNTRIES.some((c) => c.code === code)

  if (!isKnown && !SUPPORTED_COUNTRY_SLUGS.includes(slug)) {
    notFound()
  }

  const market = isGlobal ? GLOBAL_MARKET : marketForCountry(code)
  const effectiveCountry = isGlobal ? 'US' : code
  const price = priceFor(effectiveCountry, 'single')

  // Schema.org com preço e moeda do mercado específico
  const countryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `GriffoWork ${isGlobal ? 'Global' : countryName(code)}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: String(price.amount),
      priceCurrency: price.currency,
      description: `Complete executive resume audit in 8 dimensions for ${isGlobal ? 'Global Remote' : countryName(code)} market.`,
    },
    description: `AI Career Intelligence and ATS Optimization (${market.ats.join(', ')}) for ${isGlobal ? 'Global Remote' : countryName(code)}.`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(countryJsonLd) }}
      />
      <CountryPageClient countryCode={effectiveCountry} lang={market.jobLanguage} />
    </>
  )
}
