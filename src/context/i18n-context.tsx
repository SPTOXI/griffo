'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DICTIONARIES, LANGUAGES, Language, TranslationDictionary, detectBrowserLanguage } from '@/lib/i18n'
import { internalFetch } from '@/lib/internal-fetch'

interface I18nContextType {
  lang: Language
  t: TranslationDictionary
  setLang: (lang: Language) => void
  detectedCountry?: string
  langManuallySet: boolean
}

const I18nContext = createContext<I18nContextType>({
  lang: 'pt',
  t: DICTIONARIES.pt,
  setLang: () => {},
  langManuallySet: false,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('pt')
  const [detectedCountry, setDetectedCountry] = useState<string>('BR')
  // Diferencia idioma ESCOLHIDO (localStorage já tem valor, ou o seletor foi
  // usado) de idioma ADIVINHADO (geo-IP/navegador). Só o primeiro pode
  // vencer o `forcedLang` de uma rota de país em `Landing` — do contrário o
  // seletor de idioma clica e não muda nada, porque o palpite automático e a
  // escolha manual ficavam indistinguíveis no mesmo estado.
  const [langManuallySet, setLangManuallySet] = useState(false)

  useEffect(() => {
    // 1. Check browser storage first
    const local = localStorage.getItem('griffo_lang') as Language
    if (local && LANGUAGES.includes(local)) {
      setLangState(local)
      setLangManuallySet(true)
      return
    }

    // 2. Fetch server-side country detection from edge
    internalFetch('/api/i18n/geo')
      .then((r) => r.json())
      .then((data) => {
        if (data.country) setDetectedCountry(data.country)
        if (data.lang && LANGUAGES.includes(data.lang)) {
          setLangState(data.lang)
        } else {
          setLangState(detectBrowserLanguage())
        }
      })
      .catch(() => {
        setLangState(detectBrowserLanguage())
      })
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    setLangManuallySet(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('griffo_lang', newLang)
      // Também em cookie: é o único dos dois que `middleware.ts` consegue
      // ler no servidor. Sem isto, uma escolha manual de idioma seria
      // sobrescrita pelo palpite de geo-IP toda vez que a pessoa voltasse
      // ao domínio nu (`/`) numa aba/sessão nova.
      document.cookie = `griffo_lang=${newLang}; path=/; max-age=31536000; samesite=lax`
    }
  }

  return (
    <I18nContext.Provider
      value={{
        lang,
        t: DICTIONARIES[lang] || DICTIONARIES.pt,
        setLang,
        detectedCountry,
        langManuallySet,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
