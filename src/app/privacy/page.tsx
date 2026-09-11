import type { Metadata } from 'next'
import Link from 'next/link'
import { dirForLang, localeForLang, LANGUAGES } from '@/lib/i18n'
import { resolveRequestLanguage } from '@/lib/i18n/resolve-request-language'
import { CONTACT_EMAIL } from '@/lib/i18n/contact'
import { privacyContentFor } from '@/lib/privacy/content'

/**
 * `/privacy` — política de privacidade pública, nos 12 idiomas do site.
 *
 * Existe porque a landing (Hero D, §2.120) cita "LGPD & GDPR" na linha de
 * confiança sem nenhuma página por trás que explicasse o que isso significa
 * na prática — gap identificado nessa sessão e fechado aqui, a pedido do
 * operador ("pode criar uma que não nos comprometa"). Todo fato descrito
 * nesta página é verificável no código (ver `content-types.ts`): retenção
 * vem de `lib/retention.ts`, os sub-processadores de IA vêm de
 * `lib/ai-router/registry.ts`, a restrição por residência de dados vem de
 * `lib/data-residency.ts`, e os direitos descritos (exportar, excluir) são
 * `GET /api/user/export` e `DELETE /api/user`, já implementados.
 *
 * Sem entidade jurídica própria ainda — GriffoWork é citado como marca, não
 * como razão social, e o texto evita qualquer promessa que o produto não
 * cumpre hoje (ver o tom de cada string em `lib/privacy/locales/en.ts`).
 *
 * Mesmo padrão de `/enterprise`: segmento estático fora do roteamento
 * `[country]`, idioma resolvido por `resolveRequestLanguage` (query → cookie
 * → país da borda → inglês), sem exigir renderização dinâmica em toda a
 * árvore de país.
 */

const CANONICAL = 'https://griffo.work/privacy'

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = await resolveRequestLanguage(searchParams)
  const content = privacyContentFor(lang)

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: CANONICAL,
      languages: Object.fromEntries(LANGUAGES.map((l) => [localeForLang(l), `${CANONICAL}?lang=${l}`])),
    },
    robots: { index: true, follow: true },
  }
}

export default async function PrivacyPage({ searchParams }: PageProps) {
  const lang = await resolveRequestLanguage(searchParams)
  const dir = dirForLang(lang)
  const c = privacyContentFor(lang)
  const contactBody = c.contactBody.replace('{email}', CONTACT_EMAIL)

  return (
    <main dir={dir} className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link href="/" className="text-sm font-medium text-[#0B63E5] hover:underline">
          &larr; {c.breadcrumbHome}
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {c.lastUpdatedLabel}: {c.lastUpdatedValue}
        </p>

        <div className="mt-8 space-y-4 text-slate-700">
          {c.intro.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.dataWeCollectHeading}</h2>
          <dl className="mt-4 space-y-4">
            {c.dataCategories.map((d, i) => (
              <div key={i}>
                <dt className="font-semibold text-slate-900">{d.title}</dt>
                <dd className="mt-1 text-slate-700 leading-relaxed">{d.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.howWeUseHeading}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-slate-700">
            {c.howWeUseItems.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.sharingHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{c.sharingIntro}</p>
          <dl className="mt-4 space-y-4">
            {c.subProcessors.map((s, i) => (
              <div key={i}>
                <dt className="font-semibold text-slate-900">{s.name}</dt>
                <dd className="mt-1 text-slate-700 leading-relaxed">{s.purpose}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.transfersHeading}</h2>
          <div className="mt-4 space-y-4 text-slate-700">
            {c.transfersBody.map((p, i) => (
              <p key={i} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.retentionHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{c.retentionIntro}</p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-start text-sm">
              <tbody>
                {c.retentionRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 text-slate-700">{r.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{r.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.rightsHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{c.rightsIntro}</p>
          <dl className="mt-4 space-y-4">
            {c.rights.map((r, i) => (
              <div key={i}>
                <dt className="font-semibold text-slate-900">{r.title}</dt>
                <dd className="mt-1 text-slate-700 leading-relaxed">{r.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.cookiesHeading}</h2>
          <div className="mt-4 space-y-4 text-slate-700">
            {c.cookiesBody.map((p, i) => (
              <p key={i} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.securityHeading}</h2>
          <div className="mt-4 space-y-4 text-slate-700">
            {c.securityBody.map((p, i) => (
              <p key={i} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.childrenHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{c.childrenBody}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.changesHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{c.changesBody}</p>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-[#0B192E]">{c.contactHeading}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{contactBody}</p>
        </section>
      </div>
    </main>
  )
}
