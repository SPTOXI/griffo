/**
 * Aplica `prisma/rls.sql`. Rode com: `npm run db:rls`
 *
 * ## Por que não é uma chamada ao psql
 *
 * A primeira versão deste comando era
 * `psql "$POSTGRES_URL_NON_POOLING" -f prisma/rls.sql`, e ela falhava no
 * Windows por dois motivos independentes — o segundo só apareceria depois de
 * resolvido o primeiro:
 *
 *  1. `psql` não vem instalado. É parte do pacote cliente do PostgreSQL, que
 *     ninguém precisa ter para desenvolver este projeto: o Prisma fala com o
 *     banco pelo próprio driver.
 *
 *  2. `"$POSTGRES_URL_NON_POOLING"` é expansão de shell Unix. Os scripts do npm
 *     rodam pelo `cmd.exe` no Windows, que não expande essa forma — o psql
 *     receberia a string literal `$POSTGRES_URL_NON_POOLING` como se fosse a
 *     connection string, e o erro resultante não teria relação visível com a
 *     causa.
 *
 * Este script não depende de binário externo nem de sintaxe de shell, então
 * roda igual no Windows, no macOS e no Linux.
 *
 * ## Qual conexão ele usa
 *
 * A DIRETA (`POSTGRES_URL_NON_POOLING`), não a do pool. `ALTER TABLE` e
 * `ALTER DEFAULT PRIVILEGES` são DDL, e DDL através do PgBouncer em modo
 * transação é caminho para erro intermitente. É a mesma conexão que o
 * `directUrl` do schema declara para as migrações, pelo mesmo motivo.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createPrismaClient } from '../lib/prisma-client'
import { loadEnvFile } from './load-env'
import { returnsRows, splitSqlStatements } from '../lib/sql-split'

loadEnvFile()

/**
 * O papel precisa ser DONO das tabelas para ligar RLS. No Supabase é o
 * `postgres` da connection string do painel — a mesma que já está no `.env`.
 */
function directDatabaseUrl(): string {
  const url =
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.DATABASE_URL?.trim()

  if (!url) {
    throw new Error(
      'Nenhuma connection string encontrada.\n' +
        'Defina POSTGRES_URL_NON_POOLING no arquivo .env (a conexão DIRETA, porta 5432 —\n' +
        'não a do pool na 6543). É a mesma que o `directUrl` do schema.prisma usa.'
    )
  }

  if (/pgbouncer=true/i.test(url) || /:6543\//.test(url)) {
    console.warn(
      '[db:rls] Aviso: a connection string parece ser a do POOL (pgbouncer/6543).\n' +
        '         DDL pelo pool pode falhar de forma intermitente. O ideal é\n' +
        '         POSTGRES_URL_NON_POOLING, que aponta para a conexão direta.\n'
    )
  }

  return url
}

interface TableRow {
  tabela_sem_rls: string
}

interface ExposedRow {
  papel: string
  tabela: string
}

async function main() {
  const sqlPath = join(process.cwd(), 'prisma', 'rls.sql')

  let sql: string
  try {
    sql = readFileSync(sqlPath, 'utf-8')
  } catch {
    throw new Error(
      `Arquivo não encontrado: ${sqlPath}\n` +
        'Rode o comando a partir da raiz do projeto (a pasta que contém package.json).'
    )
  }

  const statements = splitSqlStatements(sql)
  if (statements.length === 0) {
    throw new Error(`Nenhuma instrução SQL encontrada em ${sqlPath}.`)
  }

  // Conexão DIRETA, não o pool: este script altera catálogo (RLS) e precisa
  // falar com o Postgres, não com o pooler. `max: 1` porque é um script
  // sequencial — nada aqui roda em paralelo.
  const db = createPrismaClient(directDatabaseUrl(), { log: ['error'], max: 1 })

  try {
    // Estado ANTES: sem isto o script não consegue dizer o que de fato mudou,
    // e "aplicado com sucesso" numa base que já estava aplicada é indistinguível
    // de "aplicado com sucesso" numa base que acabou de ser protegida.
    const antes = (await db.$queryRawUnsafe(PENDING_TABLES_QUERY)) as TableRow[]
    console.log(
      antes.length === 0
        ? '[db:rls] Todas as tabelas já estavam com RLS ligado. Reaplicando por garantia.\n'
        : `[db:rls] ${antes.length} tabela(s) sem RLS: ${antes.map((t) => t.tabela_sem_rls).join(', ')}\n`
    )

    for (const [index, statement] of statements.entries()) {
      const rotulo = `${index + 1}/${statements.length}`
      const primeiraLinha = statement.split('\n').find((l) => l.trim() && !l.trim().startsWith('--'))
      console.log(`[db:rls] ${rotulo} ${primeiraLinha?.trim().slice(0, 70) ?? ''}`)

      // A instrução de conferência do arquivo devolve linhas; as demais, não.
      // `$executeRawUnsafe` recusa quem devolve linhas, e vice-versa.
      if (returnsRows(statement)) {
        await db.$queryRawUnsafe(statement)
      } else {
        await db.$executeRawUnsafe(statement)
      }
    }

    // Estado DEPOIS. Esta é a única linha que responde "deu certo?".
    //
    // Os `RAISE NOTICE` de dentro dos blocos `DO` não chegam aqui: o Prisma não
    // repassa mensagens de aviso do servidor. Então a conferência é feita
    // consultando o catálogo de novo, que é prova melhor que log de qualquer
    // jeito — ela mede o estado, não a intenção.
    const depois = (await db.$queryRawUnsafe(PENDING_TABLES_QUERY)) as TableRow[]
    const expostas = (await db.$queryRawUnsafe(EXPOSED_TABLES_QUERY)) as ExposedRow[]

    console.log()
    if (depois.length === 0 && expostas.length === 0) {
      console.log('[db:rls] OK — RLS ligado em todas as tabelas do schema public.')
      console.log('[db:rls] Nenhum privilégio de tabela para `anon` ou `authenticated`.')
      return
    }

    if (expostas.length > 0) {
      console.error(
        `[db:rls] ATENÇÃO: ${expostas.length} par(es) tabela/papel ainda com privilégio:\n` +
          expostas.map((r) => `  - ${r.papel} → ${r.tabela}`).join('\n')
      )
    }

    if (depois.length > 0) {
      console.error(
        `[db:rls] ATENÇÃO: ${depois.length} tabela(s) continuam sem RLS:\n` +
          depois.map((t) => `  - ${t.tabela_sem_rls}`).join('\n') +
          '\n\nIsso normalmente significa que o usuário da connection string não é dono\n' +
          'dessas tabelas. Use a connection string do painel do Supabase\n' +
          '(Settings > Database > Connection string > URI), que conecta como `postgres`.'
      )
    }
    process.exitCode = 1
  } finally {
    await db.$disconnect()
  }
}

/**
 * Pares tabela/papel em que `anon` ou `authenticated` ainda alcançam a tabela.
 * Vazio = a API pública do Supabase não lê nada. Esta é a conferência que
 * realmente responde à pergunta.
 *
 * `has_table_privilege` é usada de propósito no lugar de consultar
 * `role_table_grants`: ela leva em conta privilégio HERDADO — de outro papel
 * ou do pseudo-papel `PUBLIC` —, e o grant direto é só uma das formas de ter
 * acesso. Uma consulta que só olhasse os grants diretos declararia sucesso com
 * a porta aberta por herança.
 *
 * Nota sobre o `USAGE` no schema: ele continua valendo para todo mundo, porque
 * o Postgres o concede a `PUBLIC` por padrão e revogar de `anon` não desfaz o
 * que vem por herança. Isso é inofensivo — `USAGE` no schema permite apenas
 * referenciar nomes, e sem privilégio de tabela nenhuma linha sai. Revogar de
 * `PUBLIC` afetaria todo papel do banco, inclusive extensões, e é da mesma
 * categoria do FORCE: não se aplica às cegas.
 *
 * Nota sobre os `::text`: `relname` e `rolname` são do tipo `name` do
 * Postgres, não `text`. O motor nativo do Prisma desserializava `name`
 * sozinho; o driver adapter (`@prisma/adapter-pg`) NÃO, e devolve
 * `Failed to deserialize column of type 'name'` — derrubando este script
 * inteiro, que é justamente o que aplica Row Level Security. O cast é a
 * correção que o próprio erro do Prisma sugere, vale nos dois motores e não
 * muda o resultado: `name` e `text` têm a mesma representação textual.
 */
const EXPOSED_TABLES_QUERY = `
  SELECT r.rolname::text AS papel, c.relname::text AS tabela
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN pg_roles r
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND r.rolname IN ('anon', 'authenticated')
    AND (
      has_table_privilege(r.oid, c.oid, 'SELECT')
      OR has_table_privilege(r.oid, c.oid, 'INSERT')
      OR has_table_privilege(r.oid, c.oid, 'UPDATE')
      OR has_table_privilege(r.oid, c.oid, 'DELETE')
    )
  ORDER BY r.rolname, c.relname
`

/** Tabelas do schema `public` ainda sem RLS. Vazio = tudo protegido. */
const PENDING_TABLES_QUERY = `
  SELECT c.relname::text AS tabela_sem_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
  ORDER BY c.relname
`

main().catch((e: any) => {
  console.error(`\n[db:rls] Falhou: ${e?.message || e}`)
  process.exitCode = 1
})
