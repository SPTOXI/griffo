'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Radar as RadarIcon, XCircle } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Cota das APIs de vagas e saúde das fontes.
 *
 * Existe porque as duas formas de uma fonte parar são invisíveis de fora:
 *
 * - **Cota estourada** não vira erro. A Adzuna responde 200 com `exception`
 *   quando o mês acaba, o que se parece com "não há vaga".
 * - **Fonte quebrada** só aparece como "o Radar entregou menos".
 *
 * Nos dois casos o Radar continua rodando e ninguém sabe por quê está mais
 * pobre. Esta tela responde as duas perguntas no mesmo lugar, porque é assim
 * que elas chegam: "por que apareceu menos vaga hoje?".
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
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-300">
          <AlertDescription className="text-sm text-rose-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* O que exige ação vem primeiro. Um painel que mostra tudo igual obriga
          a procurar o problema, e quem procura acaba não olhando. */}
      {criticos.length > 0 && (
        <Alert className="border-rose-300 bg-rose-50">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900">
            <strong>{criticos.map((q) => q.provider).join(', ')}</strong> passou de 90% da cota do mês.
            Quando ela acabar, a fonte para de trazer vaga — e o Radar não avisa sozinho.
          </AlertDescription>
        </Alert>
      )}

      {criticos.length === 0 && atencao.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-900">
            <strong>{atencao.map((q) => q.provider).join(', ')}</strong> passou de 70% da cota. Ainda dá
            tempo de decidir sem pressa.
          </AlertDescription>
        </Alert>
      )}

      {fontesComProblema.length > 0 && (
        <Alert className="border-rose-300 bg-rose-50">
          <XCircle className="w-4 h-4 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900">
            {fontesComProblema.length === 1 ? 'Uma fonte está' : `${fontesComProblema.length} fontes estão`}{' '}
            falhando: <strong>{fontesComProblema.map((s) => s.slug).join(', ')}</strong>. Cota é só uma das
            formas de uma fonte parar.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RadarIcon className="w-4 h-4 text-indigo-600" /> Cota das APIs de vagas
          </h3>
          <p className="text-[11px] text-slate-500">
            Consumo do mês {period ? <strong>{period}</strong> : 'corrente'}. Zerado a cada virada de mês.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          Atualizar
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {quotas.map((q) => {
          const pct = q.limit ? Math.min(100, Math.round((q.used / q.limit) * 100)) : null

          return (
            <Card key={q.provider} className={ALERT_STYLE[q.alert]}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold text-slate-900 capitalize">{q.provider}</CardTitle>
                  {q.limit == null ? (
                    <Badge variant="outline" className="text-[10px] bg-slate-50">sem teto declarado</Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        q.alert === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : q.alert === 'attention'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {pct}% usado
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
