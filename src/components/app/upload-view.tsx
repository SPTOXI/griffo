'use client'

import { useState, useRef } from 'react'
import { useNav } from '@/store/auth'
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
import { toast } from 'sonner'

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
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<'text' | 'markdown'>('text')
  
  // Dynamic Custom Social Profiles State
  const [socialProfiles, setSocialProfiles] = useState<CustomSocialField[]>([
    { id: '1', platform: 'LinkedIn', url: '' },
    { id: '2', platform: 'Gupy', url: '' },
    { id: '3', platform: 'GitHub', url: '' },
  ])
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

  const submit = async () => {
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
      const r = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format: format || 'text',
          title: title || undefined,
          socialLinks,
          socialConsent: socialConsent || false,
          ...(pdfBase64 ? { pdfBase64 } : {}),
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || 'Erro ao salvar currículo.')
        setLoading(false)
        return
      }
      toast.success('Currículo enviado! Gerando laudo de análise…')

      const ar = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: data.resume.id }),
      })
      const adata = await ar.json().catch(() => ({}))
      if (!ar.ok) {
        toast.error(adata.error || 'Ocorreu uma falha ao gerar a análise.')
        openResume(data.resume.id, 'analysis')
        return
      }
      openResume(data.resume.id, 'analysis')
    } catch (e: any) {
      setError('Erro de conexão ao enviar o currículo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enviar currículo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cole o texto do seu currículo ou anexe um arquivo .pdf, .txt ou .md. A análise é gratuita.
        </p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Como obter o melhor resultado:</strong> Você pode anexar um arquivo <strong>.pdf</strong>, <strong>.txt</strong> ou <strong>.md</strong>, ou copiar e colar o texto diretamente.
        </AlertDescription>
      </Alert>

      <Card>
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

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Análise gratuita · Dados criptografados · LGPD / GDPR
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('dashboard')} disabled={loading}>Cancelar</Button>
              <Button
                onClick={submit}
                disabled={loading || content.length < minChars}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…</>
                ) : (
                  <>Analisar currículo <Sparkles className="w-4 h-4 ml-2" /></>
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
            <p><strong>Tempo estimado:</strong> 15–30 segundos. <strong>Custo real da análise:</strong> ~ R$ 0,12 (você não paga nada no plano gratuito).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
