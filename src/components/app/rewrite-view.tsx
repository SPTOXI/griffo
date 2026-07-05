'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileEdit, Loader2, AlertCircle, ShieldCheck, Lock, Sparkles, Check, X,
  RefreshCw, Download, ArrowRight, Eye
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

  useEffect(() => {
    if (activeResumeId) {
      loadResume(activeResumeId)
    } else {
      fetch('/api/resume/upload', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (d.resumes?.length) loadResume(d.resumes[0].id)
          else setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [activeResumeId])

  const loadResume = async (id: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/resume/${id}?id=${id}`, { cache: 'no-store' })
      const data = await r.json()
      if (r.ok) setResume(data.resume)
    } finally {
      setLoading(false)
    }
  }

  const requestRewrite = async () => {
    if (!resume) return
    if (!authorized) {
      setError('Você precisa autorizar a reescrita para continuar.')
      return
    }
    setRewriting(true)
    setError(null)
    try {
      const r = await fetch('/api/resume/rewrite', {
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
      const r = await fetch('/api/resume/rewrite', {
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
      const r = await fetch('/api/resume/rewrite', {
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
        <Card className="border-violet-200">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
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

            {!user?.planActive && (
              <Alert>
                <Lock className="w-4 h-4" />
                <AlertDescription>
                  A reescrita requer um plano ativo. <button onClick={() => setView('plans')} className="text-emerald-700 font-semibold underline">Ver planos</button> (a partir de R$ 19,90).
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={requestRewrite}
              disabled={!authorized || rewriting}
              className="w-full bg-violet-600 hover:bg-violet-700 h-11"
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

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowOriginal(!showOriginal)}>
              <Eye className="w-4 h-4 mr-1" /> {showOriginal ? 'Ver reescrito' : 'Ver original'}
            </Button>
            <Button variant="outline" size="sm" onClick={requestRewrite} disabled={rewriting}>
              {rewriting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Gerar novamente
            </Button>
            <Badge variant="outline" className="ml-auto self-center">
              {showOriginal ? 'Original' : 'Reescrito'}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <div className="p-6 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h2:border-b prose-h2:pb-1 prose-h2:border-slate-200 prose-h3:text-base prose-li:my-0.5 prose-p:my-1">
                  {showOriginal ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700 bg-transparent p-0 m-0">{resume.originalContent}</pre>
                  ) : (
                    <ReactMarkdown>{resume.rewrittenContent || ''}</ReactMarkdown>
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
