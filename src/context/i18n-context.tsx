'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DICTIONARIES, LANGUAGES, Language, TranslationDictionary, detectBrowserLanguage } from '@/lib/i18n'
import { internalFetch } from '@/lib/internal-fetch'

interface I18nContextType {
  lang: Language
  t: TranslationDictionary
  setLang: (lang: Language) => void
  detectedCountry?: string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'pt',
  t: DICTIONARIES.pt,
  setLang: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('pt')
  const [detectedCountry, setDetectedCountry] = useState<string>('BR')

  useEffect(() => {
    // 1. Check browser storage first
    const local = localStorage.getItem('griffo_lang') as Language
    if (local && LANGUAGES.includes(local)) {
      setLangState(local)
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
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
