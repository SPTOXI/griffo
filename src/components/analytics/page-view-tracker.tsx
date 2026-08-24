'use client'

import { useEffect } from 'react'

export function PageViewTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Cria ou recupera visitorId anônimo
      let visitorId = localStorage.getItem('gw_visitor_id')
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
        localStorage.setItem('gw_visitor_id', visitorId)
      }

      // Registra uma visita por sessão (usando sessionStorage para evitar duplicar em cada reload rápido)
      const sessionKey = 'gw_pv_tracked'
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1')
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'page_view',
            visitorId,
            meta: {
              path: window.location.pathname,
              referrer: document.referrer || null,
              screen: `${window.innerWidth}x${window.innerHeight}`,
            },
          }),
        }).catch(() => {})
      }
    } catch {
      // Ignora erro em ambientes com cookies/storage bloqueados
    }
  }, [])

  return null
}
