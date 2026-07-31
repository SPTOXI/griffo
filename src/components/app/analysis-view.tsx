'use client'

import { useEffect, useState } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileSearch, Loader2, AlertCircle, Sparkles, Award, Target, Lightbulb, Key,
  CheckCircle2, XCircle, FileEdit, Download, ArrowRight, RefreshCw, Share2, Globe, Linkedin
} from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import { internalFetch } from '@/lib/internal-fetch'

interface SocialAdvice {
  platform: string
  url: string
  headline?: string
  aboutSummary?: string
  tips: string[]
}

interface Analysis {
  overall: number
  dimensions: { key: string; label: string; score: number; rationale: string }[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keywords: string[]
  atsFriendly: boolean
  summary: string
  socialAdvice?: SocialAdvice[]
}

interface Resume {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  originalContent: string
  analysis: Analysis | null
  rewrittenContent: string | null
}

export function AnalysisView() {
  const { activeResumeId, setView, openResume } = useNav()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [list, setList] = useState<{ id: string; status: string; updatedAt: string }[]>([])

  useEffect(() => {
    if (activeResumeId) {
      loadResume(activeResumeId)
    } else {
      internalFetch('/api/resume/upload')
        .then(r => r.json())
        .then(d => {
          if (d.resumes?.length) {
            setList(d.resumes)
            loadResume(d.resumes[0].id)
          } else {
            setLoading(false)
          }
        })
        .catch(() => setLoading(false))
    }
  }, [activeResumeId])

  const loadResume = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const r = await internalFetch(`/api/resume/${id}?id=${id}`, { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Erro ao carregar.')
        return
      }
      setResume(data.resume)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const reanalyze = async () => {
    if (!resume) return
    setAnalyzing(true)
    setError(null)
    try {
      const r = await internalFetch('/api/resume/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resumeId: resume.id })
})


      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Falha ao reanalisar.')
        return
      }
      await loadResume(resume.id)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-4">
          <FileSearch className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Nenhum currículo para exibir</h2>
        <p className="text-sm text-slate-500 mb-4">Envie seu currículo para ver a análise.</p>
        <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">
          Enviar currículo
        </Button>
      </div>
    )
  }

  if (!resume.analysis) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Laudo de análise</h1>
          <Button variant="outline" size="sm" onClick={() => loadResume(resume.id)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <FileSearch className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Currículo enviado, mas ainda não analisado.</p>
            <p className="text-sm text-slate-500 mb-4">Clique abaixo para gerar o laudo.</p>
            <Button onClick={reanalyze} disabled={analyzing} className="bg-emerald-600 hover:bg-emerald-700">
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando…</> : <><Sparkles className="w-4 h-4 mr-2" /> Gerar análise</>}
            </Button>
            {error && <Alert variant="destructive" className="mt-4"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
        </Card>
      </div>
    )
  }

  const rawAnalysis = resume.analysis || {}
  const a = {
    overall: typeof rawAnalysis.overall === 'number' ? rawAnalysis.overall : (rawAnalysis.scoreOverall ? rawAnalysis.scoreOverall / 10 : 7.0),
    summary: rawAnalysis.summary || rawAnalysis.parecer || 'Análise concluída com sucesso.',
    atsFriendly: rawAnalysis.atsFriendly ?? true,
    dimensions: Array.isArray(rawAnalysis.dimensions) ? rawAnalysis.dimensions : [
      { key: 'structure', label: 'Estrutura & ATS', score: 7, rationale: 'Estrutura padrão identificada.' },
      { key: 'summary', label: 'Resumo & Posicionamento', score: 7, rationale: 'Posicionamento claro.' },
      { key: 'impact', label: 'Resultados (STAR/XYZ)', score: 7, rationale: 'Resultados apresentados.' },
      { key: 'skills', label: 'Habilidades & Ferramentas', score: 7, rationale: 'Competências identificadas.' }
    ],
    strengths: Array.isArray(rawAnalysis.strengths) ? rawAnalysis.strengths : ['Estrutura profissional legível', 'Experiência estruturada'],
    weaknesses: Array.isArray(rawAnalysis.weaknesses) ? rawAnalysis.weaknesses : ['Adicionar mais métricas quantificáveis (STAR/XYZ)'],
    recommendations: Array.isArray(rawAnalysis.recommendations) ? rawAnalysis.recommendations : ['Destacar conquistas numéricas'],
    keywords: Array.isArray(rawAnalysis.keywords) ? rawAnalysis.keywords : [],
    socialAdvice: Array.isArray(rawAnalysis.socialAdvice) ? rawAnalysis.socialAdvice : [],
  }

  const score = Number(a.overall || 0)
  const scoreColor = score >= 8 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626'
  const scoreLabel = score >= 8 ? 'Excelente' : score >= 6.5 ? 'Bom' : score >= 5 ? 'Regular' : 'Precisa melhorar'

  const chartData = a.dimensions.map(d => ({
    dimension: (d.label || '').length > 20 ? (d.label || '').slice(0, 18) + '…' : (d.label || ''),
    score: Number(d.score || 0),
    fullMark: 10,
  }))

  return (
    <div className="space-y-5 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laudo de análise</h1>
          <p className="text-sm text-slate-500 mt-0.5">Atualizado em {new Date(resume.updatedAt).toLocaleString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reanalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Reanalisar
          </Button>
          <Button size="sm" onClick={() => openResume(resume.id, 'rewrite')} className="bg-violet-600 hover:bg-violet-700">
            <FileEdit className="w-4 h-4 mr-1" /> Reescrever
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* OVERALL + RADAR */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Nota geral</p>
            <p className="text-6xl font-bold" style={{ color: scoreColor }}>{score.toFixed(1)}</p>
            <p className="text-sm text-slate-400">/ 10</p>
            <Badge className="mt-3" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>{scoreLabel}</Badge>
            <div className="mt-4 flex items-center gap-2 text-xs">
              {a.atsFriendly ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700 font-medium">ATS OK</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-red-600" /><span className="text-red-700 font-medium">Rejeitado por ATS</span></>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Desempenho por dimensão</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#475569' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#cbd5e1" />
                  <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Veredito Executivo</p>
          <p className="text-slate-700 leading-relaxed">{a.summary}</p>
        </CardContent>
      </Card>

      {/* DIMENSIONS DETAIL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhamento por dimensão</CardTitle>
          <CardDescription>Critérios de ATS, recrutamento executivo, plano de carreira e capacitação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {a.dimensions.map((d) => {
            const ds = Number(d.score || 0)
            const color = ds >= 8 ? '#16a34a' : ds >= 5 ? '#d97706' : '#dc2626'
            return (
              <div key={d.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-900">{d.label}</span>
                  <span className="font-bold" style={{ color }}>{ds.toFixed(1)} <span className="text-slate-400 text-xs">/ 10</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${ds * 10}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{d.rationale}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* SOCIAL PRESENCE & ADVICE (NEW DEDICATED SECTION) */}
      {a.socialAdvice && a.socialAdvice.length > 0 && (
        <Card className="border-violet-200 bg-gradient-to-br from-white to-violet-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-violet-900 font-bold">
                    Otimização de Presença Digital (LinkedIn, Gupy & Branding)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Recomendações técnicas personalizadas para alinhar seus perfis online ao currículo e passar pelos filtros dos recrutadores.
                  </CardDescription>
                </div>
              </div>

              {/* DOWNLOAD & EXPORT SOCIAL ADVICE */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    let text = `Otimização de Presença Digital & Redes Sociais\n\n`
                    for (const s of a.socialAdvice) {
                      text += `[${s.platform}] ${s.url}\n`
                      if (s.headline) text += `Título Sugerido: ${s.headline}\n`
                      if (s.aboutSummary) text += `Texto Sobre: ${s.aboutSummary}\n`
                      if (s.tips?.length) text += `Dicas: ${s.tips.join('; ')}\n`
                      text += `\n`
                    }
                    navigator.clipboard.writeText(text)
                    toast.success('Dicas de redes sociais copiadas para a área de transferência!')
                  }}
                  className="bg-white border-violet-200 text-violet-800 hover:bg-violet-50 text-xs"
                >
                  Copiar dicas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResume(resume.id, 'downloads')}
                  className="bg-violet-600 text-white hover:bg-violet-700 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Baixar relatórios
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {a.socialAdvice.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-violet-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-600 text-white font-semibold px-2.5 py-0.5">{item.platform}</Badge>
                    <span className="text-xs text-slate-500 font-mono truncate max-w-xs">{item.url}</span>
                  </div>
                </div>

                {item.headline && (
                  <div className="bg-violet-50/60 p-3 rounded-lg border border-violet-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
                        💡 Título Otimizado Sugerido ({item.platform})
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-violet-700 hover:bg-violet-100"
                        onClick={() => {
                          navigator.clipboard.writeText(item.headline || '')
                          toast.success('Título copiado!')
                        }}
                      >
                        Copiar título
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-normal">{item.headline}</p>
                  </div>
                )}

                {item.aboutSummary && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        📝 Sugestão de Texto 'Sobre' / Bio
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-slate-600 hover:bg-slate-200"
                        onClick={() => {
                          navigator.clipboard.writeText(item.aboutSummary || '')
                          toast.success('Texto copiado!')
                        }}
                      >
                        Copiar texto
                      </Button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{item.aboutSummary}</p>
                  </div>
                )}

                {item.tips && item.tips.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      🚀 Dicas de Otimização & Algoritmo
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {item.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5">
                          <span className="text-violet-600 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* STRENGTHS / WEAKNESSES */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-base text-emerald-900">Pontos fortes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {a.strengths?.length ? (
              <ul className="space-y-2">
                {a.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Nenhum ponto forte identificado.</p>}
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base text-amber-900">Pontos de atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {a.weaknesses?.length ? (
              <ul className="space-y-2">
                {a.weaknesses.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Sem pontos de atenção relevantes.</p>}
          </CardContent>
        </Card>
      </div>

      {/* RECOMMENDATIONS */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-sky-600" />
            <CardTitle className="text-base">Recomendações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {a.recommendations?.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* KEYWORDS */}
      {a.keywords?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-base">Palavras-chave ATS sugeridas</CardTitle>
            </div>
            <CardDescription>Adicione essas palavras-chave (quando verdadeiras) para passar filtros automáticos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {a.keywords.map((k, i) => (
                <Badge key={i} variant="outline" className="bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-50">{k}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <p className="font-semibold text-violet-900">Pronto para melhorar seu currículo?</p>
            <p className="text-sm text-violet-700 mt-0.5">Com sua autorização, reescrevemos o currículo aplicando todas as recomendações acima.</p>
          </div>
          <Button onClick={() => openResume(resume.id, 'rewrite')} className="bg-violet-600 hover:bg-violet-700 shrink-0">
            <FileEdit className="w-4 h-4 mr-1" /> Reescrever currículo <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
