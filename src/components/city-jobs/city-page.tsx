import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { jsonLd } from '@/lib/json-ld'
import { categoryLabel, type JobCategorySlug } from '@/lib/jobs/category-labels'
import { MIN_JOBS_TO_INDEX, areaFromUrl, areaToUrl, type CityEntry } from '@/lib/city-jobs/city-index'
import {
  JOBS_PER_PAGE,
  LEVEL_FILTERS,
  WORK_FILTERS,
  findCity,
  listJobs,
  loadCityIndex,
} from '@/lib/city-jobs/city-index.server'
import { cityJobsContext, type CityJobsContext } from '@/lib/city-jobs/context'
import { fill } from '@/lib/city-jobs/copy'
import { JobList } from './job-list'
import { CityJobsShell, ResumeCta, ResumeCtaCompact } from './shell'

const BASE = 'https://griffo.work'

/** Slug reservado da página de vagas remotas do país. Nunca é cidade (`cityName` o descarta). */
export const REMOTE_SLUG = 'remote'

export type SearchParams = Promise<Record<string, string | string[] | undefined>>

interface Filters {
  work: string | null
  level: string | null
  page: number
}

/** Filtros da URL, só com valores conhecidos. O resto é ignorado. */
function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : null)
  const work = one('work')
  const level = one('level')
  // Teto de 25 levas (1.000 vagas numa página só).
  const page = Math.max(1, Math.min(25, parseInt(one('page') ?? '1', 10) || 1))
  return {
    work: work && (WORK_FILTERS as readonly string[]).includes(work) ? work : null,
    level: level && (LEVEL_FILTERS as readonly string[]).includes(level) ? level : null,
    page,
  }
}

interface Resolved {
  ctx: CityJobsContext
  /** `null` na página de vagas remotas do país. */
  city: CityEntry | null
  area: JobCategorySlug | null
}

/** Resolve país, cidade e área da URL. `null` quando a combinação não tem vaga: vira 404. */
async function resolve(countrySlug: string, citySlug: string, areaParam?: string): Promise<Resolved | null> {
  const ctx = cityJobsContext(countrySlug)
  if (!ctx) return null
  if (citySlug === REMOTE_SLUG && areaParam === undefined) return { ctx, city: null, area: null }
  const city = await findCity(ctx.code, citySlug)
  if (!city) return null
  if (areaParam === undefined) return { ctx, city, area: null }
  const area = areaFromUrl(areaParam)
  const count = area ? city.areas.find((a) => a.area === area)?.count ?? 0 : 0
  if (!area || count === 0) return null
  return { ctx, city, area }
}

function query(r: Resolved, f: Filters) {
  return {
    country: r.ctx.code,
    rawCities: r.city ? r.city.rawCities : null,
    area: r.area,
    // A página remota é o filtro "remoto" fixo.
    work: r.city ? f.work : 'remote',
    level: f.level,
    page: f.page,
  }
}

const heading = (r: Resolved) => {
  const { ctx, city, area } = r
  if (!city) return fill(ctx.c.remoteTitle, { country: ctx.countryName })
  return area
    ? fill(ctx.c.areaTitle, { area: categoryLabel(area, ctx.lang), city: city.name })
    : fill(ctx.c.cityTitle, { city: city.name })
}

const pathFor = (ctx: CityJobsContext, citySlug: string, area: JobCategorySlug | null) =>
  `/${ctx.slug}/jobs/${citySlug}${area ? `/${areaToUrl(area)}` : ''}`

const basePath = (r: Resolved) => pathFor(r.ctx, r.city ? r.city.slug : REMOTE_SLUG, r.area)

/** Link da mesma página com filtros trocados. Mudar filtro volta à página 1. */
function hrefWith(r: Resolved, f: Filters, change: Partial<Filters>): string {
  const next = { ...f, ...(change.page === undefined ? { page: 1 } : {}), ...change }
  const params = new URLSearchParams()
  if (next.work && r.city) params.set('work', next.work)
  if (next.level) params.set('level', next.level)
  if (next.page > 1) params.set('page', String(next.page))
  const qs = params.toString()
  return `${basePath(r)}${qs ? `?${qs}` : ''}`
}

const fmt = (ctx: CityJobsContext, n: number) => n.toLocaleString(ctx.locale)

export async function cityPageMetadata(country: string, city: string, area: string | undefined, sp: SearchParams): Promise<Metadata> {
  const r = await resolve(country, city, area)
  if (!r) return { title: 'GriffoWork', robots: { index: false } }
  const f = parseFilters(await sp)
  const { ctx } = r
  const { total } = await listJobs({ ...query(r, f), page: 1 })
  const count = fmt(ctx, total)
  const title = `${heading(r)} — ${fill(ctx.c.metaTitleSuffix, { count })} | GriffoWork`
  const description = r.city
    ? fill(ctx.c.metaDescription, { count, city: r.city.name })
    : fill(ctx.c.remoteMetaDescription, { count, country: ctx.countryName })
  const url = `${BASE}${basePath(r)}`
  // Variante filtrada ou paginada: o Google segue os links, mas indexa só a página-base.
  const variant = f.work !== null || f.level !== null || f.page > 1
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: variant || total < MIN_JOBS_TO_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, siteName: 'GriffoWork', type: 'website', locale: ctx.locale.replace('-', '_') },
  }
}

function Chips({ label, items }: { label: string; items: { key: string; text: string; href: string; active: boolean }[] }) {
  return (
    // No celular, uma linha que desliza para o lado; a partir de `sm`, quebra normal.
    <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500 me-1">{label}</span>
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          rel="nofollow"
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
            i.active ? 'border-[#0B63E5] bg-[#0B63E5] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-[#0B63E5]'
          }`}
        >
          {i.text}
        </Link>
      ))}
    </div>
  )
}

export async function CityPage({ country, city: citySlug, area: areaParam, searchParams }: { country: string; city: string; area?: string; searchParams: SearchParams }) {
  const r = await resolve(country, citySlug, areaParam)
  if (!r) notFound()
  const f = parseFilters(await searchParams)
  const { ctx, city, area } = r
  const { c, lang } = ctx
  const { total, jobs } = await listJobs(query(r, f))
  // Página remota do país sem nenhuma vaga remota: não há o que mostrar.
  if (!city && total === 0 && f.page === 1 && !f.level) notFound()
  const title = heading(r)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.breadcrumbRoot, item: `${BASE}/${ctx.slug}/jobs` },
      {
        '@type': 'ListItem',
        position: 2,
        name: city ? city.name : c.remoteHubLink,
        item: `${BASE}${pathFor(ctx, city ? city.slug : REMOTE_SLUG, null)}`,
      },
      ...(area && city
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
        {area && city ? (
          <>
            <Link href={pathFor(ctx, city.slug, null)} className="hover:text-slate-800">{city.name}</Link>
            {' › '}
            {categoryLabel(area, lang)}
          </>
        ) : city ? (
          city.name
        ) : (
          c.remoteHubLink
        )}
      </nav>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{title}</h1>
        <p className="text-slate-600">
          {total === 1 ? c.countLineOne : fill(c.countLine, { count: fmt(ctx, total) })}
        </p>
      </div>

      {city && !area && city.areas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-[#0B192E]">{c.byArea}</h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {city.areas.map((a) => (
              <Link
                key={a.area}
                href={pathFor(ctx, city.slug, a.area)}
                className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:border-[#0B63E5] hover:text-[#0B63E5]"
              >
                {categoryLabel(a.area, lang)} <span className="text-slate-400">({fmt(ctx, a.count)})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        {city && (
          <Chips
            label={c.filterWork}
            items={[
              { key: 'all', text: c.filterAll, href: hrefWith(r, f, { work: null }), active: f.work === null },
              ...WORK_FILTERS.map((w) => ({ key: w, text: c.remote[w], href: hrefWith(r, f, { work: w }), active: f.work === w })),
            ]}
          />
        )}
        <Chips
          label={c.filterLevel}
          items={[
            { key: 'all', text: c.filterAll, href: hrefWith(r, f, { level: null }), active: f.level === null },
            ...LEVEL_FILTERS.map((l) => ({ key: l, text: c.seniority[l], href: hrefWith(r, f, { level: l }), active: f.level === l })),
          ]}
        />
      </section>

      {/* Chamada curta antes da lista; a completa vem depois, para as vagas
          aparecerem cedo no celular. */}
      <ResumeCtaCompact ctx={ctx} />

      {jobs.length > 0 ? (
        <JobList ctx={ctx} jobs={jobs} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          {c.noResults}{' '}
          <Link href={basePath(r)} className="font-semibold text-[#0B63E5] hover:underline">{c.clearFilters}</Link>
        </p>
      )}

      {jobs.length > 0 && total > jobs.length && (
        <div className="flex flex-col items-center gap-2">
          {/* Link de verdade (a página com mais uma leva), sem rolar para o topo:
              funciona sem JavaScript e o Google segue; com JavaScript, o Next
              troca só o conteúdo e a lista cresce no lugar. */}
          <Link
            href={hrefWith(r, f, { page: f.page + 1 })}
            scroll={false}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-[#0B63E5] hover:text-[#0B63E5]"
          >
            {c.loadMore}
          </Link>
          <span className="text-xs text-slate-500">{fill(c.showing, { n: fmt(ctx, jobs.length), total: fmt(ctx, total) })}</span>
        </div>
      )}

      <ResumeCta ctx={ctx} />

      {area && city && (
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

/** Quantas vagas remotas abertas o país tem (para o link do hub e o sitemap). */
export async function remoteJobsCount(countryCode: string): Promise<number> {
  const { total } = await listJobs({ country: countryCode, rawCities: null, area: null, work: 'remote', level: null, page: 1 })
  return total
}

export async function HubPage({ country }: { country: string }) {
  const ctx = cityJobsContext(country)
  if (!ctx) notFound()
  const [index, remote] = await Promise.all([loadCityIndex(ctx.code), remoteJobsCount(ctx.code)])
  const cities = index.filter((x) => x.total >= MIN_JOBS_TO_INDEX)
  // País sem nenhuma cidade com vagas suficientes nem vaga remota: página vazia
  // não serve a ninguém, e 404 quebraria o link da home. Vai para a página do país.
  if (cities.length === 0 && remote === 0) redirect(`/${ctx.slug}`)
  const total = cities.reduce((s, x) => s + x.total, 0)
  return (
    <CityJobsShell ctx={ctx}>
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">
          {fill(ctx.c.hubTitle, { country: ctx.countryName })}
        </h1>
        <p className="text-slate-600">{fill(ctx.c.hubLead, { count: fmt(ctx, total), n: fmt(ctx, cities.length) })}</p>
      </div>
      {remote > 0 && (
        <Link
          href={pathFor(ctx, REMOTE_SLUG, null)}
          className="flex w-fit items-center gap-2 rounded-full border border-[#0B63E5] bg-blue-50 px-4 py-2 text-sm font-semibold text-[#0B63E5] hover:bg-blue-100"
        >
          {ctx.c.remoteHubLink} <span className="font-normal text-slate-500">({fmt(ctx, remote)})</span>
        </Link>
      )}
      <ResumeCtaCompact ctx={ctx} />
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
      <ResumeCta ctx={ctx} />
    </CityJobsShell>
  )
}
