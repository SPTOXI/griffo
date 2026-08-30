import type { Language } from './index'

const CONTACT_EMAILS: Record<Language, string> = {
  pt: 'contato@griffo.work',
  es: 'contacto@griffo.work',
  en: 'contact@griffo.work',
  de: 'kontakt@griffo.work',
  fr: 'bonjour@griffo.work',
  it: 'contatto@griffo.work',
  ja: 'japan@griffo.work',
}

export function contactEmail(lang: Language): string {
  return CONTACT_EMAILS[lang] || CONTACT_EMAILS.pt
}

export const SALES_EMAIL = 'comercial@griffo.work'

const SALES_SUBJECTS: Record<Language, string> = {
  pt: 'Griffo para empresas',
  es: 'Griffo para empresas',
  en: 'Griffo for companies',
  de: 'Griffo für Unternehmen',
  fr: 'Griffo pour entreprises',
  it: 'Griffo per aziende',
  ja: '法人向けGriffoWork導入のご相談',
}

export function salesMailto(lang: Language): string {
  const subject = SALES_SUBJECTS[lang] || SALES_SUBJECTS.pt
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}

export function contactMailto(lang: Language): string {
  return `mailto:${contactEmail(lang)}`
}
