'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import type { FunnelStepSummary } from '@/lib/analytics/funnel'

const PERIODS = [7, 30, 90] as const

interface EmailStat {
  step: string
  sent: number
  clicked: number
}

const EMAIL_LABEL: Record<string, string> = {
  result: 'Resultado',
  nurture1: 'Dia 1 · problema principal',
  nurture2: 'Dia 3 · vagas novas',
  nurture3: 'Dia 7 · último lembrete',
}

export function FunnelCard() {
  const [days, setDays] = useState<number>(30)
  const [steps, setSteps] = useState<FunnelStepSummary[] | null>(null)
  const [error, setError] = useState(false)
  const [emails, setEmails] = useState<EmailStat[] | null>(null)

  useEffect(() => {
    let alive = true
    setSteps(null)
    setError(false)
    internalFetch(`/api/admin/funnel?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return
        setSteps(d.steps)
        setEmails(d.emails ?? null)
      })
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
        {emails && emails.some((e) => e.sent > 0) && (
          <div className="pt-3 mt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-1">E-mails do envio sem conta (enviados → cliques)</p>
            {emails.map((e) => (
              <div key={e.step} className="flex justify-between text-xs text-slate-600">
                <span>{EMAIL_LABEL[e.step] ?? e.step}</span>
                <span className="font-mono">
                  {e.sent} → {e.clicked}
                  {e.sent > 0 && <span className="text-slate-400"> · {Math.round((e.clicked / e.sent) * 100)}%</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400 pt-2">
          Eventos novos (teste ATS, cadastro, upload, prévia, preço visto, compra) só existem a partir desta versão.
        </p>
      </CardContent>
    </Card>
  )
}
