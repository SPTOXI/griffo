'use client'

import { RotateCcw } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Language } from '@/lib/i18n'
import { contactEmail } from '@/lib/i18n/contact'
import { REFUND_COPY } from '@/lib/refunds/copy'

/**
 * A regra de reembolso na tela de compra (§2.163). Sem botão, por decisão do
 * operador: o pedido é feito pelo suporte e o admin o registra na aba
 * "Reembolsos". A regra continua escrita aqui, à vista de quem compra.
 */
export function RefundSection({ lang }: { lang: Language }) {
  const c = REFUND_COPY[lang] ?? REFUND_COPY.en
  const email = contactEmail(lang)
  const [before, after = ''] = c.requestHow.split('{email}')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="h-4 w-4 text-primary" /> {c.title}
        </CardTitle>
        <CardDescription className="leading-relaxed">{c.policy}</CardDescription>
        <CardDescription className="leading-relaxed">
          {before}
          <a href={`mailto:${email}`} className="font-semibold text-primary underline">
            {email}
          </a>
          {after}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
