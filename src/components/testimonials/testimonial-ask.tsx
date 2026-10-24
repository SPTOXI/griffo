'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquareQuote } from 'lucide-react'
import { testimonialCopy } from '@/lib/testimonials/copy'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Pedido de depoimento, no fim do relatório pago. O servidor confere se a
 * pessoa comprou e exige o consentimento; o depoimento só aparece no site
 * depois de aprovado no painel.
 */
export function TestimonialAsk({ lang }: { lang: string }) {
  const c = testimonialCopy(lang)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [role, setRole] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const canSend = text.trim().length >= 20 && name.trim().length >= 2 && consent && state !== 'sending'

  const send = async () => {
    setState('sending')
    try {
      const r = await internalFetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          displayName: name.trim(),
          city: city.trim() || undefined,
          role: role.trim() || undefined,
          lang,
          consent: true,
        }),
      })
      setState(r.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-[#0B63E5]" />
          <div>
            <p className="font-semibold text-[#0B192E]">{c.askTitle}</p>
            <p className="text-sm text-slate-600">{c.askText}</p>
          </div>
        </div>
        {state === 'done' ? (
          <p className="text-sm font-semibold text-emerald-700">{c.thanks}</p>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder={c.textPlaceholder}
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                {c.nameLabel}
                <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder={c.namePlaceholder} className="h-9 rounded-md border border-slate-300 px-2 text-sm font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                {c.cityLabel}
                <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 60))} className="h-9 rounded-md border border-slate-300 px-2 text-sm font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                {c.roleLabel}
                <input value={role} onChange={(e) => setRole(e.target.value.slice(0, 80))} className="h-9 rounded-md border border-slate-300 px-2 text-sm font-normal" />
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0B63E5]" />
              {c.consent}
            </label>
            {state === 'error' && <p className="text-sm text-red-600">{c.error}</p>}
            <Button size="sm" onClick={send} disabled={!canSend} className="bg-[#0B63E5] hover:bg-[#0052CC]">
              {state === 'sending' && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
              {c.submit}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
