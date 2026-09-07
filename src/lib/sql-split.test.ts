import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { join } from 'path'
import { returnsRows, splitSqlStatements } from './sql-split'

test('divide instruções simples', () => {
  assert.deepEqual(splitSqlStatements('SELECT 1; SELECT 2;'), ['SELECT 1', 'SELECT 2'])
})

test('não corta dentro de bloco $$', () => {
  const sql = `
    DO $$
    BEGIN
      EXECUTE 'ALTER TABLE x ENABLE ROW LEVEL SECURITY';
      RAISE NOTICE 'feito';
    END
    $$;
    SELECT 1;
  `
  const out = splitSqlStatements(sql)
  assert.equal(out.length, 2, 'o bloco DO inteiro é UMA instrução')
  assert.match(out[0], /^DO \$\$/)
  assert.match(out[0], /END\s+\$\$$/)
  assert.equal(out[1], 'SELECT 1')
})

test('não corta dentro de bloco com tag nomeada', () => {
  const sql = `DO $corpo$ BEGIN PERFORM 1; END $corpo$; SELECT 2;`
  assert.equal(splitSqlStatements(sql).length, 2)
})

test('apóstrofo ímpar em comentário não desalinha o resto do arquivo', () => {
  // Este é o caso REAL de prisma/rls.sql — sem tratar comentário antes de
  // aspas, tudo a partir do comentário vira uma instrução só.
  const sql = `
    -- usa current_setting('app.user_id') para saber quem é
    SELECT 1;
    SELECT 2;
  `
  const out = splitSqlStatements(sql)
  assert.equal(out.length, 2)
  assert.equal(out[1], 'SELECT 2')
})

test('ponto e vírgula dentro de string não corta', () => {
  const out = splitSqlStatements(`SELECT 'a;b'; SELECT 2;`)
  assert.deepEqual(out, [`SELECT 'a;b'`, 'SELECT 2'])
})

test('aspa escapada por duplicação não fecha a string', () => {
  const out = splitSqlStatements(`SELECT 'o''brien; ainda dentro'; SELECT 2;`)
  assert.equal(out.length, 2)
})

test('descarta fragmentos que são só comentário', () => {
  assert.deepEqual(splitSqlStatements('-- só comentário\n\n/* e outro */\n'), [])
})

test('aceita instrução final sem ponto e vírgula', () => {
  assert.deepEqual(splitSqlStatements('SELECT 1'), ['SELECT 1'])
})

test('returnsRows separa quem devolve linhas de quem não devolve', () => {
  assert.equal(returnsRows('SELECT 1'), true)
  assert.equal(returnsRows('-- comentário\nSELECT 1'), true)
  assert.equal(returnsRows('DO $$ BEGIN END $$'), false)
  assert.equal(returnsRows('ALTER TABLE x ENABLE ROW LEVEL SECURITY'), false)
})

test('prisma/rls.sql divide no que o script espera executar', () => {
  // Trava o contrato entre o arquivo e o script: dois blocos DO (ligar RLS,
  // revogar privilégios dos papéis do Supabase), as duas revogações de PUBLIC,
  // e uma consulta de conferência.
  const sql = readFileSync(join(process.cwd(), 'prisma', 'rls.sql'), 'utf-8')
  const out = splitSqlStatements(sql)

  assert.equal(out.length, 5, `esperava 5 instruções, veio ${out.length}`)
  assert.match(out[0], /ENABLE ROW LEVEL SECURITY/)
  assert.match(out[1], /REVOKE ALL ON ALL TABLES/)

  // As duas de PUBLIC são separadas do bloco `DO` acima de propósito: revogar
  // de `anon` e `authenticated` NÃO fecha função nenhuma, porque o Postgres
  // concede EXECUTE a PUBLIC por padrão e todo papel herda de PUBLIC. Foi
  // assim que `rls_auto_enable()` ficou chamável sem login.
  assert.match(out[2], /REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC/)
  // A segunda cobre a PRÓXIMA função criada; sem ela a correção valeria só
  // para as que existem hoje.
  assert.match(out[3], /ALTER DEFAULT PRIVILEGES.*REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC/s)

  assert.equal(returnsRows(out[4]), true)
  assert.match(out[4], /relrowsecurity = false/)

  // O SQL de exemplo do arquivo — o `CREATE ROLE` e o `FORCE ROW LEVEL
  // SECURITY` do "caminho futuro", e o FORCE citado no cabeçalho — está todo
  // dentro de comentário, e precisa continuar assim: executá-lo criaria um
  // papel de mentira e derrubaria a aplicação.
  //
  // A comparação tem de ser sobre o texto SEM comentários. Instrução com
  // comentário na frente é normal e o Postgres aceita, então procurar as
  // palavras no texto cru acusaria o cabeçalho e não provaria nada.
  const executavel = out
    .map((s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' '))
    .join('\n')

  assert.doesNotMatch(executavel, /CREATE ROLE/)
  assert.doesNotMatch(executavel, /FORCE ROW LEVEL SECURITY/)
  assert.doesNotMatch(executavel, /CREATE POLICY/)
  // E o que DEVE estar executável continua lá.
  assert.match(executavel, /ENABLE ROW LEVEL SECURITY/)
})
