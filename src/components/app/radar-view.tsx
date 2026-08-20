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
  ThumbsUp, ThumbsDown, Sliders, Info, Briefcase, RefreshCw, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'

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

const FREQUENCY_LABEL: Record<string, string> = {
  immediate: 'Assim que encontrar',
  daily: 'Uma vez por dia',
  weekly: 'Uma vez por semana',
  off: 'Desligado',
}

const MINIMUM_FIT_LABEL: Record<string, string> = {
  strong: 'Só as de alta compatibilidade',
  good: 'Alta e boa compatibilidade',
  partial: 'Inclusive as parciais',
}

const COMPATIBILITY_STYLE: Record<string, string> = {
  Alta: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Boa: 'bg-sky-100 text-sky-900 border-sky-300',
  Parcial: 'bg-amber-100 text-amber-900 border-amber-300',
  Baixa: 'bg-slate-100 text-slate-700 border-slate-300',
}

const FEEDBACK_REASONS: { id: string; label: string }[] = [
  { id: 'wrong_role', label: 'Cargo errado' },
  { id: 'location', label: 'Localização' },
  { id: 'salary', label: 'Salário' },
  { id: 'seniority', label: 'Senioridade' },
  { id: 'skills', label: 'Competências' },
  { id: 'company', label: 'Empresa' },
  { id: 'work_mode', label: 'Modelo de trabalho' },
  { id: 'other', label: 'Outro' },
]

export function RadarView() {
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
      setError(null)
    } else {
      setError(radar?.error || 'Não foi possível carregar o Radar.')
    }
    if (prefsRes.ok && prefs?.preferences) {
      setPreferences(prefs.preferences)
      setLastRunAt(prefs.lastRunAt ?? null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await load()
      } catch {
        if (!cancelled) setError('Falha de conexão ao carregar o Radar.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [load])

  const [preparing, setPreparing] = useState<string | null>(null)

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
        toast.error(data?.error || 'Não foi possível preparar seu currículo para esta vaga.')
        return
      }

      // Dizer o que foi trocado, em vez de trocar o alvo em silêncio: a próxima
      // análise sairia diferente e ninguém saberia por quê.
      if (data?.previousTarget) {
        toast.info(`Seu currículo estava direcionado a "${data.previousTarget}". Agora aponta para esta vaga.`)
      } else {
        toast.success('Currículo direcionado a esta vaga.')
      }

      openResume(data.resumeId, 'rewrite')
    } catch {
      toast.error('Falha de conexão ao preparar seu currículo.')
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
        toast.error(data?.error || 'Não foi possível atualizar o Radar agora.')
        return
      }

      await load()

      if (data?.alerted > 0) {
        toast.success(`${data.alerted} ${data.alerted === 1 ? 'oportunidade nova' : 'oportunidades novas'}.`)
      } else {
        toast.info('Nada novo que justifique um aviso. O Radar continua monitorando.')
      }
    } catch {
      toast.error('Falha de conexão ao atualizar o Radar.')
    } finally {
      setRunning(false)
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
        toast.error(data?.error || 'Não foi possível salvar a preferência.')
      }
    } catch {
      toast.error('Falha de conexão ao salvar a preferência.')
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
      toast.success(feedback === 'interested' ? 'Anotado — vamos buscar mais assim.' : 'Anotado. Isso ajuda a calibrar o Radar.')
    } catch {
      toast.error('Falha ao registrar seu retorno.')
    }
  }

  const openJob = async (opportunity: Opportunity) => {
    void internalFetch('/api/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: opportunity.alertId, action: 'clicked' }),
    })
    window.open(opportunity.applicationUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Carregando seu Radar...</p>
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
                  Monitora oportunidades para o seu perfil e só te interrompe quando encontra algo que merece
                  sua atenção.
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
                title="Reavalia as vagas já coletadas contra o seu perfil"
              >
                {running ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                Procurar agora
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings((v) => !v)}>
                <Sliders className="w-4 h-4 mr-1.5" /> Preferências
              </Button>
            </div>
          </div>
        </CardHeader>

        {showSettings && preferences && (
          <CardContent className="space-y-4 border-t border-indigo-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Com que frequência avisar</Label>
                <select
                  value={preferences.frequency}
                  onChange={(e) => savePreferences({ frequency: e.target.value as Preferences['frequency'] })}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">O que vale um aviso</Label>
                <select
                  value={preferences.minimumFit}
                  onChange={(e) => savePreferences({ minimumFit: e.target.value as Preferences['minimumFit'] })}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {Object.entries(MINIMUM_FIT_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              O Radar é silencioso por padrão: se não houver nada realmente relevante, ele não envia nada. Isso é o
              comportamento esperado, não uma falha.
              {lastRunAt && <> Última varredura: {new Date(lastRunAt).toLocaleString('pt-BR')}.</>}
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
            <p className="text-sm font-semibold text-amber-950">O Radar precisa do seu perfil profissional</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sem saber o que você faz e onde quer trabalhar, não há como separar o que é oportunidade do que é
              ruído. Preencher o mercado principal já é suficiente para começar.
            </p>
            <Button size="sm" onClick={() => setView('profile')} className="bg-amber-600 hover:bg-amber-700 mt-1">
              <Briefcase className="w-4 h-4 mr-1.5" /> Preencher perfil profissional
            </Button>
          </CardContent>
        </Card>
      )}

      {hasProfile && !profileMatchable && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold text-amber-950">
              Falta dizer o que você faz
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seu perfil tem onde você está e como quer trabalhar, mas ainda não tem{' '}
              <strong>cargo, área ou competências</strong>. Sem isso não há o que comparar com uma
              vaga: qualquer resultado seria só o que calhou de existir no banco, e não o que tem a
              ver com você.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Preencher <strong>um</strong> desses campos já liga o Radar. O botão{' '}
              <em>Preencher a partir do currículo</em>, na tela do perfil, tira todos eles do
              currículo que você já enviou.
            </p>
            <Button size="sm" onClick={() => setView('profile')} className="bg-amber-600 hover:bg-amber-700 mt-1">
              <Briefcase className="w-4 h-4 mr-1.5" /> Completar perfil profissional
            </Button>
          </CardContent>
        </Card>
      )}

      {hasProfile && profileMatchable && opportunities.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center space-y-2">
            <RadarIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Nada digno de nota no momento</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              O Radar está monitorando e não encontrou oportunidade que justifique interromper você. Silêncio aqui
              é o comportamento correto — quando aparecer algo relevante, ele aparece nesta tela.
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed pt-1">
              A busca por vagas novas acontece uma vez por dia. <strong>Procurar agora</strong> reavalia as vagas já
              encontradas contra o seu perfil — útil logo depois de mudar alguma coisa nele.
            </p>
          </CardContent>
        </Card>
      )}

      {digest && digest.total > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-800">{digest.headline}</span>
          {digest.strong > 0 && <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300">{digest.strong} de alta compatibilidade</Badge>}
          {digest.good > 0 && <Badge variant="outline" className="bg-sky-50 text-sky-900 border-sky-300">{digest.good} compatível</Badge>}
          {digest.partial > 0 && <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">{digest.partial} alternativa</Badge>}
        </div>
      )}

      {opportunities.map((opportunity) => {
        const fit = opportunity.fit
        if (!fit) {
          return (
            <Card key={opportunity.alertId} className="border-slate-200">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">
                  Esta oportunidade foi registrada, mas o diagnóstico dela não pôde ser lido. Ela reaparecerá numa
                  próxima varredura.
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
                  Compatibilidade {fit.compatibility}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {fit.whyRecommended.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Por que recomendamos
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
                    <AlertTriangle className="w-3.5 h-3.5" /> Atenção
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
                    <XCircle className="w-3.5 h-3.5" /> Impedimentos
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
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Ver a vaga
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
                  Preparar meu currículo
                </Button>
              </div>

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
                    {opportunity.feedback === 'interested' ? '👍 Você marcou como interessante.' : '👎 Você marcou como não útil.'}
                  </p>
                ) : rejecting === opportunity.alertId ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700">O que não serviu?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FEEDBACK_REASONS.map((reason) => (
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
                    <span className="text-[11px] text-slate-500">Esta oportunidade foi útil?</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => sendFeedback(opportunity.alertId, 'interested')}>
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Sim
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setRejecting(opportunity.alertId)}>
                      <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Não
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
