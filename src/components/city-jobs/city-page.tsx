import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { jsonLd } from '@/lib/json-ld'
import { categoryLabel, type JobCategorySlug } from '@/lib/jobs/category-labels'
import { MIN_JOBS_TO_INDEX, areaFromUrl, areaToUrl } from '@/lib/city-jobs/city-index'
import { findCity, listCityJobs, loadCityIndex } from '@/lib/city-jobs/city-index.server'
import { cityJobsContext, type CityJobsContext } from '@/lib/city-jobs/context'
import { fill } from '@/lib/city-jobs/copy'
import { JobList } from './job-list'
import { CityJobsShell, ResumeCta } from './shell'

const BASE = 'https://griffo.work'

/** Resolve país, cidade e área da URL. `null` quando a combinação não tem vaga: vira 404. */
async function resolve(countrySlug: string, citySlug: string, areaParam?: string) {
  const ctx = cityJobsContext(countrySlug)
  if (!ctx) return null
  const city = await findCity(ctx.code, citySlug)
  if (!city) return null
  if (areaParam === undefined) return { ctx, city, area: null, count: city.total }
  const area = areaFromUrl(areaParam)
  const count = area ? city.areas.find((a) => a.area === area)?.count ?? 0 : 0
  if (!area || count === 0) return null
  return { ctx, city, area, count }
}

const heading = (ctx: CityJobsContext, cityName: string, area: JobCategorySlug | null) =>
  area
    ? fill(ctx.c.areaTitle, { area: categoryLabel(area, ctx.lang), city: cityName })
    : fill(ctx.c.cityTitle, { city: cityName })

const pathFor = (ctx: CityJobsContext, citySlug: string, area: JobCategorySlug | null) =>
  `/${ctx.slug}/jobs/${citySlug}${area ? `/${areaToUrl(area)}` : ''}`

const fmt = (ctx: CityJobsContext, n: number) => n.toLocaleString(ctx.locale)

export async function cityPageMetadata(country: string, city: string, area?: string): Promise<Metadata> {
  const r = await resolve(country, city, area)
  if (!r) return { title: 'GriffoWork', robots: { index: false } }
  const { ctx } = r
  const count = fmt(ctx, r.count)
  const title = `${heading(ctx, r.city.name, r.area)} — ${fill(ctx.c.metaTitleSuffix, { count })} | GriffoWork`
  const description = fill(ctx.c.metaDescription, { count, city: r.city.name })
  const url = `${BASE}${pathFor(ctx, r.city.slug, r.area)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: r.count < MIN_JOBS_TO_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, siteName: 'GriffoWork', type: 'website', locale: ctx.locale.replace('-', '_') },
  }
}

export async function CityPage({ country, city: citySlug, area: areaParam }: { country: string; city: string; area?: string }) {
  const r = await resolve(country, citySlug, areaParam)
  if (!r) notFound()
  const { ctx, city, area, count } = r
  const { c, lang } = ctx
  const jobs = await listCityJobs(ctx.code, city, area)
  const title = heading(ctx, city.name, area)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.breadcrumbRoot, item: `${BASE}/${ctx.slug}/jobs` },
      { '@type': 'ListItem', position: 2, name: city.name, item: `${BASE}${pathFor(ctx, city.slug, null)}` },
      ...(area
        ? [{ '@type': 'ListItem', position: 3, name: categoryLabel(area, lang), item: `${BASE}${pathFor(ctx, city.slug, area)}` }]
        : []),
    ],
  }

  return (
    <CityJobsShell ctx={ctx}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <nav className="text-sm text-slate-500">
        <Link href={`/${ctx.slug}/jobs`} className="hover:text-slate-800">{c.breadcrumbRoot}</Link>
        {' › '}
        {area ? (
          <>
            <Link href={pathFor(ctx, city.slug, null)} className="hover:text-slate-800">{city.name}</Link>
            {' › '}
            {categoryLabel(area, lang)}
          </>
        ) : (
          city.name
        )}
      </nav>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{title}</h1>
        <p className="text-slate-600">
          {count === 1 ? c.countLineOne : fill(c.countLine, { count: fmt(ctx, count) })}
          {count > jobs.length && ` ${fill(c.showingRecent, { n: jobs.length })}`}
        </p>
      </div>

      {!area && city.areas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-[#0B192E]">{c.byArea}</h2>
          <div className="flex flex-wrap gap-2">
            {city.areas.map((a) => (
              <Link
                key={a.area}
                href={pathFor(ctx, city.slug, a.area)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:border-[#0B63E5] hover:text-[#0B63E5]"
              >
                {categoryLabel(a.area, lang)} <span className="text-slate-400">({fmt(ctx, a.count)})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ResumeCta ctx={ctx} />

      <JobList ctx={ctx} jobs={jobs} />

      {area && (
        <p className="text-sm">
          <Link href={pathFor(ctx, city.slug, null)} className="font-semibold text-[#0B63E5] hover:underline">
            {fill(c.seeAllInCity, { city: city.name })}
          </Link>
        </p>
      )}
    </CityJobsShell>
  )
}

export async function hubMetadata(country: string): Promise<Metadata> {
  const ctx = cityJobsContext(country)
  if (!ctx) return { title: 'GriffoWork', robots: { index: false } }
  const title = fill(ctx.c.hubMetaTitle, { country: ctx.countryName })
  const description = fill(ctx.c.hubMetaDescription, { country: ctx.countryName })
  const url = `${BASE}/${ctx.slug}/jobs`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'GriffoWork', type: 'website', locale: ctx.locale.replace('-', '_') },
  }
}

export async function HubPage({ country }: { country: string }) {
  const ctx = cityJobsContext(country)
  if (!ctx) notFound()
  const cities = (await loadCityIndex(ctx.code)).filter((x) => x.total >= MIN_JOBS_TO_INDEX)
  // País sem nenhuma cidade com vagas suficientes: página vazia não serve a
  // ninguém, e 404 quebraria o link da home. Vai para a página do país.
  if (cities.length === 0) redirect(`/${ctx.slug}`)
  const total = cities.reduce((s, x) => s + x.total, 0)
  return (
    <CityJobsShell ctx={ctx}>
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">
          {fill(ctx.c.hubTitle, { country: ctx.countryName })}
        </h1>
        <p className="text-slate-600">{fill(ctx.c.hubLead, { count: fmt(ctx, total), n: fmt(ctx, cities.length) })}</p>
      </div>
      <ResumeCta ctx={ctx} />
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {cities.map((x) => (
          <li key={x.slug}>
            <Link
              href={pathFor(ctx, x.slug, null)}
              className="flex justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-[#0B63E5]"
            >
              <span className="font-semibold text-[#0B192E]">{x.name}</span>
              <span className="text-sm text-slate-500">{fmt(ctx, x.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </CityJobsShell>
  )
}
