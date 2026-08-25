'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  Briefcase, Target, Globe2, Sliders, Languages, Loader2, Save, Info, X, Plus, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'
import { MARKETS, GLOBAL_MARKET } from '@/lib/market'
import { groupedCountries } from '@/lib/market/countries'
import { applySuggestion } from '@/lib/profile/extract'
import {
  EDUCATION_LEVELS, SENIORITY_LEVELS, WEEKLY_HOURS, WORK_MODES, SALARY_PERIODS,
  EMPTY_PROFILE, type ProfessionalProfile,
} from '@/lib/profile'
import { useI18n } from '@/context/i18n-context'
import type { TranslationDictionary } from '@/lib/i18n'

/**
 * A tela do Perfil Profissional.
 *
 * O que ela existe para separar, e que antes o produto confundia:
 *
 * - **Onde a pessoa mora** e **onde ela quer trabalhar**. Eram a mesma coisa
 *   porque só havia uma; agora são dois campos, e o segundo é o que decide o
 *   mercado usado nas análises.
 * - **Idioma da tela** e **idioma do currículo**. Quem mora no Brasil e busca
 *   vaga nos EUA lê isto em português e precisa do currículo em inglês.
 * - **Moeda da pretensão** e **moeda da cobrança**. A segunda não aparece aqui:
 *   ela é decidida pelo país do meio de pagamento e não é escolha de perfil.
 */

type ProfileDict = TranslationDictionary['profile']

const seniorityLabels = (p: ProfileDict): Record<string, string> => ({
  intern: p.seniorityIntern,
  junior: p.seniorityJunior,
  mid: p.seniorityMid,
  senior: p.senioritySenior,
  lead: p.seniorityLead,
  principal: p.seniorityPrincipal,
  director: p.seniorityDirector,
  executive: p.seniorityExecutive,
})

const educationLabels = (p: ProfileDict): Record<string, string> => ({
  none: p.educationNone,
  high_school: p.educationHighSchool,
  technical: p.educationTechnical,
  bachelor: p.educationBachelor,
  postgrad: p.educationPostgrad,
  master: p.educationMaster,
  phd: p.educationPhd,
})

const workModeLabels = (p: ProfileDict): Record<string, string> => ({
  remote: p.workModeRemote,
  hybrid: p.workModeHybrid,
  onsite: p.workModeOnsite,
})

const weeklyHoursLabels = (p: ProfileDict): Record<string, string> => ({
  full_time: p.weeklyHoursFullTime,
  part_time: p.weeklyHoursPartTime,
  flexible: p.weeklyHoursFlexible,
})

const salaryPeriodLabels = (p: ProfileDict): Record<string, string> => ({
  year: p.salaryPeriodYear,
  month: p.salaryPeriodMonth,
  hour: p.salaryPeriodHour,
})

const languageLabels = (p: ProfileDict): Record<string, string> => ({
  pt: p.languagePt,
  en: p.languageEn,
  es: p.languageEs,
})

/** Mercados oferecidos, mais o global — que é o do remoto internacional. */
const marketOptions = (p: ProfileDict) => [
  ...MARKETS.map((m) => ({ id: m.id, name: m.name })),
  { id: GLOBAL_MARKET.id, name: p.globalMarketName },
]

/** Campo de lista: escreve, aperta Enter, vira etiqueta removível. */
function TagInput({
  label, hint, values, onChange, placeholder,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim()
    if (!value) return
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...values, value])
    setDraft('')
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      {hint && <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={commit} className="shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <Badge key={v} variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 text-[11px] gap-1">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:text-rose-600"
                aria-label={t.profile.removeAria.replace('{value}', v)}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Escolha de país pelo nome.
 *
 * Dois grupos: os que mudam o comportamento do produto vêm primeiro, porque
 * quem mora num deles precisa achá-lo sem rolar cento e tantas linhas. O que se
 * guarda continua sendo o código ISO — o nome é só para ler.
 */
function CountrySelect({
  value, onChange,
}: {
  value: string | null
  onChange: (next: string | null) => void
}) {
  const { t } = useI18n()
  const { adapted, others } = groupedCountries()

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
    >
      <option value="">{t.profile.notInformed}</option>
      <optgroup label={t.profile.countryGroupAdapted}>
        {adapted.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </optgroup>
      <optgroup label={t.profile.countryGroupOthers}>
        {others.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </optgroup>
    </select>
  )
}

/**
 * Mercados alternativos como caixas de seleção.
 *
 * Antes era um campo de texto pedindo "os mesmos códigos (PT, ES, US...)" —
 * que só funciona para quem já sabe a tabela ISO de cor. Os mercados são doze e
 * cabem na tela; escolher de uma lista não tem como dar errado.
 *
 * O mercado principal some da lista: marcá-lo aqui seria dizer duas vezes a
 * mesma coisa, e um "alternativo" igual ao principal não significa nada.
 */
function MarketChecklist({
  label, hint, values, exclude, onChange,
}: {
  label: string
  hint: string
  values: string[]
  exclude: string | null
  onChange: (next: string[]) => void
}) {
  const { t } = useI18n()
  const options = marketOptions(t.profile).filter((m) => m.id !== exclude)

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <p className="text-[10px] text-slate-500">{hint}</p>
      <div className="grid sm:grid-cols-3 gap-1.5 pt-1">
        {options.map((m) => {
          const checked = values.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              aria-pressed={checked}
              className={`flex items-center gap-2 text-left text-xs rounded-md border px-2.5 py-1.5 transition ${
                checked
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 shrink-0 rounded-sm border flex items-center justify-center ${
                  checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                }`}
              >
                {checked && <span className="w-1.5 h-1.5 rounded-[1px] bg-white" />}
              </span>
              {m.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Choice({
  label, options, value, onChange, allowEmpty = true,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (next: string | null) => void
  allowEmpty?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {allowEmpty && <option value="">{t.profile.notInformed}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ProfessionalProfileView() {
  const { t } = useI18n()
  const p = t.profile
  const [profile, setProfile] = useState<ProfessionalProfile>({ ...EMPTY_PROFILE })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filling, setFilling] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await internalFetch('/api/user/professional-profile', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (cancelled) return
        if (res.ok && data?.profile) {
          setProfile(data.profile)
        } else {
          setLoadError(data?.error || p.loadErrorFallback)
        }
      } catch {
        if (!cancelled) setLoadError(p.loadConnectionError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const set = <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const toggleWorkMode = (mode: (typeof WORK_MODES)[number]) => {
    set('workModes', profile.workModes.includes(mode)
      ? profile.workModes.filter((m) => m !== mode)
      : [...profile.workModes, mode])
  }

  const save = async () => {
    if (profile.salaryMin != null && profile.salaryMax != null && profile.salaryMax < profile.salaryMin) {
      toast.error(p.saveMaxLessThanMinError)
      return
    }

    setSaving(true)
    try {
      const res = await internalFetch('/api/user/professional-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.profile) {
        setProfile(data.profile)
        // O Radar roda junto com a gravação; dizer o que ele achou fecha o
        // ciclo na mesma tela, em vez de mandar a pessoa procurar noutra.
        const alerted = data?.radar?.alerted ?? 0
        toast.success(
          alerted > 0
            ? (alerted === 1 ? p.saveSuccessWithRadarOne : p.saveSuccessWithRadarMany).replace('{n}', String(alerted))
            : p.saveSuccessNoRadar
        )
      } else {
        toast.error(data?.error || p.saveErrorFallback)
      }
    } catch {
      toast.error(p.saveConnectionError)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Preenche o formulário a partir do currículo e do diagnóstico vocacional.
   *
   * Não salva. Os campos aparecem preenchidos e a pessoa revisa antes de
   * gravar — o §30 proíbe mudar o perfil sem que ela saiba, e um formulário que
   * se altera e se salva sozinho é a definição disso.
   *
   * Também não sobrescreve o que já está escrito: `applySuggestion` só entra em
   * campo vazio. Quem digitou tem razão sobre si.
   */
  const fillFromResume = async () => {
    setFilling(true)
    try {
      const res = await internalFetch('/api/user/professional-profile/suggest', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.error || p.fillErrorFallback)
        return
      }

      const { profile: next, filled } = applySuggestion(profile, data?.suggestion || {})

      if (filled.length === 0) {
        toast.info(p.fillNothingToFill)
        return
      }

      setProfile(next)
      toast.success(
        (filled.length === 1 ? p.fillSuccessOne : p.fillSuccessMany).replace('{n}', String(filled.length))
      )
    } catch {
      toast.error(p.fillConnectionError)
    } finally {
      setFilling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">{p.loadingText}</p>
      </div>
    )
  }

  const MARKET_OPTIONS = marketOptions(p)
  const targetMarketName =
    MARKET_OPTIONS.find((m) => m.id === profile.primaryMarket)?.name || null

  /**
   * O que já foi preenchido, seção por seção — leitura direta do `profile`
   * que a tela já mantém, sem estado novo. Decide o rótulo "Preenchido" no
   * cabeçalho de cada seção e quais seções abrem sozinhas: a promessa da
   * tela é "preencha aos poucos", e a interface precisa mostrar de relance
   * o que falta sem exigir abrir tudo pra descobrir.
   */
  const sectionFilled = {
    identity: Boolean(
      profile.currentTitle || profile.field || profile.seniority || profile.yearsExperience != null ||
      profile.educationLevel || profile.specializations.length > 0 || profile.skills.length > 0
    ),
    objectives: Boolean(
      profile.targetRoles.length > 0 || profile.targetFields.length > 0 ||
      profile.targetIndustries.length > 0 || profile.careerGoal
    ),
    location: Boolean(profile.residenceCountry || profile.primaryMarket || profile.alternativeMarkets.length > 0),
    preferences: Boolean(
      profile.workModes.length > 0 || profile.contractTypes.length > 0 ||
      profile.weeklyHours || profile.salaryMin != null || profile.salaryMax != null
    ),
    languages: Boolean(profile.resumeLanguage || profile.communicationLanguage),
  }
  const defaultOpenSections = (Object.keys(sectionFilled) as (keyof typeof sectionFilled)[])
    .filter((key) => !sectionFilled[key])

  return (
    <div className="space-y-5 max-w-4xl">
      {loadError && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-300">
          <AlertDescription className="text-sm text-rose-900">{loadError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-emerald-950">{p.cardTitle}</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {p.cardDesc}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Button
              type="button"
              variant="outline"
              onClick={fillFromResume}
              disabled={filling}
              className="bg-white border-primary/30 text-primary hover:bg-primary/10 h-9 text-xs font-semibold"
            >
              {filling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
              {p.fillButton}
            </Button>
            <p className="text-[11px] text-slate-600 leading-relaxed flex-1 min-w-[220px]">
              {p.fillDesc}
            </p>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-white border border-emerald-100 rounded-lg p-3 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              {p.marketInfoIntro}{' '}
              {targetMarketName
                ? <>{p.marketInfoWithMarket.split('{market}')[0]}<strong>{targetMarketName}</strong>{p.marketInfoWithMarket.split('{market}')[1]}</>
                : <>{p.marketInfoWithoutMarket}</>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* As cinco seções de dado viram um accordion só: a tela promete
          "preencha aos poucos", e cinco cartões sempre abertos em rolagem
          única não deixava ver de relance o que já foi preenchido. Seção
          sem dado abre sozinha; o resto começa fechado. */}
      <Card>
        <CardContent className="px-3 sm:px-5">
          <Accordion type="multiple" defaultValue={defaultOpenSections}>

          {/* IDENTIDADE */}
          <AccordionItem value="identity">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-2 flex-1 pr-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Briefcase className="w-4 h-4 text-slate-600" /> {p.sectionIdentityTitle}
                </span>
                {sectionFilled.identity && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shrink-0">
                    {p.filledBadge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldCurrentTitle}</Label>
              <Input
                value={profile.currentTitle ?? ''}
                onChange={(e) => set('currentTitle', e.target.value || null)}
                placeholder={p.placeholderCurrentTitle}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldArea}</Label>
              <Input
                value={profile.field ?? ''}
                onChange={(e) => set('field', e.target.value || null)}
                placeholder={p.placeholderArea}
                className="text-sm"
              />
            </div>
            <Choice
              label={p.fieldSeniority}
              value={profile.seniority}
              onChange={(v) => set('seniority', v as ProfessionalProfile['seniority'])}
              options={SENIORITY_LEVELS.map((s) => ({ value: s, label: seniorityLabels(p)[s] }))}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldYearsExperience}</Label>
              <Input
                type="number"
                min={0}
                max={70}
                value={profile.yearsExperience ?? ''}
                onChange={(e) => set('yearsExperience', e.target.value === '' ? null : Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <Choice
              label={p.fieldEducation}
              value={profile.educationLevel}
              onChange={(v) => set('educationLevel', v as ProfessionalProfile['educationLevel'])}
              options={EDUCATION_LEVELS.map((s) => ({ value: s, label: educationLabels(p)[s] }))}
            />
          </div>

          <TagInput
            label={p.fieldSpecializations}
            values={profile.specializations}
            onChange={(v) => set('specializations', v)}
            placeholder={p.placeholderSpecializations}
          />
          <TagInput
            label={p.fieldSkills}
            hint={p.hintSkills}
            values={profile.skills}
            onChange={(v) => set('skills', v)}
            placeholder={p.placeholderSkills}
          />
            </AccordionContent>
          </AccordionItem>

          {/* OBJETIVOS */}
          <AccordionItem value="objectives">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-2 flex-1 pr-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Target className="w-4 h-4 text-slate-600" /> {p.sectionObjectivesTitle}
                </span>
                {sectionFilled.objectives && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shrink-0">
                    {p.filledBadge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
          <TagInput
            label={p.fieldTargetRoles}
            hint={p.hintTargetRoles}
            values={profile.targetRoles}
            onChange={(v) => set('targetRoles', v)}
            placeholder={p.placeholderTargetRoles}
          />
          <TagInput
            label={p.fieldTargetFields}
            values={profile.targetFields}
            onChange={(v) => set('targetFields', v)}
            placeholder={p.placeholderTargetFields}
          />
          <TagInput
            label={p.fieldTargetIndustries}
            values={profile.targetIndustries}
            onChange={(v) => set('targetIndustries', v)}
            placeholder={p.placeholderTargetIndustries}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">{p.fieldCareerGoal}</Label>
            <Textarea
              value={profile.careerGoal ?? ''}
              onChange={(e) => set('careerGoal', e.target.value || null)}
              placeholder={p.placeholderCareerGoal}
              className="text-sm min-h-[80px]"
            />
          </div>
            </AccordionContent>
          </AccordionItem>

          {/* MOBILIDADE E MERCADOS */}
          <AccordionItem value="location">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-2 flex-1 pr-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Globe2 className="w-4 h-4 text-slate-600" /> {p.sectionLocationTitle}
                </span>
                {sectionFilled.location && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shrink-0">
                    {p.filledBadge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
          <p className="text-[11px] text-slate-600 -mt-2">
            {p.hintLocationIntro}
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldResidenceCountry}</Label>
              <CountrySelect
                value={profile.residenceCountry}
                onChange={(v) => set('residenceCountry', v)}
              />
              <p className="text-[10px] text-slate-500">
                {p.hintResidenceCountry}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldResidenceRegion}</Label>
              <Input
                value={profile.residenceRegion ?? ''}
                onChange={(e) => set('residenceRegion', e.target.value || null)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">{p.fieldResidenceCity}</Label>
              <Input
                value={profile.residenceCity ?? ''}
                onChange={(e) => set('residenceCity', e.target.value || null)}
                className="text-sm"
              />
            </div>
          </div>

          <Choice
            label={p.fieldTargetCountry}
            value={profile.primaryMarket}
            onChange={(v) => set('primaryMarket', v)}
            options={MARKET_OPTIONS.map((m) => ({ value: m.id, label: m.name }))}
          />

          <MarketChecklist
            label={p.fieldOtherMarkets}
            hint={p.hintOtherMarkets}
            values={profile.alternativeMarkets}
            exclude={profile.primaryMarket}
            onChange={(v) => set('alternativeMarkets', v)}
          />

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
              <div>
                <p className="text-xs font-semibold text-slate-800">{p.switchRelocationTitle}</p>
                <p className="text-[11px] text-slate-500">{p.switchRelocationDesc}</p>
              </div>
              <Switch
                checked={profile.openToRelocation}
                onCheckedChange={(v) => set('openToRelocation', v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
              <div>
                <p className="text-xs font-semibold text-slate-800">{p.switchRemoteTitle}</p>
                <p className="text-[11px] text-slate-500">
                  {p.switchRemoteDesc}
                </p>
              </div>
              <Switch
                checked={profile.openToInternationalRemote}
                onCheckedChange={(v) => set('openToInternationalRemote', v)}
              />
            </div>
          </div>
            </AccordionContent>
          </AccordionItem>

          {/* PREFERÊNCIAS */}
          <AccordionItem value="preferences">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-2 flex-1 pr-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Sliders className="w-4 h-4 text-slate-600" /> {p.sectionPreferencesTitle}
                </span>
                {sectionFilled.preferences && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shrink-0">
                    {p.filledBadge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">{p.fieldWorkModes}</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {WORK_MODES.map((mode) => {
                const active = profile.workModes.includes(mode)
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleWorkMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {workModeLabels(p)[mode]}
                  </button>
                )
              })}
            </div>
          </div>

          <TagInput
            label={p.fieldContractTypes}
            hint={p.hintContractTypes}
            values={profile.contractTypes}
            onChange={(v) => set('contractTypes', v)}
            placeholder={p.placeholderContractTypes}
          />

          <Choice
            label={p.fieldWorkload}
            value={profile.weeklyHours}
            onChange={(v) => set('weeklyHours', v as ProfessionalProfile['weeklyHours'])}
            options={WEEKLY_HOURS.map((h) => ({ value: h, label: weeklyHoursLabels(p)[h] }))}
          />

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700">{p.fieldSalary}</Label>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {p.hintSalary}
            </p>
            <div className="grid sm:grid-cols-4 gap-2 pt-1">
              <Input
                type="number"
                min={0}
                value={profile.salaryMin ?? ''}
                onChange={(e) => set('salaryMin', e.target.value === '' ? null : Number(e.target.value))}
                placeholder={p.placeholderSalaryMin}
                className="text-sm"
              />
              <Input
                type="number"
                min={0}
                value={profile.salaryMax ?? ''}
                onChange={(e) => set('salaryMax', e.target.value === '' ? null : Number(e.target.value))}
                placeholder={p.placeholderSalaryMax}
                className="text-sm"
              />
              <Input
                value={profile.salaryCurrency ?? ''}
                onChange={(e) => set('salaryCurrency', e.target.value.toUpperCase().slice(0, 3) || null)}
                placeholder="BRL"
                maxLength={3}
                className="text-sm uppercase"
              />
              <select
                value={profile.salaryPeriod ?? ''}
                onChange={(e) => set('salaryPeriod', (e.target.value || null) as ProfessionalProfile['salaryPeriod'])}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              >
                <option value="">{p.placeholderSalaryPeriod}</option>
                {SALARY_PERIODS.map((period) => (
                  <option key={period} value={period}>{salaryPeriodLabels(p)[period]}</option>
                ))}
              </select>
            </div>
          </div>
            </AccordionContent>
          </AccordionItem>

          {/* IDIOMAS */}
          <AccordionItem value="languages">
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-2 flex-1 pr-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Languages className="w-4 h-4 text-slate-600" /> {p.sectionLanguagesTitle}
                </span>
                {sectionFilled.languages && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shrink-0">
                    {p.filledBadge}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
          <p className="text-[11px] text-slate-600 -mt-2">
            {p.hintLanguagesIntro}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
          <Choice
            label={p.fieldResumeLanguage}
            value={profile.resumeLanguage}
            onChange={(v) => set('resumeLanguage', v as ProfessionalProfile['resumeLanguage'])}
            options={Object.entries(languageLabels(p)).map(([value, label]) => ({ value, label }))}
          />
          <Choice
            label={p.fieldCommLanguage}
            value={profile.communicationLanguage}
            onChange={(v) => set('communicationLanguage', v as ProfessionalProfile['communicationLanguage'])}
            options={Object.entries(languageLabels(p)).map(([value, label]) => ({ value, label }))}
          />
          </div>
            </AccordionContent>
          </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {p.saveButton}
        </Button>
      </div>
    </div>
  )
}
