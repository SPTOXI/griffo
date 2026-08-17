/**
 * Adapter do Greenhouse — job board público.
 *
 * ## ⚠️ Não verificado contra a API real
 *
 * Este adapter foi escrito a partir do formato documentado do job board público
 * do Greenhouse (`boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true`),
 * mas **não foi executado contra a API de verdade**: o ambiente onde ele foi
 * escrito não tem saída de rede para hosts externos.
 *
 * O que está testado é a **conversão**: dada uma resposta no formato esperado,
 * ele produz as vagas certas; dada uma resposta malformada, ele falha do jeito
 * certo. O que NÃO está verificado é se a API responde nesse formato hoje.
 *
 * Antes de ligar esta fonte em produção, rode uma coleta contra um board real e
 * confira: o formato dos campos, o comportamento da paginação e o que a API
 * devolve quando o board não existe. Enquanto isso não for feito, a fonte deve
 * ficar com `enabled: false`.
 *
 * ## Por que o Greenhouse primeiro
 *
 * É o ATS com o board público mais estável e mais documentado, e não exige
 * chave. Serve de referência para os demais adapters: quem escrever o do Lever
 * ou o da Gupy tem aqui a forma do contrato.
 */

import type { CollectContext, CollectResult, JobSourceAdapter, JobSourceDescriptor } from '../adapter'
import type { RawJob } from '../types'

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
  updated_at?: string
  content?: string
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
      company: companyName,
      title,
      applicationUrl: url,
      location,
      // `content` vem como HTML escapado. Desfazer as entidades ANTES de tirar
      // as tags. Na ordem inversa, um
      // `&lt;p&gt;` sobrevive à limpeza e só vira `<p>` depois dela — deixando
      // marcação no texto que foi justamente limpo para não tê-la.
      description: typeof item?.content === 'string' ? stripHtml(decodeBasicEntities(item.content)) : null,
      publishedAt: typeof item?.updated_at === 'string' ? item.updated_at : null,
      remoteType: location,
    })
  }

  return out
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/**
 * Uma passada só, de propósito.
 *
 * Substituições encadeadas decodificam duas vezes: `&amp;lt;` — que representa
 * o texto literal `&lt;` — vira `&lt;` na primeira troca e depois `<` na
 * segunda, transformando texto do anúncio em marcação. Uma varredura única não
 * reexamina o que acabou de escrever.
 */
function decodeBasicEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
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
