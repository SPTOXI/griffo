'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Loader2, ShoppingBag, Sparkles, Building2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'
import { useAnalyses, startCheckout } from '@/hooks/use-analyses'

/**
 * A tela de compra.
 *
 * Vendia quatro pacotes lado a lado, com preço unitário, tabela de consumo por
 * ação e um guia explicando qual ferramenta custava quanto. Nada disso existe:
 * há um produto, um preço, um botão.
 *
 * O pacote de 5 aparece SÓ depois da primeira compra — é upsell de recompra,
 * não opção de entrada. Mostrá-lo antes devolveria ao usuário exatamente a
 * decisão que a mudança de modelo eliminou.
 */
export function PlansView() {
  const { t } = useI18n()
  const { balance, hasPurchased, pricing, ledger, loading, refresh } = useAnalyses()
  const [buying, setBuying] = useState<string | null>(null)

  const handleBuy = async (sku: 'single' | 'pack5') => {
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
        .replace('{methods}', pricing.paymentMethods.join(' ou '))
    : ''

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0B63E5]" /> {t.pricing.productTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.pricing.productDesc}</p>
        </div>

        <div className="bg-gradient-to-r from-[#0B192E] to-[#0B63E5] rounded-2xl px-5 py-3.5 text-white flex items-center gap-4 shadow-md">
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
        <Card className="lg:col-span-2 border-2 border-[#0B63E5] shadow-lg bg-white">
          <CardHeader className="pb-3">
            <Badge className="w-fit bg-blue-50 text-[#0B63E5] hover:bg-blue-50 text-[11px] font-bold">
              {t.pricing.badge}
            </Badge>
            <CardTitle className="text-xl text-slate-900 pt-1">{t.pricing.productTitle}</CardTitle>
            <CardDescription className="text-xs">{t.pricing.oneTime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">
                {pricing?.single.formatted ?? '—'}
              </span>
              <span className="text-sm text-slate-500">/ {t.pricing.productTitle.toLowerCase()}</span>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.pricing.includesTitle}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                {t.pricing.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => handleBuy('single')}
              disabled={buying !== null}
              className="w-full h-11 text-sm font-bold bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md"
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
          {/* UPSELL — só depois da primeira compra */}
          {hasPurchased && pricing && (
            <Card className="border-2 border-amber-300 bg-gradient-to-b from-amber-50/60 via-white to-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Layers className="w-4 h-4 text-amber-600" /> {t.pricing.packTitle}
                </CardTitle>
                <CardDescription className="text-xs">{t.pricing.packDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{pricing.pack5.formatted}</p>
                  <p className="text-[11px] font-semibold text-amber-700">
                    {t.pricing.packPerAnalysis.replace(
                      '{price}',
                      pricing.pack5.perAnalysisFormatted || ''
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => handleBuy('pack5')}
                  disabled={buying !== null}
                  className="w-full h-10 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  {buying === 'pack5' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                  )}
                  {t.pricing.packCta.replace('{price}', pricing.pack5.formatted)}
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
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full h-10 text-xs font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <a href="mailto:comercial@griffo.work?subject=Griffo%20para%20empresas">
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
            <CardTitle className="text-base">Histórico</CardTitle>
            <CardDescription>Compras e análises liberadas na sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Valor pago</th>
                    <th className="px-4 py-3">Análises</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
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
