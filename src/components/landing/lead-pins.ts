'use client'

import type { ResultMapPin } from '@/lib/match-preview/result'

/**
 * Ponte entre o envio de currículo (`match-hero.tsx`) e o mapa da home
 * (`home-jobs-map.tsx`), que são seções separadas da página. Arquivo próprio
 * para o formulário não carregar nada do mapa.
 */

/** O resultado do envio chega ao mapa por aqui. */
export const LEAD_PINS_EVENT = 'griffo:lead-pins'
/** Clique em "desbloquear" num cadeado do mapa; o envio leva ao cadastro. */
export const LEAD_UNLOCK_EVENT = 'griffo:lead-unlock'

declare global {
  interface Window {
    __griffoLeadPins?: ResultMapPin[]
  }
}

/** Publica os pontos do resultado, para o mapa que já existe e para o que ainda vai montar. */
export function publishLeadPins(pins: ResultMapPin[]) {
  window.__griffoLeadPins = pins
  window.dispatchEvent(new CustomEvent(LEAD_PINS_EVENT, { detail: pins }))
}
