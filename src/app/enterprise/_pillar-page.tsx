import { jsonLd } from '@/lib/json-ld'
import type { Metadata } from 'next'
import { dirForLang, localeForLang, LANGUAGES, type Language } from '@/lib/i18n'
import { resolveRequestLanguage } from '@/lib/i18n/resolve-request-language'
import { langAlternates } from '@/lib/seo/lang-alternates'
import { salesMailto } from '@/lib/i18n/contact'
import { enterpriseContentFor } from '@/lib/enterprise/content'
import type { EnterprisePillarContent } from '@/lib/enterprise/content-types'

/**
 * Layout compartilhado das duas páginas-pilar do Griffo Enterprise
 * (`/enterprise/external-recruitment`, `/enterprise/internal-mobility`).
 * Extraído porque as duas são a mesma estrutura com conteúdo diferente —
 * cada `page.tsx` só escolhe a seção (`externalRecruitment` |
 * `internalMobility`) e passa a URL canônica.
 */

export interface PillarPageProps {
  searchParams: Promise<{ lang?: string }>
}

export async function generatePillarMetadata(
  searchParams: Promise<{ lang?: string }>,
  section: 'externalRecruitment' | 'internalMobility',
  canonical: string
): Promise<Metadata> {
  const lang = await resolveRequestLanguage(searchParams)
  const content = enterpriseContentFor(lang)[section]
  const { lang: requestedLang } = await searchParams
  const alternates = langAlternates(canonical, requestedLang, LANGUAGES, localeForLang)

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
    alternates,
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: canonical,
      siteName: 'Griffo Enterprise',
      images: [{ url: '/logo-full.png', width: 693, height: 694, alt: content.metaTitle }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.metaTitle,
      description: content.metaDescription,
      images: ['/logo-full.png'],
    },
  }
}

export async function resolvePillarView(
  searchParams: Promise<{ lang?: string }>,
  section: 'externalRecruitment' | 'internalMobility',
  canonical: string
): Promise<{
  lang: Language
  dir: 'rtl' | 'ltr'
  content: EnterprisePillarContent
  cta: string
  breadcrumbJsonLd: object
}> {
  const lang = await resolveRequestLanguage(searchParams)
  const locale = enterpriseContentFor(lang)
  const content = locale[section]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale.breadcrumbHome, item: 'https://griffo.work' },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale.landing.eyebrow,
        item: 'https://griffo.work/enterprise',
      },
      { '@type': 'ListItem', position: 3, name: content.eyebrow, item: canonical },
    ],
  }

  return {
    lang,
    dir: dirForLang(lang),
    content,
    cta: salesMailto(lang),
    breadcrumbJsonLd,
  }
}

export function PillarView({
  dir,
  content,
  cta,
  breadcrumbJsonLd,
}: {
  dir: 'rtl' | 'ltr'
  content: EnterprisePillarContent
  cta: string
  breadcrumbJsonLd: object
}) {
  return (
    <main dir={dir} className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }}
      />
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {content.eyebrow}
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{content.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">{content.subtitle}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={cta}
            className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            {content.ctaLabel}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid gap-8">
          {content.points.map((point) => (
            <div key={point.title} className="rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold">{point.title}</h2>
              <p className="mt-2 text-slate-600">{point.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
