import { z } from 'zod'
import type { Language } from '../i18n/types'
import { SECTION_TITLES } from '../resume-rewrite/section-titles'

/**
 * O criador de currículo da home (§2.160): as respostas e o texto montado a
 * partir delas. Puro e seguro para o navegador — a tela valida com o mesmo
 * esquema que a rota.
 *
 * O texto montado aqui NÃO passa por IA: são as palavras da própria pessoa,
 * organizadas em seções. É ele que vai para o teste de legibilidade, para o
 * cruzamento com vagas e, depois do pagamento, para o app como o currículo
 * original — a reescrita completa da Análise Completa parte dele, com a regra
 * de não inventar fato que já vale para qualquer currículo.
 */

export const MAX_EXPERIENCES = 6
export const MAX_EDUCATION = 4

const line = (max: number) => z.string().trim().max(max)

export const builderExperienceSchema = z.object({
  role: line(120).min(2),
  company: line(120).default(''),
  period: line(60).default(''),
  description: line(1500).min(10),
})

export const builderEducationSchema = z.object({
  course: line(160).min(2),
  institution: line(160).default(''),
  period: line(60).default(''),
})

export const builderAnswersSchema = z.object({
  fullName: line(120).min(2),
  phone: line(40).default(''),
  city: line(120).default(''),
  targetRole: line(120).min(2),
  /** Nunca teve emprego formal: as "experiências" são bicos, voluntariado, projetos. */
  noFormalJob: z.boolean().default(false),
  experiences: z.array(builderExperienceSchema).min(1).max(MAX_EXPERIENCES),
  education: z.array(builderEducationSchema).max(MAX_EDUCATION).default([]),
  skills: line(1000).default(''),
  languages: line(300).default(''),
})

export type BuilderExperience = z.infer<typeof builderExperienceSchema>
export type BuilderEducation = z.infer<typeof builderEducationSchema>
export type BuilderAnswers = z.infer<typeof builderAnswersSchema>

/** Rótulo do cargo pretendido no topo do currículo montado. */
const OBJECTIVE: Record<Language, string> = {
  pt: 'Objetivo',
  en: 'Objective',
  es: 'Objetivo',
  de: 'Angestrebte Position',
  fr: 'Objectif',
  it: 'Obiettivo',
  nl: 'Doel',
  sv: 'Mål',
  ja: '希望職種',
  zh: '求职意向',
  ar: 'الهدف الوظيفي',
  ko: '희망 직무',
}

function heading(company: string, role: string, period: string): string {
  const where = [role, company].filter(Boolean).join(' — ')
  return period ? `${where} (${period})` : where
}

/** O currículo em texto, com as palavras da pessoa, nas seções do idioma da página. */
export function assembleResumeText(a: BuilderAnswers, lang: Language): string {
  const t = SECTION_TITLES[lang] ?? SECTION_TITLES.en
  const out: string[] = [a.fullName]
  const contact = [a.city, a.phone].filter(Boolean).join(' · ')
  if (contact) out.push(contact)
  out.push(`${OBJECTIVE[lang] ?? OBJECTIVE.en}: ${a.targetRole}`, '', `## ${t.experience}`)
  for (const e of a.experiences) {
    out.push(heading(e.company, e.role, e.period), e.description, '')
  }
  if (a.education.length) {
    out.push(`## ${t.education}`)
    for (const e of a.education) out.push(heading(e.institution, e.course, e.period))
    out.push('')
  }
  if (a.skills) out.push(`## ${t.skills}`, a.skills, '')
  if (a.languages) out.push(`## ${t.languages}`, a.languages, '')
  return out.join('\n').trim()
}

/**
 * O que a tela mostra de graça e o que fica trancado.
 *
 * Só a primeira experiência sai escrita. Do resto vai a CONTAGEM, nunca o
 * texto: a tela desenha linhas borradas no lugar, e quem abrir o inspetor do
 * navegador não encontra nada para ler — mesmo cuidado das vagas trancadas
 * (`match-preview/result.ts`).
 */
export interface BuilderTeaser {
  first: { role: string; company: string; period: string; bullets: string[] }
  locked: { experiences: number; education: number; skills: boolean; languages: boolean }
}

export function lockedPartsOf(a: BuilderAnswers): BuilderTeaser['locked'] {
  return {
    experiences: a.experiences.length - 1,
    education: a.education.length,
    skills: a.skills.length > 0,
    languages: a.languages.length > 0,
  }
}

/** Lê o que foi gravado na linha do lead. `null` quando não é um currículo criado aqui. */
export function parseBuilderTeaser(raw: string | null | undefined): BuilderTeaser | null {
  if (!raw) return null
  try {
    const t = JSON.parse(raw)
    if (!t?.first || !Array.isArray(t.first.bullets) || !t.locked) return null
    return {
      first: {
        role: String(t.first.role ?? ''),
        company: String(t.first.company ?? ''),
        period: String(t.first.period ?? ''),
        bullets: t.first.bullets.filter((b: unknown): b is string => typeof b === 'string').slice(0, 5),
      },
      locked: {
        experiences: Math.max(0, Number(t.locked.experiences) || 0),
        education: Math.max(0, Number(t.locked.education) || 0),
        skills: Boolean(t.locked.skills),
        languages: Boolean(t.locked.languages),
      },
    }
  } catch {
    return null
  }
}

/**
 * Tópicos da IA, limpos: sem marcador no começo, sem vazio, até 5, cada um
 * com teto de tamanho. A resposta do modelo é texto de terceiro até aqui.
 */
export function cleanBullets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((b): b is string => typeof b === 'string')
    .map((b) => b.replace(/^[\s•\-*–]+/, '').trim().slice(0, 280))
    .filter((b) => b.length >= 8)
    .slice(0, 5)
}
