'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useNav } from '@/store/auth'
import { Landing } from '@/components/landing/landing'
import type { Language } from '@/lib/i18n'
import type { SocialProof } from '@/lib/analytics/social-proof'
import { useI18n } from '@/context/i18n-context'

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
  socialProof?: SocialProof | null
}

export function CountryPageClient({ countryCode, lang, openJobsCount, socialProof }: CountryPageClientProps) {
  const { user, hydrated, hydrate } = useAuth()
  const setNavView = useNav((s) => s.setView)
  const [screen, setScreen] = useState<Screen>('landing')
  const { adoptPageLang, langManuallySet } = useI18n()

  useEffect(() => {
    hydrate()
  }, [])

  // O cadastro e o app seguem o idioma da página (/br em português), não o do
  // navegador. No teste, a home /br abria o cadastro em inglês.
  useEffect(() => {
    adoptPageLang(lang)
    // De novo ao abrir o cadastro: o palpite automático (geo-IP) termina depois
    // da primeira rodada e trocaria o idioma de volta.
  }, [lang, langManuallySet, screen])

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
    return <Landing onNavigate={(v) => setScreen(v)} countryCode={countryCode} forcedLang={lang} openJobsCount={openJobsCount} socialProof={socialProof} />
  }

  if (effectiveScreen === 'app') {
    return <AppShell onExit={() => setScreen('landing')} />
  }

  if (effectiveScreen === 'login' || effectiveScreen === 'signup') {
    return <AuthScreen initialMode={effectiveScreen} onBack={() => setScreen('landing')} />
  }

  return (
    <Landing
      onNavigate={(v) => setScreen(v)}
      countryCode={countryCode}
      forcedLang={lang}
      openJobsCount={openJobsCount}
      socialProof={socialProof}
    />
  )
}
