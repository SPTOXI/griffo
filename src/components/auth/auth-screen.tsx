'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowLeft, Mail, Lock, User, Briefcase, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { useI18n } from '@/context/i18n-context'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { dirForLang } from '@/lib/i18n'
import { LanguageSelector } from '@/components/ui/language-selector'
import { internalFetch } from '@/lib/internal-fetch'
import { getVisitorId } from '@/components/analytics/track-client'

type Mode = 'login' | 'signup'

export function AuthScreen({ initialMode, onBack }: { initialMode: Mode; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profession, setProfession] = useState('')
  const [dataTransferConsent, setDataTransferConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Cadastro enviado: a conta só abre pelo link do e-mail (§2.147).
  const [checkEmail, setCheckEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { hydrate } = useAuth()
  const { t, lang } = useI18n()

  // Link de confirmação vencido ou inválido: a rota devolve para cá com `verify`.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = new URLSearchParams(window.location.search).get('verify')
    if (v === 'invalid' || v === 'error') setError(t.auth.verifyInvalid)
  }, [t.auth.verifyInvalid])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password, lang }
        : { name, email, password, profession: profession || undefined, dataTransferConsent, visitorId: getVisitorId(), lang }
      const r = await internalFetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Falha na operação')
        return
      }
      if (data?.status === 'check_email') {
        setCheckEmail(true)
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
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/50 via-white to-white">
      <DocumentLanguage lang={lang} />
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> {t.auth.back}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Image src="/logo-icon.png" alt="GriffoWork" width={110} height={84} className="h-10 sm:h-11 w-auto object-contain shrink-0" />
              <span className="font-extrabold text-[#0B192E] text-base tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-slate-200">
            <CardContent className="p-6 sm:p-8">
              {checkEmail ? (
                <div className="text-center py-4" role="status">
                  <Mail className="w-10 h-10 text-[#0B63E5] mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-[#0B192E]">{t.auth.checkEmailTitle}</h1>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t.auth.checkEmailBody}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-3 break-all">{email}</p>
                  {/* Mesmo texto para e-mail novo e existente: a tela não revela se há conta (§2.147). */}
                  <p className="text-sm text-slate-600 mt-4 leading-relaxed">{t.auth.checkEmailExisting}</p>
                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => { setCheckEmail(false); setMode('login'); setPassword(''); setError(null) }}
                    >
                      {t.auth.checkEmailGoLogin}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => { setCheckEmail(false); setEmail(''); setPassword(''); setError(null) }}
                    >
                      {t.auth.checkEmailUseOther}
                    </Button>
                  </div>
                </div>
              ) : (
              <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#0B192E]">
                  {mode === 'login' ? t.auth.welcomeBack : t.auth.createAccount}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'login' ? t.auth.loginSub : t.auth.signupSub}
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
                    <Label htmlFor="name">{t.auth.fullName}</Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Maria Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                      aria-pressed={showPassword}
                      title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63E5]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="profession">{t.auth.profession}</Label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="profession"
                        type="text"
                        placeholder={t.auth.professionPlaceholder}
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataTransferConsent}
                      onChange={(e) => setDataTransferConsent(e.target.checked)}
                      className="mt-0.5 shrink-0 accent-[#0B63E5]"
                    />
                    <span>
                      {t.auth.dataTransferConsent}
                    </span>
                  </label>
                )}

                <Button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !dataTransferConsent)}
                  className="w-full bg-[#0B63E5] hover:bg-[#0052CC] text-white font-bold h-11 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : mode === 'login' ? (
                    t.auth.loginBtn
                  ) : (
                    t.auth.signupBtn
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                  className="text-xs text-[#0B63E5] hover:underline font-semibold"
                >
                  {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
                </button>
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
