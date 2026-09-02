/**
 * A leitura da tabela inteira do índice, com cache.
 *
 * Separada de `atlas.ts` pelo motivo do cabeçalho de `lookup.server.ts`:
 * `@/lib/db` carrega `server-only`, e `server-only` derruba qualquer módulo
 * importado por um teste rodado via `tsx`. Aqui não há decisão de dado nenhuma
 * para testar — é um `findMany`, um `aggregate` e uma delegação.
 *
 * ## Por que existe cache aqui, e não em `lookup.server.ts`
 *
 * `/api/hiring-index/[country]` lê as ~28 linhas de UM país, atrás de sessão,
 * dentro do laudo pago. Esta consulta lê **as 2.757 linhas** da tabela e roda
 * `classifyHiringPhase` 98 vezes — e serve uma página PÚBLICA, sem login, que
 * existe para ser encontrada por buscador e por motor de resposta. Sem freio,
 * cada visitante anônimo (e cada rastreador) custaria uma varredura completa da
 * tabela contra o Postgres compartilhado com as requisições de usuário.
 *
 * ## Por que uma hora, para um dado que muda por mês
 *
 * O `/api/cron/hiring-index` roda no máximo semanalmente, e as fontes publicam
 * por mês ou por trimestre (§2.52) — em rigor, um cache de um dia seria
 * correto. Uma hora é o compromisso com o outro lado: o processo é reciclado a
 * cada deploy e em toda instância fria, então um TTL longo não compra tanto
 * quanto parece, e um TTL curto garante que uma coleta manual apareça na
 * página pública no mesmo expediente, sem ninguém precisar lembrar de purgar
 * nada.
 *
 * O padrão do cache é o mesmo de `ai-router/registry.ts`: memória do processo,
 * com carimbo de hora. Vale por instância, não globalmente — o que é aceitável
 * porque o pior caso de um cache frio é uma consulta, não uma resposta errada.
 * **Falha não é cacheada**: o `catch` devolve o último bom resultado se houver
 * um, e propaga o erro se não houver — a rota é que decide o que dizer, e
 * "não consegui consultar" nunca pode virar "não há dado para este país".
 */

import { db } from '@/lib/db'
import { summarizeAtlas, type HiringAtlas } from './atlas'
import type { LaborMarketRow } from './lookup'

const ATLAS_CACHE_TTL_MS = 60 * 60_000

let cached: { data: HiringAtlas; at: number } | null = null

/** Descarta o cache. Existe para o cron chamar depois de gravar. */
export function clearHiringAtlasCache() {
  cached = null
}

/** O índice inteiro, um resumo por país coberto mais a distribuição de fases. */
export async function loadHiringAtlas(): Promise<HiringAtlas> {
  if (cached && Date.now() - cached.at < ATLAS_CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const [rows, collected] = await Promise.all([
      db.laborMarketPoint.findMany({
        orderBy: [{ country: 'asc' }, { period: 'asc' }],
        select: {
          country: true,
          source: true,
          metric: true,
          value: true,
          unit: true,
          period: true,
          periodType: true,
          revised: true,
          seriesBreak: true,
          confidence: true,
          note: true,
        },
      }) as Promise<LaborMarketRow[]>,
      db.laborMarketPoint.aggregate({ _max: { fetchedAt: true } }),
    ])

    const data = summarizeAtlas(rows, collected._max.fetchedAt ?? null)
    cached = { data, at: Date.now() }
    return data
  } catch (e) {
    // Resultado antigo é melhor que nenhum — e muito melhor que uma página que
    // afirma "nenhum país tem dado" porque o banco não respondeu.
    if (cached) {
      console.warn('[hiring-index] atlas: consulta falhou, servindo cache anterior:', e)
      return cached.data
    }
    throw e
  }
}
