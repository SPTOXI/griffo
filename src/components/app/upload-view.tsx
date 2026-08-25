'use client'

import { useState, useRef } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Info, Share2, Globe, CheckSquare, Square, Plus, Trash2
} from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'
import { UploadProgressModal } from './upload-progress-modal'
import { useI18n } from '@/context/i18n-context'
import { localeForLang } from '@/lib/i18n'

export interface CustomSocialField {
  id: string
  platform: string
  url: string
}

const PRESET_PLATFORMS = [
  'LinkedIn',
  'Gupy',
  'GitHub',
  'Behance',
  'Dribbble',
  'StackOverflow',
  'Kaggle',
  'Xing',
  'Medium',
  'Substack',
  'Portfólio / Site',
  'Instagram / Redes',
]

/**
 * Calcula a prévia gratuita antes de trocar de tela.
 *
 * ## Por que nunca lança, e nunca bloqueia a navegação
 *
 * A prévia é a primeira entrega que a pessoa vê, e é o momento em que ela
 * decide se o produto funciona. Mas ela é uma chamada de IA, e chamada de IA
 * às vezes demora ou falha.
 *
 * Segurar a pessoa numa tela de espera até uma chamada externa se resolver
 * troca "demorou um pouco" por "quebrou". Por isso: tenta, tenta de novo uma
 * vez, e desiste em silêncio — a tela de laudo pega o resultado quando ele
 * chegar, e oferece "tentar de novo" se não chegou.
 *
 * ## O prazo é do cliente, não do servidor
 *
 * O `AbortController` desiste ANTES do teto da função. Sem isso, a espera
 * terminaria num 504 do navegador — que é indistinguível de queda de rede para
 * quem está olhando.
 */
const PREVIEW_ATTEMPT_MS = 55_000

async function warmPreview(resumeId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PREVIEW_ATTEMPT_MS)

    try {
      const res = await internalFetch('/api/resume/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
        signal: controller.signal,
      })

      if (res.ok) return true

      // 4xx é recusa com motivo — repetir daria o mesmo. Só 5xx e falha de rede
      // merecem segunda tentativa.
      if (res.status < 500) return false
    } catch {
      // Rede caiu ou o prazo estourou. Vale uma segunda tentativa.
    } finally {
      clearTimeout(timer)
    }
  }

  return false
}

export function UploadView() {
  const { t, lang } = useI18n()
  const up = t.upload
  const locale = localeForLang(lang)
  const { openResume, setView } = useNav()
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [targetJobDescription, setTargetJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [format, setFormat] = useState<'text' | 'markdown' | 'pdf'>('text')

  const handleFetchJobFromUrl = async () => {
    let cleanUrl = jobUrl.trim()
    if (!cleanUrl) {
      toast.error(up.jobUrlEmptyError)
      return
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }
    setFetchingUrl(true)
    try {
      const res = await internalFetch('/api/resume/job-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      })
      const data = await res.json()
      if (res.ok && data.description) {
        if (!targetJob) setTargetJob(data.title || up.jobImportedTitleFallback)
        setTargetJobDescription(data.description)
        toast.success(up.jobImportedSuccess)
      } else {
        toast.error(data.error || up.jobImportErrorFallback)
      }
    } catch {
      toast.error(up.jobImportConnectionError)
    } finally {
      setFetchingUrl(false)
    }
  }
  
  // Dynamic Custom Social Profiles State - autofill from user profile if saved
  const initialSocial: CustomSocialField[] = user?.socialLinks && Object.keys(user.socialLinks).length > 0
    ? Object.entries(user.socialLinks).map(([platform, url], i) => ({ id: i.toString(), platform, url }))
    : [
        { id: '1', platform: 'LinkedIn', url: '' },
        { id: '2', platform: 'Gupy', url: '' },
        { id: '3', platform: 'GitHub', url: '' },
      ]

  const [socialProfiles, setSocialProfiles] = useState<CustomSocialField[]>(initialSocial)
  const [socialConsent, setSocialConsent] = useState(true)

  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = content.length
  const maxChars = 20000
  const minChars = 30

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError(up.fileTooLargeError)
      return
    }

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = String(e.target?.result || '')
        setPdfBase64(result)
        setFormat('pdf')
        if (!title) setTitle(file.name.replace(/\.pdf$/i, ''))
        // O campo de conteúdo NÃO recebe texto de enfeite.
        //
        // Ele recebia `[Arquivo PDF Anexado: nome.pdf] - O texto será
        // processado...`, uns 90 caracteres que o servidor não tinha como
        // distinguir de currículo de verdade. Quando o PDF não tinha camada de
        // texto, era esse marcador que ia para a IA — e o laudo saía pontuado,
        // com gráfico, sobre um nome de arquivo. O anexo já aparece na tela
        // como anexo; escrevê-lo dentro do currículo não informava ninguém e
        // enganava o servidor.
        setPdfFileName(file.name)
        toast.success(up.pdfAttachedSuccess)
      }
      reader.onerror = () => setError(up.pdfReadError)
      reader.readAsDataURL(file)
      return
    }

    setPdfBase64(null)
    setPdfFileName(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result || '')
      setContent(text)
      if (file.name.endsWith('.md')) setFormat('markdown')
      else setFormat('text')
      if (!title) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
    }
    reader.onerror = () => setError(up.fileReadError)
    reader.readAsText(file)
  }

  const addSocialProfile = () => {
    setSocialProfiles([
      ...socialProfiles,
      { id: Date.now().toString(), platform: 'LinkedIn', url: '' },
    ])
  }

  const updateSocialProfile = (id: string, field: 'platform' | 'url', value: string) => {
    setSocialProfiles(
      socialProfiles.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const removeSocialProfile = (id: string) => {
    setSocialProfiles(socialProfiles.filter((p) => p.id !== id))
  }

  const [loadingStep, setLoadingStep] = useState<string | null>(null)

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    if (!pdfBase64 && content.length < minChars) {
      setError(up.contentTooShortError.replace('{min}', String(minChars)))
      return
    }
    if (content.length > maxChars) {
      setError(up.contentTooLongError.replace('{max}', maxChars.toLocaleString(locale)))
      return
    }
    setLoading(true)
    setLoadingStep(up.loadingStepUpload)

    // Build socialLinks dictionary from dynamic list
    const socialLinks: Record<string, string> = {}
    for (const p of socialProfiles) {
      const name = p.platform.trim() || 'Rede Profissional'
      const link = p.url.trim()
      if (link) {
        socialLinks[name] = link
      }
    }

    try {
      const r = await internalFetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format: format || 'text',
          title: title || undefined,
          targetJob: targetJob || undefined,
          targetJobDescription: targetJobDescription || undefined,
          socialLinks,
          socialConsent: socialConsent || false,
          ...(pdfBase64 ? { pdfBase64 } : {}),
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || up.saveErrorFallback)
        setLoading(false)
        setLoadingStep(null)
        return
      }

      // O envio NÃO dispara a análise paga: isso consumiria uma análise do saldo
      // sem que ninguém tivesse pedido. O que roda aqui é a PRÉVIA gratuita, e a
      // decisão de liberar o laudo inteiro continua sendo do usuário.
      //
      // Ela roda AQUI, com a animação ainda na tela, e não depois de trocar de
      // página. Antes o fluxo era: animação do envio termina → tela muda →
      // começa outra espera, com um giro sem número e sem etapa. A pessoa via
      // duas esperas onde só existe uma entrega, e a segunda parecia travada.
      //
      // Agora é uma espera só, com relógio à vista, e a tela seguinte já abre
      // com a nota pronta.
      setLoadingStep(up.loadingStepPreview)
      await warmPreview(data.resume.id)

      setLoading(false)
      setLoadingStep(null)
      toast.success(up.saveSuccess)
      openResume(data.resume.id, 'analysis')
    } catch {
      setError(up.saveConnectionError)
      setLoading(false)
      setLoadingStep(null)
    }
  }


  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-brand-navy to-primary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 bg-blue-500/10 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> {up.heroTitle}
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
          {up.heroDesc}
        </p>
      </div>

      {/* FEATURE BADGES — mesma cor pros 4, diferenciados por número/ícone, não por tom solto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">1</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{up.badge1Title}</p>
            <p className="text-[10px] text-slate-500 font-medium">{up.badge1Desc}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">2</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{up.badge2Title}</p>
            <p className="text-[10px] text-slate-500 font-medium">{up.badge2Desc}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">3</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{up.badge3Title}</p>
            <p className="text-[10px] text-slate-500 font-medium">{up.badge3Desc}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">4</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{up.badge4Title}</p>
            <p className="text-[10px] text-slate-500 font-medium">{up.badge4Desc}</p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{up.cardTitle}</CardTitle>
              <CardDescription>{up.cardDesc.replace('{min}', String(minChars)).replace('{max}', maxChars.toLocaleString(locale))}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1.5" /> {up.attachButton}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="content">{up.contentLabel}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={up.contentPlaceholder}
              className="min-h-[260px] font-mono text-xs leading-relaxed resize-y"
            />
            <div className="flex justify-between items-center text-xs">
              <span className={charCount < minChars ? 'text-amber-600' : charCount > maxChars ? 'text-red-600' : 'text-slate-500'}>
                {charCount.toLocaleString(locale)} / {maxChars.toLocaleString(locale)} {up.charCountUnit}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{format === 'markdown' ? up.formatMarkdown : up.formatText}</Badge>
                <button
                  onClick={() => setFormat(format === 'markdown' ? 'text' : 'markdown')}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  {up.formatToggle}
                </button>
              </div>
            </div>
          </div>

          {/* TARGET JOB & MATCHING (FASE 1 + IMPORTAÇÃO DE URL) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="targetJob" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> {up.targetJobLabel}
              </Label>
              <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20 self-start sm:self-auto">
                {up.targetJobBadge}
              </Badge>
            </div>

            {/* IMPORT VIA URL */}
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Label htmlFor="jobUrl" className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" /> {up.importUrlLabel}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="jobUrl"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleFetchJobFromUrl()
                    }
                  }}
                  placeholder={up.importUrlPlaceholder}
                  className="text-xs h-9 bg-white"
                />
                <Button
                  type="button"
                  onClick={handleFetchJobFromUrl}
                  disabled={fetchingUrl}
                  variant="outline"
                  className="text-xs h-9 font-semibold shrink-0 bg-white hover:bg-slate-100"
                >
                  {fetchingUrl ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Globe className="w-3.5 h-3.5 mr-1 text-primary" />}
                  {up.importUrlButton}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Input
                id="targetJob"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder={up.targetJobPlaceholder}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetJobDescription" className="text-xs font-medium text-slate-600">
                {up.targetJobDescLabel}
              </Label>
              <Textarea
                id="targetJobDescription"
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder={up.targetJobDescPlaceholder}
                className="min-h-[85px] text-xs font-mono resize-y"
              />
            </div>
          </div>

          {/* DYNAMIC GLOBAL SOCIAL & PROFESSIONAL PROFILES */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-primary" /> {up.socialTitle}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {up.socialDesc}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialProfile}
                className="text-xs text-primary border-primary/20 hover:bg-primary/10 shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> {up.addProfileButton}
              </Button>
            </div>

            <div className="space-y-2.5">
              {socialProfiles.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <div className="w-full sm:w-1/3 md:w-1/4">
                    <Input
                      list={`platform-suggestions-${item.id}`}
                      placeholder={up.platformPlaceholder}
                      value={item.platform}
                      onChange={(e) => updateSocialProfile(item.id, 'platform', e.target.value)}
                      className="h-8 text-xs font-semibold text-slate-800 bg-white"
                    />
                    <datalist id={`platform-suggestions-${item.id}`}>
                      {PRESET_PLATFORMS.map((plat) => (
                        <option key={plat} value={plat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={up.profileUrlPlaceholder}
                      value={item.url}
                      onChange={(e) => updateSocialProfile(item.id, 'url', e.target.value)}
                      className="h-8 text-xs font-mono bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialProfile(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title={up.removeProfileTitle}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSocialConsent(!socialConsent)}
                className="flex items-start sm:items-center gap-2 text-xs text-slate-700 hover:text-slate-900 select-none text-left"
              >
                {socialConsent ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <span>
                  {up.consentText}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && loadingStep && (
            <Alert className="bg-primary/5 border-primary/20 text-primary">
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              <AlertDescription className="text-xs font-medium">
                {loadingStep}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {up.secureEnvBadge}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('dashboard')} disabled={loading} className="font-bold border-slate-200 hover:bg-slate-50">{up.cancelButton}</Button>
              <Button
                onClick={submit}
                disabled={loading || (!pdfBase64 && content.length < minChars)}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white shadow-lg shadow-slate-900/20 font-bold transition-all px-6"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {up.submitButtonLoading}</>
                ) : (
                  <>{up.submitButton} <Sparkles className="w-4 h-4 ml-2 text-amber-400" /></>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4 flex items-start gap-3">
          <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>{up.whatWillBeAnalyzedLabel}</strong> {up.whatWillBeAnalyzedDesc}</p>
          </div>
        </CardContent>
      </Card>

      {/*
        Sem lista de dimensões aqui: nesta fase o que roda é o envio do arquivo
        e a prévia gratuita, e nenhuma das oito está sendo gerada. A versão
        anterior passava `progress={0}` e `completedSegments={[]}` fixos, então
        a lista inteira aparecia apagada e sumia sem nada acender — a tela
        prometia um trabalho que ainda não tinha começado, e o efeito era o de
        um piscar sem sentido antes da troca de página.
      */}
      <UploadProgressModal
        isOpen={loading}
        progress={0}
        completedSegments={[]}
        headline={loadingStep ?? undefined}
        showStages={false}
      />
    </div>
  )
}
