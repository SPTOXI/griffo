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

/**
 * Semântica de `sslmode` — a diferença que derrubou o primeiro deploy.
 *
 * O `sslmode=require` da URL do Supabase significa coisas DIFERENTES nos dois
 * motores, e é a única incompatibilidade que a validação contra Postgres local
 * não pegou (banco local não tinha TLS ligado):
 *
 * | | o que `require` faz |
 * |---|---|
 * | motor nativo do Prisma (semântica libpq) | criptografa, NÃO verifica a cadeia |
 * | `pg` 8.23 | trata como `verify-full` — verifica a cadeia inteira |
 *
 * O Supabase apresenta uma cadeia com raiz própria. O motor antigo nunca a
 * verificou; o `pg` verifica e recusa com
 * `SELF_SIGNED_CERT_IN_CHAIN: self-signed certificate in certificate chain`,
 * derrubando o build de produção inteiro no prerender.
 *
 * O `uselibpqcompat=true` é a saída que o próprio aviso do `pg` indica, e é
 * para onde o `pg@9` vai por padrão — então isto não é gambiarra, é adotar
 * cedo o comportamento futuro.
 *
 * ## O que foi medido, contra Postgres local com TLS autoassinado
 *
 * | tentativa | resultado |
 * |---|---|
 * | `sslmode=require` | falha, reproduz a produção |
 * | `sslmode=require&uselibpqcompat=true` | **conecta, e `pg_stat_ssl.ssl = true`** |
 * | `ssl: { rejectUnauthorized: false }` no PoolConfig | **falha** — o `sslmode` da URL tem precedência |
 * | `sslmode=verify-full&uselibpqcompat=true` | falha, como deve — não afrouxa quem pediu rigor |
 *
 * A correção reflexa (`rejectUnauthorized: false`) NÃO funciona aqui, e ainda
 * por cima desligaria a verificação para todo mundo. Esta só toca `require`.
 *
 * ## O que esta função NÃO faz, de propósito
 *
 * URL sem `sslmode` nenhum fica como está. O `pg` conecta em TEXTO PURO nesse
 * caso (medido), enquanto o motor nativo usava `prefer` e tentava TLS — é uma
 * diferença real. Mas `sslmode=prefer` no `pg` não faz fallback: ele ERRA
 * contra servidor sem TLS (medido), o que quebraria qualquer Postgres local de
 * desenvolvimento. Forçar TLS aqui trocaria uma quebra por outra; o lugar de
 * corrigir isso é a variável de ambiente, acrescentando `sslmode=require` a
 * ela. Registrado no §7.12.
 */
export function withLibpqSslSemantics(connectionString: string): string {
  if (!/[?&]sslmode=require(?:&|$)/i.test(connectionString)) return connectionString
  if (/[?&]uselibpqcompat=/i.test(connectionString)) return connectionString
  return `${connectionString}&uselibpqcompat=true`
}

/**
 * Verificação completa do certificado do banco, quando a CA está disponível.
 *
 * `sslmode=require` + `uselibpqcompat` criptografa mas NÃO autentica o
 * servidor: quem estiver no caminho de rede apresenta um certificado
 * autoassinado e lê/reescreve o tráfego. Com a CA do Supabase em
 * `DATABASE_CA_CERT` (o PEM baixado em Settings → Database → SSL), o `sslmode`
 * sai da URL — ele tem precedência sobre o objeto `ssl` — e o `pg` passa a
 * verificar cadeia e hostname contra essa CA.
 */
export function sslOptionsFor(
  connectionString: string,
  caCert: string | undefined = process.env.DATABASE_CA_CERT
): { connectionString: string; ssl?: { ca: string; rejectUnauthorized: true } } {
  const ca = caCert?.trim().replace(/\\n/g, '\n')
  if (ca) {
    const url = new URL(connectionString)
    url.searchParams.delete('sslmode')
    url.searchParams.delete('uselibpqcompat')
    return { connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } }
  }
  if (process.env.NODE_ENV === 'production' && /[?&]sslmode=require(?:&|$)/i.test(connectionString)) {
    warnUnverifiedTlsOnce()
  }
  return { connectionString: withLibpqSslSemantics(connectionString) }
}

let warnedUnverifiedTls = false
function warnUnverifiedTlsOnce() {
  if (warnedUnverifiedTls) return
  warnedUnverifiedTls = true
  console.warn('[db] DATABASE_CA_CERT ausente: TLS do Postgres sem verificação de certificado.')
}

type LogLevel = 'query' | 'info' | 'warn' | 'error'

export function createPrismaClient(
  connectionString: string,
  options: { log?: LogLevel[]; max?: number } = {}
): PrismaClient {
  const adapter = new PrismaPg({
    ...sslOptionsFor(connectionString),
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
