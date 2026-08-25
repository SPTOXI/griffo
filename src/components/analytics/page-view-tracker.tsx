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

      // Captura e armazena parâmetros UTM se presentes na URL
      const searchParams = new URLSearchParams(window.location.search)
      const utmSource = searchParams.get('utm_source')
      const utmMedium = searchParams.get('utm_medium')
      const utmCampaign = searchParams.get('utm_campaign')
      const utmContent = searchParams.get('utm_content')
      const utmTerm = searchParams.get('utm_term')

      if (utmSource || utmCampaign) {
        const utmObj = {
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          utm_content: utmContent || undefined,
          utm_term: utmTerm || undefined,
          capturedAt: new Date().toISOString(),
        }
        localStorage.setItem('gw_utms', JSON.stringify(utmObj))
      }

      // Registra uma visita por sessão (usando sessionStorage para evitar duplicar em cada reload rápido)
      const sessionKey = 'gw_pv_tracked'
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1')

        let savedUtms: any = {}
        try {
          savedUtms = JSON.parse(localStorage.getItem('gw_utms') || '{}')
        } catch {}

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
              ...savedUtms,
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

