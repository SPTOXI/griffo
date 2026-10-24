import Image from 'next/image'
import Link from 'next/link'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { dirForLang } from '@/lib/i18n'
import type { CityJobsContext } from '@/lib/city-jobs/context'

/** Moldura das páginas de vagas por cidade: cabeçalho, rodapé e direção do texto do idioma. */
export function CityJobsShell({ ctx, children }: { ctx: CityJobsContext; children: React.ReactNode }) {
  const { c, lang, slug } = ctx
  return (
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/60 via-white to-white">
      <DocumentLanguage lang={lang} />
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          <Link href={`/${slug}`} className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="GriffoWork" width={110} height={84} className="h-10 w-auto object-contain" />
            <span className="font-extrabold text-[#0B192E] tracking-tight">
              griffo<span className="text-[#0B63E5]">work</span>
            </span>
          </Link>
          <Link href={`/${slug}/jobs`} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            {c.navLabel}
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <Link href={`/${slug}`} className="hover:text-slate-800">GriffoWork</Link> ·{' '}
        <Link href={`/privacy?lang=${lang}`} className="hover:text-slate-800">{c.privacy}</Link>
      </footer>
    </div>
  )
}

/** Chamada para o produto: o visitante veio atrás de vaga, o Griffo prepara o currículo para ela. */
export function ResumeCta({ ctx }: { ctx: CityJobsContext }) {
  const { c, lang, slug } = ctx
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6 space-y-3">
      <h2 className="text-lg font-bold text-[#0B192E]">{c.ctaTitle}</h2>
      <p className="text-sm text-slate-700">{c.ctaText}</p>
      <div className="flex flex-wrap gap-3">
        <Link href={`/ats-check?lang=${lang}`} className="rounded-lg bg-[#0B63E5] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          {c.ctaFree}
        </Link>
        <Link href={`/${slug}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          {c.ctaFull}
        </Link>
      </div>
    </section>
  )
}

/** Versão de uma linha da chamada, para ir antes da lista de vagas. */
export function ResumeCtaCompact({ ctx }: { ctx: CityJobsContext }) {
  const { c, lang } = ctx
  return (
    <Link
      href={`/ats-check?lang=${lang}`}
      className="flex flex-col items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#0B192E] hover:bg-blue-100 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <span>{c.ctaTitle}</span>
      <span className="shrink-0 rounded-lg bg-[#0B63E5] px-3 py-1.5 text-xs text-white">{c.ctaFree}</span>
    </Link>
  )
}
