'use client'

import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
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

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const BLUE = '#0B63E5'

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
        const [{ default: maplibregl }, res] = await Promise.all([import('maplibre-gl'), fetch('/api/public/jobs-map')])
        const { points } = (await res.json()) as { points: MapPoint[] }
        if (cancelled || !box.current) return
        if (!points?.length) return setState('empty')

        map = new maplibregl.Map({
          container: box.current,
          style: STYLE_URL,
          center: [0, 20],
          zoom: 1.3,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        })
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

        // Abre enquadrado no país da página; o resto do mundo fica a um zoom de distância.
        const own = points.filter((p) => p.c === countryCode)
        if (own.length) {
          const lng = own.map((p) => p.lng)
          const lat = own.map((p) => p.lat)
          map.fitBounds(
            [
              [Math.min(...lng), Math.min(...lat)],
              [Math.max(...lng), Math.max(...lat)],
            ],
            { padding: 40, maxZoom: 9, duration: 0 }
          )
        }

        map.on('load', () => {
          if (!map) return
          // Nomes de país e cidade do mapa base no idioma da página ("Alemanha", "Deutschland"),
          // com o nome local quando o OpenStreetMap não tem a tradução.
          for (const layer of map.getStyle().layers) {
            if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field')) {
              map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${lang}`], ['get', 'name']])
            }
          }
          map.addSource('cities', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: points.map((p) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: { c: p.c, s: p.s, n: p.n, t: p.t },
              })),
            },
            cluster: true,
            clusterRadius: 45,
            clusterMaxZoom: 8,
            // Soma de vagas, não de cidades: o número da bolha é o que interessa a quem procura emprego.
            clusterProperties: { jobs: ['+', ['get', 't']] },
          })
          const count: any = ['coalesce', ['get', 'jobs'], ['get', 't']]
          map.addLayer({
            id: 'bubbles',
            type: 'circle',
            source: 'cities',
            paint: {
              'circle-color': BLUE,
              'circle-opacity': 0.85,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-radius': ['interpolate', ['linear'], ['sqrt', count], 1, 10, 10, 18, 40, 34],
            },
          })
          map.addLayer({
            id: 'bubble-count',
            type: 'symbol',
            source: 'cities',
            layout: {
              'text-field': ['to-string', count],
              'text-font': ['Noto Sans Bold'],
              'text-size': 12,
              'text-allow-overlap': true,
            },
            paint: { 'text-color': '#ffffff' },
          })

          map.on('click', 'bubbles', async (e) => {
            const f = e.features?.[0]
            if (!f || !map) return
            const p = f.properties as Record<string, any>
            const center = (f.geometry as { coordinates: [number, number] }).coordinates
            if (p.cluster) {
              const zoom = await (map.getSource('cities') as GeoJSONSource).getClusterExpansionZoom(p.cluster_id)
              map.easeTo({ center, zoom })
              return
            }
            setSelected({ country: p.c, slug: p.s, name: p.n, total: p.t })
          })
          map.on('mouseenter', 'bubbles', () => map && (map.getCanvas().style.cursor = 'pointer'))
          map.on('mouseleave', 'bubbles', () => map && (map.getCanvas().style.cursor = ''))
          setState('ready')
        })
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
