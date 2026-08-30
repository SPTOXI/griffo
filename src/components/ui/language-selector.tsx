'use client'

import React from 'react'
import { useI18n } from '@/context/i18n-context'
import { Language } from '@/lib/i18n'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANG_OPTIONS: { id: Language; label: string; flag: string }[] = [
  { id: 'pt', label: 'Português (BR)', flag: '🇧🇷' },
  { id: 'en', label: 'English (US)', flag: '🇺🇸' },
  { id: 'es', label: 'Español (ES)', flag: '🇪🇸' },
  { id: 'de', label: 'Deutsch (DE)', flag: '🇩🇪' },
  { id: 'fr', label: 'Français (FR)', flag: '🇫🇷' },
  { id: 'it', label: 'Italiano (IT)', flag: '🇮🇹' },
  { id: 'ja', label: '日本語 (JP)', flag: '🇯🇵' },
]

export function LanguageSelector({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  const { lang, setLang } = useI18n()
  const current = LANG_OPTIONS.find((o) => o.id === lang) || LANG_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer">
          <span className="text-sm leading-none">{current.flag}</span>
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
            <span className="flex items-center gap-2">
              <span className="text-base">{opt.flag}</span>
              <span>{opt.label}</span>
            </span>
            {lang === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#0B63E5]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
