'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2, Lock, ShoppingBag, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'
import { useI18n } from '@/context/i18n-context'
import { useAnalyses, startCheckout } from '@/hooks/use-analyses'

/**
 * O paywall: a nota de graça, o diagnóstico só depois de pagar.
 *
 * A prévia mostra as oito notas e nada mais — sem justificativa, sem
 * recomendação, sem texto. É deliberado: quem lê o porquê já recebeu o produto.
 * O que a pessoa vê é o número, e o número é o que faz ela querer o resto.
 *
 * Quando já existe saldo, não há paywall nenhum — o botão libera na hora, sem
 * passar pelo checkout. É esse caminho que torna a recompra de um clique útil:
 * quem comprou o pacote de 5 destrava o currículo seguinte sem sair da tela.
 */

interface PreviewDimension {
  key: string
  label: string
  score: number
}

interface Preview {
  overall: number
  dimensions: PreviewDimension[]
}

interface AnalysisPaywallProps {
  resumeId: string
  preview: Preview | null
  /** Chamado quando o currículo é liberado: a tela troca para o laudo. */
  onUnlocked: () => void
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-600'
  if (score >= 6) return 'text-amber-600'
  return 'text-rose-600'
}

export function AnalysisPaywall({ resumeId, preview: initialPreview, onUnlocked }: AnalysisPaywallProps) {
  const { t } = useI18n()
  const { balance, pricing, loading: loadingBalance, refresh } = useAnalyses()
  const [preview, setPreview] = useState<Preview | null>(initialPreview)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (preview || loadingPreview) return

    let active = true

    // Fora do corpo do efeito: a primeira escrita de estado encadearia um
    // render em cima do outro se acontecesse de forma síncrona aqui.
    queueMicrotask(() => {
      if (!active) return
      setLoadingPreview(true)
      internalFetch('/api/resume/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null)
          if (!active) return
          if (res.ok && data?.preview) setPreview(data.preview)
          else setPreviewError(data?.error || 'Não foi possível calcular sua prévia agora.')
        })
        .catch(() => active && setPreviewError('Falha de conexão ao calcular sua prévia.'))
        .finally(() => active && setLoadingPreview(false))
    })

    return () => {
      active = false
    }
    // Uma vez por currículo: a prévia é gravada no banco e as chamadas seguintes
    // leem a mesma, mas nem por isso vale disparar a cada render.
  }, [resumeId, preview, loadingPreview])

  /**
   * Com saldo, libera direto. Sem saldo, vai ao checkout levando o `resumeId`
   * — o retorno do pagamento reabre exatamente este currículo.
   */
  const handleUnlock = async () => {
    setUnlocking(true)

    if (balance > 0) {
      // Quem consome o saldo é a rota de análise, não esta tela. O aviso de
      // saldo alterado sai de lá, depois da confirmação — avisar aqui releria
      // o número antigo.
      onUnlocked()
      setUnlocking(false)
      return
    }

    const result = await startCheckout('single', resumeId)
    if (!result.ok) {
      toast.error(result.error)
      setUnlocking(false)
      await refresh()
    }
  }

  const localPayment = pricing
    ? t.pricing.localPayment
        .replace('{currency}', pricing.currency)
        .replace('{methods}', pricing.paymentMethods.join(' ou '))
    : ''

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Laudo de análise</h1>

      {/* PRÉVIA GRATUITA — só as notas */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <Badge variant="outline" className="w-fit border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-bold">
            {t.pricing.previewTitle}
          </Badge>
          <CardTitle className="text-lg text-slate-900 pt-1">Suas notas nas 8 dimensões</CardTitle>
          <CardDescription className="text-xs">
            A nota é gratuita. O diagnóstico — o que está errado, por quê e como corrigir — vem na
            Análise Completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPreview && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Calculando suas notas...</p>
            </div>
          )}

          {previewError && !preview && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <>
              <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                <span className={`text-4xl font-black ${scoreColor(preview.overall)}`}>
                  {preview.overall.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">/ 10 — nota geral</span>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {preview.dimensions.map((dim) => (
                  <li key={dim.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-700 truncate">{dim.label}</span>
                    <span className={`font-bold font-mono ${scoreColor(dim.score)}`}>
                      {dim.score.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  O que cada nota significa, o que derrubou a sua e a lista do que mudar está no
                  laudo completo.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* O PRODUTO */}
      <Card className="border-2 border-[#0B63E5] shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0B63E5]" /> {t.pricing.productTitle}
          </CardTitle>
          <CardDescription className="text-xs">{t.pricing.oneTime}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
            {t.pricing.items.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUnlock}
            disabled={unlocking || loadingBalance}
            className="w-full h-11 text-sm font-bold bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md"
          >
            {unlocking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShoppingBag className="w-4 h-4 mr-2" />
            )}
            {balance > 0
              ? `Liberar Análise Completa (${balance} ${balance === 1 ? 'disponível' : 'disponíveis'})`
              : `${t.pricing.buyCta} — ${pricing?.single.formatted ?? ''}`}
          </Button>

          {balance === 0 && localPayment && (
            <p className="text-[11px] text-slate-500 text-center">{localPayment}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
