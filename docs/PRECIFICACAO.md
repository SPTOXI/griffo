# Reprecificação — um produto, um preço por região

Este documento descreve o modelo comercial em vigor e onde cada peça dele vive
no código. Os documentos anteriores (`ANALISE-CUSTOS.md`, `PLANO-GLOBAL.md`)
descrevem o modelo de créditos, que foi encerrado.

## O que se vende

**Análise Completa.** Uma compra libera, para UM currículo, os nove itens:

| Item | Modelo |
|---|---|
| Laudo das 8 Dimensões | `claude-sonnet-5` (segmentado) |
| Comparação com a Vaga Alvo | `claude-sonnet-5` |
| Reescrita de Experiências (STAR/XYZ) | `claude-sonnet-5` |
| Orientação Profissional | `claude-sonnet-5` |
| Otimização de Perfil (LinkedIn/Gupy) | `claude-sonnet-5` |
| Análise de Mídias Sociais | `claude-sonnet-5` |
| Carta de Apresentação | `claude-sonnet-5` |
| Resumo Profissional | `deepseek-v4-flash` |
| Download em PDF | sem LLM |

Não há contagem por ação, saldo de créditos, assinatura, plano ilimitado nem
vitalício. O único movimento cobrável é **destravar um currículo**
(`unlockAnalysis`); a partir daí todos os itens daquele currículo ficam
disponíveis quantas vezes o usuário quiser.

**Prévia gratuita.** Só as notas de 0 a 10 nas oito dimensões — sem
diagnóstico e sem texto. Roda em `free_preview`, roteado para o DeepSeek. Uma
por conta (`User.freePreviewAt`).

**Upsell.** Pacote de 5 análises, renderizado apenas dentro do resultado e
apenas depois da primeira compra. A regra é aplicada no servidor
(`/api/checkout` recusa o SKU `pack5` sem compra anterior), não só na
renderização.

**Empresas e RH.** Sem autosserviço — botão "Falar com vendas".

## Onde o preço vive

`src/lib/pricing/catalog.ts` é o **ponto único de verdade**. Nenhum preço pode
existir fora dele: nem no painel administrativo, nem no script da Stripe, nem
na landing. O checkout monta o preço inline a partir do catálogo.

- `ANALYSIS_FLOOR_USD = 2.60` — piso absoluto por análise.
- `ANALYSIS_DIRECT_COST_USD = 1.0449` — custo direto medido.
- `TIERS` — as quatro faixas, com países e âncora em dólar.
- `LOCAL_PRICES` — o preço que o cliente vê e paga, por moeda. Não é conversão
  em tempo real: é preço de tabela. Brasil é R$ 29,90 por decisão, não por
  `5.90 × cotação`.
- `USD_TO_LOCAL` — cotações de referência, usadas para arredondar o preço local
  e para converter de volta no teste do piso. **Nada é consultado em tempo de
  cobrança.**

| Faixa | Países | Preço | Pacote de 5 |
|---|---|---|---|
| 1 — Alta renda | US CA GB DE FR AU JP SG NL IE | $12,90 | $49,90 |
| 2 — Média-alta | PT ES IT PL CZ CL MY TR ZA AE | $8,90 | $34,90 |
| 3 — Média | **BR** MX CO AR TH RO BG | $5,90 | $22,90 |
| 4 — Emergente | IN ID PH VN NG EG PK BD KE | $3,90 | $16,90 |

País não mapeado cai na Faixa 1 — é o preço de tabela, e a Faixa 1 é a única
que pode ser cobrada em dólar. Rebaixar o desconhecido para uma faixa barata
faria de "país não mapeado" a forma mais fácil de pagar menos.

## Como a faixa é decidida

`src/lib/pricing/resolve.ts`. Ordem: **país do meio de pagamento** >
**borda (IP)** > padrão.

O IP entra apenas enquanto ninguém pagou nada — serve para escolher a moeda de
exibição, nunca para definir o preço. Assim que um pagamento confirma, o país do
cartão é gravado em `User.paymentCountry` e passa a mandar nas compras
seguintes; trocar de VPN deixa de mudar o preço.

Na primeira compra o país do dinheiro ainda não existe quando o checkout é
criado, então o preço sai da borda. `recordTierAudit` compara, depois do
pagamento, a faixa cobrada com a faixa do país do cartão e grava
`purchase_tier_mismatch` no `AuditLog` quando elas divergem. Não dá para
recobrar retroativamente; dá para não repetir.

## Métodos de pagamento locais

`src/lib/pricing/payment-methods.ts`. A regra é econômica: nas Faixas 3 e 4 a
taxa fixa do cartão internacional come ~10% da receita.

- **Pix (BR)** — `payment_method_type` da Stripe, ativo quando a cobrança é em
  BRL.
- **UPI (IN), GoPay/OVO (ID)** — declarados no catálogo como requisito do
  mercado, mas **a Stripe não os serve** para contas fora daqueles países.
  `pendingLocalMethods(country)` reporta a lacuna. Fechá-la exige adquirente
  local; até lá, essas praças rodam só com cartão e a conversão sofre.

## Ledger e idempotência

`AnalysisLedger` guarda `userId`, `type`, `delta`, `tier`, `priceUsd`,
`paymentCountry`, `currency`, `amountLocal`, `createdAt`.

Duas idempotências, ambas por índice único no banco — nunca por consulta antes
da escrita, que perde a corrida entre o webhook e a verificação direta:

- `AnalysisLedger.paymentRef` (o `checkout.session.id`) impede creditar o mesmo
  pagamento duas vezes.
- `WebhookEvent.eventId` (o `event.id` da Stripe) impede processar a mesma
  entrega duas vezes. A assinatura HMAC é verificada antes de qualquer coisa.

## Operação

```bash
bun run test                 # o teste do piso; falha se algum preço violar
bun run db:push              # aplica o schema (analysisBalance, ledger, etc.)
bun run stripe:setup -- --dry-run   # simula: arquiva pacotes antigos, cria preços
bun run stripe:setup         # aplica na conta Stripe
bun run migrate:analyses -- --dry-run  # simula a conversão de saldos
bun run migrate:analyses     # converte 25 créditos = 1 análise, arredondando a favor
```

O script da Stripe **arquiva** (`active: false`) os pacotes de crédito em vez de
deletá-los: um `Price` deletado quebra o histórico dos pagamentos que o
referenciam.

## Migração de saldos

25 créditos = 1 análise, **arredondando para cima**. Quem tinha 40 créditos — o
antigo Plano de Entrada, que valia 2 avaliações — recebe 2 análises, não 1. O
arredondamento é a favor do usuário por decisão: ninguém sai perdendo numa
mudança de modelo que não pediu.

`User.credits` e `User.creditsMigratedAt` permanecem no schema como rastro
auditável da conversão. Nada no produto lê ou escreve `credits` depois dela.

**Comunicar por e-mail** faz parte da migração e não está automatizado aqui.

## Critérios de aceite

| Critério | Onde |
|---|---|
| `ANALYSIS_FLOOR_USD` existe; teste falha abaixo dele | `lib/pricing/catalog.ts`, `catalog.test.ts` |
| Faixa pelo país do meio de pagamento, não por IP | `lib/pricing/resolve.ts` |
| USD nunca exibido fora da Faixa 1 | `COUNTRY_CURRENCY` + teste |
| Pix ativo no Brasil | `payment-methods.ts` |
| UPI na Índia | **declarado, não servido pela Stripe** — ver acima |
| Prévia gratuita: só notas, DeepSeek, 1x por conta | `api/resume/preview` |
| Uma compra entrega os 9 itens, sem contagem | `lib/entitlements.ts` |
| Upsell só pós-compra | `repurchase-upsell.tsx` + `api/checkout` |
| Zero "crédito" no produto | interface e rotas |
| Recompra em 1 clique dentro do resultado | `repurchase-upsell.tsx` (leva `resumeId`) |
| Telemetria por análise | `AiLog`: `tokensIn`, `tokensOut`, `usedModel`, `costUsd`, `failoverCount` |
| Prompt caching no prefixo estável | `cacheableContext` em `lib/analysis/job.ts` |
| Saldos antigos convertidos a favor do usuário | `migrate-credits-to-analyses.ts` |
| Webhook idempotente por `event.id`, HMAC verificado | `api/webhooks/stripe` |
