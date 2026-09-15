'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useNav } from '@/store/auth'
import { Landing } from '@/components/landing/landing'
import type { CountryJobCount } from '@/lib/jobs/open-count.server'

// `AuthScreen` e, principalmente, `AppShell` puxam a árvore inteira do app
// autenticado (dashboard, laudo com `recharts`, admin) — código que quem só
// está vendo a home nunca executa. Antes, os três eram `import` estático no
// topo do arquivo: todo visitante anônimo baixava e processava esse JS
// (achado real do PageSpeed/Search Console: um chunk de 1,24 MB, ~255 KiB
// "não usado" de 320 KiB transferidos, e uma tarefa longa de 186ms na thread
// principal). `dynamic()` cria um chunk à parte, buscado só quando
// `effectiveScreen` deixa de ser `'landing'` — a `Landing` continua import
// estático de propósito, porque é ela que sai pronta no HTML da primeira
// resposta para buscador e bot de IA (ver o comentário mais abaixo).
const AuthScreen = dynamic(() => import('@/components/auth/auth-screen').then((m) => m.AuthScreen), {
  ssr: false,
})
const AppShell = dynamic(() => import('@/components/app/app-shell').then((m) => m.AppShell), {
  ssr: false,
})

type Screen = 'landing' | 'login' | 'signup' | 'app'

export interface HomeClientProps {
  /** Contagem real de vagas ativas, resolvida no servidor em `page.tsx`. */
  openJobsCount: number
  /** Vagas abertas por país, mesma fonte e mesmo momento — ver `page.tsx`. */
  jobsByCountry: CountryJobCount[]
}

export function HomeClient({ openJobsCount, jobsByCountry }: HomeClientProps) {
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
      // `radar` entrou aqui para o e-mail do digest ter uma porta de entrada.
      // A navegação do app vive em memória, sem rota própria, então sem este
      // nome na lista o link do e-mail deixaria a pessoa no painel inicial —
      // que não é onde o aviso dela está.
      if (v === 'admin' || v === 'upload' || v === 'analysis' || v === 'rewrite' || v === 'plans' || v === 'radar') {
        setNavView(v as any)
      }
    }
  }, [hydrated, setNavView])

  // If user is logged in, force app screen
  const effectiveScreen: Screen = user ? 'app' : screen

  // SSR e primeiro render: entrega o HTML completo da Landing Page para motores de busca,
  // bots de IA (GPTBot, ClaudeBot, PerplexityBot) e visitantes sem flash de carregamento.
  if (!hydrated) {
    return <Landing onNavigate={(v) => setScreen(v)} openJobsCount={openJobsCount} jobsByCountry={jobsByCountry} />
  }

  if (effectiveScreen === 'app') {
    return <AppShell onExit={() => setScreen('landing')} />
  }

  if (effectiveScreen === 'login' || effectiveScreen === 'signup') {
    return <AuthScreen initialMode={effectiveScreen} onBack={() => setScreen('landing')} />
  }

  return <Landing onNavigate={(v) => setScreen(v)} openJobsCount={openJobsCount} jobsByCountry={jobsByCountry} />
}
