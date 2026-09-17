'use client'

import { useEffect } from 'react'
import type { ClientEvent } from '@/lib/analytics/funnel'
import { trackOnce } from './track-client'

/** Dispara o evento quando o elemento `targetId` aparece na tela. */
export function TrackWhenVisible({
  targetId,
  event,
  onceKey,
}: {
  targetId: string
  event: ClientEvent
  onceKey: string
}) {
  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackOnce(event, onceKey)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [targetId, event, onceKey])
  return null
}
