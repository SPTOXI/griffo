/**
 * A vaga no formato interno comum (§13).
 *
 * Toda vaga coletada é convertida para cá pelo adapter da sua fonte. Do
 * normalizador para a frente, ninguém precisa saber de onde ela veio — e é isso
 * que permite acrescentar fontes sem tocar em matching, radar ou interface.
 *
 * ## Ausência tem três significados, e eles não são o mesmo
 *
 * O §13 é explícito: "Não presuma que todos os mercados terão todos os campos.
 * Campos devem suportar: desconhecido; não informado; não aplicável."
 *
 * - **`unknown`** — a fonte não disse, e não dá para saber. Sem salário no
 *   anúncio, sem indicação em lugar nenhum.
 * - **`not_disclosed`** — a fonte disse explicitamente que não divulga. É
 *   diferente de desconhecido: aqui existe informação sobre a ausência.
 * - **`not_applicable`** — o campo não faz sentido nesta vaga ou neste mercado.
 *   Vínculo CLT numa vaga de contractor internacional, por exemplo.
 *
 * Colapsar os três em `null` parece inofensivo e não é: o filtro duro do Radar
 * precisa distinguir "não sei o salário" de "a empresa não divulga salário"
 * para decidir se elimina a vaga de alguém que declarou pretensão mínima.
 * Eliminar por dado ausente transforma silêncio em rejeição.
 */

/** Por que um campo não tem valor. */
export type UnknownReason = 'unknown' | 'not_disclosed' | 'not_applicable'

export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown'

export type SalaryPeriod = 'year' | 'month' | 'hour'

/** O que um adapter entrega: dados crus, do jeito que a fonte devolveu. */
export interface RawJob {
  sourceJobId?: string | null
  company?: string | null
  title?: string | null
  location?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  remoteType?: string | null
  /** Setor amplo declarado pela fonte (ex.: `category_slug` do JobBase).
   *  `null` quando a fonte não categoriza — ver `NormalizedJob.category`. */
  category?: string | null
  employmentType?: string | null
  seniority?: string | null
  salaryMin?: number | string | null
  salaryMax?: number | string | null
  currency?: string | null
  salaryPeriod?: string | null
  description?: string | null
  requirements?: string[] | null
  skills?: string[] | null
  language?: string | null
  applicationUrl?: string | null
  publishedAt?: string | Date | null
  /** A fonte declarou explicitamente que não divulga certos campos. */
  notDisclosed?: string[] | null
}

/** A vaga normalizada, pronta para o resto do sistema. */
export interface NormalizedJob {
  sourceJobId: string | null
  company: string
  /** Empresa canônica, para deduplicar. Ver `companyKeyOf`. */
  companyKey: string
  title: string
  /** Conceito da taxonomia, ou `null` quando o título não é reconhecido. */
  normalizedTitle: string | null
  /** Setor amplo. `'vaga_remota'` sempre sobrepõe quando `remoteType ===
   *  'remote'` — ver `normalize.ts`. `null` quando a fonte não categoriza. */
  category: string | null

  country: string | null
  region: string | null
  city: string | null
  remoteType: RemoteType
  market: string | null

  employmentType: string | null
  seniority: string | null

  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  salaryPeriod: SalaryPeriod | null

  description: string | null
  requirements: string[]
  skills: string[]
  language: string | null

  applicationUrl: string
  dedupeKey: string

  publishedAt: Date | null

  /** Campo → motivo da ausência. Só contém campos realmente ausentes. */
  unknownFields: Record<string, UnknownReason>
}

/** Erro de normalização: a vaga não tem o mínimo para existir. */
export class JobNormalizationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message)
    this.name = 'JobNormalizationError'
  }
}
