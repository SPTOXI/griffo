'use client'

import { useEffect, useRef, useState } from 'react'
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
import {
  ProfileConflictPrompt,
  wasConflictDismissed,
  type ProfileConflict,
} from './profile-conflict-prompt'
import { useAnalysisJob } from './use-analysis-job'
import { SocialAnalysisPanel, type SocialAnalysis } from './social-analysis-panel'
import { internalFetch } from '@/lib/internal-fetch'
import { notifyBalanceChanged } from '@/hooks/use-analyses'
import { AnalysisPaywall } from './analysis-paywall'
import { RepurchaseUpsell } from './repurchase-upsell'
import { toast } from 'sonner'

interface TargetedChange {
  section: string
  originalText: string
  rationale: string
  suggestedText: string
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
}

// Ensure rawAnalysis access is also typed
interface RawAnalysis extends Partial<Analysis> {
  [key: string]: unknown
}

/** Carta e resumo profissional direcionado, produzidos por /api/resume/cover-letter. */
interface CoverLetter {
  coverLetter: string
  professionalSummary: string
  keywords: string[]
  targetJob: string | null
  generatedAt: string
}

interface Resume {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  originalContent: string
  analysis: Analysis | null
  rewrittenContent: string | null
  socialAnalysis?: SocialAnalysis | null
  coverLetter?: CoverLetter | null
  socialLinks?: Record<string, string>
  /// Este currículo já consumiu uma análise do saldo? É o que separa o laudo
  /// do paywall.
  unlocked?: boolean
  /// Prévia gratuita: só as notas.
  preview?: { overall: number; dimensions: { key: string; label: string; score: number }[] } | null
}

export function AnalysisView() {
  const { activeResumeId, setView, openResume } = useNav()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [orienting, setOrienting] = useState(false)
  const [careerOrientation, setCareerOrientation] = useState<any>(null)
  // O desfecho da orientação vivia só num toast, que some sozinho em segundos.
  // Quando a chamada falhava, o card voltava ao estado inicial sem explicação
  // nenhuma — o spinner girava, parava, e nada aparecia no lugar.
  const [orientationError, setOrientationError] = useState<string | null>(null)
  const [writingLetter, setWritingLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [letterError, setLetterError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'social' | 'match' | 'career' | 'dimensions' | 'targeted' | 'letter'>('all')
  const [list, setList] = useState<{ id: string; status: string; updatedAt: string }[]>([])
  /**
   * Currículos cuja análise já foi disparada automaticamente nesta sessão.
   *
   * É um `useRef` porque é exatamente o que o React chama de ref: valor mutável
   * que atravessa renderizações e cujo conteúdo NÃO deve provocar nova
   * renderização — marcar um disparo não muda nada na tela. Estava escrito como
   * `useState({})[0]`, guardando o valor inicial e mutando o objeto por dentro,
   * o que produz o mesmo efeito por acidente e viola a regra de imutabilidade
   * do estado: o React não garante identidade do valor inicial entre
   * renderizações, e a mutação é invisível para ele.
   */
  const autoTriggeredRef = useRef<Record<string, boolean>>({})

  const handleGenerateOrientation = async () => {
    if (!resume?.id) return
    setOrienting(true)
    setOrientationError(null)
    try {
      const res = await internalFetch('/api/resume/career-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id }),
      })

      // Um encerramento pelo limite de tempo da plataforma devolve HTML, não
      // JSON. Sem este tratamento a exceção do `json()` caía no `catch` e virava
      // "falha de conexão", que descreve a causa errada.
      const data = await res.json().catch(() => null)

      if (res.ok && data?.careerOrientation) {
        setCareerOrientation(data.careerOrientation)
        toast.success('Diagnóstico de Orientação Vocacional gerado com sucesso!')
      } else if (data?.code === 'ANALYSIS_REQUIRED') {
        // Este currículo ainda não foi liberado. A orientação não tem preço
        // próprio: o que falta é a Análise Completa dele.
        const msg = data.error
        setOrientationError(msg)
        toast.error(msg)
      } else {
        const msg =
          data?.error ||
          'O diagnóstico não pôde ser concluído nesta tentativa. Nada foi cobrado — tente novamente.'
        setOrientationError(msg)
        toast.error(msg)
      }
    } catch {
      const msg = 'Falha de conexão ao gerar a orientação vocacional. Verifique sua internet e tente de novo.'
      setOrientationError(msg)
      toast.error(msg)
    } finally {
      setOrienting(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!resume?.id) return
    setWritingLetter(true)
    setLetterError(null)
    try {
      const res = await internalFetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id }),
      })
      // Mesmo tratamento da orientação: um encerramento por limite de tempo da
      // plataforma devolve HTML, e deixar a exceção do `json()` cair no `catch`
      // faria o erro ser descrito como falha de conexão, que é causa errada.
      const data = await res.json().catch(() => null)

      if (res.ok && data?.coverLetter) {
        setCoverLetter(data.coverLetter)
        toast.success('Carta de apresentação e resumo profissional gerados.')
      } else {
        const msg =
          data?.error ||
          'A carta não pôde ser redigida nesta tentativa. Nada foi cobrado — tente novamente.'
        setLetterError(msg)
        toast.error(msg)
      }
    } catch {
      const msg = 'Falha de conexão ao gerar a carta. Verifique sua internet e tente de novo.'
      setLetterError(msg)
      toast.error(msg)
    } finally {
      setWritingLetter(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiado.`)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  /**
   * Carrega o currículo e nada mais.
   *
   * Ela chamava `reanalyze` no fim, o que fechava um ciclo entre as duas: a
   * carga disparava a análise, a análise avisava o fim pelo `onCompleted` do
   * `useAnalysisJob`, e o `onCompleted` chamava a carga de novo. Num ciclo não
   * existe ordem de declaração possível — uma das duas sempre seria usada antes
   * de existir, e uma referência assim não acompanha as mudanças de valor ao
   * longo do tempo.
   *
   * A decisão de disparar saiu daqui e virou um efeito próprio, depois de
   * `reanalyze` estar declarada. A carga volta a ser só carga.
   */
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
      if (data.resume?.careerOrientation) {
        setCareerOrientation(data.resume.careerOrientation)
      }
      if (data.resume?.coverLetter) {
        setCoverLetter(data.resume.coverLetter)
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
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

  // O currículo em análise fica num ref: o desfecho chega por retorno de
  // chamada, possivelmente depois de o estado ter mudado.
  const analyzingIdRef = useRef<string | null>(null)

  /**
   * O currículo recém-analisado contradiz o Perfil Profissional?
   *
   * A verificação custa uma leitura de IA, então roda UMA vez por currículo, ao
   * fim da análise — e não a cada abertura da tela. Se a pessoa já respondeu
   * (inclusive "manter como está"), não roda de novo.
   *
   * Nunca bloqueia nada: falha aqui é silêncio, porque isto é um aviso sobre o
   * perfil e não parte do laudo que foi pago.
   */
  const [conflicts, setConflicts] = useState<{ resumeId: string; list: ProfileConflict[] } | null>(
    null
  )
  const conflictCheckedRef = useRef<Record<string, boolean>>({})

  const checkProfileConflicts = async (id: string) => {
    if (conflictCheckedRef.current[id] || wasConflictDismissed(id)) return
    conflictCheckedRef.current[id] = true

    try {
      const r = await internalFetch('/api/user/professional-profile/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: id }),
      })
      if (!r.ok) return
      const data = await r.json()
      if (Array.isArray(data.conflicts) && data.conflicts.length > 0) {
        setConflicts({ resumeId: id, list: data.conflicts })
      }
    } catch {
      // Sem aviso é melhor que um erro sobre uma verificação que o usuário
      // nem pediu.
    }
  }

  const job = useAnalysisJob({
    onCompleted: () => {
      setAnalyzing(false)
      const id = analyzingIdRef.current
      if (id) {
        void loadResume(id)
        // Depois do laudo, e fora do caminho dele: a pergunta sobre o perfil
        // não pode atrasar a entrega que a pessoa está esperando.
        void checkProfileConflicts(id)
      }
    },
    onFailed: (message, code) => {
      setAnalyzing(false)
      setError(message)
      // Uma falha de processamento não desfaz o destrave: o currículo continua
      // liberado e a análise pode ser repetida sem nova cobrança. O saldo só
      // muda quando um currículo NOVO é destravado.
      if (code === 'ANALYSIS_REQUIRED') notifyBalanceChanged()
    },
  })

  const reanalyze = async (targetResume?: any) => {
    const activeResume = targetResume || resume
    if (!activeResume) return
    analyzingIdRef.current = activeResume.id
    setAnalyzing(true)
    setError(null)
    // Volta em milissegundos com o id do job. O que era uma espera de até 82s
    // segurando a conexão virou uma assinatura de progresso — e a rota devolve
    // a análise já em andamento se houver uma, em vez de abrir outra e cobrar
    // duas vezes.
    await job.start(activeResume.id)
  }

  /**
   * Disparo automático da análise.
   *
   * Só depois de o currículo estar liberado: antes disso, disparar sozinho
   * consumiria uma análise do saldo sem que ninguém tivesse pedido — e a decisão
   * de gastar é do usuário, na tela do paywall.
   *
   * `autoTriggeredRef` guarda quais currículos já foram disparados nesta sessão.
   * Sem ele, uma segunda carga do mesmo currículo (a que o `onCompleted` faz,
   * por exemplo) dispararia a análise de novo.
   */
  useEffect(() => {
    if (!resume?.unlocked || resume.analysis) return
    if (autoTriggeredRef.current[resume.id]) return
    autoTriggeredRef.current[resume.id] = true
    void reanalyze(resume)
  }, [resume])


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Carregando análise do currículo...</p>
      </div>
    )
  }

  if (error && !resume) {
    return (
      <Alert variant="destructive" className="max-w-xl">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!resume) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-600">Nenhum currículo encontrado para exibir a análise.</p>
        <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">
          Enviar currículo
        </Button>
      </div>
    )
  }

  // Currículo não liberado: a nota sai de graça, o laudo não.
  if (!resume.unlocked && !resume.analysis) {
    return (
      <AnalysisPaywall
        resumeId={resume.id}
        preview={resume.preview ?? null}
        onUnlocked={() => {
          autoTriggeredRef.current[resume.id] = true
          setResume({ ...resume, unlocked: true })
          // O saldo é debitado dentro deste POST; só depois dele o número novo
          // existe para ser lido.
          void reanalyze(resume).then(notifyBalanceChanged)
        }}
      />
    )
  }

  if (!resume.analysis) {
    /**
     * A PRIMEIRA análise mostrava um giro sem etapa, sem número e sem
     * referência.
     *
     * O modal de progresso existia e era montado no fim deste componente — mas
     * este `return` acontece antes, e só deixa de acontecer quando
     * `resume.analysis` existe. Ou seja: a animação boa só aparecia na
     * RE-análise, e justamente a primeira vez, que é quando a pessoa está
     * decidindo se confia no produto, caía no giro mudo. Ela via a animação do
     * envio piscar, trocar de tela, e começar uma segunda espera que não
     * dizia nada — e, cinco minutos depois, uma mensagem de tempo.
     *
     * Agora a mesma animação cobre as duas: o laudo é escrito à vista, com as
     * notas acendendo conforme chegam, e a tela por baixo já é a do relatório.
     */
    const jobRunning = job.phase === 'starting' || job.phase === 'running'

    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Laudo de análise</h1>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-slate-800 font-semibold text-base">Iniciando análise preditiva em 8 dimensões...</p>
            <p className="text-xs text-slate-500">Seu laudo está sendo processado automaticamente pela IA sem necessidade de novos cliques.</p>
            {error && (
              <div className="pt-2">
                <Alert variant="destructive" className="mb-3"><AlertCircle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>
                <Button onClick={() => reanalyze()} className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tentar novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <UploadProgressModal
          isOpen={jobRunning}
          progress={job.progress}
          completedSegments={job.completedSegments}
          partial={job.partial}
        />
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
  // Compatibilidade com laudos gravados antes dos structured outputs, quando o
  // JSON inteiro podia acabar dentro do campo `summary`. Laudos novos já vêm no
  // formato correto; isto pode sair quando os registros antigos expirarem.
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

  /**
   * Dimensões realmente presentes no laudo — nunca uma lista de reserva.
   *
   * A versão anterior devolvia oito dimensões com nota 7 e justificativas
   * genéricas ("Estrutura padrão identificada.") quando o laudo não trazia
   * dimensão nenhuma, e substituía por 7 qualquer nota que não fosse número.
   * Num produto de inteligência de carreira isso é o defeito mais caro que
   * existe: a pessoa pagou por um diagnóstico do currículo DELA e recebia um
   * número inventado, indistinguível de um número medido.
   *
   * Uma dimensão sem nota utilizável é descartada. Zero dimensões utilizáveis
   * devolve lista vazia, e quem renderiza avisa a ausência.
   */
  const parseDimensions = (rawDims: any): { key: string; label: string; score: number; rationale: string }[] => {
    const usableScore = (v: unknown): number | null => {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN
      if (!Number.isFinite(n) || n < 0) return null
      // Laudos antigos gravavam a escala em 0–100.
      return Number((n > 10 ? n / 10 : n).toFixed(1))
    }

    if (Array.isArray(rawDims)) {
      return rawDims
        .map((d) => ({ d, score: usableScore(d?.score) }))
        .filter((x): x is { d: any; score: number } => x.score !== null)
        .map(({ d, score }) => ({
          key: d.key || d.name || 'dimension',
          label: d.label || DIMENSION_LABELS[d.key] || d.key || 'Dimensão',
          score,
          rationale: d.rationale || '',
        }))
    }

    if (rawDims && typeof rawDims === 'object') {
      return Object.entries(rawDims)
        .map(([key, val]) => ({
          key,
          val,
          score: usableScore(typeof val === 'number' ? val : (val as any)?.score),
        }))
        .filter((x): x is { key: string; val: any; score: number } => x.score !== null)
        .map(({ key, val, score }) => ({
          key,
          label: DIMENSION_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          score,
          rationale: (val as any)?.rationale || '',
        }))
    }

    return []
  }

  const parsedDimensions = parseDimensions(rawAnalysis.dimensions)

  /**
   * Nota geral: média aritmética das dimensões medidas, e nada além disso.
   *
   * Sem dimensão utilizável não existe nota — antes o código caía para 7,0, um
   * "Bom" com selo verde que ninguém mediu. `null` percorre daqui até a tela,
   * onde vira aviso de ausência em vez de número.
   *
   * O `overall` gravado no laudo só é aceito como segunda opção porque laudos
   * antigos foram escritos antes de a média passar a ser derivada aqui.
   */
  const recordedOverall = (() => {
    const raw = rawAnalysis.overall ?? (rawAnalysis as any).scoreOverall
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN
    if (!Number.isFinite(n) || n <= 0) return null
    return Number((n > 10 ? n / 10 : n).toFixed(1))
  })()

  const finalOverallScore: number | null = parsedDimensions.length > 0
    ? Number((parsedDimensions.reduce((acc, d) => acc + d.score, 0) / parsedDimensions.length).toFixed(1))
    : recordedOverall

  // O texto do parecer é do modelo ou não existe. A versão anterior montava um
  // parágrafo com a nota e as três primeiras forças quando o parecer faltava, e
  // o apresentava no mesmo lugar, com a mesma tipografia, do parecer real.
  const rawSummary = rawAnalysis.summary || (rawAnalysis as any).parecer
  const computedSummary: string | null =
    typeof rawSummary === 'string' && rawSummary.trim() && rawSummary.trim() !== 'Análise concluída com sucesso.'
      ? rawSummary
      : null

  const a = {
    overall: finalOverallScore,
    summary: computedSummary,
    // `undefined` não é "passa no ATS": é "não avaliado". Tratá-lo como `true`
    // dava ao usuário um atestado que a análise não emitiu.
    atsFriendly: typeof rawAnalysis.atsFriendly === 'boolean' ? rawAnalysis.atsFriendly : null,
    dimensions: parsedDimensions,
    strengths: Array.isArray(rawAnalysis.strengths) ? rawAnalysis.strengths : [],
    weaknesses: Array.isArray(rawAnalysis.weaknesses) ? rawAnalysis.weaknesses : [],
    recommendations: Array.isArray(rawAnalysis.recommendations) ? rawAnalysis.recommendations : [],
    keywords: Array.isArray(rawAnalysis.keywords) ? rawAnalysis.keywords : [],
    // Sem exemplos de reserva. Um currículo sem alterações pontuais sugeridas
    // mostrava dois trechos fictícios — "Responsável pelo acompanhamento diário
    // das atividades" — como se tivessem sido lidos do currículo do usuário.
    targetedChanges: Array.isArray(rawAnalysis.targetedChanges) ? rawAnalysis.targetedChanges : [],
  }

  const score = a.overall
  const hasScore = score !== null
  const scoreColor = !hasScore ? '#64748b' : score >= 8 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626'
  const scoreLabel = !hasScore
    ? 'Não avaliado'
    : score >= 8 ? 'Excelente' : score >= 6.5 ? 'Bom' : score >= 5 ? 'Regular' : 'Precisa melhorar'

  const chartData = a.dimensions.map(d => ({
    dimension: (d.label || '').length > 20 ? (d.label || '').slice(0, 18) + '…' : (d.label || ''),
    score: Number(d.score || 0),
    fullMark: 10,
  }))

  return (
    <div className="space-y-5 max-w-5xl">
      {conflicts && conflicts.resumeId === resume.id && (
        <ProfileConflictPrompt
          resumeId={conflicts.resumeId}
          conflicts={conflicts.list}
          onResolved={() => setConflicts(null)}
        />
      )}

      {/* TAB NAVIGATION BAR */}
      {/* As abas quebram em várias linhas em vez de rolarem: a fila inteira é
          mais larga que o painel, e a rolagem escondia o fim do rótulo da aba
          que cai na borda direita ("8 Dimensões" virava "8 Dimensõ"). */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200">
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
            {resume.socialAnalysis?.profiles?.length || 0}
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
          onClick={() => setActiveTab('letter')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            activeTab === 'letter'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" /> ✉️ Carta & Resumo
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

      {/* UPSELL — dentro do resultado, e só depois da primeira compra */}
      <RepurchaseUpsell resumeId={resume.id} />

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
              {a.atsFriendly === true ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-widest"><CheckCircle2 className="w-3 h-3 mr-1" /> ATS PASS</Badge>
              ) : a.atsFriendly === false ? (
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black tracking-widest"><XCircle className="w-3 h-3 mr-1" /> ATS FAIL</Badge>
              ) : (
                <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-black tracking-widest">ATS NÃO AVALIADO</Badge>
              )}
            </div>

            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                {hasScore && (
                  <circle cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={`${(score / 10) * 283} 283`} className="transition-all duration-1000 ease-out" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {hasScore ? (
                  <>
                    <p className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: `0 0 20px ${scoreColor}40` }}>{score.toFixed(1)}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">/ 10</p>
                  </>
                ) : (
                  <p className="text-2xl font-black text-slate-500 tracking-tighter">—</p>
                )}
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
              {parsedDimensions.length > 0 ? (
                <>
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
                    <strong className="text-xs text-white font-black">{hasScore ? score.toFixed(1) : '—'}</strong>
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Este laudo não trouxe as notas por dimensão. Reprocesse a análise para obtê-las.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Desempenho por dimensão</p>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#475569' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#cbd5e1" />
                    <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center px-6">
                  <p className="text-sm text-slate-500">
                    Sem notas por dimensão neste laudo — não há o que representar no gráfico.
                  </p>
                </div>
              )}
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
          {a.summary ? (
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{a.summary}</p>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed">
              O parecer executivo não foi produzido nesta análise. Reprocesse o currículo para gerá-lo — não há
              cobrança nova.
            </p>
          )}
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

      {/* AUDITORIA COM LEITURA REAL DOS PERFIS (rota social-analysis) */}
      {(activeTab === 'all' || activeTab === 'social') && (
        <SocialAnalysisPanel
          resumeId={resume.id}
          initialAnalysis={resume.socialAnalysis || null}
          socialLinks={resume.socialLinks || {}}
        />
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

      {/* Aba de alterações pontuais aberta sem alterações no laudo: a ausência é
          dita, não preenchida com exemplos. */}
      {activeTab === 'targeted' && a.targetedChanges.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-6 text-center space-y-1">
            <p className="text-sm font-semibold text-slate-700">Sem alterações pontuais neste laudo</p>
            <p className="text-xs text-slate-500">
              Esta análise não devolveu trechos específicos do seu currículo para ajustar. Reprocessar o currículo
              costuma resolver — e não há cobrança nova.
            </p>
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
                {/* Não prometemos contratação. O texto anterior — "maior chance
                    imediata de contratação" — transformava uma leitura do
                    currículo em previsão de resultado de processo seletivo, que
                    o produto não tem dados para sustentar. */}
                <CardDescription className="text-xs text-slate-600">
                  Nosso Agente de Carreira lê seu perfil e aponta as 3 áreas/cargos com maior aderência ao que você
                  já construiu. Já incluída na Análise Completa deste currículo.
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
        {orienting && (
          <CardContent className="py-6 flex flex-col items-center gap-2 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            <p className="text-sm text-sky-800 font-semibold">
              Mapeando as 3 áreas com maior aderência ao seu perfil...
            </p>
            {/* O tempo esperado, dito de antemão: sem ele, uma espera normal de
                meio minuto é lida como travamento. */}
            <p className="text-xs text-slate-500">
              Costuma levar de 15 a 40 segundos. Não feche esta página.
            </p>
          </CardContent>
        )}

        {!orienting && orientationError && (
          <CardContent className="pt-0 pb-5">
            <Alert variant="destructive" className="bg-rose-50 border-rose-300">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm text-rose-900 leading-relaxed font-medium">
                {orientationError}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
        {!orienting && careerOrientation && (
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
                    {typeof area.matchPercentage === 'number' && (
                      <span className="font-extrabold text-sky-600 text-sm">{area.matchPercentage}% aderência</span>
                    )}
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

            {/* O percentual é leitura do currículo pelo modelo, não medição de
                mercado. Dizer isso onde ele aparece evita que seja lido como
                probabilidade de contratação — que o produto não calcula. */}
            <p className="text-[10px] text-slate-500 leading-relaxed">
              A aderência mede o quanto sua trajetória se aproxima do que essas áreas costumam exigir. Não é
              probabilidade de contratação nem medição do mercado de trabalho.
            </p>

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

      {/* CARTA DE APRESENTAÇÃO & RESUMO PROFISSIONAL DIRECIONADO
          Dois dos nove itens vendidos que não existiam no código até aqui:
          `cover_letter` tinha tipo de tarefa e provedor declarados sem rota que
          o produzisse, e `professional_summary` só existia no catálogo. */}
      {(activeTab === 'all' || activeTab === 'letter') && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-amber-950 font-bold">
                    ✉️ Carta de Apresentação & Resumo Profissional
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Escritos a partir do seu currículo real e direcionados à vaga alvo, no formato de candidatura do
                    seu mercado. Já incluídos na Análise Completa deste currículo.
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleGenerateCoverLetter}
                disabled={writingLetter}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto"
              >
                {writingLetter ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {coverLetter ? 'Gerar novamente' : 'Escrever minha carta'}
              </Button>
            </div>
          </CardHeader>

          {writingLetter && (
            <CardContent className="py-6 flex flex-col items-center gap-2 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-sm text-amber-900 font-semibold">Redigindo a carta e o resumo direcionados...</p>
              <p className="text-xs text-slate-500">Costuma levar de 20 a 45 segundos. Não feche esta página.</p>
            </CardContent>
          )}

          {!writingLetter && letterError && (
            <CardContent className="pt-0 pb-5">
              <Alert variant="destructive" className="bg-rose-50 border-rose-300">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm text-rose-900 leading-relaxed font-medium">
                  {letterError}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          {!writingLetter && !letterError && !coverLetter && (
            <CardContent className="pt-0 pb-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Ainda não gerada para este currículo. Ela usa a vaga alvo que você informou no envio — quanto mais
                completa a descrição da vaga, mais direcionados ficam os dois textos.
              </p>
            </CardContent>
          )}

          {!writingLetter && coverLetter && (
            <CardContent className="space-y-4 pt-0">
              {coverLetter.targetJob && (
                <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-semibold text-[11px]">
                  🎯 Direcionada a: {coverLetter.targetJob}
                </Badge>
              )}

              <div className="p-4 rounded-xl bg-white border border-amber-100 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-amber-950 text-xs uppercase tracking-wider">Resumo profissional</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => copyToClipboard(coverLetter.professionalSummary, 'Resumo profissional')}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {coverLetter.professionalSummary}
                </p>
                <p className="text-[10px] text-slate-500">
                  Este é o parágrafo de abertura do currículo. O texto “Sobre” do LinkedIn é outro, e sai na aba de
                  Mídias & Redes Sociais.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-amber-100 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-amber-950 text-xs uppercase tracking-wider">Carta de apresentação</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => copyToClipboard(coverLetter.coverLetter, 'Carta de apresentação')}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{coverLetter.coverLetter}</p>
              </div>

              {coverLetter.keywords.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <p className="font-bold text-amber-950 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Termos da vaga incorporados aos textos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {coverLetter.keywords.map((k, i) => (
                      <Badge key={i} variant="outline" className="bg-white text-amber-900 border-amber-300 text-[10px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
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
      <UploadProgressModal
        isOpen={job.phase === 'starting' || job.phase === 'running'}
        progress={job.progress}
        completedSegments={job.completedSegments}
        partial={job.partial}
      />
    </div>
  )
}
