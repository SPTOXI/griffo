'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Share2, Loader2, Sparkles, CheckCircle2, AlertCircle, Upload, FileText, Github, Globe,
  Lock, ClipboardPaste, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'
import { useAiJob } from './use-ai-job'
import { useI18n } from '@/context/i18n-context'

/** Procedência de cada perfil — o que foi lido de verdade e o que não foi. */
interface SocialSource {
  platform: string
  url: string
  status: 'fetched' | 'needs_user_input' | 'failed'
  note?: string
}

interface SocialProfileResult {
  platform: string
  url: string
  /** `false` quando o perfil não pôde ser lido: o conselho é genérico. */
  analyzed: boolean
  /** `true` quando a chamada de análise deste perfil falhou — refazer resolve. */
  failed?: boolean
  findings: string
  headline: string
  aboutSummary: string
  tips: string[]
}

export interface SocialAnalysis {
  overallAssessment: string
  profiles: SocialProfileResult[]
  sources?: SocialSource[]
  analyzedAt?: string
}


const PLATFORM_ICON: Record<string, typeof Github> = {
  github: Github,
  linkedin: Share2,
}

/** Estado da leitura do PDF, que agora acontece antes e à parte da análise. */
type PdfState =
  | { phase: 'idle' }
  | { phase: 'reading'; name: string }
  | { phase: 'ok'; name: string; chars: number; method: 'text_layer' | 'ocr' }
  | { phase: 'error'; name: string; message: string }

function copy(text: string, label: string, copiedToast?: string) {
  navigator.clipboard.writeText(text)
  toast.success(copiedToast || `${label} copiado!`)
}

export function SocialAnalysisPanel({
  resumeId,
  initialAnalysis,
  socialLinks,
}: {
  resumeId: string
  initialAnalysis: SocialAnalysis | null
  socialLinks: Record<string, string>
}) {
  const { t, lang } = useI18n()
  const sp = t.socialPanel
  const [analysis, setAnalysis] = useState<SocialAnalysis | null>(initialAnalysis)
  const [error, setError] = useState<string | null>(null)

  // O caminho manual deixou de depender de uma falha para aparecer. O LinkedIn
  // NUNCA pode ser lido automaticamente — esperar o erro para só então oferecer
  // o PDF fazia o usuário descobrir a única alternativa existente depois de uma
  // tentativa frustrada. Pior: quem tinha um GitHub legível nunca via a opção,
  // porque a análise "dava certo" com o LinkedIn faltando.
  const [manualOpen, setManualOpen] = useState(false)
  const [sourceNotes, setSourceNotes] = useState<SocialSource[] | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [pdf, setPdf] = useState<PdfState>({ phase: 'idle' })

  const hasLinks = Object.keys(socialLinks || {}).length > 0
  const hasLinkedin = Object.entries(socialLinks || {}).some(
    ([k, v]) => k.toLowerCase().includes('linkedin') || String(v).toLowerCase().includes('linkedin.com')
  )

  /**
   * Progresso real via `useAiJob`: cada perfil (mais a avaliação geral) é
   * uma etapa gravada assim que termina de verdade, não uma barra calibrada
   * em tempo — ver `lib/ai-jobs/runners/social-advice.ts` e a regra em
   * HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento".
   */
  const job = useAiJob<{ socialAnalysis: SocialAnalysis; analyzedCount: number }>({
    startUrl: '/api/resume/social-analysis',
    statusUrl: '/api/ai-jobs/status',
    onCompleted: (result) => {
      setError(null)
      setAnalysis(result.socialAnalysis)
      setSourceNotes(result.socialAnalysis?.sources || null)
      toast.success(sp.auditSuccessToast)
    },
    onFailed: (message, code, data) => {
      // 422: nada pôde ser lido. Abre o caminho manual em vez de só falhar.
      if (code === 'NO_PROFILE_CONTENT') {
        setSourceNotes(data?.profiles || [])
        setManualOpen(true)
        setError(message)
        return
      }
      setError(message || sp.auditErrorFallback)
    },
  })
  const running = job.phase === 'starting' || job.phase === 'running'

  const run = () => {
    setError(null)
    const body: Record<string, unknown> = { resumeId }
    if (pastedText.trim()) body.linkedinPdfText = pastedText.trim()
    void job.start(body)
  }

  /**
   * Lê o PDF assim que ele é escolhido, numa chamada própria.
   *
   * O texto extraído cai no mesmo campo em que se cola conteúdo à mão: o
   * usuário VÊ o que foi lido antes de rodar a auditoria, e pode corrigir ou
   * completar. Quando a leitura falha, a mensagem diz o que fazer em vez de
   * apenas informar que falhou.
   */
  const onPickPdf = async (file: File | null) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setPdf({ phase: 'error', name: file.name, message: 'O arquivo excede 10 MB.' })
      return
    }

    setPdf({ phase: 'reading', name: file.name })

    const base64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })

    if (!base64) {
      setPdf({ phase: 'error', name: file.name, message: 'Não foi possível abrir o arquivo no navegador.' })
      return
    }

    try {
      const r = await internalFetch('/api/resume/profile-pdf-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      })
      const data = await r.json()

      if (!r.ok || !data.text) {
        setPdf({
          phase: 'error',
          name: file.name,
          message: data.error || 'Não foi possível extrair o texto deste PDF.',
        })
        return
      }

      setPastedText((prev) => (prev.trim() ? `${prev.trim()}\n\n${data.text}` : data.text))
      setPdf({ phase: 'ok', name: file.name, chars: data.charCount || data.text.length, method: data.method })
    } catch {
      setPdf({
        phase: 'error',
        name: file.name,
        message: 'Falha de conexão ao enviar o arquivo. Tente de novo ou cole o texto do perfil.',
      })
    }
  }

  return (
    <Card className="border border-violet-500/30 bg-gradient-to-br from-violet-900 via-[#1A0B2E] to-[#0B0B2E] shadow-2xl relative overflow-hidden mt-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none" />

      <CardHeader className="pb-4 border-b border-violet-500/20 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-white font-black flex items-center gap-2 mb-1 tracking-tight">
                🌐 {sp.title}
              </CardTitle>
              <CardDescription className="text-sm text-violet-100/80 font-medium max-w-xl leading-relaxed">
                {sp.subtitle}
              </CardDescription>
            </div>
          </div>

          {analysis && (
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={run}
              className="bg-transparent border-violet-500/40 text-violet-200 hover:bg-violet-500/10 hover:text-white text-sm font-bold shrink-0"
            >
              {running ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              {sp.reAuditBtn}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6 relative z-10">
        {error && (
          <Alert className="bg-rose-950/60 border-rose-500/50">
            <AlertCircle className="w-5 h-5 text-rose-300" />
            <AlertDescription className="text-sm text-rose-100 leading-relaxed font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <HowItWorks />

        {/* Caminho manual — sempre disponível, não só depois de um erro. */}
        <ManualInputSection
          open={manualOpen}
          onToggle={() => setManualOpen((v) => !v)}
          highlight={hasLinkedin && !analysis}
          pdf={pdf}
          onPickPdf={onPickPdf}
          pastedText={pastedText}
          onChangeText={setPastedText}
          notes={sourceNotes}
        />

        {/* Estado inicial */}
        {!analysis && (
          <div className="text-center py-6 space-y-4">
            {!hasLinks ? (
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {sp.subtitle}
              </p>
            ) : (
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                <strong className="text-white">{Object.keys(socialLinks).length} {sp.profilesFoundTitle.toLowerCase()}.</strong>{' '}
                {sp.subtitle}
              </p>
            )}
            <Button
              disabled={running || (!hasLinks && !pastedText.trim())}
              onClick={run}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-600/20"
            >
              {running ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {sp.auditingBtn}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> {sp.startAuditBtn}</>
              )}
            </Button>
            {running && (
              <div className="max-w-xs mx-auto space-y-1.5">
                <Progress value={job.progress} className="h-1.5" />
                {/* Cada número aqui é uma etapa que de fato terminou — não uma
                    estimativa de tempo. */}
                <p className="text-xs text-slate-400">
                  {job.completedSteps} de {job.totalSteps || '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Resultado */}
        {analysis && (
          <>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-2">
                {sp.overallTitle}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {analysis.overallAssessment}
              </p>
            </div>

            {analysis.profiles.map((item, idx) => {
              const Icon = PLATFORM_ICON[item.platform?.toLowerCase()] || Globe
              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-900/40 border border-violet-500/20 backdrop-blur-md space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-violet-300 shrink-0" />
                      <Badge className="bg-violet-500 text-white font-black tracking-wider uppercase px-3 py-1 shadow-md shrink-0">
                        {item.platform}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono truncate">{item.url}</span>
                    </div>

                    {item.failed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-400/50 px-3 py-1.5 text-xs font-bold text-rose-200 shrink-0">
                        <AlertCircle className="w-4 h-4" /> {sp.auditErrorFallback}
                      </span>
                    ) : item.analyzed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1.5 text-xs font-bold text-emerald-200 shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> {sp.readProfileOk}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 px-3 py-1.5 text-xs font-bold text-amber-200 shrink-0">
                        <AlertCircle className="w-4 h-4" /> {sp.readProfileGeneric}
                      </span>
                    )}
                  </div>

                  {item.findings && (
                    <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-2">
                        {sp.findingsTitle}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {item.findings}
                      </p>
                    </div>
                  )}

                  {item.headline && (
                    <CopyBlock
                      label={`💡 ${sp.headlineTitle}`}
                      accent="text-violet-300"
                      buttonAccent="text-violet-200"
                      value={item.headline}
                      copyBtnText={sp.copyBtn}
                      copiedToastText={sp.copiedToast}
                      bold
                    />
                  )}

                  {item.aboutSummary && (
                    <CopyBlock
                      label={`📝 ${sp.aboutTitle}`}
                      accent="text-blue-300"
                      buttonAccent="text-blue-200"
                      value={item.aboutSummary}
                      copyBtnText={sp.copyBtn}
                      copiedToastText={sp.copiedToast}
                    />
                  )}

                  {item.tips?.length > 0 && (
                    <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                      <p className="text-xs font-black uppercase tracking-widest text-fuchsia-300 mb-2">
                        🚀 {sp.tipsTitle}
                      </p>
                      <ul className="space-y-2">
                        {item.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                            <span className="text-fuchsia-300 shrink-0 font-bold">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}

            {analysis.analyzedAt && (
              <p className="text-xs text-slate-400 text-center pt-2">
                {sp.analyzedAt.replace('{date}', new Date(analysis.analyzedAt).toLocaleString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US'))}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Explica, antes de qualquer tentativa, o que é lido sozinho e o que exige ação
 * do usuário — e por quê.
 *
 * A ausência dessa explicação era lida como defeito do produto: quem via o
 * LinkedIn marcado como "não lido" concluía que a leitura estava quebrada, e não
 * que ela é impossível por decisão da própria plataforma.
 */
function HowItWorks() {
  return (
    <div className="rounded-xl border border-white/15 bg-black/25 p-5 space-y-4">
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <Info className="w-4 h-4 text-violet-300" />
        Como cada perfil é lido
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Leitura automática
          </p>
          <p className="text-sm text-emerald-50/90 leading-relaxed">
            <strong>GitHub</strong> (API oficial), <strong>portfólio</strong>, <strong>Medium</strong>,{' '}
            <strong>Substack</strong>, <strong>Dev.to</strong>, <strong>Behance</strong>,{' '}
            <strong>Dribbble</strong> e <strong>Stack Overflow</strong>. Nada a fazer: basta ter o
            link cadastrado.
          </p>
        </div>

        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
            <Lock className="w-4 h-4" /> Exige o seu envio
          </p>
          <p className="text-sm text-amber-50/90 leading-relaxed">
            <strong>LinkedIn</strong> (sempre) e <strong>Gupy</strong> (perfil atrás do login da
            empresa). Essas plataformas bloqueiam a leitura por terceiros e seus termos de uso a
            proíbem — não existe caminho técnico legítimo. Você mesmo fornece o conteúdo, e nós
            analisamos.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-violet-500/10 border border-violet-400/30 p-4 space-y-2">
        <p className="text-sm font-bold text-violet-100">Duas formas de enviar o LinkedIn:</p>
        <ol className="space-y-1.5 text-sm text-violet-50/90 leading-relaxed">
          <li className="flex gap-2">
            <span className="font-black text-violet-300 shrink-0">1.</span>
            <span>
              <strong>PDF do perfil</strong> — no seu LinkedIn, clique em{' '}
              <strong className="text-white">Mais → Salvar como PDF</strong> e envie o arquivo aqui.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-violet-300 shrink-0">2.</span>
            <span>
              <strong>Copiar e colar</strong> — se o PDF não puder ser lido (quando é imagem
              digitalizada, por exemplo), selecione o texto do seu título e da seção{' '}
              <strong>&ldquo;Sobre&rdquo;</strong> direto no perfil e cole no campo de texto. O
              resultado da análise é exatamente o mesmo.
            </span>
          </li>
        </ol>
      </div>
    </div>
  )
}

function ManualInputSection({
  open,
  onToggle,
  highlight,
  pdf,
  onPickPdf,
  pastedText,
  onChangeText,
  notes,
}: {
  open: boolean
  onToggle: () => void
  highlight: boolean
  pdf: PdfState
  onPickPdf: (file: File | null) => void
  pastedText: string
  onChangeText: (v: string) => void
  notes: SocialSource[] | null
}) {
  const reading = pdf.phase === 'reading'

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 ${
        highlight ? 'border-amber-400/50 bg-amber-500/5' : 'border-white/15 bg-black/25'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-sm font-bold text-white">
            Enviar o conteúdo do LinkedIn (PDF ou texto colado)
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {pastedText.trim() && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/50 px-2 py-1 text-xs font-bold text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conteúdo pronto
            </span>
          )}
          {open ? (
            <ChevronUp className="w-5 h-5 text-slate-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-300" />
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-4 pt-1">
          {/* Passo 1 — PDF */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-200">Opção 1 — enviar o PDF do perfil</p>
            <label
              className={`inline-flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-100 w-fit ${
                reading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:bg-violet-500/20'
              }`}
            >
              {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {reading ? 'Lendo o arquivo...' : 'Escolher PDF do perfil'}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={reading}
                onChange={(e) => onPickPdf(e.target.files?.[0] || null)}
              />
            </label>

            {/* O desfecho da leitura, dito com todas as letras. Antes o arquivo
                era apenas anexado e só se descobria se ele servia depois de
                pagar pela análise. */}
            {pdf.phase === 'ok' && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-400/50 bg-emerald-500/15 p-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-100 leading-relaxed">
                  <strong>{pdf.name}</strong> lido com sucesso — {pdf.chars.toLocaleString('pt-BR')}{' '}
                  caracteres extraídos
                  {pdf.method === 'ocr' && ' (por leitura de imagem)'}. O texto está no campo abaixo:
                  confira e corrija se precisar.
                </p>
              </div>
            )}

            {pdf.phase === 'error' && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-400/50 bg-rose-500/15 p-3">
                <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-100">Não deu para ler {pdf.name}</p>
                  <p className="text-sm text-rose-50/90 leading-relaxed">{pdf.message}</p>
                  <p className="text-sm text-rose-50/90 leading-relaxed">
                    <ClipboardPaste className="w-4 h-4 inline mr-1 -mt-0.5" />
                    Use a opção 2 abaixo: copie o texto direto do seu perfil e cole no campo. A
                    análise fica igualmente completa.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Passo 2 — colar */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-200">
              Opção 2 — colar o texto do perfil
              <span className="font-normal text-slate-400"> (use se o PDF falhar)</span>
            </p>
            <Textarea
              value={pastedText}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder={
                'Cole aqui o texto do seu perfil:\n\n• Título (headline)\n• Seção "Sobre"\n• Experiências e competências principais'
              }
              className="bg-black/40 border-white/20 text-slate-100 text-sm min-h-[160px] placeholder:text-slate-500 leading-relaxed"
            />
            <p className="text-xs text-slate-400">
              {pastedText.trim()
                ? `${pastedText.trim().length.toLocaleString('pt-BR')} caracteres prontos para análise.`
                : 'Quanto mais completo o texto, mais específico o parecer.'}
            </p>
          </div>

          {/* Motivos por perfil, quando o servidor já respondeu. */}
          {notes && notes.length > 0 && (
            <div className="space-y-2 rounded-lg border border-white/15 bg-black/30 p-4">
              <p className="text-sm font-bold text-slate-200">Situação de cada perfil cadastrado</p>
              {notes.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase shrink-0 ${
                      s.status === 'fetched'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                    }`}
                  >
                    {s.platform}
                  </span>
                  <span className="text-slate-300">
                    {s.status === 'fetched' ? 'Lido automaticamente.' : s.note || 'Precisa do seu envio.'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CopyBlock({
  label,
  value,
  accent,
  buttonAccent,
  bold,
  copyBtnText,
  copiedToastText,
}: {
  label: string
  value: string
  accent: string
  buttonAccent: string
  bold?: boolean
  copyBtnText?: string
  copiedToastText?: string
}) {
  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className={`text-xs font-black uppercase tracking-widest ${accent}`}>{label}</p>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs px-2.5 ${buttonAccent} hover:bg-white/10 hover:text-white font-bold shrink-0`}
          onClick={() => copy(value, label.replace(/^\W+\s*/, ''), copiedToastText)}
        >
          {copyBtnText || 'Copiar'}
        </Button>
      </div>
      <p
        className={`leading-relaxed whitespace-pre-wrap ${
          bold ? 'text-base font-bold text-white' : 'text-sm text-slate-200'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
