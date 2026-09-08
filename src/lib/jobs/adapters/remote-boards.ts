/**
 * Quadros de vaga remota internacional — Remotive e RemoteOK.
 *
 * ## Por que as duas juntas
 *
 * São a mesma categoria e compartilham a semântica que decide o comportamento:
 * ambas devolvem uma **fatia recente** do catálogo, não o catálogo inteiro.
 * Separá-las em dois arquivos duplicaria o raciocínio; juntá-las com outra
 * categoria esconderia o que têm de próprio.
 *
 * ## O buraco que elas fecham
 *
 * A Adzuna cobre dez dos doze mercados. **Portugal e Japão ficam sem fonte de
 * busca por cargo.** Vaga remota internacional não tem mercado local: atende
 * quem mora em qualquer lugar e aceita trabalhar de casa para fora. É o mercado
 * `GLOBAL` que já existe em `lib/market` e que até aqui não tinha fonte
 * nenhuma.
 *
 * ## Ausência aqui NÃO é encerramento
 *
 * As duas devolvem as vagas mais recentes, não todas. Uma vaga sair da fatia
 * significa que outras foram publicadas depois — não que ela fechou. Por isso
 * `closesByAbsence: false`, como na Gupy e na Adzuna, e pelo mesmo motivo.
 *
 * ## Verificadas contra as APIs reais
 *
 * Em 19/08/2026. Três armadilhas que só o payload mostrou:
 *
 * 1. **O cargo do RemoteOK está em `position`**, não em `title` — mesma
 *    pegadinha do `text` no Lever. Ler `title` descartaria tudo e a fonte
 *    pareceria vazia.
 * 2. **`created_at` e `epoch` vêm em SEGUNDOS**, não em milissegundos como no
 *    Lever. Tratar como milissegundos jogaria toda vaga para 1970.
 * 3. **`salary_min: 0` do RemoteOK significa "não informado"**, não "paga
 *    zero". Gravar o zero poria no produto um salário que ninguém ofereceu.
 *
 * E uma quarta, da Remotive: `salary` é **texto livre** (`"$120 - $170
 * /hour"`), não número. Interpretá-lo exigiria adivinhar moeda, período e
 * intervalo — três chances de errar num campo que o usuário lê como promessa.
 * Fica de fora.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'
import { readableText } from '../text'

/** Fatia recente, não catálogo: ausência não prova encerramento. */
const REMOTE_BOARD_BASE: Pick<JobSourceDescriptor, 'kind' | 'markets' | 'closesByAbsence'> = {
  kind: 'job_board',
  // Sem mercado fixo: a vaga é remota internacional e serve a qualquer país.
  // Declarar mercados aqui a esconderia de quem mais precisa dela.
  markets: [],
  closesByAbsence: false,
}

export const REMOTIVE_DESCRIPTOR: JobSourceDescriptor = {
  ...REMOTE_BOARD_BASE,
  slug: 'remotive',
  name: 'Remotive (vagas remotas)',
  accessNote:
    'API pública e gratuita da Remotive, documentada para consumo por terceiros. A resposta traz um aviso legal do próprio serviço na chave `0-legal-notice`, fora do array `jobs` — `parseRemotivePayload` só lê `jobs`, então esse aviso não tem como ser confundido com vaga.',
}

export const REMOTEOK_DESCRIPTOR: JobSourceDescriptor = {
  ...REMOTE_BOARD_BASE,
  slug: 'remoteok',
  name: 'RemoteOK (vagas remotas)',
  accessNote:
    'API pública e gratuita do RemoteOK. O PRIMEIRO item do array é um aviso legal do serviço, não uma vaga — ver o filtro em parseRemoteOkPayload.',
}

/** Segundos desde a época viram texto ISO. */
export function isoFromEpochSeconds(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * A data da Remotive vem sem fuso (`"2026-08-16T10:09:41"`).
 *
 * Sem marcador, o `Date` a interpreta no fuso de quem roda — e a mesma vaga
 * teria data diferente conforme a região da função. Assumir UTC é a escolha
 * que mantém o resultado igual em qualquer lugar.
 */
export function isoFromNaiveDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed) ? trimmed : `${trimmed}Z`
  const date = new Date(withZone)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function tagList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const out = value.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 20)
  return out.length > 0 ? out : null
}

/** Zero e negativo são "não informado", não uma oferta. */
function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

interface RemotiveJob {
  id?: number | string
  url?: string
  title?: string
  company_name?: string
  category?: string
  tags?: unknown
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  description?: string
}

export function parseRemotivePayload(payload: unknown): RawJob[] {
  const jobs = (payload as { jobs?: RemotiveJob[] })?.jobs
  if (!Array.isArray(jobs)) return []

  const out: RawJob[] = []

  for (const item of jobs) {
    const title = typeof item?.title === 'string' ? item.title.trim() : ''
    const url = typeof item?.url === 'string' ? item.url.trim() : ''
    const company = typeof item?.company_name === 'string' ? item.company_name.trim() : ''
    if (!title || !url || !company) continue

    out.push({
      sourceJobId: item?.id != null ? String(item.id) : null,
      company,
      title,
      applicationUrl: url,
      // `candidate_required_location` ("Americas, Europe, Israel") é de ONDE se
      // pode candidatar, não onde fica a vaga. Vai como texto de localização
      // porque é essa a informação que importa a quem lê — e o país fica nulo,
      // já que a vaga não tem um.
      location: typeof item?.candidate_required_location === 'string'
        ? item.candidate_required_location
        : null,
      country: null,
      remoteType: 'remote',
      employmentType: typeof item?.job_type === 'string' ? item.job_type : null,
      description: readableText(item?.description),
      publishedAt: isoFromNaiveDate(item?.publication_date),
      skills: tagList(item?.tags),
      // `salary` é texto livre; ver o cabeçalho. Declarar que não foi divulgado
      // é diferente de deixar o campo em branco por descuido.
      notDisclosed: ['salaryMin', 'salaryMax'],
    })
  }

  return out
}

interface RemoteOkJob {
  id?: string | number
  epoch?: number
  position?: string
  company?: string
  url?: string
  apply_url?: string
  location?: string
  tags?: unknown
  description?: string
  salary_min?: number
  salary_max?: number
}

/**
 * Converte o payload do RemoteOK.
 *
 * O **primeiro item do array é um aviso legal**, não uma vaga. Ele não tem
 * `position`, então a exigência de cargo já o descarta — mas está dito aqui
 * porque quem ler o código vai estranhar a contagem, e porque uma futura
 * mudança na exigência não pode deixá-lo passar por acidente.
 */
export function parseRemoteOkPayload(payload: unknown): RawJob[] {
  if (!Array.isArray(payload)) return []

  const out: RawJob[] = []

  for (const item of payload as RemoteOkJob[]) {
    // O cargo está em `position`, não em `title`. Ver o cabeçalho.
    const title = typeof item?.position === 'string' ? item.position.trim() : ''
    const company = typeof item?.company === 'string' ? item.company.trim() : ''
    const url =
      (typeof item?.apply_url === 'string' && item.apply_url.trim()) ||
      (typeof item?.url === 'string' && item.url.trim()) ||
      ''
    if (!title || !company || !url) continue

    const salaryMin = positiveNumber(item?.salary_min)
    const salaryMax = positiveNumber(item?.salary_max)

    out.push({
      sourceJobId: item?.id != null ? String(item.id) : null,
      company,
      title,
      applicationUrl: url,
      // Texto livre e às vezes sujo ("Jamnagar, "). Quem sabe limpar é o
      // normalizador; mandar cru é mais honesto que adivinhar.
      location: typeof item?.location === 'string' ? item.location.trim() || null : null,
      country: null,
      remoteType: 'remote',
      description: readableText(item?.description),
      // `epoch` em SEGUNDOS. Ver o cabeçalho.
      publishedAt: isoFromEpochSeconds(item?.epoch),
      skills: tagList(item?.tags),
      salaryMin,
      salaryMax,
      // Zero nesses campos é "não informado". Dizer isso é diferente de deixar
      // o campo vazio: o §12 distingue desconhecido de não divulgado.
      notDisclosed: salaryMin || salaryMax ? null : ['salaryMin', 'salaryMax'],
    })
  }

  return out
}

function fetchingAdapter(options: {
  descriptor: JobSourceDescriptor
  url: string
  parse: (payload: unknown) => RawJob[]
  fetchImpl?: typeof fetch
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch

  return {
    descriptor: options.descriptor,

    async collect(context: CollectContext): Promise<CollectResult> {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.max(1000, context.timeBudgetMs))

      try {
        const response = await doFetch(options.url, {
          signal: controller.signal,
          // Sem User-Agent o RemoteOK recusa. Identificar-se é o mínimo devido a
          // quem serve os dados de graça.
          headers: { 'User-Agent': 'GriffoWork/1.0 (+https://griffo.work)' },
        })

        if (!response.ok) {
          // Status ruim é falha, não "não há vaga remota no mundo hoje".
          return {
            outcome: 'failed',
            jobs: [],
            error: `HTTP ${response.status} em ${options.descriptor.slug}`,
            pagesFetched: 0,
          }
        }

        const payload = await response.json()
        return { outcome: 'complete', jobs: options.parse(payload), pagesFetched: 1 }
      } catch (e: any) {
        return {
          outcome: 'failed',
          jobs: [],
          error:
            e?.name === 'AbortError'
              ? `Tempo esgotado em ${options.descriptor.slug}`
              : `${e?.message || String(e)}`,
          pagesFetched: 0,
        }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

export function createRemotiveAdapter(options: { limit?: number; fetchImpl?: typeof fetch } = {}): JobSourceAdapter {
  const limit = options.limit ?? 100
  return fetchingAdapter({
    descriptor: REMOTIVE_DESCRIPTOR,
    url: `https://remotive.com/api/remote-jobs?limit=${limit}`,
    parse: parseRemotivePayload,
    fetchImpl: options.fetchImpl,
  })
}

export function createRemoteOkAdapter(options: { fetchImpl?: typeof fetch } = {}): JobSourceAdapter {
  return fetchingAdapter({
    descriptor: REMOTEOK_DESCRIPTOR,
    url: 'https://remoteok.com/api',
    parse: parseRemoteOkPayload,
    fetchImpl: options.fetchImpl,
  })
}

/**
 * As fontes de vaga remota desta instalação.
 *
 * Ligadas por padrão, ao contrário das demais: não exigem chave, não têm cota
 * conhecida, e são a ÚNICA fonte de quem mora em Portugal ou no Japão. Deixá-las
 * atrás de uma variável de ambiente significaria, na prática, deixar esses
 * mercados sem fonte por esquecimento.
 *
 * `REMOTE_BOARDS=off` desliga as duas, para o caso de alguma passar a pedir
 * chave ou começar a recusar as requisições.
 */
export function remoteBoardAdapters(env: string | null | undefined): JobSourceAdapter[] {
  if (typeof env === 'string' && env.trim().toLowerCase() === 'off') return []
  return [createRemotiveAdapter(), createRemoteOkAdapter()]
}
