'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Briefcase, CheckCircle2, ExternalLink, FileUp, Loader2, Lock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { localeForLang, type Language } from '@/lib/i18n'
import { contactEmail } from '@/lib/i18n/contact'
import { countryLabel } from '@/lib/jobs/country-labels'
import { fill, matchPreviewCopy } from '@/lib/match-preview/copy'
import { percentileLine } from '@/lib/analytics/percentile-copy'
import { isValidToken } from '@/lib/match-preview/rules'
import type { PublicOpportunity, PublicResult } from '@/lib/match-preview/result'
import { getVisitorId, trackOnce } from '@/components/analytics/track-client'
import { LEAD_UNLOCK_EVENT, publishLeadPins } from './lead-pins'
import { HOME_MAP_COPY } from '@/lib/landing/home-map-copy'
import { thousandsLabel, type SocialProof } from '@/lib/analytics/social-proof'
import { useNav } from '@/store/auth'
import { RESUME_BUILDER_COPY } from '@/lib/resume-builder/copy'
import { assembleResumeText, type BuilderAnswers, type BuilderTeaser } from '@/lib/resume-builder/answers'
import { saveResumeDraft } from '@/lib/resume-builder/draft'
import { SECTION_TITLES } from '@/lib/resume-rewrite/section-titles'
import { EMPTY_BUILDER_DRAFT, ResumeBuilderForm, type BuilderDraft } from './resume-builder-form'

const MAX_BYTES = 3 * 1024 * 1024
const POLL_MS = 2000
/** A tela desiste um pouco depois do servidor (`PROCESSING_TIMEOUT_MS`, 3 min). */
const POLL_GIVE_UP_MS = 4 * 60 * 1000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Phase = 'form' | 'submitting' | 'processing' | 'result' | 'limit' | 'expired' | 'failed'

export interface MatchHeroProps {
  lang: Language
  openJobsCount: number
  /** Currículos já analisados, para a prova social sob o título. */
  socialProof?: SocialProof | null
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
export function MatchHero({ lang, openJobsCount, socialProof = null, countryCode, onNavigate }: MatchHeroProps) {
  const c = matchPreviewCopy(lang)
  const locale = localeForLang(lang)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [email, setEmail] = useState('')
  const [keep, setKeep] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [result, setResult] = useState<PublicResult | null>(null)
  // Criador de currículo (§2.160): as respostas ficam aqui, e não no
  // formulário, para sobreviver a uma falha de envio que volta ao formulário.
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderDraft, setBuilderDraft] = useState<BuilderDraft>(EMPTY_BUILDER_DRAFT)
  const [builderStep, setBuilderStep] = useState(0)
  const setNavView = useNav((s) => s.setView)
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
          publishLeadPins(data.mapPins ?? [])
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
    const params = new URLSearchParams(window.location.search)
    const token = params.get('lead')
    if (isValidToken(token)) startPolling(token)
    // Vindo do link "não tenho currículo" de outra página (teste ATS).
    else if (params.get('builder') === '1') setBuilderOpen(true)
    return () => {
      pollRun.current++
    }
  }, [startPolling])

  const submit = async (builder?: BuilderAnswers) => {
    setError(null)
    if (!builder && !file && pasted.trim().length < 30) return setError(c.errorFile)
    if (!EMAIL_PATTERN.test(email.trim())) return setError(c.errorEmail)
    if (file && file.size > MAX_BYTES) return setError(c.errorTooLarge)

    setPhase('submitting')
    // Etapa em que parou, para a mensagem e para a telemetria: falha no aparelho
    // (ler o arquivo) ou na rede não chega ao servidor e não deixa rastro lá.
    let stage: 'read' | 'network' | 'response' = 'read'
    const fail = (message: string, meta: Record<string, string | number | boolean | null> = {}) => {
      setPhase('form')
      setError(message)
      trackOnce('lead_submit_failed', `match_hero_${stage}`, {
        stage,
        ...(builder ? { builder: true } : file ? { fileKb: Math.round(file.size / 1024), fileType: file.type || 'none' } : { pasted: true }),
        ...meta,
      })
    }
    try {
      const payload = builder ? { builder } : file ? { pdfBase64: await readAsBase64(file) } : { text: pasted }
      stage = 'network'
      const r = await fetch('/api/public/match-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          email: email.trim(),
          keep,
          marketing,
          lang,
          ...(countryCode ? { country: countryCode } : {}),
          visitorId: getVisitorId(),
        }),
      })
      stage = 'response'
      const data = await r.json().catch(() => ({}))
      if (r.status === 402 && data.error === 'LIMIT_REACHED') return setPhase('limit')
      if (!r.ok || !isValidToken(data.token)) {
        fail(
          r.status === 429 ? c.errorRate
          : r.status === 413 || data.error === 'TOO_LARGE' ? c.errorTooLarge
          : data.error === 'NOT_PDF' ? c.errorNotPdf
          : data.error === 'INVALID_EMAIL' ? c.errorEmail
          : c.errorGeneric,
          { status: r.status, code: typeof data.error === 'string' ? data.error.slice(0, 40) : null }
        )
        return
      }
      // O currículo criado vai para o aparelho: é ele que abre preenchido no
      // app depois do cadastro, quando a pessoa libera a versão completa.
      if (builder) saveResumeDraft(assembleResumeText(builder, lang), builder.targetRole)
      const url = new URL(window.location.href)
      url.searchParams.set('lead', data.token)
      window.history.replaceState(null, '', url.toString())
      startPolling(data.token)
    } catch {
      fail(stage === 'read' ? c.errorRead : stage === 'network' ? c.errorNetwork : c.errorGeneric)
    }
  }

  const unlock = () => {
    trackOnce('lead_unlock_clicked', 'match_hero', { locked: result?.lockedCount ?? 0 })
    onNavigate('signup')
  }

  // Liberar o currículo criado: cadastro, e o app abre no envio, já preenchido.
  const unlockBuilder = () => {
    trackOnce('lead_unlock_clicked', 'match_hero_builder', { builder: true })
    setNavView('upload')
    onNavigate('signup')
  }

  // O cadeado do mapa da home (outra seção) pede o mesmo cadastro; a telemetria sai lá, com `home_map`.
  useEffect(() => {
    const go = () => onNavigate('signup')
    window.addEventListener(LEAD_UNLOCK_EVENT, go)
    return () => window.removeEventListener(LEAD_UNLOCK_EVENT, go)
  }, [onNavigate])

  const reset = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('lead')
    window.history.replaceState(null, '', url.toString())
    pollRun.current++
    setResult(null)
    publishLeadPins([])
    setFile(null)
    setPhase('form')
  }

  return (
    <section id="upload" className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-blue-50/60">
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
              <div className="flex w-fit max-w-[560px] items-start gap-3 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3.5 shadow-[0_1px_2px_rgba(11,99,229,0.06),0_8px_24px_-12px_rgba(11,99,229,0.25)]">
                <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0" title="Atualizado em tempo real">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <p className="text-pretty text-lg font-semibold leading-snug text-slate-800 sm:text-xl">
                  {(() => {
                    const [before, after] = c.subtitle.split('{N}')
                    return (
                      <>
                        {before}
                        <span className="font-extrabold text-[#0B63E5]">
                          {new Intl.NumberFormat(locale).format(openJobsCount)}
                        </span>
                        {after}
                      </>
                    )
                  })()}
                </p>
              </div>
            )}
            {socialProof && (
              // Selo em destaque (pedido do operador): o número em azul e negrito, partindo
              // o texto do idioma em volta de `{n}` para não mudar as 12 traduções.
              <p className="inline-flex w-fit items-center gap-2.5 rounded-2xl border border-blue-200 sm:rounded-full bg-blue-50 px-4 py-2 text-base font-semibold text-[#0B192E] shadow-sm sm:text-lg">
                <Sparkles className="h-5 w-5 shrink-0 text-[#0B63E5]" aria-hidden="true" />
                <span>
                  {(() => {
                    const template = socialProof.kind === 'resumes' ? c.socialProof : c.socialProofJobs
                    const n =
                      socialProof.kind === 'resumes'
                        ? new Intl.NumberFormat(locale).format(socialProof.n)
                        : thousandsLabel(lang, socialProof.n, locale)
                    const [before, after = ''] = template.split('{n}')
                    return (
                      <>
                        {before}
                        <strong className="font-extrabold text-[#0B63E5]">{n}</strong>
                        {after}
                      </>
                    )
                  })()}
                </span>
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
            {phase === 'form' && builderOpen && (
              <ResumeBuilderForm
                lang={lang}
                value={builderDraft}
                onChange={setBuilderDraft}
                step={builderStep}
                setStep={setBuilderStep}
                error={error}
                setError={setError}
                onClose={() => {
                  setError(null)
                  setBuilderOpen(false)
                }}
                onSubmit={(answers) => submit(answers)}
                contactSlot={
                  <ContactFields
                    c={c}
                    lang={lang}
                    email={email}
                    setEmail={setEmail}
                    keep={keep}
                    setKeep={setKeep}
                    marketing={marketing}
                    setMarketing={setMarketing}
                  />
                }
              />
            )}

            {phase === 'form' && !builderOpen && (
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
                marketing={marketing}
                setMarketing={setMarketing}
                error={error}
                onSubmit={() => submit()}
                onOpenBuilder={() => {
                  setError(null)
                  setBuilderOpen(true)
                  trackOnce('builder_opened', 'match_hero')
                }}
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
              <Result
                c={c}
                lang={lang}
                locale={locale}
                result={result}
                onUnlock={unlock}
                onDiagnosis={() => onNavigate('signup')}
                onUnlockBuilder={unlockBuilder}
              />
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
  marketing: boolean
  setMarketing: (v: boolean) => void
  error: string | null
  onSubmit: () => void
  onOpenBuilder: () => void
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
        {!props.file && (
          <button type="button" className="mt-1 text-sm font-bold text-[#0B63E5] hover:underline" onClick={props.onOpenBuilder}>
            {RESUME_BUILDER_COPY[props.lang].openLink}
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

      <ContactFields {...props} />

      {props.error && <p className="text-sm text-red-600" role="alert">{props.error}</p>}

      <Button type="submit" size="lg" className="h-12 bg-[#0B192E] font-bold text-white hover:bg-[#13294a]">
        {c.submitCta} <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
      </Button>
    </form>
  )
}

/** E-mail e consentimentos: os mesmos no envio de arquivo e no criador de currículo. */
function ContactFields(props: {
  c: Copy
  lang: Language
  email: string
  setEmail: (v: string) => void
  keep: boolean
  setKeep: (v: boolean) => void
  marketing: boolean
  setMarketing: (v: boolean) => void
}) {
  const { c } = props
  return (
    <>
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

      {/* Dois consentimentos separados, os dois opt-in: guardar o currículo
          para empresas e receber a sequência de e-mails. Sem marcar nada,
          vale a regra de sempre (apagado depois do resultado). A opção
          explícita "apagar em 24h" saiu da tela a pedido do operador. */}
      <div className="flex flex-col gap-0.5 rounded-lg border border-slate-200 p-1.5">
        <OptIn checked={props.marketing} onChange={props.setMarketing} title={c.marketingOptIn} hint={c.marketingOptInHint} />
        <OptIn checked={props.keep} onChange={props.setKeep} title={c.retentionKeep} hint={c.retentionKeepHint} />
        <a href={`/privacy?lang=${props.lang}`} target="_blank" rel="noopener noreferrer" className="ms-1 mb-0.5 w-fit text-xs text-slate-500 underline decoration-dotted underline-offset-2 hover:text-[#0B63E5]">
          {c.privacyLink}
        </a>
      </div>
    </>
  )
}

/**
 * Caixa de consentimento compacta: as duas cabem sem alongar o formulário no
 * celular. Sem borda de cartão; a dica vai em letra menor, na mesma linha
 * de leitura.
 */
function OptIn({ checked, onChange, title, hint }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <label className="flex cursor-pointer gap-2.5 rounded-md px-1 py-1.5 hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B63E5]" />
      <span className="text-[13px] leading-snug text-[#0B192E]">
        {title} <span className="text-[11px] text-slate-500">{hint}</span>
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
  onUnlockBuilder,
}: {
  c: Copy
  lang: Language
  locale: string
  result: PublicResult
  onUnlock: () => void
  onDiagnosis: () => void
  onUnlockBuilder: () => void
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
      {result.builder && <BuilderCard lang={lang} teaser={result.builder} onUnlock={onUnlockBuilder} />}

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

      {(result.mapPins?.length ?? 0) > 0 && (
        <button
          type="button"
          onClick={() => document.getElementById('home-jobs-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex items-center gap-1.5 self-start text-sm font-bold text-[#E5243B] hover:underline"
        >
          <MapPin className="h-4 w-4" />
          {HOME_MAP_COPY[lang].seeOnMap}
        </button>
      )}

      {/* Currículo criado aqui: a lista de problemas seria do rascunho que nós
          montamos, e o cartão do currículo acima já faz a oferta. */}
      {!result.builder && <Teaser c={c} lang={lang} result={result} onDiagnosis={onDiagnosis} />}

      <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {result.recruiterOptIn ? fill(c.keptNote, { email: contactEmail(lang) }) : result.marketingOptIn ? c.nurtureNote : c.deleteNote}
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

function Teaser({ c, lang, result, onDiagnosis }: { c: Copy; lang: Language; result: PublicResult; onDiagnosis: () => void }) {
  const { teaser, ats } = result
  const headline =
    teaser.total === 0 ? c.teaserNone : teaser.total === 1 ? c.teaserOne : fill(c.teaserMany, { n: teaser.total })

  return (
    <div className="rounded-xl bg-[#0B192E] p-4 text-white">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8fa6c4]">
        {c.atsScoreLabel}: <span className="text-white">{ats.score}/100</span>
      </p>
      {result.percentile != null && (
        <p className="mt-1 text-xs text-[#cfdbeb]">{percentileLine(lang, result.percentile)}</p>
      )}
      <p className="mt-1.5 text-sm font-bold leading-snug">{headline}</p>
      {teaser.byCategory.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 text-sm text-[#cfdbeb]">
          {teaser.byCategory.map((b) => (
            <li key={b.category}>• {fill(c.teaserCategories[b.category], { n: b.count })}</li>
          ))}
        </ul>
      )}
      {result.revealedIssue && (
        <div className="mt-3 rounded-lg bg-white/10 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8fa6c4]">{c.teaserRevealed}</p>
          <p className="mt-1 text-sm font-bold">{result.revealedIssue.title}</p>
          <p className="mt-0.5 text-sm text-[#cfdbeb]">{result.revealedIssue.why}</p>
        </div>
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

/**
 * O currículo criado na home (§2.160): a primeira experiência escrita pela IA
 * e, no lugar do resto, linhas borradas. As linhas são desenho, não texto: o
 * servidor só mandou a contagem do que falta (`BuilderTeaser.locked`).
 */
function BuilderCard({ lang, teaser, onUnlock }: { lang: Language; teaser: BuilderTeaser; onUnlock: () => void }) {
  const c = RESUME_BUILDER_COPY[lang]
  const titles = SECTION_TITLES[lang] ?? SECTION_TITLES.en
  const { first, locked } = teaser
  const lockedSections = [
    ...(locked.experiences > 0 ? [{ title: titles.experience, lines: Math.min(6, locked.experiences * 3) }] : []),
    ...(locked.education > 0 ? [{ title: titles.education, lines: Math.min(4, locked.education * 2) }] : []),
    ...(locked.skills ? [{ title: titles.skills, lines: 2 }] : []),
    ...(locked.languages ? [{ title: titles.languages, lines: 1 }] : []),
    // Sempre há o resumo profissional, que só a versão completa escreve.
    { title: titles.summary, lines: 3 },
  ]
  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-[#0B63E5]/30 bg-blue-50/40 p-4">
      <p className="flex items-center gap-1.5 text-lg font-extrabold text-[#0B192E]">
        <Sparkles className="h-5 w-5 text-[#0B63E5]" aria-hidden="true" /> {c.resultTitle}
      </p>
      <p className="text-sm text-slate-600">{c.resultIntro}</p>
      <article className="rounded-lg border border-slate-200 bg-white p-3.5">
        <h3 className="text-[15px] font-extrabold text-[#0B192E]">{first.role}</h3>
        {(first.company || first.period) && (
          <p className="text-sm text-slate-600">{[first.company, first.period].filter(Boolean).join(' · ')}</p>
        )}
        <ul className="mt-2 flex list-disc flex-col gap-1 ps-5 text-sm text-slate-800">
          {first.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </article>
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5">
        <div aria-hidden="true" className="flex select-none flex-col gap-3 blur-[3px]">
          {lockedSections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-1.5">
              <div className="h-3.5 w-2/5 rounded bg-slate-300" />
              {Array.from({ length: sec.lines }).map((_, i) => (
                <div key={i} className={`h-2.5 rounded bg-slate-200 ${i % 2 ? 'w-4/5' : 'w-full'}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/70 px-4 text-center">
          <Lock className="h-5 w-5 text-[#0B63E5]" />
          <p className="text-sm font-extrabold text-[#0B192E]">{c.lockedTitle}</p>
          <p className="text-xs text-slate-600">{c.lockedText}</p>
          <Button size="sm" onClick={onUnlock} className="mt-1 bg-[#0B63E5] font-bold hover:bg-[#0052CC]">
            {c.lockedCta}
          </Button>
        </div>
      </div>
    </div>
  )
}
