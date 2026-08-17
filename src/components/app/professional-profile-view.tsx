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
import {
  Briefcase, Target, Globe2, Sliders, Languages, Loader2, Save, Info, X, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'
import { MARKETS, GLOBAL_MARKET } from '@/lib/market'
import {
  EDUCATION_LEVELS, SENIORITY_LEVELS, WEEKLY_HOURS, WORK_MODES, SALARY_PERIODS,
  EMPTY_PROFILE, type ProfessionalProfile,
} from '@/lib/profile'

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

const SENIORITY_LABELS: Record<string, string> = {
  intern: 'Estágio',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Líder / Coordenação',
  principal: 'Especialista / Principal',
  director: 'Diretoria',
  executive: 'Executivo (C-level)',
}

const EDUCATION_LABELS: Record<string, string> = {
  none: 'Sem formação declarada',
  high_school: 'Ensino médio',
  technical: 'Técnico',
  bachelor: 'Graduação',
  postgrad: 'Pós-graduação',
  master: 'Mestrado',
  phd: 'Doutorado',
}

const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
}

const WEEKLY_HOURS_LABELS: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  flexible: 'Flexível',
}

const SALARY_PERIOD_LABELS: Record<string, string> = {
  year: 'por ano',
  month: 'por mês',
  hour: 'por hora',
}

const LANGUAGE_LABELS: Record<string, string> = {
  pt: 'Português',
  en: 'Inglês',
  es: 'Espanhol',
}

/** Mercados oferecidos, mais o global — que é o do remoto internacional. */
const MARKET_OPTIONS = [
  ...MARKETS.map((m) => ({ id: m.id, name: m.name })),
  { id: GLOBAL_MARKET.id, name: 'Global / Remoto internacional' },
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
                aria-label={`Remover ${v}`}
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

function Choice({
  label, options, value, onChange, allowEmpty = true,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (next: string | null) => void
  allowEmpty?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {allowEmpty && <option value="">Não informado</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ProfessionalProfileView() {
  const [profile, setProfile] = useState<ProfessionalProfile>({ ...EMPTY_PROFILE })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
          setLoadError(data?.error || 'Não foi possível carregar o perfil.')
        }
      } catch {
        if (!cancelled) setLoadError('Falha de conexão ao carregar o perfil.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const set = <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  const toggleWorkMode = (mode: (typeof WORK_MODES)[number]) => {
    set('workModes', profile.workModes.includes(mode)
      ? profile.workModes.filter((m) => m !== mode)
      : [...profile.workModes, mode])
  }

  const save = async () => {
    if (profile.salaryMin != null && profile.salaryMax != null && profile.salaryMax < profile.salaryMin) {
      toast.error('A pretensão máxima não pode ser menor que a mínima.')
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
        toast.success('Perfil profissional salvo.')
      } else {
        toast.error(data?.error || 'Não foi possível salvar o perfil.')
      }
    } catch {
      toast.error('Falha de conexão ao salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Carregando seu perfil profissional...</p>
      </div>
    )
  }

  const targetMarketName =
    MARKET_OPTIONS.find((m) => m.id === profile.primaryMarket)?.name || null

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
              <CardTitle className="text-base font-bold text-emerald-950">Perfil Profissional</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                É a partir daqui que o Griffo entende quem você é profissionalmente e para qual mercado deve
                trabalhar. Preencha aos poucos — nada é obrigatório.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-white border border-emerald-100 rounded-lg p-3 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              O mercado que você declara aqui muda as recomendações: quais sistemas de triagem citamos, o formato
              esperado do currículo e o vocabulário dos cargos.{' '}
              {targetMarketName
                ? <>Hoje suas análises usam <strong>{targetMarketName}</strong>.</>
                : <>Sem mercado declarado, usamos seu país de acesso como palpite.</>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* IDENTIDADE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-600" /> Identidade profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Cargo atual</Label>
              <Input
                value={profile.currentTitle ?? ''}
                onChange={(e) => set('currentTitle', e.target.value || null)}
                placeholder="Ex: Analista de Dados"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Área de atuação</Label>
              <Input
                value={profile.field ?? ''}
                onChange={(e) => set('field', e.target.value || null)}
                placeholder="Ex: Dados & Analytics"
                className="text-sm"
              />
            </div>
            <Choice
              label="Senioridade"
              value={profile.seniority}
              onChange={(v) => set('seniority', v as ProfessionalProfile['seniority'])}
              options={SENIORITY_LEVELS.map((s) => ({ value: s, label: SENIORITY_LABELS[s] }))}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Anos de experiência</Label>
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
              label="Formação"
              value={profile.educationLevel}
              onChange={(v) => set('educationLevel', v as ProfessionalProfile['educationLevel'])}
              options={EDUCATION_LEVELS.map((s) => ({ value: s, label: EDUCATION_LABELS[s] }))}
            />
          </div>

          <TagInput
            label="Especializações"
            values={profile.specializations}
            onChange={(v) => set('specializations', v)}
            placeholder="Ex: Modelagem dimensional"
          />
          <TagInput
            label="Competências"
            hint="As ferramentas e habilidades que você quer que apareçam nas recomendações."
            values={profile.skills}
            onChange={(v) => set('skills', v)}
            placeholder="Ex: SQL"
          />
        </CardContent>
      </Card>

      {/* OBJETIVOS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-600" /> Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Cargos-alvo"
            hint="Os cargos que você quer disputar — não necessariamente o que você faz hoje."
            values={profile.targetRoles}
            onChange={(v) => set('targetRoles', v)}
            placeholder="Ex: Data Analyst"
          />
          <TagInput
            label="Áreas-alvo"
            values={profile.targetFields}
            onChange={(v) => set('targetFields', v)}
            placeholder="Ex: Produto"
          />
          <TagInput
            label="Setores de interesse"
            values={profile.targetIndustries}
            onChange={(v) => set('targetIndustries', v)}
            placeholder="Ex: Saúde"
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Trajetória desejada</Label>
            <Textarea
              value={profile.careerGoal ?? ''}
              onChange={(e) => set('careerGoal', e.target.value || null)}
              placeholder="Para onde você quer levar sua carreira nos próximos anos?"
              className="text-sm min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* MOBILIDADE E MERCADOS */}
      <Card className="border-sky-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-sky-600" /> Onde você está e onde quer trabalhar
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-600">
            São perguntas diferentes de propósito. Morar num país não significa querer trabalhar nele.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">País onde mora</Label>
              <Input
                value={profile.residenceCountry ?? ''}
                onChange={(e) => set('residenceCountry', e.target.value.toUpperCase().slice(0, 2) || null)}
                placeholder="BR"
                maxLength={2}
                className="text-sm uppercase"
              />
              <p className="text-[10px] text-slate-500">Código de 2 letras (BR, PT, US...)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Estado / região</Label>
              <Input
                value={profile.residenceRegion ?? ''}
                onChange={(e) => set('residenceRegion', e.target.value || null)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Cidade</Label>
              <Input
                value={profile.residenceCity ?? ''}
                onChange={(e) => set('residenceCity', e.target.value || null)}
                className="text-sm"
              />
            </div>
          </div>

          <Choice
            label="Mercado principal onde quer trabalhar"
            value={profile.primaryMarket}
            onChange={(v) => set('primaryMarket', v)}
            options={MARKET_OPTIONS.map((m) => ({ value: m.id, label: m.name }))}
          />

          <TagInput
            label="Mercados alternativos"
            hint="Outros mercados que você também consideraria. Use os mesmos códigos (PT, ES, US...)."
            values={profile.alternativeMarkets}
            onChange={(v) => set('alternativeMarkets', v.map((x) => x.toUpperCase()))}
            placeholder="Ex: PT"
          />

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
              <div>
                <p className="text-xs font-semibold text-slate-800">Disponível para mudar de país</p>
                <p className="text-[11px] text-slate-500">Aceita se mudar fisicamente para outro país.</p>
              </div>
              <Switch
                checked={profile.openToRelocation}
                onCheckedChange={(v) => set('openToRelocation', v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
              <div>
                <p className="text-xs font-semibold text-slate-800">Aceita trabalho remoto internacional</p>
                <p className="text-[11px] text-slate-500">
                  Trabalhar de onde mora para uma empresa de outro país. Não é o mesmo que mudar de país.
                </p>
              </div>
              <Switch
                checked={profile.openToInternationalRemote}
                onCheckedChange={(v) => set('openToInternationalRemote', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PREFERÊNCIAS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-600" /> Preferências de trabalho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Modelos de trabalho aceitos</Label>
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
                    {WORK_MODE_LABELS[mode]}
                  </button>
                )
              })}
            </div>
          </div>

          <TagInput
            label="Tipos de contrato aceitos"
            hint="No vocabulário do seu mercado: CLT, PJ, CDI, W-2, contractor..."
            values={profile.contractTypes}
            onChange={(v) => set('contractTypes', v)}
            placeholder="Ex: CLT"
          />

          <Choice
            label="Jornada"
            value={profile.weeklyHours}
            onChange={(v) => set('weeklyHours', v as ProfessionalProfile['weeklyHours'])}
            options={WEEKLY_HOURS.map((h) => ({ value: h, label: WEEKLY_HOURS_LABELS[h] }))}
          />

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700">Pretensão salarial</Label>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Na moeda do mercado que você mira. Não tem relação com a moeda em que você paga pelas análises —
              essa é definida pelo seu meio de pagamento.
            </p>
            <div className="grid sm:grid-cols-4 gap-2 pt-1">
              <Input
                type="number"
                min={0}
                value={profile.salaryMin ?? ''}
                onChange={(e) => set('salaryMin', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Mínimo"
                className="text-sm"
              />
              <Input
                type="number"
                min={0}
                value={profile.salaryMax ?? ''}
                onChange={(e) => set('salaryMax', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Máximo"
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
                <option value="">Período</option>
                {SALARY_PERIODS.map((p) => (
                  <option key={p} value={p}>{SALARY_PERIOD_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IDIOMAS */}
      <Card className="border-violet-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Languages className="w-4 h-4 text-violet-600" /> Idiomas
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-600">
            O idioma da tela não decide o idioma do seu currículo. Se você mira outro país, provavelmente são
            diferentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Choice
            label="Idioma do currículo e da carta"
            value={profile.resumeLanguage}
            onChange={(v) => set('resumeLanguage', v as ProfessionalProfile['resumeLanguage'])}
            options={Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Choice
            label="Idioma dos avisos por e-mail"
            value={profile.communicationLanguage}
            onChange={(v) => set('communicationLanguage', v as ProfessionalProfile['communicationLanguage'])}
            options={Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar perfil
        </Button>
      </div>
    </div>
  )
}
