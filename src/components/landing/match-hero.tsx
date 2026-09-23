'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Briefcase, CheckCircle2, ExternalLink, FileUp, Loader2, Lock, MapPin, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { localeForLang, type Language } from '@/lib/i18n'
import { contactEmail } from '@/lib/i18n/contact'
import { countryLabel } from '@/lib/jobs/country-labels'
import { fill, matchPreviewCopy } from '@/lib/match-preview/copy'
import { isValidToken } from '@/lib/match-preview/rules'
import type { PublicOpportunity, PublicResult } from '@/lib/match-preview/result'
import { getVisitorId, trackOnce } from '@/components/analytics/track-client'

const MAX_BYTES = 5 * 1024 * 1024
const POLL_MS = 2000
/** A tela desiste um pouco depois do servidor (`PROCESSING_TIMEOUT_MS`, 3 min). */
const POLL_GIVE_UP_MS = 4 * 60 * 1000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Phase = 'form' | 'submitting' | 'processing' | 'result' | 'limit' | 'expired' | 'failed'

export interface MatchHeroProps {
  lang: Language
  openJobsCount: number
  countryCode?: string
  onNavigate: (v: 'login' | 'signup' | 'app') => void
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = () => reject(new Error('read'))
    r.readAsDataURL(file)
  })
}

/**
 * O envio de currículo no topo da landing (§2.132): "Procurando emprego? Envie
 * seu currículo e descubra as oportunidades que combinam com você."
 *
 * Mostra de graça UMA oportunidade completa, a contagem das outras (trancadas no
 * servidor, não aqui) e a isca quantificada do teste de legibilidade. O token do
 * resultado vai para a URL (`?lead=`), que é também o link do e-mail: recarregar
 * a página ou abrir o e-mail volta para o mesmo resultado.
 */
export function MatchHero({ lang, openJobsCount, countryCode, onNavigate }: MatchHeroProps) {
  const c = matchPreviewCopy(lang)
  const locale = localeForLang(lang)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [email, setEmail] = useState('')
  const [keep, setKeep] = useState(false)
  const [result, setResult] = useState<PublicResult | null>(null)
  // Cada consulta em andamento tem um número; trocar o número (novo envio,
  // "enviar de novo", desmontar) faz o laço anterior parar sozinho.
  const pollRun = useRef(0)

  const startPolling = useCallback(async (token: string) => {
    const run = ++pollRun.current
    const started = Date.now()
    setPhase('processing')
    while (pollRun.current === run) {
      let wait = POLL_MS
      try {
        const r = await fetch(`/api/public/match-result/${token}`, { cache: 'no-store' })
        if (pollRun.current !== run) return
        if (r.status === 404) return setPhase('expired')
        const data = (await r.json().catch(() => null)) as PublicResult | null
        if (!r.ok || !data) throw new Error('poll')
        if (data.status === 'failed') return setPhase('failed')
        if (data.status === 'ready') {
          setResult(data)
          return setPhase('result')
        }
      } catch {
        wait = POLL_MS * 2
      }
      if (Date.now() - started > POLL_GIVE_UP_MS) return setPhase('failed')
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
  }, [])

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('lead')
    if (isValidToken(token)) startPolling(token)
    return () => {
      pollRun.current++
    }
  }, [startPolling])

  const submit = async () => {
    setError(null)
    if (!file && pasted.trim().length < 30) return setError(c.errorFile)
    if (!EMAIL_PATTERN.test(email.trim())) return setError(c.errorEmail)
    if (file && file.size > MAX_BYTES) return setError(c.errorTooLarge)

    setPhase('submitting')
    try {
      const payload = file ? { pdfBase64: await readAsBase64(file) } : { text: pasted }
      const r = await fetch('/api/public/match-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          email: email.trim(),
          keep,
          lang,
          ...(countryCode ? { country: countryCode } : {}),
          visitorId: getVisitorId(),
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.status === 402 && data.error === 'LIMIT_REACHED') return setPhase('limit')
      if (!r.ok || !isValidToken(data.token)) {
        setPhase('form')
        setError(
          r.status === 429 ? c.errorRate
          : data.error === 'TOO_LARGE' ? c.errorTooLarge
          : data.error === 'NOT_PDF' ? c.errorNotPdf
          : data.error === 'INVALID_EMAIL' ? c.errorEmail
          : c.errorGeneric
        )
        return
      }
      const url = new URL(window.location.href)
      url.searchParams.set('lead', data.token)
      window.history.replaceState(null, '', url.toString())
      startPolling(data.token)
    } catch {
      setPhase('form')
      setError(c.errorGeneric)
    }
  }

  const unlock = () => {
    trackOnce('lead_unlock_clicked', 'match_hero', { locked: result?.lockedCount ?? 0 })
    onNavigate('signup')
  }

  const reset = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('lead')
    window.history.replaceState(null, '', url.toString())
    pollRun.current++
    setResult(null)
    setFile(null)
    setPhase('form')
  }

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-blue-50/60">
      <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-10 min-[900px]:grid-cols-[1fr_1.1fr] min-[900px]:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="w-fit rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {c.eyebrow}
            </p>
            <h1 className="text-pretty text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#0B192E] sm:text-[44px] min-[900px]:text-[54px]">
              {c.title}
            </h1>
            <p className="text-pretty text-xl font-semibold leading-snug text-[#0B63E5] sm:text-2xl">{c.lead}</p>
            {openJobsCount > 0 && (
              <p className="max-w-[520px] text-base leading-relaxed text-slate-600">
                {fill(c.subtitle, { N: new Intl.NumberFormat(locale).format(openJobsCount) })}
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
            {phase === 'form' && (
              <Form
                c={c}
                lang={lang}
                file={file}
                setFile={setFile}
                pasteOpen={pasteOpen}
                setPasteOpen={setPasteOpen}
                pasted={pasted}
                setPasted={setPasted}
                email={email}
                setEmail={setEmail}
                keep={keep}
                setKeep={setKeep}
                error={error}
                onSubmit={submit}
              />
            )}

            {(phase === 'submitting' || phase === 'processing') && (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-600" role="status" aria-live="polite">
                <Loader2 className="h-9 w-9 animate-spin text-[#0B63E5]" />
                <p className="font-semibold text-[#0B192E]">{phase === 'submitting' ? c.submitting : c.processing}</p>
                <p className="text-sm">{c.processingHint}</p>
              </div>
            )}

            {phase === 'limit' && (
              <Notice icon={<Lock className="h-8 w-8 text-[#0B63E5]" />} title={c.limitTitle} text={c.limitText}>
                <Button onClick={() => onNavigate('signup')} className="bg-[#0B63E5] font-bold hover:bg-[#0052CC]">
                  {c.limitCta}
                </Button>
              </Notice>
            )}

            {(phase === 'expired' || phase === 'failed') && (
              <Notice text={phase === 'expired' ? c.expiredText : c.failedText}>
                <Button variant="outline" onClick={reset}>{c.retryCta}</Button>
              </Notice>
            )}

            {phase === 'result' && result && (
              <Result c={c} lang={lang} locale={locale} result={result} onUnlock={unlock} onDiagnosis={() => onNavigate('signup')} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

type Copy = ReturnType<typeof matchPreviewCopy>

function Form(props: {
  c: Copy
  lang: Language
  file: File | null
  setFile: (f: File | null) => void
  pasteOpen: boolean
  setPasteOpen: (v: boolean) => void
  pasted: string
  setPasted: (v: string) => void
  email: string
  setEmail: (v: string) => void
  keep: boolean
  setKeep: (v: boolean) => void
  error: string | null
  onSubmit: () => void
}) {
  const { c } = props
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit()
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          props.setFile(e.target.files?.[0] ?? null)
          props.setPasteOpen(false)
        }}
      />
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#0B63E5]/40 bg-blue-50/40 px-4 py-5 text-center">
        <Button type="button" size="lg" className="h-12 bg-[#0B63E5] px-6 font-bold hover:bg-[#0052CC]" onClick={() => fileRef.current?.click()}>
          <FileUp className="me-2 h-5 w-5" /> {c.uploadCta}
        </Button>
        <p className="text-xs text-slate-500">
          {props.file ? fill(c.fileChosen, { name: props.file.name }) : c.uploadHint}
        </p>
        {!props.pasteOpen && !props.file && (
          <button type="button" className="text-xs font-semibold text-[#0B63E5] underline" onClick={() => props.setPasteOpen(true)}>
            {c.pasteToggle}
          </button>
        )}
        {props.pasteOpen && (
          <textarea
            value={props.pasted}
            onChange={(e) => props.setPasted(e.target.value.slice(0, 50_000))}
            placeholder={c.pastePlaceholder}
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-start text-sm"
          />
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#0B192E]">
        {c.emailLabel}
        <input
          type="email"
          required
          autoComplete="email"
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          placeholder={c.emailPlaceholder}
          className="h-11 rounded-lg border border-slate-300 px-3 text-base font-normal"
        />
        <span className="text-xs font-normal text-slate-500">{c.emailHint}</span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-[#0B192E]">{c.retentionTitle}</legend>
        <RetentionOption checked={!props.keep} onChange={() => props.setKeep(false)} title={c.retentionDelete} hint={c.retentionDeleteHint} />
        <RetentionOption checked={props.keep} onChange={() => props.setKeep(true)} title={c.retentionKeep} hint={c.retentionKeepHint} />
        <a href={`/privacy?lang=${props.lang}`} target="_blank" rel="noopener noreferrer" className="w-fit text-xs text-slate-500 underline decoration-dotted underline-offset-2 hover:text-[#0B63E5]">
          {c.privacyLink}
        </a>
      </fieldset>

      {props.error && <p className="text-sm text-red-600" role="alert">{props.error}</p>}

      <Button type="submit" size="lg" className="h-12 bg-[#0B192E] font-bold text-white hover:bg-[#13294a]">
        {c.submitCta} <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
      </Button>
    </form>
  )
}

function RetentionOption({ checked, onChange, title, hint }: { checked: boolean; onChange: () => void; title: string; hint: string }) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${checked ? 'border-[#0B63E5] bg-blue-50/60' : 'border-slate-200'}`}>
      <input type="radio" name="retention" checked={checked} onChange={onChange} className="mt-1 accent-[#0B63E5]" />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-[#0B192E]">{title}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  )
}

function Notice({ icon, title, text, children }: { icon?: React.ReactNode; title?: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      {icon}
      {title && <p className="text-lg font-extrabold text-[#0B192E]">{title}</p>}
      <p className="max-w-sm text-sm text-slate-600">{text}</p>
      {children}
    </div>
  )
}

function Result({
  c,
  lang,
  locale,
  result,
  onUnlock,
  onDiagnosis,
}: {
  c: Copy
  lang: Language
  locale: string
  result: PublicResult
  onUnlock: () => void
  onDiagnosis: () => void
}) {
  const title = result.profileInsufficient
    ? c.resultTitleNone
    : result.totalMatches === 0
      ? c.resultTitleNone
      : result.totalMatches === 1
        ? c.resultTitleOne
        : fill(c.resultTitleMany, { count: result.totalMatches })

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <h2 className="text-xl font-extrabold leading-snug text-[#0B192E]">{title}</h2>

      {result.profileInsufficient && <p className="text-sm text-slate-600">{c.profileInsufficientText}</p>}
      {!result.profileInsufficient && result.totalMatches === 0 && <p className="text-sm text-slate-600">{c.resultNoneText}</p>}

      {result.free.map((o) => (
        <OpportunityCard key={o.applicationUrl} c={c} lang={lang} locale={locale} o={o} />
      ))}

      {result.lockedCount > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div aria-hidden="true" className="flex select-none flex-col gap-2 blur-[3px]">
            {Array.from({ length: Math.min(3, result.lockedCount) }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-white" />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/70 px-4 text-center">
            <Lock className="h-5 w-5 text-[#0B63E5]" />
            <p className="text-sm font-extrabold text-[#0B192E]">
              {result.lockedCount === 1 ? c.lockedTitleOne : fill(c.lockedTitle, { count: result.lockedCount })}
            </p>
            {result.lockedStrong > 0 && (
              <p className="text-xs text-slate-600">
                {result.lockedCount === 1 ? c.lockedStrongOne : fill(c.lockedStrong, { n: result.lockedStrong })}
              </p>
            )}
            <Button size="sm" onClick={onUnlock} className="mt-1 bg-[#0B63E5] font-bold hover:bg-[#0052CC]">
              {c.unlockCta}
            </Button>
          </div>
        </div>
      )}

      <Teaser c={c} result={result} onDiagnosis={onDiagnosis} />

      <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {result.recruiterOptIn ? fill(c.keptNote, { email: contactEmail(lang) }) : c.deleteNote}
      </p>
    </div>
  )
}

function OpportunityCard({ c, lang, locale, o }: { c: Copy; lang: Language; locale: string; o: PublicOpportunity }) {
  const place = [o.city, o.region, o.country ? countryLabel(o.country, lang) : null].filter(Boolean).join(', ')
  const remote = o.remoteType === 'remote' || o.remoteType === 'hybrid' || o.remoteType === 'onsite' ? c.remote[o.remoteType] : null
  const published = o.publishedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(o.publishedAt)) : null
  const salary = formatSalary(o, locale)

  return (
    <article className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">{c.freeBadge}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" /> {c.fit[o.overall]}
        </span>
      </div>
      <h3 className="text-base font-extrabold text-[#0B192E]">{o.title}</h3>
      <p className="flex items-center gap-1.5 text-sm text-slate-700">
        <Briefcase className="h-3.5 w-3.5 shrink-0" /> {o.company}
      </p>
      {(place || remote) && (
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> {[place, remote].filter(Boolean).join(' · ')}
        </p>
      )}
      {salary && <p className="mt-1 text-sm font-semibold text-slate-800">{salary}</p>}
      {published && <p className="mt-1 text-xs text-slate-500">{fill(c.publishedOn, { date: published })}</p>}
      <Button asChild size="sm" className="mt-3 bg-emerald-600 font-bold hover:bg-emerald-700">
        <a href={o.applicationUrl} target="_blank" rel="noopener noreferrer nofollow">
          {c.applyCta} <ExternalLink className="ms-1.5 h-3.5 w-3.5" />
        </a>
      </Button>
      <p className="mt-1.5 text-[11px] text-slate-500">{c.applyNote}</p>
    </article>
  )
}

function formatSalary(o: PublicOpportunity, locale: string): string | null {
  if (!o.currency || (o.salaryMin == null && o.salaryMax == null)) return null
  try {
    const f = new Intl.NumberFormat(locale, { style: 'currency', currency: o.currency, maximumFractionDigits: 0 })
    if (o.salaryMin != null && o.salaryMax != null && o.salaryMin !== o.salaryMax) {
      return `${f.format(o.salaryMin)} – ${f.format(o.salaryMax)}`
    }
    return f.format((o.salaryMax ?? o.salaryMin)!)
  } catch {
    return null
  }
}

function Teaser({ c, result, onDiagnosis }: { c: Copy; result: PublicResult; onDiagnosis: () => void }) {
  const { teaser, ats } = result
  const headline =
    teaser.total === 0 ? c.teaserNone : teaser.total === 1 ? c.teaserOne : fill(c.teaserMany, { n: teaser.total })

  return (
    <div className="rounded-xl bg-[#0B192E] p-4 text-white">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8fa6c4]">
        {c.atsScoreLabel}: <span className="text-white">{ats.score}/100</span>
      </p>
      <p className="mt-1.5 text-sm font-bold leading-snug">{headline}</p>
      {teaser.byCategory.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 text-sm text-[#cfdbeb]">
          {teaser.byCategory.map((b) => (
            <li key={b.category}>• {fill(c.teaserCategories[b.category], { n: b.count })}</li>
          ))}
        </ul>
      )}
      {teaser.total > 0 && (
        <>
          <p className="mt-2 text-sm text-[#cfdbeb]">{c.teaserClose}</p>
          <Button size="sm" onClick={onDiagnosis} className="mt-3 bg-white font-bold text-[#0B192E] hover:bg-blue-50">
            {c.teaserCta} <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
          </Button>
        </>
      )}
    </div>
  )
}
