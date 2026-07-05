'use client'

import { useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Shield, Bell, Lock, Users, Eye, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsView() {
  const { user, hydrate, logout } = useAuth()
  const { setView } = useNav()
  const [name, setName] = useState(user?.name || '')
  const [profession, setProfession] = useState(user?.profession || '')
  const [saving, setSaving] = useState(false)
  const [recruiterOptIn, setRecruiterOptIn] = useState(user?.recruiterOptIn || false)
  const [profileVisible, setProfileVisible] = useState(user?.profileVisible || false)

  const saveProfile = async () => {
    setSaving(true)
    try {
      const r = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, profession }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        toast.error(d.error || 'Falha ao salvar.')
        return
      }
      toast.success('Perfil salvo com sucesso!')
      await hydrate()
    } finally {
      setSaving(false)
    }
  }

  const toggleOptIn = async (checked: boolean) => {
    setRecruiterOptIn(checked)
    if (!checked) setProfileVisible(false)
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterOptIn: checked, profileVisible: false }),
      })
      toast.info(checked
        ? 'Você aceitou aparecer para recruiters parceiros (Fase 2). Seus dados sensíveis só serão liberados após match aceito.'
        : 'Opt-out feito. Você não aparecerá em buscas de recrutadores.'
      )
      await hydrate()
    } catch {
      toast.error('Erro ao salvar preferência.')
    }
  }

  const toggleProfileVisible = async (checked: boolean) => {
    setProfileVisible(checked)
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisible: checked }),
      })
      await hydrate()
    } catch {
      toast.error('Erro ao salvar preferência.')
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gerencie seu perfil, privacidade e preferências.</p>
      </div>

      {/* PROFILE */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <CardTitle className="text-base">Perfil</CardTitle>
              <CardDescription>Informações básicas da sua conta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-slate-50" />
            <p className="text-xs text-slate-500">O e-mail não pode ser alterado.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profession">Profissão</Label>
            <Input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex: Desenvolvedora Front-end" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {/* PLAN */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <div>
              <CardTitle className="text-base">Plano atual</CardTitle>
              <CardDescription>Sua assinatura atual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Badge className={user?.planActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
                {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'day' ? 'Passe Diário' : user?.plan === 'monthly' ? 'Mensal' : user?.plan === 'annual' ? 'Anual' : '—'}
              </Badge>
              {user?.planActive && user?.planEndsAt && (
                <p className="text-xs text-slate-500 mt-1">Expira em {new Date(user.planEndsAt).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setView('plans')}>Ver planos</Button>
          </div>
        </CardContent>
      </Card>

      {/* PRIVACY / B2B */}
      <Card className="border-violet-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            <div>
              <CardTitle className="text-base">Marketplace de talentos <Badge variant="outline" className="ml-1 text-[10px]">Fase 2</Badge></CardTitle>
              <CardDescription>Controle se recrutadores parceiros podem te encontrar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Na Fase 2, recrutadores verificados poderão buscar candidatos por score, dimensões de força e palavras-chave. <strong>Você está no controle:</strong> pode ativar ou desativar a qualquer momento. Dados sensíveis (e-mail, telefone) só aparecem após você aceitar um match.
            </AlertDescription>
          </Alert>

          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Aparecer em buscas de recrutadores</p>
                <p className="text-xs text-slate-500 mt-0.5">Seus laudos (sem dados sensíveis) ficam visíveis para recrutadores parceiros verificados.</p>
              </div>
            </div>
            <Switch checked={recruiterOptIn} onCheckedChange={toggleOptIn} />
          </div>

          <div className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${!recruiterOptIn ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Perfil público para matches</p>
                <p className="text-xs text-slate-500 mt-0.5">Permite que recrutadores vejam seu nome e profissão (não contato) quando houver match por palavras-chave.</p>
              </div>
            </div>
            <Switch
              checked={profileVisible}
              onCheckedChange={toggleProfileVisible}
              disabled={!recruiterOptIn}
            />
          </div>

          <p className="text-xs text-slate-500">
            Você pode revogar consentimento a qualquer momento. Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </CardContent>
      </Card>

      {/* SECURITY */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <div>
              <CardTitle className="text-base">Segurança</CardTitle>
              <CardDescription>Sua senha está protegida com hash scrypt e sal único</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Senha: hash scrypt + salt aleatório (não armazenamos em texto puro)</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sessão: cookie httpOnly + assinatura HMAC (não pode ser lida por JS)</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Currículos: vinculados à sua conta, visíveis apenas para você</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auditoria: todos os acessos e ações são logados</p>
          </div>
        </CardContent>
      </Card>

      {/* LOGOUT */}
      <Card className="border-red-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Sair da conta</p>
            <p className="text-xs text-slate-500">Encerra a sessão neste dispositivo.</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => { await logout(); setView('dashboard'); window.location.reload() }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
