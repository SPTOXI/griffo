'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, FileUp, Info, Loader2, Lock, Share2, ShieldCheck, XCircle } from 'lucide-react'
import { ATS_CHECK_COPY, ATS_CHECK_PATH, type AtsCheckLang } from '@/lib/ats-check/copy'
import type { AtsCheckResult, AtsSeverity } from '@/lib/ats-check/score'
import { getVisitorId, trackOnce } from '@/components/analytics/track-client'

const MAX_BYTES = 5 * 1024 * 1024
/** Marca local de que o teste grátis já foi usado (a trava real é no servidor). */
const USED_KEY = 'gw_ats_check_used'

const LEVEL_STYLE = {
  good: { ring: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  attention: { ring: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  risk: { ring: 'text-red-600', bg: 'bg-red-50 border-red-200' },
} as const

const SEVERITY_ICON: Record<AtsSeverity, React.ReactNode> = {
  critical: <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
  tip: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
}

function markUsed() {
  try {
    localStorage.setItem(USED_KEY, String(Date.now()))
  } catch {}
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = () => reject(new Error('read'))
    r.readAsDataURL(file)
  })
}

export function AtsCheckClient({ lang }: { lang: AtsCheckLang }) {
  const c = ATS_CHECK_COPY[lang]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AtsCheckResult | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const [limited, setLimited] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(USED_KEY)) setLimited(true)
    } catch {}
  }, [])

  const run = async (payload: { pdfBase64?: string; text?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/public/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, visitorId: getVisitorId() }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.status === 402 && data.error === 'LIMIT_REACHED') {
        markUsed()
        setLimited(true)
        return
      }
      if (!r.ok) {
        setError(
          r.status === 429 ? c.errorRate
          : data.error === 'TOO_LARGE' ? c.errorTooLarge
          : data.error === 'NOT_PDF' ? c.errorNotPdf
          : c.errorGeneric
        )
        return
      }
      markUsed()
      setResult(data as AtsCheckResult)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError(c.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) return setError(c.errorTooLarge)
    try {
      await run({ pdfBase64: await readAsBase64(file) })
    } catch {
      setError(c.errorGeneric)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const share = async () => {
    if (!result) return
    const url = `https://griffo.work${ATS_CHECK_PATH}?lang=${lang}&utm_source=share&utm_medium=ats_check`
    const text = `${c.shareText.replace('{score}', String(result.score))} ${url}`
    trackOnce('ats_check_shared', `share_${Date.now()}`, { score: result.score })
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch {
      return
    }
    // Sem compartilhamento nativo (computador): copia o texto com o link.
    await navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (result) {
    const style = LEVEL_STYLE[result.level]
    const level = c.levels[result.level]
    const pct = result.score
    return (
      <div className="space-y-5">
        <Card className={`border-2 ${style.bg}`}>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 shrink-0" aria-label={`${c.scoreLabel}: ${pct}/100`}>
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${pct} 100`} strokeLinecap="round" className={style.ring} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-[#0B192E]">{pct}</span>
                <span className="text-[10px] text-slate-500">/ 100</span>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.scoreLabel}</p>
              <h2 className="text-xl font-extrabold text-[#0B192E] mt-1">{level.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{level.text}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Button size="sm" variant="outline" onClick={share}>
                  <Share2 className="w-4 h-4 mr-1.5" /> {copied ? c.copied : c.shareCta}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-[#0B192E] mb-3">{c.issuesTitle}</h3>
            {result.issues.length === 0 ? (
              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {c.noIssues}
              </p>
            ) : (
              <ul className="space-y-3">
                {result.issues.map((i) => (
                  <li key={i.code} className="flex gap-2.5">
                    {SEVERITY_ICON[i.severity]}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {c.issues[i.code].title}{' '}
                        <span className="text-[10px] font-bold uppercase text-slate-400">· {c.severity[i.severity]}</span>
                      </p>
                      <p className="text-xs text-slate-600">{c.issues[i.code].why}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0B192E] to-slate-900 text-white border-0">
          <CardContent className="p-6 text-center space-y-3">
            <h3 className="text-lg font-extrabold">{c.nextTitle}</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">{c.nextText}</p>
            <Button asChild size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] font-bold">
              <Link href={`/?view=signup&utm_source=ats_check&utm_medium=result&lang=${lang}`}>{c.nextCta}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (limited) {
    return (
      <Card className="border-2 border-[#0B63E5]/30 bg-white">
        <CardContent className="p-6 sm:p-8 text-center space-y-3">
          <Lock className="w-8 h-8 text-[#0B63E5] mx-auto" />
          <h2 className="text-lg font-extrabold text-[#0B192E]">{c.limitTitle}</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{c.limitText}</p>
          <Button asChild size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] font-bold">
            <Link href={`/?view=signup&utm_source=ats_check&utm_medium=limit&lang=${lang}`}>{c.nextCta}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-dashed border-[#0B63E5]/40 bg-white">
      <CardContent className="p-6 sm:p-8 text-center space-y-4">
        {loading ? (
          <div className="py-8 flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B63E5]" />
            <p className="text-sm">{c.checking}</p>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] font-bold h-12 px-6" onClick={() => fileRef.current?.click()}>
              <FileUp className="w-5 h-5 mr-2" /> {c.uploadCta}
            </Button>
            <p className="text-xs text-slate-500">{c.uploadHint}</p>
            {!pasteOpen ? (
              <button className="text-xs font-semibold text-[#0B63E5] underline" onClick={() => setPasteOpen(true)}>
                {c.pasteToggle}
              </button>
            ) : (
              <div className="space-y-2 text-left">
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value.slice(0, 50_000))}
                  placeholder={c.pastePlaceholder}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
                <Button variant="outline" className="w-full" disabled={pasted.trim().length < 30} onClick={() => run({ text: pasted })}>
                  {c.pasteCta}
                </Button>
              </div>
            )}
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> {c.privacy}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {c.bullets.map((b) => (
            <Badge key={b} variant="outline" className="text-[11px] font-medium">{b}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
