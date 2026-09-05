'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'
import { useAnalyses, startCheckout } from '@/hooks/use-analyses'

/**
 * O upsell do pacote de 5.
 *
 * Renderiza APENAS dentro do resultado, e apenas depois da primeira compra —
 * nunca na landing, nunca antes de comprar. `hasPurchased` vem do servidor, que
 * também recusa o SKU do pacote a quem nunca comprou: a regra não pode morar só
 * na renderização.
 *
 * A recompra é de um clique e não passa pela página de preço: o `resumeId` vai
 * junto e o retorno do pagamento reabre este mesmo laudo.
 */
export function RepurchaseUpsell({ resumeId }: { resumeId: string }) {
  const { t } = useI18n()
  const { hasPurchased, pricing, refresh } = useAnalyses()
  const [buying, setBuying] = useState(false)
  const trackedRef = useRef(false)

  useEffect(() => {
    if (hasPurchased && pricing && !trackedRef.current) {
      trackedRef.current = true
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'upsell_viewed',
          sku: 'pack5',
          meta: { resumeId },
        }),
      }).catch(() => {})
    }
  }, [hasPurchased, pricing, resumeId])

  if (!hasPurchased || !pricing) return null

  const handleBuy = async () => {
    setBuying(true)
    const result = await startCheckout('pack5', resumeId)
    if (!result.ok) {
      toast.error(result.error)
      setBuying(false)
      await refresh()
    }
  }

  return (
    <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50/70 via-white to-white shadow-md">
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{t.pricing.packTitle}</p>
            <p className="text-xs text-slate-600 mt-0.5 max-w-md leading-relaxed">
              {t.pricing.packDesc}
            </p>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">
              {t.pricing.packPerAnalysis.replace('{price}', pricing.pack5.perAnalysisFormatted || '')}
            </p>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          disabled={buying}
          className="h-auto min-h-10 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0 whitespace-normal"
        >
          {buying ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <ShoppingBag className="w-4 h-4 mr-1.5" />
          )}
          {t.pricing.packCta.replace('{price}', pricing.pack5.formatted)}
        </Button>
      </CardContent>
    </Card>
  )
}
