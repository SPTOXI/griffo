'use client'

import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Language } from '@/lib/i18n'
import { fill } from '@/lib/match-preview/copy'
import { RESUME_BUILDER_COPY } from '@/lib/resume-builder/copy'
import {
  MAX_EDUCATION,
  MAX_EXPERIENCES,
  builderAnswersSchema,
  type BuilderAnswers,
  type BuilderEducation,
  type BuilderExperience,
} from '@/lib/resume-builder/answers'

/** O que a tela edita: as respostas como texto livre, validadas só no passo. */
export interface BuilderDraft {
  targetRole: string
  city: string
  noFormalJob: boolean
  experiences: BuilderExperience[]
  education: BuilderEducation[]
  skills: string
  languages: string
  fullName: string
  phone: string
}

export const EMPTY_EXPERIENCE: BuilderExperience = { role: '', company: '', period: '', description: '' }
export const EMPTY_EDUCATION: BuilderEducation = { course: '', institution: '', period: '' }

export const EMPTY_BUILDER_DRAFT: BuilderDraft = {
  targetRole: '',
  city: '',
  noFormalJob: false,
  experiences: [EMPTY_EXPERIENCE],
  education: [EMPTY_EDUCATION],
  skills: '',
  languages: '',
  fullName: '',
  phone: '',
}

const STEPS = ['goal', 'experience', 'education', 'skills', 'contact'] as const
export const BUILDER_STEPS = STEPS.length

const filled = (s: string, min = 2) => s.trim().length >= min
const isBlank = (e: BuilderEducation) => !e.course.trim() && !e.institution.trim() && !e.period.trim()

/** O passo pode avançar? Mesmos mínimos de `builderAnswersSchema`. */
function stepValid(step: number, d: BuilderDraft): boolean {
  if (step === 0) return filled(d.targetRole)
  if (step === 1) return d.experiences.every((e) => filled(e.role) && filled(e.description, 10))
  if (step === 2) return d.education.every((e) => isBlank(e) || filled(e.course))
  if (step === 4) return filled(d.fullName)
  return true
}

/** As respostas prontas para a rota, ou `null` se algo não passa no esquema. */
export function draftToAnswers(d: BuilderDraft): BuilderAnswers | null {
  const parsed = builderAnswersSchema.safeParse({ ...d, education: d.education.filter((e) => !isBlank(e)) })
  return parsed.success ? parsed.data : null
}

/**
 * As perguntas do criador de currículo (§2.160), em 5 passos curtos, no mesmo
 * cartão do envio da home. O passo de contato recebe de fora o e-mail e os
 * consentimentos (`contactSlot`): são os mesmos do envio de arquivo.
 */
export function ResumeBuilderForm(props: {
  lang: Language
  value: BuilderDraft
  onChange: (d: BuilderDraft) => void
  step: number
  setStep: (n: number) => void
  error: string | null
  setError: (e: string | null) => void
  contactSlot: React.ReactNode
  onSubmit: (answers: BuilderAnswers) => void
  onClose: () => void
}) {
  const { value: d, onChange, step } = props
  const c = RESUME_BUILDER_COPY[props.lang]
  const set = <K extends keyof BuilderDraft>(k: K, v: BuilderDraft[K]) => onChange({ ...d, [k]: v })
  const setExp = (i: number, patch: Partial<BuilderExperience>) =>
    set('experiences', d.experiences.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  const setEdu = (i: number, patch: Partial<BuilderEducation>) =>
    set('education', d.education.map((e, j) => (j === i ? { ...e, ...patch } : e)))

  const next = () => {
    if (!stepValid(step, d)) return props.setError(c.errorRequired)
    props.setError(null)
    if (step < STEPS.length - 1) return props.setStep(step + 1)
    const answers = draftToAnswers(d)
    if (!answers) return props.setError(c.errorRequired)
    props.onSubmit(answers)
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        next()
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-extrabold text-[#0B192E]">
            <Sparkles className="h-5 w-5 text-[#0B63E5]" aria-hidden="true" /> {c.title}
          </p>
          {step === 0 && <p className="mt-1 text-sm text-slate-600">{c.intro}</p>}
        </div>
        <button type="button" onClick={props.onClose} className="shrink-0 text-xs font-semibold text-[#0B63E5] underline">
          {c.backToUpload}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {fill(c.stepOf, { n: step + 1, total: STEPS.length })} · {c.steps[STEPS[step]]}
        </p>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#0B63E5]' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <>
          <Field label={c.targetRole} required value={d.targetRole} onChange={(v) => set('targetRole', v)} placeholder={c.targetRolePlaceholder} max={120} />
          <Field label={c.city} value={d.city} onChange={(v) => set('city', v)} placeholder={c.cityPlaceholder} max={120} />
        </>
      )}

      {step === 1 && (
        <>
          <label className="flex cursor-pointer gap-2.5 rounded-lg border border-slate-200 p-2.5">
            <input type="checkbox" checked={d.noFormalJob} onChange={(e) => set('noFormalJob', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B63E5]" />
            <span className="text-sm text-[#0B192E]">
              {c.noFormalJob}
              {d.noFormalJob && <span className="mt-0.5 block text-xs text-slate-500">{c.noFormalJobHint}</span>}
            </span>
          </label>
          {d.experiences.map((e, i) => (
            <fieldset key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3">
              <Field label={c.role} required value={e.role} onChange={(v) => setExp(i, { role: v })} placeholder={c.rolePlaceholder} max={120} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={c.company} value={e.company} onChange={(v) => setExp(i, { company: v })} max={120} />
                <Field label={c.period} value={e.period} onChange={(v) => setExp(i, { period: v })} placeholder={c.periodPlaceholder} max={60} />
              </div>
              <Field label={c.description} required multiline value={e.description} onChange={(v) => setExp(i, { description: v })} placeholder={c.descriptionPlaceholder} max={1500} />
              {d.experiences.length > 1 && (
                <button type="button" className="self-end text-xs font-semibold text-red-600 underline" onClick={() => set('experiences', d.experiences.filter((_, j) => j !== i))}>
                  {c.remove}
                </button>
              )}
            </fieldset>
          ))}
          {d.experiences.length < MAX_EXPERIENCES && (
            <button type="button" className="self-start text-sm font-bold text-[#0B63E5]" onClick={() => set('experiences', [...d.experiences, EMPTY_EXPERIENCE])}>
              {c.addExperience}
            </button>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-xs text-slate-500">{c.educationOptional}</p>
          {d.education.map((e, i) => (
            <fieldset key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3">
              <Field label={c.course} value={e.course} onChange={(v) => setEdu(i, { course: v })} placeholder={c.coursePlaceholder} max={160} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={c.institution} value={e.institution} onChange={(v) => setEdu(i, { institution: v })} max={160} />
                <Field label={c.period} value={e.period} onChange={(v) => setEdu(i, { period: v })} placeholder={c.periodPlaceholder} max={60} />
              </div>
              {d.education.length > 1 && (
                <button type="button" className="self-end text-xs font-semibold text-red-600 underline" onClick={() => set('education', d.education.filter((_, j) => j !== i))}>
                  {c.remove}
                </button>
              )}
            </fieldset>
          ))}
          {d.education.length < MAX_EDUCATION && (
            <button type="button" className="self-start text-sm font-bold text-[#0B63E5]" onClick={() => set('education', [...d.education, EMPTY_EDUCATION])}>
              {c.addEducation}
            </button>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Field label={c.skills} multiline value={d.skills} onChange={(v) => set('skills', v)} placeholder={c.skillsPlaceholder} max={1000} />
          <Field label={c.languages} value={d.languages} onChange={(v) => set('languages', v)} placeholder={c.languagesPlaceholder} max={300} />
        </>
      )}

      {step === 4 && (
        <>
          <Field label={c.fullName} required value={d.fullName} onChange={(v) => set('fullName', v)} max={120} autoComplete="name" />
          <Field label={c.phone} value={d.phone} onChange={(v) => set('phone', v)} max={40} autoComplete="tel" type="tel" />
          {props.contactSlot}
        </>
      )}

      {props.error && <p className="text-sm text-red-600" role="alert">{props.error}</p>}

      <div className="flex gap-2">
        {step > 0 && (
          <Button type="button" variant="outline" size="lg" className="h-12" onClick={() => { props.setError(null); props.setStep(step - 1) }}>
            <ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" /> {c.back}
          </Button>
        )}
        <Button type="submit" size="lg" className="h-12 flex-1 bg-[#0B192E] font-bold text-white hover:bg-[#13294a]">
          {step === STEPS.length - 1 ? c.submit : c.next} <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
        </Button>
      </div>
    </form>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  multiline?: boolean
  max: number
  autoComplete?: string
  type?: string
}) {
  const cls = 'rounded-lg border border-slate-300 px-3 text-base font-normal'
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#0B192E]">
      <span>
        {props.label}
        {props.required && <span className="text-red-600"> *</span>}
      </span>
      {props.multiline ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.slice(0, props.max))}
          placeholder={props.placeholder}
          rows={4}
          className={`${cls} py-2`}
        />
      ) : (
        <input
          type={props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.slice(0, props.max))}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          className={`${cls} h-11`}
        />
      )}
    </label>
  )
}
