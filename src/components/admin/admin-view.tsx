'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield, Users, CreditCard, Cpu, Search, Loader2, Save, RefreshCw, Activity,
  BarChart3, Zap, DollarSign, TrendingUp, Percent, Trash2, Power, Plus, Key, CheckCircle2, AlertCircle, ShoppingBag, Sparkles, Award, UserPlus, Minus,
  Radar as RadarIcon
} from 'lucide-react'
import { RadarQuotas } from './radar-quotas'
import { toast } from 'sonner'
import { slowModelWarning } from '@/lib/model-warnings'
import {
  ANALYSIS_DIRECT_COST_USD,
  ANALYSIS_FLOOR_USD,
  TIERS,
  priceFor,
} from '@/lib/pricing/catalog'
import { internalFetch } from '@/lib/internal-fetch';

/**
 * O servidor devolve os segredos mascarados (`sk_l••••••••1234`). O campo fica
 * vazio quando o que chegou é máscara, e a máscara vira placeholder: assim o
 * administrador vê que a chave está cadastrada sem ela sair do servidor, e só
 * digita algo quando quiser mesmo substituí-la. Reenviar a máscara é inócuo —
 * `POST /api/admin/settings` ignora valores mascarados.
 */
function isMasked(value?: string): boolean {
  return !!value && value.includes('•')
}

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AdminErrorBoundary] Capturado erro fatal no AdminView:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto my-10 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 border-b border-rose-200 pb-3">
            <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-lg font-extrabold">Erro ao renderizar Área Admin</h2>
              <p className="text-xs text-rose-700">O sistema capturou uma exceção durante o processamento do painel.</p>
            </div>
          </div>
          <div className="bg-rose-950 text-rose-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
            <p className="font-bold text-amber-300">{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Erro desconhecido'}</p>
            <pre className="mt-2 text-[10px] opacity-80 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="bg-white hover:bg-rose-100 text-rose-900 border-rose-300">
              <RefreshCw className="w-4 h-4 mr-2" /> Recarregar Página
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  plan: string
  analysisBalance?: number
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
  /** O que a API recebe de fato. Difere de `model` quando o ID configurado saiu de linha. */
  effectiveModel?: string
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
    /// Receita em dólar: é a moeda base do catálogo, e a única em que somar
    /// vendas de países diferentes significa alguma coisa.
    totalRevenueUsd: number
    purchaseCount: number
    estimatedProfitUsd: number
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

interface OperationalFailure {
  id: string
  createdAt: string
  taskType: string
  primaryModel: string
  provider: string
  status: string
  failoverCount: number
  errorMessage: string | null
  userId?: string | null
  userEmail?: string | null
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
    totalErrors?: number
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
  operationalFailures?: OperationalFailure[]
}

export function AdminView() {
  return (
    <AdminErrorBoundary>
      <AdminViewContent />
    </AdminErrorBoundary>
  )
}

function AdminViewContent() {
  const { user, hydrated } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [aiKeys, setAiKeys] = useState<AiApiKeyItem[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [aiMetrics, setAiMetrics] = useState<AiMetricsData | null>(null)
  // `CREDIT_PRICE_BRL` saiu: preço não é mais parâmetro editável no painel. O
  // catálogo é o ponto único de verdade, e um campo aqui seria um segundo.
  const [configs, setConfigs] = useState<Record<string, string>>({
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
  const [newKeyModel, setNewKeyModel] = useState('kimi-k3')
  const [newKeyApiKey, setNewKeyApiKey] = useState('')
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState('')
  const [addingKey, setAddingKey] = useState(false)

  // AI Diagnostic Test state
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResults, setAiTestResults] = useState<Record<string, any> | null>(null)

  const runAiTest = async () => {
    setTestingAi(true)
    try {
      const res = await internalFetch('/api/admin/ai-test', { cache: 'no-store' })
      const data = await res.json()
      if (data.results) {
        setAiTestResults(data.results)
        toast.success('Diagnóstico das IAs concluído com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao executar teste de IAs.')
      }
    } catch {
      toast.error('Falha de conexão ao testar IAs.')
    } finally {
      setTestingAi(false)
    }
  }

  const loadData = async (isInitial = false) => {
    console.log('[AdminView:Step2] Iniciando carga de dados -> /api/admin/dashboard (isInitial:', isInitial, ')')
    if (isInitial) setLoading(true)
    try {
      const res = await internalFetch('/api/admin/dashboard', { cache: 'no-store' })
      console.log('[AdminView:Step2] Retorno HTTP status:', res.status)
      const data = await res.json().catch((err) => {
        console.error('[AdminView:Erro] Falha ao processar JSON da API:', err)
        return {}
      })

      console.log('[AdminView:Step3] Dados recebidos com sucesso:', {
        hasUsers: !!data.users,
        usersCount: data.users?.length,
        hasMetrics: !!data.metrics,
        hasAiMetrics: !!data.aiMetrics,
        hasConfig: !!data.config
      })

      if (data.error) {
        console.error('[AdminView:Erro] API retornou erro:', data.error)
        toast.error(data.error)
        return
      }

      if (data.users) setUsers(data.users)
      if (data.metrics) setMetrics(data.metrics)
      if (data.config) {
        setConfigs((prev) => ({
          ...prev,
          ...data.config,
        }))
      }
      if (data.aiMetrics) setAiMetrics(data.aiMetrics)
      if (data.keys) setAiKeys(data.keys)
    } catch (e) {
      console.error('[AdminView:Erro] Exceção em loadData:', e)
      toast.error('Erro ao carregar dados administrativos')
    } finally {
      if (isInitial) setLoading(false)
      console.log('[AdminView:Step3] Carga finalizada (loading = false)')
    }
  }

  useEffect(() => {
    console.log('[AdminView:Step1] useEffect verificado -> hydrated:', hydrated, '| user role:', user?.role)
    if (hydrated && user?.role === 'admin') {
      loadData(true)
    }
  }, [hydrated, user?.role])


  // Auto set model preset on provider change
  const handleProviderChange = (provider: string) => {
    setNewKeyProvider(provider)
    if (provider === 'moonshot') setNewKeyModel('kimi-k3')
    else if (provider === 'anthropic') setNewKeyModel('claude-sonnet-5')
    else if (provider === 'deepseek') setNewKeyModel('deepseek-v4-flash')
    else if (provider === 'gemini') setNewKeyModel('gemini-2.0-flash')
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
      const r = await internalFetch('/api/admin/ai-keys', {
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
      const keysRes = await internalFetch('/api/admin/ai-keys')
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
      const r = await internalFetch('/api/admin/ai-keys', {
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
      const r = await internalFetch(`/api/admin/ai-keys?id=${id}`, { method: 'DELETE' })
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
  // Criação de conta pelo administrador. Existe para os casos em que a pessoa
  // não passa pelo cadastro público: cortesia, suporte, conta de teste.
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    analysisBalance: 0,
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const createUser = async () => {
    setCreatingUser(true)
    try {
      const r = await internalFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao criar usuário.')
        return
      }
      toast.success(data.message || 'Usuário criado.')
      setCreateOpen(false)
      setNewUser({ email: '', name: '', password: '', role: 'user', analysisBalance: 0 })
      await loadData()
    } catch {
      toast.error('Falha ao conectar com o servidor.')
    } finally {
      setCreatingUser(false)
    }
  }

  const updateUser = async (
    userId: string,
    updates: { role?: string; analysisBalance?: number; analysisDelta?: number; disabled?: boolean }
  ) => {
    try {
      const r = await internalFetch('/api/admin/users', {
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
      const r = await internalFetch('/api/admin/users', {
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
        const r = await internalFetch('/api/admin/users', {
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
            internalFetch('/api/admin/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: id, disabled: nextDisabled })
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
      const r = await internalFetch('/api/admin/settings', {
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

  const [syncingLemon, setSyncingLemon] = useState(false)
  const [syncedLemonDetails, setSyncedLemonDetails] = useState<{ storeId?: string; count?: number; list?: string[] } | null>(null)

  const handleSyncLemonSqueezy = async () => {
    if (!configs.LEMON_API_KEY) {
      toast.error('Insira a Lemon Squeezy API Key antes de sincronizar.')
      return
    }
    setSyncingLemon(true)
    try {
      const r = await internalFetch('/api/admin/lemonsqueezy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: configs.LEMON_API_KEY,
          webhookSecret: configs.LEMON_WEBHOOK_SECRET,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao sincronizar com Lemon Squeezy.')
        return
      }
      toast.success(data.message || 'Sincronização realizada com sucesso!')
      if (data.updates) {
        setConfigs((prev) => ({ ...prev, ...data.updates }))
      }
      if (data.variantsFoundList) {
        setSyncedLemonDetails({
          storeId: data.storeId,
          count: data.variantsFoundCount,
          list: data.variantsFoundList,
        })
      }
      await loadData()
    } catch {
      toast.error('Falha de conexão durante a sincronização.')
    } finally {
      setSyncingLemon(false)
    }
  }

  const safeUsers = Array.isArray(users) ? users : []
  const safeSearch = (search || '').toLowerCase()

  const filteredUsers = safeUsers.filter((u) => {
    if (!u) return false
    const nameMatch = u.name ? u.name.toLowerCase().includes(safeSearch) : false
    const emailMatch = u.email ? u.email.toLowerCase().includes(safeSearch) : false
    const matchesSearch = !safeSearch || nameMatch || emailMatch
    const matchesPlan = planFilter === 'all' || u.plan === planFilter
    return matchesSearch && matchesPlan
  })

  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter((u) => u && u.role !== 'admin')
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

  // Monetização — tudo em dólar, a moeda base do catálogo.
  const totalRevenueUsd = metrics?.financial?.totalRevenueUsd || 0
  const purchaseCount = metrics?.financial?.purchaseCount || 0
  const purchasingUsersCount = safeUsers.filter((u) => u && (u.analysisBalance ?? 0) > 0).length
  const freeUsersCount = Math.max(0, safeUsers.length - purchasingUsersCount)
  const conversionRate = safeUsers.length > 0 ? (purchasingUsersCount / safeUsers.length) * 100 : 0
  const avgOrderUsd = purchaseCount > 0 ? totalRevenueUsd / purchaseCount : 0

  const aiAvgCostBrl = parseFloat(configs?.AI_AVG_COST_BRL || '0.05') || 0.05
  // Margem sobre o preço, não sobre o custo: é assim que a planilha do modelo
  // calcula, e comparar as duas contas como se fossem a mesma inflaria o
  // número por um fator de dez.
  const marginPercent =
    avgOrderUsd > 0
      ? Math.round(((avgOrderUsd - ANALYSIS_DIRECT_COST_USD) / avgOrderUsd) * 100)
      : 0

  if (loading) {
    console.log('[AdminView:Render] Modo Loading em exibição...')
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  console.log('[AdminView:Step4] Renderizando interface final (sem erro)')

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
        <Button variant="outline" size="sm" onClick={() => loadData()}>
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
                <p className="text-2xl font-bold text-slate-900">US$ {totalRevenueUsd.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">Ticket Médio: US$ {avgOrderUsd.toFixed(2)}</p>
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
                <p className="text-xs font-medium text-slate-500">Margem por Análise</p>
                <p className="text-2xl font-bold text-slate-900">{marginPercent}%</p>
                <p className="text-[10px] text-slate-400">
                  Custo direto US$ {ANALYSIS_DIRECT_COST_USD.toFixed(2)} / Piso US$ {ANALYSIS_FLOOR_USD.toFixed(2)}
                </p>
              </div>
              <Percent className="w-8 h-8 text-violet-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-transparent p-0 w-full mb-8 h-auto">
          <TabsTrigger value="users" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Users className="w-5 h-5 text-blue-600" /> <span className="font-semibold text-sm">Gestão de Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="ai-keys" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Key className="w-5 h-5 text-indigo-600" /> <span className="font-semibold text-sm">Cadastrar APIs de IA (4 IAs)</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Zap className="w-5 h-5 text-yellow-600" /> <span className="font-semibold text-sm">Monetização & Preços</span>
          </TabsTrigger>
          <TabsTrigger value="ai-router" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Cpu className="w-5 h-5 text-slate-600" /> <span className="font-semibold text-sm">Telemetria de IA</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" /> <span className="font-semibold text-sm">Central de Agentes & Incidentes</span>
          </TabsTrigger>
          <TabsTrigger value="director" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Award className="w-5 h-5 text-violet-600" /> <span className="font-semibold text-sm">👑 Coordenador Mestre 24h</span>
          </TabsTrigger>
          <TabsTrigger value="radar" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <RadarIcon className="w-5 h-5 text-indigo-600" /> <span className="font-semibold text-sm">Radar e Cotas</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="h-14 flex justify-start px-4 border bg-white shadow-sm data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 transition-all gap-3">
            <Activity className="w-5 h-5 text-emerald-600" /> <span className="font-semibold text-sm">Saúde do Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Cota das APIs e saúde das fontes. Fica numa aba própria porque a
            pergunta que ela responde — "por que apareceu menos vaga hoje?" —
            não é a mesma que as outras abas respondem. */}
        <TabsContent value="radar" className="space-y-4">
          <RadarQuotas />
        </TabsContent>

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
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold">
                        <UserPlus className="w-4 h-4 mr-1.5" /> Novo usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Criar conta</DialogTitle>
                        <DialogDescription className="text-xs">
                          A conta é criada já ativa. A senha definida aqui é a que a pessoa usará
                          para entrar — combine com ela por um canal seguro.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Nome</Label>
                          <Input
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="Maria Silva"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">E-mail</Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="maria@exemplo.com"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Senha (mínimo 8 caracteres)</Label>
                          <Input
                            type="text"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="senha-inicial"
                            className="text-sm font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Perfil</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Análises iniciais</Label>
                            <Input
                              type="number"
                              min={0}
                              value={newUser.analysisBalance}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  analysisBalance: Math.max(0, parseInt(e.target.value, 10) || 0),
                                })
                              }
                              className="text-sm font-mono"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={createUser}
                          disabled={creatingUser || !newUser.email || !newUser.name || newUser.password.length < 8}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold w-full"
                        >
                          {creatingUser ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-1.5" />
                          )}
                          Criar conta
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="free">Sem compra</SelectItem>
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
                      <th className="px-4 py-3">Análises</th>
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
                          <td className="px-4 py-3 font-mono font-bold">
                            {isAdmin ? (
                              <span className="text-violet-700">♾️ Ilimitado</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {/* Crédito e redução usam `analysisDelta`, que
                                    é incremento no banco: não perde a análise
                                    que o usuário gastou entre o carregamento
                                    da tela e o clique. O campo ao lado atribui
                                    um valor absoluto, para corrigir um saldo
                                    errado. Os dois geram linha no ledger. */}
                                <Button
                                  size="icon"
                                  variant="outline"
                                  title="Reduzir uma análise"
                                  disabled={(u.analysisBalance ?? 0) <= 0}
                                  onClick={() => updateUser(u.id, { analysisDelta: -1 })}
                                  className="h-7 w-7 border-slate-300 shrink-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min={0}
                                  defaultValue={u.analysisBalance ?? 0}
                                  key={`balance-${u.id}-${u.analysisBalance}`}
                                  title="Definir o saldo exato"
                                  className="h-7 w-16 text-[11px] font-mono font-bold px-2 border-slate-300 focus:border-emerald-500"
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10)
                                    if (!isNaN(val) && val >= 0 && val !== u.analysisBalance) {
                                      updateUser(u.id, { analysisBalance: val })
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt((e.target as HTMLInputElement).value, 10)
                                      if (!isNaN(val) && val >= 0 && val !== u.analysisBalance) {
                                        updateUser(u.id, { analysisBalance: val })
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  title="Creditar uma análise"
                                  onClick={() => updateUser(u.id, { analysisDelta: 1 })}
                                  className="h-7 w-7 border-slate-300 shrink-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
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
                        <SelectItem value="anthropic">Anthropic (Claude Sonnet 5)</SelectItem>
                        <SelectItem value="deepseek">DeepSeek (DeepSeek V3)</SelectItem>
                        <SelectItem value="gemini">Google (Gemini 2.0 Flash)</SelectItem>
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
                    {/* A consequência aparece durante a escolha, não depois,
                        como falha operacional sem causa aparente. */}
                    {slowModelWarning(newKeyModel) && (
                      <p className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-900">
                        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>{slowModelWarning(newKeyModel)}</span>
                      </p>
                    )}
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
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-5 h-5 text-violet-600" /> APIs de IA Cadastradas no Sistema ({aiKeys.length})
                </CardTitle>
                <CardDescription>
                  Lista de todas as chaves salvas com controle de status (Ativar/Pausar) e opção de exclusão.
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={runAiTest}
                disabled={testingAi}
                className="border-violet-300 text-violet-700 hover:bg-violet-50 font-bold shrink-0 shadow-sm"
              >
                {testingAi ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Diagnóstico de Conexão com IAs
              </Button>
            </CardHeader>

            {/* DIAGNOSTIC RESULTS PANEL */}
            {aiTestResults && (
              <div className="p-4 bg-slate-900 text-slate-100 border-y border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Relatório do Diagnóstico de Conexão:
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAiTestResults(null)}
                    className="h-6 text-[10px] text-slate-400 hover:text-white"
                  >
                    Fechar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(aiTestResults).map(([pId, res]: [string, any]) => (
                    <div
                      key={pId}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        res.status === 'SUCCESS'
                          ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="uppercase tracking-wider">{pId}</span>
                        {res.status === 'SUCCESS' ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            SUCCESS ({res.latencyMs}ms)
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-600 text-white text-[10px]">
                            FAILED (HTTP {res.httpCode || 'ERR'})
                          </Badge>
                        )}
                      </div>
                      {res.status === 'SUCCESS' ? (
                        <p className="text-[11px] text-emerald-300">Resposta: "{res.response}"</p>
                      ) : (
                        <p className="text-[11px] text-rose-300 break-all font-sans">
                          {res.errorMessage || res.error?.message || JSON.stringify(res.errorDetails || res.error || 'Falha')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                          {/* O ponto mais importante: a chave problemática já
                              está salva. Um aviso só no formulário de criação
                              nunca seria visto por quem já configurou. */}
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">
                            <span className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5">
                                {key.model}
                                {slowModelWarning(key.effectiveModel || key.model) && (
                                  <span
                                    title={slowModelWarning(key.effectiveModel || key.model) || ''}
                                    className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-800"
                                  >
                                    <AlertCircle className="h-3 w-3" /> LENTO
                                  </span>
                                )}
                              </span>
                              {/* O painel mostrava um modelo e a API recebia
                                  outro. Quem investigasse latência ou custo
                                  raciocinava sobre um modelo que nunca rodou. */}
                              {key.effectiveModel && key.effectiveModel !== key.model && (
                                <span
                                  title={`O ID "${key.model}" não está na lista de modelos correntes e foi substituído. Edite a chave para usar um ID válido.`}
                                  className="inline-flex w-fit items-center gap-1 rounded border border-rose-300 bg-rose-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-rose-800"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  EM USO: {key.effectiveModel}
                                </span>
                              )}
                            </span>
                          </td>
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
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Dashboard Financeiro
                </CardTitle>
                <CardDescription>Vendas, custo de IA e margem por análise completa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Receita Bruta Gerada</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">US$ {totalRevenueUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Compras Confirmadas</span>
                  <span className="font-mono text-slate-900 font-semibold">{purchaseCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Custo Real de IA (medido)</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    US$ {(aiMetrics?.costs?.totalAiCostUsd || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Margem sobre o Preço</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">
                    {marginPercent}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Custo Direto por Análise (modelo)</span>
                  <span className="font-mono text-slate-900 font-semibold">US$ {ANALYSIS_DIRECT_COST_USD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Piso Absoluto por Análise</span>
                  <span className="font-mono text-rose-700 font-bold">US$ {ANALYSIS_FLOOR_USD.toFixed(2)}</span>
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
                  <span className="text-slate-600">Usuários com Análise Disponível</span>
                  <span className="font-bold text-emerald-700 font-mono">{purchasingUsersCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Taxa de Conversão (Free ➔ Comprador)</span>
                  <span className="font-mono font-bold text-slate-900">{conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Ticket Médio por Compra</span>
                  <span className="font-mono text-emerald-700 font-semibold">US$ {avgOrderUsd.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabela de Preços por Faixa</CardTitle>
              <CardDescription>
                Somente leitura. O preço vive em <code className="font-mono text-[11px]">lib/pricing/catalog.ts</code>,
                que é o ponto único de verdade — mudar preço é mudar código, com o teste do piso como guarda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Faixa</th>
                      <th className="px-3 py-2">Países</th>
                      <th className="px-3 py-2">Análise (USD)</th>
                      <th className="px-3 py-2">Pacote de 5 (USD)</th>
                      <th className="px-3 py-2">Exemplo local</th>
                      <th className="px-3 py-2 text-right">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TIERS.map((tier) => {
                      const sample = priceFor(tier.countries[0], 'single')
                      const margin = Math.round(
                        ((tier.unitPriceUSD - ANALYSIS_DIRECT_COST_USD) / tier.unitPriceUSD) * 100
                      )
                      return (
                        <tr key={tier.tier} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-bold text-slate-900">Faixa {tier.tier}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono text-[10px]">
                            {tier.countries.join(', ')}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-900">
                            ${tier.unitPriceUSD.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">
                            ${tier.packOf5PriceUSD.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">
                            {sample.country} {sample.formatted}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                              {margin}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Custo Médio da IA (R$) — referência</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={configs.AI_AVG_COST_BRL || '0.05'}
                    onChange={(e) => setConfigs({ ...configs, AI_AVG_COST_BRL: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              <div className="pt-6 pb-2">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" /> Integração Stripe Checkout (Gateway Principal)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Stripe Secret Key (sk_...)</label>
                    <Input
                      type="password"
                      placeholder={isMasked(configs.STRIPE_SECRET_KEY) ? `Cadastrada (${configs.STRIPE_SECRET_KEY}) — preencha só para substituir` : 'sk_live_... ou sk_test_...'}
                      value={isMasked(configs.STRIPE_SECRET_KEY) ? '' : (configs.STRIPE_SECRET_KEY || '')}
                      onChange={(e) => setConfigs({ ...configs, STRIPE_SECRET_KEY: e.target.value })}
                      className="text-xs font-mono border-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Stripe Publishable Key (pk_...)</label>
                    <Input
                      type="text"
                      placeholder="pk_live_... ou pk_test_..."
                      value={configs.STRIPE_PUBLISHABLE_KEY || ''}
                      onChange={(e) => setConfigs({ ...configs, STRIPE_PUBLISHABLE_KEY: e.target.value })}
                      className="text-xs font-mono border-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Stripe Webhook Secret (whsec_...)</label>
                    <Input
                      type="password"
                      placeholder={isMasked(configs.STRIPE_WEBHOOK_SECRET) ? `Cadastrado (${configs.STRIPE_WEBHOOK_SECRET}) — preencha só para substituir` : 'whsec_...'}
                      value={isMasked(configs.STRIPE_WEBHOOK_SECRET) ? '' : (configs.STRIPE_WEBHOOK_SECRET || '')}
                      onChange={(e) => setConfigs({ ...configs, STRIPE_WEBHOOK_SECRET: e.target.value })}
                      className="text-xs font-mono border-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-2 flex justify-end items-center flex-wrap gap-2">
                <Button onClick={saveSettings} disabled={savingConfig} className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar Regras & Chaves Stripe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LIST / TABLE OF REGISTERED STRIPE PARAMETERS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Status da Integração Stripe ({[
                  configs.STRIPE_SECRET_KEY,
                  configs.STRIPE_PUBLISHABLE_KEY,
                  configs.STRIPE_WEBHOOK_SECRET,
                ].filter(Boolean).length} / 3)
              </CardTitle>
              <CardDescription>
                Parâmetros e chaves ativas do gateway Stripe no sistema GriffoWork.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Recurso / Chave</th>
                      <th className="px-4 py-3">Valor Registrado</th>
                      <th className="px-4 py-3">Status no Sistema</th>
                      <th className="px-4 py-3 text-right">Escopo / Função</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Stripe Secret Key</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                        {configs.STRIPE_SECRET_KEY || 'Não Cadastrada'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.STRIPE_SECRET_KEY ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            CADASTRADA & ATIVA
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">Checkout API Server</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Stripe Publishable Key</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                        {configs.STRIPE_PUBLISHABLE_KEY ? `${configs.STRIPE_PUBLISHABLE_KEY.slice(0, 14)}••••••••` : 'Não Cadastrada'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.STRIPE_PUBLISHABLE_KEY ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            CADASTRADA & ATIVA
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                            PENDENTE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">Frontend Client Key</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Stripe Webhook Secret</td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                        {configs.STRIPE_WEBHOOK_SECRET || 'Opcional (Desmarcado)'}
                      </td>
                      <td className="px-4 py-3">
                        {configs.STRIPE_WEBHOOK_SECRET ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            HMAC SIGNATURE ATIVO
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-none font-medium text-[10px]">
                            MODO AUTO-FALLBACK
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">Assinatura de Webhook</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Análise Completa</td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {TIERS.length} faixas — preço montado no checkout
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                          CATÁLOGO ATIVO
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">lib/pricing/catalog.ts</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">Pacote de 5 Análises</td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        Upsell — só depois da primeira compra
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                          CATÁLOGO ATIVO
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">lib/pricing/catalog.ts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI TELEMETRY TAB */}
        <TabsContent value="ai-router" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  R$ {((aiMetrics?.costs?.avgCostPerAnalysisUsd || 0) * 5.4).toFixed(3)}
                </p>
                <p className="text-[10px] text-slate-400">${(aiMetrics?.costs?.avgCostPerAnalysisUsd || 0).toFixed(4)} USD</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-medium text-slate-500">Failovers Automáticos</p>
                <p className="text-xl font-bold text-slate-900">{aiMetrics?.usage?.totalFailovers || 0}</p>
                <p className="text-[10px] text-slate-400">Recuperado via redundância</p>
              </CardContent>
            </Card>
            <Card className={aiMetrics?.usage?.totalErrors ? "border-rose-200 bg-rose-50/20" : ""}>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-medium text-slate-500">Falhas Operacionais</p>
                <p className="text-xl font-bold text-rose-600">{aiMetrics?.usage?.totalErrors || 0}</p>
                <p className="text-[10px] text-slate-400">Log de erros gravado em BD</p>
              </CardContent>
            </Card>
          </div>

          {/* LIVE HEALTH CHECK FOR ALL AI PROVIDERS */}
          <Card className="border-indigo-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-emerald-400" /> Diagnóstico de Conexão das APIs (Health Check)
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Status operacional em tempo real de cada API de IA cadastrada.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={runAiTest}
                disabled={testingAi}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold shrink-0 shadow-sm"
              >
                {testingAi ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                Testar Conexão com Todas as IAs Agora
              </Button>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {['kimi', 'deepseek', 'claude', 'gemini'].map((pId) => {
                  const res = aiTestResults?.[pId]
                  const provNames: Record<string, string> = {
                    kimi: 'Kimi (Moonshot)',
                    deepseek: 'DeepSeek AI',
                    claude: 'Claude (Anthropic)',
                    gemini: 'Google Gemini',
                  }

                  let statusBg = 'bg-slate-800/80 border-slate-700 text-slate-300'
                  let badgeText = 'NÃO TESTADO'
                  let badgeColor = 'bg-slate-700 text-slate-200'

                  if (testingAi) {
                    badgeText = 'TESTANDO...'
                    badgeColor = 'bg-indigo-600 text-white animate-pulse'
                  } else if (res) {
                    if (res.status === 'SUCCESS') {
                      statusBg = 'bg-emerald-950/60 border-emerald-700/60 text-emerald-100'
                      badgeText = `OPERACIONAL (${res.latencyMs || 0}ms)`
                      badgeColor = 'bg-emerald-600 text-white font-bold'
                    } else if (res.status === 'SKIPPED') {
                      statusBg = 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                      badgeText = 'SEM CHAVE'
                      badgeColor = 'bg-amber-600 text-white font-bold'
                    } else {
                      statusBg = 'bg-rose-950/60 border-rose-700/60 text-rose-100'
                      badgeText = `FALHA (HTTP ${res.httpCode || 'ERR'})`
                      badgeColor = 'bg-rose-600 text-white font-bold'
                    }
                  }

                  return (
                    <div key={pId} className={`p-3 rounded-lg border text-xs space-y-2 ${statusBg}`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span>{provNames[pId]}</span>
                        <Badge className={`${badgeColor} text-[10px]`}>{badgeText}</Badge>
                      </div>
                      {res?.model && (
                        <p className="text-[10px] text-slate-300 font-mono">Modelo: {res.model}</p>
                      )}
                      {res?.errorMessage && (
                        <p className="text-[10px] text-rose-300 font-mono bg-rose-950/80 p-2 rounded break-words">
                          {res.errorMessage}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

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
                          <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                            <span className="flex items-center gap-1.5">
                              {b.model}
                              {slowModelWarning(b.model) && (
                                <span
                                  title={slowModelWarning(b.model) || ''}
                                  className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-800"
                                >
                                  <AlertCircle className="h-3 w-3" /> LENTO
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">{b.provider}</td>
                          <td className="px-4 py-3">{b.callsCount}</td>
                          <td className="px-4 py-3 font-mono">{b.tokensTotal.toLocaleString()}</td>
                          {/* A latência média é o dado que confirma ou refuta a
                              suspeita do selo ao lado do modelo. Destacada
                              quando passa de 25s, que é o teto por tentativa
                              do roteador: acima disso, o failover não cabe. */}
                          <td
                            className={`px-4 py-3 font-mono ${
                              b.avgLatencyMs > 25000 ? 'font-bold text-rose-700' : ''
                            }`}
                          >
                            {b.avgLatencyMs} ms
                          </td>
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

          {/* OPERATIONAL FAILURE LOG TABLE FOR ADMIN ANALYSIS */}
          <Card className="border-rose-200">
            <CardHeader className="pb-3 bg-rose-50/30">
              <CardTitle className="text-base flex items-center gap-2 text-rose-950">
                <AlertCircle className="w-5 h-5 text-rose-600" /> Log de Análise de Falhas Operacionais de IA
              </CardTitle>
              <CardDescription>
                Registro técnico detalhado das falhas de provedores/APIs. Oculto dos usuários finais para segurança.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Data / Hora</th>
                      <th className="px-4 py-3">Tarefa</th>
                      <th className="px-4 py-3">Provedor Principal</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Diagnóstico por Provedor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiMetrics?.operationalFailures && aiMetrics.operationalFailures.length > 0 ? (
                      aiMetrics.operationalFailures.map((fail) => (
                        <tr key={fail.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {new Date(fail.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{fail.taskType}</td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">{fail.provider}</td>
                          <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{fail.userEmail || fail.userId || 'N/A'}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-rose-700 bg-rose-50/50 p-2 rounded max-w-[420px] break-words">
                            {fail.errorMessage || 'Falha não especificada'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-rose-100 text-rose-800 border-none font-semibold uppercase text-[10px]">
                              FALHA OPERACIONAL
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          Nenhuma falha operacional de IA registrada no histórico.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCIDENTS & AGENT CONTROL TAB */}
        <TabsContent value="incidents" className="space-y-4">
          <IncidentsAdminTab />
        </TabsContent>

        {/* DIRECTOR AGENT TAB (FASE 4) */}
        <TabsContent value="director" className="space-y-4">
          <DirectorAdminTab />
        </TabsContent>

        {/* HEALTH DASHBOARD TAB */}
        <TabsContent value="health" className="space-y-4">
          <HealthAdminTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IncidentsAdminTab() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [alertEmail, setAlertEmail] = useState('')
  const [alertWebhook, setAlertWebhook] = useState('')
  const [loading, setLoading] = useState(true)
  const [runningDiag, setRunningDiag] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const res = await internalFetch('/api/admin/incidents')
      const data = await res.json()
      if (data.incidents) setIncidents(data.incidents)
      if (data.config) {
        setAlertEmail(data.config.adminAlertEmail || '')
        setAlertWebhook(data.config.adminAlertWebhook || '')
      }
    } catch {
      toast.error('Erro ao carregar lista de incidentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await internalFetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', alertEmail, alertWebhook }),
      })
      toast.success('Canais de notificação do Admin atualizados com sucesso!')
    } catch {
      toast.error('Erro ao salvar canais de alerta')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRunDiagnostic = async () => {
    setRunningDiag(true)
    try {
      const res = await internalFetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_diagnostic' }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Auto-Diagnóstico executado em tempo real!')
        loadIncidents()
      }
    } catch {
      toast.error('Falha ao executar diagnóstico')
    } finally {
      setRunningDiag(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CONFIG ALERT CHANNELS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-violet-600" /> Canais de Notificação e Mensageiro do Administrador
          </CardTitle>
          <CardDescription>
            Cadastre os canais oficiais para onde o Agente 2 enviará alertas urgentes sobre erros graves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">E-mail do Administrador (Alertas)</label>
              <Input
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="admin@griffowork.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Webhook de Mensageiro (Telegram / Discord / Slack)</label>
              <Input
                value={alertWebhook}
                onChange={(e) => setAlertWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig} className="bg-violet-700 hover:bg-violet-800">
              {savingConfig ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar Canais de Alerta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* INCIDENTS TABLE & AUTO-DIAGNOSTIC TRIGGER */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" /> Central de Erros & Auto-Reparo em Tempo Real
            </CardTitle>
            <CardDescription>
              Relatórios de falhas detectados pelo Agente de Suporte e resultados das simulações ativas.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleRunDiagnostic} disabled={runningDiag} variant="outline" className="border-emerald-300 text-emerald-900 hover:bg-emerald-50">
            {runningDiag ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Simular & Diagnosticar Agora
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Incidente / Relato</th>
                  <th className="px-4 py-3">Severidade</th>
                  <th className="px-4 py-3">Status do Agente 2</th>
                  <th className="px-4 py-3">Alerta Enviado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length > 0 ? (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {inc.user?.email || inc.reportedByUserId || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[260px] truncate" title={inc.description}>
                        {inc.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`uppercase text-[10px] font-bold ${
                          inc.severity === 'critical' ? 'bg-rose-600 text-white' :
                          inc.severity === 'high' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`uppercase text-[10px] font-semibold ${
                          inc.status === 'auto_fixed' ? 'bg-emerald-100 text-emerald-800' :
                          inc.status === 'action_required' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {inc.status === 'auto_fixed' ? 'AUTO-CORRIGIDO' : inc.status === 'action_required' ? 'AÇÃO REQUERIDA' : 'EM ANÁLISE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inc.alertSent ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Sim</span>
                        ) : (
                          <span className="text-slate-400">Não necessário</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      Nenhum incidente ativo registrado no momento. Todos os serviços estão operando normalmente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DirectorAdminTab() {
  const [briefing, setBriefing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadBriefing = async () => {
    setLoading(true)
    try {
      const res = await internalFetch('/api/admin/director')
      const data = await res.json()
      if (data.briefing) {
        setBriefing(data.briefing)
        toast.success('Boletim do Coordenador de Agentes atualizado!')
      } else {
        toast.error(data.error || 'Erro ao carregar boletim.')
      }
    } catch {
      toast.error('Falha de conexão ao comunicar com o Coordenador.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBriefing()
  }, [])

  return (
    <div className="space-y-6 max-w-5xl">
      {/* DIRECTOR AGENT HEADER */}
      <Card className="border-violet-300 bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 text-white shadow-lg overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">Coordenador Mestre de Agentes</h2>
                  <Badge className="bg-emerald-500 text-white font-bold text-[10px] uppercase">
                    Diretor Operacional 24H
                  </Badge>
                </div>
                <p className="text-xs text-violet-200 mt-0.5">
                  Supervisão contínua, consolidação de KPIs e orquestração do enxame autônomo de IAs.
                </p>
              </div>
            </div>
            <Button
              onClick={loadBriefing}
              disabled={loading}
              className="bg-white text-violet-950 hover:bg-violet-100 font-bold text-xs shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Gerar Relatório Executivo 24h
            </Button>
          </div>

          {briefing && (
            <div className="pt-3 border-t border-violet-800/60 text-xs leading-relaxed text-violet-100 space-y-2">
              <p className="font-bold uppercase text-[10px] text-amber-300 tracking-wider">
                📝 Síntese Executiva do Diretor Mestre ({new Date(briefing.generatedAt).toLocaleString('pt-BR')}):
              </p>
              <div className="p-3.5 rounded-xl bg-violet-900/40 border border-violet-700/50 font-sans text-sm text-white leading-relaxed">
                {briefing.executiveSummary}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* METRICS GRID */}
      {briefing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Requisições de IA (24h)</p>
                <p className="text-2xl font-extrabold text-slate-900">{briefing.totalAiCalls24h}</p>
                <p className="text-[10px] text-slate-400">Chamadas processadas</p>
              </div>
              <Cpu className="w-7 h-7 text-violet-600 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Taxa de Qualidade</p>
                <p className="text-2xl font-extrabold text-emerald-600">{briefing.qualityApprovalRate}%</p>
                <p className="text-[10px] text-slate-400">Aprovação do Agente 3</p>
              </div>
              <Award className="w-7 h-7 text-emerald-600 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Custo Total de IA (24h)</p>
                <p className="text-2xl font-extrabold text-slate-900">${briefing.totalCostUsd24h?.toFixed(4)}</p>
                <p className="text-[10px] text-emerald-600 font-medium">~{briefing.tokenSavingsEstimatedPercent}% economia (OCR)</p>
              </div>
              <Zap className="w-7 h-7 text-amber-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Incidentes Ativos</p>
                <p className="text-2xl font-extrabold text-slate-900">{briefing.incidentsActiveCount}</p>
                <p className="text-[10px] text-slate-400">{briefing.failoverCount24h} fallbacks no roteador</p>
              </div>
              <Activity className="w-7 h-7 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ENXAME DE AGENTES STATUS LIST */}
      {briefing && briefing.agentStatusMap && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Status do Enxame de Agentes Autônomos
            </CardTitle>
            <CardDescription>
              Monitoramento individualizado da saúde de cada sub-agente especializado no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(briefing.agentStatusMap).map(([agentName, info]: [string, any], idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">{agentName}</p>
                  <p className="text-xs text-slate-600">{info.message}</p>
                </div>
                <Badge className={`uppercase text-[10px] font-bold shrink-0 ${
                  info.status === 'online' ? 'bg-emerald-100 text-emerald-800 border-none' : 'bg-amber-100 text-amber-800 border-none'
                }`}>
                  {info.status === 'online' ? '● ONLINE' : '▲ ATENÇÃO'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HealthAdminTab() {
  const [healthData, setHealthData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await internalFetch('/api/admin/health', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setHealthData(data)
      else toast.error(data.error || 'Erro ao carregar dados de saúde.')
    } catch {
      toast.error('Falha de conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

  if (loading && !healthData) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saúde do Sistema</h2>
          <p className="text-sm text-slate-500">Monitoramento em tempo real dos serviços críticos.</p>
        </div>
        <Button onClick={checkHealth} disabled={loading} variant="outline" className="bg-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Diagnóstico Atualizado
        </Button>
      </div>

      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DATABASE CARD */}
          <Card className={healthData.components.database.status === 'error' ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Database <Badge variant="outline">{healthData.components.database.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{healthData.components.database.latencyMs}ms</p>
              <p className="text-xs text-slate-500">Latência de query básica</p>
              {healthData.components.database.error && (
                <p className="text-xs text-rose-600 mt-2">{healthData.components.database.error}</p>
              )}
            </CardContent>
          </Card>

          {/* ENVIRONMENT VARIABLES CARD */}
          <Card className={healthData.components.env.status === 'error' ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Environment <Badge variant="outline">{healthData.components.env.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{healthData.components.env.missingKeys.length === 0 ? 'OK' : 'FALHA'}</p>
              <p className="text-xs text-slate-500">Variáveis de ambiente</p>
              {healthData.components.env.missingKeys.length > 0 && (
                <p className="text-xs text-rose-600 mt-2 font-bold break-words">Faltando: {healthData.components.env.missingKeys.join(', ')}</p>
              )}
            </CardContent>
          </Card>

          {/* AI PROVIDERS CARD */}
          <Card className={healthData.components.aiProviders.status === 'error' ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Provedores IA <Badge variant="outline">{healthData.components.aiProviders.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{healthData.components.aiProviders.activeKeys}</p>
              <p className="text-xs text-slate-500">Chaves de API ativas</p>
              <p className="text-xs text-slate-700 mt-2">{healthData.components.aiProviders.message}</p>
            </CardContent>
          </Card>

          {/* INCIDENTS CARD */}
          <Card className={healthData.components.incidents.status === 'degraded' ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Estabilidade <Badge variant="outline">{healthData.components.incidents.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{healthData.components.incidents.activeCount}</p>
              <p className="text-xs text-slate-500">Incidentes pendentes</p>
              <p className="text-xs mt-2 text-amber-700 font-semibold">{healthData.components.incidents.recentAiErrors} erros de IA nas últimas 24h</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

