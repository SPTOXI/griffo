'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Share2, Loader2, Sparkles, CheckCircle2, AlertCircle, Upload, FileText, Github, Globe,
} from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'

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

const CREDIT_COST = 20

const PLATFORM_ICON: Record<string, typeof Github> = {
  github: Github,
  linkedin: Share2,
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copiado!`)
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
  const [analysis, setAnalysis] = useState<SocialAnalysis | null>(initialAnalysis)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Só aparece quando o servidor responde que não conseguiu ler nada — não
  // adianta pedir o PDF antes de saber se ele é necessário.
  const [needsInput, setNeedsInput] = useState<SocialSource[] | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  const hasLinks = Object.keys(socialLinks || {}).length > 0

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { resumeId }
      if (pdfBase64) body.linkedinPdfBase64 = pdfBase64
      if (pastedText.trim()) body.linkedinPdfText = pastedText.trim()

      const r = await internalFetch('/api/resume/social-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()

      if (!r.ok) {
        // 422: nada pôde ser lido. Abre o caminho manual em vez de só falhar.
        if (data.code === 'NO_PROFILE_CONTENT') {
          setNeedsInput(data.profiles || [])
          setError(data.error)
          return
        }
        if (data.code === 'INSUFFICIENT_CREDITS') {
          setError(`${data.error} São necessários ${CREDIT_COST} créditos.`)
          return
        }
        setError(data.error || 'Não foi possível concluir a análise.')
        return
      }

      setAnalysis(data.socialAnalysis)
      // O saldo no cabeçalho só é relido ao trocar de tela; sem este aviso ele
      // ficaria 20 créditos desatualizado logo depois da cobrança.
      window.dispatchEvent(new Event('griffo:credits-changed'))
      setNeedsInput(null)
      setPastedText('')
      setPdfBase64(null)
      setPdfName(null)
      toast.success(`Análise concluída sobre ${data.analyzedCount} perfil(is).`)
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setRunning(false)
    }
  }

  const onPickPdf = (file: File | null) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo excede 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      setPdfBase64(result.replace(/^data:application\/pdf;base64,/, ''))
      setPdfName(file.name)
    }
    reader.onerror = () => toast.error('Não foi possível ler o arquivo.')
    reader.readAsDataURL(file)
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
                🌐 Auditoria de Presença Digital
              </CardTitle>
              <CardDescription className="text-xs text-violet-200/70 font-medium max-w-xl leading-relaxed">
                Lemos o conteúdo real dos seus perfis — GitHub pela API oficial, portfólio e
                blogs pela página publicada — e comparamos com o seu currículo.
              </CardDescription>
            </div>
          </div>

          {analysis && (
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={run}
              className="bg-transparent border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-white text-xs font-bold shrink-0"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Refazer ({CREDIT_COST} cr)
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6 relative z-10">
        {error && (
          <Alert className="bg-rose-950/40 border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <AlertDescription className="text-xs text-rose-200 leading-relaxed">{error}</AlertDescription>
          </Alert>
        )}

        {/* Caminho manual, aberto quando nenhum perfil pôde ser lido. Os motivos
            variam por plataforma e vêm do servidor, listados abaixo. */}
        {needsInput && (
          <div className="space-y-4 p-5 rounded-xl bg-slate-900/50 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Envie o conteúdo do seu perfil</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nenhum dos seus perfis pôde ser lido automaticamente — o motivo de cada um está
                  abaixo. No LinkedIn, use <strong className="text-slate-200">Mais → Salvar como PDF</strong> no
                  seu perfil e envie o arquivo aqui; nas demais plataformas, cole o texto do seu
                  &ldquo;Sobre&rdquo; e headline.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-violet-300 cursor-pointer hover:text-violet-200 w-fit">
                <Upload className="w-4 h-4" />
                {pdfName ? `Arquivo: ${pdfName}` : 'Escolher PDF do perfil'}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => onPickPdf(e.target.files?.[0] || null)}
                />
              </label>

              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Ou cole aqui o texto do seu perfil (headline, Sobre, experiências)..."
                className="bg-black/30 border-white/10 text-slate-200 text-xs min-h-[120px] placeholder:text-slate-500"
              />
            </div>

            {needsInput.length > 0 && (
              <div className="space-y-1 pt-1">
                {needsInput.map((s, i) => (
                  <p key={i} className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-mono text-slate-400">{s.platform}</span> — {s.note}
                  </p>
                ))}
              </div>
            )}

            <Button
              disabled={running || (!pdfBase64 && !pastedText.trim())}
              onClick={run}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold w-full sm:w-auto"
            >
              {running ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Analisar com este conteúdo ({CREDIT_COST} cr)
            </Button>
          </div>
        )}

        {/* Estado inicial */}
        {!analysis && !needsInput && (
          <div className="text-center py-8 space-y-4">
            {!hasLinks ? (
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Você ainda não cadastrou perfis profissionais. Adicione seu GitHub, portfólio ou
                LinkedIn nas configurações da conta para habilitar a auditoria.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {Object.keys(socialLinks).length} perfil(is) cadastrado(s). A auditoria visita
                  cada um, compara com o seu currículo e devolve headline e bio prontos para copiar.
                </p>
                <Button
                  disabled={running}
                  onClick={run}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-600/20"
                >
                  {running ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lendo seus perfis...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Auditar presença digital ({CREDIT_COST} cr)</>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Resultado */}
        {analysis && (
          <>
            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2">
                Avaliação geral
              </p>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
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
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-violet-300 shrink-0" />
                      <Badge className="bg-violet-500 text-white font-black tracking-wider uppercase px-3 py-1 shadow-md shrink-0">
                        {item.platform}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono truncate">{item.url}</span>
                    </div>

                    {/* A distinção que sustenta a credibilidade do laudo: o que
                        foi lido de fato e o que é orientação genérica. */}
                    {item.analyzed ? (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Perfil lido
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0">
                        <AlertCircle className="w-3 h-3 mr-1" /> Não lido — dica geral
                      </Badge>
                    )}
                  </div>

                  {item.findings && (
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        O que encontramos
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {item.findings}
                      </p>
                    </div>
                  )}

                  {item.headline && (
                    <CopyBlock
                      label="💡 Título estratégico (SEO)"
                      accent="text-violet-400"
                      buttonAccent="text-violet-300"
                      value={item.headline}
                      bold
                    />
                  )}

                  {item.aboutSummary && (
                    <CopyBlock
                      label='📝 Texto "Sobre" otimizado'
                      accent="text-blue-400"
                      buttonAccent="text-blue-300"
                      value={item.aboutSummary}
                    />
                  )}

                  {item.tips?.length > 0 && (
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 mb-2">
                        🚀 Ações recomendadas
                      </p>
                      <ul className="space-y-1.5">
                        {item.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                            <span className="text-fuchsia-400 shrink-0">→</span>
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
              <p className="text-[10px] text-slate-500 text-center pt-2">
                Auditoria realizada em {new Date(analysis.analyzedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CopyBlock({
  label,
  value,
  accent,
  buttonAccent,
  bold,
}: {
  label: string
  value: string
  accent: string
  buttonAccent: string
  bold?: boolean
}) {
  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>{label}</p>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 text-[10px] px-2 ${buttonAccent} hover:bg-white/5 hover:text-white font-bold shrink-0`}
          onClick={() => copy(value, label.replace(/^\W+\s*/, ''))}
        >
          Copiar
        </Button>
      </div>
      <p
        className={`leading-relaxed whitespace-pre-wrap ${
          bold ? 'text-sm font-bold text-white' : 'text-xs text-slate-300'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
