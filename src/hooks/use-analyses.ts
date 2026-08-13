'use client'

import { useCallback, useEffect, useState } from 'react'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Saldo de análises e o preço desta pessoa, num lugar só.
 *
 * O preço vem do servidor de propósito. O componente PODERIA calcular a partir
 * do catálogo e do país detectado no navegador — o catálogo é client-safe —,
 * mas o país do navegador é palpite: quem já comprou tem faixa definida pelo
 * país do meio de pagamento, e só o servidor sabe disso. Deixar o cliente
 * calcular faria a tela mostrar um preço e o checkout cobrar outro.
 */

export interface PriceOption {
  amount: number
  formatted: string
  analyses?: number
  perAnalysisFormatted?: string
}

export interface AnalysisPricing {
  tier: number
  country: string
  countrySource: 'payment' | 'edge' | 'default'
  currency: string
  paymentMethods: string[]
  single: PriceOption
  pack5: PriceOption
}

export interface LedgerEntry {
  id: string
  type: string
  delta: number
  description: string
  tier: number | null
  currency: string | null
  amountLocal: number | null
  createdAt: string
}

export interface AnalysesState {
  balance: number
  freePreviewUsed: boolean
  hasPurchased: boolean
  pricing: AnalysisPricing | null
  ledger: LedgerEntry[]
  loading: boolean
  refresh: () => Promise<void>
}

/** Ações que mudam o saldo sem trocar de tela avisam por este evento. */
export const BALANCE_CHANGED_EVENT = 'griffo:analyses-changed'

export function notifyBalanceChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BALANCE_CHANGED_EVENT))
}

export function useAnalyses(): AnalysesState {
  const [state, setState] = useState<Omit<AnalysesState, 'refresh'>>({
    balance: 0,
    freePreviewUsed: false,
    hasPurchased: false,
    pricing: null,
    ledger: [],
    loading: true,
  })

  const refresh = useCallback(async () => {
    try {
      const res = await internalFetch('/api/analyses/balance')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'falha')
      setState({
        balance: typeof data.balance === 'number' ? data.balance : 0,
        freePreviewUsed: Boolean(data.freePreviewUsed),
        hasPurchased: Boolean(data.hasPurchased),
        pricing: data.pricing ?? null,
        ledger: Array.isArray(data.ledger) ? data.ledger : [],
        loading: false,
      })
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    // A leitura inicial sai do corpo do efeito para depois do primeiro render:
    // `refresh` escreve estado, e chamá-la aqui de forma síncrona encadearia um
    // render em cima do outro. O assinante do evento é registrado na hora — é
    // ele quem mantém o saldo em dia sem que ninguém troque de tela.
    queueMicrotask(() => void refresh())
    window.addEventListener(BALANCE_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BALANCE_CHANGED_EVENT, refresh)
  }, [refresh])

  return { ...state, refresh }
}

/**
 * Manda para o checkout.
 *
 * `resumeId` é o que torna a recompra de um clique: o retorno do pagamento traz
 * o currículo junto, a tela reabre nele e a análise segue de onde parou — sem
 * passar pela página de preço e sem recadastrar cartão.
 */
export async function startCheckout(
  sku: 'single' | 'pack5',
  resumeId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await internalFetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, resumeId: resumeId || undefined }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data?.error || 'Não foi possível iniciar a compra.' }
    if (data.checkoutUrl) {
      window.location.assign(data.checkoutUrl)
      return { ok: true }
    }
    return { ok: false, error: 'Checkout indisponível no momento.' }
  } catch {
    return { ok: false, error: 'Falha de conexão ao iniciar a compra.' }
  }
}
