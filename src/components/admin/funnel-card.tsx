'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import type { FunnelStepSummary } from '@/lib/analytics/funnel'

const PERIODS = [7, 30, 90] as const

export function FunnelCard() {
  const [days, setDays] = useState<number>(30)
  const [steps, setSteps] = useState<FunnelStepSummary[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setSteps(null)
    setError(false)
    internalFetch(`/api/admin/funnel?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setSteps(d.steps))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [days])

  const top = steps?.[0]?.people || 0

  return (
    <Card className="border-slate-200 lg:col-span-2">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#0B63E5]" /> Funil (pessoas distintas, sem robôs)
          </span>
          <span className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${days === p ? 'bg-[#0B63E5] text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {p}d
              </button>
            ))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {error && <p className="text-xs text-red-600">Não foi possível carregar o funil.</p>}
        {!steps && !error && <p className="text-xs text-slate-500">Carregando…</p>}
        {steps?.map((s) => (
          <div key={s.event} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">{s.label}</span>
              <span className="font-mono text-slate-800">
                {s.people}
                {s.fromPrevious !== null && <span className="text-slate-400"> · {s.fromPrevious}%</span>}
              </span>
            </div>
            <div className="h-2 rounded bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#0B63E5]" style={{ width: `${top ? Math.max(2, (s.people / top) * 100) : 0}%` }} />
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 pt-2">
          Eventos novos (teste ATS, cadastro, upload, prévia, preço visto, compra) só existem a partir desta versão.
        </p>
      </CardContent>
    </Card>
  )
}
