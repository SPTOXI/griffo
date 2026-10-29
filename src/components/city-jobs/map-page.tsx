import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MIN_JOBS_TO_INDEX } from '@/lib/city-jobs/city-index'
import { MIN_CITIES_TO_INDEX_MAP } from '@/lib/city-jobs/city-coords'
import { loadMapPoints } from '@/lib/city-jobs/city-coords.server'
import { cityJobsContext } from '@/lib/city-jobs/context'
import { fill } from '@/lib/city-jobs/copy'
import { JOBS_MAP_COPY } from '@/lib/city-jobs/map-copy'
import { JobsMap } from './jobs-map'
import { CityJobsShell, ResumeCta } from './shell'

const BASE = 'https://griffo.work'

async function countryPoints(code: string) {
  return (await loadMapPoints()).filter((p) => p.c === code).sort((a, b) => b.t - a.t)
}

export async function mapMetadata(country: string): Promise<Metadata> {
  const ctx = cityJobsContext(country)
  if (!ctx) return { title: 'GriffoWork', robots: { index: false } }
  const m = JOBS_MAP_COPY[ctx.lang]
  const points = await countryPoints(ctx.code)
  const title = fill(m.metaTitle, { country: ctx.countryName })
  const description = fill(m.metaDescription, {
    n: points.reduce((s, p) => s + p.t, 0).toLocaleString(ctx.locale),
    cities: points.length.toLocaleString(ctx.locale),
  })
  const url = `${BASE}/${ctx.slug}/jobs/map`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: points.length >= MIN_CITIES_TO_INDEX_MAP ? undefined : { index: false, follow: true },
    openGraph: { title, description, url, siteName: 'GriffoWork', type: 'website', locale: ctx.locale.replace('-', '_') },
  }
}

export async function MapPage({ country }: { country: string }) {
  const ctx = cityJobsContext(country)
  if (!ctx) notFound()
  const m = JOBS_MAP_COPY[ctx.lang]
  const top = (await countryPoints(ctx.code)).filter((p) => p.t >= MIN_JOBS_TO_INDEX).slice(0, 30)
  return (
    <CityJobsShell ctx={ctx}>
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{fill(m.heading, { country: ctx.countryName })}</h1>
        <p className="text-slate-600">{m.intro}</p>
        <Link href={`/${ctx.slug}/jobs`} className="inline-block text-sm font-semibold text-[#0B63E5] hover:underline">
          {m.listLink}
        </Link>
      </div>
      <JobsMap
        countryCode={ctx.code}
        locale={ctx.locale}
        lang={ctx.lang}
        copy={m}
        seeJob={ctx.c.seeJob}
        remoteLabels={ctx.c.remote}
        minJobsForPage={MIN_JOBS_TO_INDEX}
      />
      {top.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0B192E]">{m.topCities}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((p) => (
              <li key={p.s}>
                <Link
                  href={`/${ctx.slug}/jobs/${encodeURIComponent(p.s)}`}
                  className="flex justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-[#0B63E5]"
                >
                  <span className="font-semibold text-[#0B192E]">{p.n}</span>
                  <span className="text-sm text-slate-500">{p.t.toLocaleString(ctx.locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ResumeCta ctx={ctx} />
      <p className="text-xs text-slate-500">{m.credit}</p>
    </CityJobsShell>
  )
}
