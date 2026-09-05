'use client'

import React from 'react'
import { useI18n } from '@/context/i18n-context'
import { Language } from '@/lib/i18n'
import { ChevronDown, Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Sem emoji de bandeira de propósito: Windows não tem o glifo de bandeira no
// Segoe UI Emoji e cai no par de letras do Regional Indicator por baixo —
// ou seja, o emoji vira literalmente "DE", duplicando o código do idioma que
// já aparece ao lado ("DE DE" no gatilho fechado). `label` já carrega o
// código entre parênteses, então nenhuma informação se perde tirando o emoji.
const LANG_OPTIONS: { id: Language; label: string }[] = [
  { id: 'pt', label: 'Português (BR)' },
  { id: 'en', label: 'English (US)' },
  { id: 'es', label: 'Español (ES)' },
  { id: 'de', label: 'Deutsch (DE)' },
  { id: 'fr', label: 'Français (FR)' },
  { id: 'it', label: 'Italiano (IT)' },
  { id: 'ja', label: '日本語 (JP)' },
  { id: 'nl', label: 'Nederlands (NL)' },
  { id: 'sv', label: 'Svenska (SE)' },
  { id: 'zh', label: '简体中文 (CN)' },
  { id: 'ar', label: 'العربية (AR)' },
  { id: 'ko', label: '한국어 (KR)' },
]

export function LanguageSelector({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  const { lang, setLang } = useI18n()
  const current = LANG_OPTIONS.find((o) => o.id === lang) || LANG_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer">
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase text-[11px] font-extrabold tracking-wider">{current.id}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200">
        {LANG_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => setLang(opt.id)}
            className={`flex items-center justify-between text-xs font-semibold cursor-pointer ${
              lang === opt.id ? 'bg-blue-50 text-[#0B63E5]' : 'text-slate-700'
            }`}
          >
            <span>{opt.label}</span>
            {lang === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#0B63E5]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
