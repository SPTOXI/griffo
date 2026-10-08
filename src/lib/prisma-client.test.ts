import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sslOptionsFor, withLibpqSslSemantics } from './prisma-client'

const BASE = 'postgresql://u:p@host.pooler.supabase.com:6543/postgres'

// O caso que derrubou o primeiro deploy de produção: o `pg` trata
// `sslmode=require` como `verify-full`, o motor nativo do Prisma não. Sem o
// `uselibpqcompat`, a conexão morre em
// `SELF_SIGNED_CERT_IN_CHAIN` contra a cadeia de certificados do Supabase.
test('acrescenta uselibpqcompat quando o sslmode é require', () => {
  assert.equal(
    withLibpqSslSemantics(`${BASE}?sslmode=require`),
    `${BASE}?sslmode=require&uselibpqcompat=true`
  )
  assert.equal(
    withLibpqSslSemantics(`${BASE}?pgbouncer=true&sslmode=require`),
    `${BASE}?pgbouncer=true&sslmode=require&uselibpqcompat=true`
  )
  // `require` no meio da query, seguido de outro parâmetro.
  assert.equal(
    withLibpqSslSemantics(`${BASE}?sslmode=require&connect_timeout=15`),
    `${BASE}?sslmode=require&connect_timeout=15&uselibpqcompat=true`
  )
})

test('não distingue maiúsculas no valor do sslmode', () => {
  assert.equal(
    withLibpqSslSemantics(`${BASE}?sslmode=REQUIRE`),
    `${BASE}?sslmode=REQUIRE&uselibpqcompat=true`
  )
})

// Quem pediu verificação estrita continua com verificação estrita. Esta é a
// diferença entre a correção daqui e `rejectUnauthorized: false`, que
// afrouxaria TODA conexão — e que, medido, nem funciona: o `sslmode` da URL
// tem precedência sobre o objeto `ssl` do PoolConfig.
test('não afrouxa quem pediu rigor, nem inventa TLS onde não foi pedido', () => {
  assert.equal(withLibpqSslSemantics(`${BASE}?sslmode=verify-full`), `${BASE}?sslmode=verify-full`)
  assert.equal(withLibpqSslSemantics(`${BASE}?sslmode=verify-ca`), `${BASE}?sslmode=verify-ca`)
  assert.equal(withLibpqSslSemantics(`${BASE}?sslmode=prefer`), `${BASE}?sslmode=prefer`)
  assert.equal(withLibpqSslSemantics(`${BASE}?sslmode=disable`), `${BASE}?sslmode=disable`)
  // Sem sslmode a URL fica intacta: `sslmode=prefer` no `pg` NÃO faz fallback
  // (erra contra servidor sem TLS), então forçá-lo quebraria Postgres local.
  assert.equal(withLibpqSslSemantics(BASE), BASE)
})

test('é idempotente — não duplica o parâmetro', () => {
  const uma = withLibpqSslSemantics(`${BASE}?sslmode=require`)
  assert.equal(withLibpqSslSemantics(uma), uma)
  assert.equal(uma.match(/uselibpqcompat/g)?.length, 1)
})

test('com a CA do banco, verifica o certificado em vez de só criptografar', () => {
  const opts = sslOptionsFor(`${BASE}?pgbouncer=true&sslmode=require`, '-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----')
  assert.equal(opts.connectionString, `${BASE}?pgbouncer=true`)
  assert.deepEqual(opts.ssl, { ca: '-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----', rejectUnauthorized: true })
})

test('sem a CA, mantém a semântica libpq de antes', () => {
  assert.deepEqual(sslOptionsFor(`${BASE}?sslmode=require`, undefined), {
    connectionString: `${BASE}?sslmode=require&uselibpqcompat=true`,
  })
})
