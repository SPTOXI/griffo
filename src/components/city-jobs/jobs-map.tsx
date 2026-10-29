'use client'

import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { createBubbleMap, hitAt } from './map-core'
import type { MapPoint } from '@/lib/city-jobs/city-coords'
import type { JobsMapCopy } from '@/lib/city-jobs/map-copy'
import { fill } from '@/lib/city-jobs/copy'
import { trackOnce } from '@/components/analytics/track-client'

/**
 * Mapa de vagas (ideia do map.rezi.ai): bolhas por cidade, agrupadas quando o
 * mapa está afastado, com a soma das vagas no número. Clicar numa cidade abre
 * as vagas mais novas dela ao lado (embaixo no celular).
 *
 * O mapa base é o OpenFreeMap: gratuito, sem chave e sem arquivo no nosso
 * deploy. A biblioteca (MapLibre) só carrega nesta página, depois que ela abre.
 */


interface PanelJob {
  id: string
  title: string
  company: string
  city: string | null
  remoteType: string | null
  applicationUrl: string
}

interface Selected {
  country: string
  slug: string
  name: string
  total: number
}

export interface JobsMapProps {
  countryCode: string
  locale: string
  lang: string
  copy: JobsMapCopy
  seeJob: string
  remoteLabels: Record<string, string>
  /** Cidade com menos vagas que isso não tem página própria: o painel não manda para ela. */
  minJobsForPage: number
}

const NO_COMPANY = new Set(['unknown', 'n/a', 'confidencial', 'confidential', ''])

export function JobsMap({ countryCode, locale, lang, copy, seeJob, remoteLabels, minJobsForPage }: JobsMapProps) {
  const box = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed' | 'empty'>('loading')
  const [selected, setSelected] = useState<Selected | null>(null)
  const [jobs, setJobs] = useState<PanelJob[] | null>(null)
  const nf = new Intl.NumberFormat(locale)

  useEffect(() => {
    let map: MapLibreMap | null = null
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/public/jobs-map')
        const { points } = (await res.json()) as { points: MapPoint[] }
        if (cancelled || !box.current) return
        if (!points?.length) return setState('empty')
        // Abre enquadrado no país da página; o resto do mundo fica a um zoom de distância.
        const built = await createBubbleMap({ container: box.current, points, lang, countryCode })
        map = built.map
        if (cancelled) return
        map.on('click', 'bubbles', async (e) => {
          const hit = await hitAt(built.map, e.features?.[0] as any, true)
          if (hit && !('cluster' in hit)) setSelected({ country: hit.country, slug: hit.slug, name: hit.name, total: hit.total })
        })
        setState('ready')
      } catch (e) {
        // Sem WebGL, ou a biblioteca não carregou: a lista de cidades da página continua servindo.
        console.warn('[jobs-map] mapa indisponível:', e)
        if (!cancelled) setState('failed')
      }
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [countryCode, lang])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    setJobs(null)
    // No celular o painel fica embaixo do mapa: sem rolar até ele, o toque na cidade parece não fazer nada.
    if (window.matchMedia('(max-width: 1023px)').matches) panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    fetch(`/api/public/jobs-map/jobs?country=${selected.country.toLowerCase()}&city=${encodeURIComponent(selected.slug)}`)
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => !cancelled && setJobs(d.jobs ?? []))
      .catch(() => !cancelled && setJobs([]))
    return () => {
      cancelled = true
    }
  }, [selected])

  const cityPath = selected && `/${selected.country.toLowerCase()}/jobs/${encodeURIComponent(selected.slug)}`
  const atsHref = `/ats-check?lang=${lang}&utm_source=jobs-map`

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="relative h-[60vh] min-h-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {/* Altura e largura explícitas: o CSS do MapLibre põe `position: relative` no contêiner, e com `absolute inset-0` ele ficava com 0 px de altura. */}
        <div ref={box} className="h-full w-full" />
        {state !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-600">
            {state === 'loading' ? copy.loading : state === 'empty' ? copy.noData : copy.unavailable}
          </div>
        )}
      </div>

      <aside ref={panel} className="rounded-2xl border border-slate-200 bg-white p-4 lg:h-[60vh] lg:min-h-[380px] lg:overflow-y-auto" aria-live="polite">
        {!selected ? (
          <p className="text-sm text-slate-600">{copy.pickCity}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0B192E]">{fill(copy.jobsIn, { city: selected.name })}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-sm text-slate-500 hover:text-slate-800">
                {copy.close}
              </button>
            </div>
            {jobs === null ? (
              <p className="text-sm text-slate-500">{copy.loading}</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {jobs.map((j) => (
                  <li key={j.id} className="space-y-1 py-3">
                    <p className="font-semibold text-[#0B192E] break-words">{j.title}</p>
                    <p className="text-sm text-slate-600">
                      {NO_COMPANY.has(j.company.trim().toLowerCase()) ? '' : `${j.company} · `}
                      {j.city}
                      {j.remoteType && remoteLabels[j.remoteType] ? ` · ${remoteLabels[j.remoteType]}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={j.applicationUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="text-sm font-semibold text-slate-800 underline hover:text-[#0B63E5]"
                      >
                        {seeJob}
                      </a>
                      <a
                        href={atsHref}
                        onClick={() => trackOnce('jobs_map_cta_clicked', 'jobs_map', { country: countryCode })}
                        className="text-sm font-semibold text-[#0B63E5] hover:underline"
                      >
                        {copy.jobCta}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {cityPath && selected.total >= minJobsForPage && (
              <a href={cityPath} className="block rounded-lg bg-[#0B63E5] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700">
                {fill(copy.seeAll, { n: nf.format(selected.total), city: selected.name })}
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
