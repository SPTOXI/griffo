'use client'

import type { ClientEvent } from '@/lib/analytics/funnel'

/** Mesmo identificador anônimo que `PageViewTracker` cria. */
export function getVisitorId(): string | undefined {
  try {
    let id = localStorage.getItem('gw_visitor_id')
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem('gw_visitor_id', id)
    }
    return id
  } catch {
    return undefined
  }
}

/**
 * Envia um evento de atenção uma vez por sessão do navegador.
 * `onceKey` separa, por exemplo, "viu o preço na landing" de "viu no paywall".
 */
export function trackOnce(
  event: ClientEvent,
  onceKey: string,
  meta: Record<string, string | number | boolean | null> = {}
): void {
  try {
    const key = `gw_evt_${event}_${onceKey}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, visitorId: getVisitorId(), meta: { where: onceKey, ...meta } }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // storage bloqueado: sem telemetria, sem erro
  }
}
