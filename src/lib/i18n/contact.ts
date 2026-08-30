import type { Language } from './index'

export const CONTACT_EMAIL = 'contact@griffo.work'
export const SALES_EMAIL = 'sales@griffo.work'

export function contactEmail(_lang?: Language): string {
  return CONTACT_EMAIL
}

const CONTACT_SUBJECTS: Record<Language, string> = {
  pt: 'Contato - GriffoWork',
  en: 'Contact - GriffoWork',
  es: 'Contacto - GriffoWork',
  de: 'Kontakt - GriffoWork',
  fr: 'Contact - GriffoWork',
  it: 'Contatto - GriffoWork',
  ja: 'お問い合わせ - GriffoWork',
  nl: 'Contact - GriffoWork',
  sv: 'Kontakt - GriffoWork',
  zh: '联系我们 - GriffoWork',
  ar: 'اتصل بنا - GriffoWork',
  ko: '문의하기 - GriffoWork',
}

export function contactMailto(lang: Language): string {
  const subject = CONTACT_SUBJECTS[lang] || CONTACT_SUBJECTS.pt
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

const SALES_SUBJECTS: Record<Language, string> = {
  pt: 'Griffo para empresas',
  es: 'Griffo para empresas',
  en: 'Griffo for companies',
  de: 'Griffo für Unternehmen',
  fr: 'Griffo pour entreprises',
  it: 'Griffo per aziende',
  ja: '法人向けGriffoWork導入のご相談',
  nl: 'Griffo voor bedrijven',
  sv: 'Griffo för företag',
  zh: 'GriffoWork 企业合作咨询',
  ar: 'GriffoWork للشركات والمؤسسات',
  ko: 'GriffoWork 기업 도입 및 제휴 문의',
}

export function salesMailto(lang: Language): string {
  const subject = SALES_SUBJECTS[lang] || SALES_SUBJECTS.pt
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}
