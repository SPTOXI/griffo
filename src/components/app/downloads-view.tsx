'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download, FileText, FileType, Loader2, AlertCircle, Lock, CheckCircle2, FileSearch, FileEdit, ArrowRight, Share2, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'

interface ResumeListItem {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

export function DownloadsView() {
  const { user } = useAuth()
  const { activeResumeId, setView, openResume } = useNav()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [statusInfo, setStatusInfo] = useState<{ hasAnalysis: boolean; hasRewrite: boolean } | null>(null)

  const planActive = (user?.plan && user.plan !== 'free') || user?.role === 'admin'
  const canDownload = true

  useEffect(() => {
    if (activeResumeId) {
      setSelected(activeResumeId)
      loadList(activeResumeId)
    } else {
      loadList()
    }
  }, [activeResumeId])

  const loadList = async (preferId?: string) => {
    setLoading(true)
    try {
      const r = await internalFetch('/api/resume/upload', { cache: 'no-store' })
      const data = await r.json()
      setResumes(data.resumes || [])
      if (preferId) {
        setSelected(preferId)
        loadStatus(preferId)
      } else if (data.resumes?.length) {
        setSelected(data.resumes[0].id)
        loadStatus(data.resumes[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = async (id: string) => {
    try {
      const r = await internalFetch(`/api/resume/${id}?id=${id}`, { cache: 'no-store' })
      const data = await r.json()
      if (r.ok && data.resume) {
        setStatusInfo({
          hasAnalysis: !!data.resume.analysisJson,
          hasRewrite: !!data.resume.rewrittenContent,
        })
      }
    } catch {}
  }

  const download = async (type: 'resume_pdf' | 'resume_md' | 'resume_txt' | 'analysis_pdf' | 'social_advice_txt' | 'social_advice_md') => {
    if (!selected) return
    if (!canDownload) {
      toast.error('Adquira um pacote de créditos ou assine um plano para realizar downloads.')
      setView('plans')
      return
    }
    setDownloading(type)
    try {
      const r = await internalFetch(`/api/resume/download?resumeId=${selected}&type=${type}`)
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        if (data.code === 'INSUFFICIENT_CREDITS' || data.code === 'PLAN_REQUIRED') {
          toast.error('Saldo de créditos insuficiente.')
          setView('plans')
          return
        }
        toast.error(data.error || 'Falha no download.')
        return
      }
      const blob = await r.blob()
      // Extract filename from content-disposition
      const cd = r.headers.get('content-disposition') || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || 'download'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Download iniciado!')
    } catch (e: any) {
      toast.error('Erro no download.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Downloads</h1>
        <p className="text-sm text-slate-500 mt-0.5">Baixe o laudo e o currículo reescrito em PDF, TXT e Markdown.</p>
      </div>

      {!canDownload && (
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Os downloads exigem saldo de créditos ou plano ativo. <button onClick={() => setView('plans')} className="font-semibold underline">Adquirir créditos</button> a partir de R$ 9,90.
          </AlertDescription>
        </Alert>
      )}

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Download className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Nenhum currículo disponível.</p>
            <p className="text-sm text-slate-500 mb-4">Envie seu currículo para começar.</p>
            <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">Enviar currículo</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* SELECT RESUME */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selecione o currículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resumes.map((r) => {
                const sel = selected === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r.id); loadStatus(r.id) }}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
                      sel ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          Currículo · {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-slate-500">Atualizado em {new Date(r.updatedAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">{r.status}</Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {selected && statusInfo && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ANALYSIS PDF */}
              <Card className={!statusInfo.hasAnalysis ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                        <FileSearch className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Laudo de análise</CardTitle>
                        <CardDescription>PDF · nota 0–10 e relatório</CardDescription>
                      </div>
                    </div>
                    {statusInfo.hasAnalysis && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </CardHeader>
                <CardContent>
                  {!statusInfo.hasAnalysis ? (
                    <Button variant="outline" className="w-full" onClick={() => openResume(selected, 'analysis')}>
                      Analisar primeiro <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => download('analysis_pdf')}
                      disabled={!!downloading || !canDownload}
                      className="w-full bg-sky-600 hover:bg-sky-700"
                    >
                      {downloading === 'analysis_pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      Baixar laudo PDF
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* RESUME EXPORTS */}
              <Card className={!statusInfo.hasRewrite ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                        <FileEdit className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Currículo reescrito</CardTitle>
                        <CardDescription>PDF, TXT e Markdown</CardDescription>
                      </div>
                    </div>
                    {statusInfo.hasRewrite && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!statusInfo.hasRewrite ? (
                    <Button variant="outline" className="w-full" onClick={() => openResume(selected, 'rewrite')}>
                      Reescrever primeiro <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => download('resume_pdf')}
                        disabled={!!downloading || !canDownload}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                      >
                        {downloading === 'resume_pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileType className="w-4 h-4 mr-2" />}
                        Baixar PDF
                      </Button>
                      <Button
                        onClick={() => download('resume_txt')}
                        disabled={!!downloading || !canDownload}
                        variant="outline"
                        className="w-full"
                      >
                        {downloading === 'resume_txt' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Baixar Texto (.txt)
                      </Button>
                      <Button
                        onClick={() => download('resume_md')}
                        disabled={!!downloading || !canDownload}
                        variant="outline"
                        className="w-full"
                      >
                        {downloading === 'resume_md' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Baixar Markdown (.md)
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* SOCIAL / BRANDING ADVICE EXPORTS */}
              <Card className={!statusInfo.hasAnalysis ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Presença Digital</CardTitle>
                        <CardDescription>Otimização LinkedIn & Gupy</CardDescription>
                      </div>
                    </div>
                    {statusInfo.hasAnalysis && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!statusInfo.hasAnalysis ? (
                    <Button variant="outline" className="w-full" onClick={() => openResume(selected, 'analysis')}>
                      Analisar primeiro <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => download('social_advice_txt')}
                        disabled={!!downloading || !canDownload}
                        variant="outline"
                        className="w-full border-indigo-200 text-indigo-900 hover:bg-indigo-50"
                      >
                        {downloading === 'social_advice_txt' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Baixar Dicas (.txt)
                      </Button>
                      <Button
                        onClick={() => download('social_advice_md')}
                        disabled={!!downloading || !canDownload}
                        variant="outline"
                        className="w-full border-indigo-200 text-indigo-900 hover:bg-indigo-50"
                      >
                        {downloading === 'social_advice_md' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Baixar Dicas (.md)
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* INFO */}
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 text-xs text-slate-600 space-y-1">
              <p><strong>PDF do laudo:</strong> documento formatado com nota geral, dimensões, pontos fortes/fracos e recomendações.</p>
              <p><strong>Currículo reescrito (PDF / TXT / .MD):</strong> versões otimizadas prontas para envio aos recrutadores ou editáveis no seu computador.</p>
              <p><strong>Dicas de Presença Digital (.TXT / .MD):</strong> guia prático de biografia, títulos e palavras-chave para aplicar diretamente no seu LinkedIn e Gupy.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
