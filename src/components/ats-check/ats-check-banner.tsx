import Link from 'next/link'
import { ArrowRight, ScanSearch } from 'lucide-react'
import { ATS_CHECK_COPY, ATS_CHECK_PATH, isAtsCheckLang } from '@/lib/ats-check/copy'

/** Faixa na landing que leva ao teste ATS grátis. Some nos idiomas sem teste. */
export function AtsCheckBanner({ lang }: { lang: string }) {
  if (!isAtsCheckLang(lang)) return null
  const c = ATS_CHECK_COPY[lang]
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 my-8 sm:my-10">
      <Link
        href={`${ATS_CHECK_PATH}?lang=${lang}&utm_source=landing&utm_medium=banner`}
        className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 px-5 py-4 hover:bg-emerald-50 transition-colors"
      >
        <ScanSearch className="w-8 h-8 text-emerald-600 shrink-0" />
        <div className="text-center sm:text-left flex-1">
          <p className="font-extrabold text-[#0B192E]">{c.bannerTitle}</p>
          <p className="text-sm text-slate-600">{c.bannerText}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold px-4 py-2">
          {c.bannerCta} <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    </section>
  )
}
