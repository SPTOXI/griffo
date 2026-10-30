'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { internalFetch } from '@/lib/internal-fetch'
import { localeForLang, type Language } from '@/lib/i18n'
import { REFUND_COPY } from '@/lib/refunds/copy'

interface Purchase {
  paymentRef: string
  purchasedAt: string
  quantity: number
  currency: string | null
  amountLocal: number | null
  eligibility: 'unused' | 'failure' | 'outside_rules'
  request: { status: string; createdAt: string } | null
}

/**
 * Reembolso na tela de planos (§2.163): a regra escrita e, por compra dos
 * últimos 30 dias, o que ela diz e o botão de pedir. Quem decide é o admin.
 */
export function RefundSection({ lang }: { lang: Language }) {
  const c = REFUND_COPY[lang] ?? REFUND_COPY.en
  const locale = localeForLang(lang)
  const [purchases, setPurchases] = useState<Purchase[] | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await internalFetch('/api/refunds', { cache: 'no-store' })
      if (r.ok) setPurchases((await r.json()).purchases)
    } catch {
      setPurchases([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const request = async (ref: string) => {
    setSending(ref)
    try {
      const r = await internalFetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentRef: ref, reason: reasons[ref]?.trim() || undefined }),
      })
      if (!r.ok) return toast.error(c.error)
      toast.success(c.sent)
      load()
    } catch {
      toast.error(c.error)
    } finally {
      setSending(null)
    }
  }

  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso))
  const money = (p: Purchase) => {
    if (p.amountLocal == null || !p.currency) return null
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amountLocal)
    } catch {
      return `${p.currency.toUpperCase()} ${p.amountLocal}`
    }
  }
  const label = { unused: c.eligibleUnused, failure: c.eligibleFailure, outside_rules: c.outsideRules }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="h-4 w-4 text-primary" /> {c.title}
        </CardTitle>
        <CardDescription className="leading-relaxed">{c.policy}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchases?.length === 0 && <p className="text-sm text-slate-500">{c.none}</p>}
        {purchases?.map((p) => (
          <div key={p.paymentRef} className="rounded-lg border border-slate-200 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              {[date(p.purchasedAt), money(p)].filter(Boolean).join(' · ')}
            </p>
            <p className={`text-xs font-medium ${p.eligibility === 'outside_rules' ? 'text-slate-500' : 'text-emerald-700'}`}>
              {label[p.eligibility]}
            </p>
            {p.request ? (
              <p className="text-sm text-slate-700">
                {p.request.status === 'refunded'
                  ? c.refunded
                  : p.request.status === 'rejected'
                    ? c.rejected
                    : c.requested.replace('{date}', date(p.request.createdAt))}
              </p>
            ) : p.eligibility === 'outside_rules' ? (
              // Regra do operador: só pede reembolso quem não teve o serviço executado.
              <p className="text-xs text-slate-500">{c.outsideHint}</p>
            ) : (
              <>
                <textarea
                  value={reasons[p.paymentRef] ?? ''}
                  onChange={(e) => setReasons((s) => ({ ...s, [p.paymentRef]: e.target.value.slice(0, 1000) }))}
                  placeholder={c.reasonPlaceholder}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                />
                <Button size="sm" variant="outline" disabled={sending !== null} onClick={() => request(p.paymentRef)}>
                  {c.requestCta}
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
