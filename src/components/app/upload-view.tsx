'use client'

import { useState, useRef } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function UploadView() {
  const { openResume, setView } = useNav()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<'text' | 'markdown'>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = content.length
  const maxChars = 20000
  const minChars = 80

  const handleFile = (file: File) => {
    if (file.size > 500 * 1024) {
      setError('Arquivo muito grande (máx. 500KB).')
      return
    }
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

  const submit = async () => {
    setError(null)
    if (content.length < minChars) {
      setError(`Currículo muito curto. Cole pelo menos ${minChars} caracteres.`)
      return
    }
    if (content.length > maxChars) {
      setError(`Currículo muito longo (máx. ${maxChars} caracteres).`)
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, title }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Erro ao salvar.')
        return
      }
      toast.success('Currículo enviado! Iniciando análise…')
      // Auto-trigger analysis
      const ar = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: data.resume.id }),
      })
      const adata = await ar.json()
      if (!ar.ok) {
        setError(adata.error || 'Falha ao analisar.')
        openResume(data.resume.id, 'analysis')
        return
      }
      openResume(data.resume.id, 'analysis')
    } catch (e: any) {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enviar currículo</h1>
        <p className="text-sm text-slate-500 mt-1">Cole o texto do seu currículo ou anexe um arquivo .txt ou .md. A análise é gratuita.</p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Como obter o melhor resultado:</strong> copie o conteúdo do seu PDF/Word colando aqui como texto puro. Mantenha seções como <em>Resumo, Experiência, Formação, Habilidades</em>. Não precisa formatar — a IA lê o conteúdo, não o design.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
                <Upload className="w-4 h-4 mr-1.5" /> Anexar arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
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
              placeholder={`Exemplo:\n\nMaria Souza\nDesenvolvedora Front-end\nmaria@email.com | (11) 99999-9999 |linkedin.com/in/mariasouza\n\nRESUMO\nDesenvolvedora front-end com 5 anos de experiência em React, TypeScript e design systems...\n\nEXPERIÊNCIA\nSênior Front-end - Empresa X (2022-presente)\n- Liderei a migração de Angular para React...\n- Reduzi o tempo de carregamento em 40%...\n\n...`}
              className="min-h-[280px] font-mono text-xs leading-relaxed resize-y"
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Análise gratuita · Dados criptografados · LGPD
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('dashboard')} disabled={loading}>Cancelar</Button>
              <Button
                onClick={submit}
                disabled={loading || content.length < minChars}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando…</>
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
            <p><strong>O que será analisado:</strong> estrutura, resumo profissional, impacto quantificado, habilidades, experiência, palavras-chave/ATS, formação e linguagem.</p>
            <p><strong>Tempo estimado:</strong> 15–30 segundos. <strong>Custo real da análise:</strong> ~ R$ 0,12 (you não paga nada no plano gratuito).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
