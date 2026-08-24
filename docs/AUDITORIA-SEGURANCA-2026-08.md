# Auditoria de segurança — cinco frentes

Revisão de `sptoxi/griffo` sobre os cinco pontos pedidos: RLS, regra de negócio
no front-end, IDOR, segredos no código e validação de entrada/XSS.

O que segue é o resultado arquivo a arquivo. Os números de linha são os do
código **antes** das correções.

---

## 1. Row Level Security

**Estado encontrado:** RLS desligado em todas as 18 tabelas.

`prisma/schema.prisma` — o Prisma não gerencia RLS, e não havia nenhum arquivo
SQL no repositório que o ligasse. O banco é Supabase (declarado no cabeçalho do
schema, linha 2), e o Supabase publica automaticamente uma API PostgREST sobre o
schema `public`, acessível com a chave `anon` — que é pública por desenho.

**Atenuante real:** o Griffo não usa a chave `anon` em lugar nenhum. Todo acesso
é Prisma, no servidor, com o filtro por `userId` aplicado consulta a consulta.
Não há caminho de exploração hoje pelo código deste repositório.

**Por que ainda assim é para corrigir:** a exposição passa a existir por
configuração de painel, não por mudança de código — e configuração de painel não
aparece em revisão de PR.

**Correção aplicada:** `prisma/rls.sql`, idempotente, aplicado com `npm run db:rls`.

- Liga RLS em todas as tabelas de `public`, percorrendo o catálogo em vez de
  usar lista fixa — tabela nova criada por `db push` entra sozinha.
- Revoga todo privilégio de `anon` e `authenticated`, inclusive nos objetos
  futuros (`ALTER DEFAULT PRIVILEGES`).
- Termina com uma consulta de conferência que deve devolver zero linhas.

**O que NÃO foi feito, e por quê:** `FORCE ROW LEVEL SECURITY` está fora. RLS
não se aplica ao dono da tabela sem FORCE, e o Prisma se conecta como dono —
então ligar FORCE sem antes criar um papel de aplicação separado e escrever
políticas por tabela derruba a aplicação inteira, e derruba em silêncio:
consultas devolvendo vazio, não erro. O caminho completo está descrito no fim do
`rls.sql` como projeto, não como pendência de aplicar às cegas.

---

## 2. Regra de negócio / permissão definida no front-end

### CRÍTICO — `src/app/api/admin/jobs/dedup/route.ts:10`

```ts
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))   // ← nenhuma verificação antes
```

A rota não tinha verificação nenhuma. O único controle era o botão que a chama
viver dentro de `AdminView` (`src/components/admin/radar-quotas.tsx:108`) — ou
seja, a permissão de administrador estava definida na tela.

`curl -X POST https://griffo.work/api/admin/jobs/dedup` executava para qualquer
pessoa, sem sessão. Cada chamada: até 50 pares de vagas enviados a um provedor
de IA pago (despesa direta) e escrita no banco marcando vagas como duplicadas.
Em laço, é conta de IA queimada e o Radar degradado para todos, sem nada no log
que identificasse quem pediu.

**Correção:** `getAdminUser()` antes de qualquer trabalho; 403 sem ele; a ação
passou a ser registrada em `AuditLog` como as demais ações administrativas.

### ALTO — `src/app/api/cron/dedup/route.ts:22` (*fail-open*)

```ts
const secret = process.env.CRON_SECRET
if (secret) {                                    // ← sem a variável, pula tudo
  if (authHeader !== `Bearer ${secret}`) return 401
}
```

A única situação em que a verificação precisava valer — ambiente sem
`CRON_SECRET` — era exatamente aquela em que ela não valia. E sem sintoma: a
rota respondia 200 normalmente. `/api/cron/radar:108` já fazia o certo (503).

**Correção:** 503 quando o segredo falta, com log de erro, igual ao radar.

### MÉDIO — `/api/admin` e `/api/cron` fora do limitador

`src/middleware.ts:123-136` — o `matcher` não incluía nenhum dos dois. Uma regra
declarada em `RULES` para um caminho fora do `matcher` nunca é consultada: o
middleware simplesmente não roda ali.

**Correção:** `/api/admin/:path*` (120 por 10 min) e `/api/cron/:path*` (20 por
10 min) no `matcher` e em `RULES`.

### BAIXO — gating de tela, com back-end correto atrás

Estes três *definem* algo no cliente, mas o servidor decide de verdade. Ficam
registrados como leitura, não como correção:

| Arquivo | O que o cliente decide | Quem realmente enforça |
|---|---|---|
| `src/components/app/app-shell.tsx:60` | redireciona não-admin para fora de `view=admin` | toda rota `/api/admin/*` chama `getAdminUser` |
| `src/components/app/downloads-view.tsx:32` | `planActive` incluindo `role === 'admin'` | `download/route.ts:188` chama `requireUnlockedResume` |
| `src/components/app/repurchase-upsell.tsx` | esconde o pacote antes da 1ª compra | `checkout/route.ts:47-58` devolve 403 |

---

## 3. IDOR

**Resultado: nenhum IDOR encontrado nas rotas de dados do usuário.** O padrão é
consistente e correto em todo o repositório — o filtro por dono está na cláusula
`where`, não numa checagem posterior:

| Rota | Linha | Consulta |
|---|---|---|
| `resume/[id]` GET | 21 | `findFirst({ where: { id, userId: user.id } })` |
| `resume/[id]` DELETE | 103 | idem, antes do `delete` |
| `resume/analyze` | 53 | idem |
| `resume/analyze/status` | 38-41 | `{ id: jobId, userId }` ou `{ resumeId, userId }` |
| `resume/download` | 184 | idem, e ainda `requireUnlockedResume` |
| `resume/preview`, `rewrite`, `cover-letter`, `career-orientation`, `social-analysis` | 81 / 40,170 / 128 / 93 / 61 | idem |
| `radar` PATCH | 169 | confere posse antes do `update` na linha 180 |
| `radar/prepare` | 64, 77-81 | alerta e currículo, ambos por `userId` |
| `user/professional-profile`, `user/radar-preferences` | 67 / 28 | `findUnique({ where: { userId } })` |

Os `update`/`delete` por `id` cru (`resume/[id]:106`, `radar/route.ts:180`,
`radar/prepare:116`) são todos precedidos, na mesma função, por um `findFirst`
que confere a posse. Correto.

**Observação menor, admin-only:** `admin/ai-keys/route.ts:130` e `:181` fazem
`update`/`delete` por `id` sem conferir existência antes — um id inexistente
vira 500 em vez de 404. É qualidade de erro, não falha de autorização.
Não alterado.

---

## 4. Segredos no código-fonte

**Resultado: nenhum segredo exposto.** Varredura por padrões de chave (`sk_live_`,
`sk-`, `whsec_`, `AIza`, JWT, connection string com senha, `re_`, `ghp_`) sobre
todo o repositório: dois acertos, ambos placeholders —
`.env.example:40` e o `placeholder` de um input em `admin-view.tsx:1773`.

O que está bem feito e vale registrar:

- `.gitignore:33-35` — `.env*` ignorado, `.env.example` mantido. Sem `.env` no
  histórico do git (conferido com `git log --all -- .env*`).
- `src/lib/env.ts` — fallbacks embutidos removidos. `SESSION_SECRET` e a URL do
  banco lançam `ConfigError` em vez de cair num valor previsível.
- `src/lib/crypto.ts` — AES-256-GCM nos segredos guardados no banco
  (`AiApiKey.apiKey`, valores sensíveis de `SystemConfig`), com compatibilidade
  para os que já estão em texto puro.
- `admin/settings/route.ts:29` e `admin/ai-keys/route.ts:37` — a resposta da API
  leva só a máscara; a chave inteira nunca sai da rota.
- `webhooks/stripe/route.ts:58` — assinatura HMAC verificada sobre o corpo cru;
  idempotência pelo índice único de `event.id`.

**Único ponto a acompanhar (não é falha de código):** os segredos de produção
vivem no ambiente da Vercel e em `SystemConfig`. `ENCRYPTION_KEY` é o que torna
a segunda cópia ilegível — e trocá-la torna ilegível tudo o que já foi cifrado.
Guardar junto com os demais segredos de produção, com cópia.

---

## 5. Validação de entrada, upload e XSS

### ALTO — URL de terceiro sem validação de esquema → XSS

`src/lib/jobs/normalize.ts:180-181`:

```ts
const applicationUrl = text(raw.applicationUrl)
if (!applicationUrl) throw new JobNormalizationError(...)   // só confere se está vazia
```

`applicationUrl` não é digitada por nós: vem do Greenhouse, Lever, Gupy, Adzuna,
RemoteOK e do JSON-LD das páginas em `CAREER_PAGES`, escrito pela própria
empresa. Ela termina em dois lugares:

- `src/components/app/radar-view.tsx:267` — `window.open(opportunity.applicationUrl, ...)`.
  Com `javascript:`, isso executa script na origem da aplicação. É XSS, não navegação.
- `src/lib/email/digest.ts:192` — `<a href="${escapeHtml(job.url)}">`.

**Escapar HTML não cobria este caso.** `escapeHtml('javascript:alert(1)')` não
altera um caractere: o valor continua sendo um esquema executável dentro de um
`href` perfeitamente bem formado. O que fecha a porta é recusar o esquema.

**Correção:** novo `src/lib/safe-url.ts` (`isSafeHttpUrl` / `safeHttpUrl` /
`safeProfileUrl`), aplicado em três camadas:

1. `normalize.ts` — vaga com URL de esquema recusado é descartada na entrada,
   como qualquer vaga malformada.
2. `radar-view.tsx` — segunda barreira, porque as vagas gravadas **antes** desta
   mudança continuam no banco como estavam.
3. `digest.ts` — `safeHref()` substitui `escapeHtml()` nos três `href` do e-mail;
   URL recusada vira `#`.

Coberto por `src/lib/safe-url.test.ts` (6 casos, incluindo `JaVaScRiPt:` e
`data:`).

### MÉDIO — nenhum teto de tamanho nas entradas de texto

| Arquivo | Linha | Campo | Estado |
|---|---|---|---|
| `resume/upload/route.ts` | 14 | `content` | `z.string()` sem `max` |
| | 17-18 | `targetJob`, `targetJobDescription` | idem |
| | 19 | `socialLinks` | `z.record(z.string(), z.string())` — sem teto de quantidade, chave nem valor |
| `user/settings/route.ts` | 11 | `socialLinks` | idem |
| `support/chat/route.ts` | 16-21 | `history` | array sem `max`, `text` sem `max` |
| `resume/social-analysis/route.ts` | 28 | `linkedinPdfBase64` | sem `max` |
| `resume/profile-pdf-text/route.ts` | 28 | `pdfBase64` | sem `max` |

`checkResumeContent` só confere o MÍNIMO (`content-guard.ts:71`) e
`cleanAndOptimizeTextForAi` normaliza sem truncar, então o corpo ia inteiro para
colunas `String` sem tamanho no Postgres. O que passava por validação era o
tamanho do corpo da requisição — escolhido por quem envia.

No `support/chat`, o teto de 1000 caracteres de `message` não valia de nada:
bastava mandar o texto gigante dentro de `history`, que vai direto para o prompt.
Além do custo de tokens, um histórico grande empurra os guardrails do prompt do
sistema para fora da janela de atenção do modelo.

**Correção:** novo `src/lib/validation.ts` com os tetos e a justificativa de cada
número, aplicado nas cinco rotas. `socialLinksSchema` é uma definição só,
importada nos dois lugares que a duplicavam. `history` limitado a 20 turnos de
4000 caracteres. Coberto por `src/lib/validation.test.ts` (6 casos).

### MÉDIO — upload de PDF sem conferência do tipo real

`resume/upload/route.ts:51-63` usava `parsePdfBuffer` cru, com só um teto de
tamanho. Faltavam duas coisas que `parsePdfBase64` já fazia e a rota não usava:

- a assinatura `%PDF-` nos primeiros bytes — sem ela, **qualquer** arquivo era
  entregue ao parser, falhava, e caía na transcrição por **visão**, que é uma
  chamada de IA paga;
- o recorte do prefixo `data:` de qualquer tipo MIME. O recorte fixo em
  `application/pdf` (linha 61) deixava `data:application/octet-stream;base64,`
  dentro da string, e um PDF perfeitamente válido chegava como ilegível.

**Correção:** a rota passou a usar `parsePdfBase64`; teto expresso também no
esquema do Zod (`MAX_PDF_BASE64_CHARS`), que recusa antes de o corpo virar string
na memória. A mensagem de "não é um PDF" foi reescrita para o contexto de
currículo — a de `parsePdfBase64` fala em "o arquivo gerado pelo próprio
LinkedIn", correto na rota de perfil e desorientador aqui.

### O que já estava certo

- **Sem sink de XSS.** Os dois `dangerouslySetInnerHTML` do repositório
  (`ui/chart.tsx:83` e `app/upload-progress-modal.tsx:219`) recebem CSS estático
  definido no código. Nenhum `innerHTML`, `eval`, `new Function` ou `rehype-raw`.
  `react-markdown` é usado sem plugin de HTML cru.
- **SSRF fechado.** `src/lib/url-guard.ts` resolve DNS e confere **todos** os
  endereços contra as faixas reservadas, revalida cada salto de redirecionamento,
  limita as portas a 80/443 e recusa credenciais embutidas. Cobre IPv6, NAT64 e
  as notações numéricas. Usado por `job-fetch`, `social/fetchers` e o webhook do
  agente de diagnóstico.
- **Cabeçalhos de segurança** em `next.config.ts:14-51`: HSTS, `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` e uma CSP com
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`.

### Pendência conhecida, não corrigida aqui

A CSP não tem `script-src` nem `default-src`. O cabeçalho do arquivo já explica:
o Next injeta script inline para hidratação, então `script-src` sem nonce
exigiria `'unsafe-inline'`, que não protege nada. O caminho é gerar nonce no
middleware — mudança que atinge todas as páginas e pede teste de ponta a ponta.
Continua aberto em `PLANO-MELHORIAS` (E7).

---

## Resumo

| # | Frente | Achado | Severidade | Situação |
|---|---|---|---|---|
| 2 | Permissão no front-end | `/api/admin/jobs/dedup` sem autenticação alguma | **Crítica** | Corrigido |
| 5 | XSS | `applicationUrl` de terceiro sem validação de esquema | **Alta** | Corrigido |
| 2 | Permissão | `/api/cron/dedup` *fail-open* sem `CRON_SECRET` | **Alta** | Corrigido |
| 1 | RLS | Desligado nas 18 tabelas | Média | Corrigido (`npm run db:rls`) |
| 5 | Validação | Sem teto em 7 campos de entrada | Média | Corrigido |
| 5 | Upload | PDF sem conferência de assinatura | Média | Corrigido |
| 2 | Rate limit | `/api/admin` e `/api/cron` fora do `matcher` | Média | Corrigido |
| 3 | IDOR | — | — | Nada encontrado |
| 4 | Segredos | — | — | Nada encontrado |
| 5 | CSP | Sem `script-src` (exige nonce) | Baixa | Aberto por decisão anterior |

**Ação manual necessária após o deploy:** `npm run db:rls`.
Nada mais no conjunto exige intervenção.

---

## Adendo — o comando `db:rls` não rodava no Windows

A primeira versão do comando era:

```
psql "$POSTGRES_URL_NON_POOLING" -v ON_ERROR_STOP=1 -f prisma/rls.sql
```

Ela falhava por dois motivos independentes, e o segundo só apareceria depois de
resolvido o primeiro:

1. **`psql` não está instalado.** É parte do pacote cliente do PostgreSQL, que
   ninguém precisa ter para desenvolver este projeto — o Prisma fala com o banco
   pelo próprio driver.
2. **`"$POSTGRES_URL_NON_POOLING"` é expansão de shell Unix.** Os scripts do npm
   rodam pelo `cmd.exe` no Windows, que não expande essa forma. O psql receberia
   a string literal `$POSTGRES_URL_NON_POOLING` como connection string, e o erro
   resultante não teria relação visível com a causa.

O comando agora roda `src/scripts/apply-rls.ts`, sem binário externo e sem
sintaxe de shell.

### O divisor de SQL, e por que não é `split(';')`

O driver do Postgres aceita uma instrução por chamada, então o arquivo precisa
ser dividido. `prisma/rls.sql` quebra as três formas ingênuas de fazer isso:

- os dois blocos `DO $$ ... $$` são uma instrução cada e têm `;` dentro;
- há apóstrofos em número **ímpar** dentro de comentários `--` (linhas 54, 148
  e 160 — `current_setting('app.user_id')`), então um divisor que rastreie aspas
  sem entender comentários passa a se achar dentro de uma string e cola o resto
  do arquivo numa instrução só;
- o rodapé traz SQL de exemplo (`CREATE ROLE`, `FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY`) que está em comentário e **não pode** ser executado.

`src/lib/sql-split.ts` trata os três, com 10 testes em `sql-split.test.ts` —
inclusive um que trava o contrato com o arquivo real: três instruções, e nenhum
dos exemplos do rodapé virando SQL executável.

### Verificado contra um Postgres real

Não só typecheck. Uma instância PostgreSQL 16 temporária, com o schema real
aplicado via `prisma db push` (20 tabelas) e os papéis `anon` e `authenticated`
do Supabase criados:

| Cenário | Resultado |
|---|---|
| Base sem proteção → `npm run db:rls` | 20/20 tabelas com RLS; 0 privilégios para `anon`/`authenticated` |
| `SET ROLE anon; SELECT FROM "User"` | `ERROR: permission denied for table User` |
| `SET ROLE anon; INSERT INTO "User"` | `ERROR: permission denied for table User` |
| Reaplicar numa base já protegida | Idempotente — reconhece e não altera nada |
| Sabotagem (`GRANT SELECT ... TO anon` + `DISABLE ROW LEVEL SECURITY`) | Detecta, relata a tabela afetada e restaura |
| `FORCE ROW LEVEL SECURITY` | 0 tabelas — a decisão deliberada foi respeitada |

### Uma correção sobre o `USAGE` no schema

O `REVOKE USAGE ON SCHEMA public` não remove o privilégio de `anon`, e isso é
esperado: o Postgres concede `USAGE` ao pseudo-papel `PUBLIC` por padrão, e
revogar de um papel específico não desfaz o que vem por herança.

Não é exposição. `USAGE` no schema permite referenciar nomes; sem privilégio de
tabela nenhuma linha sai — o que os testes com `SET ROLE anon` acima confirmam.
Os 189 grants a `PUBLIC` que restam no banco estão todos em `pg_catalog` e
`information_schema`; **zero** nas tabelas da aplicação.

Revogar de `PUBLIC` atingiria todo papel do banco, extensões inclusive, e por
isso fica de fora pelo mesmo critério do FORCE: não se aplica às cegas.

A conferência do script foi trocada por `has_table_privilege`, que enxerga
privilégio herdado — consultar apenas os grants diretos declararia sucesso com
a porta aberta por herança.
