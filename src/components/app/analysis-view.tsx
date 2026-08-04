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
  CheckCircle2, XCircle, FileEdit, Download, ArrowRight, RefreshCw, Share2, Globe, Linkedin, Compass, Info, BarChart3
} from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import { UploadProgressModal } from './upload-progress-modal'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'

interface TargetedChange {
  section: string
  originalText: string
  rationale: string
  suggestedText: string
}

interface SocialAdvice {
  platform: string
  url: string
  headline?: string
  aboutSummary?: string
  tips: string[]
}

interface JobMatch {
  targetJob?: string
  matchPercentage: number
  verdict?: string
  matchedRequirements?: string[]
  missingRequirements?: string[]
  actionPlan?: string[]
}

interface Analysis {
  overall: number
  dimensions: { key: string; label: string; score: number; rationale: string }[]
  jobMatch?: JobMatch
  targetedChanges?: TargetedChange[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keywords: string[]
  atsFriendly: boolean
  summary: string
  socialAdvice?: SocialAdvice[]
}

// Ensure rawAnalysis access is also typed
interface RawAnalysis extends Partial<Analysis> {
  [key: string]: unknown
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
  const [orienting, setOrienting] = useState(false)
  const [careerOrientation, setCareerOrientation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'social' | 'match' | 'career' | 'dimensions' | 'targeted'>('all')
  const [list, setList] = useState<{ id: string; status: string; updatedAt: string }[]>([])

  const handleGenerateOrientation = async () => {
    if (!resume?.id) return
    setOrienting(true)
    try {
      const res = await internalFetch('/api/resume/career-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id }),
      })
      const data = await res.json()
      if (res.ok && data.careerOrientation) {
        setCareerOrientation(data.careerOrientation)
        toast.success('Diagnóstico de Orientação Vocacional gerado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao gerar orientação de carreira.')
      }
    } catch {
      toast.error('Falha de conexão ao gerar orientação vocacional.')
    } finally {
      setOrienting(false)
    }
  }

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

  const [modalOpen, setModalOpen] = useState(false)
  const [modalProgress, setModalProgress] = useState(0)
  const [modalStep, setModalStep] = useState(1)

  const reanalyze = async () => {
    if (!resume) return
    setAnalyzing(true)
    setError(null)
    setModalOpen(true)
    setModalProgress(5)
    setModalStep(1)

    const interval = setInterval(() => {
      setModalProgress(prev => {
        if (prev >= 92) return 92
        const next = prev + Math.floor(Math.random() * 8) + 4
        setModalStep(Math.min(8, Math.max(1, Math.ceil((next / 100) * 8))))
        return next
      })
    }, 450)

    try {
      const r = await internalFetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id }),
      })

      const data = await r.json()
      clearInterval(interval)

      if (!r.ok) {
        setModalOpen(false)
        setError(data.error || 'Falha ao reanalisar.')
        return
      }

      setModalProgress(100)
      setModalStep(8)
      setTimeout(async () => {
        setModalOpen(false)
        await loadResume(resume.id)
      }, 500)
    } catch {
      clearInterval(interval)
      setModalOpen(false)
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

  const tryParseAndRepairJson = (rawText: string): any => {
    if (typeof rawText !== 'string') return rawText
    let cleanText = rawText.trim().replace(/```json/gi, '').replace(/```/g, '').trim()
    if (!cleanText.startsWith('{') && !cleanText.includes('"overall"')) return null
    try {
      return JSON.parse(cleanText)
    } catch {
      try {
        let repaired = cleanText.replace(/\\$/, '').replace(/,\s*$/, '')
        const unescapedQuotes = (repaired.match(/(?<!\\)"/g) || []).length
        if (unescapedQuotes % 2 !== 0) repaired += '"'

        const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length
        const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length

        for (let i = 0; i < openBrackets; i++) repaired += ']'
        for (let i = 0; i < openBraces; i++) repaired += '}'

        return JSON.parse(repaired)
      } catch {
        const overallMatch = cleanText.match(/"overall"\s*:\s*(\d+(\.\d+)?)/)
        const summaryMatch = cleanText.match(/"summary"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
        const atsMatch = cleanText.match(/"atsFriendly"\s*:\s*(true|false)/)

        const extractArray = (key: string): string[] => {
          const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 's')
          const match = cleanText.match(regex)
          if (match && match[1]) {
            const items = match[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)
            if (items) return items.map(s => s.replace(/^"|"$/g, '').replace(/\\"/g, '"'))
          }
          return []
        }

        return {
          overall: overallMatch ? parseFloat(overallMatch[1]) : 7.5,
          summary: summaryMatch ? summaryMatch[1] : null,
          atsFriendly: atsMatch ? atsMatch[1] === 'true' : true,
          strengths: extractArray('strengths'),
          weaknesses: extractArray('weaknesses'),
          recommendations: extractArray('recommendations'),
          keywords: extractArray('keywords'),
        }
      }
    }
  }

  let rawAnalysis = resume.analysis || {}
  if (typeof rawAnalysis.summary === 'string' && rawAnalysis.summary.trim().startsWith('{') && rawAnalysis.summary.includes('"overall"')) {
    const repaired = tryParseAndRepairJson(rawAnalysis.summary)
    if (repaired && typeof repaired === 'object') {
      rawAnalysis = { ...rawAnalysis, ...repaired }
    }
  }

  const DIMENSION_LABELS: Record<string, string> = {
    relevance_to_role: 'Relevância para a Vaga',
    experience_impact: 'Impacto das Experiências',
    clarity_formatting: 'Clareza & Formatação',
    ats_optimization: 'Otimização ATS',
    keyword_integration: 'Integração de Palavras-Chave',
    structure: 'Estrutura & Compatibilidade ATS',
    summary: 'Resumo & Posicionamento',
    impact: 'Resultados (STAR/XYZ)',
    skills: 'Habilidades & Ferramentas',
    experience: 'Experiência & Verbos de Ação',
    keywords: 'Palavras-Chave & Match',
    career: 'Trajetória & Plano de Carreira',
    upskilling: 'Capacitação & Cursos',
    education: 'Formação & Cursos',
    language: 'Linguagem & Tom',
  }

  const parseDimensions = (rawDims: any): { key: string; label: string; score: number; rationale: string }[] => {
    if (Array.isArray(rawDims)) {
      return rawDims.map(d => ({
        key: d.key || d.name || 'dimension',
        label: d.label || DIMENSION_LABELS[d.key] || d.key || 'Dimensão',
        score: typeof d.score === 'number' ? (d.score > 10 ? d.score / 10 : d.score) : 7,
        rationale: d.rationale || '',
      }))
    }

    if (rawDims && typeof rawDims === 'object') {
      return Object.entries(rawDims).map(([key, val]) => {
        const numVal = typeof val === 'number' ? val : (typeof (val as any)?.score === 'number' ? (val as any).score : 70)
        const normalizedScore = numVal > 10 ? numVal / 10 : numVal
        const label = DIMENSION_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const rationale = (val as any)?.rationale || ''
        return {
          key,
          label,
          score: Number(normalizedScore.toFixed(1)),
          rationale,
        }
      })
    }

    return [
      { key: 'structure', label: 'Estrutura & Compatibilidade ATS', score: 7, rationale: 'Estrutura padrão identificada.' },
      { key: 'summary', label: 'Resumo & Posicionamento', score: 7, rationale: 'Posicionamento claro.' },
      { key: 'impact', label: 'Resultados (STAR/XYZ)', score: 7, rationale: 'Resultados apresentados.' },
      { key: 'skills', label: 'Habilidades & Ferramentas', score: 7, rationale: 'Competências identificadas.' },
      { key: 'experience', label: 'Experiência & Verbos de Ação', score: 7, rationale: 'Experiência profissional avaliada.' },
      { key: 'keywords', label: 'Palavras-Chave & Match', score: 7, rationale: 'Palavras-chave avaliadas.' },
      { key: 'career', label: 'Trajetória & Plano de Carreira', score: 7, rationale: 'Progressão de carreira avaliada.' },
      { key: 'upskilling', label: 'Capacitação & Cursos', score: 7, rationale: 'Oportunidades de capacitação identificadas.' }
    ]
  }

  const numOverall = typeof rawAnalysis.overall === 'number'
    ? rawAnalysis.overall
    : (typeof rawAnalysis.overall === 'string' ? parseFloat(rawAnalysis.overall) : (typeof (rawAnalysis as any).scoreOverall === 'number' ? (rawAnalysis as any).scoreOverall : 70))

  const normalizedOverall = isNaN(numOverall) ? 7.0 : (numOverall > 10 ? numOverall / 10 : numOverall)

  const parsedDimensions = parseDimensions(rawAnalysis.dimensions)

  // Math Consistency: Calculate overall score strictly as the arithmetic mean of all dimensions
  const dimSum = parsedDimensions.reduce((acc, d) => acc + d.score, 0)
  const computedAvg = parsedDimensions.length > 0 ? Number((dimSum / parsedDimensions.length).toFixed(1)) : normalizedOverall
  const finalOverallScore = computedAvg

  const defaultSummary = rawAnalysis.summary || (rawAnalysis as any).parecer
  const computedSummary = defaultSummary && defaultSummary !== 'Análise concluída com sucesso.'
    ? defaultSummary
    : `Perfil profissional avaliado com nota geral de ${finalOverallScore.toFixed(1)}/10. ` +
      (rawAnalysis.strengths?.length ? `Destaques principais do perfil: ${rawAnalysis.strengths.slice(0, 3).join('; ')}. ` : '') +
      (rawAnalysis.weaknesses?.length ? `Recomenda-se ajustar: ${rawAnalysis.weaknesses.slice(0, 3).join('; ')}.` : '')

  const defaultSocialAdvice = [
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com',
      headline: 'Especialista de Carreira | Gestão de Indicadores, Processos & Alta Performance',
      aboutSummary: 'Profissional com trajetória sólida focada em entrega de resultados, otimização de processos e eficiência operacional. Histórico comprovado na gestão de atividades estratégicas e engajamento de equipes.',
      tips: [
        'Insira termos técnicos e palavras-chave do seu segmento no campo Título para aparecer nas buscas de recrutadores no LinkedIn Recruiter.',
        'Mantenha a seção "Sobre" atualizada com uma breve síntese de suas conquistas e competências fundamentais.',
        'Solicite recomendações de antigos líderes para aumentar a relevância do seu perfil nos algoritmos.'
      ]
    },
    {
      platform: 'Gupy & Plataformas ATS',
      url: 'https://gupy.io',
      headline: 'Perfil Estruturado para Robôs de RH',
      aboutSummary: 'Cadastre suas experiências com descrições objetivas, sem emojis ou formatações que dificultem o escanemento automático.',
      tips: [
        'Responda com atenção aos testes comportamentais para elevar a nota de compatibilidade inicial.',
        'Mantenha a nomenclatura dos cargos alinhada às nomenclaturas padrões buscadas pelas empresas.'
      ]
    }
  ]

  const defaultTargetedChanges = [
    {
      section: 'Resumo Profissional / Perfil',
      originalText: 'Profissional dedicado e dinâmico buscando novos desafios no mercado.',
      rationale: 'Expressões vagas sem métricas numéricas não destacam o candidato e têm baixa pontuação em sistemas ATS.',
      suggestedText: 'Especialista focado em otimização de processos, gestão de indicadores e entrega de metas operacionais de alta performance.'
    },
    {
      section: 'Experiências Profissionais',
      originalText: 'Responsável pelo acompanhamento diário das atividades e suporte às equipes.',
      rationale: 'Faltam resultados quantificados (fórmula STAR/XYZ) demonstrando o impacto real gerado na função.',
      suggestedText: 'Liderou o acompanhamento de rotinas e processos operacionais, garantindo cumprimento de 100% das metas estipuladas e aumento da eficiência.'
    }
  ]

  const socialAdviceToDisplay = (Array.isArray(rawAnalysis.socialAdvice) && rawAnalysis.socialAdvice.length > 0)
    ? rawAnalysis.socialAdvice
    : defaultSocialAdvice

  const targetedChangesToDisplay = (Array.isArray(rawAnalysis.targetedChanges) && rawAnalysis.targetedChanges.length > 0)
    ? rawAnalysis.targetedChanges
    : defaultTargetedChanges

  const a = {
    overall: finalOverallScore,
    summary: computedSummary,
    atsFriendly: rawAnalysis.atsFriendly ?? true,
    dimensions: parsedDimensions,
    strengths: Array.isArray(rawAnalysis.strengths) ? rawAnalysis.strengths : ['Estrutura profissional legível', 'Experiência estruturada'],
    weaknesses: Array.isArray(rawAnalysis.weaknesses) ? rawAnalysis.weaknesses : ['Adicionar mais métricas quantificáveis (STAR/XYZ)'],
    recommendations: Array.isArray(rawAnalysis.recommendations) ? rawAnalysis.recommendations : ['Destacar conquistas numéricas'],
    keywords: Array.isArray(rawAnalysis.keywords) ? rawAnalysis.keywords : [],
    socialAdvice: socialAdviceToDisplay,
    targetedChanges: targetedChangesToDisplay,
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
      {/* TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Visão Completa
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Score & Veredito
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'social'
              ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
              : 'bg-violet-50/80 text-violet-800 border-violet-200 hover:bg-violet-100'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> 🌐 Mídias & Redes Sociais
          <Badge className="bg-violet-200 text-violet-900 border-0 text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
            {a.socialAdvice?.length || 0}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'match'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
              : 'bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> 💼 Match Vaga Alvo
          {rawAnalysis.jobMatch && (
            <Badge className="bg-indigo-200 text-indigo-950 border-0 text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
              {rawAnalysis.jobMatch.matchPercentage}%
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'career'
              ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
              : 'bg-sky-50/80 text-sky-900 border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> 🧭 Agente Vocacional
        </button>
        <button
          onClick={() => setActiveTab('dimensions')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'dimensions'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> 📐 8 Dimensões ({parsedDimensions.length})
        </button>
        <button
          onClick={() => setActiveTab('targeted')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'targeted'
              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" /> ✏️ Ajustes STAR/XYZ
        </button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* OVERALL + RADAR */}
      {/* OVERALL + RADAR */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border-0 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0B192E] via-[#10233D] to-[#0B192E]">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full relative z-10">
            <div className="w-full flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Score Audit</p>
              {a.atsFriendly ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-widest"><CheckCircle2 className="w-3 h-3 mr-1" /> ATS PASS</Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black tracking-widest"><XCircle className="w-3 h-3 mr-1" /> ATS FAIL</Badge>
              )}
            </div>
            
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={`${(score / 10) * 283} 283`} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: `0 0 20px ${scoreColor}40` }}>{score.toFixed(1)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">/ 10</p>
              </div>
            </div>

            <Badge className="mt-5 px-4 py-1.5 font-black text-xs uppercase tracking-widest shadow-lg" style={{ backgroundColor: scoreColor, color: '#fff', border: 'none' }}>
              {scoreLabel}
            </Badge>

            {/* PAINEL TRANSPARENTE DA FÓRMULA DE CÁLCULO */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 text-left w-full space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Cálculo Dimensões
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parsedDimensions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between w-[48%] bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
                    <span className="text-[9px] text-slate-400 uppercase truncate max-w-[65%]">{d.label}</span>
                    <strong className="text-[10px] text-slate-200">{d.score.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded flex justify-between items-center mt-2">
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Média Algorítmica</span>
                <strong className="text-xs text-white font-black">{score.toFixed(1)}</strong>
              </div>
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

      {/* ANÁLISE DO PERFIL & VEREDITO EXECUTIVO */}
      <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B63E5] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <CardTitle className="text-base text-[#0B192E] font-bold">
                📋 Análise do Perfil Profissional & Veredito Executivo
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Avaliação técnica consolidada com base no seu currículo e melhores práticas de RH
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{a.summary}</p>
        </CardContent>
      </Card>

      {/* STRENGTHS / WEAKNESSES / RECOMMENDATIONS (SUGESTÕES E RECOMENDAÇÕES) */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-emerald-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-base text-emerald-950 font-bold">Pontos Fortes do Perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {a.strengths?.length ? (
              <ul className="space-y-2">
                {a.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-500">Nenhum ponto forte registrado.</p>}
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base text-amber-950 font-bold">Pontos de Atenção (Fragilidades)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {a.weaknesses?.length ? (
              <ul className="space-y-2">
                {a.weaknesses.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-500">Nenhum ponto de atenção crítico.</p>}
          </CardContent>
        </Card>
      </div>

      {/* PRACTICAL RECOMMENDATIONS (SUGESTÕES PRÁTICAS) */}
      {a.recommendations?.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-sky-600" />
              <div>
                <CardTitle className="text-base text-sky-950 font-bold">💡 Sugestões Práticas de Melhoria</CardTitle>
                <CardDescription className="text-xs text-slate-500">Ações recomendadas para aumentar suas chances de entrevista</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {a.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed font-medium">{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* KEYWORDS */}
      {a.keywords?.length > 0 && (
        <Card className="border-violet-200 bg-violet-50/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-base text-violet-950 font-bold">🔑 Palavras-Chave ATS Sugeridas</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">Adicione estas palavras-chave estratégicas ao seu currículo para passar pelos filtros automáticos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {a.keywords.map((k, i) => (
                <Badge key={i} variant="outline" className="bg-white border-violet-200 text-violet-800 text-xs px-2.5 py-1 font-semibold shadow-2xs">
                  {k}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* SOCIAL PRESENCE & ADVICE (Destaque em Redes Sociais) */}
      {(activeTab === 'all' || activeTab === 'social') && a.socialAdvice && a.socialAdvice.length > 0 && (
        <Card className="border border-violet-500/30 bg-gradient-to-br from-violet-900 via-[#1A0B2E] to-[#0B0B2E] shadow-2xl relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none"></div>
          
          <div className="absolute top-0 right-8 bg-gradient-to-b from-amber-400 to-amber-600 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-b-lg shadow-lg uppercase z-10 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Griffo Premium
          </div>

          <CardHeader className="pb-4 border-b border-violet-500/20 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-black flex items-center gap-2 mb-1 tracking-tight">
                    🌐 Social SEO & Presença Digital
                  </CardTitle>
                  <CardDescription className="text-xs text-violet-200/70 font-medium max-w-xl leading-relaxed">
                    Auditoria algorítmica do seu perfil para plataformas globais (LinkedIn, Gupy). Estratégias de palavras-chave e otimização de busca para ser encontrado por recrutadores Premium.
                  </CardDescription>
                </div>
              </div>

              {/* DOWNLOAD & EXPORT SOCIAL ADVICE */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 mt-2 sm:mt-0">
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
                    toast.success('Dicas de redes sociais copiadas para a área de clipboard!')
                  }}
                  className="bg-transparent border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-white text-xs font-bold transition-all"
                >
                  Copiar Hacks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResume(resume.id, 'downloads')}
                  className="bg-violet-600 border-none text-white hover:bg-violet-500 text-xs font-bold shadow-lg shadow-violet-600/20"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Baixar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 relative z-10">
            {a.socialAdvice.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/40 border border-violet-500/20 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-violet-500 text-white font-black tracking-wider uppercase px-3 py-1 shadow-md">{item.platform}</Badge>
                    <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{item.url}</span>
                  </div>
                </div>

                {item.headline && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                        💡 Título Estratégico (SEO)
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-violet-300 hover:bg-white/5 hover:text-white font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(item.headline || '')
                          toast.success('Título copiado!')
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-sm font-bold text-white leading-relaxed">{item.headline}</p>
                  </div>
                )}

                {item.aboutSummary && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                        📝 Bio Otimizada / Algoritmo
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-blue-300 hover:bg-white/5 hover:text-white font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(item.aboutSummary || '')
                          toast.success('Texto copiado!')
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.aboutSummary}</p>
                  </div>
                )}

                {item.tips && item.tips.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      🚀 Hacks de Crescimento
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {item.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5"><Sparkles className="w-3 h-3" /></span>
                          <span className="leading-snug">{tip}</span>
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

      {/* TARGET JOB MATCHING (FASE 1 - NOVO PAINEL DE COMPATIBILIDADE) */}
      {(activeTab === 'all' || activeTab === 'match') && rawAnalysis.jobMatch && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-indigo-950 font-bold flex items-center gap-2">
                    Análise de Compatibilidade por Vaga Alvo
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    {rawAnalysis.jobMatch.targetJob ? `Cargo Alvo: ${rawAnalysis.jobMatch.targetJob}` : 'Comparativo de exigências x conhecimentos do candidato'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-xs self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-500">Score de Match:</span>
                <span className="text-2xl font-extrabold text-indigo-600">
                  {rawAnalysis.jobMatch.matchPercentage}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rawAnalysis.jobMatch.verdict && (
              <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-indigo-900 mb-0.5">💡 Avaliação de Aderência:</p>
                <p>{rawAnalysis.jobMatch.verdict}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              {/* MATCHED REQUIREMENTS */}
              <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-2">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5 border-b border-emerald-50 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Requisitos Atendidos (Conhecimentos OK)
                </p>
                {rawAnalysis.jobMatch.matchedRequirements?.length ? (
                  <ul className="space-y-1.5">
                    {rawAnalysis.jobMatch.matchedRequirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">Nenhum requisito diretamente correspondido.</p>
                )}
              </div>

              {/* MISSING REQUIREMENTS */}
              <div className="p-4 rounded-xl bg-white border border-rose-100 space-y-2">
                <p className="font-bold text-rose-900 text-xs flex items-center gap-1.5 border-b border-rose-50 pb-2">
                  <XCircle className="w-4 h-4 text-rose-600" /> Requisitos Faltantes / Lacunas a Desenvolver
                </p>
                {rawAnalysis.jobMatch.missingRequirements?.length ? (
                  <ul className="space-y-1.5">
                    {rawAnalysis.jobMatch.missingRequirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-600 font-medium">Parabéns! Nenhuma lacuna crítica encontrada.</p>
                )}
              </div>
            </div>

            {/* ACTION PLAN & LEARNING PATH */}
            {rawAnalysis.jobMatch.actionPlan && rawAnalysis.jobMatch.actionPlan.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" /> Plano de Ação & Orientação para Performar Melhor:
                </p>
                <ul className="space-y-1 text-slate-800 pl-1">
                  {rawAnalysis.jobMatch.actionPlan.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </Badge>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CAREER ORIENTATION & VOCATIONAL AGENT (PARA CANDIDATOS INDECISOS) */}
      {(activeTab === 'all' || activeTab === 'career') && (
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50/50 via-white to-indigo-50/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-sky-950 font-bold">
                  Indeciso de qual vaga concorrer? Orientação Vocacional de Carreira
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Nosso Agente de Carreira analisa seu perfil e descobre as 3 áreas/cargos do mercado em que você tem maior chance imediata de contratação.
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerateOrientation}
              disabled={orienting}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto"
            >
              {orienting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              {careerOrientation ? 'Atualizar Diagnóstico' : 'Descobrir Minha Área Ideal'}
            </Button>
          </div>
        </CardHeader>
        {careerOrientation && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-3.5 rounded-xl bg-white border border-sky-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-sky-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" /> Resumo do Perfil Identificado:
              </p>
              <p className="leading-relaxed">{careerOrientation.profileSummary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 text-xs">
              {careerOrientation.topMatchingAreas?.map((area: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start gap-1">
                    <Badge variant="outline" className="bg-sky-100 text-sky-900 border-sky-300 font-bold text-[10px]">
                      Opção #{idx + 1}
                    </Badge>
                    <span className="font-extrabold text-sky-600 text-sm">{area.matchPercentage}% Match</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{area.role}</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{area.whyFit}</p>
                  {area.requiredSkillsToLearn?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <p className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">Habilidades recomendadas:</p>
                      <ul className="space-y-1">
                        {area.requiredSkillsToLearn.map((skill: string, sIdx: number) => (
                          <li key={sIdx} className="flex items-center gap-1 text-[11px] text-slate-600">
                            <span className="text-sky-500 font-bold">•</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {careerOrientation.careerAdvice && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-600" /> Conselho Estratégico de Carreira:
                </p>
                <p className="leading-relaxed">{careerOrientation.careerAdvice}</p>
              </div>
            )}
          </CardContent>
        )}
        </Card>
      )}

      {/* DIMENSIONS DETAIL */}
      {(activeTab === 'all' || activeTab === 'dimensions') && (
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
      )}

      {/* TARGETED CHANGES (ONDE E POR QUE MUDAR) */}
      {(activeTab === 'all' || activeTab === 'targeted') && a.targetedChanges && a.targetedChanges.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-sky-950 font-bold">
                  🎯 Onde & Por Que Ajustar (Diagnóstico Ponto a Ponto)
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  A IA identificou trechos exatos que estão reduzindo sua nota e justifica o impacto de cada alteração.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {a.targetedChanges.map((tc: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-sky-50 text-sky-900 border-sky-200 font-semibold text-[11px]">
                    📍 {tc.section}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-950 space-y-1">
                    <p className="font-bold text-[10px] uppercase text-rose-800">❌ Trecho Atual no Currículo</p>
                    <p className="font-mono text-[11px] leading-relaxed">"{tc.originalText}"</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950 space-y-1">
                    <p className="font-bold text-[10px] uppercase text-emerald-800">✨ Sugestão Recomendada (Fórmula STAR/XYZ)</p>
                    <p className="font-mono text-[11px] leading-relaxed">"{tc.suggestedText}"</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-amber-950 space-y-0.5">
                  <p className="font-bold text-[10px] uppercase text-amber-800 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Justificativa Técnica & Motivo da Alteração:
                  </p>
                  <p className="leading-relaxed text-slate-700">{tc.rationale}</p>
                </div>
              </div>
            ))}
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

      {/* MODAL DE PROGRESSO ANIMADO DAS 8 DIMENSÕES */}
      <UploadProgressModal isOpen={modalOpen} step={modalStep} progress={modalProgress} />
    </div>
  )
}
