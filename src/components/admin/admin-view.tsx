'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, CreditCard, Cpu, Search, Loader2, Save, RefreshCw, Activity, BarChart3, Zap, DollarSign, TrendingUp, Percent } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  plan: string
  credits?: number
  createdAt: string
  _count: { resumes: number; subscriptions: number }
}

interface Metrics {
  totalUsers: number
  totalResumes: number
  activeSubscriptions: number
  aiUsage: {
    totalTokensIn: number
    totalTokensOut: number
    totalCostUsd: number
    totalCostBrl: number
  }
  financial: {
    totalRevenueBrl: number
    estimatedProfitBrl: number
  }
}

interface BenchmarkItem {
  provider: string
  model: string
  callsCount: number
  tokensTotal: number
  avgLatencyMs: number
  avgCostUsd: number
  successRatePct: number
  failoverCount: number
}

interface AiMetricsData {
  costs: {
    totalAiCostUsd: number
    totalAiCostBrl: number
    avgCostPerUserUsd: number
    avgCostPerAnalysisUsd: number
    costByProvider: Record<string, number>
    costByTask: Record<string, number>
  }
  usage: {
    totalAiCalls: number
    totalFailovers: number
    callsByProvider: Record<string, number>
    callsByTask: Record<string, number>
    latencyByProvider: Record<string, number>
  }
  rankings: {
    topTasks: Array<{ task: string; costUsd: number; calls: number }>
    topModels: Array<{ provider: string; calls: number; costUsd: number }>
    topUsers: Array<{ userId: string; email: string; costUsd: number; calls: number }>
  }
  benchmarks: BenchmarkItem[]
}

export function AdminView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [aiMetrics, setAiMetrics] = useState<AiMetricsData | null>(null)
  const [configs, setConfigs] = useState<Record<string, string>>({
    CREDIT_PRICE_BRL: '0.20',
    AI_AVG_COST_BRL: '0.05',
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [uRes, mRes, cRes, aiRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/ai-metrics'),
      ])

      const [uData, mData, cData, aiData] = await Promise.all([
        uRes.json().catch(() => ({})),
        mRes.json().catch(() => ({})),
        cRes.json().catch(() => ({})),
        aiRes.json().catch(() => ({})),
      ])

      if (uData.users) setUsers(uData.users)
      if (mData.metrics) setMetrics(mData.metrics)
      if (cData.config) setConfigs((prev) => ({ ...prev, ...cData.config }))
      if (aiData.costs) setAiMetrics(aiData)
    } catch (e) {
      toast.error('Erro ao carregar dados administrativos')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, role?: string, plan?: string) => {
    try {
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, plan }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao atualizar')
        return
      }
      toast.success('Usuário atualizado com sucesso!')
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...data.user } : u)))
    } catch {
      toast.error('Falha ao conectar com o servidor')
    }
  }

  const saveSettings = async () => {
    setSavingConfig(true)
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs),
      })
      if (r.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch {
      toast.error('Falha de conexão')
    } finally {
      setSavingConfig(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchesPlan = planFilter === 'all' || u.plan === planFilter
    return matchesSearch && matchesPlan
  })

  // Credit Finance Stats Calculation
  const totalRevenueBrl = metrics?.financial.totalRevenueBrl || 0
  const purchasingUsersCount = users.filter((u) => u.plan !== 'free').length
  const freeUsersCount = Math.max(0, users.length - purchasingUsersCount)
  const conversionRate = users.length > 0 ? (purchasingUsersCount / users.length) * 100 : 0
  const ticketMédioBrl = purchasingUsersCount > 0 ? totalRevenueBrl / purchasingUsersCount : 0

  const creditPriceBrl = parseFloat(configs.CREDIT_PRICE_BRL || '0.20')
  const aiAvgCostBrl = parseFloat(configs.AI_AVG_COST_BRL || '0.05')
  const baselineMarginPercent = aiAvgCostBrl > 0 ? Math.round(((creditPriceBrl - aiAvgCostBrl) / aiAvgCostBrl) * 100) : 300

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" /> Painel Administrativo
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie monetização por créditos, usuários, AI Router, telemetria e parâmetros financeiros.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Usuários Totais</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalUsers}</p>
                <p className="text-[10px] text-emerald-600 font-medium">{freeUsersCount} Free / {purchasingUsersCount} Compradores</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Receita Gerada</p>
                <p className="text-2xl font-bold text-slate-900">R$ {totalRevenueBrl.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">Ticket Médio: R$ {ticketMédioBrl.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-slate-900">{conversionRate.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-400">Free para Comprador</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Margem por Crédito</p>
                <p className="text-2xl font-bold text-slate-900">{baselineMarginPercent}%</p>
                <p className="text-[10px] text-slate-400">R$ {creditPriceBrl} / Custo R$ {aiAvgCostBrl}</p>
              </div>
              <Percent className="w-8 h-8 text-violet-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="credits-finance" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="credits-finance" className="gap-1.5">
            <Zap className="w-4 h-4" /> Monetização & Créditos
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-4 h-4" /> Usuários e Saldos
          </TabsTrigger>
          <TabsTrigger value="ai-router" className="gap-1.5">
            <Cpu className="w-4 h-4" /> IA & Roteamento
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5">
            <Shield className="w-4 h-4" /> Configurações Gerais
          </TabsTrigger>
        </TabsList>

        {/* CREDITS FINANCE TAB */}
        <TabsContent value="credits-finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FINANCIAL DASHBOARD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Dashboard Financeiro de Créditos
                </CardTitle>
                <CardDescription>Resumo de vendas, consumo, receita e margens de IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Receita Bruta Gerada</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">R$ {totalRevenueBrl.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Custo Estimado de IA (Consumo)</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    R$ {((aiMetrics?.costs.totalAiCostUsd || 0) * 5.4).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Margem Bruta Operacional</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">
                    {baselineMarginPercent}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Preço do Crédito</span>
                  <span className="font-mono text-slate-900 font-semibold">R$ {creditPriceBrl.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Custo Operacional Médio da IA</span>
                  <span className="font-mono text-slate-700 font-semibold">R$ {aiAvgCostBrl.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* USER CONVERSION DASHBOARD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Métricas de Usuários & Conversão
                </CardTitle>
                <CardDescription>Acompanhamento de usuários gratuitos versus compradores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Usuários Gratuitos (Griffo Free - 20 cr)</span>
                  <span className="font-bold text-slate-900 font-mono">{freeUsersCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Usuários Compradores de Pacotes</span>
                  <span className="font-bold text-emerald-700 font-mono">{purchasingUsersCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Taxa de Conversão (Free ➔ Comprador)</span>
                  <span className="font-mono font-bold text-slate-900">{conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Ticket Médio por Comprador</span>
                  <span className="font-mono text-emerald-700 font-semibold">R$ {ticketMédioBrl.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FINANCIAL RULE FORM */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regra Financeira & Parâmetros de Créditos</CardTitle>
              <CardDescription>
                Ajuste o preço por crédito, o custo operacional médio da IA e os valores dos pacotes comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Preço do Crédito (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configs.CREDIT_PRICE_BRL || '0.20'}
                    onChange={(e) => setConfigs({ ...configs, CREDIT_PRICE_BRL: e.target.value })}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Padrão: R$ 0,20</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Custo Médio da IA (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configs.AI_AVG_COST_BRL || '0.05'}
                    onChange={(e) => setConfigs({ ...configs, AI_AVG_COST_BRL: e.target.value })}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Padrão: R$ 0,05</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Créditos de Boas-Vindas</label>
                  <Input
                    type="number"
                    value={configs.WELCOME_CREDITS || '20'}
                    onChange={(e) => setConfigs({ ...configs, WELCOME_CREDITS: e.target.value })}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Concedidos no cadastro (20 cr)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Margem Calculada</label>
                  <Input
                    readOnly
                    value={`${baselineMarginPercent}%`}
                    className="text-xs font-mono bg-slate-50 font-bold text-emerald-700"
                  />
                  <p className="text-[10px] text-slate-400">Meta de Margem: 300%</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={saveSettings} disabled={savingConfig} className="bg-emerald-600 hover:bg-emerald-700">
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar Regras Financeiras
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div>
                  <CardTitle className="text-base">Gestão de Usuários e Saldos de Créditos</CardTitle>
                  <CardDescription>
                    Gerencie papéis (Admin/User), atribua créditos ou pacotes manualmente.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome/email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-9 w-48 sm:w-64"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="h-9 text-xs w-32">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Planos</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="carreira">Carreira</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Função (Role)</th>
                      <th className="px-4 py-3">Pacote Atribuído</th>
                      <th className="px-4 py-3">Saldo de Créditos</th>
                      <th className="px-4 py-3">Envios</th>
                      <th className="px-4 py-3">Data de Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{u.name || 'Sem nome'}</p>
                          <p className="text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={u.role || 'user'}
                            onValueChange={(v) => updateUser(u.id, v, undefined)}
                          >
                            <SelectTrigger className="h-7 text-[11px] w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={u.plan || 'free'}
                            onValueChange={(v) => updateUser(u.id, undefined, v)}
                          >
                            <SelectTrigger className="h-7 text-[11px] w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free (20 cr)</SelectItem>
                              <SelectItem value="starter">Starter (100 cr)</SelectItem>
                              <SelectItem value="carreira">Carreira (500 cr)</SelectItem>
                              <SelectItem value="profissional">Profissional (1.500 cr)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                          {u.credits ?? 20} cr
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {u._count.resumes} envios
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI ROUTER TAB */}
        <TabsContent value="ai-router" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white">
              <CardContent className="p-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Roteamento Inteligente</p>
                <p className="text-sm font-medium">Kimi K3, Claude 3.5, DeepSeek, Gemini</p>
                <p className="text-xs text-slate-300">Roteamento por menor custo e failover automático.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-medium text-slate-500">Custo Médio / Análise</p>
                <p className="text-xl font-bold text-slate-900">
                  R$ {((aiMetrics?.costs.avgCostPerAnalysisUsd || 0) * 5.4).toFixed(3)}
                </p>
                <p className="text-[10px] text-slate-400">${(aiMetrics?.costs.avgCostPerAnalysisUsd || 0).toFixed(4)} USD</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-medium text-slate-500">Failovers Automáticos</p>
                <p className="text-xl font-bold text-slate-900">{aiMetrics?.usage.totalFailovers || 0}</p>
                <p className="text-[10px] text-slate-400">Sem impacto no usuário</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" /> Tabela Comparativa entre Modelos de IA
              </CardTitle>
              <CardDescription>Métricas agregadas em tempo real por modelo.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Provedor</th>
                      <th className="px-4 py-3">Chamadas</th>
                      <th className="px-4 py-3">Tokens Totais</th>
                      <th className="px-4 py-3">Tempo Médio</th>
                      <th className="px-4 py-3">Custo Médio / Call</th>
                      <th className="px-4 py-3">Taxa de Sucesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiMetrics?.benchmarks && aiMetrics.benchmarks.length > 0 ? (
                      aiMetrics.benchmarks.map((b) => (
                        <tr key={b.model} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-900 font-mono">{b.model}</td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">{b.provider}</td>
                          <td className="px-4 py-3">{b.callsCount}</td>
                          <td className="px-4 py-3 font-mono">{b.tokensTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono">{b.avgLatencyMs} ms</td>
                          <td className="px-4 py-3 font-mono text-emerald-700 font-medium">
                            R$ {(b.avgCostUsd * 5.4).toFixed(4)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
                              {b.successRatePct}%
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          Nenhuma chamada de IA registrada no histórico recente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GENERAL SYSTEM TAB */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parâmetros Gerais do Sistema</CardTitle>
              <CardDescription>Ajuste opções globais e chaves de API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Chave da API da IA (MOONSHOT_API_KEY)
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={configs.MOONSHOT_API_KEY || ''}
                    onChange={(e) => setConfigs({ ...configs, MOONSHOT_API_KEY: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Modelo Principal (Model)</label>
                  <Input
                    placeholder="kimi-k3"
                    value={configs.KIMI_MODEL || 'kimi-k3'}
                    onChange={(e) => setConfigs({ ...configs, KIMI_MODEL: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">URL Base (Base URL)</label>
                  <Input
                    placeholder="https://api.moonshot.ai/v1"
                    value={configs.LLM_BASE_URL || 'https://api.moonshot.ai/v1'}
                    onChange={(e) => setConfigs({ ...configs, LLM_BASE_URL: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={saveSettings} disabled={savingConfig} className="bg-violet-600 hover:bg-violet-700">
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar Parâmetros Gerais
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
