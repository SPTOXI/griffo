'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSearch, FileEdit, Download, CreditCard, ArrowRight, Sparkles, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import { useAnalyses } from '@/hooks/use-analyses'
import { useI18n } from '@/context/i18n-context'
import { localeForLang, type TranslationDictionary } from '@/lib/i18n'

interface ResumeListItem {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

export function Dashboard() {
  const { t, lang } = useI18n()
  const d = t.dashboard
  const { user } = useAuth()
  const { balance } = useAnalyses()
  const { setView, openResume } = useNav()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    internalFetch('/api/resume/upload', { credentials: 'include', cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setResumes(data.resumes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Não há mais plano nenhum a nomear — nem pacote, nem assinatura. O que
  // existe é ter, ou não ter, análise disponível.
  const accountLabel = balance > 0 ? d.accountLabelActive : d.accountLabelDefault

  const recent = resumes.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {d.greeting.replace('{name}', user?.name?.split(' ')[0] || d.defaultName)}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{d.subtitle}</p>
        </div>
        <Button onClick={() => setView('upload')} className="bg-brand-navy hover:bg-brand-navy/90 text-white self-start sm:self-auto font-bold shadow-lg shadow-slate-900/20 transition-all">
          <Upload className="w-4 h-4 mr-2" /> {d.newResumeButton}
        </Button>
      </div>

      {/* PLAN BANNER - PREMIUM DARK MODE */}
      <Card className="border-0 bg-gradient-to-r from-brand-navy to-primary shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 bg-white/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                {accountLabel}
                {balance > 0 && (
                  <Badge className="bg-emerald-400 text-emerald-950 font-bold border-0 text-[10px] tracking-wider uppercase px-2 py-0.5">{d.activeBadge}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-blue-200 mt-1 text-xs max-w-lg leading-relaxed font-medium">
                {d.planCardDesc}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">{d.balanceLabel}</span>
              <span className="text-2xl font-black text-amber-400 drop-shadow-sm">{balance}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Upload} label={d.quickUploadLabel} desc={d.quickUploadDesc} onClick={() => setView('upload')} />
        <QuickAction icon={FileSearch} label={d.quickViewLabel} desc={d.quickViewDesc} onClick={() => recent[0] ? openResume(recent[0].id) : setView('upload')} />
        <QuickAction icon={FileEdit} label={d.quickRewriteLabel} desc={d.quickRewriteDesc} onClick={() => recent[0] ? openResume(recent[0].id, 'rewrite') : setView('upload')} />
        <QuickAction icon={Download} label={d.quickDownloadsLabel} desc={d.quickDownloadsDesc} onClick={() => setView('downloads')} />
      </div>

      {/* STATS — só as duas métricas que não repetem o saldo já mostrado acima */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSearch className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{d.statIssuedReports}</p>
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{d.statImprovedResumes}</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{resumes.filter(r => ['rewritten', 'confirmed'].includes(r.status)).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT RESUMES */}
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> {d.historyTitle}
            </CardTitle>
            <CardDescription className="text-xs font-medium mt-1">{d.historySubtitle}</CardDescription>
          </div>
          {resumes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setView('history')} className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 transition-colors">
              {d.historyViewAll} <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium flex justify-center items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> {d.syncing}</p>
          ) : recent.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <FileSearch className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">{d.emptyTitle}</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{d.emptyDesc}</p>
              </div>
              <Button onClick={() => setView('upload')} className="bg-brand-navy hover:bg-brand-navy/90 text-white shadow-md font-bold transition-all px-6">
                <Upload className="w-4 h-4 mr-2" /> {d.emptyButton}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((r) => (
                <ResumeRow key={r.id} resume={r} onOpen={() => openResume(r.id)} d={d} locale={localeForLang(lang)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick }: { icon: any; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 flex items-center justify-center mb-2 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-bold text-brand-navy">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </button>
  )
}

function ResumeRow({
  resume, onOpen, d, locale,
}: {
  resume: ResumeListItem
  onOpen: () => void
  d: TranslationDictionary['dashboard']
  locale: string
}) {
  // Progressão de status lida da esquerda pra direita: neutro -> informativo
  // -> pendente -> concluído -> confirmado. Cada estágio tem um papel de cor
  // próprio, sem repetir tom nem usar violeta (reservado para admin).
  const statusMap: Record<string, { label: string; color: string }> = {
    uploaded: { label: d.statusUploaded, color: 'bg-slate-100 text-slate-700' },
    analyzed: { label: d.statusAnalyzed, color: 'bg-primary/10 text-primary' },
    rewrite_requested: { label: d.statusRewriteRequested, color: 'bg-amber-100 text-amber-700' },
    rewritten: { label: d.statusRewritten, color: 'bg-emerald-100 text-emerald-700' },
    confirmed: { label: d.statusConfirmed, color: 'bg-primary text-white' },
  }
  const s = statusMap[resume.status] || statusMap.uploaded
  const date = new Date(resume.updatedAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <button onClick={onOpen} className="group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-navy/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-brand-navy group-hover:text-white transition-colors text-slate-400">
          <FileSearch className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-brand-navy transition-colors">{d.reportOf.replace('{date}', date)}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{d.lastUpdated.replace('{date}', new Date(resume.updatedAt).toLocaleString(locale))}</p>
        </div>
      </div>
      <Badge className={`${s.color} shrink-0 px-3 py-1 font-bold tracking-wide uppercase text-[10px]`}>{s.label}</Badge>
    </button>
  )
}
