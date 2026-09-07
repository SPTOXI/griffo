-- =============================================================================
-- Row Level Security (RLS) — Griffo
-- =============================================================================
--
-- Aplicar com:  npm run db:rls
--
-- Esse comando roda `src/scripts/apply-rls.ts`, que executa este arquivo pelo
-- driver do Prisma. NÃO precisa do `psql` instalado, e funciona igual no
-- Windows, macOS e Linux — a primeira versão chamava o psql com expansão de
-- shell Unix e falhava no `cmd.exe` por dois motivos de uma vez.
--
-- É idempotente e autocorretivo: rodar de novo numa base já protegida não muda
-- nada, e numa base onde alguma proteção foi desfeita, restaura.
--
-- ATENÇÃO ao executar este arquivo por outro caminho que não o `npm run db:rls`:
-- o driver do Postgres aceita uma instrução por vez, e o rodapé deste arquivo
-- contém SQL de EXEMPLO dentro de comentários (`CREATE ROLE`,
-- `FORCE ROW LEVEL SECURITY`, `CREATE POLICY`) que NÃO deve ser executado. O
-- script trata as duas coisas; um copiar-e-colar apressado, não.
--
-- -----------------------------------------------------------------------------
-- POR QUE ISTO EXISTE, se o aplicativo já filtra por usuário
-- -----------------------------------------------------------------------------
--
-- Ele filtra, e bem: toda leitura de currículo, alerta ou job passa por
-- `findFirst({ where: { id, userId: user.id } })`. Isso responde pelo caminho
-- que o aplicativo controla.
--
-- O que RLS cobre é o caminho que ele NÃO controla. O banco é Supabase, e o
-- Supabase publica automaticamente uma API REST (PostgREST) sobre o schema
-- `public`, acessível com a chave `anon` — que é, por desenho, uma chave
-- pública, embutível no front-end de qualquer projeto do mesmo banco. Uma
-- tabela sem RLS nesse schema fica legível por essa API. O aplicativo do Griffo
-- não usa a chave `anon` em lugar nenhum (todo acesso é Prisma, no servidor),
-- então hoje a exposição depende de o projeto ter a API ligada — mas isso é uma
-- configuração de painel, não uma garantia do código, e é exatamente o tipo de
-- coisa que muda sem ninguém revisar o repositório.
--
-- É por isso que a proteção fica no banco: ela vale independentemente de qual
-- cliente chega, de qual chave ele traz, e de quem mexeu no painel por último.
--
-- -----------------------------------------------------------------------------
-- O QUE ESTE ARQUIVO FAZ, E O QUE DELIBERADAMENTE NÃO FAZ
-- -----------------------------------------------------------------------------
--
-- FAZ: liga RLS em todas as tabelas do schema `public` e REVOGA todo privilégio
-- dos papéis `anon` e `authenticated`. Sem política nenhuma escrita, RLS ligado
-- significa "ninguém lê, ninguém escreve" para qualquer papel sujeito a ela —
-- que é a postura correta aqui, porque nenhum cliente legítimo do Griffo passa
-- por esses papéis.
--
-- NÃO FAZ: `FORCE ROW LEVEL SECURITY`. E a omissão é a decisão mais importante
-- deste arquivo.
--
-- RLS não se aplica ao DONO da tabela, a menos que se use FORCE. O Prisma se
-- conecta com o papel que criou o schema — normalmente o dono. Então:
--
--   - sem FORCE: o Prisma continua funcionando exatamente como hoje, e a
--     porta do PostgREST fecha. É o que queremos, e é o que este arquivo faz.
--   - com FORCE e sem políticas: o Prisma para de enxergar QUALQUER linha. O
--     aplicativo inteiro cai, e cai de um jeito silencioso — consultas
--     retornando vazio, não erro.
--
-- Ligar FORCE é a hipótese mais forte, e ela pressupõe um trabalho que não cabe
-- num arquivo aplicado às cegas: criar um papel de aplicação separado do dono,
-- passar o Prisma a usá-lo, e escrever políticas por tabela baseadas numa
-- variável de sessão (`current_setting('app.user_id')`) que o aplicativo teria
-- de definir a cada transação. Está descrito no fim deste arquivo como caminho
-- futuro, não como algo pendente de execução imediata.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RLS ligado em todas as tabelas do schema `public`
-- -----------------------------------------------------------------------------
--
-- O laço percorre o catálogo em vez de listar as tabelas à mão de propósito:
-- uma tabela nova criada por `prisma db push` entra na proteção sozinha na
-- próxima execução deste arquivo. Uma lista fixa envelheceria em silêncio, e o
-- sintoma seria a tabela nova ficar aberta sem ninguém notar.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'          -- só tabelas comuns
      AND c.relrowsecurity = false -- já ligadas ficam como estão
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    RAISE NOTICE 'RLS ligado em public.%', r.relname;
  END LOOP;
END
$$;

-- -----------------------------------------------------------------------------
-- 2. Privilégios revogados dos papéis públicos do Supabase
-- -----------------------------------------------------------------------------
--
-- RLS ligado já basta para bloquear a leitura, mas revogar o privilégio é a
-- segunda tranca: ela vale mesmo que alguém, mais tarde, escreva uma política
-- permissiva demais por engano. Duas barreiras independentes, e não uma.
--
-- O `DO` existe porque `anon` e `authenticated` são papéis do Supabase; num
-- Postgres comum eles não existem e um REVOKE direto abortaria o arquivo.
DO $$
DECLARE
  target TEXT;
BEGIN
  FOREACH target IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', target);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', target);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', target);
      EXECUTE format('REVOKE USAGE ON SCHEMA public FROM %I', target);

      -- Vale também para o que for criado daqui em diante: sem isto, a próxima
      -- tabela nasceria com os privilégios padrão de volta.
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', target
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', target
      );

      RAISE NOTICE 'Privilégios revogados do papel %', target;
    ELSE
      RAISE NOTICE 'Papel % não existe neste banco — nada a revogar.', target;
    END IF;
  END LOOP;
END
$$;

-- -----------------------------------------------------------------------------
-- 2b. E de PUBLIC — o buraco que o bloco acima NÃO fechava
-- -----------------------------------------------------------------------------
--
-- Revogar de `anon` e `authenticated` não basta para funções, e o motivo é
-- fácil de passar batido: o Postgres concede `EXECUTE` a **PUBLIC** por padrão
-- ao criar qualquer função, e todo papel é membro de PUBLIC. Então o
-- `REVOKE ALL ON ALL FUNCTIONS ... FROM anon` acima tirava o grant NOMINAL de
-- anon e deixava intacto o que ele herda de PUBLIC — na prática, não tirava
-- nada.
--
-- O linter do Supabase pegou o efeito disso em 07/09/2026: a função
-- `public.rls_auto_enable()` é `SECURITY DEFINER` e estava chamável sem login
-- em `/rest/v1/rpc/rls_auto_enable`.
--
-- O risco concreto era baixo — ela retorna `event_trigger` e chama
-- `pg_event_trigger_ddl_commands()`, que só funciona dentro de um gatilho de
-- DDL, então por fora ela erra antes de fazer nada; e mesmo rodando, tudo que
-- faz é LIGAR RLS. Mas função `SECURITY DEFINER` alcançável pela internet
-- aberta não se deixa de pé por ser inofensiva hoje: o corpo dela pode mudar.
--
-- Revogar de PUBLIC não afeta o gatilho: gatilho de evento roda como dono, não
-- pela permissão de quem chama. Conferido em produção — `anon` e
-- `authenticated` passaram a `false`, `service_role` continua `true`, e o
-- gatilho seguiu ativo.
--
-- `ALTER DEFAULT PRIVILEGES` cobre a próxima função criada, senão a correção
-- valeria só para a que existe hoje.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- 3. Conferência
-- -----------------------------------------------------------------------------
--
-- Deve devolver zero linhas. Cada linha devolvida é uma tabela ainda aberta.
--
-- O script faz uma segunda conferência, mais forte, que não cabe aqui como uma
-- consulta só: ele pergunta ao banco se `anon` e `authenticated` ainda
-- ALCANÇAM cada tabela, via `has_table_privilege`. A diferença importa —
-- `has_table_privilege` enxerga privilégio herdado de outro papel ou do
-- pseudo-papel `PUBLIC`, e conferir apenas os grants diretos declararia
-- sucesso com a porta aberta por herança.
--
-- Sobre o `USAGE` no schema `public`: ele CONTINUA valendo depois deste
-- arquivo, e isso é esperado. O Postgres concede `USAGE` a `PUBLIC` por
-- padrão, e revogar de `anon` não desfaz o que vem por herança. É inofensivo:
-- `USAGE` no schema permite referenciar nomes, e sem privilégio de tabela
-- nenhuma linha sai — verificado com `SET ROLE anon`, que recebe
-- "permission denied for table". Revogar de `PUBLIC` atingiria todo papel do
-- banco, extensões inclusive, e é da mesma categoria do FORCE descrito
-- abaixo: não se aplica às cegas.
SELECT c.relname AS tabela_sem_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false;

-- =============================================================================
-- CAMINHO FUTURO: RLS que também vale para o Prisma (FORCE)
-- =============================================================================
--
-- O que está acima protege contra acesso por FORA do aplicativo. Não protege
-- contra um erro DENTRO dele — um `findMany` que esqueceu o `where userId`
-- continua devolvendo tudo, porque quem consulta é o dono da tabela.
--
-- Fechar também esse caso exige, nesta ordem:
--
--   1. Um papel de aplicação que NÃO seja dono das tabelas:
--
--        CREATE ROLE griffo_app LOGIN PASSWORD '...';
--        GRANT USAGE ON SCHEMA public TO griffo_app;
--        GRANT SELECT, INSERT, UPDATE, DELETE
--          ON ALL TABLES IN SCHEMA public TO griffo_app;
--
--   2. `POSTGRES_PRISMA_URL` apontando para esse papel.
--
--   3. `ALTER TABLE ... FORCE ROW LEVEL SECURITY` nas tabelas com dono de linha.
--
--   4. Políticas por tabela, lendo a identidade de uma variável de sessão:
--
--        CREATE POLICY resume_owner ON public."Resume"
--          USING ("userId" = current_setting('app.user_id', true));
--
--   5. O aplicativo definindo essa variável a cada transação, o que no Prisma
--      significa `$transaction` com um `$executeRaw` de `set_config` antes de
--      cada consulta — mudança que atinge todas as rotas e exige teste de
--      ponta a ponta.
--
-- O passo 5 é o custo real, e é por isso que isto está documentado como
-- caminho e não aplicado aqui: metade dele — FORCE sem políticas, ou políticas
-- sem a variável de sessão — derruba a aplicação inteira.
