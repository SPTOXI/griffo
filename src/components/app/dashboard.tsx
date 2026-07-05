'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSearch, FileEdit, Download, CreditCard, ArrowRight, Sparkles, TrendingUp, Clock, AlertCircle } from 'lucide-react'

interface ResumeListItem {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

export function Dashboard() {
  const { user } = useAuth()
  const { setView, openResume } = useNav()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/resume/upload', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setResumes(d.resumes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const planLabel = (plan: string) => {
    if (plan === 'free') return 'Gratuito'
    if (plan === 'day') return 'Passe Diário'
    if (plan === 'monthly') return 'Mensal'
    if (plan === 'annual') return 'Anual'
    return plan
  }

  const planActive = user?.planActive
  const planEndsAt = user?.planEndsAt ? new Date(user.planEndsAt) : null
  const daysLeft = planEndsAt ? Math.max(0, Math.ceil((planEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0

  const recent = resumes.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {user?.name?.split(' ')[0] || 'candidato(a)'} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Aqui está o resumo da sua atividade no CareerLens.</p>
        </div>
        <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700 self-start sm:self-auto">
          <Upload className="w-4 h-4 mr-2" /> Novo currículo
        </Button>
      </div>

      {/* PLAN BANNER */}
      {!planActive ? (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Você está no plano Gratuito</p>
                <p className="text-sm text-emerald-700 mt-0.5">Faça análises gratuitas. Desbloqueie reescrita, downloads e histórico completo assinando um plano.</p>
              </div>
            </div>
            <Button onClick={() => setView('plans')} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              Ver planos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Plano {planLabel(user?.plan || '')} ativo</p>
                  <p className="text-xs text-slate-500">
                    {daysLeft > 0 ? `Expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} (${planEndsAt?.toLocaleDateString('pt-BR')})` : 'Expira hoje'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setView('plans')}>Gerenciar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Upload} label="Enviar currículo" desc="Cole ou anexe" onClick={() => setView('upload')} accent="emerald" />
        <QuickAction icon={FileSearch} label="Ver laudo" desc="Análise 0–10" onClick={() => recent[0] ? openResume(recent[0].id) : setView('upload')} accent="sky" />
        <QuickAction icon={FileEdit} label="Reescrever" desc="Com sua autorização" onClick={() => recent[0] ? openResume(recent[0].id, 'rewrite') : setView('upload')} accent="violet" />
        <QuickAction icon={Download} label="Downloads" desc="PDF e Markdown" onClick={() => setView('downloads')} accent="amber" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileSearch className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Currículos analisados</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{resumes.filter(r => ['analyzed', 'rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileEdit className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Currículos reescritos</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{resumes.filter(r => ['rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Total enviados</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 col-span-2">{resumes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Currículos recentes</CardTitle>
              <CardDescription>Seus últimos envios</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('history')}>Ver todos</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500 py-6 text-center">Carregando…</p>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Nenhum currículo enviado ainda</p>
              <p className="text-xs text-slate-400 mt-1">Envie seu primeiro currículo para começar.</p>
              <Button onClick={() => setView('upload')} size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                Enviar currículo
              </Button>
            </div>
          ) : (
            recent.map((r) => <ResumeRow key={r.id} resume={r} onOpen={() => openResume(r.id)} />)
          )}
        </CardContent>
      </Card>

      {/* TIPS */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Dica do recrutador</p>
              <p className="text-sm text-slate-600 mt-1">
                Currículos com 3 ou mais resultados quantificados (números, %, R$) têm <strong>2,4×</strong> mais chance de passar nos filtros ATS. Comece cada bullet com um verbo de ação e termine com o impacto mensurável.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick, accent }: { icon: any; label: string; desc: string; onClick: () => void; accent: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
    sky: 'bg-sky-50 text-sky-700 group-hover:bg-sky-100',
    violet: 'bg-violet-50 text-violet-700 group-hover:bg-violet-100',
    amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
  }
  return (
    <button onClick={onClick} className="group text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className={`w-9 h-9 rounded-lg ${colorMap[accent]} flex items-center justify-center mb-2 transition-colors`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </button>
  )
}

function ResumeRow({ resume, onOpen }: { resume: ResumeListItem; onOpen: () => void }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    uploaded: { label: 'Enviado', color: 'bg-slate-100 text-slate-700' },
    analyzed: { label: 'Analisado', color: 'bg-sky-100 text-sky-700' },
    rewrite_requested: { label: 'Reescrita solicitada', color: 'bg-violet-100 text-violet-700' },
    rewritten: { label: 'Reescrito', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700' },
  }
  const s = statusMap[resume.status] || statusMap.uploaded
  const date = new Date(resume.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <button onClick={onOpen} className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <FileSearch className="w-4 h-4 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">Currículo de {date}</p>
          <p className="text-xs text-slate-500">Atualizado em {new Date(resume.updatedAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <Badge className={`${s.color} hover:${s.color} shrink-0`}>{s.label}</Badge>
    </button>
  )
}
