/**
 * Normalização de vagas (§13).
 *
 * Converte o que qualquer fonte devolveu no formato interno comum. É a fronteira
 * entre "o mundo lá fora, que é inconsistente" e "o resto do Griffo, que pode
 * contar com um formato só".
 *
 * ## Duas regras que governam este arquivo
 *
 * 1. **Não inventar.** Se a fonte não disse a senioridade, a senioridade é
 *    desconhecida — não é "pleno porque a maioria é". A única inferência
 *    permitida é a que se lê do próprio texto da vaga (senioridade no título,
 *    modelo de trabalho na localização), e ainda assim ela é registrada como
 *    derivada, não como declarada pela fonte.
 * 2. **Ausência tem motivo.** Todo campo que fica sem valor entra em
 *    `unknownFields` com a razão. Ver o comentário em `types.ts` sobre por que
 *    os três motivos não podem virar um `null` só.
 *
 * ## O mínimo para uma vaga existir
 *
 * Empresa, título e URL de candidatura. Sem qualquer um dos três não há vaga —
 * há um registro incompleto que ocuparia espaço e apareceria em busca. O
 * normalizador recusa, e o adapter conta como item descartado.
 */

import { safeHttpUrl } from '../safe-url'
import { conceptForTitle, foldTitle, seniorityFromTitle } from '../market/taxonomy'
import { marketForCountry } from '../market'
import { inferCountryFromLocation } from './location-country'
import {
  JobNormalizationError,
  type NormalizedJob,
  type RawJob,
  type RemoteType,
  type SalaryPeriod,
  type UnknownReason,
} from './types'

/** Sufixos societários que não distinguem empresa nenhuma. */
const COMPANY_SUFFIXES = [
  'ltda', 'sa', 's a', 'me', 'epp', 'eireli', 'inc', 'llc', 'ltd', 'limited',
  'corp', 'corporation', 'co', 'gmbh', 'ag', 'bv', 'nv', 'sarl', 'sas', 'srl',
  'plc', 'pty', 'oy', 'ab', 'as', 'lda', 'unipessoal',
]

/**
 * Forma canônica do nome da empresa.
 *
 * "Griffo Tecnologia Ltda.", "GRIFFO TECNOLOGIA" e "Griffo Tecnologia Inc" são
 * a mesma empresa para efeito de deduplicação. Sem isto, a mesma vaga vinda de
 * duas fontes que escrevem o nome de formas diferentes entra duas vezes.
 */
export function companyKeyOf(company: string): string {
  const folded = foldTitle(company)
  if (!folded) return ''

  // "S.A." vira os tokens "s" e "a" ao perder a pontuação, e escapa da lista de
  // sufixos, que espera "sa". Juntar sequências de letras soltas resolve esse
  // caso e o de siglas em geral ("H&M" → "hm"), sem risco: letra isolada não
  // distingue empresa nenhuma, e a regra é determinística — a mesma entrada
  // produz sempre a mesma chave, que é o que a deduplicação exige.
  const tokens: string[] = []
  for (const token of folded.split(' ')) {
    if (!token) continue
    const previous = tokens[tokens.length - 1]
    if (token.length === 1 && previous && previous.length <= 2 && /^[a-z]+$/.test(previous)) {
      tokens[tokens.length - 1] = previous + token
    } else {
      tokens.push(token)
    }
  }

  const suffixes = new Set(COMPANY_SUFFIXES.map(foldTitle))
  return tokens.filter((token) => !suffixes.has(token)).join(' ').trim()
}

function text(value: unknown): string | null {
  const v = typeof value === 'string' ? value.trim() : ''
  return v || null
}

function upper(value: unknown, max?: number): string | null {
  const v = text(value)
  if (!v) return null
  const up = v.toUpperCase()
  return max ? up.slice(0, max) : up
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  if (typeof value !== 'string') return null
  // "R$ 8.000,00" / "$80,000" / "80000" — tira tudo que não é dígito ou separador
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return null
  // Último separador decide a parte decimal quando seguido de 1-2 dígitos.
  const normalized = /[.,]\d{1,2}$/.test(cleaned)
    ? cleaned.replace(/[.,](?=.*[.,])/g, '').replace(',', '.')
    : cleaned.replace(/[.,]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const REMOTE_TERMS = ['remote', 'remoto', 'teletrabajo', 'telearbeit', 'home office', 'anywhere', '100% remoto']
const HYBRID_TERMS = ['hybrid', 'hibrido', 'semi presencial', 'semipresencial']
const ONSITE_TERMS = ['onsite', 'on site', 'presencial', 'in office', 'no escritorio']

/**
 * Modelo de trabalho, lido do campo próprio ou do texto da localização.
 *
 * `unknown` é resultado legítimo e frequente: muita vaga não diz. Chutar
 * `onsite` como padrão — que seria o palpite estatístico — faria o filtro duro
 * descartar vagas remotas de quem só aceita remoto.
 */
export function normalizeRemoteType(raw: string | null | undefined, location?: string | null): RemoteType {
  const haystack = `${foldTitle(raw || '')} ${foldTitle(location || '')}`.trim()
  if (!haystack) return 'unknown'

  if (HYBRID_TERMS.some((t) => haystack.includes(foldTitle(t)))) return 'hybrid'
  if (REMOTE_TERMS.some((t) => haystack.includes(foldTitle(t)))) return 'remote'
  if (ONSITE_TERMS.some((t) => haystack.includes(foldTitle(t)))) return 'onsite'
  return 'unknown'
}

const PERIOD_TERMS: Record<SalaryPeriod, string[]> = {
  year: ['year', 'annual', 'anual', 'ano', 'yr', 'jahr', 'an'],
  month: ['month', 'mensal', 'mes', 'monat', 'mois', 'mo'],
  hour: ['hour', 'hora', 'hourly', 'stunde', 'heure', 'hr'],
}

export function normalizeSalaryPeriod(raw: string | null | undefined): SalaryPeriod | null {
  const folded = foldTitle(raw || '')
  if (!folded) return null
  for (const [period, terms] of Object.entries(PERIOD_TERMS) as [SalaryPeriod, string[]][]) {
    if (terms.some((t) => folded.includes(foldTitle(t)))) return period
  }
  return null
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string' || !value.trim()) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function cleanList(value: unknown, max = 40): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    const v = typeof item === 'string' ? item.trim() : ''
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
    if (out.length >= max) break
  }
  return out
}

export interface NormalizeOptions {
  /** Fonte de onde a vaga veio. Entra na chave de deduplicação de reserva. */
  sourceSlug: string
}

/**
 * Converte uma vaga crua no formato interno.
 *
 * Lança `JobNormalizationError` quando falta o mínimo — empresa, título ou URL.
 * Lançar em vez de devolver um registro pela metade é deliberado: uma vaga sem
 * URL de candidatura não é uma vaga com um campo faltando, é uma vaga em que
 * ninguém consegue se candidatar.
 */
export function normalizeJob(raw: RawJob, options: NormalizeOptions): NormalizedJob {
  const company = text(raw.company)
  if (!company) throw new JobNormalizationError('company', 'Vaga sem empresa.')

  const title = text(raw.title)
  if (!title) throw new JobNormalizationError('title', 'Vaga sem cargo.')

  /**
   * A URL de candidatura vem de terceiro — quadro de vagas, agregador, ou o
   * JSON-LD que a própria empresa publica na página de carreira. Ela termina
   * como `href` no e-mail do digest e como argumento de `window.open` no
   * Radar, e nesses dois lugares um `javascript:` executa script na origem da
   * aplicação.
   *
   * A checagem anterior era só "não está vazia". Escapar o HTML na hora de
   * montar o e-mail não cobre isto: o esquema perigoso atravessa o escape
   * intacto, porque não tem nenhum caractere que o escape trate. Quem fecha a
   * porta é a recusa do esquema, e o lugar de fazer isso é aqui — na fronteira
   * onde o dado de fora vira dado interno —, não em cada tela que o exibe.
   *
   * Uma vaga com URL inutilizável é descartada como qualquer outra vaga
   * malformada: sem candidatura possível, ela não serve para ninguém.
   */
  const applicationUrl = safeHttpUrl(text(raw.applicationUrl))
  if (!applicationUrl) {
    throw new JobNormalizationError(
      'applicationUrl',
      'Vaga sem URL de candidatura válida (apenas http e https são aceitos).'
    )
  }

  const unknownFields: Record<string, UnknownReason> = {}
  const notDisclosed = new Set((raw.notDisclosed || []).map((f) => String(f)))

  /** Registra a ausência com o motivo certo, respeitando o que a fonte declarou. */
  const markAbsent = (field: string, reason: UnknownReason = 'unknown') => {
    unknownFields[field] = notDisclosed.has(field) ? 'not_disclosed' : reason
  }

  const region = text(raw.region)
  const city = text(raw.city)

  // A fonte pode não declarar país, mas ainda dizer a cidade — "San
  // Francisco", "Brazil (São Paulo - Hybrid)". Ler o país no mesmo texto de
  // localização é a mesma classe de inferência que `normalizeRemoteType` já
  // faz para o modelo de trabalho (ver o cabeçalho do arquivo e de
  // `location-country.ts`), não uma nova exceção à regra de não inventar.
  const country = upper(raw.country, 2) || inferCountryFromLocation(city, region)
  if (!country) markAbsent('country')

  const remoteType = normalizeRemoteType(raw.remoteType, raw.location)
  if (remoteType === 'unknown') markAbsent('remoteType')

  // Senioridade declarada pela fonte, ou lida do título. A leitura do título é
  // a única inferência permitida aqui, e só acontece quando a fonte silenciou.
  const declaredSeniority = text(raw.seniority)
  const seniority = declaredSeniority || seniorityFromTitle(title)
  if (!seniority) markAbsent('seniority')

  const employmentType = text(raw.employmentType)
  if (!employmentType) markAbsent('employmentType')

  const salaryMin = numeric(raw.salaryMin)
  const salaryMax = numeric(raw.salaryMax)
  if (salaryMin === null && salaryMax === null) markAbsent('salary')

  const currency = upper(raw.currency, 3)
  if (!currency && (salaryMin !== null || salaryMax !== null)) markAbsent('currency')

  const salaryPeriod = normalizeSalaryPeriod(raw.salaryPeriod)
  if (!salaryPeriod && (salaryMin !== null || salaryMax !== null)) markAbsent('salaryPeriod')

  const description = text(raw.description)
  if (!description) markAbsent('description')

  const language = text(raw.language)?.toLowerCase().slice(0, 5) || null
  if (!language) markAbsent('language')

  const publishedAt = parseDate(raw.publishedAt)
  if (!publishedAt) markAbsent('publishedAt')

  const companyKey = companyKeyOf(company)
  const normalizedTitle = conceptForTitle(title)?.id ?? null
  if (!normalizedTitle) markAbsent('normalizedTitle')

  // "Vaga remota" sempre sobrepõe a categoria de função — pedido explícito
  // do operador (15/09/2026): regime de trabalho é o eixo que importa mais
  // pra quem procura remoto, não a área da vaga. `category` só existe pra
  // fontes que categorizam (hoje, só o JobBase); as demais ficam `null`, sem
  // inventar setor pra quem não declarou.
  const category = remoteType === 'remote' ? 'vaga_remota' : text(raw.category)
  if (!category) markAbsent('category')

  const sourceJobId = text(raw.sourceJobId)
  const market = country ? marketForCountry(country).id : null

  return {
    sourceJobId,
    company,
    companyKey,
    title,
    normalizedTitle,
    category,
    country,
    region,
    city,
    remoteType,
    market,
    employmentType,
    seniority,
    salaryMin,
    salaryMax,
    currency,
    salaryPeriod,
    description,
    requirements: cleanList(raw.requirements),
    skills: cleanList(raw.skills),
    language,
    applicationUrl,
    dedupeKey: '', // preenchido por `lib/jobs/dedup.ts`
    publishedAt,
    unknownFields,
  }
}

/**
 * O campo está ausente? E por quê?
 *
 * Existe para que o filtro duro pergunte o motivo antes de descartar. Uma vaga
 * cujo salário a empresa não divulga não deve ser eliminada por não bater com a
 * pretensão — não há com o que bater.
 */
export function absenceReason(job: NormalizedJob, field: string): UnknownReason | null {
  return job.unknownFields[field] ?? null
}
