# Plano Consolidado de Melhorias

**Data:** 2026-08-09
**Commit base:** `8eb051a`
**Escopo:** roteiro único de execução, consolidando tudo o que foi identificado nos diagnósticos

Este documento é o **roteiro de execução**. O detalhamento técnico de cada item está nos documentos de diagnóstico:

| Documento | Papel |
|---|---|
| [`AUDITORIA.md`](./AUDITORIA.md) | Catálogo de 37 achados de segurança, performance e dívida técnica |
| [`RELATORIO-TIMEOUT-ANALISE.md`](./RELATORIO-TIMEOUT-ANALISE.md) | Causa raiz do timeout na análise |
| [`ANALISE-CUSTOS.md`](./ANALISE-CUSTOS.md) | Custo por módulo, margem, seleção de modelo |
| [`PLANO-GLOBAL.md`](./PLANO-GLOBAL.md) | Operação em pt/en/es |

---

## Princípio de ordenação

As fases estão ordenadas por **risco decrescente**, não por esforço. A regra aplicada foi:

1. O que expõe credenciais ou permite acesso indevido vem primeiro.
2. O que cobra o cliente sem entregar vem em seguida.
3. O que impede vender em dois dos três mercados-alvo vem junto.
4. O que corrompe dados financeiros vem depois.
5. Conformidade regulatória segue em paralelo, porque não depende de código.
6. Evolução de produto e higiene por último.

Cada tarefa tem um **ID** para permitir o dimensionamento de tempo posterior.

---

## Fase 0 — Contenção · não é código

**Precede tudo. Pode começar imediatamente, independente de qualquer PR.**

| ID | Tarefa | Tipo |
|---|---|---|
| C1 | Rotacionar a senha do banco Supabase | Operação |
| C2 | Rotacionar a senha do admin `admin@griffowork.com` | Operação |
| C3 | Gerar novo `SESSION_SECRET` (`openssl rand -hex 32`) e configurar no ambiente | Operação |
| C4 | Rotacionar chaves do Stripe (secret + webhook) | Operação |
| C5 | Rotacionar chaves de Anthropic, DeepSeek, Moonshot e Gemini | Operação |
| C6 | Auditar `AuditLog` e os logs do Supabase em busca de acesso não reconhecido | Investigação |

> As credenciais estão no histórico do git. Remover os arquivos **não** resolve — só a rotação resolve. A reescrita do histórico (`git filter-repo`) é opcional e secundária.

---

## Fase 1 — Parar o sangramento

O que hoje cobra o cliente sem entregar, e o que impede vender em inglês e espanhol.

### 1.1 Timeout e perda de créditos

| ID | Tarefa | Arquivo |
|---|---|---|
| T1 | Trocar o modelo primário para `claude-sonnet-5` | `registry.ts:19` |
| T2 | Corrigir o auto-correct que força modelos com "sonnet" de volta para Opus | `registry.ts:155` |
| T3 | Adicionar `maxRetries: 0` ao cliente OpenAI (hoje ausente ⇒ 3 tentativas por provedor) | `router.ts:100` |
| T4 | Reduzir timeout por provedor para ~20 s e limitar a cadeia a 2 provedores | `router.ts:75,103` |
| T5 | Remover os `console.log('[KIMI DEBUG]')` que vazam prefixo da chave | `router.ts:91-94` |
| T6 | Recalibrar a barra de progresso para a duração real | `analysis-view.tsx:157` |
| T7 | Remover o laço de 25 tentativas — espera por registro que não será escrito | `analysis-view.tsx:207` |

### 1.2 Integridade do laudo

| ID | Tarefa | Arquivo |
|---|---|---|
| T8 | Adotar structured outputs (`output_config.format` com JSON Schema) via SDK oficial | `router.ts:62`, `analyze`, `career-orientation` |
| T9 | Remover o laudo fabricado (nota 7,5 fixa) — falhar e reembolsar | `analyze/route.ts:237-257` |
| T10 | Remover a orientação fabricada (88%/84%/80% fixos) | `career-orientation/route.ts:88-113` |
| T11 | Calcular `overall` em código a partir do array `dimensions` | `analyze/route.ts` |
| T12 | Aplicar `slice` na entrada da reescrita (hoje sem limite) | `rewrite/route.ts:90` |

> T8 elimina T9 e T10 pela raiz: com JSON garantido, não existe "falha de parse". T11 é independente — nenhum modelo é confiável em aritmética auto-consistente.

### 1.3 Globalização bloqueante

| ID | Tarefa | Arquivo |
|---|---|---|
| G1 | Campo `language` no `User` + persistir a escolha do seletor | `schema.prisma`, `i18n-context.tsx` |
| G2 | Passar idioma às 4 rotas de IA + diretriz dinâmica no lugar do texto fixo | `analyze`, `rewrite`, `career-orientation`, `support` |
| G3 | Lista de ATS variável por mercado (hoje Gupy fixo, 5 ocorrências) | `analyze/route.ts` |

### 1.4 Superfície exposta

| ID | Tarefa | Arquivo |
|---|---|---|
| S1 | Remover o fallback da URL do banco; falhar se `POSTGRES_PRISMA_URL` ausente | `db.ts:15` |
| S2 | Remover o fallback de `SESSION_SECRET`; erro na inicialização se ausente | `auth.ts:25` |
| S3 | Excluir `scratch/` do versionamento e adicionar ao `.gitignore` | `scratch/`, `.gitignore` |
| S4 | Validação de ambiente na inicialização (Zod sobre `process.env`) | novo `lib/env.ts` |
| S5 | Rate limiting por IP e por usuário em auth, IA e `job-fetch` | novo `middleware.ts` |

---

## Fase 2 — Endurecimento de segurança

| ID | Tarefa | Arquivo |
|---|---|---|
| ID | Tarefa | Arquivo | Situação |
|---|---|---|---|
| E1 | Criptografar em repouso `AiApiKey.apiKey` e valores sensíveis de `SystemConfig` (AES-256-GCM) | novo `lib/crypto.ts`, `registry.ts`, `admin/ai-keys`, `admin/settings` | **feito** (Sessão 4) |
| E2 | Allowlist de chaves em `POST /api/admin/settings` (hoje aceita qualquer chave) | `admin/settings/route.ts` | **feito** (Sessão 4) |
| E3 | Validar URL do webhook de alerta (só HTTPS, host público) — SSRF autenticado | `diagnostic-agent.ts:129` | **feito** (Sessão 4) |
| E4 | Reforçar SSRF em `job-fetch`: `redirect: 'manual'`, resolução de DNS, IPv6, notação numérica | `job-fetch/route.ts:86-97` | **feito** (Sessão 4) |
| E5 | Login apenas por e-mail (ou tornar `name` único e normalizado) com `orderBy` determinístico | `auth/login/route.ts:21` | **feito** (Sessão 4) |
| E6 | Unificar a regra de conta desabilitada entre login e sessão | `auth/login/route.ts:34`, `auth.ts:88` | **feito** (Sessão 4) |
| E7 | Headers de segurança (CSP, HSTS, frame-ancestors, Referrer-Policy) | `next.config.ts` | **parcial** (Sessão 4) |
| E8 | Padronizar erros: mensagem genérica ao cliente, detalhe só no log | `admin/dashboard`, `credits/purchase`, `verify-session`, `webhooks/stripe` | **feito** (Sessão 4) |
| E9 | Remover log do e-mail do admin | `admin/dashboard/route.ts:18` | **feito** (Sessão 4) |
| E10 | Sessões revogáveis: tabela `Session` com invalidação no logout | `schema.prisma`, `auth.ts` | **feito** (Sessão 5) |

**E7 ficou parcial de propósito.** Foram aplicados HSTS, `nosniff`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` e as diretivas de CSP que restringem sem
depender de nonce (`frame-ancestors`, `object-src`, `base-uri`, `form-action`,
`upgrade-insecure-requests`). Falta o `script-src`: o Next injeta scripts inline
para hidratação, então declará-lo exigiria nonce gerado no middleware — ou
`'unsafe-inline'`, que daria aparência de proteção sem proteger. Fica para uma
sessão com orçamento de teste no navegador.

**Pré-requisito operacional do E1:** a variável `ENCRYPTION_KEY` (32 bytes,
`openssl rand -hex 32`) precisa existir no ambiente. Sem ela a leitura segue
funcionando — os segredos já gravados em texto puro passam intactos — mas
gravar uma chave nova pelo painel falha com mensagem explícita. Os segredos já
existentes só passam a ser cifrados quando forem regravados.

---

## Fase 3 — Cobrança e dados corretos

| ID | Tarefa | Arquivo | Situação |
|---|---|---|---|
| F1 | Corrigir o preço do Opus 5 ($15/$75 → $5/$25) | `registry.ts:23-24` | **feito** (Sessão 1) |
| F2 | Corrigir o preço do DeepSeek (V4-Flash/V4-Pro) e o auto-correct que força `deepseek-chat` | `registry.ts:33,158` | **feito** (Sessão 1) |
| F3 | Recalcular ou marcar como suspeito o histórico de `AiLog.costUsd` | migração | pendente |
| F4 | Fazer `/api/pricing` derivar do `registry.ts` em vez do `TOKEN_COST` divergente | `llm.ts:47`, `api/pricing` | **feito** (Sessão 5) |
| F5 | Gravar `currency` e `amountOriginal`; converter na leitura | `schema.prisma`, `verify-session`, `webhooks/stripe`, `admin/dashboard` | **feito** (Sessão 5) |
| G4 | Moeda definida no servidor por geolocalização; ignorar campo do cliente | `credits/purchase/route.ts:11` | **feito** (Sessão 5) |
| F6 | Aplicar de fato a regra `entryOnly` do Plano de Entrada | `credits/purchase/route.ts` | pendente |
| F7 | Alinhar a descrição do Plano de Entrada com o custo real (ou elevar para 64 créditos) | `credits-catalog.ts:48` | pendente |
| F8 | Reserva de créditos em duas fases (`pending` → `completed`/`refunded`) | `lib/credits.ts`, rotas de IA | **feito** (Sessão 6) |
| F9 | Cobrar o download de forma consistente (hoje grátis se saldo < 1) | `download/route.ts:28` | **feito** (Sessão 6) |
| F10 | Adicionar os 7 índices ausentes no schema | `schema.prisma` + migração | **feito** (Sessão 7) |
| F11 | Paginar `admin/dashboard` e `admin/users` (hoje `findMany` sem `take`) | 2 rotas | **feito** (Sessão 7) |
| F12 | Cache com TTL da configuração de provedores + remover a chamada duplicada | `registry.ts:88`, `router.ts:16,46` | **feito** (Sessão 7) |
| G10 | Reduzir consultas ao banco por análise (13 → ~7) | `router.ts`, `registry.ts` | **feito** (Sessão 7) |

> ### ⚠️ Pré-requisito das Sessões 5 a 7 — aplicar o schema
>
> O projeto **não usa `prisma migrate`**: não existe `prisma/migrations/`, e o
> build da Vercel roda apenas `prisma generate && next build`. Nada aplica
> mudanças de schema no deploy.
>
> A Sessão 5 adiciona a tabela `Session` e duas colunas em `CreditTransaction`;
> a Sessão 6 acrescenta o índice `(userId, status)` nessa mesma tabela; a
> Sessão 7 acrescenta 11 índices e dois campos de consentimento em `User`.
> Antes ou logo depois do deploy, rode contra o banco de produção:
>
> ```
> npm run db:push
> ```
>
> As mudanças são **puramente aditivas** — tabela nova e colunas com valor
> padrão —, então o código antigo continua funcionando depois do `db push`.
> Isso permite aplicar o schema **antes** do deploy, que é a ordem segura.
>
> Se o deploy vier primeiro, nada cai: `lib/session-store.ts` detecta a tabela
> ausente, registra erro no log e mantém o comportamento anterior (sessão
> validada só pela assinatura, logout sem revogação). A detecção é reavaliada a
> cada 60s, então o recurso passa a valer sozinho assim que o `db push` rodar,
> sem precisar de novo deploy.

**F3 continua pendente e agora tem um irmão.** As linhas de `CreditTransaction`
anteriores à Sessão 5 têm `costBrl` gravado sem conversão — em vendas fora do
Brasil, o valor está na moeda do checkout somado como se fosse real. As novas
gravam `currency` + `amountOriginal` e convertem na escrita de `costBrl`, então
o problema para de crescer, mas o histórico segue misturado. Corrigir exige
saber quais vendas passadas não foram em BRL; como até aqui a divulgação foi só
no Brasil, é provável que o impacto real seja nulo — vale conferir antes de
gastar uma migração com isso.

---

## Fase 4 — Conformidade LGPD + GDPR

Parte é código, parte é jurídico e comercial — as duas trilhas correm em paralelo.

| ID | Tarefa | Tipo | Situação |
|---|---|---|---|
| L1 | `DELETE /api/user` — exclusão de conta com cascata | Código | **feito** (Sessão 7) |
| L2 | `GET /api/user/export` — portabilidade em JSON | Código | **feito** (Sessão 7) |
| L3 | Política de retenção: expurgo automático de `Resume` e `WebhookEvent` antigos | Código | **parcial** (Sessão 7) |
| L4 | Consentimento explícito de transferência internacional no cadastro e no upload | Código | **parcial** (Sessão 7) |
| L5 | Expurgar PII de `WebhookEvent.body` antes de gravar | Código | **feito** (Sessão 7) |
| G8 | Roteamento de provedor por região — dado de europeu fora de provedor sem adequação | Código | **feito** (Sessão 7) |
| G6 | Habilitar e configurar Stripe Tax (IVA UE, sales tax EUA) | Configuração | pendente |
| G9 | Representante na UE (Art. 27), base legal documentada, registro de tratamento | Jurídico | pendente |

**L3 está parcial:** a rotina de expurgo existe (`lib/retention.ts`) e é
disparável por `POST /api/admin/retention`, mas o **agendamento não**. Automatizar
exige declarar um cron no `vercel.json` e um segredo para autenticá-lo — passo
operacional, não de código. Enquanto isso, o expurgo depende de alguém clicar.

**L4 está parcial em dois pontos.** O consentimento é exigido no cadastro e
gravado com data em `User.dataTransferConsent`, mas:

1. **Contas criadas antes desta sessão ficam com `false`.** Deliberadamente não
   bloqueei as rotas de IA nesse campo — isso deslogaria da prática todo usuário
   existente. Falta um fluxo de reconsentimento único para a base atual, e só
   depois dele faz sentido tornar o campo bloqueante.
2. **Não há reconsentimento por upload**, apenas no cadastro. Para o currículo
   isso é defensável (o consentimento é da conta, e o tratamento é o mesmo em
   todo upload); se a assessoria jurídica exigir granularidade por documento,
   vira um item novo.

**G8 tem uma consequência de custo.** O chat de suporte roteia para DeepSeek,
que passa a ser barrado para usuários europeus — a cadeia deles cai em Claude.
O suporte fica **cerca de 4x mais caro por token para europeus**. É o preço da
conformidade e não há atalho: a alternativa é assinar cláusulas contratuais
padrão com o provedor chinês, o que é decisão jurídica (G9), não técnica.

---

## Fase 5 — Evolução de produto

O que transforma promessas atuais em entregas reais.

### 5.1 Análise de redes sociais de verdade

Hoje o modelo recebe apenas a URL como texto — **não visita o perfil**. O conselho é genérico, gerado a partir do currículo.

As plataformas se dividem em três níveis:

| Nível | Plataformas | Caminho |
|---|---|---|
| **A — funciona hoje** | GitHub | API pública oficial (`api.github.com`), sem chave até 60 req/h |
| **A — funciona hoje** | Portfólio, Medium, Substack, Dev.to | Jina Reader (já em uso no `job-fetch`) |
| **B — com ressalva** | Behance, Dribbble, Stack Overflow | Jina Reader, com rate limiting |
| **C — não por raspagem** | LinkedIn, Gupy | Ver abaixo |

**Saída para o Nível C:** o LinkedIn tem botão nativo **Mais → Salvar como PDF** em todo perfil. O usuário baixa e sobe — exatamente o fluxo que o `resume/upload` já executa com `pdf-parse`. Perfil real e completo, com consentimento explícito, sem violar termos e sem risco de bloqueio de IP. Alternativa leve: campo para colar o texto do "Sobre" e o headline.

| ID | Tarefa |
|---|---|
| P1 | Rota separada `POST /api/resume/social-analysis` (não dentro da análise, para não agravar o timeout) |
| P2 | Integração com a API pública do GitHub |
| P3 | Upload de PDF do perfil LinkedIn / campo de colar texto |
| P4 | Busca de portfólio e blogs via Jina Reader |
| P5 | Ligar o `CREDIT_COSTS.social_optimization = 20`, que já existe e nunca é cobrado |

**Custo:** +2.000–4.000 tokens de entrada ≈ R$ 0,05. **Receita:** 20 créditos ≈ R$ 4,95.

### 5.2 Orientação vocacional cobrada

| ID | Tarefa |
|---|---|
| P6 | Ligar `deductCredits` — sugestão de 10 créditos, coerente com `rewrite_experience` |
| P7 | Enriquecer com dados reais de mercado (reusar `job-fetch` para os cargos sugeridos) |

> **Ordem obrigatória:** T8 e T10 (structured outputs + remoção do fallback fabricado) **precedem** P6. Cobrar por um resultado que pode ser inventado é pior que oferecer de graça.

### 5.3 OCR real

O "Agente 4 — Economia & OCR" é regex; **não há OCR**. Um PDF escaneado sem camada de texto retorna vazio e o upload rejeita com "conteúdo muito curto" — o usuário não entende o motivo.

| ID | Tarefa |
|---|---|
| P8 | Detectar PDF sem camada de texto e rotear para modelo com visão (Claude ou Gemini) |
| P9 | Mensagem de erro específica quando a extração falha, em vez de "conteúdo muito curto" |

> É aqui que IA nova agrega valor ao usuário final — mais do que dar inteligência a agentes de monitoramento.

### 5.4 Agentes com inteligência onde ela agrega

| ID | Tarefa | Observação |
|---|---|---|
| P10 | Agente de Qualidade como juiz LLM **assíncrono e amostrado** (~10%) | **Não colocar no caminho da requisição** — agravaria o timeout |
| P11 | Análise periódica do `AiLog` para correlação de padrões de falha | Batch; DeepSeek é adequado |

Onde **não** vale: o Agente 2 (diagnóstico) faz checagem determinística — um LLM narrando o resultado adiciona prosa, não diagnóstico. O Agente 4 (limpeza) é regex, que é a ferramenta certa.

---

## Fase 6 — Higiene e sustentação

| ID | Tarefa |
|---|---|
| H1 | Remover as 10 dependências não usadas (`puppeteer` primeiro, ~300 MB) |
| H2 | Escolher um gerenciador de pacotes e apagar o outro lockfile |
| H3 | Apagar o código morto de `llm.ts` (345 linhas) e consolidar os prompts em um módulo |
| H4 | Reativar as regras de ESLint que importam e corrigir os 17 erros |
| H5 | Atualizar o README (banco, provedores, modelo de preços, custos) |
| H6 | Testes dos caminhos de cobrança e failover + CI no GitHub Actions |
| H7 | Decidir entre créditos e assinaturas; remover o modelo abandonado |
| H8 | Quebrar `admin-view.tsx` (2.118 linhas) e `analysis-view.tsx` (1.169) |
| H9 | Remover `check-config.js`, `.zscripts/dev.pid`, `examples/`, `mini-services/` |
| H10 | Remover o handler `OPTIONS` órfão e os `revalidate = 0` redundantes |
| H11 | Alinhar a descrição dos agentes no painel com o que eles de fato fazem |

---

## Fase 7 — Arquitetura (opcional, habilita Opus 5)

Só necessária se a decisão for usar Opus 5 no laudo.

| ID | Tarefa |
|---|---|
| A1 | Streaming (`stream: true`) — primeiro token em segundos, progresso real no cliente |
| A2 | Fila + `202 Accepted` — análise sai do ciclo de requisição, cliente acompanha status |
| A3 | Cache de prompt nos provedores (o system prompt tem 5.057 chars idênticos) |
| G11 | Avaliar a região de execução das funções Vercel vs. Supabase em São Paulo |

Com A1 ou A2, o teto de 60 s desaparece e o Opus 5 passa a ser escolha de qualidade legítima em vez de risco operacional.

---

## Dependências entre tarefas

```
C1..C6 (contenção)
   └─> tudo o mais

T8 (structured outputs)
   ├─> T9, T10 (removem os fallbacks fabricados)
   └─> P6 (cobrar pela orientação)

G1 (campo language)
   └─> G2 (idioma nas rotas de IA)
         └─> G3 (ATS por mercado)

F1, F2 (preços corretos)
   └─> F3 (recalcular histórico)
         └─> F4 (/api/pricing derivar do registry)

F5 + G4 (moeda correta)
   └─> painel financeiro confiável

T1..T4 (timeout)
   └─> P10 (juiz LLM) — só depois que houver folga de tempo

A1 ou A2 (streaming/fila)
   └─> reverter para Opus 5, se a medição justificar
```

---

## Dimensionamento e agrupamento por sessão

### O que realmente limita uma sessão de trabalho

O gargalo raramente é o tempo de relógio — é o **contexto acumulado**. O que consome orçamento numa sessão de implementação é: ler arquivos, escrever, rodar `build`/`lint`, e **iterar sobre falhas**.

Um bloco que toca 4 arquivos pequenos e compila de primeira é leve; um que adiciona dependência, escreve um schema grande e precisa de 3 rodadas de build é pesado — mesmo tendo menos tarefas. O dimensionamento abaixo é por **peso de execução**, não por contagem de itens.

### Blocos

| # | Bloco | Tarefas | Arquivos | Migração | Dep. nova | Peso |
|---|---|---|---|---|---|---|
| **A** | Contenção | C1–C6 | — | — | — | **Não é código** |
| **B** | Timeout ponta a ponta | T1–T7, T12, F1, F2 | 4 | não | não | **Leve** |
| **C** | Structured outputs + integridade do laudo | T8–T11 | 3 | não | **sim** | **Pesado** |
| **D** | Superfície exposta | S1–S5 | 5 | não | talvez¹ | **Médio** |
| **E** | Globalização bloqueante | G1–G3 | 6 | **sim** | não | **Médio** |
| **F** | Segredos em repouso + SSRF admin | E1–E3 | 5 | não | não | **Médio** |
| **G** | SSRF, login, headers, erros | E4–E9 | 7 | não | não | **Médio** |
| **H** | Sessões revogáveis | E10 | 3 | **sim** | não | **Médio** |
| **I** | Moeda e precificação | F4–F7, G4 | 6 | **sim** | não | **Médio** |
| **J** | Reserva de créditos em 2 fases | F8, F9, F3 | 5 | **sim** | não | **Pesado** |
| **K** | Performance de banco | F10–F12, G10 | 4 | **sim** | não | **Leve** |
| **L** | LGPD + GDPR (código) | L1–L5, G8 | 6 | **sim** | não | **Médio** |
| **M** | Redes sociais reais | P1–P5 | 6+ | **sim** | talvez² | **Pesado** |
| **N** | Orientação cobrada + OCR real | P6–P9 | 4 | não | talvez³ | **Médio** |
| **O** | Agentes com IA amostrada | P10, P11 | 3 | não | não | **Leve** |
| **P** | Higiene | H1–H11 | ~20 | não | remove | **Fatiar** |
| **Q** | Arquitetura (opcional) | A1–A3, G11 | 5+ | talvez | não | **Pesado** |

¹ Rate limiting: em memória (sem dependência) ou Upstash/Redis (com) — decisão de arquitetura.
² Apenas se optar por SDK do GitHub; a API REST pura não exige.
³ Modelo com visão para OCR já vem pelo SDK adotado no bloco C.

### Agrupamento por sessão

| Sessão | Blocos | Racional |
|---|---|---|
| 1 | **B** | Isolado. Para o sangramento em 4 arquivos; convém observar o efeito em produção antes de mexer em mais nada |
| 2 | **C** | Sozinho. Trocar `fetch` cru pelo SDK, escrever o JSON Schema das 8 dimensões, ajustar 2 rotas. Alta chance de 2–3 iterações de build |
| 3 | **D + E** | Áreas distintas (`env`/`middleware` vs. prompts/schema); o contexto não compete. Fecham a Fase 1 |
| 4 | **F + G** | Ambos de segurança. F traz o módulo de cripto; G é mais mecânico e ficaria subaproveitado sozinho |
| 5 | **H + I** | Duas migrações pequenas e independentes |
| 6 | **J** | Sozinho. Mexe na máquina de estados de crédito e toca todas as rotas de IA — é onde um erro custa dinheiro real |
| 7 | **K + L** | K é leve, L é médio; somam bem |
| 8 | **M** | Sozinho. Rota nova, API do GitHub, upload de PDF do LinkedIn, Jina, ligação com créditos |
| 9 | **N + O** | N depende de C concluído; O é leve |
| 10–12 | **P fatiado** | Ver abaixo |
| 13+ | **Q** | Só se a medição de qualidade justificar voltar ao Opus 5 |

**Fatias da higiene** — o custo vem do volume de leitura, não da dificuldade:

- **P.1** — dependências, lockfile, código morto de `llm.ts`, arquivos órfãos (H1, H2, H3, H9, H10)
- **P.2** — ESLint reativado + os 17 erros de React (H4, H8)
- **P.3** — README, descrição dos agentes, testes e CI (H5, H6, H11)

### Sequência

```
A (paralelo, não depende de sessão)
 └─> Sessão 1 (B) ──> deploy e observar
      └─> Sessão 2 (C)
           └─> Sessão 3 (D+E) ──> divulgação liberada
                └─> Sessões 4, 5 (segurança)
                     └─> Sessões 6, 7 (cobrança e dados)
                          └─> Sessões 8, 9 (produto)
                               └─> 10–12 (higiene)
```

**Depois da Sessão 3 é possível divulgar.** B corrige o que cobra sem entregar, C garante que o laudo é real, D fecha a exposição e E habilita inglês e espanhol — o mínimo defensável para levar público externo à plataforma.

**Exceção na ordem:** **P.1 pode entrar a qualquer momento** e tende a acelerar as sessões seguintes — remover o `puppeteer` (~300 MB) e resolver os dois lockfiles encurta cada `npm ci` e cada build. Se quiser um ganho barato cedo, encaixe logo após a Sessão 1.

### Onde este dimensionamento pode errar

Os pesos assumem build passando em 1–2 tentativas. Três fatores podem inflar qualquer bloco:

- **Migrações de Prisma** contra o banco de produção — divergência entre schema e banco real vira investigação.
- **Bloco C** — depende de quantos ajustes o JSON Schema das 8 dimensões exigir até ser aceito sem reclamação.
- **Bloco M** — depende de quão bem o PDF do perfil LinkedIn extrai com `pdf-parse`; pode exigir tratamento específico.

---

## O que medir antes de decidir

Duas decisões deste plano dependem de dados que ainda não existem:

1. **Sonnet 5 é suficiente para o padrão de qualidade do laudo?** Rodar os mesmos 10 currículos reais em Opus 5 e Sonnet 5, comparar `targetedChanges` e as `rationale` lado a lado, e rodar o mesmo currículo 3× em cada um para medir a variância das notas.

2. **A taxa real do gateway de pagamento.** É a maior incerteza da modelagem de margem — num ticket de R$ 9,90 pesa cerca de 8%.

A tabela `AiLog` já registra `responseTimeMs`, `usedModel`, `tokensIn/Out` e `status` para sustentar a primeira comparação.
