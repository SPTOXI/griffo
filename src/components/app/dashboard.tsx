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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Olá, {user?.name?.split(' ')[0] || 'candidato(a)'} 👋</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Bem-vindo(a) ao seu painel executivo GriffoWork.</p>
        </div>
        <Button onClick={() => setView('upload')} className="bg-[#0B192E] hover:bg-[#1A2E4B] text-white self-start sm:self-auto font-bold shadow-lg shadow-slate-900/20 transition-all">
          <Upload className="w-4 h-4 mr-2" /> Novo currículo
        </Button>
      </div>

      {/* PLAN BANNER - PREMIUM DARK MODE */}
      <Card className="border-0 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 bg-white/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                {planLabel(user?.plan || 'free')}
                <Badge className="bg-amber-400 text-amber-950 font-bold border-0 text-[10px] tracking-wider uppercase px-2 py-0.5">Ativo</Badge>
              </CardTitle>
              <CardDescription className="text-indigo-200 mt-1 text-xs max-w-lg leading-relaxed font-medium">
                Sua conta possui acesso à inteligência artificial avançada. Utilize seus créditos para auditorias completas e destaque-se para os recrutadores.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Créditos Restantes</span>
              <span className="text-2xl font-black text-amber-400 drop-shadow-sm">{user?.credits ?? 0}</span>
            </div>
          </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileSearch className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laudos Emitidos</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{resumes.filter(r => ['analyzed', 'rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileEdit className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currículos Aprimorados</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{resumes.filter(r => ['rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1 border-slate-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Potencial de Análise</p>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-amber-600">{user?.credits ?? 0}</p>
              <p className="text-sm text-slate-500 font-medium mb-1">créditos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT RESUMES */}
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Histórico de Processamento
            </CardTitle>
            <CardDescription className="text-xs font-medium mt-1">Seus últimos currículos processados pela inteligência artificial</CardDescription>
          </div>
          {resumes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setView('history')} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors">
              Ver histórico completo <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium flex justify-center items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Sincronizando dados…</p>
          ) : recent.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <FileSearch className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">Nenhum currículo em auditoria</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Inicie uma auditoria gratuita agora para descobrir as fragilidades e o potencial do seu currículo com base nas métricas das big techs.</p>
              </div>
              <Button onClick={() => setView('upload')} className="bg-[#0B192E] hover:bg-[#1A2E4B] text-white shadow-md font-bold transition-all px-6">
                <Upload className="w-4 h-4 mr-2" /> Iniciar Auditoria IA
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
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
    <button onClick={onOpen} className="group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0B192E]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#0B192E] group-hover:text-white transition-colors text-slate-400">
          <FileSearch className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-slate-900 truncate tracking-tight group-hover:text-[#0B192E] transition-colors">Laudo de {date}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Última atualização: {new Date(resume.updatedAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <Badge className={`${s.color} shrink-0 px-3 py-1 font-bold tracking-wide uppercase text-[10px]`}>{s.label}</Badge>
    </button>
  )
}
