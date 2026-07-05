'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard, Check, Loader2, AlertCircle, Sparkles, TrendingUp, Calculator,
  CheckCircle2, Clock, Zap, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface PlanPricing {
  plan: 'day' | 'monthly' | 'annual'
  label: string
  analysesIncluded: number
  rewritesIncluded: number
  estimatedCostUsd: number
  priceBrl: number
  marginBrl: number
  marginPct: number
}

interface PricingData {
  plans: PlanPricing[]
  costPerCycleUsd: number
  costPerCycleBrl: number
  tokenCost: { inputPer1k: number; outputPer1k: number }
  brlUsdRate: number
  assumptions: {
    analysisTokensIn: number
    analysisTokensOut: number
    rewriteTokensIn: number
    rewriteTokensOut: number
    storageCostPerUserPerDayUsd: number
  }
}

export function PlansView() {
  const { user, hydrate } = useAuth()
  const { setView } = useNav()
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [showCostDetails, setShowCostDetails] = useState(false)

  useEffect(() => {
    fetch('/api/pricing', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setPricing(d))
      .finally(() => setLoading(false))
  }, [])

  const activate = async (plan: 'day' | 'monthly' | 'annual') => {
    setActivating(plan)
    try {
      const r = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Falha ao ativar plano.')
        return
      }
      toast.success(`Plano ${data.subscription.plan} ativado!`)
      await hydrate()
      setView('dashboard')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setActivating(null)
    }
  }

  const planActive = user?.planActive
  const planEndsAt = user?.planEndsAt ? new Date(user.planEndsAt) : null

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planos e preços</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cobrimos apenas o custo de IA + armazenamento. Transparente.</p>
      </div>

      {/* CURRENT PLAN */}
      {planActive && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Plano {user?.plan === 'day' ? 'Passe Diário' : user?.plan === 'monthly' ? 'Mensal' : 'Anual'} ativo</p>
                <p className="text-xs text-emerald-700">Expira em {planEndsAt?.toLocaleDateString('pt-BR')} às {planEndsAt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setView('dashboard')}>Voltar ao painel</Button>
          </CardContent>
        </Card>
      )}

      {/* PLANS */}
      {pricing && (
        <div className="grid md:grid-cols-3 gap-4">
          {pricing.plans.map((p) => {
            const isCurrent = user?.plan === p.plan && planActive
            const popular = p.plan === 'monthly'
            return (
              <Card
                key={p.plan}
                className={`relative border-2 transition-all ${
                  popular ? 'border-emerald-500 shadow-lg scale-[1.02]' : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Mais popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {p.plan === 'day' && <Clock className="w-4 h-4 text-slate-500" />}
                      {p.plan === 'monthly' && <Zap className="w-4 h-4 text-emerald-600" />}
                      {p.plan === 'annual' && <Calendar className="w-4 h-4 text-violet-600" />}
                      <h3 className="font-semibold text-slate-900">{p.label}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.plan === 'day' && 'Vigência de 24 horas'}
                      {p.plan === 'monthly' && 'Por mês · cancele quando quiser'}
                      {p.plan === 'annual' && 'Por ano · equivalente a R$ 24,99/mês'}
                    </p>
                  </div>

                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    R$ {p.priceBrl.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    {p.plan === 'day' ? 'pagamento único' : p.plan === 'monthly' ? 'cobrança mensal' : 'cobrança anual'}
                  </p>

                  <ul className="space-y-2 mb-5 text-sm flex-1">
                    <li className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span><strong>{p.analysesIncluded}</strong> análises completas</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span><strong>{p.rewritesIncluded}</strong> reescritas</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span>Downloads ilimitados em PDF + MD</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span>Histórico completo</span>
                    </li>
                    {p.plan !== 'day' && (
                      <li className="flex items-start gap-2 text-slate-700">
                        <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                        <span>Suporte prioritário</span>
                      </li>
                    )}
                    {p.plan === 'annual' && (
                      <li className="flex items-start gap-2 text-slate-700">
                        <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                        <span><strong>2 meses grátis</strong></span>
                      </li>
                    )}
                  </ul>

                  <Button
                    onClick={() => activate(p.plan)}
                    disabled={!!activating || isCurrent}
                    className={`w-full ${popular ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {activating === p.plan ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ativando…</>
                    ) : isCurrent ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Plano atual</>
                    ) : (
                      <>{planActive ? 'Trocar para este' : 'Assinar'}</>
                    )}
                  </Button>

                  {/* COST TRANSPARENCY */}
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1">
                    <p className="text-slate-500">Custo real (IA + storage)</p>
                    <div className="flex justify-between">
                      <span className="text-slate-600">USD</span>
                      <span className="font-semibold text-slate-700">${p.estimatedCostUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">BRL (≈{pricing.brlUsdRate})</span>
                      <span className="font-semibold text-slate-700">R$ {(p.estimatedCostUsd * pricing.brlUsdRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Margem</span>
                      <span className="font-semibold text-emerald-700">{p.marginPct.toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* SIMULATION NOTICE */}
      <Alert>
        <Sparkles className="w-4 h-4" />
        <AlertDescription>
          <strong>Modo Fase 1:</strong> a ativação é simulada (sem gateway de pagamento). Na Fase 2, integraremos Stripe/PagSeguro e a ativação ocorrerá após confirmação do pagamento. Você já pode usar todos os recursos agora.
        </AlertDescription>
      </Alert>

      {/* COST DETAILS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-slate-500" />
              <div>
                <CardTitle className="text-base">Como calculamos o custo</CardTitle>
                <CardDescription>Transparência total sobre o modelo de custo</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCostDetails(!showCostDetails)}>
              {showCostDetails ? 'Ocultar' : 'Ver detalhes'}
            </Button>
          </div>
        </CardHeader>
        {showCostDetails && pricing && (
          <CardContent className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tokens por análise</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-600">Entrada</span><span className="font-mono">{pricing.assumptions.analysisTokensIn.toLocaleString('pt-BR')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Saída</span><span className="font-mono">{pricing.assumptions.analysisTokensOut.toLocaleString('pt-BR')}</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tokens por reescrita</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-600">Entrada</span><span className="font-mono">{pricing.assumptions.rewriteTokensIn.toLocaleString('pt-BR')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Saída</span><span className="font-mono">{pricing.assumptions.rewriteTokensOut.toLocaleString('pt-BR')}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preço do modelo (GLM-4.6)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Entrada</span><span className="font-mono">${pricing.tokenCost.inputPer1k.toFixed(4)}/1K tokens</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Saída</span><span className="font-mono">${pricing.tokenCost.outputPer1k.toFixed(4)}/1K tokens</span></div>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Custo por ciclo (análise + reescrita)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-900">${pricing.costPerCycleUsd.toFixed(4)}</span>
                <span className="text-sm text-emerald-700">≈ R$ {pricing.costPerCycleBrl.toFixed(3)}</span>
              </div>
              <p className="text-xs text-emerald-700">+ armazenamento SQLite: ${pricing.assumptions.storageCostPerUserPerDayUsd.toFixed(4)}/usuário/dia (≈ R$ {(pricing.assumptions.storageCostPerUserPerDayUsd * pricing.brlUsdRate).toFixed(4)}/dia)</p>
            </div>

            <p className="text-xs text-slate-500">
              <strong>Cálculo do custo por plano:</strong> (custo do ciclo × análises incluídas) + (storage × dias do plano).
              O plano anual tem margem menor (66%) mas LTV maior; o diário tem margem altíssima (94%) para capturar usuários casuais.
            </p>
          </CardContent>
        )}
      </Card>

      {/* FREE TIER NOTE */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4 flex items-start gap-3">
          <CreditCard className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900 mb-0.5">Plano gratuito</p>
            <p>Você pode analisar currículos gratuitamente (com laudo completo e nota 0–10). A reescrita e os downloads exigem plano pago — é como conseguimos manter a IA rodando.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
