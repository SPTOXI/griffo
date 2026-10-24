'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'

/** Moderação dos depoimentos: nada aparece na página inicial sem aprovação aqui. */

interface Row {
  id: string
  displayName: string
  city: string | null
  role: string | null
  lang: string
  text: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const STATUS: Record<Row['status'], { label: string; className: string }> = {
  pending: { label: 'Aguardando', className: 'border-amber-300 bg-amber-50 text-amber-800' },
  approved: { label: 'Aprovado', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  rejected: { label: 'Recusado', className: 'border-slate-300 bg-slate-50 text-slate-600' },
}

export function TestimonialsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await internalFetch('/api/admin/testimonials', { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setRows((await r.json()).testimonials)
    } catch (e: any) {
      toast.error(`Não consegui carregar os depoimentos: ${e?.message || e}`)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: string, status: Row['status']) => {
    const r = await internalFetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!r.ok) return toast.error('Não salvou.')
    load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depoimentos</CardTitle>
        <CardDescription>
          Enviados por quem comprou a análise, com consentimento para publicar nome e cidade. A seção da página inicial
          aparece quando houver pelo menos 3 aprovados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows && rows.length === 0 && <p className="text-sm text-slate-500">Nenhum depoimento ainda.</p>}
        {rows?.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{t.displayName}</span>
              <span className="text-slate-500">{[t.role, t.city, t.lang.toUpperCase()].filter(Boolean).join(' · ')}</span>
              <Badge variant="outline" className={STATUS[t.status].className}>{STATUS[t.status].label}</Badge>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.text}</p>
            <div className="flex gap-2">
              {t.status !== 'approved' && (
                <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'approved')}>Aprovar</Button>
              )}
              {t.status !== 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'rejected')}>Recusar</Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
