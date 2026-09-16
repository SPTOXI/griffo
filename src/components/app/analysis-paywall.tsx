'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2, Lock, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react'
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
 * quem comprou o Passe Trimestral destrava o currículo seguinte sem sair da tela.
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

  /**
   * Busca a prévia.
   *
   * Normalmente ela JÁ chega pronta: a tela de envio a calcula enquanto a
   * animação está no ar, e o resultado fica gravado no currículo. Isto aqui é o
   * caminho de exceção — currículo antigo, ou a tentativa de lá tendo falhado.
   *
   * O prazo é do cliente e menor que o teto da função: sem isso, a espera
   * terminaria num 504 do navegador, que para quem olha é indistinguível de
   * queda de rede.
   */
  const fetchPreview = useCallback(async () => {
    setLoadingPreview(true)
    setPreviewError(null)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 55_000)

    try {
      const res = await internalFetch('/api/resume/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
        signal: controller.signal,
      })
      const data = await res.json().catch(() => null)

      if (res.ok && data?.preview) setPreview(data.preview)
      else setPreviewError(data?.error || 'Não foi possível calcular sua prévia agora.')
    } catch {
      setPreviewError('A prévia demorou mais que o esperado. O currículo está salvo — tente de novo.')
    } finally {
      clearTimeout(timer)
      setLoadingPreview(false)
    }
  }, [resumeId])

  useEffect(() => {
    if (preview || loadingPreview || previewError) return

    // Fora do corpo do efeito: a primeira escrita de estado encadearia um
    // render em cima do outro se acontecesse de forma síncrona aqui.
    queueMicrotask(() => { void fetchPreview() })
    // Uma vez por currículo. `previewError` na lista impede o reenvio automático
    // depois de uma falha: repetir sozinho gastaria chamada atrás de chamada
    // sem que ninguém pedisse, e a decisão de tentar de novo é de quem está
    // olhando.
  }, [preview, loadingPreview, previewError, fetchPreview])

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

  /**
   * Passe Trimestral a partir do paywall. Volta com 5 análises no saldo: o
   * botão principal passa a liberar este currículo com um clique — gastar uma
   * delas automaticamente seria decidir pela pessoa.
   */
  const [buyingQuarterly, setBuyingQuarterly] = useState(false)
  const handleQuarterly = async () => {
    setBuyingQuarterly(true)
    const result = await startCheckout('quarterly', resumeId)
    if (!result.ok) {
      toast.error(result.error)
      setBuyingQuarterly(false)
      await refresh()
    }
  }

  const localPayment = pricing
    ? t.pricing.localPayment
        .replace('{currency}', pricing.currency)
        .replace('{methods}', pricing.paymentMethods.join(` ${t.pricing.conjunctionOr} `))
    : ''

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{t.analysisPaywall.reportTitle}</h1>

      {/* PRÉVIA GRATUITA — só as notas */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <Badge variant="outline" className="w-fit border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-bold">
            {t.pricing.previewTitle}
          </Badge>
          <CardTitle className="text-lg text-slate-900 pt-1">{t.analysisPaywall.cardTitle}</CardTitle>
          <CardDescription className="text-xs">
            {t.analysisPaywall.cardDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPreview && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">{t.analysisPaywall.calculating}</p>
            </div>
          )}

          {previewError && !preview && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-300">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="space-y-2">
                <p className="text-sm text-rose-900">{previewError}</p>
                {/* Um erro sem saída faz a pessoa ir embora achando que o
                    produto não funciona. Seu currículo está salvo; falta só a
                    nota, e repetir custa um clique. */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void fetchPreview()}
                  disabled={loadingPreview}
                  className="bg-white"
                >
                  {loadingPreview
                    ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                  {t.analysisPaywall.retryCalculate}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {preview && (
            <>
              <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                <span className={`text-4xl font-black ${scoreColor(preview.overall)}`}>
                  {preview.overall.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">{t.analysisPaywall.scoreOutOfTen}</span>
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
                  {t.analysisPaywall.lockNote}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* O PRODUTO */}
      <Card className="border-2 border-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {t.pricing.singleTitle}
          </CardTitle>
          <CardDescription className="text-xs">{t.pricing.singleDesc}</CardDescription>
          <CardDescription className="text-xs">{t.pricing.oneTime}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
            {t.pricing.items.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUnlock}
            disabled={unlocking || loadingBalance}
            className="w-full h-auto min-h-11 py-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-md whitespace-normal"
          >
            {unlocking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShoppingBag className="w-4 h-4 mr-2" />
            )}
            {balance > 0
              ? t.analysisPaywall.unlockAvailable.replace('{count}', String(balance))
              : `${t.pricing.buyCta} — ${pricing?.single.formatted ?? ''}`}
          </Button>

          {balance === 0 && pricing && (
            <Button
              onClick={handleQuarterly}
              disabled={buyingQuarterly || unlocking || loadingBalance}
              variant="outline"
              className="w-full h-auto min-h-10 py-1.5 text-xs font-bold border-amber-300 bg-amber-50 text-slate-900 hover:bg-amber-100 whitespace-normal"
            >
              {buyingQuarterly ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {t.pricing.packCta.replace('{price}', pricing.quarterly.formatted)}
              {' · '}
              {t.pricing.packPerAnalysis.replace('{price}', pricing.quarterly.perAnalysisFormatted || '')}
            </Button>
          )}

          {balance === 0 && localPayment && (
            <p className="text-[11px] text-slate-500 text-center">{localPayment}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
