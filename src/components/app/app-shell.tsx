'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch';
import { useAuth, useNav, AppView } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, Upload, FileSearch, FileEdit, Download, CreditCard, Settings, History,
  LogOut, FileText, Sparkles, ChevronRight, Menu, X, Shield, Zap, HelpCircle
} from 'lucide-react'
import { Dashboard } from './dashboard'
import { UploadView } from './upload-view'
import { AnalysisView } from './analysis-view'
import { RewriteView } from './rewrite-view'
import { DownloadsView } from './downloads-view'
import { PlansView } from './plans-view'
import { HistoryView } from './history-view'
import { SettingsView } from './settings-view'
import { SupportView } from './support-view'
import { AdminView } from '../admin/admin-view'
import { PaymentStatusModal } from './payment-status-modal'
import { LanguageSelector } from '../ui/language-selector'
import { useI18n } from '@/context/i18n-context'

const NAV_ITEMS: { view: AppView; label: string; icon: any }[] = [
  { view: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { view: 'upload', label: 'Enviar currículo', icon: Upload },
  { view: 'analysis', label: 'Laudo', icon: FileSearch },
  { view: 'rewrite', label: 'Reescrita', icon: FileEdit },
  { view: 'downloads', label: 'Downloads', icon: Download },
  { view: 'history', label: 'Histórico', icon: History },
  { view: 'plans', label: 'Comprar Créditos', icon: CreditCard },
  { view: 'support', label: 'Suporte & Dúvidas', icon: HelpCircle },
  { view: 'settings', label: 'Configurações', icon: Settings },
]

export function AppShell({ onExit }: { onExit: () => void }) {
  const { lang } = useI18n()
  const { user, logout, hydrated } = useAuth()
  const { view, setView } = useNav()

  const appSubtitles: Record<string, string> = {
    pt: 'Inteligência de Carreira',
    en: 'Career Intelligence',
    es: 'Inteligencia de Carrera',
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [credits, setCredits] = useState<number>(user?.credits ?? 20)
  const [activePaymentSession, setActivePaymentSession] = useState<{ sessionId: string; expectedCredits?: number } | null>(null)

  useEffect(() => {
    if (hydrated && user && user.role !== 'admin' && view === 'admin') {
      setView('dashboard')
    }
  }, [hydrated, user, view, setView])

  useEffect(() => {
    if (user?.role === 'admin') return
    internalFetch('/api/credits/balance')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.credits === 'number') {
          setCredits(data.credits)
        }
      })
      .catch(() => {})
  }, [view, user?.role])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const paymentStatus = params.get('payment')
      const sessionId = params.get('session_id')
      const credits = params.get('credits')

      if (paymentStatus === 'success' && sessionId) {
        setActivePaymentSession({
          sessionId,
          expectedCredits: credits ? parseInt(credits, 10) : undefined,
        })
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (paymentStatus === 'success' && !sessionId) {
        toast.success(`🎉 Pagamento confirmado! Créditos adicionados.`)
        window.history.replaceState({}, document.title, window.location.pathname)
        internalFetch('/api/credits/balance')
          .then((r) => r.json())
          .then((data) => {
            if (typeof data.credits === 'number') setCredits(data.credits)
          })
          .catch(() => {})
      } else if (paymentStatus === 'cancelled') {
        toast.error('Pagamento cancelado.')
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    onExit()
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center px-3 sm:px-4 gap-2.5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Menu Lateral"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button onClick={onExit} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="GriffoWork" className="h-9 w-auto object-contain rounded-md shrink-0" />
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="font-extrabold text-[#0B192E] text-base tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
            <span className="text-[9px] font-extrabold tracking-wider text-[#0B63E5] uppercase">{appSubtitles[lang] || appSubtitles.pt}</span>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-1 ml-3 text-xs sm:text-sm text-slate-500 truncate">
          <span>Painel</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-900 font-medium capitalize truncate">
            {NAV_ITEMS.find(n => n.view === view)?.label || (view === 'admin' ? 'Área Admin' : view)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          {/* CREDITS BADGE */}
          {user?.role === 'admin' ? (
            <Button
              size="sm"
              onClick={() => setView('admin')}
              className="bg-violet-700 hover:bg-violet-800 h-8 text-xs font-semibold gap-1 px-2 sm:px-3 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span><span className="hidden sm:inline">Créditos Ilimitados (</span>Admin<span className="hidden sm:inline">)</span></span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setView('plans')}
              className="bg-[#0B63E5] hover:bg-[#0052CC] text-white h-8 text-xs font-semibold gap-1 px-2 sm:px-3 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span>{credits} <span className="hidden sm:inline">Créditos</span><span className="sm:hidden">cr</span></span>
              <span className="hidden md:inline text-[10px] text-blue-100 ml-1 bg-blue-700/60 px-1.5 py-0.5 rounded-full">+ Adicionar</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-[#0B63E5] text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-xs sm:text-sm text-slate-700 max-w-[100px] truncate">{user?.name || user?.email}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => setView('admin')} className="text-violet-600 font-semibold cursor-pointer">
                  <Shield className="w-4 h-4 mr-2" /> Área Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setView('settings')} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('plans')} className="cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2" /> Comprar Créditos ({credits} cr)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* SIDEBAR OVERLAY FOR MOBILE */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-64 bg-white border-r border-slate-200
          flex flex-col
          transition-transform duration-200 ease-in-out
        `}>
          <div className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navegação</p>
            <nav className="space-y-1">
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setView('admin')
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold
                    transition-all shadow-xs mb-2
                    ${view === 'admin'
                      ? 'bg-violet-700 text-white shadow-md'
                      : 'bg-violet-50 text-violet-900 border border-violet-200 hover:bg-violet-100'
                    }
                  `}
                >
                  <Shield className={`w-4 h-4 ${view === 'admin' ? 'text-amber-300' : 'text-violet-600'}`} />
                  <span>Área Admin (Painel Mestre)</span>
                </button>
              )}

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = view === item.view
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      setView(item.view)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium
                      transition-colors
                      ${active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
            {user?.role === 'admin' ? (
              <div className="rounded-xl bg-gradient-to-br from-violet-700 to-indigo-900 p-3 text-white space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-200">
                  <Shield className="w-4 h-4 text-amber-300" /> Modo Administrador
                </div>
                <p className="text-xl font-extrabold text-white">♾️ Créditos Ilimitados</p>
                <Button onClick={() => { setView('admin'); setSidebarOpen(false) }} size="sm" className="w-full bg-white text-violet-950 hover:bg-slate-100 font-bold text-xs h-8">
                  Acessar Área Admin
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-[#0B192E] to-[#0B63E5] p-3.5 text-white space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Saldo Atual
                </div>
                <p className="text-2xl font-extrabold">{credits} <span className="text-xs font-normal text-blue-100">créditos</span></p>
                <Button onClick={() => { setView('plans'); setSidebarOpen(false) }} size="sm" className="w-full bg-white text-[#0B192E] hover:bg-blue-50 font-bold text-xs h-8">
                  Adicionar Créditos
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
          {view === 'dashboard' && <Dashboard />}
          {view === 'upload' && <UploadView />}
          {view === 'analysis' && <AnalysisView />}
          {view === 'rewrite' && <RewriteView />}
          {view === 'downloads' && <DownloadsView />}
          {view === 'history' && <HistoryView />}
          {view === 'plans' && <PlansView />}
          {view === 'support' && <SupportView />}
          {view === 'settings' && <SettingsView />}
          {view === 'admin' && <AdminView />}
        </main>
      </div>

      {activePaymentSession && (
        <PaymentStatusModal
          sessionId={activePaymentSession.sessionId}
          expectedCredits={activePaymentSession.expectedCredits}
          onComplete={(newBalance) => setCredits(newBalance)}
          onClose={() => setActivePaymentSession(null)}
        />
      )}
    </div>
  )
}
