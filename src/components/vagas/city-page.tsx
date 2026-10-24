import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { jsonLd } from '@/lib/json-ld'
import { categoryLabel, type JobCategorySlug } from '@/lib/jobs/category-labels'
import { MIN_JOBS_TO_INDEX, areaFromUrl, areaToUrl } from '@/lib/vagas/city-index'
import { findCity, listCityJobs } from '@/lib/vagas/city-index.server'
import { JobList } from './job-list'
import { ResumeCta, VagasShell } from './vagas-shell'

const BASE = 'https://griffo.work'

/** Resolve cidade e área da URL. `null` quando a combinação não tem vaga: vira 404. */
async function resolve(cidade: string, areaParam?: string) {
  const city = await findCity(cidade)
  if (!city) return null
  if (areaParam === undefined) return { city, area: null, count: city.total }
  const area = areaFromUrl(areaParam)
  const count = area ? city.areas.find((a) => a.area === area)?.count ?? 0 : 0
  if (!area || count === 0) return null
  return { city, area, count }
}

const heading = (cityName: string, area: JobCategorySlug | null) =>
  area ? `Vagas de ${categoryLabel(area, 'pt')} em ${cityName}` : `Vagas de emprego em ${cityName}`

const pathFor = (citySlug: string, area: JobCategorySlug | null) =>
  area ? `/vagas/${citySlug}/${areaToUrl(area)}` : `/vagas/${citySlug}`

export async function cityPageMetadata(cidade: string, areaParam?: string): Promise<Metadata> {
  const r = await resolve(cidade, areaParam)
  if (!r) return { title: 'Vagas | GriffoWork', robots: { index: false } }
  const title = `${heading(r.city.name, r.area)} — ${r.count} abertas | GriffoWork`
  const description =
    `${r.count} vagas abertas${r.area ? ` de ${categoryLabel(r.area, 'pt')}` : ''} em ${r.city.name}, atualizadas todo dia. ` +
    'Veja as vagas e teste grátis se o seu currículo passa no ATS das empresas.'
  const url = `${BASE}${pathFor(r.city.slug, r.area)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: r.count < MIN_JOBS_TO_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, siteName: 'GriffoWork', type: 'website', locale: 'pt_BR' },
  }
}

export async function CityPage({ cidade, area: areaParam }: { cidade: string; area?: string }) {
  const r = await resolve(cidade, areaParam)
  if (!r) notFound()
  const { city, area, count } = r
  const jobs = await listCityJobs(city, area)
  const title = heading(city.name, area)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vagas', item: `${BASE}/vagas` },
      { '@type': 'ListItem', position: 2, name: city.name, item: `${BASE}/vagas/${city.slug}` },
      ...(area
        ? [{ '@type': 'ListItem', position: 3, name: categoryLabel(area, 'pt'), item: `${BASE}${pathFor(city.slug, area)}` }]
        : []),
    ],
  }

  return (
    <VagasShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <nav className="text-sm text-slate-500">
        <Link href="/vagas" className="hover:text-slate-800">Vagas</Link>
        {' › '}
        {area ? (
          <>
            <Link href={`/vagas/${city.slug}`} className="hover:text-slate-800">{city.name}</Link>
            {' › '}
            {categoryLabel(area, 'pt')}
          </>
        ) : (
          city.name
        )}
      </nav>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{title}</h1>
        <p className="text-slate-600">
          {count.toLocaleString('pt-BR')} {count === 1 ? 'vaga aberta' : 'vagas abertas'}, reunidas de várias fontes e
          atualizadas todo dia.
          {count > jobs.length && ` Mostrando as ${jobs.length} mais recentes.`}
        </p>
      </div>

      {!area && city.areas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-[#0B192E]">Por área</h2>
          <div className="flex flex-wrap gap-2">
            {city.areas.map((a) => (
              <Link
                key={a.area}
                href={pathFor(city.slug, a.area)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:border-[#0B63E5] hover:text-[#0B63E5]"
              >
                {categoryLabel(a.area, 'pt')} <span className="text-slate-400">({a.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ResumeCta />

      <JobList jobs={jobs} />

      {area && (
        <p className="text-sm">
          <Link href={`/vagas/${city.slug}`} className="font-semibold text-[#0B63E5] hover:underline">
            Ver todas as vagas em {city.name}
          </Link>
        </p>
      )}
    </VagasShell>
  )
}
