'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { Landing } from '@/components/landing/landing'
import { AuthScreen } from '@/components/auth/auth-screen'
import { AppShell } from '@/components/app/app-shell'

type Screen = 'landing' | 'login' | 'signup' | 'app'

export default function Home() {
  const { user, hydrated, hydrate } = useAuth()
  const [screen, setScreen] = useState<Screen>('landing')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // If user is logged in, force app screen
  const effectiveScreen: Screen = user ? 'app' : screen

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse" />
          <p className="text-xs text-slate-400">Carregando Griffo…</p>
        </div>
      </div>
    )
  }

  if (effectiveScreen === 'app') {
    return <AppShell onExit={() => setScreen('landing')} />
  }

  if (effectiveScreen === 'login' || effectiveScreen === 'signup') {
    return <AuthScreen initialMode={effectiveScreen} onBack={() => setScreen('landing')} />
  }

  return <Landing onNavigate={(v) => setScreen(v)} />
}
