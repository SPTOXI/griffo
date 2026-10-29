'use client'

import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import { createBubbleMap, fitTo, hitAt, type CityHit } from '@/components/city-jobs/map-core'
import { trackOnce } from '@/components/analytics/track-client'
import type { MapPoint } from '@/lib/city-jobs/city-coords'
import { fill } from '@/lib/city-jobs/copy'
import { JOBS_MAP_COPY } from '@/lib/city-jobs/map-copy'
import { HOME_MAP_COPY } from '@/lib/landing/home-map-copy'
import type { ResultMapPin } from '@/lib/match-preview/result'
import type { Language } from '@/lib/i18n/types'
import { LEAD_PINS_EVENT, LEAD_UNLOCK_EVENT } from './lead-pins'

/**
 * Mapa da home, a isca do envio de currículo.
 *
 * Antes do envio: bolhas por cidade, e o mouse (ou o toque) numa cidade mostra
 * só o nome de até 3 vagas e quantas mais existem ali, sem empresa nem link.
 * A chamada leva de volta ao envio. O mapa completo, com empresa e
 * candidatura, continua em `/[país]/jobs/map` para quem chega pelo Google.
 *
 * Depois do envio: a vaga grátis aparece em vermelho e as compatíveis
 * trancadas com cadeado, só com cidade e quantidade (o servidor não manda
 * mais que isso, ver `lockedPlaces` em `match-preview/result.ts`).
 *
 * A biblioteca do mapa só é baixada quando a seção chega perto da tela: o topo
 * da home não fica mais pesado por causa dela.
 */

const RED = '#E5243B'
const LOCK_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

function el(tag: string, className: string, text?: string): HTMLElement {
  const e = document.createElement(tag)
  e.className = className
  // Sempre `textContent`: título de vaga vem de fonte externa e não pode virar HTML.
  if (text !== undefined) e.textContent = text
  return e
}

export function HomeJobsMap({ lang, countryCode, locale }: { lang: Language; countryCode?: string; locale: string }) {
  const m = HOME_MAP_COPY[lang]
  const base = JOBS_MAP_COPY[lang]
  const section = useRef<HTMLElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'failed' | 'empty'>('loading')
  const [summary, setSummary] = useState<{ jobs: number; cities: number } | null>(null)
  const [hasPins, setHasPins] = useState(false)
  const nf = new Intl.NumberFormat(locale)

  // Só monta o mapa quando a seção está a ~400 px de aparecer.
  useEffect(() => {
    const node = section.current
    if (!node) return
    if (!('IntersectionObserver' in window)) return setVisible(true)
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), {
      rootMargin: '400px',
    })
    io.observe(node)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let map: MapLibreMap | null = null
    let markers: Marker[] = []
    let cancelled = false
    const titles = new Map<string, Promise<string[]>>()

    const goToUpload = () => {
      trackOnce('home_map_cta_clicked', 'home_map', { country: countryCode ?? null })
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const titlesOf = (hit: CityHit) => {
      const key = `${hit.country}|${hit.slug}`
      if (!titles.has(key)) {
        titles.set(
          key,
          fetch(`/api/public/jobs-map/jobs?country=${hit.country.toLowerCase()}&city=${encodeURIComponent(hit.slug)}`)
            .then((r) => (r.ok ? r.json() : { jobs: [] }))
            .then((d: { jobs?: { title: string }[] }) => [...new Set((d.jobs ?? []).map((j) => j.title.trim()))].slice(0, 3))
            .catch(() => [])
        )
      }
      return titles.get(key)!
    }

    /** Conteúdo do balão de uma cidade: até 3 nomes de vaga, o resto em número, e a chamada. */
    const cityContent = (hit: CityHit, names: string[] | null, withCta: boolean) => {
      const root = el('div', 'space-y-1.5 text-[13px] leading-snug text-[#0B192E]')
      if (names === null) root.append(el('p', 'text-slate-500', base.loading))
      else {
        const list = el('ul', 'space-y-0.5 font-semibold')
        for (const n of names) list.append(el('li', 'break-words', n))
        root.append(list)
        const rest = hit.total - names.length
        if (rest > 0) root.append(el('p', 'text-slate-600', fill(m.more, { n: nf.format(rest), city: hit.name })))
      }
      if (withCta) {
        const b = el('button', 'mt-1 w-full rounded-md bg-[#0B63E5] px-2.5 py-1.5 text-left text-xs font-bold text-white hover:bg-blue-700', m.cta)
        b.addEventListener('click', goToUpload)
        root.append(b)
      }
      return root
    }

    const showPins = (maplibregl: typeof import('maplibre-gl'), pins: ResultMapPin[]) => {
      if (!map) return
      markers.forEach((mk) => mk.remove())
      markers = []
      for (const pin of pins) {
        const dot = el('div', 'flex items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer')
        dot.style.background = RED
        dot.style.width = dot.style.height = pin.kind === 'free' ? '26px' : '24px'
        if (pin.kind === 'locked') dot.innerHTML = LOCK_SVG
        else dot.append(el('span', 'block h-2.5 w-2.5 rounded-full bg-white'))
        dot.setAttribute('role', 'button')
        dot.setAttribute('aria-label', pin.kind === 'free' ? m.freePin : fill(pin.count === 1 ? m.lockedOne : m.lockedMany, { n: pin.count, city: pin.city }))

        const content = el('div', 'space-y-1.5 text-[13px] leading-snug text-[#0B192E]')
        if (pin.kind === 'free') {
          content.append(el('p', 'text-xs font-bold uppercase tracking-wide', m.freePin))
          content.lastElementChild!.setAttribute('style', `color:${RED}`)
          content.append(el('p', 'font-semibold break-words', pin.title ?? ''), el('p', 'text-slate-600', pin.city))
        } else {
          content.append(el('p', 'font-semibold', fill(pin.count === 1 ? m.lockedOne : m.lockedMany, { n: pin.count, city: pin.city })))
          const b = el('button', 'mt-1 w-full rounded-md px-2.5 py-1.5 text-left text-xs font-bold text-white', m.lockedCta)
          b.style.background = RED
          b.addEventListener('click', () => {
            trackOnce('lead_unlock_clicked', 'home_map', { locked: pin.count })
            window.dispatchEvent(new CustomEvent(LEAD_UNLOCK_EVENT))
          })
          content.append(b)
        }
        const popup = new maplibregl.Popup({ offset: 16, maxWidth: '260px' }).setDOMContent(content)
        markers.push(new maplibregl.Marker({ element: dot }).setLngLat([pin.lng, pin.lat]).setPopup(popup).addTo(map))
      }
      setHasPins(pins.length > 0)
      if (pins.length) {
        fitTo(map, pins.map((p) => [p.lng, p.lat]), 11)
        markers.find((_, i) => pins[i].kind === 'free')?.togglePopup()
      }
    }

    let onPins: ((e: Event) => void) | null = null
    ;(async () => {
      try {
        const res = await fetch('/api/public/jobs-map')
        const { points } = (await res.json()) as { points: MapPoint[] }
        if (cancelled || !box.current) return
        if (!points?.length) return setState('empty')
        const own = countryCode ? points.filter((p) => p.c === countryCode) : []
        const shown = own.length ? own : points
        setSummary({ jobs: shown.reduce((s, p) => s + p.t, 0), cities: shown.length })

        const built = await createBubbleMap({ container: box.current, points, lang, countryCode: own.length ? countryCode : undefined })
        map = built.map
        if (cancelled) return
        const { maplibregl } = built
        const hover: Popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14, maxWidth: '260px' })
        const pinned: Popup = new maplibregl.Popup({ offset: 14, maxWidth: '260px' })
        const canHover = window.matchMedia('(hover: hover)').matches
        let hoverKey = ''

        const open = async (popup: Popup, hit: Awaited<ReturnType<typeof hitAt>>, withCta: boolean) => {
          if (!hit || !map) return
          popup.setLngLat(hit.lngLat)
          if ('cluster' in hit) {
            popup.setDOMContent(el('p', 'text-[13px] text-[#0B192E]', fill(m.clusterTip, { n: nf.format(hit.jobs) }))).addTo(map)
            return
          }
          const key = `${hit.country}|${hit.slug}`
          hoverKey = popup === hover ? key : hoverKey
          popup.setDOMContent(cityContent(hit, null, withCta)).addTo(map)
          const names = await titlesOf(hit)
          // O mouse pode ter ido para outra cidade enquanto os nomes chegavam.
          if (popup === hover && hoverKey !== key) return
          popup.setDOMContent(cityContent(hit, names, withCta))
        }

        if (canHover) {
          map.on('mousemove', 'bubbles', async (e) => {
            const hit = await hitAt(built.map, e.features?.[0] as any, false)
            if (!hit) return
            const key = 'cluster' in hit ? `cluster|${hit.lngLat}` : `${hit.country}|${hit.slug}`
            if (key === hoverKey && hover.isOpen()) return
            hoverKey = key
            open(hover, hit, false)
          })
          map.on('mouseleave', 'bubbles', () => {
            hoverKey = ''
            hover.remove()
          })
        }
        // Clique (ou toque): agrupamento aproxima; cidade abre o balão fixo, com a chamada.
        map.on('click', 'bubbles', async (e) => {
          const hit = await hitAt(built.map, e.features?.[0] as any, true)
          if (!hit || 'cluster' in hit) return
          hover.remove()
          open(pinned, hit, true)
        })

        onPins = (e: Event) => showPins(maplibregl, (e as CustomEvent<ResultMapPin[]>).detail ?? [])
        window.addEventListener(LEAD_PINS_EVENT, onPins)
        if (window.__griffoLeadPins?.length) showPins(maplibregl, window.__griffoLeadPins)
        setState('ready')
      } catch (e) {
        console.warn('[home-map] mapa indisponível:', e)
        if (!cancelled) setState('failed')
      }
    })()
    return () => {
      cancelled = true
      if (onPins) window.removeEventListener(LEAD_PINS_EVENT, onPins)
      markers.forEach((mk) => mk.remove())
      map?.remove()
    }
  }, [visible, countryCode, lang])

  return (
    <section ref={section} id="home-jobs-map" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold text-[#0B192E] sm:text-3xl">{m.heading}</h2>
          {summary && (
            <p className="text-slate-600">{fill(m.intro, { n: nf.format(summary.jobs), cities: nf.format(summary.cities) })}</p>
          )}
        </div>
        <div className="relative h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {/* Altura e largura explícitas: o CSS do MapLibre põe `position: relative` no contêiner. */}
          <div ref={box} className="h-full w-full" />
          {state !== 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-600">
              {state === 'loading' ? base.loading : state === 'empty' ? base.noData : base.unavailable}
            </div>
          )}
        </div>
        {hasPins && (
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white shadow" style={{ background: RED }} />
              {m.legendFree}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full shadow"
                style={{ background: RED }}
                dangerouslySetInnerHTML={{ __html: LOCK_SVG.replace(/13/g, '9') }}
              />
              {m.legendLocked}
            </span>
          </p>
        )}
        <p className="text-xs text-slate-500">{base.credit}</p>
      </div>
    </section>
  )
}
