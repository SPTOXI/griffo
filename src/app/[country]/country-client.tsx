'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useNav } from '@/store/auth'
import { Landing } from '@/components/landing/landing'
import type { Language } from '@/lib/i18n'

// Mesmo motivo de `src/app/page.tsx`: `AppShell` puxa o app autenticado
// inteiro (dashboard, laudo com `recharts`, admin), e isto AQUI é a segunda
// entrada estática pro mesmo import que explicava o achado do
// PageSpeed/Search Console — corrigir só `page.tsx` não bastava porque o
// bundler compartilha o chunk entre as duas páginas que o referenciam.
const AuthScreen = dynamic(() => import('@/components/auth/auth-screen').then((m) => m.AuthScreen), {
  ssr: false,
})
const AppShell = dynamic(() => import('@/components/app/app-shell').then((m) => m.AppShell), {
  ssr: false,
})

type Screen = 'landing' | 'login' | 'signup' | 'app'

export interface CountryPageClientProps {
  countryCode: string
  lang: Language
  /** Contagem real de vagas ativas, resolvida no servidor em `page.tsx`. */
  openJobsCount: number
}

export function CountryPageClient({ countryCode, lang, openJobsCount }: CountryPageClientProps) {
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
    return <Landing onNavigate={(v) => setScreen(v)} countryCode={countryCode} forcedLang={lang} openJobsCount={openJobsCount} />
  }

  if (effectiveScreen === 'app') {
    return <AppShell onExit={() => setScreen('landing')} />
  }

  if (effectiveScreen === 'login' || effectiveScreen === 'signup') {
    return <AuthScreen initialMode={effectiveScreen} onBack={() => setScreen('landing')} />
  }

  return <Landing onNavigate={(v) => setScreen(v)} countryCode={countryCode} forcedLang={lang} />
}
