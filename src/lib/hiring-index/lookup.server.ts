/**
 * A consulta ao banco do índice de temperatura de contratação.
 *
 * Fica separada de `lookup.ts` pelo motivo descrito no cabeçalho daquele
 * arquivo: `@/lib/db` carrega `server-only`, e `server-only` derruba qualquer
 * módulo importado por um teste rodado via `tsx`. Aqui não há decisão nenhuma
 * para testar — é `findMany` e delega. Toda a lógica que vale a pena travar em
 * teste está no arquivo puro.
 *
 * Convenção de acesso a dados igual à das demais rotas (`api/user/*`,
 * `api/resume/*`): importar `db` de `@/lib/db` direto, sem cliente próprio.
 */

import { db } from '@/lib/db'
import { normalizeCountryCode, summarizeHiringIndex, type HiringIndexSummary, type LaborMarketRow } from './lookup'

/**
 * O resumo do país, direto da tabela.
 *
 * Código de país inválido devolve o mesmo desfecho de país sem cobertura, e não
 * um erro: quem chama é uma tela, e "não temos dado disso" é a resposta certa
 * tanto para `ZZ` quanto para `AR`.
 *
 * A consulta traz TODAS as linhas do país — as várias combinações de
 * `source`/`metric` que o esquema aceita — e é `lookup.ts` quem escolhe qual
 * série vale. Filtrar por fonte aqui seria enterrar essa decisão numa cláusula
 * `where` onde nenhum teste a alcança.
 */
export async function lookupHiringIndex(rawCountry: string): Promise<HiringIndexSummary> {
  const country = normalizeCountryCode(rawCountry)
  if (!country) return summarizeHiringIndex(rawCountry ?? '', [])

  const rows = (await db.laborMarketPoint.findMany({
    where: { country },
    orderBy: { period: 'asc' },
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
  })) as LaborMarketRow[]

  return summarizeHiringIndex(country, rows)
}
