/**
 * O que a IA pode dizer sobre o perfil a partir de um currículo, e o que dela
 * se aceita.
 *
 * ## Por que existe
 *
 * O currículo já traz cargo, senioridade, área, competências, formação e tempo
 * de casa. O Perfil Profissional pedia tudo isso de novo, à mão. Quem já tinha
 * feito uma análise digitava duas vezes — e quem não digitava ficava sem
 * Radar, porque `runRadar` só avalia usuários COM perfil.
 *
 * ## A regra que governa este arquivo
 *
 * Uma sugestão errada é pior que sugestão nenhuma: ela entra no perfil, muda o
 * mercado, muda o filtro duro, e a pessoa não tem como saber de onde veio. Por
 * isso:
 *
 * - Campo que a IA não achou vem **ausente**, nunca chutado.
 * - Valor fora do conjunto permitido é **descartado**, não aproximado.
 * - Nada aqui grava: a saída é sugestão, e quem grava é a pessoa depois de ver.
 *
 * O que NÃO se extrai daqui, de propósito: país, mercado-alvo, pretensão
 * salarial, disponibilidade para mudança. Um endereço no cabeçalho do currículo
 * diz onde a pessoa morava quando o escreveu, não onde quer trabalhar — e essas
 * quatro respostas mudam o produto inteiro. Elas continuam sendo escolha
 * explícita.
 */

import {
  EDUCATION_LEVELS,
  SENIORITY_LEVELS,
  type EducationLevel,
  type ProfessionalProfile,
  type Seniority,
} from './index'

/** O que se aceita da extração: um subconjunto do perfil, todo opcional. */
export type ProfileSuggestion = Partial<
  Pick<
    ProfessionalProfile,
    | 'currentTitle'
    | 'seniority'
    | 'field'
    | 'specializations'
    | 'skills'
    | 'yearsExperience'
    | 'educationLevel'
    | 'targetRoles'
  >
>

export const PROFILE_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'currentTitle',
    'seniority',
    'field',
    'specializations',
    'skills',
    'yearsExperience',
    'educationLevel',
    'targetRoles',
  ],
  properties: {
    currentTitle: { type: ['string', 'null'] },
    seniority: { type: ['string', 'null'], enum: [...SENIORITY_LEVELS, null] },
    field: { type: ['string', 'null'] },
    specializations: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
    yearsExperience: { type: ['number', 'null'] },
    educationLevel: { type: ['string', 'null'], enum: [...EDUCATION_LEVELS, null] },
    targetRoles: { type: 'array', items: { type: 'string' } },
  },
} as const

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  // Um marcador não preenchido — "[cargo]", "não informado" — é ausência
  // disfarçada de resposta. Tratá-lo como valor põe literalmente a palavra
  // "não informado" no perfil da pessoa.
  if (/^\[.*\]$/.test(trimmed)) return undefined
  if (/^(não informado|nao informado|n\/a|desconhecido|unknown|none)$/i.test(trimmed)) return undefined
  return trimmed.slice(0, maxLength)
}

function list(value: unknown, maxItems: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const seen = new Set<string>()
  const out: string[] = []

  for (const item of value) {
    const cleaned = text(item, 60)
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
    if (out.length >= maxItems) break
  }

  // Lista vazia é ausência, não "a pessoa não tem competência nenhuma".
  return out.length > 0 ? out : undefined
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T) : undefined
}

function years(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return undefined
  // Zero é resposta legítima (primeiro emprego). Negativo e meio século de
  // carreira não são — são erro de leitura, e um deles distorce a senioridade
  // em todo o matching.
  if (n < 0 || n > 60) return undefined
  return Math.round(n)
}

/**
 * Converte a resposta da IA em sugestão.
 *
 * Não lança por campo ruim: descarta o campo e segue. Um currículo de estágio
 * sem formação declarada não deve derrubar a extração de cargo e competências.
 * Só lança quando a resposta sequer é JSON — aí não há o que aproveitar.
 */
export function parseProfileExtraction(rawText: string): ProfileSuggestion {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu a leitura do currículo em formato inválido.')
  }

  const suggestion: ProfileSuggestion = {}

  const currentTitle = text(parsed?.currentTitle, 120)
  if (currentTitle) suggestion.currentTitle = currentTitle

  const seniority = oneOf<Seniority>(parsed?.seniority, SENIORITY_LEVELS)
  if (seniority) suggestion.seniority = seniority

  const field = text(parsed?.field, 80)
  if (field) suggestion.field = field

  const specializations = list(parsed?.specializations, 8)
  if (specializations) suggestion.specializations = specializations

  const skills = list(parsed?.skills, 20)
  if (skills) suggestion.skills = skills

  const yearsExperience = years(parsed?.yearsExperience)
  if (yearsExperience !== undefined) suggestion.yearsExperience = yearsExperience

  const educationLevel = oneOf<EducationLevel>(parsed?.educationLevel, EDUCATION_LEVELS)
  if (educationLevel) suggestion.educationLevel = educationLevel

  const targetRoles = list(parsed?.targetRoles, 6)
  if (targetRoles) suggestion.targetRoles = targetRoles

  return suggestion
}

/**
 * Aplica a sugestão sobre o perfil atual, **sem sobrescrever o que já existe**.
 *
 * O que a pessoa escreveu vale mais que o que a máquina leu: ela sabe que mudou
 * de área, o currículo não. Por isso a sugestão só preenche buraco.
 *
 * Devolve também quais campos foram tocados, para que a tela possa mostrá-los —
 * uma alteração que aparece sozinha no formulário é uma alteração que a pessoa
 * não revisou.
 */
export function applySuggestion(
  current: ProfessionalProfile,
  suggestion: ProfileSuggestion
): { profile: ProfessionalProfile; filled: string[] } {
  const profile = { ...current }
  const filled: string[] = []

  const fillScalar = <K extends keyof ProfessionalProfile>(key: K) => {
    const value = suggestion[key as keyof ProfileSuggestion]
    if (value === undefined) return
    if (current[key] !== null && current[key] !== '') return
    profile[key] = value as ProfessionalProfile[K]
    filled.push(String(key))
  }

  const fillList = <K extends 'specializations' | 'skills' | 'targetRoles'>(key: K) => {
    const value = suggestion[key]
    if (value === undefined) return
    if (current[key].length > 0) return
    profile[key] = value
    filled.push(key)
  }

  fillScalar('currentTitle')
  fillScalar('seniority')
  fillScalar('field')
  fillScalar('yearsExperience')
  fillScalar('educationLevel')
  fillList('specializations')
  fillList('skills')
  fillList('targetRoles')

  return { profile, filled }
}
