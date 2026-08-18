/**
 * Adapter da Gupy — o ATS que concentra vaga no Brasil.
 *
 * ## ⚠️ API interna, não documentada para terceiros
 *
 * Greenhouse e Lever publicam seus job boards **para consumo de terceiros** —
 * está na documentação deles. A Gupy não. O endpoint usado aqui é o que o
 * próprio portal dela consome no navegador, e isso traz três consequências que
 * quem mexer nisto precisa saber:
 *
 * - **Pode mudar sem aviso.** Não há contrato de compatibilidade.
 * - **Pode ser bloqueado.** Limite de taxa, exigência de cabeçalho, WAF.
 * - **Os termos de uso da Gupy provavelmente vedam** o consumo programático.
 *
 * A decisão de usar assim mesmo foi tomada com esses riscos à vista, para uma
 * coleta por dia. O caminho que não quebra é a API oficial de parceria — e
 * enquanto ela não existir, o Brasil depende disto.
 *
 * ## Verificado contra a API real
 *
 * Em 18/08/2026, contra
 * `employability-portal.gupy.io/api/v1/jobs?jobName=biomedico&limit=12&offset=0`.
 *
 * ## É uma fonte de BUSCA, e isso muda tudo
 *
 * Greenhouse e Lever são boards por empresa: pede-se o board, vem o que está
 * aberto. A Gupy é busca por termo — não existe "todas as vagas", existe "as
 * vagas que casam com esta palavra".
 *
 * Duas consequências:
 *
 * 1. **A coleta precisa de termos.** Eles vêm dos cargos que a orientação
 *    profissional recomendou aos usuários — que é o que o Radar sempre foi
 *    para ser: buscar vaga das áreas sugeridas, no país da pessoa.
 * 2. **Sumir dos resultados NÃO é encerramento.** A vaga pode ter caído fora
 *    do termo, da página ou da ordenação e continuar aberta. Por isso o
 *    descritor declara `closesByAbsence: false`, e nenhuma vaga desta fonte é
 *    fechada por ausência.
 *
 * ## Duas armadilhas do payload
 *
 * `country` vem por **extenso e em português** ("Brasil"), não em ISO2 como no
 * Lever. Guardá-lo cru faria o filtro duro comparar "Brasil" com "BR" e
 * eliminar toda vaga brasileira de um perfil brasileiro.
 *
 * `pagination.total` é do TERMO pesquisado, não da Gupy inteira. Interromper a
 * paginação antes de alcançá-lo é coleta parcial, e dizer `complete` ali seria
 * a mentira que o §12 existe para impedir — ainda que aqui ela não feche nada.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'
import { COUNTRIES } from '../../market/countries'

export const GUPY_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'gupy',
  name: 'Gupy (portal de vagas)',
  kind: 'job_board',
  // A Gupy é brasileira e praticamente só tem vaga no Brasil. Declarar isso
  // evita varrê-la atrás de vaga em mercados onde ela é irrelevante.
  markets: ['BR'],
  accessNote:
    'API INTERNA do portal da Gupy, não documentada para terceiros. Pode mudar ou ser bloqueada sem aviso, e os termos de uso provavelmente vedam o consumo programático. Ver o cabeçalho de gupy.ts.',
  // Fonte de busca: ausência nos resultados não é prova de encerramento.
  closesByAbsence: false,
}

interface GupyJob {
  id?: number | string
  name?: string
  description?: string
  careerPageName?: string
  jobUrl?: string
  careerPageUrl?: string
  publishedDate?: string
  applicationDeadline?: string
  isRemoteWork?: boolean
  workplaceType?: string
  city?: string
  state?: string
  country?: string
  type?: string
  skills?: unknown
}

/**
 * Nome de país por extenso vira ISO2.
 *
 * A lista de países já existe para a tela do perfil, com os nomes em
 * português — reusá-la aqui evita uma segunda tabela que um dia divergiria da
 * primeira. Nome desconhecido devolve `null`: um país errado é pior que país
 * nenhum, porque o filtro duro age sobre ele.
 */
const CODE_BY_NAME = new Map<string, string>([
  ...COUNTRIES.map((c) => [c.name.toLowerCase(), c.code] as [string, string]),
  // A Gupy escreve em português; "Brazil" aparece em dados vindos de fora.
  ['brazil', 'BR'],
])

export function countryCodeFromName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if (!key) return null
  // Já veio em ISO2? Aceita, mas só o que a lista conhece.
  if (/^[a-z]{2}$/.test(key)) {
    const upper = key.toUpperCase()
    return COUNTRIES.some((c) => c.code === upper) ? upper : null
  }
  return CODE_BY_NAME.get(key) ?? null
}

/** Converte o payload de uma página em vagas cruas. */
export function parseGupyPayload(payload: unknown): RawJob[] {
  const items = (payload as { data?: GupyJob[] })?.data
  if (!Array.isArray(items)) return []

  const out: RawJob[] = []

  for (const item of items) {
    const title = typeof item?.name === 'string' ? item.name.trim() : ''
    const url =
      (typeof item?.jobUrl === 'string' && item.jobUrl.trim()) ||
      (typeof item?.careerPageUrl === 'string' && item.careerPageUrl.trim()) ||
      ''
    // `careerPageName` é o nome da página de carreiras, que é o mais próximo do
    // nome da empresa que este payload oferece. Sem ele a vaga não normaliza.
    const company = typeof item?.careerPageName === 'string' ? item.careerPageName.trim() : ''
    if (!title || !url || !company) continue

    const city = typeof item?.city === 'string' ? item.city.trim() : null
    const state = typeof item?.state === 'string' ? item.state.trim() : null

    out.push({
      sourceJobId: item?.id != null ? String(item.id) : null,
      company,
      title,
      applicationUrl: url,
      city,
      region: state,
      location: [city, state].filter(Boolean).join(', ') || null,
      country: countryCodeFromName(item?.country),
      // `isRemoteWork` é a resposta direta; `workplaceType` ("on-site",
      // "remote", "hybrid") é o detalhe. O booleano ganha quando é verdadeiro
      // porque é o que a empresa afirmou, não uma etiqueta a interpretar.
      remoteType: item?.isRemoteWork === true ? 'remote' : (typeof item?.workplaceType === 'string' ? item.workplaceType : null),
      employmentType: typeof item?.type === 'string' ? item.type : null,
      description: typeof item?.description === 'string' ? item.description : null,
      publishedAt: typeof item?.publishedDate === 'string' ? item.publishedDate : null,
      skills: Array.isArray(item?.skills)
        ? item.skills.map((s) => String(s || '').trim()).filter(Boolean)
        : null,
    })
  }

  return out
}

/** Quantas vagas pedir por página. O portal usa 12; 100 reduz idas à rede. */
const PAGE_SIZE = 100

/**
 * Cria o adapter para um conjunto de termos de busca.
 *
 * Um adapter para todos os termos, e não um por termo, porque eles compartilham
 * o orçamento de tempo: com um adapter por termo, o primeiro gastaria o prazo
 * inteiro e os demais nunca rodariam — sem que nada registrasse isso.
 */
export function createGupyAdapter(options: {
  terms: string[]
  fetchImpl?: typeof fetch
  /** Teto de páginas POR TERMO. Protege contra paginação infinita. */
  maxPagesPerTerm?: number
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch
  const maxPagesPerTerm = options.maxPagesPerTerm ?? 3

  return {
    descriptor: GUPY_DESCRIPTOR,

    async collect(context: CollectContext): Promise<CollectResult> {
      const startedAt = Date.now()
      const budget = Math.max(1000, context.timeBudgetMs)

      const jobs: RawJob[] = []
      let pagesFetched = 0
      let truncated = false
      const errors: string[] = []

      for (const term of options.terms) {
        if (Date.now() - startedAt >= budget) {
          truncated = true
          break
        }

        let offset = 0
        let total = Number.POSITIVE_INFINITY
        let pagesForTerm = 0

        while (offset < total && pagesForTerm < maxPagesPerTerm) {
          if (Date.now() - startedAt >= budget) {
            truncated = true
            break
          }

          const url =
            `https://employability-portal.gupy.io/api/v1/jobs` +
            `?jobName=${encodeURIComponent(term)}&limit=${PAGE_SIZE}&offset=${offset}`

          const controller = new AbortController()
          const remaining = budget - (Date.now() - startedAt)
          const timer = setTimeout(() => controller.abort(), Math.max(1000, remaining))

          try {
            const response = await doFetch(url, { signal: controller.signal })

            if (!response.ok) {
              // Status ruim é falha do termo, não "não há vaga com essa
              // palavra". Confundir os dois é o que o §12 proíbe.
              errors.push(`HTTP ${response.status} no termo "${term}"`)
              break
            }

            const payload = await response.json()
            const page = parseGupyPayload(payload)
            jobs.push(...page)

            pagesFetched++
            pagesForTerm++

            const reported = (payload as { pagination?: { total?: unknown } })?.pagination?.total
            if (typeof reported === 'number' && Number.isFinite(reported)) total = reported

            // Página vazia encerra o termo mesmo que o total diga outra coisa —
            // sem isto, um total errado vira laço até o teto de páginas.
            if (page.length === 0) break

            offset += PAGE_SIZE
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

        // Parou antes de esgotar o termo: a coleta daquele termo ficou pela
        // metade, e a rodada inteira é parcial.
        if (offset < total && pagesForTerm >= maxPagesPerTerm) truncated = true
      }

      if (options.terms.length === 0) {
        return {
          outcome: 'complete',
          jobs: [],
          pagesFetched: 0,
          error: null,
        }
      }

      // Todos os termos falharam: é falha, não coleta vazia.
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
