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
  // a extração de requisitos (`lib/jobs/intelligence`) não tinha o que ler. No
  // JobBase ela é esparsa — InfoJobs e Catho não a coletam, e a da Adzuna
  // vem cortada em 500 caracteres pela própria API —, então `null` continua
  // sendo o caso comum no Brasil.
  'description',
].join(',')

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
  description?: string | null
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
      description: typeof item?.description === 'string' ? item.description : null,
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
        const url = `${options.credentials.url}/rest/v1/job_postings?select=${SELECT_COLUMNS}&status=eq.open`

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
