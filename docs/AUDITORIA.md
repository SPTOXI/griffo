# Auditoria Técnica — Griffo / GriffoWork

**Data:** 2026-08-09
**Escopo:** todo o repositório (`src/`, `prisma/`, `scratch/`, configuração, dependências)
**Commit auditado:** `8eb051a`
**Método:** leitura integral do código de servidor (28 rotas de API, 12 módulos de `lib/`), leitura dirigida do código de cliente, `tsc --noEmit`, `eslint`, `next build`, varredura de segredos e de dependências.

## Estado geral

O projeto **compila e builda sem erros** (`tsc` limpo, `next build` gera as 34 rotas). A arquitetura é coerente: App Router, auth própria com scrypt + HMAC, roteador de IA com failover entre 4 provedores, cobrança por créditos com Stripe, e um painel administrativo completo.

Os problemas não são de estrutura — são de **exposição de segredos, controles operacionais ausentes e um caminho de cobrança que pode debitar o usuário sem entregar o serviço**. Nada disso aparece em build ou typecheck, e por isso passou despercebido.

Resumo dos achados:

| Severidade | Qtd | Natureza |
|---|---|---|
| Crítico (P0) | 5 | Credenciais de produção no repositório, forja de sessão, débito sem entrega |
| Alto (P1) | 8 | Segredos em texto claro no banco, SSRF, ausência de rate limiting, laudo fabricado |
| Médio (P2) | 12 | Performance, LGPD, vazamento de erros, headers de segurança |
| Baixo (P3) | 10 | Dívida técnica, código morto, dependências não usadas |

---

## P0 — Crítico

### P0-1. Credenciais do banco de produção commitadas no repositório

A connection string do Supabase de produção, **com senha**, está em três arquivos versionados:

| Arquivo | Linha |
|---|---|
| `src/lib/db.ts` | 15 (fallback hardcoded do `createClient()`) |
| `scratch/seed-admin.ts` | 4 |
| `scratch/test-regions.ts` | 18 |

Qualquer pessoa com acesso de leitura ao repositório tem acesso direto e irrestrito ao banco de produção: currículos, e-mails, telefones, hashes de senha, transações de crédito e as chaves de API armazenadas em `AiApiKey` e `SystemConfig`.

O commit `f2ac23e` ("restore safe fallback database URL") reintroduziu deliberadamente o fallback. **Não é um fallback seguro** — é a credencial de produção em claro.

### P0-2. Senha do administrador em texto claro no repositório

`scratch/seed-admin.ts:21` e `scratch/seed_admin.ts:7`:

```
email:    admin@griffowork.com
password: 711882GRiffo
```

É a mesma string usada como senha do banco. Com ela, qualquer um autentica como administrador e obtém: listagem completa de usuários, deleção em massa, alteração de saldo de créditos de qualquer conta, leitura/escrita da configuração do Stripe e cadastro de chaves de IA.

### P0-3. `SESSION_SECRET` com fallback previsível permite forjar qualquer sessão

`src/lib/auth.ts:25`:

```ts
const SESSION_SECRET = process.env.SESSION_SECRET || 'griffo_secret_key_fallback_production_2026'
```

Se a variável de ambiente não estiver definida — em qualquer ambiente, incluindo produção — o segredo do HMAC é público. O payload da sessão é `{ uid, iat, exp }` em base64url. Com o segredo conhecido, forja-se um cookie válido para **qualquer `uid`**, inclusive o do administrador, sem senha.

Não há aviso, log ou falha na inicialização quando a variável está ausente. O sistema roda silenciosamente inseguro.

> **P0-1, P0-2 e P0-3 estão no histórico do git.** Remover os arquivos não basta: as três credenciais (banco, admin, sessão) precisam ser **rotacionadas**, e todas as chaves guardadas no banco (Stripe, provedores de IA) devem ser consideradas comprometidas.

### P0-4. Créditos debitados sem entrega quando o roteador de IA excede o tempo da rota

Em `src/app/api/resume/analyze/route.ts` (e `rewrite/route.ts`):

- A rota declara `maxDuration = 60`.
- O roteador (`src/lib/ai-router/router.ts:75,103`) usa timeout de **55 s por provedor** e percorre até **4 provedores** em sequência.
- Os 20 créditos são debitados **antes** da chamada de IA (linha 45).
- O reembolso está no `catch` (linha 284).

Se o primeiro provedor demorar mais de ~60 s, a plataforma encerra a função **antes** do `catch` executar. O débito já foi commitado no banco; o reembolso nunca acontece. O usuário perde 20 créditos e não recebe laudo.

Esse é exatamente o cenário que o cliente tenta contornar em `analysis-view.tsx:207` com um laço de **25 tentativas de releitura durante 50 segundos**. O laço é um sintoma, não a correção — e ele mesmo excede o orçamento de tempo.

### P0-5. Zero rate limiting em toda a superfície da API

Não existe `middleware.ts`, nem qualquer limitação por IP ou por usuário. Consequências diretas:

| Rota | Exposição |
|---|---|
| `POST /api/auth/login` | Força bruta ilimitada contra senhas de 6 caracteres |
| `POST /api/auth/register` | Criação massiva de contas |
| `POST /api/resume/analyze` | Custo de IA ilimitado por conta com saldo |
| `POST /api/support/chat` | Chamadas de IA ilimitadas, custo direto |
| `POST /api/resume/job-fetch` | Uso do servidor como proxy HTTP de terceiros |

---

## P1 — Alto

### P1-1. Chaves de API de terceiros armazenadas em texto claro no banco

`AiApiKey.apiKey` e `SystemConfig.value` (que guarda `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`) são colunas `String` sem criptografia. Um dump do banco — trivial de obter dada a P0-1 — entrega chave secreta do Stripe e chaves de Anthropic, DeepSeek, Moonshot e Gemini.

O mascaramento em `admin/ai-keys/route.ts:29` protege apenas a resposta HTTP, não o armazenamento.

### P1-2. SSRF autenticado via webhook de alerta configurável

`POST /api/admin/settings` (`route.ts:36`) grava **qualquer chave/valor** enviado, sem allowlist:

```ts
for (const [key, value] of Object.entries(body)) {
  await db.systemConfig.upsert({ where: { key }, update: { value }, create: { key, value } })
}
```

`ADMIN_ALERT_WEBHOOK_URL` é depois consumido em `diagnostic-agent.ts:129` com `fetch(webhookConfig.value, { method: 'POST', ... })` — sem validação de esquema, host ou faixa de rede. Uma sessão de admin (ver P0-2/P0-3) transforma o servidor em cliente HTTP para a rede interna, incluindo endpoints de metadados de nuvem.

### P1-3. Proteção SSRF de `job-fetch` é incompleta

`src/app/api/resume/job-fetch/route.ts:86-97` bloqueia por prefixo de string. Não cobre:

- **Redirecionamentos** — `fetch` segue redirects por padrão; a validação ocorre só na URL inicial.
- **IPv6** — `[::ffff:127.0.0.1]`, `fd00::/8`, `fe80::/10`.
- **Notação decimal/octal** — `http://2130706433/` resolve para `127.0.0.1`.
- **DNS rebinding** e domínios públicos que resolvem para IP privado (ex.: `169.254.169.254` via CNAME).

Além disso, a URL do usuário é enviada a **`r.jina.ai`** (terceiro, linha 107) antes de qualquer tentativa direta — dado de navegação do usuário sai para um serviço externo não declarado na política de privacidade.

### P1-4. Laudo fabricado é cobrado como laudo real

`analyze/route.ts:237-257`: quando o parse do JSON da IA falha, a rota grava uma análise **inventada** — nota `7.5` fixa em todas as 8 dimensões, textos genéricos ("Estrutura limpa.", "Resultados avaliados.") — persiste no banco e devolve `success: true`. Os 20 créditos já foram debitados.

O mesmo padrão em `career-orientation/route.ts:88-113`, com percentuais de compatibilidade fixos (88%, 84%, 80%) apresentados como diagnóstico vocacional.

O usuário paga por um laudo e recebe um placeholder indistinguível de um resultado real. Isso é um problema de produto e de exposição jurídica, não apenas técnico.

### P1-5. Login por `name` é ambíguo e não determinístico

`auth/login/route.ts:21-28`:

```ts
const user = await db.user.findFirst({
  where: { OR: [{ email: normalizedIdentifier }, { name: identifier.trim() }] },
})
```

`User.name` **não é único** e não é normalizado (o e-mail é `toLowerCase()`, o nome não). Sem `orderBy`, o `findFirst` devolve uma linha arbitrária. Dois usuários com o mesmo nome tornam o login imprevisível. Um usuário pode ainda cadastrar `name` igual ao e-mail de outro, criando colisão no identificador.

Também: `hashPassword` é importado (linha 4) e nunca usado.

### P1-6. Conta desabilitada: comportamento inconsistente entre login e sessão

- `auth/login/route.ts:34`: `if (user.disabled && user.role !== 'admin')` — admin desabilitado **consegue** autenticar.
- `auth.ts:88`: `if (!user || user.disabled) return null` — mas toda requisição subsequente falha.

O admin desabilitado recebe um cookie válido e depois é tratado como não autenticado em cada chamada. A intenção precisa ser decidida e aplicada nos dois pontos.

### P1-7. Valores em moeda estrangeira registrados como BRL

`credits/verify-session/route.ts:54` e `webhooks/stripe/route.ts:59`:

```ts
const totalAmountBrl = (session.amount_total || 0) / 100
```

`amount_total` vem na moeda do checkout — que pode ser `usd` ou `eur` (o cliente escolhe em `credits/purchase/route.ts:11`). O valor é gravado em `CreditTransaction.costBrl` sem conversão. `admin/dashboard/route.ts:69` soma esse campo como receita em reais.

**A receita e a margem exibidas no painel estão erradas** para toda venda fora do Brasil.

### P1-8. Moeda do pagamento é escolhida pelo cliente

`credits/purchase/route.ts:11` aceita `currency` no corpo da requisição, sem validação contra a geolocalização. Como `priceUsd`/`priceEur` são ~8% mais caros que `priceBrl` no câmbio de referência, qualquer usuário no exterior envia `currency: 'brl'` e paga o preço brasileiro.

Relacionado: `CREDIT_PACKAGES[0].entryOnly = true` (`credits-catalog.ts:47`) declara que o Plano de Entrada é exclusivo do primeiro acesso, mas **nenhuma rota verifica isso**. A regra de negócio existe apenas como comentário.

---

## P2 — Médio

### P2-1. Ausência de índices no banco

`prisma/schema.prisma` não declara **nenhum** `@@index`. As tabelas que mais crescem são consultadas com filtro e ordenação sem suporte:

| Consulta | Local | Índice necessário |
|---|---|---|
| `resume.findMany({ where: { userId }, orderBy: { createdAt } })` | `resume/upload:130` | `Resume(userId, createdAt)` |
| `aiLog.count({ where: { status, createdAt } })` | `admin/health:53` | `AiLog(status, createdAt)` |
| `aiLog.findMany({ where: { createdAt: { gte } } })` | `master-director-agent:24` | `AiLog(createdAt)` |
| `creditTransaction.findMany({ where: { userId }, orderBy })` | `credits/balance:17` | `CreditTransaction(userId, createdAt)` |
| `creditTransaction.findFirst({ where: { paymentRef } })` | `webhooks/stripe:54` | já coberto pelo `@unique` |
| `systemIncident.count({ where: { status } })` | `admin/health:47` | `SystemIncident(status)` |
| `auditLog` (escrito em toda ação) | vários | `AuditLog(userId, createdAt)` |

### P2-2. Consultas administrativas sem paginação

`admin/dashboard/route.ts:20` e `admin/users/route.ts:27` fazem `user.findMany()` **sem `take`**, cada usuário com subconsulta `_count` de `resumes` e `subscriptions`. Com alguns milhares de usuários, a rota do dashboard fica inutilizável — e ela roda em toda abertura do painel.

### P2-3. Configuração de provedor relida a cada tentativa de failover

`getProviderRuntimeConfig()` (`registry.ts:88`) executa `aiApiKey.findMany()` + `systemConfig.findMany()` a cada chamada. O roteador a invoca uma vez por provedor candidato dentro do laço (`router.ts:46`), mais uma vez antes do laço (linha 16).

Uma única análise dispara até **10 consultas ao banco** só para resolver credenciais. Não há cache. A latência entra direto no orçamento de 60 s da rota (ver P0-4).

### P2-4. Nenhum header de segurança configurado

`next.config.ts` tem 5 linhas e não define `headers()`. Faltam: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

### P2-5. Sessões não podem ser revogadas

Não há tabela de sessões. `destroySession()` apenas apaga o cookie do navegador — um token copiado continua válido pelas 2 h completas. Não há invalidação em caso de comprometimento, e não existe fluxo de troca de senha que pudesse forçá-la.

O cookie usa `sameSite: 'lax'` sem prefixo `__Host-` e sem token CSRF.

### P2-6. Conformidade com LGPD incompleta

O README declara "LGPD compliant". O que falta:

- **Sem exclusão de conta.** Não existe `DELETE /api/user`. O usuário não consegue exercer o direito de eliminação (art. 18, VI).
- **Sem portabilidade/exportação** dos dados pessoais.
- **Sem política de retenção.** Currículos com nome, telefone, e-mail e histórico profissional ficam em texto claro indefinidamente.
- **Transferência internacional não declarada.** O conteúdo dos currículos é enviado à Anthropic (EUA), DeepSeek e Moonshot (China) e Google. Não há consentimento específico nem menção a essa transferência.
- `WebhookEvent.body` (`webhooks/stripe:37`) grava o evento Stripe **inteiro** — incluindo e-mail e dados de faturamento — sem expurgo nem prazo de descarte.

### P2-7. Chave de API registrada em log

`router.ts:93`:

```ts
console.log('[KIMI DEBUG] key prefix:', runtime.apiKey?.slice(0, 15) + '...')
console.log('[KIMI DEBUG] key length:', runtime.apiKey?.length)
```

15 caracteres do prefixo mais o comprimento exato vão para os logs de produção a cada chamada ao Kimi. `admin/dashboard:18` também loga o e-mail do administrador.

### P2-8. Mensagens de erro internas devolvidas ao cliente

| Local | Vazamento |
|---|---|
| `admin/dashboard:114` | `e.message` do Prisma |
| `credits/purchase:97` | `stripeErr.message` cru |
| `credits/verify-session:107` | `e.message` cru |
| `webhooks/stripe:97` | `e.message` cru |

### P2-9. Truncamento silencioso e prompt sem limite

- `analyze/route.ts:187`: `resume.originalContent.slice(0, 15000)` — currículos longos são cortados sem que o usuário saiba, e o laudo cobrado avalia um documento parcial.
- `rewrite/route.ts:90`: envia `resume.originalContent` **inteiro**, sem limite. Um upload grande (o teto é 10 MB de PDF) pode estourar o contexto do modelo ou gerar custo desproporcional.

### P2-10. Preços exibidos publicamente não refletem o custo real

`/api/pricing` (rota pública) usa `TOKEN_COST` de `llm.ts:47` — $3/$15 por 1M tokens. O roteamento real (`registry.ts:70`) manda `full_analysis` e `rewrite` para **Claude Opus 5**, precificado em `$15/$75` por 1M no próprio `registry.ts:23`. As margens publicadas em `computePricing()` estão calculadas com custo 5× menor que o real.

Os planos retornados (`day`/`monthly`/`annual`, R$ 19,90/39,90/299,90) também não são o que a aplicação vende — a UI comercializa pacotes de crédito.

### P2-11. Dois modelos de monetização coexistem

O schema mantém `plan`, `planStartsAt`, `planEndsAt`, o modelo `Subscription` e a função `hasActivePlan()`, ao lado do modelo de créditos que é o efetivamente usado. `credits/verify-session:62` sobrescreve `plan` com o `package_id` do pacote comprado, misturando os dois conceitos no mesmo campo.

`POST /api/subscription/create` ainda ativa planos em "modo simulação Fase 1" (com `paymentRef: sim_phase1_...`), restrito a admin, sem passar por pagamento.

### P2-12. Anti-padrões de React reportados pelo compilador

`eslint` acusa 17 erros reais (nenhum é falso positivo de estilo):

- `analysis-view.tsx:143` — `autoTriggeredRef[id] = true` muta um objeto de `useState`. Deveria ser `useRef`.
- `admin-view.tsx:205`, `analysis-view.tsx:111`, `downloads-view.tsx:38`, `plans-view.tsx:34`, `rewrite-view.tsx:71` — "Cannot access variable before it is declared".
- `admin-view.tsx:1699,1886,2033`, `app-shell.tsx:81`, `downloads-view.tsx:37`, `history-view.tsx:35`, `use-mobile.ts:14`, `i18n-context.tsx:28` — `setState` síncrono dentro de efeito, causando renders em cascata.

---

## P3 — Baixo / dívida técnica

1. **ESLint neutralizado.** `eslint.config.mjs` desliga 25 regras, entre elas `no-unused-vars`, `no-undef`, `no-unreachable`, `no-fallthrough` e `react-hooks/exhaustive-deps`. Com `noImplicitAny: false` no `tsconfig`, a rede de segurança estática é quase nula.
2. **Nenhum teste.** Sem framework, sem arquivos de teste, sem CI. Os caminhos de cobrança e failover de IA não têm cobertura alguma.
3. **Dependências não utilizadas** — `puppeteer` (~300 MB), `pdfkit`, `sharp`, `@mdxeditor/editor`, `next-intl`, `react-syntax-highlighter`, `@tanstack/react-query`, `@dnd-kit/*` (3 pacotes), `uuid`. Zero referências em `src/`. Só `puppeteer` já domina o tempo de instalação e o tamanho do deploy.
4. **Dois lockfiles** — `bun.lock` (266 KB) e `package-lock.json` (534 KB). Divergência entre o que roda em dev e o que é instalado no deploy é questão de tempo.
5. **Código morto em `llm.ts`** — `analyzeResume()`, `rewriteResume()`, `getClient()`, `getLlmConfig()`, `PRICING_PLANS`, `ANALYSIS_SYSTEM`, `REWRITE_SYSTEM` (345 linhas). As rotas usam prompts próprios definidos inline. Os prompts de análise existem em **três** versões divergentes no repositório.
6. **`scratch/` versionado** — 5 arquivos, dois deles com credenciais (P0-1/P0-2). Também versionados: `check-config.js`, `.zscripts/dev.pid`, `examples/websocket/` (não usado), `mini-services/` (vazio).
7. **README desatualizado** — descreve SQLite (o projeto usa Postgres/Supabase), `z-ai-web-dev-sdk` com GLM-4.6 (usa Claude/DeepSeek/Kimi via roteador próprio) e planos de assinatura (vende créditos). A tabela de custos e margens está incorreta (ver P2-10).
8. **Componentes monolíticos** — `admin-view.tsx` com 2.118 linhas, `analysis-view.tsx` com 1.169.
9. **`OPTIONS` órfão** em `resume/upload/route.ts:40` — responde a preflight com `Access-Control-Allow-Methods` mas **sem** `Access-Control-Allow-Origin`. Não habilita CORS nem serve a nada.
10. **`export const revalidate = 0`** redundante junto de `dynamic = 'force-dynamic'` em 6 rotas.

---

## Plano de alterações proposto

Cada fase é independente e entregável em separado. As estimativas são de esforço de implementação.

### Fase 0 — Contenção (fazer antes de qualquer outra coisa) · ~1 dia

Nada aqui é código: é resposta a incidente. Deve preceder qualquer merge.

1. **Rotacionar a senha do banco Supabase.** A atual está pública no histórico do git.
2. **Rotacionar a senha do admin** `admin@griffowork.com`.
3. **Gerar novo `SESSION_SECRET`** (`openssl rand -hex 32`) e configurá-lo no ambiente. Isso invalida todas as sessões ativas — é o efeito desejado.
4. **Rotacionar todas as chaves de terceiros** guardadas no banco: Stripe (secret + webhook) e as chaves de Anthropic, DeepSeek, Moonshot e Gemini.
5. Auditar `AuditLog` e os logs do Supabase em busca de acesso não reconhecido.

> Remover os arquivos do repositório **não** resolve — as credenciais permanecem no histórico. A rotação é obrigatória. A reescrita do histórico (`git filter-repo`) é opcional e secundária.

### Fase 1 — Fechar as brechas críticas · ~2–3 dias

| # | Alteração | Arquivos |
|---|---|---|
| 1.1 | Remover o fallback de URL do banco; falhar explicitamente se `POSTGRES_PRISMA_URL` estiver ausente | `src/lib/db.ts` |
| 1.2 | Remover o fallback de `SESSION_SECRET`; lançar erro na inicialização se ausente | `src/lib/auth.ts` |
| 1.3 | Excluir `scratch/` do versionamento e adicionar ao `.gitignore` | `scratch/`, `.gitignore` |
| 1.4 | Adicionar validação de ambiente na inicialização (Zod sobre `process.env`) | novo `src/lib/env.ts` |
| 1.5 | Rate limiting por IP e por usuário nas rotas de auth, IA e `job-fetch` | novo `src/middleware.ts` + `src/lib/rate-limit.ts` |
| 1.6 | Corrigir o débito sem entrega: reduzir o timeout por provedor para ~20 s, limitar a 2 tentativas e reservar orçamento para o reembolso dentro do `maxDuration` | `src/lib/ai-router/router.ts`, `analyze/route.ts`, `rewrite/route.ts` |
| 1.7 | Remover o laudo fabricado: em falha de parse, reembolsar e devolver erro honesto | `analyze/route.ts`, `career-orientation/route.ts` |

Sobre 1.6 — a correção estrutural é **debitar só na confirmação de sucesso**, ou registrar a reserva como transação `pending` e liquidá-la ao final. O ajuste de timeouts é o mínimo para parar a perda imediata; a reserva em duas fases é o alvo da Fase 3.

### Fase 2 — Endurecimento · ~3–4 dias

| # | Alteração | Arquivos |
|---|---|---|
| 2.1 | Criptografar em repouso `AiApiKey.apiKey` e os valores sensíveis de `SystemConfig` (AES-256-GCM com chave em env) | `src/lib/crypto.ts` (novo), `registry.ts`, `admin/ai-keys`, `admin/settings` |
| 2.2 | Allowlist de chaves em `POST /api/admin/settings` + validação de URL do webhook (só HTTPS, host público) | `admin/settings/route.ts`, `diagnostic-agent.ts` |
| 2.3 | Reforçar SSRF em `job-fetch`: `redirect: 'manual'`, resolução de DNS e verificação do IP, cobertura de IPv6 e de notação numérica | `job-fetch/route.ts` |
| 2.4 | Login apenas por e-mail (ou tornar `name` único e normalizado), com `orderBy` determinístico | `auth/login/route.ts`, `schema.prisma` |
| 2.5 | Unificar a regra de conta desabilitada entre login e sessão | `auth/login/route.ts`, `auth.ts` |
| 2.6 | Headers de segurança (CSP, HSTS, frame-ancestors, Referrer-Policy) | `next.config.ts` |
| 2.7 | Padronizar respostas de erro: mensagem genérica ao cliente, detalhe apenas no log | 4 rotas listadas em P2-8 |
| 2.8 | Remover os logs de chave de API e de e-mail | `router.ts`, `admin/dashboard/route.ts` |
| 2.9 | Sessões revogáveis: tabela `Session` com invalidação no logout | `schema.prisma`, `auth.ts` |

### Fase 3 — Correções de cobrança e dados · ~2–3 dias

| # | Alteração | Arquivos |
|---|---|---|
| 3.1 | Gravar moeda e valor originais; converter para BRL na leitura, não na escrita | `schema.prisma` (`currency`, `amountOriginal`), `verify-session`, `webhooks/stripe`, `admin/dashboard` |
| 3.2 | Definir a moeda no servidor a partir da geolocalização; ignorar o campo do cliente | `credits/purchase/route.ts` |
| 3.3 | Aplicar de fato a regra `entryOnly` do Plano de Entrada | `credits/purchase/route.ts` |
| 3.4 | Reserva de créditos em duas fases (`pending` → `completed`/`refunded`) | `src/lib/credits.ts`, rotas de IA |
| 3.5 | Cobrar o download de forma consistente (hoje é gratuito se o saldo for < 1) | `resume/download/route.ts` |
| 3.6 | Adicionar os 7 índices listados em P2-1 | `schema.prisma` + migração |
| 3.7 | Paginar as consultas administrativas | `admin/dashboard`, `admin/users` |
| 3.8 | Cache em memória com TTL para a configuração de provedores | `ai-router/registry.ts` |

### Fase 4 — LGPD · ~2 dias

| # | Alteração |
|---|---|
| 4.1 | `DELETE /api/user` — exclusão de conta com cascata (o schema já tem `onDelete: Cascade`) |
| 4.2 | `GET /api/user/export` — portabilidade em JSON |
| 4.3 | Política de retenção: expurgo automático de `Resume` e `WebhookEvent` antigos |
| 4.4 | Consentimento explícito de transferência internacional no cadastro e no upload |
| 4.5 | Expurgar PII de `WebhookEvent.body` antes de gravar |

### Fase 5 — Higiene · ~2 dias

| # | Alteração |
|---|---|
| 5.1 | Remover as 10 dependências não usadas (`puppeteer` primeiro) |
| 5.2 | Escolher um gerenciador de pacotes e apagar o outro lockfile |
| 5.3 | Apagar o código morto de `llm.ts`; consolidar os prompts em um único módulo |
| 5.4 | Reativar as regras de ESLint que importam e corrigir os 17 erros de P2-12 |
| 5.5 | Atualizar o README (banco, provedores de IA, modelo de preços) |
| 5.6 | Testes dos caminhos de cobrança e failover + CI no GitHub Actions |
| 5.7 | Decidir entre créditos e assinaturas; remover o modelo abandonado |
| 5.8 | Quebrar `admin-view.tsx` e `analysis-view.tsx` |

---

## Sequência recomendada

**Fase 0 é pré-requisito de tudo** e não depende de código — pode começar imediatamente.

Fases 1 e 2 são o mínimo para operar com pagamentos reais. A Fase 3 corrige números que hoje estão errados no painel financeiro — quanto antes, menos histórico contaminado. A Fase 4 é exposição regulatória com público brasileiro. A Fase 5 é o que evita a próxima rodada de achados.

Nenhuma fase exige reescrita arquitetural. A base é sólida; o que falta são os controles em volta dela.
