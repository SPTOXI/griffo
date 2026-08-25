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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileEdit, Loader2, AlertCircle, ShieldCheck, Lock, Sparkles, Check, X,
  RefreshCw, Download, ArrowRight, Eye, Key, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

interface Resume {
  id: string
  status: string
  originalContent: string
  rewrittenContent: string | null
  analysis: any
}

export function RewriteView() {
  const { activeResumeId, setView, openResume } = useNav()
  const { user } = useAuth()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)

  const downloadFile = async (type: 'resume_pdf' | 'resume_txt' | 'resume_md') => {
    if (!resume) return
    setDownloadingType(type)
    try {
      const r = await internalFetch(`/api/resume/download?resumeId=${resume.id}&type=${type}`)
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast.error(data.error || 'Falha ao baixar arquivo.')
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
      toast.success('Download realizado com sucesso!')
    } catch {
      toast.error('Erro de conexão ao baixar arquivo.')
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


  const requestRewrite = async () => {
    if (!resume) return
    if (!authorized) {
      setError('Você precisa autorizar a reescrita para continuar.')
      return
    }
    setRewriting(true)
    setError(null)
    try {
      const r = await internalFetch('/api/resume/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, authorized: true }),
      })
      const data = await r.json()
      if (!r.ok) {
        if (data.code === 'PLAN_REQUIRED') {
          setError('Você precisa de um plano ativo para reescrever. Escolha um plano abaixo.')
          toast.error('Plano necessário para reescrever')
          setTimeout(() => setView('plans'), 1500)
          return
        }
        setError(data.error || 'Falha ao reescrever.')
        return
      }
      toast.success('Currículo reescrito! Revise abaixo.')
      await loadResume(resume.id)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setRewriting(false)
    }
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
        toast.success('Currículo confirmado! Pronto para download.')
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
        toast.info('Reescrita descartada. Você pode solicitar novamente.')
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
        <h2 className="text-lg font-semibold mb-1">Nenhum currículo para reescrever</h2>
        <p className="text-sm text-slate-500 mb-4">Envie e analise seu currículo primeiro.</p>
        <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">Enviar currículo</Button>
      </div>
    )
  }

  if (!resume.analysis) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Analise antes de reescrever</h2>
        <p className="text-sm text-slate-500 mb-4">A reescrita usa o laudo para priorizar as melhorias.</p>
        <Button onClick={() => openResume(resume.id, 'analysis')} className="bg-emerald-600 hover:bg-emerald-700">Ver laudo</Button>
      </div>
    )
  }

  const hasRewrite = !!resume.rewrittenContent

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reescrita do currículo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Com sua autorização, a IA reescreve o currículo preservando fatos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => openResume(resume.id, 'analysis')}>
          Ver laudo
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
                <CardTitle className="text-base">Autorização necessária</CardTitle>
                <CardDescription className="mt-1">A IA só reescreve se você autorizar explicitamente.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">O que a IA vai fazer:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> Reescrever bullets com verbo de ação + contexto + resultado</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> Reorganizar hierarquia e otimizar para ATS</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> Aplicar as recomendações do laudo (resumo, palavras-chave, etc.)</li>
              </ul>
              <p className="font-semibold text-slate-900 mt-3">O que a IA NÃO vai fazer:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> Inventar experiências, métricas ou formação</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> Alterar datas, empresas ou cargos</li>
                <li className="flex items-start gap-2"><X className="w-4 h-4 mt-0.5 text-red-500 shrink-0" /> Adicionar habilidades que você não declarou</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <Checkbox
                checked={authorized}
                onCheckedChange={(v) => setAuthorized(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <strong>Autorizo</strong> a IA a reescrever meu currículo com base no laudo de análise. Entendo que o resultado deve ser revisado por mim antes do download, e que sou responsável por confirmar a veracidade das informações.
              </span>
            </label>

            <Button
              onClick={requestRewrite}
              disabled={!authorized || rewriting}
              className="w-full bg-primary hover:bg-primary/90 h-11"
            >
              {rewriting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reescrevendo… (15–30s)</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Reescrever meu currículo</>
              )}
            </Button>
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
                <p className="text-sm font-semibold text-emerald-900">Currículo reescrito com sucesso!</p>
                <p className="text-xs text-emerald-700">Revise o conteúdo abaixo. Se estiver tudo OK, confirme para liberar o download.</p>
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
                      <h3 className="text-sm font-bold text-primary">🧩 Palavras-Chave Estratégicas (ATS) Incorporadas</h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      Estes termos essenciais foram integrados na reescrita para garantir pontuação máxima nos robôs de triagem (Gupy, LinkedIn, Workday).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-primary/20 text-primary hover:bg-primary/10 text-xs shrink-0 self-start sm:self-center"
                    onClick={() => {
                      navigator.clipboard.writeText(resume.analysis.keywords.join(', '))
                      toast.success('Palavras-chave copiadas!')
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar termos
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
              <Eye className="w-4 h-4 mr-1" /> {showOriginal ? 'Ver reescrito' : 'Ver original'}
            </Button>
            <Button variant="outline" size="sm" onClick={requestRewrite} disabled={rewriting}>
              {rewriting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Gerar novamente
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_pdf')}
              disabled={!!downloadingType}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {downloadingType === 'resume_pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              Baixar PDF
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_txt')}
              disabled={!!downloadingType}
              variant="outline"
              className="border-slate-300 font-medium"
            >
              {downloadingType === 'resume_txt' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              Baixar .TXT
            </Button>
            <Button
              size="sm"
              onClick={() => downloadFile('resume_md')}
              disabled={!!downloadingType}
              variant="outline"
              className="border-slate-300 font-medium"
            >
              {downloadingType === 'resume_md' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              Baixar .MD
            </Button>
            <Badge variant="outline" className="ml-auto self-center">
              {showOriginal ? 'Original' : 'Reescrito'}
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
              <CardTitle className="text-base">Revisão final</CardTitle>
              <CardDescription>Confirme se todas as informações estão corretas. Você é responsável pela veracidade dos dados.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Button onClick={confirmRewrite} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-1" /> Tudo certo, confirmar e baixar
              </Button>
              <Button onClick={rejectRewrite} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-1" /> Descartar reescrita
              </Button>
            </CardContent>
          </Card>

          {resume.status === 'confirmed' && (
            <Card className="border-emerald-300 bg-emerald-50">
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-emerald-900">Currículo confirmado!</p>
                  <p className="text-sm text-emerald-700">Pronto para download em PDF e Markdown.</p>
                </div>
                <Button onClick={() => setView('downloads')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1" /> Ir para downloads <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
