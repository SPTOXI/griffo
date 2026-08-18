/**
 * Adapter da Adzuna — agregador com API oficial.
 *
 * ## Por que ela importa
 *
 * Greenhouse e Lever são boards por empresa: só acham vaga de quem já se
 * conhece. A Gupy resolve o Brasil, mas por API interna, com o risco que está
 * escrito no cabeçalho dela. A Adzuna é a primeira fonte que resolve
 * **descoberta ampla com contrato público**: API documentada, chave própria,
 * termos de uso que preveem exatamente este uso.
 *
 * ## Verificado contra a API real
 *
 * Em 18/08/2026, contra
 * `api.adzuna.com/v1/api/jobs/br/search/1?what=enfermeiro`.
 *
 * ## A armadilha que quase entrou no banco
 *
 * O campo `salary_is_predicted` vale `"1"` quando o salário foi **estimado pela
 * Adzuna**, e não informado pela empresa. Gravá-lo como salário da vaga poria no
 * produto um número que ninguém prometeu — e o usuário o leria como promessa.
 *
 * Quando a estimativa está ligada, o salário é **descartado**. Vaga sem salário
 * é o estado normal do mercado; vaga com salário inventado é o que o §43
 * proíbe.
 *
 * ## O país vem numa hierarquia, não num campo
 *
 * `location.area` é uma lista do mais geral para o mais específico:
 * `["Brasil", "Sul", "Paraná", "Curitiba"]`. O país é o primeiro item, por
 * extenso e em português — a mesma conversão que a Gupy precisa, e que por isso
 * mora em `lib/market/countries.ts` em vez de em cada adapter.
 *
 * ## É fonte de BUSCA
 *
 * Como a Gupy, precisa de termos, e eles vêm dos cargos que a orientação
 * profissional recomendou. E, como a Gupy, **não fecha vaga por ausência**: sair
 * do resultado de uma busca não é prova de encerramento.
 *
 * ## A URL de candidatura é um redirecionamento da Adzuna
 *
 * `redirect_url` passa pelo domínio deles antes de chegar ao anúncio. É como a
 * API funciona e como a atribuição é contada — não é para ser contornado. O
 * efeito colateral é que a mesma vaga vinda da Gupy e da Adzuna tem URLs
 * diferentes: quem as junta é a deduplicação por empresa + cargo, não por URL.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'
import { countryCodeFromName } from '../../market/countries'

export const ADZUNA_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'adzuna',
  name: 'Adzuna (agregador)',
  kind: 'job_board',
  // Cada instância é de um país; a lista fica vazia porque o slug já carrega o
  // país e a vaga declara o dela.
  markets: [],
  accessNote:
    'API oficial e documentada da Adzuna, com chave de aplicativo própria e uso declarado no cadastro como exibição de anúncios. Ao contrário da Gupy, há contrato público.',
  // Fonte de busca: ausência nos resultados não é prova de encerramento.
  closesByAbsence: false,
}

interface AdzunaJob {
  id?: string | number
  title?: string
  description?: string
  created?: string
  redirect_url?: string
  salary_min?: number
  salary_max?: number
  /** `"1"` quando a Adzuna ESTIMOU o salário. Ver o cabeçalho. */
  salary_is_predicted?: string | number
  contract_type?: string
  contract_time?: string
  company?: { display_name?: string }
  location?: { display_name?: string; area?: string[] }
  category?: { label?: string; tag?: string }
}

/** A estimativa está ligada? Qualquer forma de "1" conta. */
export function salaryIsPredicted(value: unknown): boolean {
  return value === 1 || value === '1' || value === true
}

/** Converte o payload de uma página em vagas cruas. */
export function parseAdzunaPayload(payload: unknown): RawJob[] {
  const results = (payload as { results?: AdzunaJob[] })?.results
  if (!Array.isArray(results)) return []

  const out: RawJob[] = []

  for (const item of results) {
    const title = typeof item?.title === 'string' ? item.title.trim() : ''
    const url = typeof item?.redirect_url === 'string' ? item.redirect_url.trim() : ''
    const company = typeof item?.company?.display_name === 'string' ? item.company.display_name.trim() : ''
    if (!title || !url || !company) continue

    const area = Array.isArray(item?.location?.area) ? item.location!.area! : []
    // Do mais geral para o mais específico: país, região, estado, cidade.
    const country = countryCodeFromName(area[0])
    const region = area.length >= 3 ? area[area.length - 2] : null
    const city = area.length >= 2 ? area[area.length - 1] : null

    const predicted = salaryIsPredicted(item?.salary_is_predicted)

    out.push({
      sourceJobId: item?.id != null ? String(item.id) : null,
      company,
      title,
      applicationUrl: url,
      location: typeof item?.location?.display_name === 'string' ? item.location.display_name : null,
      country,
      region,
      city,
      // Salário ESTIMADO não é salário. Ver o cabeçalho.
      salaryMin: !predicted && typeof item?.salary_min === 'number' ? item.salary_min : null,
      salaryMax: !predicted && typeof item?.salary_max === 'number' ? item.salary_max : null,
      employmentType:
        [item?.contract_type, item?.contract_time].filter((v) => typeof v === 'string').join(' ') || null,
      description: typeof item?.description === 'string' ? item.description : null,
      publishedAt: typeof item?.created === 'string' ? item.created : null,
    })
  }

  return out
}

/** Teto da Adzuna por página. */
const PAGE_SIZE = 50

export interface AdzunaCredentials {
  appId: string
  appKey: string
}

/**
 * Cria o adapter para um país e um conjunto de termos.
 *
 * Um adapter para todos os termos do país, e não um por termo, porque eles
 * dividem o orçamento de tempo: com um por termo, o primeiro gastaria o prazo
 * inteiro e os demais nunca rodariam, sem que nada registrasse isso.
 */
export function createAdzunaAdapter(options: {
  credentials: AdzunaCredentials
  /** Código do país no formato da Adzuna: `br`, `gb`, `us`... */
  country: string
  terms: string[]
  fetchImpl?: typeof fetch
  maxPagesPerTerm?: number
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch
  const maxPagesPerTerm = options.maxPagesPerTerm ?? 2
  const country = options.country.toLowerCase()

  return {
    descriptor: {
      ...ADZUNA_DESCRIPTOR,
      slug: `adzuna:${country}`,
      name: `Adzuna ${country.toUpperCase()}`,
    },

    async collect(context: CollectContext): Promise<CollectResult> {
      const startedAt = Date.now()
      const budget = Math.max(1000, context.timeBudgetMs)

      const jobs: RawJob[] = []
      const errors: string[] = []
      let pagesFetched = 0
      let truncated = false

      for (const term of options.terms) {
        if (Date.now() - startedAt >= budget) {
          truncated = true
          break
        }

        for (let page = 1; page <= maxPagesPerTerm; page++) {
          if (Date.now() - startedAt >= budget) {
            truncated = true
            break
          }

          const url =
            `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}` +
            `?app_id=${encodeURIComponent(options.credentials.appId)}` +
            `&app_key=${encodeURIComponent(options.credentials.appKey)}` +
            `&results_per_page=${PAGE_SIZE}` +
            `&what=${encodeURIComponent(term)}`

          const controller = new AbortController()
          const remaining = budget - (Date.now() - startedAt)
          const timer = setTimeout(() => controller.abort(), Math.max(1000, remaining))

          try {
            const response = await doFetch(url, { signal: controller.signal })

            if (!response.ok) {
              errors.push(`HTTP ${response.status} no termo "${term}"`)
              break
            }

            const payload = await response.json()

            // A Adzuna devolve 200 com `exception` quando a credencial não
            // vale. Ler isso como "nenhuma vaga" faria uma chave expirada
            // parecer um mercado vazio.
            const exception = (payload as { exception?: unknown })?.exception
            if (exception) {
              errors.push(`${String(exception)} no termo "${term}"`)
              break
            }

            const parsed = parseAdzunaPayload(payload)
            jobs.push(...parsed)
            pagesFetched++

            // Página incompleta é a última: não há o que buscar adiante.
            const raw = (payload as { results?: unknown[] })?.results
            if (!Array.isArray(raw) || raw.length < PAGE_SIZE) break

            if (page === maxPagesPerTerm) truncated = true
          } catch (e: any) {
            errors.push(
              e?.name === 'AbortError'
                ? `Tempo esgotado no termo "${term}"`
                : `${e?.message || String(e)} no termo "${term}"`
            )
            break
          } finally {
            clearTimeout(timer)
          }
        }
      }

      if (options.terms.length === 0) {
        return { outcome: 'complete', jobs: [], pagesFetched: 0, error: null }
      }

      if (errors.length >= options.terms.length && jobs.length === 0) {
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
 * Lê as credenciais do ambiente.
 *
 * As duas juntas ou nenhuma: metade da credencial produziria uma fonte que
 * falha toda rodada com erro de autenticação, gastando o orçamento de tempo das
 * fontes que funcionam.
 */
export function adzunaCredentials(
  appId: string | null | undefined,
  appKey: string | null | undefined
): AdzunaCredentials | null {
  const id = appId?.trim()
  const key = appKey?.trim()
  return id && key ? { appId: id, appKey: key } : null
}
