/**
 * Perfil Profissional — leitura, escrita e o que ele decide.
 *
 * Este módulo é a única porta para o `ProfessionalProfile`. Nenhuma rota deve
 * fazer `JSON.parse` dos campos de lista por conta própria: um perfil salvo por
 * uma versão antiga da tela, ou corrompido por qualquer motivo, derrubaria a
 * rota inteira em vez de degradar para "campo não preenchido".
 *
 * ## O que ele decide
 *
 * Duas coisas, e as duas vinham sendo decididas por dados errados:
 *
 * 1. **O mercado profissional.** `resolveMarket` sempre aceitou um
 *    `targetCountry`, e até aqui ninguém o preenchia — o mercado caía na
 *    residência ou, pior, no idioma da interface. `marketInputFrom` é o elo que
 *    faltava.
 * 2. **O idioma do currículo.** Separado do idioma da interface (§32): quem
 *    mora no Brasil e busca vaga nos Estados Unidos lê a tela em português e
 *    precisa do currículo em inglês. Sem esta distinção, o idioma da tela
 *    decidia o idioma do documento.
 *
 * ## O que ele NÃO decide
 *
 * Preço. A moeda e o valor cobrados saem do país do meio de pagamento, em
 * `lib/pricing/`. `salaryCurrency` e `displayCurrency` daqui são pretensão e
 * exibição — se algum dia alguém derivar cobrança destes campos, terá
 * reintroduzido a confusão que este arquivo existe para impedir.
 *
 * Client-safe: sem Prisma, sem `server-only`. A tela usa os mesmos tipos e a
 * mesma validação que a rota.
 */

import { z } from 'zod'
import type { Language } from '../i18n'
import type { MarketResolutionInput } from '../market'

/** Senioridade, do início ao topo. A ordem é usada pela tela. */
export const SENIORITY_LEVELS = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'principal',
  'director',
  'executive',
] as const
export type Seniority = (typeof SENIORITY_LEVELS)[number]

export const EDUCATION_LEVELS = [
  'none',
  'high_school',
  'technical',
  'bachelor',
  'postgrad',
  'master',
  'phd',
] as const
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const
export type WorkMode = (typeof WORK_MODES)[number]

export const WEEKLY_HOURS = ['full_time', 'part_time', 'flexible'] as const
export type WeeklyHours = (typeof WEEKLY_HOURS)[number]

export const SALARY_PERIODS = ['year', 'month', 'hour'] as const
export type SalaryPeriod = (typeof SALARY_PERIODS)[number]

export const LANGUAGE_LEVELS = ['basic', 'intermediate', 'advanced', 'fluent', 'native'] as const
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number]

export interface SpokenLanguage {
  code: string
  level: LanguageLevel
}

/** O perfil como o resto do código o enxerga: listas são listas. */
export interface ProfessionalProfile {
  currentTitle: string | null
  seniority: Seniority | null
  field: string | null
  specializations: string[]
  skills: string[]
  yearsExperience: number | null
  educationLevel: EducationLevel | null

  targetRoles: string[]
  targetFields: string[]
  targetIndustries: string[]
  careerGoal: string | null

  residenceCountry: string | null
  residenceRegion: string | null
  residenceCity: string | null
  primaryMarket: string | null
  alternativeMarkets: string[]
  openToRelocation: boolean
  openToInternationalRemote: boolean

  workModes: WorkMode[]
  contractTypes: string[]
  weeklyHours: WeeklyHours | null

  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: SalaryPeriod | null

  resumeLanguage: Language | null
  communicationLanguage: Language | null
  spokenLanguages: SpokenLanguage[]

  displayCurrency: string | null
}

/** Perfil vazio. Um usuário sem perfil não é um erro — é o estado inicial. */
export const EMPTY_PROFILE: ProfessionalProfile = {
  currentTitle: null,
  seniority: null,
  field: null,
  specializations: [],
  skills: [],
  yearsExperience: null,
  educationLevel: null,
  targetRoles: [],
  targetFields: [],
  targetIndustries: [],
  careerGoal: null,
  residenceCountry: null,
  residenceRegion: null,
  residenceCity: null,
  primaryMarket: null,
  alternativeMarkets: [],
  openToRelocation: false,
  openToInternationalRemote: false,
  workModes: [],
  contractTypes: [],
  weeklyHours: null,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  salaryPeriod: null,
  resumeLanguage: null,
  communicationLanguage: null,
  spokenLanguages: [],
  displayCurrency: null,
}

const SUPPORTED_LANGUAGES: Language[] = ['pt', 'en', 'es']

const trimmed = z.string().trim()
const optionalText = (max: number) =>
  trimmed.max(max).transform((v) => (v === '' ? null : v)).nullable().optional()

const stringList = (max: number, maxItems: number) =>
  z.array(trimmed.min(1).max(max)).max(maxItems).optional()

const spokenLanguageSchema = z.object({
  code: trimmed.min(2).max(8),
  level: z.enum(LANGUAGE_LEVELS),
})

/**
 * O que a API aceita.
 *
 * Tudo opcional: a tela salva em partes, e exigir o perfil inteiro a cada
 * gravação transformaria "preencher aos poucos" em "preencher tudo ou nada".
 */
export const professionalProfileInputSchema = z
  .object({
    currentTitle: optionalText(160),
    seniority: z.enum(SENIORITY_LEVELS).nullable().optional(),
    field: optionalText(120),
    specializations: stringList(80, 20),
    skills: stringList(80, 60),
    yearsExperience: z.number().int().min(0).max(70).nullable().optional(),
    educationLevel: z.enum(EDUCATION_LEVELS).nullable().optional(),

    targetRoles: stringList(160, 10),
    targetFields: stringList(120, 10),
    targetIndustries: stringList(120, 15),
    careerGoal: optionalText(2000),

    residenceCountry: optionalText(2),
    residenceRegion: optionalText(120),
    residenceCity: optionalText(120),
    primaryMarket: optionalText(16),
    alternativeMarkets: z.array(trimmed.min(2).max(16)).max(10).optional(),
    openToRelocation: z.boolean().optional(),
    openToInternationalRemote: z.boolean().optional(),

    workModes: z.array(z.enum(WORK_MODES)).max(3).optional(),
    contractTypes: stringList(80, 12),
    weeklyHours: z.enum(WEEKLY_HOURS).nullable().optional(),

    salaryMin: z.number().min(0).max(1_000_000_000).nullable().optional(),
    salaryMax: z.number().min(0).max(1_000_000_000).nullable().optional(),
    salaryCurrency: optionalText(8),
    salaryPeriod: z.enum(SALARY_PERIODS).nullable().optional(),

    resumeLanguage: z.enum(['pt', 'en', 'es']).nullable().optional(),
    communicationLanguage: z.enum(['pt', 'en', 'es']).nullable().optional(),
    spokenLanguages: z.array(spokenLanguageSchema).max(15).optional(),

    displayCurrency: optionalText(8),
  })
  .refine(
    (v) =>
      v.salaryMin == null ||
      v.salaryMax == null ||
      v.salaryMax >= v.salaryMin,
    { message: 'A pretensão máxima não pode ser menor que a mínima.', path: ['salaryMax'] }
  )

export type ProfessionalProfileInput = z.infer<typeof professionalProfileInputSchema>

/**
 * Lê uma lista gravada como JSON.
 *
 * Nunca lança. Um campo corrompido vira lista vazia — o perfil perde um dado,
 * o produto continua de pé. Lançar aqui derrubaria toda rota que carrega o
 * perfil, e o perfil é lido no caminho da análise.
 */
function readList(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v ?? '').trim()).filter(Boolean)
  } catch {
    return []
  }
}

function readSpokenLanguages(raw: string | null | undefined): SpokenLanguage[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        code: String(item?.code ?? '').trim().toLowerCase(),
        level: item?.level,
      }))
      .filter(
        (item): item is SpokenLanguage =>
          Boolean(item.code) && (LANGUAGE_LEVELS as readonly string[]).includes(item.level)
      )
  } catch {
    return []
  }
}

function readEnum<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[]
): T | null {
  const value = (raw || '').trim()
  return (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function upperOrNull(raw: string | null | undefined): string | null {
  const value = (raw || '').trim().toUpperCase()
  return value || null
}

function textOrNull(raw: string | null | undefined): string | null {
  const value = (raw || '').trim()
  return value || null
}

/** A linha do banco, no formato que o resto do código espera. */
export function fromRecord(row: Record<string, any> | null | undefined): ProfessionalProfile {
  if (!row) return { ...EMPTY_PROFILE }

  return {
    currentTitle: textOrNull(row.currentTitle),
    seniority: readEnum(row.seniority, SENIORITY_LEVELS),
    field: textOrNull(row.field),
    specializations: readList(row.specializations),
    skills: readList(row.skills),
    yearsExperience: typeof row.yearsExperience === 'number' ? row.yearsExperience : null,
    educationLevel: readEnum(row.educationLevel, EDUCATION_LEVELS),

    targetRoles: readList(row.targetRoles),
    targetFields: readList(row.targetFields),
    targetIndustries: readList(row.targetIndustries),
    careerGoal: textOrNull(row.careerGoal),

    residenceCountry: upperOrNull(row.residenceCountry),
    residenceRegion: textOrNull(row.residenceRegion),
    residenceCity: textOrNull(row.residenceCity),
    primaryMarket: upperOrNull(row.primaryMarket),
    alternativeMarkets: readList(row.alternativeMarkets).map((m) => m.toUpperCase()),
    openToRelocation: Boolean(row.openToRelocation),
    openToInternationalRemote: Boolean(row.openToInternationalRemote),

    workModes: readList(row.workModes).filter((m): m is WorkMode =>
      (WORK_MODES as readonly string[]).includes(m)
    ),
    contractTypes: readList(row.contractTypes),
    weeklyHours: readEnum(row.weeklyHours, WEEKLY_HOURS),

    salaryMin: typeof row.salaryMin === 'number' ? row.salaryMin : null,
    salaryMax: typeof row.salaryMax === 'number' ? row.salaryMax : null,
    salaryCurrency: upperOrNull(row.salaryCurrency),
    salaryPeriod: readEnum(row.salaryPeriod, SALARY_PERIODS),

    resumeLanguage: readEnum(row.resumeLanguage, SUPPORTED_LANGUAGES),
    communicationLanguage: readEnum(row.communicationLanguage, SUPPORTED_LANGUAGES),
    spokenLanguages: readSpokenLanguages(row.spokenLanguages),

    displayCurrency: upperOrNull(row.displayCurrency),
  }
}

/**
 * Converte a entrada validada em colunas.
 *
 * Só devolve o que veio na entrada: uma gravação parcial não pode apagar o que
 * ela nem mencionou. `null` explícito limpa o campo; ausente não o toca.
 */
export function toRecordData(input: ProfessionalProfileInput): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const setText = (key: keyof ProfessionalProfileInput, transform?: (v: string) => string) => {
    const value = input[key]
    if (value === undefined) return
    data[key] = value === null ? null : transform ? transform(String(value)) : value
  }
  const setList = (key: keyof ProfessionalProfileInput) => {
    const value = input[key]
    if (value === undefined) return
    data[key] = JSON.stringify(value)
  }
  const setRaw = (key: keyof ProfessionalProfileInput) => {
    const value = input[key]
    if (value === undefined) return
    data[key] = value
  }

  setText('currentTitle')
  setRaw('seniority')
  setText('field')
  setList('specializations')
  setList('skills')
  setRaw('yearsExperience')
  setRaw('educationLevel')

  setList('targetRoles')
  setList('targetFields')
  setList('targetIndustries')
  setText('careerGoal')

  setText('residenceCountry', (v) => v.toUpperCase())
  setText('residenceRegion')
  setText('residenceCity')
  setText('primaryMarket', (v) => v.toUpperCase())
  if (input.alternativeMarkets !== undefined) {
    data.alternativeMarkets = JSON.stringify(input.alternativeMarkets.map((m) => m.toUpperCase()))
  }
  setRaw('openToRelocation')
  setRaw('openToInternationalRemote')

  setList('workModes')
  setList('contractTypes')
  setRaw('weeklyHours')

  setRaw('salaryMin')
  setRaw('salaryMax')
  setText('salaryCurrency', (v) => v.toUpperCase())
  setRaw('salaryPeriod')

  setRaw('resumeLanguage')
  setRaw('communicationLanguage')
  if (input.spokenLanguages !== undefined) {
    data.spokenLanguages = JSON.stringify(input.spokenLanguages)
  }

  setText('displayCurrency', (v) => v.toUpperCase())

  return data
}

/**
 * O elo que faltava: perfil → mercado.
 *
 * `resolveMarket` sempre aceitou um `targetCountry` e, até este módulo existir,
 * ninguém o preenchia. Sem ele o mercado caía na residência — palpite razoável,
 * mas errado justamente para quem procura trabalho fora — ou no idioma da
 * interface, que é o pior sinal de todos.
 *
 * `primaryMarket` é o mercado declarado. Quando ele falta mas a pessoa se diz
 * aberta a trabalho remoto internacional, o mercado é o global: alguém que
 * concorre a vaga remota mundo afora não deve ser avaliado pelas convenções do
 * país onde dorme.
 *
 * `paymentCountry` não entra aqui, e não deve entrar nunca.
 */
export function marketInputFrom(
  profile: ProfessionalProfile | null | undefined,
  fallback: { residenceCountry?: string | null; language?: Language | null } = {}
): MarketResolutionInput {
  const targetCountry =
    profile?.primaryMarket ||
    (profile?.openToInternationalRemote ? 'GLOBAL' : null) ||
    null

  return {
    targetCountry,
    residenceCountry: profile?.residenceCountry || fallback.residenceCountry || null,
    language: fallback.language ?? null,
  }
}

/**
 * O idioma em que o currículo e a carta devem sair.
 *
 * Preferência declarada > idioma predominante das vagas do mercado-alvo >
 * idioma da interface. O último é o fallback fraco: a tela em português não
 * diz nada sobre o idioma em que a pessoa vai se candidatar.
 */
export function resumeLanguageFor(
  profile: ProfessionalProfile | null | undefined,
  marketJobLanguage: Language,
  interfaceLanguage: Language
): Language {
  if (profile?.resumeLanguage) return profile.resumeLanguage
  if (profile?.primaryMarket) return marketJobLanguage
  return interfaceLanguage
}

/**
 * O perfil resumido para dentro de um prompt.
 *
 * Só entra o que foi declarado. Um campo vazio não vira "não informado" no
 * texto: linha nenhuma é melhor que uma linha dizendo que não há linha, porque
 * o modelo trata ausência como ausência e não gasta atenção com ela.
 *
 * Devolve string vazia quando não há nada declarado — e quem chama deve omitir
 * o bloco inteiro nesse caso.
 */
/**
 * Para que serve o bloco de perfil nesta chamada.
 *
 * - `document`: a IA está avaliando UM DOCUMENTO — currículo, reescrita, carta.
 *   **O perfil não entra.** Cada análise responde pelo documento que recebeu, e
 *   por mais nada.
 * - `career`: a IA está falando sobre A PESSOA — orientação de carreira. Aqui o
 *   perfil declarado é o assunto, e entra inteiro.
 */
export type ProfileContextScope = 'document' | 'career'

/**
 * O perfil como bloco de prompt.
 *
 * ## O erro que o `scope` corrige
 *
 * O Perfil Profissional é UM POR USUÁRIO, e passou a ser preenchido
 * automaticamente a partir do currículo. Isso é certo enquanto a pessoa tem um
 * currículo só. Quando ela envia um segundo, de outra profissão, o perfil
 * continua descrevendo o primeiro — e este bloco ia inteiro para o prompt,
 * antes do currículo, dizendo "Cargo atual: Biomédico" acima do currículo de um
 * advogado.
 *
 * O texto do cabeçalho piorava: ele mandava a IA usar o perfil como objetivo do
 * candidato e **não contradizê-lo sem motivo**. Ou seja, diante do conflito
 * entre o documento real e um perfil desatualizado, o sistema instruía a IA a
 * ficar com o perfil. O laudo de um currículo de advogado saía sobre
 * biomedicina, e nada no caminho registrava isso como erro.
 *
 * Afirmar "Cargo atual: Biomédico" ao analisar o currículo de um advogado é o
 * sistema inventando um fato sobre o candidato — §43 pela porta dos fundos.
 *
 * ## Por que o corte é total, e não campo a campo
 *
 * A primeira versão desta correção separava o perfil em duas metades: fora os
 * campos que o currículo carrega (cargo, área, senioridade, experiência,
 * cargos-alvo), dentro as preferências que ele não carrega (país, mudança,
 * modelo de trabalho, pretensão, idiomas).
 *
 * Só que a regra do produto é mais simples e mais forte: **cada análise é
 * única e não se baseia na anterior**. Um laudo tem de responder pelo documento
 * que recebeu, e por mais nada. Meia dúzia de campos herdados continuam sendo
 * herança, e a divisão campo a campo só desloca a pergunta — a cada campo novo
 * no perfil, alguém teria de decidir de que lado ele cai, e um erro nessa
 * decisão volta a contaminar em silêncio.
 *
 * O que o documento precisa saber sobre contexto continua chegando, por
 * caminhos que não são herança de currículo nenhum:
 *
 * - **O mercado** (`marketPromptContext`), que decide convenção de formato,
 *   foto, número de páginas e idioma das vagas. Ele sai do mercado declarado
 *   ou do país de acesso — nunca de um currículo anterior.
 * - **A vaga-alvo**, que fica no PRÓPRIO currículo (`targetJob`,
 *   `targetJobDescription`), por currículo e não por usuário.
 */
export function profilePromptContext(
  profile: ProfessionalProfile | null | undefined,
  // O padrão é o lado seguro. Quem quer o perfil inteiro — só a orientação de
  // carreira — pede por extenso; esquecer de declarar não pode reintroduzir o
  // vazamento entre currículos.
  scope: ProfileContextScope = 'document'
): string {
  if (!profile) return ''

  // O corte é aqui, e antes de qualquer campo: o que não é montado não vaza.
  if (scope === 'document') return ''

  const lines: string[] = []
  const add = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return
    lines.push(`- ${label}: ${value}`)
  }
  const addList = (label: string, values: string[]) => {
    if (!values.length) return
    lines.push(`- ${label}: ${values.join(', ')}`)
  }

  add('Cargo atual', profile.currentTitle)
  add('Senioridade', profile.seniority)
  add('Área', profile.field)
  addList('Especializações', profile.specializations)
  add('Anos de experiência', profile.yearsExperience)
  addList('Cargos-alvo', profile.targetRoles)
  addList('Áreas-alvo', profile.targetFields)
  addList('Setores de interesse', profile.targetIndustries)
  add('Objetivo de carreira', profile.careerGoal)

  if (profile.residenceCity || profile.residenceCountry) {
    add('Reside em', [profile.residenceCity, profile.residenceRegion, profile.residenceCountry].filter(Boolean).join(', '))
  }
  add('Mercado principal desejado', profile.primaryMarket)
  addList('Mercados alternativos', profile.alternativeMarkets)
  if (profile.openToRelocation) lines.push('- Disponível para mudar de país')
  if (profile.openToInternationalRemote) lines.push('- Aceita trabalho remoto para outro país')

  addList('Modelos de trabalho aceitos', profile.workModes)
  addList('Tipos de contrato aceitos', profile.contractTypes)
  add('Jornada', profile.weeklyHours)

  if (profile.salaryMin != null || profile.salaryMax != null) {
    const currency = profile.salaryCurrency || ''
    const period = profile.salaryPeriod ? `/${profile.salaryPeriod}` : ''
    const range =
      profile.salaryMin != null && profile.salaryMax != null
        ? `${profile.salaryMin} a ${profile.salaryMax}`
        : String(profile.salaryMin ?? profile.salaryMax)
    add('Pretensão salarial', `${currency} ${range}${period}`.trim())
  }

  if (profile.spokenLanguages.length) {
    addList(
      'Idiomas',
      profile.spokenLanguages.map((l) => `${l.code} (${l.level})`)
    )
  }

  if (!lines.length) return ''

  // O cabeçalho dizia "não contradiga sem motivo" — era ele que fazia a IA
  // preferir um perfil desatualizado ao documento que tinha à frente. Some
  // junto com o escopo de documento; no de carreira não há documento com que
  // conflitar, e o perfil é o próprio assunto.
  return `PERFIL PROFISSIONAL DECLARADO PELO CANDIDATO (use como objetivo dele; não invente o que não está aqui):
${lines.join('\n')}`
}
