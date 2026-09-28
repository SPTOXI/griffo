/**
 * Adapter do JobBase — base de vagas própria, num segundo projeto Supabase.
 *
 * ## O que é
 *
 * JobBase é um projeto irmão do GriffoWork (mesmo time Vercel `griffojobs`)
 * que varre Greenhouse, Lever, Ashby, LinkedIn, SmartRecruiters, Gupy,
 * InfoJobs, Catho, Adzuna e Remotive para dentro de um Postgres próprio, em
 * lote 1x/dia. O GriffoWork lê essa base pela chave publicável, com RLS que
 * só libera leitura em `companies`/`job_postings` — nenhuma escrita.
 *
 * Correção em 15/09/2026: este comentário dizia "Gupy/InfoJobs/Catho ainda
 * não coletam nada" — não é mais verdade (conferido direto no banco do
 * JobBase): InfoJobs tem 2.942 vagas, Catho 1.154, Gupy 127. A query abaixo
 * (`collect`) nunca filtrou por `source`, então todas as fontes que o
 * JobBase agrega já chegam ao Griffo automaticamente, sem mudança de código
 * quando uma fonte nova passa a coletar de verdade.
 *
 * A chave abaixo é a publicável (`sb_publishable_...`): pública por desenho,
 * travada a leitura pelo RLS do próprio JobBase. Guardá-la como segredo não
 * faria diferença nenhuma — é o mesmo raciocínio do token `vercel` fixo em
 * `VERIFIED_BOARDS` do Greenhouse.
 *
 * ## É fonte de busca, não de board por empresa
 *
 * Ao contrário do Greenhouse/Lever deste projeto (um board = uma empresa
 * conferida), o JobBase agrega múltiplas empresas de fontes variadas.
 * Descoberta ampla, sem contrato de "isto é o catálogo inteiro de uma
 * empresa só" — por isso `closesByAbsence: false`, como na Adzuna/Gupy.
 *
 * ## `status` não é confiável
 *
 * Documentado pelo operador: o campo `status` do JobBase é sempre `'open'`
 * hoje, porque nada no pipeline deles marca vaga como fechada ainda. Ainda
 * assim o filtro `status=eq.open` fica na consulta — inofensivo agora, e
 * correto no dia em que o JobBase passar a preencher `'expired'`/`'removed'`
 * de verdade: dali para frente essas linhas somem da resposta sem que este
 * adapter precise mudar. O que este adapter NUNCA faz é usar ausência para
 * fechar vaga — isso é o que `closesByAbsence: false` impede, no §12.
 *
 * ## Data de publicação
 *
 * `posted_at` é a publicação real; quando falta, `first_seen_at` (quando o
 * próprio JobBase viu a vaga pela primeira vez) é a melhor aproximação —
 * melhor que nulo, que empurraria a vaga para o fim da priorização por
 * novidade do Radar.
 *
 * ## Paginação
 *
 * PostgREST devolve no máximo 1000 linhas por página via cabeçalho `Range`.
 * Em 26/08/2026 a base tinha 3375 linhas — 4 páginas, dentro do orçamento de
 * uma fonte só. `maxPages` limita o teto de páginas por rodada, não a
 * página em si.
 *
 * ## Verificado contra a API real
 *
 * Em 26/08/2026, contra
 * `poesywqtwnihizhkkbii.supabase.co/rest/v1/job_postings` com a chave
 * publicável abaixo. Duas coisas que a descrição do schema não deixava claras:
 *
 * 1. **`country_code` é esparso, não confiável como o do Lever.** Populado
 *    para `smartrecruiters` (`"AU"`, `"US"`, já em ISO2), mas **nulo** nas
 *    linhas de `greenhouse` e `linkedin` observadas — mesmo com `city`
 *    preenchida (`"London"`, `"Greater Rio de Janeiro"`). Mandado como veio,
 *    sem inventar país a partir da cidade: o normalizador decide o que fazer
 *    com um país ausente, este adapter não adivinha.
 * 2. **`work_mode` é `"unknown"` na esmagadora maioria das linhas** — não é
 *    hipótese, é o estado real observado numa amostra de 20 vagas de fontes
 *    variadas. O mapeamento para `remoteType` já trata isso como caminho
 *    normal, não exceção.
 *
 * `status` só apareceu como `"open"` na amostra, confirmando o aviso do
 * operador.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'

export const JOBBASE_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'jobbase',
  name: 'JobBase (Greenhouse/Lever/Ashby/LinkedIn agregados)',
  kind: 'api',
  // Fontes variadas, sem mercado fixo: cada vaga declara o país dela.
  markets: [],
  accessNote:
    'Projeto Supabase irmão (mesmo time Vercel), leitura pública via chave publicável com RLS restrita a companies/job_postings; nenhuma escrita liberada. Atualização em lote 1x/dia — não é tempo real.',
  closesByAbsence: false,
}

/** Página máxima do PostgREST por requisição. */
const PAGE_SIZE = 1000

/** Colunas realmente usadas. Pedir só estas poupa banda numa base que já é externa. */
const SELECT_COLUMNS = [
  'company_name_raw',
  'source',
  'external_id',
  'source_url',
  'title',
  'country_code',
  'region',
  'city',
  'work_mode',
  'salary_min',
  'salary_max',
  'salary_currency',
  'posted_at',
  'first_seen_at',
  // Coluna gerada por linha (`classify_job_category(title)`, 19 categorias,
  // ~74% de cobertura) — avisada pelo time do JobBase em 14/09/2026. `null`
  // quando o título não bate com nenhuma categoria ("outros" tem slug
  // próprio, não é isto que fica `null`).
  'category_slug',
  // Pedida desde 23/09/2026 (§2.136). Sem ela a vaga chegava só com título, e
  // a extração de requisitos (`lib/jobs/intelligence`) não tinha o que ler.
  // `description_text` e não `description`: o JobBase passou a entregar a
  // versão sem HTML (§2.137) — a do Greenhouse vinha 100% com marcação, e
  // marcação é token pago na extração. InfoJobs e Catho continuam sem
  // descrição nenhuma, então `null` segue sendo o caso comum no Brasil.
  'description_text',
].join(',')

/**
 * Ordem fixa da paginação: mais novas primeiro, desempate estável pelo `id`.
 *
 * Sem ordem, o PostgREST devolve as páginas na ordem física da tabela, que
 * muda a cada escrita — uma vaga podia sair em duas páginas e outra em
 * nenhuma. E com mais vagas abertas do que as páginas da rodada cobrem, a
 * ordem decide QUAIS ficam de fora: melhor as mais antigas.
 */
const ORDER = 'id.desc'

const WORK_MODE_TO_REMOTE_TYPE: Record<string, string> = {
  remote: 'remote',
  hybrid: 'hybrid',
  onsite: 'onsite',
}

/** O formato que a tabela `job_postings` do JobBase devolve, no que interessa. */
interface JobBasePosting {
  company_name_raw?: string | null
  source?: string | null
  external_id?: string | null
  source_url?: string | null
  title?: string | null
  country_code?: string | null
  region?: string | null
  city?: string | null
  work_mode?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  posted_at?: string | null
  first_seen_at?: string | null
  category_slug?: string | null
  description_text?: string | null
}

function pickDate(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  return null
}

/**
 * Converte uma página do JobBase em vagas cruas.
 *
 * Separada de `collect` de propósito: é ela que os testes exercitam, sem rede.
 */
export function parseJobBasePayload(payload: unknown): RawJob[] {
  if (!Array.isArray(payload)) return []

  const out: RawJob[] = []

  for (const item of payload as JobBasePosting[]) {
    const title = typeof item?.title === 'string' ? item.title.trim() : ''
    const url = typeof item?.source_url === 'string' ? item.source_url.trim() : ''
    const company = typeof item?.company_name_raw === 'string' ? item.company_name_raw.trim() : ''
    if (!title || !url || !company) continue

    const workMode = typeof item?.work_mode === 'string' ? item.work_mode.toLowerCase() : ''

    out.push({
      // `(source, external_id)` é a chave própria do JobBase — usá-la como
      // `sourceJobId` mantém a mesma vaga estável entre coletas diárias.
      sourceJobId:
        typeof item?.source === 'string' && typeof item?.external_id === 'string'
          ? `${item.source}:${item.external_id}`
          : null,
      company,
      title,
      applicationUrl: url,
      // Quando presente já vem em ISO2, mas é esparso — ver o cabeçalho.
      // Nulo aqui é honesto: não é este adapter que adivinha país pela cidade.
      country: typeof item?.country_code === 'string' ? item.country_code : null,
      region: typeof item?.region === 'string' ? item.region : null,
      city: typeof item?.city === 'string' ? item.city : null,
      remoteType: WORK_MODE_TO_REMOTE_TYPE[workMode] || 'unknown',
      category: typeof item?.category_slug === 'string' ? item.category_slug : null,
      description: typeof item?.description_text === 'string' ? item.description_text : null,
      salaryMin: typeof item?.salary_min === 'number' ? item.salary_min : null,
      salaryMax: typeof item?.salary_max === 'number' ? item.salary_max : null,
      currency: typeof item?.salary_currency === 'string' ? item.salary_currency : null,
      publishedAt: pickDate(item?.posted_at, item?.first_seen_at),
    })
  }

  return out
}

export interface JobBaseCredentials {
  url: string
  anonKey: string
}

/**
 * Chave publicável e URL, com os valores do JobBase de produção como padrão.
 *
 * Não é segredo — ver o cabeçalho. Os padrões existem para que a fonte
 * funcione sem exigir configuração extra; `JOBBASE_URL`/`JOBBASE_ANON_KEY`
 * continuam disponíveis para o dia em que a chave girar ou outro ambiente
 * precisar apontar para outro projeto.
 */
export function jobBaseCredentials(
  url?: string | null,
  anonKey?: string | null
): JobBaseCredentials {
  const trimmedUrl = (url || 'https://poesywqtwnihizhkkbii.supabase.co').trim().replace(/\/+$/, '')
  const trimmedKey = (anonKey || 'sb_publishable_ROTQxiJVRIMIEdqLWitU6A_oNQVIRpi').trim()
  return { url: trimmedUrl, anonKey: trimmedKey }
}

/**
 * Cria o adapter do JobBase.
 *
 * `fetchImpl` é injetável para que o teste exercite a coleta inteira, com
 * paginação, sem rede.
 */
export function createJobBaseAdapter(options: {
  credentials: JobBaseCredentials
  fetchImpl?: typeof fetch
  pageSize?: number
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch
  const pageSize = options.pageSize ?? PAGE_SIZE

  return {
    descriptor: JOBBASE_DESCRIPTOR,

    async collect(context: CollectContext): Promise<CollectResult> {
      const startedAt = Date.now()
      const budget = Math.max(1000, context.timeBudgetMs)
      const maxPages = context.maxPages ?? 5

      const jobs: RawJob[] = []
      let pagesFetched = 0
      let truncated = false

      for (let page = 0; page < maxPages; page++) {
        if (Date.now() - startedAt >= budget) {
          truncated = true
          break
        }

        const from = page * pageSize
        const to = from + pageSize - 1
        const url = `${options.credentials.url}/rest/v1/job_postings?select=${SELECT_COLUMNS}&status=eq.open&order=${ORDER}`

        const controller = new AbortController()
        const remaining = budget - (Date.now() - startedAt)
        const timer = setTimeout(() => controller.abort(), Math.max(1000, remaining))

        try {
          const response = await doFetch(url, {
            signal: controller.signal,
            headers: {
              apikey: options.credentials.anonKey,
              Authorization: `Bearer ${options.credentials.anonKey}`,
              // Paginação do PostgREST: intervalo de linhas, não número de página.
              Range: `${from}-${to}`,
            },
          })

          // PostgREST responde 200 (página única) ou 206 (página parcial, com
          // mais páginas atrás) — os dois são sucesso.
          if (!response.ok && response.status !== 206) {
            return {
              outcome: pagesFetched > 0 ? 'partial' : 'failed',
              jobs,
              error: `HTTP ${response.status} do JobBase`,
              pagesFetched,
            }
          }

          const payload = await response.json()

          if (!Array.isArray(payload)) {
            return {
              outcome: pagesFetched > 0 ? 'partial' : 'failed',
              jobs,
              error: 'Resposta do JobBase não veio como lista de vagas',
              pagesFetched,
            }
          }

          jobs.push(...parseJobBasePayload(payload))
          pagesFetched++

          // Página menor que o teto é a última: não há o que buscar adiante.
          if (payload.length < pageSize) break

          if (page === maxPages - 1) truncated = true
        } catch (e: any) {
          const aborted = e?.name === 'AbortError'
          return {
            outcome: pagesFetched > 0 ? 'partial' : 'failed',
            jobs,
            error: aborted ? 'Tempo esgotado ao coletar o JobBase' : `${e?.message || String(e)}`,
            pagesFetched,
          }
        } finally {
          clearTimeout(timer)
        }
      }

      return { outcome: truncated ? 'partial' : 'complete', jobs, pagesFetched }
    },
  }
}

/**
 * A fonte JobBase desta instalação.
 *
 * `JOBBASE=off` desliga, para o caso do projeto irmão sair do ar ou mudar de
 * forma incompatível sem aviso — mesmo interruptor usado em `REMOTE_BOARDS`.
 */
export function jobBaseAdapters(options: {
  toggle?: string | null
  credentials?: JobBaseCredentials
} = {}): JobSourceAdapter[] {
  if (typeof options.toggle === 'string' && options.toggle.trim().toLowerCase() === 'off') return []
  return [createJobBaseAdapter({ credentials: options.credentials ?? jobBaseCredentials() })]
}

function authHeaders(credentials: JobBaseCredentials): Record<string, string> {
  return { apikey: credentials.anonKey, Authorization: `Bearer ${credentials.anonKey}` }
}

async function fetchJson(
  url: string,
  options: { credentials: JobBaseCredentials; fetchImpl?: typeof fetch; timeoutMs?: number }
): Promise<unknown[]> {
  const doFetch = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000)
  try {
    const response = await doFetch(url, { signal: controller.signal, headers: authHeaders(options.credentials) })
    if (!response.ok) throw new Error(`HTTP ${response.status} do JobBase`)
    const payload = await response.json()
    if (!Array.isArray(payload)) throw new Error('Resposta do JobBase não veio como lista')
    return payload
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Uma página das vagas ABERTAS do JobBase, por cursor (§2.144).
 *
 * A coleta do Radar (`createJobBaseAdapter`) divide 60s com todas as outras
 * fontes e só cabe nas 5 mil vagas mais novas — o JobBase tem mais de 12 mil.
 * A sincronização própria (`lib/jobs/jobbase-sync.server`) percorre a base
 * inteira em várias chamadas, e para isso precisa de paginação que não mude
 * entre uma chamada e outra: cursor pelo `id` (`id < último visto`), e não
 * deslocamento, que pularia ou repetiria vaga se a base mudasse no meio.
 *
 * `nextCursor` é `null` quando a página veio menor que o tamanho pedido — era
 * a última. Falha de rede ou resposta inválida LANÇA: quem chama decide.
 */
export async function fetchJobBaseOpenPage(options: {
  credentials: JobBaseCredentials
  cursor?: number | null
  pageSize?: number
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<{ jobs: RawJob[]; rows: number; nextCursor: number | null }> {
  const pageSize = options.pageSize ?? PAGE_SIZE
  const url =
    `${options.credentials.url}/rest/v1/job_postings?select=id,${SELECT_COLUMNS}` +
    `&status=eq.open&order=id.desc&limit=${pageSize}` +
    (options.cursor != null ? `&id=lt.${options.cursor}` : '')
  const payload = await fetchJson(url, options)
  const lastId = Number((payload[payload.length - 1] as { id?: unknown } | undefined)?.id)
  return {
    jobs: parseJobBasePayload(payload),
    rows: payload.length,
    nextCursor: payload.length === pageSize && Number.isFinite(lastId) ? lastId : null,
  }
}

/**
 * As vagas que o JobBase ENCERROU, como `sourceJobId` do Griffo (§2.144).
 *
 * O JobBase marca `expired` quando a origem tira a vaga do ar (§2.137). É a
 * evidência que o §12 aceita para fechar: a fonte declarando, e não a vaga
 * sumindo de uma busca. Só `source` e `external_id` — são milhares de linhas,
 * e o resto não interessa aqui. Falha LANÇA: sem a lista inteira, nada fecha.
 */
export async function fetchJobBaseClosedKeys(options: {
  credentials: JobBaseCredentials
  pageSize?: number
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<string[]> {
  const pageSize = options.pageSize ?? PAGE_SIZE
  const keys: string[] = []
  let cursor: number | null = null
  for (;;) {
    const url =
      `${options.credentials.url}/rest/v1/job_postings?select=id,source,external_id` +
      `&status=neq.open&order=id.desc&limit=${pageSize}` +
      (cursor != null ? `&id=lt.${cursor}` : '')
    const rows = (await fetchJson(url, options)) as { id?: unknown; source?: unknown; external_id?: unknown }[]
    for (const row of rows) {
      if (typeof row.source === 'string' && typeof row.external_id === 'string') {
        keys.push(`${row.source}:${row.external_id}`)
      }
    }
    const lastId = Number(rows[rows.length - 1]?.id)
    if (rows.length < pageSize || !Number.isFinite(lastId)) return keys
    cursor = lastId
  }
}

/** Valor dentro de `in.(...)` do PostgREST: entre aspas, com `"` e `\` escapados. */
function quoted(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * Só a seção de requisitos de cada vaga, buscada na hora da extração (§2.137).
 *
 * O JobBase separa, sem IA, o trecho "o que pedimos do candidato"
 * (`requirements_text`): ~1,1–1,4 mil caracteres contra ~6,5 mil do anúncio
 * inteiro no Greenhouse e no Ashby. Mandar só ele à extração corta a entrada
 * paga por ~4× — e evita o pior caso do anúncio longo, em que o corte em
 * `MAX_DESCRIPTION_CHARS` caía antes da seção de requisitos.
 *
 * Buscado aqui, e não guardado na coleta, porque guardá-lo pediria uma coluna
 * nova em `Job`, e toda leitura de `Job` sem `select` quebraria no intervalo
 * entre o deploy e o `db push`. São no máximo algumas requisições por rodada
 * de extração, uma por fonte de origem.
 *
 * Recebe os `sourceJobId` do Griffo (`fonte:id_externo`) e devolve só os que
 * têm seção de requisitos. Falha de rede devolve mapa vazio: a extração cai na
 * descrição inteira, que continua certa, só mais cara.
 */
export async function fetchJobBaseRequirementTexts(
  sourceJobIds: string[],
  options: { credentials: JobBaseCredentials; fetchImpl?: typeof fetch; timeoutMs?: number }
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const doFetch = options.fetchImpl ?? fetch

  const bySource = new Map<string, string[]>()
  for (const key of sourceJobIds) {
    const sep = key.indexOf(':')
    if (sep <= 0 || sep === key.length - 1) continue
    const source = key.slice(0, sep)
    const list = bySource.get(source) ?? []
    list.push(key.slice(sep + 1))
    bySource.set(source, list)
  }

  for (const [source, externalIds] of bySource) {
    const url =
      `${options.credentials.url}/rest/v1/job_postings?select=source,external_id,requirements_text` +
      `&source=eq.${encodeURIComponent(source)}` +
      `&external_id=in.(${encodeURIComponent(externalIds.map(quoted).join(','))})` +
      `&requirements_text=not.is.null`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000)
    try {
      const response = await doFetch(url, { signal: controller.signal, headers: authHeaders(options.credentials) })
      if (!response.ok) continue
      const rows = await response.json()
      if (!Array.isArray(rows)) continue
      for (const row of rows) {
        const text = typeof row?.requirements_text === 'string' ? row.requirements_text.trim() : ''
        if (text && typeof row?.external_id === 'string') out.set(`${source}:${row.external_id}`, text)
      }
    } catch (e: any) {
      console.warn('[jobbase] requisitos não buscados:', e?.message || e)
    } finally {
      clearTimeout(timer)
    }
  }

  return out
}
