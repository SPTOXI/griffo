'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Loader2, ShoppingBag, Sparkles, Building2, Layers, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'
import { salesMailto } from '@/lib/i18n/contact'
import { useAnalyses, startCheckout, type CheckoutSku } from '@/hooks/use-analyses'

/**
 * A tela de compra.
 *
 * Vendia quatro pacotes lado a lado, com preço unitário, tabela de consumo por
 * ação e um guia explicando qual ferramenta custava quanto. Nada disso existe:
 * há um produto, um preço, um botão.
 *
 * Duas opções lado a lado: a Análise Completa avulsa e o Passe Trimestral
 * (5 análises + 90 dias, pagamento único). O pacote de 5 saiu em set/2026 —
 * o trimestral entrega o mesmo e mais, por menos.
 */
export function PlansView() {
  const { t, lang } = useI18n()
  const { balance, pass, pricing, ledger, loading, refresh } = useAnalyses()
  const [buying, setBuying] = useState<string | null>(null)

  const handleBuy = async (sku: CheckoutSku) => {
    setBuying(sku)
    const result = await startCheckout(sku)
    if (!result.ok) {
      toast.error(result.error)
      setBuying(null)
      await refresh()
    }
    // Em caso de sucesso a navegação já saiu daqui: nada a reabilitar.
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const localPayment = pricing
    ? t.pricing.localPayment
        .replace('{currency}', pricing.currency)
        .replace('{methods}', pricing.paymentMethods.join(` ${t.pricing.conjunctionOr} `))
    : ''

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> {t.pricing.productTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.pricing.productDesc}</p>
        </div>

        <div className="bg-gradient-to-r from-brand-navy to-primary rounded-2xl px-5 py-3.5 text-white flex items-center gap-4 shadow-md">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {t.app.balance}
            </p>
            <p className="text-2xl font-extrabold flex items-baseline gap-1.5">
              {balance} <span className="text-sm font-normal text-blue-100">{t.app.balanceUnit}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* O PRODUTO */}
        <Card className="lg:col-span-2 border-2 border-primary shadow-lg bg-white">
          <CardHeader className="pb-3">
            <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10 text-[11px] font-bold">
              {t.pricing.badge}
            </Badge>
            <CardTitle className="text-xl text-slate-900 pt-1">{t.pricing.singleTitle}</CardTitle>
            <CardDescription className="text-xs">{t.pricing.singleDesc}</CardDescription>
            <CardDescription className="text-xs">{t.pricing.oneTime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">
                  {pricing?.single.formatted ?? '—'}
                </span>
                <span className="text-sm text-slate-500">/ {t.pricing.productTitle.toLowerCase()}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{t.pricing.currencyFollowsAccess}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.pricing.includesTitle}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                {t.pricing.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => handleBuy('single')}
              disabled={buying !== null}
              className="w-full h-auto min-h-11 py-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-md whitespace-normal"
            >
              {buying === 'single' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2" />
              )}
              {t.pricing.buyCta} — {pricing?.single.formatted ?? ''}
            </Button>

            {localPayment && <p className="text-[11px] text-slate-500 text-center">{localPayment}</p>}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* PASSE TRIMESTRAL — opção de entrada, ao lado do avulso */}
          {pricing && (
            <Card className="border-2 border-amber-300 bg-gradient-to-b from-amber-50/60 via-white to-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Layers className="w-4 h-4 text-amber-600" /> {t.pricing.packTitle}
                </CardTitle>
                <CardDescription className="text-xs">{t.pricing.packDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{pricing.quarterly.formatted}</p>
                  <p className="text-[11px] font-semibold text-amber-700">
                    {t.pricing.packPerAnalysis.replace(
                      '{price}',
                      pricing.quarterly.perAnalysisFormatted || ''
                    )}
                  </p>
                </div>
                {pass.active && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {t.pricing.passActive.replace('{days}', String(pass.daysLeft))}
                  </p>
                )}
                <Button
                  onClick={() => handleBuy('quarterly')}
                  disabled={buying !== null}
                  className="w-full h-auto min-h-10 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 whitespace-normal"
                >
                  {buying === 'quarterly' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                  )}
                  {t.pricing.packCta.replace('{price}', pricing.quarterly.formatted)}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* EMPRESAS — sem autosserviço, por decisão */}
          <Card className="bg-slate-900 text-white border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <Building2 className="w-4 h-4 text-blue-300" /> {t.pricing.businessTitle}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                {t.pricing.businessDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Mesmo link que a landing pública ganhou no §2.105 — esta é
                  uma segunda cópia do card, e tinha ficado sem o botão
                  quando a outra foi atualizada. */}
              <Button
                asChild
                variant="ghost"
                className="w-full h-9 text-xs font-semibold text-blue-300 hover:text-blue-200 hover:bg-white/10"
              >
                <a href="/market-pulse">
                  {t.pricing.businessDataCta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-10 text-xs font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <a href={salesMailto(lang)}>
                  {t.pricing.businessCta}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EXTRATO */}
      {ledger.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.pricing.historyTitle}</CardTitle>
            <CardDescription>{t.pricing.historyDesc}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">{t.pricing.colDate}</th>
                    <th className="px-4 py-3">{t.pricing.colDesc}</th>
                    <th className="px-4 py-3">{t.pricing.colAmount}</th>
                    <th className="px-4 py-3">{t.pricing.colAnalyses}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(entry.createdAt).toLocaleString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{entry.description}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {entry.amountLocal != null && entry.currency
                          ? `${entry.currency} ${entry.amountLocal.toFixed(2)}`
                          : '—'}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          entry.delta > 0 ? 'text-emerald-600' : 'text-slate-600'
                        }`}
                      >
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
