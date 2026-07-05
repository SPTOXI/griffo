'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowLeft, Mail, Lock, User, Briefcase, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/store/auth'

type Mode = 'login' | 'signup'

export function AuthScreen({ initialMode, onBack }: { initialMode: Mode; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profession, setProfession] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { hydrate } = useAuth()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password, profession: profession || undefined }
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Falha na operação')
        return
      }
      await hydrate()
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">CareerLens</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'login' ? 'Entre para acessar seus laudos.' : 'Análise gratuita. Sem cartão de crédito.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Maria Souza"
                        className="pl-9"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && <p className="text-xs text-slate-500">Mínimo de 6 caracteres.</p>}
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="profession">Profissão atual <span className="text-slate-400 text-xs">(opcional)</span></Label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="profession"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="Desenvolvedora Front-end"
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Entrar' : 'Criar conta gratuita')}
                </Button>
              </form>

              {mode === 'signup' && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <p className="font-semibold flex items-center gap-1 mb-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ao criar sua conta, você concorda em:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-emerald-700">
                    <li>Receber análise gratuita do seu currículo.</li>
                    <li>Permitir armazenamento seguro e criptografado dos seus dados (LGPD).</li>
                    <li>Decidir depois se quer aparecer para recrutadores (opt-in).</li>
                  </ul>
                </div>
              )}

              <p className="text-center text-sm text-slate-600 mt-6">
                {mode === 'login' ? (
                  <>Não tem conta?{' '}
                    <button onClick={() => { setMode('signup'); setError(null) }} className="text-emerald-700 font-semibold hover:underline">
                      Criar agora
                    </button>
                  </>
                ) : (
                  <>Já tem conta?{' '}
                    <button onClick={() => { setMode('login'); setError(null) }} className="text-emerald-700 font-semibold hover:underline">
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
