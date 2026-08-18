/**
 * Adapter do Lever — job board público.
 *
 * ## Verificado contra a API real
 *
 * Em 18/08/2026, contra `api.lever.co/v0/postings/leverdemo?mode=json`. As três
 * perguntas que decidem se uma fonte pode rodar sem ninguém olhando:
 *
 * 1. **Os campos** são `id`, `text` (o cargo), `hostedUrl`, `applyUrl`,
 *    `createdAt`, `categories`, `workplaceType`, `country` e as quatro versões
 *    da descrição (`descriptionPlain`, `description`, `additionalPlain`,
 *    `additional`).
 * 2. **Não há paginação**: a resposta é um array puro, sem envelope. Vieram 388
 *    vagas de uma vez, então declarar a coleta `complete` é honesto.
 * 3. **Board inexistente responde 404** — verificado com dois tokens que não
 *    existem. O `!response.ok` já converte isso em `outcome: 'failed'`, e o
 *    decisor de coleta não fecha vaga nenhuma diante de falha.
 *
 * ## Duas vantagens sobre o Greenhouse, e uma armadilha
 *
 * O Lever entrega **`country` em ISO2** já pronto, em vez de só um texto livre
 * de localização — o normalizador não precisa adivinhar. E entrega
 * `descriptionPlain`, texto já sem marcação, o que dispensa a limpeza de HTML
 * que no Greenhouse tem ordem certa e frágil.
 *
 * A armadilha é `createdAt`: vem em **milissegundos desde a época**, não em
 * texto ISO. Passá-lo adiante como está faria o normalizador ler um número onde
 * espera uma data — e uma vaga sem data de publicação some da priorização do
 * Radar, que ordena por vaga nova.
 *
 * ## O que continua sem observação
 *
 * O comportamento sob instabilidade: 5xx intermitente, resposta parcial,
 * conexão caindo no meio. O tratamento existe e está testado com `fetch`
 * injetado, mas não foi visto acontecendo.
 *
 * Para conferir um board novo antes de acrescentá-lo:
 *
 * ```
 * curl -o /dev/null -w "%{http_code}\n" \
 *   "https://api.lever.co/v0/postings/<token>?mode=json"
 * ```
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'

export const LEVER_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'lever',
  name: 'Lever (job board público)',
  kind: 'ats',
  // Lista vazia significa "atende qualquer mercado", e aqui é a verdade: o
  // Lever é usado por empresas de vários países, e cada board declara o país de
  // suas próprias vagas em `country`. Declarar uma lista fixa aqui esconderia
  // vagas de um mercado que um board específico atende.
  markets: [],
  accessNote:
    'Job board público, sem autenticação, documentado pelo próprio Lever para consumo por terceiros.',
}

/** O formato que a API devolve, no que nos interessa. */
interface LeverPosting {
  id?: string
  /** O cargo. O campo se chama `text`, não `title`. */
  text?: string
  hostedUrl?: string
  applyUrl?: string
  /** Milissegundos desde a época. NÃO é texto ISO. */
  createdAt?: number
  country?: string
  workplaceType?: string
  descriptionPlain?: string
  additionalPlain?: string
  categories?: {
    location?: string
    allLocations?: string[]
    commitment?: string
    department?: string
    team?: string
  }
}

/**
 * `createdAt` em milissegundos vira texto ISO.
 *
 * Zero e negativo são recusados: representariam 1970 ou antes, o que num
 * anúncio de emprego é dado corrompido, não uma vaga antiga. Uma data absurda
 * é pior que data nenhuma — ela ordena a lista e empurra vaga real para baixo.
 */
export function isoFromEpochMs(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Converte o payload em vagas cruas.
 *
 * Separada de `collect` de propósito: é ela que os testes exercitam, sem rede.
 */
export function parseLeverPayload(payload: unknown, companyName: string): RawJob[] {
  if (!Array.isArray(payload)) return []

  const out: RawJob[] = []

  for (const item of payload as LeverPosting[]) {
    const title = typeof item?.text === 'string' ? item.text.trim() : ''
    // `applyUrl` leva direto ao formulário; `hostedUrl` à página da vaga.
    // Preferir o primeiro poupa um clique de quem já decidiu se candidatar.
    const url =
      (typeof item?.applyUrl === 'string' && item.applyUrl.trim()) ||
      (typeof item?.hostedUrl === 'string' && item.hostedUrl.trim()) ||
      ''
    if (!title || !url) continue

    const categories = item?.categories ?? {}
    const location = typeof categories.location === 'string' ? categories.location : null

    // `descriptionPlain` é o corpo; `additionalPlain` costuma trazer o texto
    // institucional da empresa. Os dois juntos dão ao matching o vocabulário
    // completo do anúncio, que é o que ele lê para achar evidência.
    const description = [item?.descriptionPlain, item?.additionalPlain]
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .join('\n\n')
      .trim()

    out.push({
      sourceJobId: typeof item?.id === 'string' ? item.id : null,
      company: companyName,
      title,
      applicationUrl: url,
      location,
      // Diferente do Greenhouse: aqui o país vem pronto e confiável. Não há o
      // que adivinhar a partir do texto da localização.
      country: typeof item?.country === 'string' ? item.country : null,
      remoteType: typeof item?.workplaceType === 'string' ? item.workplaceType : location,
      employmentType: typeof categories.commitment === 'string' ? categories.commitment : null,
      description: description || null,
      publishedAt: isoFromEpochMs(item?.createdAt),
    })
  }

  return out
}

/**
 * Cria o adapter para um board.
 *
 * `fetchImpl` é injetável para que o teste exercite a coleta inteira sem rede.
 */
export function createLeverAdapter(options: {
  boardToken: string
  companyName: string
  fetchImpl?: typeof fetch
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch

  /**
   * Sem nome declarado, o token serve de nome.
   *
   * Diferente do Greenhouse, o Lever NÃO manda o nome da empresa no payload —
   * não há de onde tirar. E `company` é obrigatório na normalização: vazio, as
   * vagas seriam descartadas uma a uma e a coleta terminaria "bem-sucedida" com
   * zero resultados, que é o pior jeito de falhar.
   *
   * O token é o identificador da própria empresa no Lever, então usá-lo não é
   * inventar dado — é usar o dado feio em vez de nenhum.
   */
  const companyName = options.companyName.trim() || options.boardToken

  return {
    descriptor: {
      ...LEVER_DESCRIPTOR,
      slug: `lever:${options.boardToken}`,
      name: `${companyName} (Lever)`,
    },

    async collect(context: CollectContext): Promise<CollectResult> {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(options.boardToken)}?mode=json`

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.max(1000, context.timeBudgetMs))

      try {
        const response = await doFetch(url, { signal: controller.signal })

        if (!response.ok) {
          // Status ruim é falha, não "board sem vagas". Confundir os dois é o
          // que o §12 proíbe: um 500 apagaria as vagas da empresa.
          return {
            outcome: 'failed',
            jobs: [],
            error: `HTTP ${response.status} do board ${options.boardToken}`,
            pagesFetched: 0,
          }
        }

        const payload = await response.json()

        // Um objeto onde deveria vir um array é a API dizendo outra coisa —
        // provavelmente um erro embrulhado em 200. Tratar como zero vagas seria
        // exatamente o engano que o §12 existe para conter.
        if (!Array.isArray(payload)) {
          return {
            outcome: 'failed',
            jobs: [],
            error: `Resposta do board ${options.boardToken} não veio como lista de vagas`,
            pagesFetched: 0,
          }
        }

        return { outcome: 'complete', jobs: parseLeverPayload(payload, companyName), pagesFetched: 1 }
      } catch (e: any) {
        const aborted = e?.name === 'AbortError'
        return {
          outcome: 'failed',
          jobs: [],
          error: aborted
            ? `Tempo esgotado ao coletar o board ${options.boardToken}`
            : `${e?.message || String(e)}`,
          pagesFetched: 0,
        }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

/** Um board do Lever: o token na URL e o nome que vai para a vaga. */
export interface LeverBoard {
  token: string
  company: string
}

/**
 * Boards conferidos contra a API real.
 *
 * Vazia de propósito: `leverdemo` é o board de demonstração do próprio Lever —
 * serve para verificar o formato, não para alimentar o Radar com vagas de
 * mentira. Nenhum board de produção foi conferido ainda, e ligar um token não
 * conferido custa uma fonte que falha toda rodada, gastando o orçamento de
 * tempo das que funcionam.
 *
 * Acrescentar boards é definir `LEVER_BOARDS` — sem deploy.
 */
export const VERIFIED_LEVER_BOARDS: LeverBoard[] = []

const TOKEN_SHAPE = /^[a-z0-9][a-z0-9._-]*$/i

/**
 * Lê a lista de boards de `LEVER_BOARDS`, no formato
 * `token:Nome da Empresa,outro-token:Outra Empresa`.
 *
 * Entrada malformada é descartada, nunca corrigida por adivinhação.
 */
export function parseLeverBoardSpec(spec: string | null | undefined): LeverBoard[] {
  if (typeof spec !== 'string') return []

  const out: LeverBoard[] = []
  const seen = new Set<string>()

  for (const entry of spec.split(',')) {
    const separator = entry.indexOf(':')
    const token = (separator === -1 ? entry : entry.slice(0, separator)).trim()
    if (!TOKEN_SHAPE.test(token)) continue

    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ token, company: separator === -1 ? '' : entry.slice(separator + 1).trim() })
  }

  return out
}

/** As fontes do Lever desta instalação. */
export function leverAdapters(env: string | null | undefined): JobSourceAdapter[] {
  const configured = parseLeverBoardSpec(env)
  const boards = configured.length > 0 ? configured : VERIFIED_LEVER_BOARDS

  return boards.map((board) =>
    createLeverAdapter({ boardToken: board.token, companyName: board.company })
  )
}
