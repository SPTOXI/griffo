'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Landing } from '@/components/landing/landing'
import { AuthScreen } from '@/components/auth/auth-screen'
import { AppShell } from '@/components/app/app-shell'
import type { Language } from '@/lib/i18n'

type Screen = 'landing' | 'login' | 'signup' | 'app'

export interface CountryPageClientProps {
  countryCode: string
  lang: Language
}

export function CountryPageClient({ countryCode, lang }: CountryPageClientProps) {
  const { user, hydrated, hydrate } = useAuth()
  const setNavView = useNav((s) => s.setView)
  const [screen, setScreen] = useState<Screen>('landing')

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const v = params.get('view')
      if (v === 'admin' || v === 'upload' || v === 'analysis' || v === 'rewrite' || v === 'plans' || v === 'radar') {
        setNavView(v as any)
      }
    }
  }, [hydrated, setNavView])

  const effectiveScreen: Screen = user ? 'app' : screen

  // Durante SSR e primeiro render: entrega a Landing Page localizada para o país
  if (!hydrated) {
    return <Landing onNavigate={(v) => setScreen(v)} countryCode={countryCode} forcedLang={lang} />
  }

  if (effectiveScreen === 'app') {
    return <AppShell onExit={() => setScreen('landing')} />
  }

  if (effectiveScreen === 'login' || effectiveScreen === 'signup') {
    return <AuthScreen initialMode={effectiveScreen} onBack={() => setScreen('landing')} />
  }

  return <Landing onNavigate={(v) => setScreen(v)} countryCode={countryCode} forcedLang={lang} />
}
