/**
 * Adapter do Greenhouse — job board público.
 *
 * ## Verificado contra a API real
 *
 * Em 18/08/2026 este adapter foi conferido contra
 * `boards-api.greenhouse.io/v1/boards/vercel/jobs?content=true`. Três coisas
 * foram observadas, e são as três que decidem se ele pode rodar sem ninguém
 * olhando:
 *
 * 1. **Os campos são os esperados** — `title`, `absolute_url`, `id`,
 *    `location.name`, `updated_at` e `content`. O `content` vem com as
 *    entidades HTML escapadas (`&lt;div class=&quot;…`), que é exatamente a
 *    forma que motivou a ordem decodificar→limpar mais abaixo.
 * 2. **Não há paginação** — o `meta.total` da resposta bateu com o tamanho de
 *    `jobs` (84 e 84). A resposta vem inteira, então declarar a coleta
 *    `complete` é honesto e não esconde um truncamento.
 * 3. **Board inexistente responde 404**, não 200 com lista vazia. É o ponto
 *    crítico: se um token errado devolvesse 200, uma coleta boa-aparência
 *    fecharia todas as vagas da empresa — o cenário que o §12 existe para
 *    conter. Como responde 404, o `!response.ok` abaixo já converte isso em
 *    `outcome: 'failed'`, e o decisor de coleta não fecha nada.
 *
 * O que a verificação NÃO cobre: o comportamento da API sob instabilidade
 * (5xx intermitente, resposta parcial). O tratamento existe e está testado com
 * `fetch` injetado, mas não foi observado acontecendo de verdade.
 *
 * Para conferir um board novo antes de acrescentá-lo a `VERIFIED_BOARDS`:
 *
 * ```
 * curl -o /dev/null -w "%{http_code}\n" \
 *   "https://boards-api.greenhouse.io/v1/boards/<token>/jobs?content=true"
 * ```
 *
 * ## Por que o Greenhouse primeiro
 *
 * É o ATS com o board público mais estável e mais documentado, e não exige
 * chave. Serve de referência para os demais adapters: quem escrever o do Lever
 * ou o da Gupy tem aqui a forma do contrato.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'
import { decodeBasicEntities, stripHtml } from '../text'

export const GREENHOUSE_DESCRIPTOR: JobSourceDescriptor = {
  slug: 'greenhouse',
  name: 'Greenhouse (job board público)',
  kind: 'ats',
  // Greenhouse é dominante nos EUA e forte no Reino Unido, Canadá e no remoto
  // internacional. Declarar isso evita varrê-lo atrás de vaga em mercados onde
  // ele é irrelevante.
  markets: ['US', 'CA', 'GB', 'GLOBAL'],
  accessNote:
    'Job board público, sem autenticação, documentado pelo próprio Greenhouse para consumo por terceiros.',
}

/** O formato que a API do board público devolve, no que nos interessa. */
interface GreenhouseJob {
  id?: number | string
  title?: string
  absolute_url?: string
  /** Última edição do anúncio. NÃO é a data de publicação. */
  updated_at?: string
  /** Publicação de verdade. Nem todo board preenche. */
  first_published?: string
  content?: string
  company_name?: string
  location?: { name?: string }
  metadata?: { name?: string; value?: unknown }[]
  departments?: { name?: string }[]
}

/**
 * Converte o payload do Greenhouse em vagas cruas.
 *
 * Separada de `collect` de propósito: é ela que os testes exercitam, sem rede.
 * Uma vaga sem título ou sem URL é descartada aqui — o normalizador a recusaria
 * de qualquer forma, e descartar antes evita ruído no log.
 */
export function parseGreenhousePayload(payload: unknown, companyName: string): RawJob[] {
  const jobs = (payload as { jobs?: GreenhouseJob[] })?.jobs
  if (!Array.isArray(jobs)) return []

  const out: RawJob[] = []
  for (const item of jobs) {
    const title = typeof item?.title === 'string' ? item.title.trim() : ''
    const url = typeof item?.absolute_url === 'string' ? item.absolute_url.trim() : ''
    if (!title || !url) continue

    // O Greenhouse manda a localização como texto livre ("San Francisco, CA" ou
    // "Remote - US"). Não tentamos separar país aqui: quem sabe fazer isso é o
    // normalizador, com o contexto de mercado. Mandar o texto inteiro é mais
    // honesto que adivinhar um país errado.
    const location = typeof item?.location?.name === 'string' ? item.location.name : null

    out.push({
      sourceJobId: item?.id != null ? String(item.id) : null,
      // O board traz `company_name`. Preferir o nome configurado — é ele que o
      // operador escolheu e que fica estável entre coletas —, e cair no do
      // payload só quando não houver configuração.
      company: companyName || (typeof item?.company_name === 'string' ? item.company_name : ''),
      title,
      applicationUrl: url,
      location,
      // `content` vem como HTML escapado. Desfazer as entidades ANTES de tirar
      // as tags. Na ordem inversa, um
      // `&lt;p&gt;` sobrevive à limpeza e só vira `<p>` depois dela — deixando
      // marcação no texto que foi justamente limpo para não tê-la.
      description: typeof item?.content === 'string' ? stripHtml(decodeBasicEntities(item.content)) : null,
      // `first_published` é a publicação; `updated_at` é a última edição. Usar
      // `updated_at` faria uma vaga antiga reeditada parecer recém-publicada, e
      // o Radar prioriza vaga nova — ela furaria a fila indefinidamente. Nem
      // todo board preenche `first_published`, daí o recuo.
      publishedAt: pickDate(item?.first_published, item?.updated_at),
      remoteType: location,
    })
  }

  return out
}

function pickDate(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  return null
}

/**
 * Cria o adapter para um board.
 *
 * `fetchImpl` é injetável para que o teste exercite a coleta inteira sem rede —
 * e para que, quando alguém for verificar contra a API real, baste passar o
 * `fetch` de verdade sem tocar no resto.
 */
export function createGreenhouseAdapter(options: {
  boardToken: string
  companyName: string
  fetchImpl?: typeof fetch
}): JobSourceAdapter {
  const doFetch = options.fetchImpl ?? fetch

  return {
    descriptor: {
      ...GREENHOUSE_DESCRIPTOR,
      slug: `greenhouse:${options.boardToken}`,
      name: `${options.companyName} (Greenhouse)`,
    },

    async collect(context: CollectContext): Promise<CollectResult> {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(options.boardToken)}/jobs?content=true`

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.max(1000, context.timeBudgetMs))

      try {
        const response = await doFetch(url, { signal: controller.signal })

        if (!response.ok) {
          // Status ruim é falha, não "board sem vagas". Confundir os dois é
          // exatamente o que o §12 proíbe.
          return {
            outcome: 'failed',
            jobs: [],
            error: `HTTP ${response.status} do board ${options.boardToken}`,
            pagesFetched: 0,
          }
        }

        const payload = await response.json()
        const jobs = parseGreenhousePayload(payload, options.companyName)

        // O board público devolve tudo numa resposta só — não há paginação a
        // truncar. Por isso `complete` é honesto aqui, e não seria numa fonte
        // paginada sem confirmação de última página.
        return { outcome: 'complete', jobs, pagesFetched: 1 }
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

/** Um board do Greenhouse: o token na URL e o nome que vai para a vaga. */
export interface GreenhouseBoard {
  token: string
  company: string
}

/**
 * Boards conferidos contra a API real.
 *
 * Só entra aqui board que respondeu 200 com vagas ao `curl` do cabeçalho. Um
 * token não conferido não custa "uma vaga a menos": custa uma fonte que falha
 * toda rodada, enchendo o log de erro e gastando o orçamento de tempo da
 * coleta antes das fontes que funcionam.
 */
export const VERIFIED_BOARDS: GreenhouseBoard[] = [{ token: 'vercel', company: 'Vercel' }]

/** Tokens são segmento de URL. Recusar o resto evita montar uma URL inválida. */
const TOKEN_SHAPE = /^[a-z0-9][a-z0-9._-]*$/i

/**
 * Lê a lista de boards de `GREENHOUSE_BOARDS`, no formato
 * `token:Nome da Empresa,outro-token:Outra Empresa`.
 *
 * Existe para que acrescentar um board seja uma variável de ambiente e não um
 * deploy de código. Entrada malformada é **descartada**, nunca corrigida por
 * adivinhação: um token inventado a partir de lixo produziria uma fonte que
 * falha silenciosamente toda rodada.
 */
export function parseBoardSpec(spec: string | null | undefined): GreenhouseBoard[] {
  if (typeof spec !== 'string') return []

  const out: GreenhouseBoard[] = []
  const seen = new Set<string>()

  for (const entry of spec.split(',')) {
    const separator = entry.indexOf(':')
    const token = (separator === -1 ? entry : entry.slice(0, separator)).trim()
    if (!TOKEN_SHAPE.test(token)) continue

    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    // Sem nome declarado, o token serve: o `company_name` do payload entra
    // como recuo na conversão.
    const company = separator === -1 ? '' : entry.slice(separator + 1).trim()
    out.push({ token, company })
  }

  return out
}

/**
 * As fontes do Greenhouse desta instalação.
 *
 * A variável de ambiente **substitui** a lista conferida, não soma a ela: quem
 * define `GREENHOUSE_BOARDS` está dizendo quais boards quer, e receber junto um
 * board que não pediu seria surpresa.
 */
export function greenhouseAdapters(env: string | null | undefined): JobSourceAdapter[] {
  const configured = parseBoardSpec(env)
  const boards = configured.length > 0 ? configured : VERIFIED_BOARDS

  return boards.map((board) =>
    createGreenhouseAdapter({ boardToken: board.token, companyName: board.company })
  )
}
