'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowLeft, Mail, Lock, User, Briefcase, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { useI18n } from '@/context/i18n-context'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { dirForLang } from '@/lib/i18n'
import { LanguageSelector } from '@/components/ui/language-selector'
import { internalFetch } from '@/lib/internal-fetch'

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
  const { hydrate } = useAuth()
  const { t, lang } = useI18n()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password, profession: profession || undefined, dataTransferConsent }
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
                      type="text"
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
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
