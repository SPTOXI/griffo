'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { internalFetch } from '@/lib/internal-fetch'
import { timeLeft } from '@/lib/refunds/rules'

/**
 * Fila de reembolsos (§2.163). Regra do operador: até 7 dias com a análise não
 * usada, ou falha de entrega; devolver em até 24 h. O botão "Reembolsar"
 * devolve pela Stripe na hora — não há volta.
 */

interface Row {
  id: string
  source: 'support' | 'auto_failure'
  eligibility: 'unused' | 'failure' | 'outside_rules'
  reason: string | null
  quantity: number
  currency: string | null
  amountLocal: number | null
  status: 'pending' | 'refunded' | 'rejected'
  dueAt: string
  createdAt: string
  adminNote: string | null
  analysisReadyNow: boolean | null
  user: { email: string; name: string | null }
}

const ELIGIBILITY: Record<Row['eligibility'], { label: string; className: string }> = {
  unused: { label: 'Dentro da regra: 7 dias, não usada', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  failure: { label: 'Dentro da regra: não entregue', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  outside_rules: { label: 'Fora da regra', className: 'border-amber-300 bg-amber-50 text-amber-800' },
}

const STATUS: Record<Row['status'], string> = { pending: 'Pendente', refunded: 'Reembolsado', rejected: 'Recusado' }

export function RefundsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [regEmail, setRegEmail] = useState('')
  const [regReason, setRegReason] = useState('')
  const [registering, setRegistering] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await internalFetch('/api/admin/refunds', { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setRows((await r.json()).refunds)
    } catch (e: any) {
      toast.error(`Não consegui carregar os reembolsos: ${e?.message || e}`)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const register = async () => {
    setRegistering(true)
    try {
      const r = await internalFetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, reason: regReason || undefined }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return toast.error(data.error || 'Não deu certo.')
      if (!data.found) return toast.error('Nenhuma conta com esse e-mail.')
      if (data.opened > 0) {
        toast.success(`${data.opened} pedido${data.opened > 1 ? 's' : ''} aberto${data.opened > 1 ? 's' : ''}.`)
        setRegEmail('')
        setRegReason('')
      } else if (data.items.length === 0) {
        toast.error('Sem compra paga nos últimos 7 dias: fora do prazo de reembolso.')
      } else {
        toast.error(
          data.items.some((i: any) => i.already)
            ? 'Essa compra já tem pedido registrado.'
            : 'A compra está fora da regra: a análise já foi usada e entregue.'
        )
      }
      load()
    } finally {
      setRegistering(false)
    }
  }

  const decide = async (id: string, action: 'refund' | 'reject') => {
    if (action === 'refund' && !window.confirm('Devolver o dinheiro pela Stripe agora? Não há como desfazer.')) return
    setBusy(id)
    try {
      const r = await internalFetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: notes[id] }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.ok) return toast.error(data.error || 'Não deu certo.')
      toast.success(action === 'refund' ? 'Reembolso feito na Stripe.' : 'Pedido recusado.')
      load()
    } finally {
      setBusy(null)
    }
  }

  const pending = rows?.filter((r) => r.status === 'pending').length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reembolsos {pending > 0 && <Badge className="ms-2 bg-red-600">{pending} pendente{pending > 1 ? 's' : ''}</Badge>}</CardTitle>
        <CardDescription>
          Regra: só se o serviço não foi executado e só até 7 dias depois da compra — análise não usada, ou paga e não
          entregue (o sistema abre esse caso sozinho e avisa por e-mail). Não há botão para o cliente: o pedido chega pelo
          suporte e você o registra abaixo. O prazo para devolver é de 24 h; o e-mail de lembrete sai 4 h antes do fim
          (endereço em Configurações → ADMIN_ALERT_EMAIL).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
          <p className="text-sm font-semibold">Registrar pedido que chegou pelo suporte</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="E-mail da conta do cliente"
              className="h-9 flex-1 rounded-md border border-slate-300 px-2.5 text-sm"
            />
            <input
              value={regReason}
              onChange={(e) => setRegReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="h-9 flex-1 rounded-md border border-slate-300 px-2.5 text-sm"
            />
            <Button size="sm" disabled={registering || !regEmail.trim()} onClick={register}>
              Registrar
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            O sistema procura as compras pagas dos últimos 7 dias dessa conta e só abre pedido para as que estão dentro da regra.
          </p>
        </div>
        {rows && rows.length === 0 && <p className="text-sm text-slate-500">Nenhum pedido de reembolso.</p>}
        {rows?.map((r) => {
          const left = timeLeft(new Date(r.dueAt))
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{r.user.email}</span>
                <Badge variant="outline" className={ELIGIBILITY[r.eligibility].className}>{ELIGIBILITY[r.eligibility].label}</Badge>
                <Badge variant="outline">{r.source === 'auto_failure' ? 'Aberto pelo sistema' : 'Pedido pelo suporte'}</Badge>
                <Badge variant="outline">{STATUS[r.status]}</Badge>
                {r.status === 'pending' && (
                  <span className={`text-xs font-bold ${left.overdue ? 'text-red-600' : left.hours < 4 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {left.overdue ? `Vencido há ${left.hours}h${left.minutes}min` : `Faltam ${left.hours}h${left.minutes}min`}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700">
                {r.amountLocal != null && r.currency ? `${r.currency.toUpperCase()} ${r.amountLocal.toFixed(2)}` : '—'} ·{' '}
                {r.quantity} análise{r.quantity > 1 ? 's' : ''} · pedido em {new Date(r.createdAt).toLocaleString('pt-BR')}
              </p>
              {r.reason && <p className="text-sm text-slate-700 whitespace-pre-wrap">Motivo: {r.reason}</p>}
              {r.analysisReadyNow && (
                <p className="text-xs font-semibold text-amber-700">
                  Atenção: a análise deste currículo ficou pronta depois que o caso abriu (a pessoa tentou de novo).
                </p>
              )}
              {r.adminNote && <p className="text-xs text-slate-500">Nota: {r.adminNote}</p>}
              {r.status === 'pending' && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={notes[r.id] ?? ''}
                    onChange={(e) => setNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                    placeholder="Nota interna (opcional)"
                    className="h-9 flex-1 rounded-md border border-slate-300 px-2.5 text-sm"
                  />
                  <Button size="sm" disabled={busy !== null} onClick={() => decide(r.id, 'refund')} className="bg-emerald-600 hover:bg-emerald-700">
                    Reembolsar
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => decide(r.id, 'reject')}>
                    Recusar
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
