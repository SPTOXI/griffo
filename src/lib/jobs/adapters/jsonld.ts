/**
 * Adapter de `schema.org/JobPosting` — a vaga que a própria empresa publica
 * para ser lida por máquina.
 *
 * ## Por que este é o caminho mais sólido
 *
 * O motivo de o Google conseguir mostrar vagas é que os empregadores publicam
 * `JobPosting` em JSON-LD nas próprias páginas. É **padrão aberto**, está no
 * site de quem contrata, e existe justamente para consumo automatizado — ao
 * contrário da API interna da Gupy, aqui não há zona cinzenta nem contrato que
 * pode sumir sem aviso.
 *
 * ## O que ele resolve, e o que NÃO resolve
 *
 * **Resolve ler.** Qualquer página que publique JSON-LD vira fonte, sem chave.
 *
 * **Não resolve descobrir.** Ele precisa saber quais páginas visitar. Descoberta
 * ampla continua dependendo de agregador ou de fontes de busca. Dizer o
 * contrário seria vender cobertura que não existe.
 *
 * Por isso ele é uma fonte de **páginas de carreira escolhidas**: a instalação
 * lista os empregadores que interessa acompanhar, em `CAREER_PAGES`.
 *
 * ## Escrito contra a especificação, não contra páginas reais
 *
 * Diferente de Greenhouse, Lever e Gupy — cujos formatos foram observados antes
 * do código —, este adapter foi escrito a partir da especificação publicada do
 * schema.org. A especificação é estável e pública, mas **páginas reais variam**:
 * envolvem o objeto em `@graph`, mandam vários blocos, usam array onde a
 * especificação permite um valor só.
 *
 * O parser tolera essas três variações e está testado nelas. O que continua sem
 * verificação é o comportamento diante de uma página específica de verdade —
 * conferir antes de acrescentar uma página nova é obrigatório:
 *
 * ```
 * curl -s "<url da vaga>" | findstr /C:"application/ld+json"
 * ```
 *
 * ## Fonte de páginas, não de busca
 *
 * Cada página listada é lida por inteiro toda rodada, então ausência AQUI é
 * informação real: se a vaga saiu da página de carreiras da empresa, ela saiu.
 * Por isso `closesByAbsence` fica no padrão (verdadeiro), diferente da Gupy.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'
import { stripHtml } from '../text'

export const JSONLD_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'career-page',
  name: 'Páginas de carreira (schema.org/JobPosting)',
  kind: 'company_careers',
  // Sem mercado fixo: cada página listada é de uma empresa, e a vaga declara o
  // próprio país. Uma lista aqui esconderia vagas de mercados que as páginas
  // escolhidas atendem.
  markets: [],
  accessNote:
    'Dados estruturados que a própria empresa publica na página da vaga, no padrão aberto schema.org/JobPosting, para consumo automatizado. Não é API interna nem raspagem de conteúdo.',
}

const SCRIPT_RE = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

/**
 * Acha todos os objetos `JobPosting` num HTML.
 *
 * Três variações do mundo real que a especificação permite e que quebrariam um
 * parser ingênuo: o objeto embrulhado em `@graph`, vários blocos `<script>` na
 * mesma página, e array no lugar de objeto único.
 *
 * Bloco com JSON inválido é pulado, não derruba os outros: uma página com um
 * script quebrado e três bons deve render três vagas.
 */
export function extractJobPostings(html: string): Record<string, unknown>[] {
  if (typeof html !== 'string' || !html) return []

  const found: Record<string, unknown>[] = []

  const visit = (node: unknown, depth: number) => {
    // Profundidade limitada: JSON-LD aninhado sem fim é entrada hostil, não
    // documento legítimo.
    if (depth > 6 || !node) return

    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1)
      return
    }
    if (typeof node !== 'object') return

    const obj = node as Record<string, unknown>
    const type = obj['@type']
    const isJobPosting =
      type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))

    if (isJobPosting) found.push(obj)

    // `@graph` é o embrulho mais comum; os demais valores são varridos porque
    // algumas plataformas aninham a vaga dentro de outra entidade.
    if (obj['@graph']) visit(obj['@graph'], depth + 1)
  }

  for (const match of html.matchAll(SCRIPT_RE)) {
    const raw = match[1]?.trim()
    if (!raw) continue
    try {
      visit(JSON.parse(raw), 0)
    } catch {
      // Bloco quebrado não invalida a página.
    }
  }

  return found
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = text(item)
      if (found) return found
    }
  }
  if (value && typeof value === 'object') {
    // schema.org permite `{"@type":"Text","name":"..."}` e afins.
    const obj = value as Record<string, unknown>
    return text(obj.name) ?? text(obj['@value'])
  }
  return null
}

function first(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return first(value[0])
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function number(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(text(value))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Converte um `JobPosting` em vaga crua.
 *
 * Devolve `null` quando falta o mínimo — título, empresa ou URL. O normalizador
 * recusaria de qualquer forma, e recusar aqui evita ruído no log.
 */
export function jobPostingToRaw(
  posting: Record<string, unknown>,
  context: { pageUrl: string; company?: string | null }
): RawJob | null {
  const title = text(posting.title) ?? text(posting.name)

  const org = first(posting.hiringOrganization)
  const company = text(org?.name) ?? (context.company?.trim() || null)

  // `url` da própria vaga quando existe; senão a página de onde ela veio. Sem
  // URL não há para onde mandar quem quiser se candidatar.
  const url = text(posting.url) ?? text(first(posting.applicationContact)?.url) ?? context.pageUrl

  if (!title || !company || !url) return null

  const address = first(first(posting.jobLocation)?.address)
  const city = text(address?.addressLocality)
  const region = text(address?.addressRegion)
  const country = text(address?.addressCountry)

  const salary = first(posting.baseSalary)
  const salaryValue = first(salary?.value)

  // `jobLocationType: "TELECOMMUTE"` é como a especificação diz "remoto".
  const remote = text(posting.jobLocationType)

  const description = text(posting.description)

  return {
    sourceJobId: text(posting.identifier) ?? null,
    company,
    title,
    applicationUrl: url,
    city,
    region,
    // Pode vir "BR" ou "Brasil"; quem resolve isso é o normalizador, que já
    // conhece as duas formas.
    country,
    location: [city, region].filter(Boolean).join(', ') || null,
    remoteType: remote && /telecommute/i.test(remote) ? 'remote' : remote,
    employmentType: text(posting.employmentType),
    description: description ? stripHtml(description) : null,
    publishedAt: text(posting.datePosted),
    salaryMin: number(salaryValue?.minValue) ?? number(salaryValue?.value),
    salaryMax: number(salaryValue?.maxValue),
    currency: text(salary?.currency) ?? text(salaryValue?.currency),
    salaryPeriod: text(salaryValue?.unitText),
  }
}

/** Uma página de carreiras a acompanhar. */
export interface CareerPage {
  url: string
  /** Nome da empresa. Só usado quando a própria página não declara. */
  company?: string
}

/**
 * Cria o adapter para um conjunto de páginas.
 *
 * Um adapter para todas, e não um por página, porque elas dividem o orçamento
 * de tempo: com um por página, a primeira gastaria o prazo inteiro e as demais
 * nunca rodariam — sem que nada registrasse isso.
 */
export function createCareerPageAdapter(options: {
  pages: CareerPage[]
  fetchImpl?: typeof fetch
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch

  return {
    descriptor: JSONLD_DESCRIPTOR,

    async collect(context: CollectContext): Promise<CollectResult> {
      const startedAt = Date.now()
      const budget = Math.max(1000, context.timeBudgetMs)

      const jobs: RawJob[] = []
      const errors: string[] = []
      let pagesFetched = 0
      let truncated = false

      for (const page of options.pages) {
        if (Date.now() - startedAt >= budget) {
          truncated = true
          break
        }

        const controller = new AbortController()
        const remaining = budget - (Date.now() - startedAt)
        const timer = setTimeout(() => controller.abort(), Math.max(1000, remaining))

        try {
          const response = await doFetch(page.url, { signal: controller.signal })

          if (!response.ok) {
            errors.push(`HTTP ${response.status} em ${page.url}`)
            continue
          }

          const html = await response.text()
          pagesFetched++

          for (const posting of extractJobPostings(html)) {
            const job = jobPostingToRaw(posting, { pageUrl: page.url, company: page.company })
            if (job) jobs.push(job)
          }
        } catch (e: any) {
          errors.push(
            e?.name === 'AbortError' ? `Tempo esgotado em ${page.url}` : `${e?.message || String(e)}`
          )
        } finally {
          clearTimeout(timer)
        }
      }

      if (options.pages.length === 0) {
        return { outcome: 'complete', jobs: [], pagesFetched: 0, error: null }
      }

      // Todas falharam: é falha, não "nenhuma empresa está contratando".
      if (errors.length >= options.pages.length) {
        return { outcome: 'failed', jobs: [], error: errors.join('; '), pagesFetched }
      }

      return {
        outcome: truncated || errors.length > 0 ? 'partial' : 'complete',
        jobs,
        pagesFetched,
        error: errors.length > 0 ? errors.join('; ') : null,
      }
    },
  }
}

/**
 * Lê as páginas de `CAREER_PAGES`, no formato `url|Empresa,url2|Outra`.
 *
 * A barra separa em vez dos dois-pontos porque toda URL já tem dois-pontos em
 * `https:` — o separador precisa ser algo que não apareça no valor.
 */
export function parseCareerPageSpec(spec: string | null | undefined): CareerPage[] {
  if (typeof spec !== 'string') return []

  const out: CareerPage[] = []
  const seen = new Set<string>()

  for (const entry of spec.split(',')) {
    const [rawUrl, ...rest] = entry.split('|')
    const url = rawUrl.trim()

    // Só http(s). Uma entrada malformada viraria uma requisição a `file://` ou
    // a um host interno — e o servidor faria essa requisição em nome de quem
    // escreveu a variável.
    if (!/^https?:\/\/\S+$/i.test(url)) continue

    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ url, company: rest.join('|').trim() || undefined })
  }

  return out
}

/** As páginas de carreira desta instalação. Sem variável, nenhuma. */
export function careerPageAdapters(env: string | null | undefined): JobSourceAdapter[] {
  const pages = parseCareerPageSpec(env)
  return pages.length > 0 ? [createCareerPageAdapter({ pages })] : []
}
