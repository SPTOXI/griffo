# Análise de Custos por Ciclo e Seleção de Modelo

**Data:** 2026-08-09
**Escopo:** custo real de IA por análise/reescrita, comparação entre provedores, e consistência do pacote de créditos
**Commit analisado:** `8eb051a`
**Método:** rastreamento de todas as chamadas a `executeAiTask` no código, medição dos prompts em caracteres, e preços de tabela dos provedores.

---

## Resumo

O custo de IA por ciclo completo está entre **R$ 0,50 e R$ 1,44**, dependendo do modelo e do tamanho do currículo. Sobre a venda de R$ 9,90 do Plano de Entrada, isso deixa uma margem bruta entre **73% e 87%** — confortável em qualquer dos cenários.

Três achados relevantes surgiram na apuração:

1. **O preço do Opus 5 no código está errado em 3×** — o painel administrativo reporta custo e lucro incorretos.
2. **O custo declarado no README subestima o real em ~31×**, e não bate nem com o cálculo do próprio código.
3. **O Plano de Entrada não entrega o que promete** — 40 créditos não compram "2 avaliações completas".

A conclusão operacional é que **custo nunca foi o argumento decisivo entre Opus 5 e Sonnet 5** — a diferença é de 3 a 7 pontos de margem. O argumento real contra o Opus 5 continua sendo o teto de 60 s da função (ver `RELATORIO-TIMEOUT-ANALISE.md`).

---

## 1. Onde a IA é realmente consumida

Rastreando todas as chamadas a `executeAiTask()`, apenas **duas** etapas do fluxo pago custam tokens:

| Etapa | Chamada de IA | Créditos | Custo |
|---|---|---|---|
| Upload + extração de PDF | Não — `pdf-parse` local | — | R$ 0 |
| Limpeza de texto | Não — regex local (`ocr/extractor.ts`) | — | R$ 0 |
| Importação de vaga por link | Não — Jina Reader / `fetch` | — | R$ 0 |
| **Análise 8 dimensões** | **Sim** — `full_analysis` | 20 | ver §2 |
| **Reescrita** | **Sim** — `rewrite` | 10 | ver §2 |
| Orientação vocacional | **Sim** — reusa `full_analysis` | **0** | ver §5 |
| Geração de PDF / MD / TXT | Não — `pdf-lib` local | 1 cada | R$ 0 |
| Chat de suporte | Sim — `support_chat` (DeepSeek) | 0 | R$ 0,008 |

**Entradas mortas no roteamento:** `ocr_extraction` e `normalization` estão declaradas em `INITIAL_TASK_ROUTING` (`registry.ts:71-72`) mas **nunca são chamadas**. Não geram custo, mas sugerem no código um OCR por IA que não existe — a extração é local.

---

## 2. Custo de IA por ciclo completo

Premissas declaradas: câmbio BRL/USD = 5,4. Entradas medidas no código (prompt de análise = 5.057 caracteres ≈ 1.264 tokens; prompt de reescrita = 1.160 caracteres ≈ 290 tokens). Saída da análise perto do teto de 3.800 tokens, porque o schema exige 8 dimensões com justificativa, `jobMatch`, `targetedChanges` e quatro arrays. Saída da reescrita estimada em ~1,6× o currículo original.

| Cenário | Etapa | **Opus 5** | **Sonnet 5** |
|---|---|---|---|
| **Currículo típico**<br>(4.000 caracteres) | Análise | R$ 0,580 | R$ 0,348 |
| | Reescrita | R$ 0,252 | R$ 0,151 |
| | **Ciclo completo** | **R$ 0,832** | **R$ 0,499** |
| **Currículo longo**<br>(15.000 caracteres — teto do `slice`) | Análise | R$ 0,654 | R$ 0,392 |
| | Reescrita | R$ 0,785 | R$ 0,471 |
| | **Ciclo completo** | **R$ 1,439** | **R$ 0,864** |

Os únicos valores estimados são o tamanho do currículo e o volume de saída da reescrita; todo o resto é medido no código ou é preço de tabela.

Note que a reescrita fica **mais cara que a análise** em currículos longos: `rewrite/route.ts:90` envia `resume.originalContent` **inteiro, sem `slice`**, enquanto a análise corta em 15.000 caracteres. Um currículo de 40.000 caracteres torna a reescrita desproporcionalmente cara — e provavelmente estoura o tempo antes disso.

---

## 3. Comparação entre provedores

Custo da análise isolada (2.464 tokens de entrada / 3.800 de saída, currículo típico):

| Modelo | $/1M in | $/1M out | USD | BRL | Adequação a esta tarefa |
|---|---|---|---|---|---|
| **Opus 5** (atual) | 5 | 25 | 0,1073 | R$ 0,580 | Melhor qualidade; **não cabe em 60 s** |
| **Sonnet 5** | 3 | 15 | 0,0644 | R$ 0,348 | 1,8 s medidos; structured outputs |
| **Kimi K3** | 3 | 15 | 0,0644 | R$ 0,348 | Ver ressalvas abaixo |
| **Haiku 4.5** | 1 | 5 | 0,0215 | R$ 0,116 | Mais fraco em escrita avaliativa |
| **DeepSeek** | 0,27 | 1,10 | 0,0049 | R$ 0,027 | Adequado a tarefas mecânicas |

### Ressalvas do Kimi K3

Mesmo preço do Sonnet 5, mas com dois problemas estruturais para um laudo pontuado:

- **`temperature` forçado em 1** (`router.ts:114`, via `isReasoningModel`). Para uma avaliação com nota de 0 a 10, isso significa que o mesmo currículo pode receber notas diferentes a cada execução. Um candidato que reenvia o CV e vê a nota mudar sem alterar nada perde a confiança no laudo.
- **Tokens de raciocínio consomem o orçamento de saída.** Com `maxTokens: 3800` e um schema que exige perto disso em JSON, o raciocínio corta o JSON no meio. Isso explica o `tryParseAndRepairJson` de `analyze/route.ts:191`, que conta colchetes abertos e os fecha na marra — a assinatura clássica de saída truncada.

Há ainda o histórico: cinco commits brigando com a integração (`e510e87`, `a09d40a`, `c370895`, `3cec7be`, `2aefa6d`), incluindo um cujo título é *"eliminate Kimi 404 and Vercel 60s timeout"*. Os quatro `console.log('[KIMI DEBUG] ...')` que restaram em `router.ts:91-94` — e que vazam prefixo e tamanho da chave de API — são a cicatriz disso.

### Ressalvas do DeepSeek

13× mais barato e já adequado ao que faz hoje (chat de suporte, e as tarefas mecânicas se forem ativadas). Para o laudo, dois problemas: é o mais fraco dos quatro em escrita avaliativa com nuance em pt-BR — e o laudo *é* o produto — e enviaria o conteúdo integral do currículo (nome, telefone, histórico profissional) para fora, agravando a transferência internacional não declarada do P2-6.

### Cache de prompt não utilizado

O `SYSTEM_ANALYZE_PROMPT` tem 5.057 caracteres **idênticos em toda requisição**, e nenhum provedor está com cache de prompt ativado. O Kimi cobraria $0,30/1M em vez de $3 na porção cacheada; o Claude cobra ~10% do preço de entrada. É economia disponível e não capturada, independente do modelo escolhido.

---

## 4. Consistência do Plano de Entrada

`credits-catalog.ts:48` descreve o Plano de Entrada (R$ 9,90 / 40 créditos) como *"suficiente para 2 avaliações completas de currículo"*.

Somando o `CREDIT_COSTS` para um ciclo efetivamente completo:

```
análise 20 + reescrita 10 + download do laudo 1 + download do currículo 1 = 32 créditos
```

Portanto **40 créditos compram um ciclo completo, sobrando 8** — insuficientes para uma segunda análise (20). As "2 avaliações" só existem se o usuário fizer duas análises **secas**: sem reescrita e sem nenhum download.

Isso é uma promessa de embalagem que o produto não cumpre, e o usuário descobre quando o saldo trava em 8 créditos. Duas saídas possíveis, ambas decisão de negócio:

- ajustar a descrição do pacote para refletir o que 40 créditos realmente compram; ou
- elevar o Plano de Entrada para ~64 créditos, que é o necessário para dois ciclos completos.

---

## 5. Margem sobre a venda de R$ 9,90

| Cenário de consumo | Opus 5 | Sonnet 5 |
|---|---|---|
| 1 ciclo completo (currículo típico) | R$ 8,28 · **84%** | R$ 8,61 · **87%** |
| 2 análises secas | R$ 7,95 · **80%** | R$ 8,41 · **85%** |
| 1 ciclo longo + orientação vocacional | R$ 7,18 · **73%** | R$ 7,95 · **80%** |

Descontando taxa de gateway estimada em 3,99% + R$ 0,39 = R$ 0,79. **Essa é a maior incerteza destes números** — a taxa real do Stripe precisa ser confirmada, porque num ticket de R$ 9,90 ela pesa cerca de 8%.

### Custos não precificados

- **Orientação vocacional é gratuita.** `career-orientation/route.ts` não tem nenhuma chamada a `deductCredits`, mas usa `taskType: 'full_analysis'` — ou seja, roda no modelo mais caro. Custa R$ 0,49 (Opus 5) ou R$ 0,30 (Sonnet 5) por uso, sem receita associada. Pode ser intencional como isca de conversão; se for, vale registrar como tal.
- **Downloads saem de graça abaixo de 1 crédito.** `download/route.ts:28` só cobra `if ((user.credits || 0) >= costCredits)` — exatamente no fim do pacote, quando o usuário mais baixa arquivos.

### Fora do escopo desta análise

Não é possível fechar o custo total sem dados de infraestrutura:

- taxa real do gateway de pagamento;
- plano do Vercel — invocações e tempo de função (com Opus 5 cada análise ocupa uma função por até 60 s, o que pesa bem mais que com Sonnet 5);
- plano do Supabase — armazenamento de currículos, logs e `WebhookEvent`.

---

## 6. Três números de custo incompatíveis no projeto

Este é o achado mais acionável desta análise. Existem hoje **três** valores diferentes para o custo por ciclo, e nenhum deles é o real:

| Fonte | Valor por ciclo | Erro vs. real (Opus 5) |
|---|---|---|
| README, seção "Modelo de negócio" | $0,0050 | **31× menor** |
| `llm.ts:47` → `/api/pricing` (rota pública) | $0,0684 | 2,3× menor |
| **Real, medido** | **$0,1540** | — |

E a causa raiz do erro no painel administrativo:

**`registry.ts:23-24` declara o Opus 5 a $15/$75 por 1M de tokens. O preço real é $5/$25.**

Como `router.ts:139-141` calcula `costUsd` a partir dessa tabela e grava em `AiLog.costUsd`, **todo o custo e o lucro estimado do painel admin estão inflados em 3×**. Somado ao P1-7 da auditoria (valores em USD/EUR gravados como BRL sem conversão), o dashboard financeiro não é confiável em nenhuma direção.

Correções:

1. `registry.ts:23-24` — corrigir para `inputPer1k: 0.005` / `outputPer1k: 0.025`.
2. `llm.ts:47` — o `TOKEN_COST` alimenta `/api/pricing`, que é **rota pública**, com números que não correspondem ao roteamento real. Deve derivar do `registry.ts` ou ser removido junto com o resto do código morto de `llm.ts` (P3-5).
3. README — atualizar a tabela de custos e margens.
4. Recalcular ou marcar como suspeitos os registros históricos de `AiLog.costUsd`.

---

## 7. Recomendação

**Curto prazo — `claude-sonnet-5` como modelo primário de `full_analysis` e `rewrite`.** Não pelo custo (a diferença é de 3 a 7 pontos de margem), mas porque o Opus 5 não termina dentro do teto de 60 s e hoje entrega timeout ou laudo fabricado. É uma linha em `registry.ts:19`.

**Manter `support_chat` e as tarefas mecânicas no DeepSeek.** Já é o mais barato por larga margem e não há evidência de problema de qualidade.

**Kimi K3 como fallback, não como primário.** Mesmo preço do Sonnet 5, provedor independente — útil se a Anthropic ficar indisponível. Mas `temperature: 1` forçado o torna inadequado para gerar uma nota reproduzível.

**Médio prazo — o custo não impede o Opus 5.** A R$ 0,83 por ciclo sobre uma venda de R$ 9,90, o Opus 5 é perfeitamente pagável. O que impede é a arquitetura. Com streaming ou fila (Fase 3 do plano em `AUDITORIA.md`), o teto de 60 s desaparece e o Opus 5 passa a ser uma escolha de qualidade legítima, não um risco operacional.

**Antes de qualquer troca, meça.** Estes números são de custo, não de qualidade. Rode os mesmos 10 currículos reais em cada candidato e compare os laudos lado a lado — especialmente `targetedChanges` e as `rationale`, onde a diferença entre modelos aparece. Rode o mesmo currículo 3× em cada um para medir a variância das notas. A tabela `AiLog` já registra `responseTimeMs`, `usedModel` e `tokensOut` para sustentar essa comparação.
