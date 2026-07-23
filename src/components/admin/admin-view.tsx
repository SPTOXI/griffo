'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Users, CreditCard, Cpu, Search, Loader2, Save, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  plan: string
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

export function AdminView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [configs, setConfigs] = useState<Record<string, string>>({})
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
      const [uRes, mRes, cRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/settings'),
      ])

      const [uData, mData, cData] = await Promise.all([
        uRes.json(),
        mRes.json(),
        cRes.json(),
      ])

      if (uData.users) setUsers(uData.users)
      if (mData.metrics) setMetrics(mData.metrics)
      if (cData.config) setConfigs(cData.config)
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
            Gerencie usuários, regras de acesso, custos de IA e gateways de pagamento.
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
                <p className="text-xs font-medium text-slate-500">Usuários Registrados</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.activeSubscriptions}</p>
              </div>
              <CreditCard className="w-8 h-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Custo Total Kimi K3</p>
                <p className="text-2xl font-bold text-slate-900">
                  R$ {metrics.aiUsage.totalCostBrl.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">
                  ${metrics.aiUsage.totalCostUsd.toFixed(3)} USD
                </p>
              </div>
              <Cpu className="w-8 h-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Receita Bruta</p>
                <p className="text-2xl font-bold text-slate-900">
                  R$ {metrics.financial.totalRevenueBrl.toFixed(2)}
                </p>
              </div>
              <Shield className="w-8 h-8 text-violet-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-4 h-4" /> Usuários e Permissões
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="w-4 h-4" /> Pagamentos & Gateway
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5">
            <Shield className="w-4 h-4" /> Configurações Gerais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div>
                  <CardTitle className="text-base">Gestão de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie papéis (Admin/User) e atribua planos manualmente.
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
                      <SelectItem value="day">Diário</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
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
                      <th className="px-4 py-3">Plano Atual</th>
                      <th className="px-4 py-3">Currículos</th>
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
                            <SelectTrigger className="h-7 text-[11px] w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Gratuito</SelectItem>
                              <SelectItem value="day">Passe Diário</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
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

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gateway de Pagamento & Checkout</CardTitle>
              <CardDescription>
                Configure credenciais para processar pagamentos via Pix / Cartão de Crédito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Provedor Principal (Gateway)
                  </label>
                  <Select
                    value={configs.PAYMENT_PROVIDER || 'mercadopago'}
                    onValueChange={(v) => setConfigs({ ...configs, PAYMENT_PROVIDER: v })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mercadopago">Mercado Pago (Pix + Cartão)</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="asaas">Asaas (Boleto/Pix)</SelectItem>
                      <SelectItem value="manual">Modo Manual / Sandbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Chave Pública / Public Key
                  </label>
                  <Input
                    placeholder="APP_USR-..."
                    value={configs.PAYMENT_PUBLIC_KEY || ''}
                    onChange={(e) =>
                      setConfigs({ ...configs, PAYMENT_PUBLIC_KEY: e.target.value })
                    }
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Access Token / Secret Key
                  </label>
                  <Input
                    type="password"
                    placeholder="APP_USR-..."
                    value={configs.PAYMENT_SECRET_KEY || ''}
                    onChange={(e) =>
                      setConfigs({ ...configs, PAYMENT_SECRET_KEY: e.target.value })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={savingConfig}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {savingConfig ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Salvar Configurações de Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parâmetros do Sistema</CardTitle>
              <CardDescription>
                Ajuste opções globais de limite e inteligência artificial.
              </CardDescription>
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
                  <p className="text-[11px] text-slate-500">
                    Cole sua chave da Moonshot AI (Kimi K3), OpenAI, DeepSeek ou outro provedor compatível.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Modelo Principal de IA (Model)
                  </label>
                  <Input
                    placeholder="kimi-k3"
                    value={configs.KIMI_MODEL || 'kimi-k3'}
                    onChange={(e) => setConfigs({ ...configs, KIMI_MODEL: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    URL Base da API (Base URL)
                  </label>
                  <Input
                    placeholder="https://api.moonshot.ai/v1"
                    value={configs.LLM_BASE_URL || 'https://api.moonshot.ai/v1'}
                    onChange={(e) => setConfigs({ ...configs, LLM_BASE_URL: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Limite de Análises Free Por Usuário
                  </label>
                  <Input
                    type="number"
                    value={configs.FREE_ANALYSIS_LIMIT || '1'}
                    onChange={(e) =>
                      setConfigs({ ...configs, FREE_ANALYSIS_LIMIT: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={savingConfig}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {savingConfig ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
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
