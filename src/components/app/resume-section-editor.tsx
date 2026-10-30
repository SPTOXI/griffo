'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Check, Loader2, Pencil, Save, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { internalFetch } from '@/lib/internal-fetch'
import type { Language } from '@/lib/i18n'
import { RESUME_EDITOR_COPY } from '@/lib/resume-editor/copy'
import {
  MAX_BLOCK_IMPROVEMENTS,
  MAX_INSTRUCTION_CHARS,
  isHeadingOnly,
  joinBlocks,
  splitBlocks,
  type ResumeBlock,
} from '@/lib/resume-editor/sections'

const fill = (t: string, n: number) => t.replace('{n}', String(n))

/**
 * Editor por partes do currículo reescrito (§2.161).
 *
 * Cada bloco (topo, cada seção, cada experiência) se edita à mão ou com
 * "Melhorar com IA". A sugestão da IA aparece ao lado do texto atual e só
 * entra se a pessoa escolher; nada é gravado até "Salvar alterações".
 */
export function ResumeSectionEditor(props: {
  resumeId: string
  content: string
  used: number
  lang: Language
  onSaved: (content: string) => void
  onClose: () => void
}) {
  const c = RESUME_EDITOR_COPY[props.lang] ?? RESUME_EDITOR_COPY.en
  const [blocks, setBlocks] = useState<ResumeBlock[]>(() => splitBlocks(props.content))
  const [editing, setEditing] = useState<number | null>(null)
  const [instructions, setInstructions] = useState<Record<number, string>>({})
  const [suggestions, setSuggestions] = useState<Record<number, string>>({})
  const [improving, setImproving] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(Math.max(0, MAX_BLOCK_IMPROVEMENTS - props.used))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  // No celular o editor abre abaixo das palavras-chave, fora da tela: rola até ele.
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), [])

  const setText = (i: number, text: string) => {
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, text } : b)))
    setDirty(true)
  }

  const improve = async (i: number) => {
    setImproving(i)
    try {
      const r = await internalFetch('/api/resume/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: props.resumeId,
          block: blocks[i].text,
          instruction: instructions[i]?.trim() || undefined,
          lang: props.lang,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.status === 429 && data.error === 'LIMIT_REACHED') {
        setRemaining(0)
        toast.error(c.limitReached)
        return
      }
      if (!r.ok || typeof data.block !== 'string') {
        toast.error(c.error)
        return
      }
      setSuggestions((s) => ({ ...s, [i]: data.block }))
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
    } catch {
      toast.error(c.error)
    } finally {
      setImproving(null)
    }
  }

  const accept = (i: number) => {
    setText(i, suggestions[i])
    setSuggestions(({ [i]: _, ...rest }) => rest)
  }

  const save = async () => {
    setSaving(true)
    const content = joinBlocks(blocks)
    try {
      const r = await internalFetch('/api/resume/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: props.resumeId, content }),
      })
      if (!r.ok) {
        toast.error(c.error)
        return
      }
      setDirty(false)
      setEditing(null)
      toast.success(c.saved)
      props.onSaved(content)
    } catch {
      toast.error(c.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card ref={rootRef} className="scroll-mt-20 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pencil className="h-4 w-4 text-primary" /> {c.title}
        </CardTitle>
        <CardDescription>{c.intro}</CardDescription>
        <p className="text-xs font-semibold text-slate-600">{remaining > 0 ? fill(c.remaining, remaining) : c.limitReached}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {blocks.map((b, i) =>
          isHeadingOnly(b) ? (
            <p key={i} className="mt-2 text-sm font-black uppercase tracking-wide text-primary">
              {b.text.replace(/^#+\s*/, '')}
            </p>
          ) : (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
              {/* O título do bloco já aparece no próprio texto; só o topo ganha rótulo. */}
              {!b.heading && (
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.topBlock}</p>
              )}
              {editing === i ? (
                <textarea
                  value={b.text}
                  onChange={(e) => setText(i, e.target.value)}
                  rows={Math.min(16, Math.max(4, b.text.split('\n').length + 1))}
                  className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs leading-relaxed"
                />
              ) : (
                <div className="prose-sm max-w-none text-xs leading-relaxed text-slate-700 [&_h1]:text-base [&_h1]:font-black [&_h2]:font-bold [&_h3]:font-bold [&_li]:ms-4 [&_li]:list-disc">
                  <ReactMarkdown>{b.text}</ReactMarkdown>
                </div>
              )}

              {suggestions[i] && (
                <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50/60 p-3">
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5" /> {c.suggestionTitle}
                  </p>
                  <div className="text-xs leading-relaxed text-slate-800 [&_h1]:font-black [&_h2]:font-bold [&_h3]:font-bold [&_li]:ms-4 [&_li]:list-disc">
                    <ReactMarkdown>{suggestions[i]}</ReactMarkdown>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => accept(i)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Check className="me-1 h-3.5 w-3.5" /> {c.useSuggestion}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSuggestions(({ [i]: _, ...rest }) => rest)}>
                      <X className="me-1 h-3.5 w-3.5" /> {c.discard}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button size="sm" variant="outline" onClick={() => setEditing(editing === i ? null : i)}>
                  {editing === i ? <Check className="me-1 h-3.5 w-3.5" /> : <Pencil className="me-1 h-3.5 w-3.5" />}
                  {editing === i ? c.done : c.edit}
                </Button>
                {remaining > 0 && (
                  <>
                    <input
                      value={instructions[i] ?? ''}
                      onChange={(e) => setInstructions((s) => ({ ...s, [i]: e.target.value.slice(0, MAX_INSTRUCTION_CHARS) }))}
                      placeholder={c.instructionPlaceholder}
                      className="h-9 flex-1 rounded-md border border-slate-300 px-2.5 text-xs"
                    />
                    <Button size="sm" disabled={improving !== null} onClick={() => improve(i)} className="bg-primary">
                      {improving === i ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="me-1 h-3.5 w-3.5" />}
                      {improving === i ? c.improving : c.improve}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        )}

        <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-slate-200 bg-white py-3 sm:flex-row sm:items-center">
          {dirty && <p className="text-xs font-semibold text-amber-700">{c.unsaved}</p>}
          <div className="flex gap-2 sm:ms-auto">
            <Button variant="outline" onClick={props.onClose}>
              {c.close}
            </Button>
            <Button onClick={save} disabled={!dirty || saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
              {saving ? c.saving : c.save}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
