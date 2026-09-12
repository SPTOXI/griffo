'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Radar as RadarIcon, Loader2, CheckCircle2, AlertTriangle, XCircle, ExternalLink,
  ThumbsUp, ThumbsDown, Sliders, Info, Briefcase, RefreshCw, Wand2, HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'
import { safeHttpUrl } from '@/lib/safe-url'
import { useI18n } from '@/context/i18n-context'
import { localeForLang, type TranslationDictionary } from '@/lib/i18n'
import { useAiJob } from './use-ai-job'

/**
 * O Radar, do lado do usuário.
 *
 * A tela existe para mostrar o resultado da curadoria, não uma lista de vagas.
 * Quando não há nada, ela diz que não há nada — e diz que isso é o
 * comportamento esperado, não uma falha. O §15 chama isso de "silêncio por
 * padrão", e uma tela que trata silêncio como erro desfaz a promessa que o
 * produto acabou de fazer.
 */

interface JobFitAction {
  id: string
  label: string
  rationale: string
  primary: boolean
}

interface JobFit {
  role: string
  company: string
  location: string
  workMode: string
  compatibility: string
  whyRecommended: string[]
  attention: string[]
  blockers: string[]
  actions: JobFitAction[]
  recommendation: string
}

interface Opportunity {
  alertId: string
  jobId: string
  applicationUrl: string
  createdAt: string
  seenAt: string | null
  feedback: string | null
  fit: JobFit | null
}

interface InterviewPrepQuestion {
  question: string
  signal: 'strength' | 'gap'
  groundedIn: string
  tip: string
}

interface InterviewPrepResult {
  questions: InterviewPrepQuestion[]
  generatedAt: string
}

interface Digest {
  total: number
  strong: number
  good: number
  partial: number
  headline: string
}

interface Preferences {
  frequency: 'immediate' | 'daily' | 'weekly' | 'off'
  minimumFit: 'strong' | 'good' | 'partial'
  maxPerDigest: number
}

interface OnDemandSearchStatus {
  eligible: boolean
  available: number
  weeklyLimit: number
  resetAt: string | null
}

type RadarDict = TranslationDictionary['radar']

const frequencyLabels = (rd: RadarDict): Record<string, string> => ({
  immediate: rd.freqImmediate,
  daily: rd.freqDaily,
  weekly: rd.freqWeekly,
  off: rd.freqOff,
})

const minimumFitLabels = (rd: RadarDict): Record<string, string> => ({
  strong: rd.minFitStrong,
  good: rd.minFitGood,
  partial: rd.minFitPartial,
})

const COMPATIBILITY_STYLE: Record<string, string> = {
  Alta: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Boa: 'bg-sky-100 text-sky-900 border-sky-300',
  Parcial: 'bg-amber-100 text-amber-900 border-amber-300',
  Baixa: 'bg-slate-100 text-slate-700 border-slate-300',
}

/** `fit.compatibility` chega do backend em português (enum interno) — aqui só se traduz o rótulo exibido. */
const compatibilityLabels = (rd: RadarDict): Record<string, string> => ({
  Alta: rd.compatAlta,
  Boa: rd.compatBoa,
  Parcial: rd.compatParcial,
  Baixa: rd.compatBaixa,
})

const feedbackReasons = (rd: RadarDict): { id: string; label: string }[] => [
  { id: 'wrong_role', label: rd.reasonWrongRole },
  { id: 'location', label: rd.reasonLocation },
  { id: 'salary', label: rd.reasonSalary },
  { id: 'seniority', label: rd.reasonSeniority },
  { id: 'skills', label: rd.reasonSkills },
  { id: 'company', label: rd.reasonCompany },
  { id: 'work_mode', label: rd.reasonWorkMode },
  { id: 'other', label: rd.reasonOther },
]

export function RadarView() {
  const { t, lang } = useI18n()
  const rd = t.radar
  const locale = localeForLang(lang)
  const { setView, openResume } = useNav()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [digest, setDigest] = useState<Digest | null>(null)
  const [hasProfile, setHasProfile] = useState(true)
  // Perfil existir e perfil ter o que comparar são coisas diferentes.
  const [profileMatchable, setProfileMatchable] = useState(true)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [rejecting, setRejecting] = useState<string | null>(null)

  const [running, setRunning] = useState(false)
  const [onDemandSearch, setOnDemandSearch] = useState<OnDemandSearchStatus | null>(null)
  const [searchingNow, setSearchingNow] = useState(false)

  const load = useCallback(async () => {
    const [radarRes, prefsRes] = await Promise.all([
      internalFetch('/api/radar', { cache: 'no-store' }),
      internalFetch('/api/user/radar-preferences', { cache: 'no-store' }),
    ])
    const radar = await radarRes.json().catch(() => null)
    const prefs = await prefsRes.json().catch(() => null)

    if (radarRes.ok && radar) {
      setOpportunities(radar.opportunities || [])
      setDigest(radar.digest || null)
      setHasProfile(Boolean(radar.hasProfile))
      setProfileMatchable(radar.profileMatchable !== false)
      setOnDemandSearch(radar.onDemandSearch ?? null)
      setError(null)
    } else {
      setError(radar?.error || rd.loadErrorFallback)
    }
    if (prefsRes.ok && prefs?.preferences) {
      setPreferences(prefs.preferences)
      setLastRunAt(prefs.lastRunAt ?? null)
    }
    // Devolvido para quem chama comparar antes/depois (`searchNow`) sem
    // depender do state — que só atualiza no próximo render.
    return {
      opportunityCount: radarRes.ok && radar ? (radar.opportunities || []).length : null,
      lastRunAt: prefsRes.ok ? (prefs?.lastRunAt ?? null) : null,
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await load()
      } catch {
        if (!cancelled) setError(rd.loadConnectionError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [load])

  const [preparing, setPreparing] = useState<string | null>(null)

  // Preparo de entrevista: qual card tem o painel aberto, e os resultados já
  // buscados (por `alertId`) para não perder o que já foi gerado ao
  // expandir/recolher outro card. Uma instância só de `useAiJob` — como em
  // `rewrite-view.tsx`/`professional-profile-view.tsx` — porque só um card
  // gera de cada vez.
  const [expandedPrepAlertId, setExpandedPrepAlertId] = useState<string | null>(null)
  const [prepResults, setPrepResults] = useState<Record<string, InterviewPrepResult>>({})
  const [prepStartingId, setPrepStartingId] = useState<string | null>(null)
  const interviewPrepJob = useAiJob<{ interviewPrep: InterviewPrepResult }>({
    startUrl: '/api/radar/interview-prep',
    statusUrl: '/api/ai-jobs/status',
    onCompleted: (result) => {
      if (prepStartingId && result?.interviewPrep) {
        setPrepResults((prev) => ({ ...prev, [prepStartingId]: result.interviewPrep }))
      }
      setPrepStartingId(null)
    },
    onFailed: () => setPrepStartingId(null),
  })

  const toggleInterviewPrep = async (opportunity: Opportunity) => {
    // Já aberto: só fecha. Reabrir não rebusca — o resultado já está em
    // `prepResults` (e o próprio backend cacheia em `RadarAlert.interviewPrepJson`
    // mesmo que o estado local se perca, ex. após recarregar a página).
    if (expandedPrepAlertId === opportunity.alertId) {
      setExpandedPrepAlertId(null)
      return
    }
    setExpandedPrepAlertId(opportunity.alertId)
    if (prepResults[opportunity.alertId]) return

    setPrepStartingId(opportunity.alertId)
    await interviewPrepJob.start({ alertId: opportunity.alertId })
  }

  /**
   * Leva a vaga para o currículo.
   *
   * Até aqui o botão navegava para a reescrita sem levar a vaga junto — a
   * pessoa chegava lá e tinha que colar a descrição à mão, que é justamente a
   * fricção que faz desistir. Agora a vaga vai junto, e a tela abre já
   * direcionada a ela.
   */
  const prepareResume = async (opportunity: Opportunity) => {
    setPreparing(opportunity.alertId)
    try {
      const res = await internalFetch('/api/radar/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: opportunity.alertId }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.error || rd.prepareErrorFallback)
        return
      }

      // Dizer o que foi trocado, em vez de trocar o alvo em silêncio: a próxima
      // análise sairia diferente e ninguém saberia por quê.
      if (data?.previousTarget) {
        toast.info(rd.prepareRedirected.replace('{target}', data.previousTarget))
      } else {
        toast.success(rd.prepareSuccess)
      }

      openResume(data.resumeId, 'rewrite')
    } catch {
      toast.error(rd.prepareConnectionError)
    } finally {
      setPreparing(null)
    }
  }

  /**
   * Procura agora, sem esperar a rodada da madrugada.
   *
   * Avalia as vagas que JÁ estão no banco contra o perfil — não coleta. Uma
   * vaga publicada hoje só aparece depois da coleta diária, e o texto do botão
   * evita prometer o contrário.
   */
  const runNow = async () => {
    setRunning(true)
    try {
      const res = await internalFetch('/api/radar/run', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.error || rd.runErrorFallback)
        return
      }

      await load()

      if (data?.alerted > 0) {
        toast.success((data.alerted === 1 ? rd.runSuccessOne : rd.runSuccessMany).replace('{n}', String(data.alerted)))
      } else if (preferences?.minimumFit === 'strong') {
        toast.info(rd.runNothingNewStrong || rd.runNothingNew)
      } else {
        toast.info(rd.runNothingNew)
      }
    } catch {
      toast.error(rd.runConnectionError)
    } finally {
      setRunning(false)
    }
  }

  /**
   * Espera a coleta terminar em segundo plano, olhando `lastRunAt` avançar.
   *
   * `/api/radar/search-now` responde antes de coletar (ver o cabeçalho da
   * rota — a coleta contra milhares de vagas do JobBase não cabe no tempo de
   * uma requisição). `lastRunAt` é o mesmo campo que `runForUser` grava ao
   * final, tanto no cron quanto em `/api/radar/run` — reaproveitado aqui como
   * sinal de "terminou", em vez de inventar um campo novo só para isto.
   */
  const waitForSearchToFinish = async (priorLastRunAt: string | null, priorOpportunityCount: number) => {
    const POLL_MS = 3000
    const TIMEOUT_MS = 30000
    const deadline = Date.now() + TIMEOUT_MS

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
      const res = await internalFetch('/api/user/radar-preferences', { cache: 'no-store' })
      const data = await res.json().catch(() => null)

      if (data?.lastRunAt && data.lastRunAt !== priorLastRunAt) {
        const after = await load()
        const gained = after.opportunityCount != null ? after.opportunityCount - priorOpportunityCount : 0
        if (gained > 0) {
          toast.success((gained === 1 ? rd.searchNowSuccessOne : rd.searchNowSuccessMany).replace('{n}', String(gained)))
        } else {
          toast.info(rd.searchNowNothingNew)
        }
        return
      }
    }

    // Não terminou a tempo de acompanhar na tela — mas o contador semanal já
    // foi gasto, e o trabalho continua rodando no servidor até seu próprio
    // teto de tempo. Recarrega mesmo assim: pode ter terminado bem depois do
    // último poll, entre a última checagem e o fim do laço.
    await load()
    toast.info(rd.searchNowStillRunning)
  }

  /**
   * Busca ao vivo: coleta agora, não só reavalia o que já estava no banco.
   *
   * Diferente de `runNow`, que só reavalia — esta chama `/api/radar/search-now`,
   * que vai buscar vaga nova de verdade antes de reavaliar. Por isso é limitada
   * por semana (ver `onDemandSearch`), e `runNow` não é.
   */
  const searchNow = async () => {
    setSearchingNow(true)
    const priorLastRunAt = lastRunAt
    const priorOpportunityCount = opportunities.length
    try {
      const res = await internalFetch('/api/radar/search-now', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (data?.code === 'weekly_limit' && data?.resetAt) {
          toast.info(rd.searchNowLimitReached.replace('{date}', new Date(data.resetAt).toLocaleDateString(locale)))
        } else {
          toast.error(data?.error || rd.searchNowErrorFallback)
        }
        return
      }

      await waitForSearchToFinish(priorLastRunAt, priorOpportunityCount)
    } catch {
      toast.error(rd.searchNowConnectionError)
    } finally {
      setSearchingNow(false)
    }
  }

  const savePreferences = async (patch: Partial<Preferences>) => {
    const next = { ...(preferences ?? { frequency: 'daily', minimumFit: 'good', maxPerDigest: 4 }), ...patch } as Preferences
    setPreferences(next)
    try {
      const res = await internalFetch('/api/user/radar-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || rd.savePrefsErrorFallback)
      } else {
        await load()
      }
    } catch {
      toast.error(rd.savePrefsConnectionError)
    }
  }

  const sendFeedback = async (alertId: string, feedback: 'interested' | 'not_useful', reason?: string) => {
    setOpportunities((list) => list.map((o) => (o.alertId === alertId ? { ...o, feedback } : o)))
    setRejecting(null)
    try {
      await internalFetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'feedback', feedback, reason }),
      })
      toast.success(feedback === 'interested' ? rd.feedbackInterestedToast : rd.feedbackNotUsefulToast)
    } catch {
      toast.error(rd.feedbackError)
    }
  }

  const openJob = async (opportunity: Opportunity) => {
    void internalFetch('/api/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: opportunity.alertId, action: 'clicked' }),
    })
    // Segunda barreira, e não redundância: `normalizeJob` passou a recusar
    // esquema perigoso na entrada, mas as vagas gravadas ANTES dessa mudança
    // continuam no banco como estavam. `window.open('javascript:...')` executa
    // na origem desta página — é XSS, não navegação.
    const safeUrl = safeHttpUrl(opportunity.applicationUrl)
    if (!safeUrl) {
      toast.error(rd.invalidLinkError)
      return
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">{rd.loadingText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <RadarIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-indigo-950">Griffo Radar</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  {rd.cardDesc}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={runNow}
                disabled={running || !hasProfile}
                className="bg-white border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                title={rd.runNowTooltip}
              >
                {running ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                {rd.runNowButton}
              </Button>
              {/* Só aparece pra quem já destravou alguma Análise Completa —
                  é benefício do pacote, não uma feature aberta a todos. */}
              {onDemandSearch?.eligible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={searchNow}
                  disabled={searchingNow || !hasProfile || onDemandSearch.available === 0}
                  className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  title={rd.searchNowTooltip}
                >
                  {searchingNow ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                  {rd.searchNowButton}
                  <span className="ml-1.5 text-[10px] font-normal text-emerald-700/80">
                    ({rd.searchNowRemainingBadge.replace('{n}', String(onDemandSearch.available)).replace('{total}', String(onDemandSearch.weeklyLimit))})
                  </span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowSettings((v) => !v)}>
                <Sliders className="w-4 h-4 mr-1.5" /> {rd.preferencesButton}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showSettings && preferences && (
          <CardContent className="space-y-4 border-t border-indigo-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">{rd.freqLabel}</Label>
                <select
                  value={preferences.frequency}
                  onChange={(e) => savePreferences({ frequency: e.target.value as Preferences['frequency'] })}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {Object.entries(frequencyLabels(rd)).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">{rd.minFitLabel}</Label>
                <select
                  value={preferences.minimumFit}
                  onChange={(e) => savePreferences({ minimumFit: e.target.value as Preferences['minimumFit'] })}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {Object.entries(minimumFitLabels(rd)).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {rd.silentByDefault}
              {lastRunAt && <> {rd.lastRun.replace('{date}', new Date(lastRunAt).toLocaleString(locale))}</>}
            </p>
          </CardContent>
        )}
      </Card>

      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-300">
          <AlertDescription className="text-sm text-rose-900">{error}</AlertDescription>
        </Alert>
      )}

      {!hasProfile && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold text-amber-950">{rd.needsProfileTitle}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {rd.needsProfileDesc}
            </p>
            <Button size="sm" onClick={() => setView('profile')} className="bg-amber-600 hover:bg-amber-700 mt-1">
              <Briefcase className="w-4 h-4 mr-1.5" /> {rd.needsProfileButton}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasProfile && !profileMatchable && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold text-amber-950">
              {rd.notMatchableTitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {rd.notMatchableP1Prefix}
              <strong>{rd.notMatchableP1Bold}</strong>{rd.notMatchableP1Suffix}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {rd.notMatchableP2Prefix}<strong>{rd.notMatchableP2Bold}</strong>{rd.notMatchableP2Mid}
              <em>{rd.notMatchableP2Em}</em>{rd.notMatchableP2Suffix}
            </p>
            <Button size="sm" onClick={() => setView('profile')} className="bg-amber-600 hover:bg-amber-700 mt-1">
              <Briefcase className="w-4 h-4 mr-1.5" /> {rd.notMatchableButton}
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && hasProfile && profileMatchable && opportunities.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center space-y-2">
            <RadarIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              {preferences?.minimumFit === 'strong' ? rd.emptyHighFitTitle : rd.emptyTitle}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {preferences?.minimumFit === 'strong' ? rd.emptyHighFitDesc : rd.emptyDesc}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed pt-1">
              {rd.emptyHintPrefix}<strong>{rd.emptyHintBold}</strong>{rd.emptyHintSuffix}
            </p>
          </CardContent>
        </Card>
      )}

      {!error && profileMatchable && digest && digest.total > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-800">{digest.headline}</span>
          {digest.strong > 0 && <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300">{rd.digestStrong.replace('{n}', String(digest.strong))}</Badge>}
          {digest.good > 0 && <Badge variant="outline" className="bg-sky-50 text-sky-900 border-sky-300">{rd.digestGood.replace('{n}', String(digest.good))}</Badge>}
          {digest.partial > 0 && <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">{rd.digestPartial.replace('{n}', String(digest.partial))}</Badge>}
        </div>
      )}

      {/*
        Sem base para comparar, nada é listado — nem o que já estava gravado.
        O alerta é uma linha no banco, e a tela o lia sem recalcular: os avisos
        antigos continuavam aparecendo por baixo do cartão que acabou de dizer
        que não há como recomendar nada. A rodada seguinte apaga essas linhas;
        até lá, esconder é o mínimo.
      */}
      {!error && profileMatchable && opportunities.map((opportunity) => {
        const fit = opportunity.fit
        if (!fit) {
          return (
            <Card key={opportunity.alertId} className="border-slate-200">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">
                  {rd.fitReadErrorFallback}
                </p>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card key={opportunity.alertId} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">{fit.role}</CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    {fit.company} · {fit.location} · {fit.workMode}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={`shrink-0 font-bold text-[11px] ${COMPATIBILITY_STYLE[fit.compatibility] ?? ''}`}>
                  {rd.compatibilityBadge.replace('{level}', compatibilityLabels(rd)[fit.compatibility] ?? fit.compatibility)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {fit.whyRecommended.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {rd.whyRecommendedTitle}
                  </p>
                  <ul className="space-y-1">
                    {fit.whyRecommended.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fit.attention.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {rd.attentionTitle}
                  </p>
                  <ul className="space-y-1">
                    {fit.attention.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fit.blockers.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> {rd.blockersTitle}
                  </p>
                  <ul className="space-y-1">
                    {fit.blockers.map((item, i) => (
                      <li key={i} className="text-xs text-rose-900">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-600 italic border-l-2 border-slate-200 pl-3">{fit.recommendation}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" onClick={() => openJob(opportunity)} className="bg-indigo-600 hover:bg-indigo-700">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> {rd.viewJobButton}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => prepareResume(opportunity)}
                  disabled={preparing === opportunity.alertId}
                  className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  {preparing === opportunity.alertId
                    ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    : <Wand2 className="w-4 h-4 mr-1.5" />}
                  {rd.prepareResumeButton}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleInterviewPrep(opportunity)}
                  disabled={prepStartingId === opportunity.alertId}
                  className="border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                >
                  {prepStartingId === opportunity.alertId
                    ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    : <HelpCircle className="w-4 h-4 mr-1.5" />}
                  {rd.interviewPrepButton}
                </Button>
              </div>

              {expandedPrepAlertId === opportunity.alertId && (
                <div className="space-y-2.5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                  {prepStartingId === opportunity.alertId ? (
                    <p className="text-xs text-indigo-800 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {rd.interviewPrepLoading}
                    </p>
                  ) : interviewPrepJob.phase === 'failed' && !prepResults[opportunity.alertId] ? (
                    <p className="text-xs text-rose-700">{interviewPrepJob.error || rd.interviewPrepErrorFallback}</p>
                  ) : prepResults[opportunity.alertId] ? (
                    prepResults[opportunity.alertId].questions.length === 0 ? (
                      <p className="text-xs text-slate-600">{rd.interviewPrepEmpty}</p>
                    ) : (
                      prepResults[opportunity.alertId].questions.map((q, i) => (
                        <div key={i} className="space-y-1 pb-2.5 border-b border-indigo-100 last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-1.5">
                            <Badge
                              className={
                                q.signal === 'gap'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200 shrink-0'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0'
                              }
                            >
                              {q.signal === 'gap' ? rd.interviewPrepSignalGap : rd.interviewPrepSignalStrength}
                            </Badge>
                            <p className="text-xs font-semibold text-slate-800">{q.question}</p>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            <span className="font-medium text-slate-700">{rd.interviewPrepGroundedInLabel}</span> {q.groundedIn}
                          </p>
                          <p className="text-[11px] text-slate-600 italic">
                            <span className="font-medium not-italic text-slate-700">{rd.interviewPrepTipLabel}</span> {q.tip}
                          </p>
                        </div>
                      ))
                    )
                  ) : null}
                </div>
              )}

              {/* As ações do Job Fit são recomendações, não botões: cada uma
                  descreve o que fazer, e transformá-las em botões que fazem
                  todos a MESMA coisa prometeria escolhas que não existem. */}
              {fit.actions.filter((a) => a.primary).length > 0 && (
                <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
                  {fit.actions.filter((a) => a.primary).map((action) => (
                    <li key={action.id} className="flex gap-1.5">
                      <span className="text-emerald-600 shrink-0">→</span>
                      <span><strong className="text-slate-800">{action.label}.</strong> {action.rationale}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* §30 — o retorno humano. Registrado no alerta, nunca escrito
                  de volta no perfil sem que a pessoa decida. */}
              <div className="pt-3 border-t border-slate-100">
                {opportunity.feedback ? (
                  <p className="text-[11px] text-slate-500">
                    {opportunity.feedback === 'interested' ? rd.feedbackInterestedNote : rd.feedbackNotUsefulNote}
                  </p>
                ) : rejecting === opportunity.alertId ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700">{rd.feedbackWhatWrong}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {feedbackReasons(rd).map((reason) => (
                        <button
                          key={reason.id}
                          onClick={() => sendFeedback(opportunity.alertId, 'not_useful', reason.id)}
                          className="px-2.5 py-1 rounded-md border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-50"
                        >
                          {reason.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{rd.feedbackAskUseful}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => sendFeedback(opportunity.alertId, 'interested')}>
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" /> {rd.feedbackYes}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setRejecting(opportunity.alertId)}>
                      <ThumbsDown className="w-3.5 h-3.5 mr-1" /> {rd.feedbackNo}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
