/**
 * Deduplicação global de vagas (§14).
 *
 * A mesma vaga aparece no site da empresa, no ATS dela, num agregador, em dois
 * idiomas e por três fontes. Sem deduplicar, o Radar avisaria a mesma pessoa
 * quatro vezes sobre a mesma oportunidade — que é exatamente o oposto do
 * "silêncio por padrão" que o produto promete.
 *
 * ## A ordem de preferência do §14
 *
 * 1. **`company + sourceJobId`**, quando existir. É identificador de verdade:
 *    a empresa e o número que o ATS deu à vaga. Duas coletas da mesma vaga
 *    produzem a mesma chave, sempre.
 * 2. **A URL de candidatura canônica**, quando não houver identificador. Duas
 *    fontes que apontam para o mesmo endereço estão falando da mesma vaga.
 * 3. **Combinação controlada** de empresa, cargo e localização. É o último
 *    recurso, e o mais perigoso: agrupa demais se for frouxo, e não agrupa nada
 *    se for rígido.
 *
 * ## Por que a similaridade é "controlada"
 *
 * Uma empresa grande abre "Data Analyst" em São Paulo e outro "Data Analyst" em
 * São Paulo no mesmo mês, para times diferentes. São duas vagas. Se a chave de
 * reserva juntar as duas, o candidato perde uma oportunidade e nunca fica
 * sabendo — um erro invisível, que é o pior tipo.
 *
 * Por isso a chave de reserva inclui a localização e o cargo NORMALIZADO (não o
 * título livre, que varia entre fontes), e por isso ela é usada só quando as
 * duas anteriores falham.
 */

import { foldTitle } from '../market/taxonomy'
import type { NormalizedJob } from './types'

/** Parâmetros de rastreamento que mudam a URL sem mudar a vaga. */
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gh_src', 'gh_jid', 'ref', 'source', 'src', 'trk', 'trackingid', 'lipi',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid',
]

/**
 * URL canônica de candidatura.
 *
 * Duas fontes que apontam para a mesma vaga costumam diferir só em rastreamento
 * e em maiúsculas do host. Sem canonizar, elas viram duas vagas.
 *
 * URL inválida devolve a string original em minúsculas: é melhor uma chave
 * imperfeita que uma exceção no meio de uma coleta de milhares de itens.
 */
export function canonicalUrl(raw: string): string {
  const value = (raw || '').trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    url.hash = ''
    url.host = url.host.toLowerCase()
    url.protocol = url.protocol.toLowerCase()
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param)
    // Barra final não distingue recurso nenhum.
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1)
    }
    url.searchParams.sort()
    return url.toString().toLowerCase()
  } catch {
    return value.toLowerCase()
  }
}

/** Como a chave foi obtida. Guardado para auditar agrupamento errado depois. */
export type DedupeStrategy = 'source_id' | 'canonical_url' | 'composite'

export interface DedupeResult {
  key: string
  strategy: DedupeStrategy
}

/**
 * A chave de deduplicação de uma vaga.
 *
 * Determinística: a mesma vaga produz a mesma chave em qualquer execução, o que
 * é o que permite a restrição única no banco fazer o trabalho pesado em vez de
 * uma consulta prévia — que perderia a corrida entre duas coletas simultâneas.
 */
export function dedupeKeyFor(job: NormalizedJob): DedupeResult {
  const company = job.companyKey || foldTitle(job.company)

  if (job.sourceJobId && company) {
    return { key: `sid:${company}:${foldTitle(job.sourceJobId)}`, strategy: 'source_id' }
  }

  const url = canonicalUrl(job.applicationUrl)
  if (url) {
    return { key: `url:${url}`, strategy: 'canonical_url' }
  }

  // Último recurso. O cargo entra normalizado quando reconhecido, porque o
  // título livre varia entre fontes ("Dev Back-end Sr" vs "Backend Engineer").
  const role = job.normalizedTitle || foldTitle(job.title)
  const place = [job.country, job.region, job.city]
    .map((p) => foldTitle(p || ''))
    .filter(Boolean)
    .join('|') || foldTitle(job.remoteType)

  return { key: `cmp:${company}:${role}:${place}`, strategy: 'composite' }
}

/** A vaga com a chave preenchida. É o que vai para o banco. */
export function withDedupeKey(job: NormalizedJob): NormalizedJob & { dedupeStrategy: DedupeStrategy } {
  const { key, strategy } = dedupeKeyFor(job)
  return { ...job, dedupeKey: key, dedupeStrategy: strategy }
}

export interface DedupeBatchResult {
  /** Vagas únicas, na ordem em que apareceram. */
  unique: (NormalizedJob & { dedupeStrategy: DedupeStrategy })[]
  /** Quantas foram descartadas por já existirem no lote. */
  duplicates: number
}

/**
 * Deduplica um lote.
 *
 * Mantém a PRIMEIRA ocorrência, não a última. A ordem em que os adapters rodam
 * é a ordem de confiança das fontes — o site da empresa antes do agregador —,
 * então a primeira versão de uma vaga é a mais próxima da origem.
 */
export function dedupeBatch(jobs: NormalizedJob[]): DedupeBatchResult {
  const seen = new Set<string>()
  const unique: (NormalizedJob & { dedupeStrategy: DedupeStrategy })[] = []
  let duplicates = 0

  for (const job of jobs) {
    const withKey = withDedupeKey(job)
    if (seen.has(withKey.dedupeKey)) {
      duplicates++
      continue
    }
    seen.add(withKey.dedupeKey)
    unique.push(withKey)
  }

  return { unique, duplicates }
}

/**
 * Duas vagas são plausivelmente a mesma?
 *
 * Usada para revisão e diagnóstico, NÃO para agrupar automaticamente. O
 * agrupamento automático é só o da chave — que é exata por construção. Uma
 * heurística de similaridade decidindo sozinha o que é duplicata acabaria
 * escondendo vagas reais do usuário.
 */
export function looksLikeSameJob(a: NormalizedJob, b: NormalizedJob): boolean {
  if (a.companyKey !== b.companyKey) return false

  const sameRole =
    a.normalizedTitle && b.normalizedTitle
      ? a.normalizedTitle === b.normalizedTitle
      : foldTitle(a.title) === foldTitle(b.title)
  if (!sameRole) return false

  const place = (j: NormalizedJob) => `${j.country || ''}|${j.city || ''}`.toLowerCase()
  return place(a) === place(b) || canonicalUrl(a.applicationUrl) === canonicalUrl(b.applicationUrl)
}
