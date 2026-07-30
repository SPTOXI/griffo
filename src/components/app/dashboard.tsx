'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSearch, FileEdit, Download, CreditCard, ArrowRight, Sparkles, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'

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
    internalFetch('/api/resume/upload', { credentials: 'include', cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setResumes(d.resumes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const planLabel = (plan: string) => {
    if (plan === 'free') return 'Gratuito'
    if (plan === 'entrada') return 'Plano de Entrada'
    if (plan === 'starter') return 'Pacote Starter'
    if (plan === 'carreira') return 'Pacote Carreira'
    if (plan === 'profissional') return 'Pacote Profissional'
    return plan
  }

  const recent = resumes.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192E]">Olá, {user?.name?.split(' ')[0] || 'candidato(a)'} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Aqui está o resumo da sua atividade no GriffoWork.</p>
        </div>
        <Button onClick={() => setView('upload')} className="bg-[#0B63E5] hover:bg-[#0052CC] text-white self-start sm:self-auto font-bold shadow-sm">
          <Upload className="w-4 h-4 mr-2" /> Novo currículo
        </Button>
      </div>

      {/* PLAN BANNER */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/50">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0B63E5] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[#0B192E]">Saldo Atual: {user?.credits ?? 0} Créditos</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Utilize seus créditos para realizar avaliações completas em 8 dimensões ou reescrever experiências com IA.</p>
            </div>
          </div>
          <Button onClick={() => setView('plans')} className="bg-[#0B63E5] hover:bg-[#0052CC] text-white shrink-0 font-semibold shadow-xs">
            Comprar mais créditos <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Upload} label="Enviar currículo" desc="Cole ou anexe" onClick={() => setView('upload')} accent="blue" />
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
            <p className="text-2xl font-bold text-[#0B192E]">{resumes.filter(r => ['analyzed', 'rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileEdit className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Currículos reescritos</p>
            </div>
            <p className="text-2xl font-bold text-[#0B192E]">{resumes.filter(r => ['rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-slate-500">Saldo de créditos</p>
            </div>
            <p className="text-2xl font-bold text-[#0B63E5]">{user?.credits ?? 0} cr</p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT RESUMES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-[#0B192E]">Atividade Recente</CardTitle>
            <CardDescription className="text-xs">Seus últimos currículos processados pela plataforma</CardDescription>
          </div>
          {resumes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setView('history')} className="text-xs text-[#0B63E5] hover:text-[#0052CC]">
              Ver histórico <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Carregando dados…</p>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm font-medium text-slate-700">Nenhum currículo enviado ainda.</p>
              <p className="text-xs text-slate-500">Envie seu currículo para receber uma análise completa em 8 dimensões.</p>
              <Button size="sm" onClick={() => setView('upload')} className="bg-[#0B63E5] hover:bg-[#0052CC] text-white">
                <Upload className="w-4 h-4 mr-1.5" /> Enviar agora
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <ResumeRow key={r.id} resume={r} onOpen={() => openResume(r.id)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick, accent }: { icon: any; label: string; desc: string; onClick: () => void; accent: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-[#0B63E5] group-hover:bg-blue-100',
    sky: 'bg-sky-50 text-sky-700 group-hover:bg-sky-100',
    violet: 'bg-violet-50 text-violet-700 group-hover:bg-violet-100',
    amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
  }
  return (
    <button onClick={onClick} className="group text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className={`w-9 h-9 rounded-lg ${colorMap[accent]} flex items-center justify-center mb-2 transition-colors`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-bold text-[#0B192E]">{label}</p>
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
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-[#0B63E5]' },
  }
  const s = statusMap[resume.status] || statusMap.uploaded
  const date = new Date(resume.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <button onClick={onOpen} className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <FileSearch className="w-4 h-4 text-[#0B63E5]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0B192E] truncate">Currículo de {date}</p>
          <p className="text-xs text-slate-500">Atualizado em {new Date(resume.updatedAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <Badge className={`${s.color} hover:${s.color} shrink-0 font-bold`}>{s.label}</Badge>
    </button>
  )
}
