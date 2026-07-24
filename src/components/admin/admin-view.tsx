'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield, Users, CreditCard, Cpu, Search, Loader2, Save, RefreshCw, Activity,
  BarChart3, Zap, DollarSign, TrendingUp, Percent, Trash2, Power, Plus, Key, CheckCircle2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  plan: string
  credits?: number
  disabled?: boolean
  createdAt: string
  _count: { resumes: number; subscriptions: number }
}

interface AiApiKeyItem {
  id: string
  name: string
  provider: string
  maskedKey: string
  baseUrl?: string | null
  model: string
  status: 'active' | 'paused'
  createdAt: string
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
  const [aiKeys, setAiKeys] = useState<AiApiKeyItem[]>([])
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

  // Selection for bulk user management
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  // New API Key form state
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('moonshot')
  const [newKeyApiKey, setNewKeyApiKey] = useState('')
  const [newKeyModel, setNewKeyModel] = useState('kimi-k3')
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState('')
  const [addingKey, setAddingKey] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [uRes, mRes, cRes, aiRes, keysRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/ai-metrics'),
        fetch('/api/admin/ai-keys'),
      ])

      const [uData, mData, cData, aiData, keysData] = await Promise.all([
        uRes.json().catch(() => ({})),
        mRes.json().catch(() => ({})),
        cRes.json().catch(() => ({})),
        aiRes.json().catch(() => ({})),
        keysRes.json().catch(() => ({})),
      ])

      if (uData.users) setUsers(uData.users)
      if (mData.metrics) setMetrics(mData.metrics)
      if (cData.config) setConfigs((prev) => ({ ...prev, ...cData.config }))
      if (aiData.costs) setAiMetrics(aiData)
      if (keysData.keys) setAiKeys(keysData.keys)
    } catch (e) {
      toast.error('Erro ao carregar dados administrativos')
    } finally {
      setLoading(false)
    }
  }

  // Auto set model preset on provider change
  const handleProviderChange = (provider: string) => {
    setNewKeyProvider(provider)
    if (provider === 'moonshot') setNewKeyModel('kimi-k3')
    else if (provider === 'anthropic') setNewKeyModel('claude-3-5-sonnet')
    else if (provider === 'deepseek') setNewKeyModel('deepseek-chat')
    else if (provider === 'gemini') setNewKeyModel('gemini-1.5-flash')
  }

  // Register a new AI API Key
  const handleAddAiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName || !newKeyApiKey || !newKeyModel) {
      toast.error('Preencha nome, chave de API e modelo.')
      return
    }
    setAddingKey(true)
    try {
      const r = await fetch('/api/admin/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          provider: newKeyProvider,
          apiKey: newKeyApiKey,
          model: newKeyModel,
          baseUrl: newKeyBaseUrl || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao cadastrar chave')
        return
      }
      toast.success(data.message || 'Chave de API cadastrada com sucesso!')
      setNewKeyName('')
      setNewKeyApiKey('')
      setNewKeyBaseUrl('')
      // Reload AI Keys
      const keysRes = await fetch('/api/admin/ai-keys')
      const keysData = await keysRes.json()
      if (keysData.keys) setAiKeys(keysData.keys)
    } catch {
      toast.error('Falha de conexão ao cadastrar chave')
    } finally {
      setAddingKey(false)
    }
  }

  // Toggle API Key status (active / paused)
  const handleToggleAiKey = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const r = await fetch('/api/admin/ai-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao alterar status')
        return
      }
      toast.success(data.message || 'Status alterado com sucesso')
      setAiKeys(aiKeys.map((k) => (k.id === id ? { ...k, status: nextStatus } : k)))
    } catch {
      toast.error('Falha de conexão')
    }
  }

  // Delete API Key
  const handleDeleteAiKey = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a chave de API "${name}"?`)) return
    try {
      const r = await fetch(`/api/admin/ai-keys?id=${id}`, { method: 'DELETE' })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao deletar chave')
        return
      }
      toast.success(data.message || 'Chave deletada com sucesso!')
      setAiKeys(aiKeys.filter((k) => k.id !== id))
    } catch {
      toast.error('Falha de conexão')
    }
  }

  // User Management Actions
  const updateUser = async (userId: string, updates: { role?: string; plan?: string; credits?: number; disabled?: boolean }) => {
    try {
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao atualizar usuário')
        return
      }
      toast.success(data.message || 'Usuário atualizado com sucesso!')
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...data.user } : u)))
    } catch {
      toast.error('Falha ao conectar com o servidor')
    }
  }

  // Toggle user status (Enable / Disable)
  const handleToggleUserStatus = async (user: AdminUser) => {
    if (user.role === 'admin') {
      toast.error('O perfil de Administrador Mestre não pode ser desabilitado.')
      return
    }
    const nextDisabled = !user.disabled
    await updateUser(user.id, { disabled: nextDisabled })
  }

  // Delete single user
  const handleDeleteUser = async (user: AdminUser) => {
    if (user.role === 'admin') {
      toast.error('O perfil de Administrador NUNCA pode ser deletado.')
      return
    }
    if (!confirm(`Deseja realmente deletar o usuário "${user.name || user.email}"? Esta ação não pode ser desfeita.`)) return
    try {
      const r = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [user.id] }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao deletar usuário')
        return
      }
      toast.success(data.message || 'Usuário deletado com sucesso!')
      setUsers(users.filter((u) => u.id !== user.id))
      setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
    } catch {
      toast.error('Falha de conexão')
    }
  }

  // Bulk actions on selected users
  const handleBulkAction = async (action: 'enable' | 'disable' | 'delete') => {
    if (selectedUserIds.length === 0) {
      toast.error('Selecione ao menos um usuário.')
      return
    }

    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id))
    const hasAdmin = selectedUsers.some((u) => u.role === 'admin')
    if (hasAdmin && (action === 'delete' || action === 'disable')) {
      toast.error('A seleção contém o Administrador Mestre, que NUNCA pode ser desabilitado ou deletado.')
      return
    }

    if (action === 'delete' && !confirm(`Tem certeza que deseja deletar os ${selectedUserIds.length} usuários selecionados?`)) {
      return
    }

    setActionLoading(true)
    try {
      if (action === 'delete') {
        const r = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUserIds }),
        })
        const data = await r.json()
        if (!r.ok) {
          toast.error(data.error || 'Erro ao deletar usuários')
          return
        }
        toast.success(data.message || 'Usuários deletados com sucesso!')
        setUsers(users.filter((u) => !selectedUserIds.includes(u.id)))
        setSelectedUserIds([])
      } else {
        const nextDisabled = action === 'disable'
        await Promise.all(
          selectedUserIds.map((id) =>
            fetch('/api/admin/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: id, disabled: nextDisabled }),
            })
          )
        )
        toast.success(`Usuários ${action === 'disable' ? 'desabilitados' : 'habilitados'} com sucesso!`)
        setUsers(users.map((u) => (selectedUserIds.includes(u.id) && u.role !== 'admin' ? { ...u, disabled: nextDisabled } : u)))
      }
    } catch {
      toast.error('Erro de conexão ao processar ação em lote')
    } finally {
      setActionLoading(false)
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
        await loadData()
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

  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter((u) => u.role !== 'admin')
    if (selectedUserIds.length === selectableUsers.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id))
    }
  }

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((i) => i !== id))
    } else {
      setSelectedUserIds([...selectedUserIds, id])
    }
  }

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
            <Shield className="w-6 h-6 text-violet-600" /> Painel Administrativo Mestre
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerenciador completo de usuários, cadastro de APIs de IA, roteamento e métricas financeiras.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar Dados
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Usuários Registrados</p>
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
                <p className="text-[10px] text-slate-400">Free ➔ Comprador</p>
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

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-4 h-4" /> Gestão de Usuários
          </TabsTrigger>
          <TabsTrigger value="ai-keys" className="gap-1.5">
            <Key className="w-4 h-4" /> Cadastrar APIs de IA (4 IAs)
          </TabsTrigger>
          <TabsTrigger value="credits-finance" className="gap-1.5">
            <Zap className="w-4 h-4" /> Monetização & Créditos
          </TabsTrigger>
          <TabsTrigger value="ai-router" className="gap-1.5">
            <Cpu className="w-4 h-4" /> Telemetria de IA
          </TabsTrigger>
        </TabsList>

        {/* USERS TAB - WITH SELECTION & ACTIONS */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Controle Geral de Usuários e Permissões
                  </CardTitle>
                  <CardDescription>
                    Habilite, desabilite ou remova usuários individualmente ou por seleção em lote. (Perfil Admin protegido).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome/email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-9 w-44 sm:w-56"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="h-9 text-xs w-28">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Planos</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="carreira">Carreira</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* BULK ACTION BAR */}
              {selectedUserIds.length > 0 && (
                <div className="mt-3 p-2.5 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                  <span className="font-semibold text-violet-900">
                    {selectedUserIds.length} usuário(s) selecionado(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('enable')}
                      disabled={actionLoading}
                      className="h-7 text-xs bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Habilitar Selecionados
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('disable')}
                      disabled={actionLoading}
                      className="h-7 text-xs bg-white text-amber-700 hover:bg-amber-50 border-amber-300"
                    >
                      <Power className="w-3.5 h-3.5 mr-1" /> Desabilitar Selecionados
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction('delete')}
                      disabled={actionLoading}
                      className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Deletar Selecionados
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={
                            filteredUsers.filter((u) => u.role !== 'admin').length > 0 &&
                            selectedUserIds.length === filteredUsers.filter((u) => u.role !== 'admin').length
                          }
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                      </th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Função (Role)</th>
                      <th className="px-4 py-3">Pacote</th>
                      <th className="px-4 py-3">Créditos</th>
                      <th className="px-4 py-3 text-right">Ações Individuais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isAdmin = u.role === 'admin'
                      const isSelected = selectedUserIds.includes(u.id)
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            u.disabled ? 'bg-amber-50/30 text-slate-400' : ''
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            {!isAdmin ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectUser(u.id)}
                                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                              />
                            ) : (
                              <Shield className="w-4 h-4 text-violet-600 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.name || 'Sem nome'}
                              {isAdmin && (
                                <Badge className="bg-violet-100 text-violet-800 border-none text-[9px] px-1.5 py-0 font-extrabold">
                                  ADMIN MESTRE
                                </Badge>
                              )}
                            </p>
                            <p className="text-slate-500 text-[11px]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            {u.disabled ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] font-bold">
                                Desabilitado
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
                                Ativo
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <span className="font-bold text-violet-700">Administrador</span>
                            ) : (
                              <Select
                                value={u.role || 'user'}
                                onValueChange={(v) => updateUser(u.id, { role: v })}
                              >
                                <SelectTrigger className="h-7 text-[11px] w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={u.plan || 'free'}
                              onValueChange={(v) => updateUser(u.id, { plan: v })}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free (0 cr)</SelectItem>
                                <SelectItem value="entrada">Entrada (40 cr)</SelectItem>
                                <SelectItem value="starter">Starter (100 cr)</SelectItem>
                                <SelectItem value="carreira">Carreira (500 cr)</SelectItem>
                                <SelectItem value="profissional">Profissional (1.500 cr)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            {isAdmin ? (
                              <span className="text-violet-700">♾️ Ilimitado</span>
                            ) : (
                              <span className="text-emerald-700">{u.credits ?? 0} cr</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isAdmin ? (
                              <span className="text-[10px] font-bold text-violet-600 italic">
                                Protegido (Imutável)
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`h-7 text-[11px] px-2 ${
                                    u.disabled
                                      ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                      : 'text-amber-700 border-amber-300 hover:bg-amber-50'
                                  }`}
                                >
                                  <Power className="w-3 h-3 mr-1" />
                                  {u.disabled ? 'Habilitar' : 'Desabilitar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(u)}
                                  className="h-7 text-[11px] px-2 bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Deletar
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI KEYS MANAGER TAB (4 IAs) */}
        <TabsContent value="ai-keys" className="space-y-6">
          {/* REGISTER NEW API KEY FORM */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Cadastrar Nova API de Inteligência Artificial
              </CardTitle>
              <CardDescription>
                Cadastre e configure as chaves de API para os 4 provedores de IA (Kimi K3, Claude 3.5 Sonnet, DeepSeek V3 e Gemini).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAiKey} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nome / Identificação</label>
                    <Input
                      placeholder="Ex: Kimi K3 Produção"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Provedor da IA</label>
                    <Select value={newKeyProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moonshot">Moonshot AI (Kimi K3)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude 3.5)</SelectItem>
                        <SelectItem value="deepseek">DeepSeek (DeepSeek V3)</SelectItem>
                        <SelectItem value="gemini">Google (Gemini 1.5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Modelo Alvo (Model)</label>
                    <Input
                      placeholder="kimi-k3"
                      value={newKeyModel}
                      onChange={(e) => setNewKeyModel(e.target.value)}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Chave Secreta (API Key)</label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={newKeyApiKey}
                      onChange={(e) => setNewKeyApiKey(e.target.value)}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Base URL Personalizada (Opcional)</label>
                    <Input
                      placeholder="https://api.moonshot.ai/v1"
                      value={newKeyBaseUrl}
                      onChange={(e) => setNewKeyBaseUrl(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button type="submit" disabled={addingKey} className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs font-bold">
                      {addingKey ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                      Salvar e Registrar API
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* LIST REGISTERED API KEYS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-600" /> APIs de IA Cadastradas no Sistema ({aiKeys.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as chaves salvas com controle de status (Ativar/Pausar) e opção de exclusão.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Identificação</th>
                      <th className="px-4 py-3">Provedor</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Chave Mascarada</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações de Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiKeys.length > 0 ? (
                      aiKeys.map((key) => (
                        <tr key={key.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{key.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="uppercase text-[10px] font-bold border-slate-300">
                              {key.provider}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{key.model}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{key.maskedKey}</td>
                          <td className="px-4 py-3">
                            {key.status === 'active' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                                ATIVA
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
                                PAUSADA
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAiKey(key.id, key.status)}
                              className={`h-7 text-[11px] px-2.5 ${
                                key.status === 'active'
                                  ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                                  : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-3 h-3 mr-1" />
                              {key.status === 'active' ? 'Pausar' : 'Ativar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAiKey(key.id, key.name)}
                              className="h-7 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Deletar
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          Nenhuma chave de API de IA cadastrada manualmente ainda. Cadastre acima para registrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDITS FINANCE TAB */}
        <TabsContent value="credits-finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Métricas de Usuários & Conversão
                </CardTitle>
                <CardDescription>Acompanhamento de usuários gratuitos versus compradores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Usuários Gratuitos (Griffo Free)</span>
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
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Margem Calculada</label>
                  <Input
                    readOnly
                    value={`${baselineMarginPercent}%`}
                    className="text-xs font-mono bg-slate-50 font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div className="pt-6 pb-2">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 mb-4">Integração Lemon Squeezy (Modo Teste)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Lemon Squeezy API Key</label>
                    <Input
                      type="password"
                      placeholder="Ex: eyJhbGciOiJKV1..."
                      value={configs.LEMON_API_KEY || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_API_KEY: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Lemon Squeezy Webhook Secret</label>
                    <Input
                      type="password"
                      placeholder="Ex: segredo_super_seguro"
                      value={configs.LEMON_WEBHOOK_SECRET || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_WEBHOOK_SECRET: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Store ID</label>
                    <Input
                      placeholder="Ex: 12345"
                      value={configs.LEMON_STORE_ID || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_STORE_ID: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Variant ID (Plano de Entrada)</label>
                    <Input
                      placeholder="Ex: 67890"
                      value={configs.LEMON_VARIANT_ENTRADA || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_VARIANT_ENTRADA: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Variant ID (Starter)</label>
                    <Input
                      placeholder="Ex: 67891"
                      value={configs.LEMON_VARIANT_STARTER || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_VARIANT_STARTER: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Variant ID (Carreira)</label>
                    <Input
                      placeholder="Ex: 67892"
                      value={configs.LEMON_VARIANT_CARREIRA || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_VARIANT_CARREIRA: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Variant ID (Profissional)</label>
                    <Input
                      placeholder="Ex: 67893"
                      value={configs.LEMON_VARIANT_PROFISSIONAL || ''}
                      onChange={(e) => setConfigs({ ...configs, LEMON_VARIANT_PROFISSIONAL: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
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

          {/* LIST / TABLE OF REGISTERED LEMON SQUEEZY PARAMETERS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" /> Parâmetros e Credenciais de Pagamento Registrados ({[
                  configs.LEMON_API_KEY,
                  configs.LEMON_WEBHOOK_SECRET,
                  configs.LEMON_STORE_ID,
                  configs.LEMON_VARIANT_ENTRADA,
                  configs.LEMON_VARIANT_STARTER,
                  configs.LEMON_VARIANT_CARREIRA,
                  configs.LEMON_VARIANT_PROFISSIONAL,
                ].filter(Boolean).length} / 7)
              </CardTitle>
              <CardDescription>
                Lista completa das chaves de API, webhook e Variant IDs ativas no sistema GriffoWork.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Parâmetro / Recurso</th>
                      <th className="px-4 py-3">Valor Registrado</th>
                      <th className="px-4 py-3">Status no Sistema</th>
                      <th className="px-4 py-3 text-right">Escopo / Função</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Lemon Squeezy API Key</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {configs.LEMON_API_KEY ? `${configs.LEMON_API_KEY.slice(0, 10)}••••••••` : 'Não Cadastrada'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_API_KEY ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            CADASTRADA & ATIVA
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">SDK / Checkout API</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Webhook Secret</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {configs.LEMON_WEBHOOK_SECRET ? `${configs.LEMON_WEBHOOK_SECRET.slice(0, 6)}••••••••` : 'Não Cadastrado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_WEBHOOK_SECRET ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            CADASTRADO & ATIVO
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">HMAC SHA256 Signature</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Store ID (ID da Loja)</td>
                      <td className="px-4 py-3 font-mono text-slate-800 font-bold">
                        {configs.LEMON_STORE_ID || 'Não Cadastrado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_STORE_ID ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            LOJA VINCULADA
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">Checkout Store</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Plano de Entrada (R$ 9,90)</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {configs.LEMON_VARIANT_ENTRADA ? `Variant ID: ${configs.LEMON_VARIANT_ENTRADA}` : 'Não Configurado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_VARIANT_ENTRADA ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            PRONTO PARA VENDA
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">40 Créditos (30+10)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Pacote Starter (R$ 29,90)</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {configs.LEMON_VARIANT_STARTER ? `Variant ID: ${configs.LEMON_VARIANT_STARTER}` : 'Não Configurado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_VARIANT_STARTER ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            PRONTO PARA VENDA
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">100 Créditos</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Pacote Carreira (R$ 99,90)</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {configs.LEMON_VARIANT_CARREIRA ? `Variant ID: ${configs.LEMON_VARIANT_CARREIRA}` : 'Não Configurado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_VARIANT_CARREIRA ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            PRONTO PARA VENDA
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">500 Créditos</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Pacote Profissional (R$ 249,90)</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {configs.LEMON_VARIANT_PROFISSIONAL ? `Variant ID: ${configs.LEMON_VARIANT_PROFISSIONAL}` : 'Não Configurado'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.LEMON_VARIANT_PROFISSIONAL ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            PRONTO PARA VENDA
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">1.500 Créditos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI TELEMETRY TAB */}
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
      </Tabs>
    </div>
  )
}
