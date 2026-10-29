'use client'

import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { MapPoint } from '@/lib/city-jobs/city-coords'

/**
 * O que o mapa de vagas (`/[país]/jobs/map`) e o mapa da home têm em comum:
 * mapa base, bolhas por cidade somando vagas, zoom ao clicar num agrupamento e
 * nomes no idioma da página. Cada um decide o que acontece ao clicar ou passar
 * o mouse numa cidade.
 *
 * O mapa base é o OpenFreeMap: gratuito, sem chave e sem arquivo no nosso
 * deploy. A biblioteca (MapLibre) só é baixada quando um mapa é montado.
 */

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const BLUE = '#0B63E5'

/** Uma cidade sob o ponteiro ou o dedo. */
export interface CityHit {
  country: string
  slug: string
  name: string
  total: number
  lngLat: [number, number]
}

export interface BubbleMapOptions {
  container: HTMLElement
  points: MapPoint[]
  lang: string
  /** País em que o mapa abre enquadrado; sem cidade dele, abre no mundo. */
  countryCode?: string
  /** Rolar a página com um dedo sem mexer no mapa (o mapa pede dois). */
  cooperativeGestures?: boolean
}


/** Monta o mapa e resolve quando as bolhas estão desenhadas. */
export async function createBubbleMap(opts: BubbleMapOptions) {
  const { default: maplibregl } = await import('maplibre-gl')
  const map = new maplibregl.Map({
    container: opts.container,
    style: STYLE_URL,
    center: [0, 20],
    zoom: 1.3,
    attributionControl: { compact: true },
    cooperativeGestures: opts.cooperativeGestures ?? true,
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

  const own = opts.countryCode ? opts.points.filter((p) => p.c === opts.countryCode) : []
  if (own.length) fitTo(map, own.map((p) => [p.lng, p.lat]), 9, 0)

  await new Promise<void>((resolve) => map.on('load', () => resolve()))
  // O crédito do mapa base abre recolhido no botão ⓘ: aberto, ele cobre o pé do mapa no celular.
  // Continua a um toque, e o crédito completo também vai escrito embaixo do mapa.
  map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
  // Nomes de país e cidade do mapa base no idioma da página ("Alemanha", "Deutschland"),
  // com o nome local quando o OpenStreetMap não tem a tradução.
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field')) {
      map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${opts.lang}`], ['get', 'name']])
    }
  }
  map.addSource('cities', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: opts.points.map((p) => ({
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
  map.on('mouseenter', 'bubbles', () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', 'bubbles', () => (map.getCanvas().style.cursor = ''))
  return { map, maplibregl }
}

/** Enquadra os pontos, sem aproximar demais quando é um só. */
export function fitTo(map: MapLibreMap, coords: [number, number][], maxZoom: number, duration = 800) {
  if (!coords.length) return
  const lng = coords.map((c) => c[0])
  const lat = coords.map((c) => c[1])
  map.fitBounds(
    [
      [Math.min(...lng), Math.min(...lat)],
      [Math.max(...lng), Math.max(...lat)],
    ],
    { padding: 50, maxZoom, duration }
  )
}

/**
 * O que está sob um evento do mapa: uma cidade, ou um agrupamento (que já
 * recebe o zoom aqui quando `zoomCluster` é verdadeiro).
 */
export async function hitAt(
  map: MapLibreMap,
  feature: { properties: Record<string, any>; geometry: unknown } | undefined,
  zoomCluster: boolean
): Promise<CityHit | { cluster: true; jobs: number; lngLat: [number, number] } | null> {
  if (!feature) return null
  const p = feature.properties
  const lngLat = (feature.geometry as { coordinates: [number, number] }).coordinates
  if (p.cluster) {
    if (zoomCluster) {
      const zoom = await (map.getSource('cities') as GeoJSONSource).getClusterExpansionZoom(p.cluster_id)
      map.easeTo({ center: lngLat, zoom })
    }
    return { cluster: true, jobs: p.jobs, lngLat }
  }
  return { country: p.c, slug: p.s, name: p.n, total: p.t, lngLat }
}
