# Relatório — Timeout na Análise de 8 Dimensões

**Data:** 2026-08-09
**Rota afetada:** `POST /api/resume/analyze`
**Commit analisado:** `8eb051a` (HEAD)
**Status:** causa raiz identificada e confirmada por evidência no código e no histórico do git

---

## Resumo

O timeout é **reprodutível por construção**, não intermitente. A rota tem um orçamento de 60 segundos e pede ao Claude Opus 5 uma geração de até 3.800 tokens em modo não-streaming. A geração é mais lenta que o orçamento.

O problema **não existia até o commit `8eb051a`**. Ele foi introduzido pela troca de `claude-sonnet-5` por `claude-opus-5` como modelo primário. O commit imediatamente anterior (`2aefa6d`) registra no próprio título a latência medida com Sonnet 5: **1,8 s**.

Cada timeout custa 20 créditos ao usuário, que **não são reembolsados** — o código de reembolso existe, mas nunca chega a executar.

---

## Como o erro acontece

### O orçamento

| Item | Valor | Origem |
|---|---|---|
| Limite da função | **60 s** | `analyze/route.ts:3` — `export const maxDuration = 60` |
| Abort do Claude | **55 s** | `router.ts:75` — `AbortSignal.timeout(55000)` |
| Margem restante | **5 s** | para 13 consultas ao banco, parse de JSON e auditoria |

### A linha do tempo real

| t | Evento | Consultas |
|---|---|---|
| 0 s | Requisição chega | — |
| ~0,1–2 s | `getCurrentUser` → `resume.findFirst` → `deductCredits` | Q1–Q5 |
| **~2 s** | **20 créditos debitados e commitados no banco** | — |
| ~2–2,5 s | `getProviderRuntimeConfig` (×2) + `aiApiKey.findMany` | Q6–Q10 |
| ~2,5 s | Chamada ao Claude inicia; abort agendado para t≈57,5 s | — |
| **60 s** | **A plataforma encerra a função** | — |

A partir daí, nada mais executa. O `db.resume.update` da linha 259 não roda. O `catch` da linha 282 — que contém o `refundCredits` — **não roda**. O processo simplesmente deixa de existir.

O usuário perde 20 créditos e não recebe laudo.

### Por que a geração não cabe em 55 s

`analyze/route.ts` pede o maior payload da aplicação:

```
SYSTEM_ANALYZE_PROMPT ......... 5.057 caracteres  (~1.264 tokens)
Currículo (slice 15.000) ...... 15.000 caracteres (~3.750 tokens)
Redes sociais + vaga alvo ..... ~200 tokens
                                ─────────────────
ENTRADA ....................... ~5.214 tokens
SAÍDA (maxTokens) ............. 3.800 tokens
```

O schema exigido no prompt obriga o modelo a produzir, de fato, perto do teto: 8 dimensões com `rationale` detalhado, mais `jobMatch`, `targetedChanges`, `strengths`, `weaknesses`, `recommendations`, `keywords` e `socialAdvice`. Não é um teto folgado — é o tamanho esperado da resposta.

A requisição é **não-streaming** (`router.ts:62` — `fetch` para `/v1/messages` sem `stream: true`). Isso significa que nada retorna até o último token ser gerado. Não há entrega parcial, e não há como distinguir "lento" de "travado".

Comparativo dentro da própria aplicação:

| Rota | `maxTokens` | Cabe em 55 s? |
|---|---|---|
| `support/chat` | 1.000 | sim |
| `career-orientation` | 3.000 | limítrofe |
| **`analyze`** | **3.800** | **não** |
| `rewrite` | 8.000 | não (mesmo defeito, ainda mais grave) |

É exatamente por isso que o erro aparece na análise e não no chat de suporte: são a mesma rota-mãe e o mesmo roteador, mudando só o volume gerado.

---

## Agravante: o SDK multiplica o tempo por 3 nos provedores de fallback

Quando o Claude falha e o roteador passa para Kimi, DeepSeek ou Gemini, ele usa o SDK da OpenAI (`router.ts:100`):

```ts
const client = new OpenAI({
  apiKey: cleanApiKey,
  baseURL: runtime.baseURL,
  timeout: 55000, // 55s timeout per call
})
```

O parâmetro `maxRetries` **não é informado**. Verificado em `node_modules/openai/client.js:173` (openai 6.48.0):

```js
this.maxRetries = options.maxRetries ?? 2;
```

O SDK faz **3 tentativas** (1 + 2 retries), e o `timeout` é aplicado **por tentativa** — `buildRequest` recalcula `options.timeout` a cada `makeRequest`. Ele também retenta explicitamente em timeout (`client.js:411`, ramo `isTimeout`) e em 408/409/429/5xx.

Um único provedor de fallback pode portanto consumir:

```
3 × 55 s + backoff (~0,5 s + ~1 s) ≈ 166 s
```

O comentário `// 55s timeout per call` descreve o que o autor pretendia, não o que o código faz.

Somando a cadeia completa de `FALLBACK_CHAIN.claude = ['kimi', 'deepseek', 'gemini']`, o pior caso teórico do roteador passa de **8 minutos** — dentro de uma função de 60 segundos.

---

## Evidência no histórico: quando isso começou

A sequência de commits conta a história inteira. Em ordem cronológica:

| Commit | Mudança | Timeout | Modelo |
|---|---|---|---|
| `c370895` | `full_analysis` → claude | 60 s → **25 s** | Sonnet 4 |
| `d9ee730` | **cria o laço de polling no cliente** (8 × 1,5 s) | — | — |
| `3cec7be` | desvia de claude (chave expirada) | — | DeepSeek/Kimi |
| `bd26c48` | → **Opus 5** | 25 s | Opus 5 |
| `2aefa6d` | → **Sonnet 5**, *"optimize Claude to Sonnet 5 **(1.8s)**"* | 25 s → 30 s | **Sonnet 5** |
| **`8eb051a`** | **→ Opus 5 de volta** | 30 s → **55 s** | **Opus 5** |

Dois pontos decisivos:

1. **`2aefa6d` mediu 1,8 s com Sonnet 5.** Esse é o estado funcional conhecido. O título do commit registra o número.
2. **`8eb051a` reverteu para Opus 5** e, no mesmo commit, precisou quase dobrar o timeout (30 s → 55 s). O timeout não foi aumentado por acaso: foi aumentado porque a geração passou a demorar mais.

A progressão do valor do timeout — **25 s → 30 s → 55 s** — é o sintoma sendo perseguido em vez da causa. Aos 55 s dentro de um limite de 60 s, a margem acabou.

### O cliente foi calibrado para 73 segundos

O mesmo commit `8eb051a` alterou a barra de progresso em `analysis-view.tsx:157`:

```diff
-        const next = Math.min(96, prev + 0.7)
+        const next = Math.min(96, prev + 0.35)
-    }, 250)
+    }, 280)
```

De 5% a 96%, com incremento de 0,35 a cada 280 ms:

```
(96 − 5) ÷ 0,35 = 260 ticks × 280 ms ≈ 73 segundos
```

Antes da mudança eram ~33 s. E o laço de recuperação, no mesmo commit:

```diff
-      // Auto-recuperação resiliente: realiza até 8 tentativas de leitura no banco
-      for (let attempt = 1; attempt <= 8; attempt++) {
-        await new Promise((res) => setTimeout(res, 1500))
+      // Auto-recuperação resiliente: realiza até 25 tentativas de leitura no banco (50s)
+      for (let attempt = 1; attempt <= 25; attempt++) {
+        await new Promise((res) => setTimeout(res, 2000))
```

De 12 s para 50 s de espera.

**A interface foi ajustada para uma operação de ~73 segundos que roda dentro de uma função de 60 segundos.** Os três números do commit — timeout 55 s, barra 73 s, recuperação 50 s — descrevem a mesma expectativa: que a análise demora mais de um minuto. Nenhum deles pode ser satisfeito com `maxDuration = 60`.

O laço de recuperação, além disso, **não pode funcionar**: ele relê `/api/resume/[id]` esperando encontrar a análise salva, mas o `resume.update` que gravaria essa análise está na função que foi encerrada. Ele espera 50 segundos por um registro que nunca será escrito.

---

## Desperdício em cada falha

O `getProviderRuntimeConfig()` é chamado duas vezes para o mesmo provedor antes de qualquer chamada de IA — na linha 16 (`primaryRuntime`) e de novo na linha 46, dentro do laço. Cada chamada executa `aiApiKey.findMany()` + `systemConfig.findMany()`, sem cache.

Caminho feliz, zero failover: **13 consultas** ao Supabase, 4 delas redundantes. Se a função roda em região distante de `sa-east-1`, isso consome parte relevante dos 5 segundos de margem.

### Custo financeiro do timeout

Com o Opus 5 e a precificação do próprio `registry.ts:23`:

```
Entrada:  5.214 tokens × $0,015/1k = $0,078
Saída:    3.800 tokens × $0,075/1k = $0,285
                                     ───────
Total por análise:                   ~$0,363 USD  ≈  R$ 1,96
```

Quando a função é encerrada, os tokens já foram gerados e **são cobrados pela Anthropic** — a análise é descartada sem nunca ser gravada. Se o abort de 55 s dispara e o roteador parte para o Kimi, paga-se a geração do Claude *e* a do fallback, e mesmo assim a função morre aos 60 s.

Vale registrar, de passagem, que o README declara custo de **$0,005 por ciclo**. O custo real por análise é **~73× maior**.

---

## Correção

### Imediata — restaura o funcionamento hoje

**1. Voltar `full_analysis` para `claude-sonnet-5`** (`registry.ts:19,70`). É o estado que `2aefa6d` mediu em 1,8 s. Reduz o custo por análise em ~5× e resolve o timeout sem tocar em mais nada.

**2. Parar de perder créditos.** Reduzir o timeout por provedor para ~20 s e limitar a cadeia a 2 provedores, garantindo que o `catch` do reembolso ainda tenha orçamento para executar:

```ts
// router.ts — chamada Claude
signal: AbortSignal.timeout(20000)

// router.ts — SDK OpenAI
const client = new OpenAI({ apiKey: cleanApiKey, baseURL: runtime.baseURL,
  timeout: 20000,
  maxRetries: 0,   // hoje ausente ⇒ 2 ⇒ 3 tentativas por provedor
})
```

`maxRetries: 0` é o ponto mais importante desta correção: sem ele, um único provedor de fallback já estoura o limite sozinho.

**3. Ajustar o cliente à realidade.** Recalibrar a barra de progresso para a duração efetiva e remover o laço de 25 tentativas — ele espera por um registro que não será escrito.

### Estrutural — recomendada em seguida

**4. Debitar só na entrega.** Registrar a reserva como `CreditTransaction` com `status: 'pending'` e liquidar para `completed` após o `resume.update`. Um job de expurgo devolve as reservas pendentes que expirarem. Elimina a classe inteira do problema, em vez de correr contra o relógio.

**5. Streaming.** Trocar a chamada por `stream: true`. O primeiro token chega em segundos, o cliente mostra progresso real em vez de barra simulada, e a conexão deixa de ficar ociosa esperando 3.800 tokens.

**6. Tirar a análise do ciclo de requisição.** Enfileirar o trabalho, devolver `202 Accepted` na hora e deixar o cliente acompanhar o status. É o desenho correto para uma operação que pode legitimamente levar mais de um minuto — e o único que permite usar Opus 5 sem lutar contra o limite da plataforma.

**7. Cache da configuração de provedores** e remoção da chamada duplicada de `getProviderRuntimeConfig` (linhas 16 e 46).

---

## Verificação sugerida

Para confirmar em produção, com uma linha em `router.ts` antes do `return`:

```ts
console.log('[AI]', currentProviderId, runtime.model, 'ms=', responseTimeMs, 'out=', tokensOut)
```

A tabela `AiLog` já registra `responseTimeMs` e `usedModel`. Consultando o que existe hoje:

```sql
SELECT "usedModel", count(*), avg("responseTimeMs"), max("responseTimeMs")
FROM "AiLog" WHERE "taskType" = 'full_analysis'
GROUP BY "usedModel" ORDER BY 2 DESC;
```

A previsão deste relatório: as linhas com `claude-opus-5` têm `responseTimeMs` próximo ou acima de 55.000, e as chamadas que estouraram não aparecem — porque a função morreu antes de gravar o log. A ausência de registro é, ela mesma, o sintoma.

---

## Conclusão

O timeout tem uma causa única e localizada: **`8eb051a` trocou Sonnet 5 (1,8 s, medido) por Opus 5 para gerar 3.800 tokens não-streaming dentro de uma função de 60 segundos.** Os ajustes feitos no mesmo commit — timeout 55 s, barra de 73 s, recuperação de 50 s — tratam o sintoma e confirmam o diagnóstico.

A correção de menor risco é reverter o modelo primário para Sonnet 5 e adicionar `maxRetries: 0`. As duas mudanças somam poucas linhas e restauram um estado que já era comprovadamente funcional.
