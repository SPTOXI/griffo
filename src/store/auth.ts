'use client'

import { create } from 'zustand'
import { internalFetch } from '@/lib/internal-fetch'

export interface AuthUser {
  id: string
  email: string
  name: string
  role?: string
  profession?: string | null
  plan: string
  credits?: number
  planStartsAt?: string | null
  planEndsAt?: string | null
  planActive?: boolean
  recruiterOptIn?: boolean
  profileVisible?: boolean
  socialLinks?: Record<string, string> | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  hydrated: boolean
  setUser: (u: AuthUser | null) => void
  setLoading: (b: boolean) => void
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  hydrate: async () => {
    try {
      const r = await internalFetch('/api/auth/me')
      const data = await r.json()
      set({ user: data.user || null, hydrated: true })
    } catch {
      set({ user: null, hydrated: true })
    }
  },
  logout: async () => {
    try { await internalFetch('/api/auth/logout', { method: 'POST' }) } catch {}
    set({ user: null })
  },
}))

export type AppView =
  | 'dashboard'
  | 'upload'
  | 'analysis'
  | 'rewrite'
  | 'downloads'
  | 'plans'
  | 'settings'
  | 'history'
  | 'admin'

interface NavState {
  view: AppView
  activeResumeId: string | null
  setView: (v: AppView) => void
  openResume: (id: string, view?: AppView) => void
}

export const useNav = create<NavState>((set) => ({
  view: 'dashboard',
  activeResumeId: null,
  setView: (v) => set({ view: v }),
  openResume: (id, view = 'analysis') => set({ activeResumeId: id, view }),
}))
