'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Radar as RadarIcon, XCircle } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Cota das APIs de vagas, saúde das fontes e faxina semântica de duplicatas.
 */

interface QuotaDecision {
  verdict: 'ok' | 'reserve_only' | 'exhausted' | 'unknown'
  remaining: number | null
  remainingForOnDemand: number | null
  explanation: string
}

interface ProviderQuota {
  provider: string
  period: string
  used: number
  limit: number | null
  decision: QuotaDecision
  alert: 'none' | 'attention' | 'critical'
}

interface SourceHealth {
  slug: string
  name: string
  enabled: boolean
  collectionStatus: string
  collectionError: string | null
  lastCollectionAt: string | null
  lastSuccessfulCollection: string | null
  consecutiveFailures: number
  _count: { jobs: number }
}

const ALERT_STYLE: Record<ProviderQuota['alert'], string> = {
  none: 'border-slate-200',
  attention: 'border-amber-300 bg-amber-50/50',
  critical: 'border-rose-300 bg-rose-50/50',
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ok: { label: 'Coletando', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  partial: { label: 'Parcial', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  empty_unexpected: { label: 'Vazia — suspeito', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  error: { label: 'Com erro', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  never_collected: { label: 'Nunca coletou', className: 'bg-slate-100 text-slate-700 border-slate-200' },
}

function quandoFoi(iso: string | null): string {
  if (!iso) return 'nunca'
  const horas = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (horas < 1) return 'há menos de uma hora'
  if (horas < 24) return `há ${Math.floor(horas)}h`
  return `há ${Math.floor(horas / 24)} dias`
}

export function RadarQuotas() {
  const [quotas, setQuotas] = useState<ProviderQuota[]>([])
  const [sources, setSources] = useState<SourceHealth[]>([])
  const [period, setPeriod] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dedupRunning, setDedupRunning] = useState(false)
  const [dedupResult, setDedupResult] = useState<{
    pairsAnalyzed: number
    duplicatesFound: number
    jobsDeleted: number
    timeSpentMs: number
    errors: string[]
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await internalFetch('/api/admin/quotas', { cache: 'no-store' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Não foi possível ler o consumo das APIs.')
        return
      }

      setQuotas(data.quotas || [])
      setSources(data.sources || [])
      setPeriod(data.period ?? null)
      setError(null)
    } catch {
      setError('Falha de conexão ao ler o consumo das APIs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleRunDedup = async () => {
    setDedupRunning(true)
    try {
      const res = await internalFetch('/api/admin/jobs/dedup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPairs: 20, timeBudgetMs: 40_000 }),
      })
      const data = await res.json().catch(() => null)
      if (data?.ok && data.summary) {
        setDedupResult(data.summary)
        void load()
      } else {
        alert(data?.error || 'Erro ao executar a faxina de deduplicação.')
      }
    } catch {
      alert('Falha na comunicação ao rodar a deduplicação.')
    } finally {
      setDedupRunning(false)
    }
  }

  if (loading && quotas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
      </div>
    )
  }

  const criticos = quotas.filter((q) => q.alert === 'critical')
  const atencao = quotas.filter((q) => q.alert === 'attention')
  const fontesComProblema = sources.filter(
    (s) => s.collectionStatus === 'error' || s.consecutiveFailures > 0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RadarIcon className="w-5 h-5 text-indigo-600" /> Radar de Vagas — Saúde e Cotas
          </h2>
          <p className="text-xs text-slate-500">
            Monitoramento das fontes externas, consumo das APIs ({period ?? 'mês corrente'}) e faxina inteligente da base.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Card da Faxina Semântica com IA */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                🧹 Faxina Semântica de Duplicatas por IA
              </CardTitle>
              <CardDescription className="text-xs text-indigo-800/80">
                Agente IA (Kimi K3 &rarr; DeepSeek Flash &rarr; Gemini) para comparar e eliminar vagas idênticas vindas de fontes diferentes.
              </CardDescription>
            </div>
            <Button
              onClick={() => void handleRunDedup()}
              disabled={dedupRunning}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm gap-2"
            >
              {dedupRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {dedupRunning ? 'Analisando Vagas…' : 'Executar Faxina de Duplicatas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Identifica vagas com pequenas variações de título, nome de empresa ou links intermediários, preserva a versão mais recente e migra alertas existentes dos usuários.
          </p>
          {dedupResult && (
            <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-emerald-800">
                ✅ Faxina concluída em {(dedupResult.timeSpentMs / 1000).toFixed(1)}s!
              </p>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-[10px] text-slate-500 uppercase">Pares Analisados</p>
                  <p className="font-bold text-sm text-slate-900">{dedupResult.pairsAnalyzed}</p>
                </div>
                <div className="p-2 bg-amber-50 rounded">
                  <p className="text-[10px] text-amber-700 uppercase">Duplicatas Confirmadas</p>
                  <p className="font-bold text-sm text-amber-900">{dedupResult.duplicatesFound}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded">
                  <p className="text-[10px] text-emerald-700 uppercase">Vagas Antigas Removidas</p>
                  <p className="font-bold text-sm text-emerald-900">{dedupResult.jobsDeleted}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-rose-200 bg-rose-50 text-rose-900">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {criticos.length > 0 && (
        <Alert className="border-rose-300 bg-rose-50 text-rose-900">
          <XCircle className="w-4 h-4 text-rose-600" />
          <AlertDescription className="text-xs">
            <strong>{criticos.length} cota(s) crítica(s):</strong>{' '}
            {criticos.map((q) => q.provider).join(', ')}. O Radar pode não encontrar vagas nestas fontes até o
            próximo mês.
          </AlertDescription>
        </Alert>
      )}

      {atencao.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs">
            <strong>{atencao.length} cota(s) em atenção:</strong>{' '}
            {atencao.map((q) => q.provider).join(', ')}. O consumo passou do ritmo esperado para o dia do mês.
          </AlertDescription>
        </Alert>
      )}

      {fontesComProblema.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs">
            <strong>{fontesComProblema.length} fonte(s) com problema recente:</strong>{' '}
            {fontesComProblema.map((s) => `${s.slug} (${s.collectionStatus})`).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quotas.map((q) => {
          const pct = q.limit ? Math.min(100, Math.round((q.used / q.limit) * 100)) : null
          const badgeClass =
            q.alert === 'critical'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : q.alert === 'attention'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'

          return (
            <Card key={q.provider} className={ALERT_STYLE[q.alert]}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-800 capitalize">{q.provider}</CardTitle>
                  {pct != null ? (
                    <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
                      {pct}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                      Sem teto
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-[11px] text-slate-600">
                  {q.limit == null
                    ? `${q.used} requisições este mês`
                    : `${q.used} de ${q.limit} requisições`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pct != null && (
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        q.alert === 'critical' ? 'bg-rose-500' : q.alert === 'attention' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-slate-600 leading-relaxed">{q.decision.explanation}</p>
                {q.decision.remainingForOnDemand != null && (
                  <p className="text-[10px] text-slate-500">
                    Disponível para busca sob demanda: <strong>{q.decision.remainingForOnDemand}</strong>.
                    O restante é reserva da rodada diária, que atende todos os usuários.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Fontes de vagas</h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Cota é só uma das formas de uma fonte parar. Uma que responde erro há dias não estourou cota
          nenhuma.
        </p>

        <div className="space-y-2">
          {sources.length === 0 && (
            <p className="text-xs text-slate-500 italic">
              Nenhuma fonte registrada ainda. Elas aparecem depois da primeira rodada do Radar.
            </p>
          )}

          {sources.map((s) => {
            const status = STATUS_LABEL[s.collectionStatus] ?? {
              label: s.collectionStatus,
              className: 'bg-slate-100 text-slate-700 border-slate-200',
            }

            return (
              <div
                key={s.slug}
                className="flex flex-wrap items-center gap-2 justify-between p-3 rounded-lg border border-slate-200 bg-white"
              >
                <div className="min-w-[180px]">
                  <p className="text-xs font-semibold text-slate-800">{s.slug}</p>
                  <p className="text-[10px] text-slate-500">
                    {s._count.jobs} vagas · última coleta {quandoFoi(s.lastCollectionAt)}
                    {s.lastSuccessfulCollection !== s.lastCollectionAt && (
                      <> · último sucesso {quandoFoi(s.lastSuccessfulCollection)}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {s.consecutiveFailures > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-800 border-rose-200">
                      {s.consecutiveFailures} {s.consecutiveFailures === 1 ? 'falha seguida' : 'falhas seguidas'}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                  {s.collectionStatus === 'ok' && s.consecutiveFailures === 0 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>

                {s.collectionError && (
                  <p className="text-[10px] text-rose-700 w-full border-l-2 border-rose-200 pl-2">
                    {s.collectionError}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
