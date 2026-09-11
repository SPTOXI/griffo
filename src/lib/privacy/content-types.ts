/**
 * Conteúdo da página pública `/privacy`, por idioma.
 *
 * Mesmo padrão de `lib/enterprise/content-types.ts`: um arquivo por idioma em
 * `locales/`, agregado em `content.ts`. Cada fato descrito aqui precisa ser
 * verificável no código (retenção, sub-processadores, direitos do usuário) —
 * nada de alegação de conformidade sem o mecanismo real por trás. Ver §2.120
 * e §2.121 em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` para a origem de cada dado.
 */

export interface PrivacyDataCategory {
  title: string
  body: string
}

export interface PrivacySubProcessor {
  name: string
  purpose: string
}

export interface PrivacyRetentionRow {
  category: string
  period: string
}

export interface PrivacyRight {
  title: string
  body: string
}

export interface PrivacyContent {
  metaTitle: string
  metaDescription: string
  breadcrumbHome: string
  title: string
  lastUpdatedLabel: string
  lastUpdatedValue: string
  intro: string[]

  dataWeCollectHeading: string
  dataCategories: PrivacyDataCategory[]

  howWeUseHeading: string
  howWeUseItems: string[]

  sharingHeading: string
  sharingIntro: string
  subProcessors: PrivacySubProcessor[]

  transfersHeading: string
  transfersBody: string[]

  retentionHeading: string
  retentionIntro: string
  retentionRows: PrivacyRetentionRow[]

  rightsHeading: string
  rightsIntro: string
  rights: PrivacyRight[]

  cookiesHeading: string
  cookiesBody: string[]

  securityHeading: string
  securityBody: string[]

  childrenHeading: string
  childrenBody: string

  changesHeading: string
  changesBody: string

  contactHeading: string
  /** Contém o token literal "{email}". */
  contactBody: string
}
