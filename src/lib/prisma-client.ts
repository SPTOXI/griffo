/**
 * Construção do cliente Prisma — um único lugar, porque agora É uma decisão.
 *
 * Enquanto o projeto usou o motor nativo, `new PrismaClient()` bastava: o
 * motor lia a URL do `datasource` do schema e cuidava do pool sozinho. Com o
 * driver adapter isso deixou de ser verdade em dois pontos, e os dois falham
 * de formas que não aparecem em desenvolvimento:
 *
 * 1. **Sem adapter, não há cliente.** `new PrismaClient()` sem `adapter` lança
 *    `P2038` na primeira query. Eram seis pontos de construção neste
 *    repositório — `src/lib/db.ts` e CINCO scripts operacionais, entre eles o
 *    `apply-rls.ts` (que aplica Row Level Security) e o `fetch-hiring-index.ts`
 *    (que roda num cron mensal do GitHub Actions, onde ninguém está olhando).
 *    Migrar só o `db.ts` teria deixado os cinco quebrados.
 *
 * 2. **O pool passa a ser nosso.** Ver `DB_POOL_MAX` abaixo.
 *
 * Este módulo NÃO importa `server-only` de propósito: os scripts rodam por
 * `tsx`, fora do Next, e lá aquele import lança. É também por isso que a URL
 * entra por parâmetro em vez de sair de `./env` — aquele módulo é
 * `server-only` e cada script resolve a própria URL (uns o pool, o `apply-rls`
 * a conexão direta).
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Tamanho do pool de conexões do `pg`.
 *
 * O motor nativo mantinha pool próprio, com limite padrão de `núcleos x 2 + 1`
 * — 3 a 5 numa função da Vercel. O `pg` não herda isso: sem dizer nada ele usa
 * 10, e um valor baixo demais SERIALIZA as queries que o app dispara em
 * paralelo. São 25 pontos com `Promise.all` no código, e o painel de
 * administração abre um leque de 8 queries de uma vez.
 *
 * Medido contra Postgres local (round-trip submilissegundo, então o efeito
 * real pela rede é MAIOR), leque de 8 queries, média de 5 rodadas:
 *
 * | `max` | por leque |
 * |---|---|
 * | 1 | 16,9 ms |
 * | 3 | 10,7 ms |
 * | 5 | 11,1 ms |
 * | 10 | 9,0 ms |
 *
 * O `max: 1` que parecia a escolha conservadora custava 65% de latência a
 * mais. O 5 fica na faixa do que o motor nativo já fazia — o critério aqui é
 * NÃO mudar o comportamento que já funciona, não "otimizar". Subir mais
 * multiplica conexões por instância simultânea contra o pooler do Supabase, e
 * esse é um limite que não avisa: não falha em desenvolvimento, falha sob
 * carga.
 */
export const DB_POOL_MAX = 5

type LogLevel = 'query' | 'info' | 'warn' | 'error'

export function createPrismaClient(
  connectionString: string,
  options: { log?: LogLevel[]; max?: number } = {}
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
    max: options.max ?? DB_POOL_MAX,
  })
  return new PrismaClient({ adapter, ...(options.log ? { log: options.log } : {}) })
}

/**
 * A mesma URL que o `datasource` do schema usava quando o motor nativo a lia
 * sozinho. Existe para os scripts que construíam `new PrismaClient()` sem
 * argumento — manter a resolução idêntica é o que garante que eles continuem
 * falando com o mesmo banco de antes.
 */
export function databaseUrlFromEnv(): string {
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  if (!raw || !raw.trim()) {
    throw new Error(
      'Variável de ambiente obrigatória ausente: POSTGRES_PRISMA_URL.'
    )
  }
  return raw.trim()
}
