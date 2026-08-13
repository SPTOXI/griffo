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

export function UploadView() {
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
      toast.error('Informe a URL da vaga (ex: https://linkedin.com/jobs/view/...)')
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
        if (!targetJob) setTargetJob(data.title || 'Vaga Importada via Link')
        setTargetJobDescription(data.description)
        toast.success('Conteúdo da vaga importado com sucesso via Link!')
      } else {
        toast.error(data.error || 'Erro ao importar vaga pela URL. Tente copiar e colar a descrição manualmente.')
      }
    } catch {
      toast.error('Falha de conexão ao importar vaga. Verifique o link e tente novamente.')
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = content.length
  const maxChars = 20000
  const minChars = 30

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande (máx. 5MB).')
      return
    }

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = String(e.target?.result || '')
        setPdfBase64(result)
        setFormat('pdf')
        if (!title) setTitle(file.name.replace(/\.pdf$/i, ''))
        setContent((prev) =>
          prev.trim().length >= minChars
            ? prev
            : `[Arquivo PDF Anexado: ${file.name}] - O texto será processado e analisado automaticamente.`
        )
        toast.success('Arquivo PDF anexado com sucesso!')
      }
      reader.onerror = () => setError('Não foi possível ler o arquivo PDF.')
      reader.readAsDataURL(file)
      return
    }

    setPdfBase64(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result || '')
      setContent(text)
      if (file.name.endsWith('.md')) setFormat('markdown')
      else setFormat('text')
      if (!title) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
    }
    reader.onerror = () => setError('Não foi possível ler o arquivo.')
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
      setError(`Currículo muito curto. Cole pelo menos ${minChars} caracteres de texto.`)
      return
    }
    if (content.length > maxChars) {
      setError(`Currículo muito longo (máx. ${maxChars.toLocaleString('pt-BR')} caracteres).`)
      return
    }
    setLoading(true)
    setLoadingStep('Enviando arquivo e extraindo conteúdo...')

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
        setError(data.error || 'Erro ao salvar currículo.')
        setLoading(false)
        setLoadingStep(null)
        return
      }

      // O envio NÃO dispara mais a análise paga.
      //
      // Antes, salvar o currículo abria a análise completa na sequência — o que
      // agora consumiria uma análise do saldo sem que ninguém tivesse pedido. A
      // tela de laudo recebe o currículo e mostra a prévia gratuita com as oito
      // notas; a decisão de liberar o laudo inteiro é do usuário, com o preço à
      // vista.
      setLoading(false)
      setLoadingStep(null)
      toast.success('Currículo salvo! Veja sua nota nas 8 dimensões.')
      openResume(data.resume.id, 'analysis')
    } catch {
      setError('Erro de conexão ao enviar o currículo. Verifique sua rede e tente novamente.')
      setLoading(false)
      setLoadingStep(null)
    }
  }


  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-gradient-to-r from-[#0B192E] via-[#1A2E4B] to-[#0B192E] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 bg-blue-500/10 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Auditoria de IA Premium
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
          Análise preditiva executiva, SEO avançado para LinkedIn/Gupy, cálculo de % Match com vagas alvo e orientações vocacionais de carreira em 8 dimensões.
        </p>
      </div>

      {/* FEATURE BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-blue-300 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">1</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">8 Dimensões</p>
            <p className="text-[10px] text-slate-500 font-medium">Auditoria Executiva</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-violet-300 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">2</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Social SEO</p>
            <p className="text-[10px] text-slate-500 font-medium">LinkedIn & Portfólio</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">3</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Match Vaga</p>
            <p className="text-[10px] text-slate-500 font-medium">Aderência de Perfil</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-3 rounded-xl flex items-center gap-3 shadow-sm hover:border-emerald-300 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">4</div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Fórmula STAR</p>
            <p className="text-[10px] text-slate-500 font-medium">Correção de Escrita</p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Conteúdo do currículo</CardTitle>
              <CardDescription>Mín. {minChars} caracteres · Máx. {maxChars.toLocaleString('pt-BR')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1.5" /> Anexar arquivo (.pdf, .txt, .md)
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
            <Label htmlFor="content">Currículo (texto)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Exemplo:\n\nMaria Souza\nDesenvolvedora Front-end\nmaria@email.com | (11) 99999-9999 | linkedin.com/in/mariasouza\n\nRESUMO\nDesenvolvedora front-end com 5 anos de experiência em React, TypeScript e design systems...\n\nEXPERIÊNCIA\nSênior Front-end - Empresa X (2022-presente)\n- Liderei a migração de Angular para React...\n- Reduzi o tempo de carregamento em 40%...\n\n...`}
              className="min-h-[260px] font-mono text-xs leading-relaxed resize-y"
            />
            <div className="flex justify-between items-center text-xs">
              <span className={charCount < minChars ? 'text-amber-600' : charCount > maxChars ? 'text-red-600' : 'text-slate-500'}>
                {charCount.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')} caracteres
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{format === 'markdown' ? 'Markdown' : 'Texto'}</Badge>
                <button
                  onClick={() => setFormat(format === 'markdown' ? 'text' : 'markdown')}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  alternar
                </button>
              </div>
            </div>
          </div>

          {/* TARGET JOB & MATCHING (FASE 1 + IMPORTAÇÃO DE URL) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="targetJob" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Cargo ou Vaga Alvo Desejada (Opcional)
              </Label>
              <Badge variant="outline" className="text-[10px] text-sky-700 bg-sky-50 border-sky-200 self-start sm:self-auto">
                Ou cole o Link da vaga de emprego abaixo 🔗
              </Badge>
            </div>

            {/* IMPORT VIA URL */}
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Label htmlFor="jobUrl" className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" /> Importar Vaga de Emprego pelo Link (LinkedIn, Gupy, Catho, etc.)
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
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  className="text-xs h-9 bg-white"
                />
                <Button
                  type="button"
                  onClick={handleFetchJobFromUrl}
                  disabled={fetchingUrl}
                  variant="outline"
                  className="text-xs h-9 font-semibold shrink-0 bg-white hover:bg-slate-100"
                >
                  {fetchingUrl ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Globe className="w-3.5 h-3.5 mr-1 text-sky-600" />}
                  Importar Link
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Input
                id="targetJob"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Ex: Gerente de Projetos Senior, Desenvolvedor React, Analista Financeiro..."
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetJobDescription" className="text-xs font-medium text-slate-600">
                Descrição ou Requisitos da Vaga Alvo (Copia & Cola ou Texto Extraído do Link)
              </Label>
              <Textarea
                id="targetJobDescription"
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Cole aqui os requisitos, qualificações e atribuições da vaga para calcularmos o % de Match Exato e apontar lacunas de conhecimento (ou use o botão 'Importar Link' acima)..."
                className="min-h-[85px] text-xs font-mono resize-y"
              />
            </div>
          </div>

          {/* DYNAMIC GLOBAL SOCIAL & PROFESSIONAL PROFILES */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-violet-600" /> Presença Digital & Perfis Profissionais Globais (Opcional)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Insira o link das redes e plataformas relevantes para a área e mercado que deseja atuar (LinkedIn, Gupy, Behance, GitHub, Xing, StackOverflow, etc.).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialProfile}
                className="text-xs text-violet-700 border-violet-200 hover:bg-violet-50 shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar perfil
              </Button>
            </div>

            <div className="space-y-2.5">
              {socialProfiles.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <div className="w-full sm:w-1/3 md:w-1/4">
                    <Input
                      list={`platform-suggestions-${item.id}`}
                      placeholder="Rede / Plataforma"
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
                      placeholder={`Link do perfil (ex: https://...)`}
                      value={item.url}
                      onChange={(e) => updateSocialProfile(item.id, 'url', e.target.value)}
                      className="h-8 text-xs font-mono bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialProfile(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remover perfil"
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
                  <CheckSquare className="w-4 h-4 text-violet-600 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <span>
                  Autorizo a inteligência do Griffo a analisar meus perfis fornecidos e gerar recomendações personalizadas de posicionamento e otimização de presença digital global.
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
            <Alert className="bg-violet-50 border-violet-200 text-violet-900">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600 shrink-0" />
              <AlertDescription className="text-xs font-medium">
                {loadingStep}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Ambiente Seguro · LGPD Compliance
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('dashboard')} disabled={loading} className="font-bold border-slate-200 hover:bg-slate-50">Cancelar</Button>
              <Button
                onClick={submit}
                disabled={loading || (!pdfBase64 && content.length < minChars)}
                className="bg-[#0B192E] hover:bg-[#1A2E4B] text-white shadow-lg shadow-slate-900/20 font-bold transition-all px-6"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Incializando IA…</>
                ) : (
                  <>Iniciar Auditoria <Sparkles className="w-4 h-4 ml-2 text-amber-400" /></>
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
            <p><strong>O que será analisado:</strong> estrutura, resumo, resultados (STAR/XYZ), hard/soft skills, palavras-chave ATS, trajetória de carreira, sugestão de cursos/capacitação e otimização de presença digital global (LinkedIn, Gupy, Behance, GitHub, etc.).</p>
          </div>
        </CardContent>
      </Card>

      <UploadProgressModal
        isOpen={loading}
        progress={0}
        completedSegments={[]}
        headline={loadingStep ?? undefined}
      />
    </div>
  )
}
