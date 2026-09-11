import type { Metadata } from 'next'
import Link from 'next/link'
import { dirForLang, localeForLang, LANGUAGES } from '@/lib/i18n'
import { resolveRequestLanguage } from '@/lib/i18n/resolve-request-language'
import { salesMailto } from '@/lib/i18n/contact'
import { enterpriseContentFor } from '@/lib/enterprise/content'

/**
 * `/enterprise` — landing do Griffo Enterprise (B2B), Fase 1 do plano de
 * SEO/GEO decidido em 2026-09-10.
 *
 * Segmento estático, fora do roteamento `[country]` dinâmico: o produto é
 * global por natureza (compra corporativa, não candidato por país), mesmo
 * raciocínio de `/market-pulse`. Conteúdo agora nos 12 idiomas de
 * `lib/enterprise/locales` — o hreflang completo só entrou depois que a
 * tradução de verdade existia (ver histórico da Fase 0).
 */

const CANONICAL = 'https://griffo.work/enterprise'

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = await resolveRequestLanguage(searchParams)
  const content = enterpriseContentFor(lang).landing

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
    alternates: {
      canonical: CANONICAL,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [localeForLang(l), `${CANONICAL}?lang=${l}`])
      ),
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: CANONICAL,
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

export default async function EnterprisePage({ searchParams }: PageProps) {
  const lang = await resolveRequestLanguage(searchParams)
  const dir = dirForLang(lang)
  const locale = enterpriseContentFor(lang)
  const content = locale.landing
  const breadcrumbHome = locale.breadcrumbHome
  const cta = salesMailto(lang)
  const qs = `?lang=${lang}`

  // Texto exatamente igual ao exibido na seção de FAQ abaixo — schema.org
  // `FAQPage` exige isso (ver o porquê da FAQPage viver na página, e não no
  // layout raiz, no comentário de `layout.tsx`).
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbHome, item: 'https://griffo.work' },
      { '@type': 'ListItem', position: 2, name: content.eyebrow, item: CANONICAL },
    ],
  }

  // Mesma entidade `Organization` já declarada em `layout.tsx` (não repete
  // `logo`/`contactPoint`, que já vivem lá). Sem `offers`/preço: diferente do
  // `SoftwareApplication` da GriffoWork consumer, o Enterprise não tem plano
  // gratuito nem preço público — inventar um aqui seria a mesma fabricação
  // que este projeto já evita em outros lugares (ver `ats/content-types.ts`).
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${CANONICAL}#application`,
    name: 'Griffo Enterprise',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    description: content.metaDescription,
    provider: { '@id': 'https://griffo.work/enterprise#organization' },
  }

  return (
    <main dir={dir} className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
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
        <div className="grid gap-8 sm:grid-cols-2">
          <Link
            href={`/enterprise/external-recruitment${qs}`}
            className="rounded-xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <h2 className="text-xl font-semibold">{content.useCases[0].title}</h2>
            <p className="mt-2 text-slate-600">{content.useCases[0].body}</p>
          </Link>
          <Link
            href={`/enterprise/internal-mobility${qs}`}
            className="rounded-xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <h2 className="text-xl font-semibold">{content.useCases[1].title}</h2>
            <p className="mt-2 text-slate-600">{content.useCases[1].body}</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {content.faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                {faq.question}
              </summary>
              <p className="mt-2 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
