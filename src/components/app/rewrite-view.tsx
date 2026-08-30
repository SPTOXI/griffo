'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAiJob } from './use-ai-job'
import {
  FileEdit, Loader2, AlertCircle, ShieldCheck, Lock, Sparkles, Check, X,
  RefreshCw, Download, ArrowRight, Eye, Key, Copy, Globe
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { useI18n } from '@/context/i18n-context'
import type { Language } from '@/lib/i18n'

interface Resume {
  id: string
  status: string
  originalContent: string
  rewrittenContent: string | null
  analysis: any
}

const TARGET_MARKET_OPTIONS = [
  { id: 'BR', lang: 'pt' as Language, label: 'Brasil (Português)', flag: '🇧🇷', format: 'Padrão CLT / PJ' },
  { id: 'US', lang: 'en' as Language, label: 'United States (English)', flag: '🇺🇸', format: 'US Executive / ATS' },
  { id: 'GB', lang: 'en' as Language, label: 'United Kingdom (English)', flag: '🇬🇧', format: 'UK Standard' },
  { id: 'CA', lang: 'en' as Language, label: 'Canada (English)', flag: '🇨🇦', format: 'Canadian Standard' },
  { id: 'DE', lang: 'de' as Language, label: 'Deutschland (Deutsch)', flag: '🇩🇪', format: 'Deutscher Lebenslauf' },
  { id: 'FR', lang: 'fr' as Language, label: 'France (Français)', flag: '🇫🇷', format: 'Format Cadre' },
  { id: 'IT', lang: 'it' as Language, label: 'Italia (Italiano)', flag: '🇮🇹', format: 'Formato Europeo' },
  { id: 'ES', lang: 'es' as Language, label: 'España (Español)', flag: '🇪🇸', format: 'Estándar Profesional' },
  { id: 'MX', lang: 'es' as Language, label: 'México (Español)', flag: '🇲🇽', format: 'Estándar LATAM' },
  { id: 'PT', lang: 'pt' as Language, label: 'Portugal (Português)', flag: '🇵🇹', format: 'Padrão Europeu' },
  { id: 'JP', lang: 'ja' as Language, label: '日本 (日本語)', flag: '🇯🇵', format: '職務経歴書 / Global' },
  { id: 'NL', lang: 'nl' as Language, label: 'Nederland (Nederlands)', flag: '🇳🇱', format: 'Dutch Standard' },
  { id: 'SE', lang: 'sv' as Language, label: 'Sverige (Svenska)', flag: '🇸🇪', format: 'Nordic Standard' },
  { id: 'CN', lang: 'zh' as Language, label: '中国 (简体中文)', flag: '🇨🇳', format: '中文资深专业履历' },
  { id: 'AE', lang: 'ar' as Language, label: 'الإمارات (العربية)', flag: '🇦🇪', format: 'معايير الخليج' },
  { id: 'KR', lang: 'ko' as Language, label: '대한민국 (한국어)', flag: '🇰🇷', format: '경력기술서 표준' },
  { id: 'GLOBAL', lang: 'en' as Language, label: 'Global Remote (English)', flag: '🌐', format: 'International Remote' },
]

export function RewriteView() {
  const { t, lang } = useI18n()
  const rw = t.rewrite
  const { activeResumeId, setView, openResume } = useNav()
  const { user } = useAuth()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<string>(() => {
    const defaultMarket = TARGET_MARKET_OPTIONS.find((m) => m.lang === lang)?.id || 'BR'
    return defaultMarket
  })

  const downloadFile = async (type: 'resume_pdf' | 'resume_txt' | 'resume_md') => {
    if (!resume) return
    setDownloadingType(type)
    try {
      const r = await internalFetch(`/api/resume/download?resumeId=${resume.id}&type=${type}`)
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast.error(data.error || rw.downloadGenericError)
        return
      }
      const blob = await r.blob()
      const cd = r.headers.get('content-disposition') || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `curriculo_reescrito.${type === 'resume_pdf' ? 'pdf' : type === 'resume_txt' ? 'txt' : 'md'}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(rw.downloadSuccess)
    } catch {
      toast.error(rw.downloadConnectionError)
    } finally {
      setDownloadingType(null)
    }
  }

  const loadResume = async (id: string) => {
    setLoading(true)
    try {
      const r = await internalFetch(`/api/resume/${id}?id=${id}`, { cache: 'no-store' })
      const data = await r.json()
      if (r.ok) setResume(data.resume)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeResumeId) {
      loadResume(activeResumeId);
    } else {
      (async () => {
        try {
          const r = await internalFetch('/api/resume/upload', { cache: 'no-store' });
          const d = await r.json();
          if (d.resumes?.length) {
            loadResume(d.resumes[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      })();
    }
  }, [activeResumeId])


  /**
   * Progresso real via `useAiJob`: a reescrita virou 3 seções paralelas, cada
   * uma uma etapa de verdade (ver `lib/ai-jobs/runners/rewrite.ts` e a regra
   * em HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento").
   */
  const rewriteJob = useAiJob<{ rewrittenContent: string }>({
    startUrl: '/api/resume/rewrite',
    statusUrl: '/api/ai-jobs/status',
    onCompleted: () => {
      setError(null)
      toast.success(rw.rewriteSuccessToast)
      if (resume) void loadResume(resume.id)
    },
    onFailed: (message, code) => {
      if (code === 'PLAN_REQUIRED') {
        setError(rw.planRequiredError)
        toast.error(rw.planRequiredToast)
        setTimeout(() => setView('plans'), 1500)
        return
      }
      setError(message || rw.rewriteErrorFallback)
    },
  })
  const rewriting = rewriteJob.phase === 'starting' || rewriteJob.phase === 'running'

  const requestRewrite = () => {
    if (!resume) return
    if (!authorized && !hasRewrite) {
      setError(rw.authRequiredError)
      return
    }
    setError(null)
    const target = TARGET_MARKET_OPTIONS.find((m) => m.id === selectedMarket) || TARGET_MARKET_OPTIONS[0]
    void rewriteJob.start({
      resumeId: resume.id,
      targetLang: target.lang,
      targetMarket: target.id,
      authorized: true,
    })
  }

  const confirmRewrite = async () => {
    if (!resume) return
    try {
      const r = await internalFetch('/api/resume/rewrite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, action: 'confirm' }),
      })
      if (r.ok) {
        toast.success(rw.confirmSuccessToast)
        await loadResume(resume.id)
        setView('downloads')
      }
    } catch {}
  }

  const rejectRewrite = async () => {
    if (!resume) return
    try {
      const r = await internalFetch('/api/resume/rewrite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, action: 'reject' }),
      })
      if (r.ok) {
        toast.info(rw.rejectInfoToast)
        await loadResume(resume.id)
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <FileEdit className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">{rw.emptyTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{rw.emptyDesc}</p>
        <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">{rw.emptyCta}</Button>
      </div>
    )
  }

  if (!resume.analysis) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">{rw.needsAnalysisTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{rw.needsAnalysisDesc}</p>
        <Button onClick={() => openResume(resume.id, 'analysis')} className="bg-emerald-600 hover:bg-emerald-700">{rw.needsAnalysisCta}</Button>
      </div>
    )
  }

  const hasRewrite = !!resume.rewrittenContent

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{rw.pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{rw.pageSubtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => openResume(resume.id, 'analysis')}>
          {rw.viewReportCta}
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* AUTHORIZATION REQUIRED */}
      {!hasRewrite && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base">{rw.authCardTitle}</CardTitle>
                <CardDescription className="mt-1">{rw.authCardDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* International Target Market Selector */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" />
                  Mercado Alvo e Formato de Recrutamento
                </label>
                <span className="text-[11px] text-primary font-medium">1-Click AI Adaptation</span>
              </div>
              <p className="text-xs text-slate-500">
                A IA traduz o currículo, ajusta as convenções locais (ex: Lebenslauf, Rirekisho, formato americano), incorpora métricas e alinha as palavras-chave com os ATS do país escolhido.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {TARGET_MARKET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMarket(opt.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedMarket === opt.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0">{opt.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{opt.format}</div>
                    </div>
                    {selectedMarket === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{rw.willDoTitle}</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {rw.willDo1}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {rw.willDo2}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {rw.willDo3}</li>
              </ul>
              <p className="font-semibold text-slate-900 mt-3">{rw.willNotTitle}</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> {rw.willNot1}</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> {rw.willNot2}</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> {rw.willNot3}</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <Checkbox
                checked={authorized}
                onCheckedChange={(v) => setAuthorized(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-700">
                {rw.authorizeLabel}
              </span>
            </label>

            <Button
              onClick={requestRewrite}
              disabled={!authorized || rewriting}
              className="w-full bg-primary hover:bg-primary/90 h-11"
            >
              {rewriting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {rw.rewritingButton}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> {rw.rewriteButton}</>
              )}
            </Button>
            {rewriting && (
              <div className="space-y-1">
                <Progress value={rewriteJob.progress} className="h-1.5" />
                {/* Cada seção pronta é um fato — 3 seções reais (cabeçalho,
                    experiências, formação), não uma barra calibrada em tempo. */}
                <p className="text-xs text-slate-500">
                  {rw.sectionsProgress
                    .replace('{done}', String(rewriteJob.completedSteps))
                    .replace('{total}', String(rewriteJob.totalSteps || 3))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REWRITTEN CONTENT */}
      {hasRewrite && (
        <>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">{rw.successCardTitle}</p>
                <p className="text-xs text-emerald-700">{rw.successCardDesc}</p>
              </div>
            </CardContent>
          </Card>

          {/* International Re-targeting bar */}
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Adaptar para outro Mercado / Idioma:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 cursor-pointer"
                  >
                    {TARGET_MARKET_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.flag} {opt.label} — ({opt.format})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestRewrite}
                    disabled={rewriting}
                    className="text-xs h-8 bg-white border-primary/30 text-primary hover:bg-primary/5"
                  >
                    {rewriting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                    Traduzir & Re-otimizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ATS STRATEGIC KEYWORDS DEDICATED SECTION */}
          {resume.analysis?.keywords && Array.isArray(resume.analysis.keywords) && resume.analysis.keywords.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-bold text-primary">{rw.keywordsCardTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      {rw.keywordsCardDesc}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-primary/20 text-primary hover:bg-primary/10 text-xs shrink-0 self-start sm:self-center"
                    onClick={() => {
                      navigator.clipboard.writeText(resume.analysis.keywords.join(', '))
                      toast.success(rw.copyKeywordsToast)
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> {rw.copyKeywordsCta}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {resume.analysis.keywords.map((kw: string, i: number) => (
                    <Badge key={i} className="bg-primary text-white font-medium hover:bg-primary/90 text-xs px-2.5 py-0.5">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowOriginal(!showOriginal)}>
              <Eye className="w-4 h-4 mr-1" /> {showOriginal ? rw.viewRewrittenCta : rw.viewOriginalCta}
            </Button>
            <Button variant="outline" size="sm" onClick={requestRewrite} disabled={rewriting}>
              {rewriting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {rw.regenerateCta}
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_pdf')}
              disabled={!!downloadingType}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {downloadingType === 'resume_pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              {rw.downloadPdfCta}
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_txt')}
              disabled={!!downloadingType}
              variant="outline"
              className="border-slate-300 font-medium"
            >
              {downloadingType === 'resume_txt' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              {rw.downloadTxtCta}
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_md')}
              disabled={!!downloadingType}
              variant="outline"
              className="border-slate-300 font-medium"
            >
              {downloadingType === 'resume_md' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              {rw.downloadMdCta}
            </Button>
            <Badge variant="outline" className="ml-auto self-center">
              {showOriginal ? rw.originalBadge : rw.rewrittenBadge}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <div className="p-6 bg-white rounded-xl shadow-xs">
                  {showOriginal ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700 bg-transparent p-0 m-0 leading-relaxed">{resume.originalContent}</pre>
                  ) : (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-black text-slate-900 border-b border-slate-300 pb-2 mb-4 mt-2 tracking-tight uppercase">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold text-primary border-b border-primary/10 pb-1 mb-2 mt-5 tracking-wide uppercase">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs font-bold text-slate-800 mb-1 mt-3">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1.5 mb-4 text-xs text-slate-700 pl-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1.5 mb-4 text-xs text-slate-700 pl-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">
                            {children}
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-slate-900">
                            {children}
                          </strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-3 py-1.5 bg-primary/5 text-xs text-slate-700 italic my-3 rounded-r-md">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {resume.rewrittenContent || ''}
                    </ReactMarkdown>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* CONFIRMATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{rw.finalReviewTitle}</CardTitle>
              <CardDescription>{rw.finalReviewDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Button onClick={confirmRewrite} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-1" /> {rw.confirmCta}
              </Button>
              <Button onClick={rejectRewrite} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-1" /> {rw.discardCta}
              </Button>
            </CardContent>
          </Card>

          {resume.status === 'confirmed' && (
            <Card className="border-emerald-300 bg-emerald-50">
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-emerald-900">{rw.confirmedTitle}</p>
                  <p className="text-sm text-emerald-700">{rw.confirmedDesc}</p>
                </div>
                <Button onClick={() => setView('downloads')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1" /> {rw.goToDownloadsCta} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
