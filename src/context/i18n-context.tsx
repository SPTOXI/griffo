'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DICTIONARIES, Language, TranslationDictionary, detectBrowserLanguage } from '@/lib/i18n'

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
    if (local && ['pt', 'en', 'es'].includes(local)) {
      setLangState(local)
      return
    }

    // 2. Fetch server-side country detection from edge
    fetch('/api/i18n/geo')
      .then((r) => r.json())
      .then((data) => {
        if (data.country) setDetectedCountry(data.country)
        if (data.lang && ['pt', 'en', 'es'].includes(data.lang)) {
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
