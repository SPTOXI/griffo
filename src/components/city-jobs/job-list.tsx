import type { CityJob } from '@/lib/city-jobs/city-index.server'
import type { CityJobsContext } from '@/lib/city-jobs/context'
import { categoryLabel } from '@/lib/jobs/category-labels'
import { atsFromUrl } from '@/lib/ats/from-url'
import { ATS_META } from '@/lib/ats/meta'
import { atsLanguagesFor } from '@/lib/ats/content'
import { fill } from '@/lib/city-jobs/copy'
import type { Language } from '@/lib/i18n/types'

/** Link do guia do ATS da vaga, no idioma da página, ou em inglês se o guia não existe nele. */
function atsGuide(url: string, lang: Language): { name: string; href: string } | null {
  const slug = atsFromUrl(url)
  if (!slug || !ATS_META[slug]) return null
  const langs = atsLanguagesFor(slug)
  const guideLang = langs.includes(lang) ? lang : langs.includes('en') ? 'en' : null
  return guideLang ? { name: ATS_META[slug].name, href: `/ats/${slug}?lang=${guideLang}` } : null
}

/** Fontes que não informam a empresa mandam um marcador em vez de nada. */
const NO_COMPANY = new Set(['unknown', 'n/a', 'confidencial', 'confidential', ''])

/** Lista de vagas. O link vai para a candidatura na fonte, fora do Griffo. */
export function JobList({ ctx, jobs }: { ctx: CityJobsContext; jobs: CityJob[] }) {
  const { c, lang, locale } = ctx
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' })
  return (
    <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {jobs.map((j) => {
        const tags = [
          j.remoteType && c.remote[j.remoteType],
          j.seniority && c.seniority[j.seniority],
          j.category && categoryLabel(j.category, lang),
        ].filter((t): t is string => Boolean(t))
        const guide = atsGuide(j.applicationUrl, lang)
        return (
          <li key={j.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#0B192E] break-words">{j.title}</h3>
              <p className="text-sm text-slate-600">
                {NO_COMPANY.has(j.company.trim().toLowerCase()) ? '' : `${j.company} · `}
                {j.city}
                {j.region && j.region !== j.city ? ` – ${j.region}` : ''}
              </p>
              {tags.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{t}</span>
                  ))}
                </p>
              )}
              {guide && (
                <a href={guide.href} className="mt-1 inline-block text-xs font-semibold text-[#0B63E5] hover:underline">
                  {fill(c.atsHint, { ats: guide.name })}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {j.publishedAt && <span className="text-xs text-slate-500">{dateFmt.format(new Date(j.publishedAt))}</span>}
              <a
                href={j.applicationUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {c.seeJob}
              </a>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
