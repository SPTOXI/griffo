# Análise de Custos, Margem e Seleção de Modelo

**Data:** 2026-08-09
**Escopo:** custo real de IA por módulo e por ciclo, mapa de responsabilidade dos modelos, infraestrutura, e consistência do pacote de créditos
**Commit analisado:** `8eb051a`
**Método:** rastreamento de todas as chamadas a `executeAiTask` no código, medição dos prompts em caracteres, e preços de tabela dos provedores verificados na fonte.

---

## Resumo

O custo de IA por ciclo completo está entre **R$ 0,50 e R$ 1,44**, dependendo do modelo e do tamanho do currículo. Sobre a venda de R$ 9,90 do Plano de Entrada, a margem bruta fica entre **73% e 87%** — confortável em qualquer cenário.

**Custo nunca foi o argumento decisivo entre Opus 5 e Sonnet 5** — a diferença é de 3 a 7 pontos de margem. O argumento real contra o Opus 5 é o teto de 60 s da função (ver `RELATORIO-TIMEOUT-ANALISE.md`).

Cinco achados relevantes surgiram na apuração:

1. **O preço do Opus 5 no código está errado em 3×** — o painel administrativo reporta custo e lucro incorretos.
2. **O custo declarado no README subestima o real em ~31×**, e não bate nem com o cálculo do próprio código.
3. **O Plano de Entrada não entrega o que promete** — 40 créditos não compram "2 avaliações completas".
4. **A análise de redes sociais não visita os perfis** — gera conselho genérico a partir da URL.
5. **Dois dos quatro "agentes" do painel não usam IA** — são validação e regex.

---

## 1. Onde a IA é realmente consumida

Rastreando todas as chamadas a `executeAiTask()`, apenas **duas** etapas do fluxo pago custam tokens:

| Etapa | Chamada de IA | Créditos | Custo (Sonnet 5) |
|---|---|---|---|
| Upload + extração de PDF | Não — `pdf-parse` local | — | R$ 0 |
| Limpeza de texto | Não — regex local (`ocr/extractor.ts`) | — | R$ 0 |
| Importação de vaga por link | Não — Jina Reader / `fetch` | — | R$ 0 |
| **Análise 8 dimensões** | **Sim** — `full_analysis` | 20 | R$ 0,39–0,43 |
| **Reescrita** | **Sim** — `rewrite` | 10 | R$ 0,15–1,14 |
| Orientação vocacional | **Sim** — reusa `full_analysis` | **0** | R$ 0,30 |
| Geração de PDF / MD / TXT | Não — `pdf-lib` local | 1 cada | R$ 0 |
| Chat de suporte | Sim — `support_chat` (DeepSeek) | 0 | R$ 0,008 |

**Entradas mortas no roteamento:** `ocr_extraction` e `normalization` estão declaradas em `INITIAL_TASK_ROUTING` (`registry.ts:71-72`) mas **nunca são chamadas**. Não geram custo, mas sugerem no código um OCR por IA que não existe — a extração é local, e um PDF escaneado sem camada de texto retorna vazio.

---

## 2. Custo por módulo

Premissas declaradas: câmbio BRL/USD = 5,4. Entradas medidas no código (prompt de análise = 5.057 caracteres ≈ 1.264 tokens; prompt de reescrita = 1.160 caracteres ≈ 290 tokens; prompt de orientação ≈ 250 tokens). Saída da análise perto do teto de 3.800 tokens, porque o schema exige 8 dimensões com justificativa, `jobMatch`, `targetedChanges` e quatro arrays.

### 2.1 Análise — praticamente custo fixo

| Currículo | Opus 5 | Sonnet 5 |
|---|---|---|
| 2.000 caracteres (1 página) | R$ 0,57 | R$ 0,34 |
| 8.000 caracteres (3 páginas) | R$ 0,61 | R$ 0,36 |
| 15.000 caracteres ou mais | R$ 0,65 | R$ 0,39 |

**Não passa de R$ 0,65** por dois motivos estruturais: a entrada é cortada em 15.000 caracteres (`analyze/route.ts:187`) e a saída é fixada em 3.800 tokens pelo schema.

### 2.2 Módulos que rodam dentro da mesma chamada

O `socialAdvice` e o `jobMatch` **não são chamadas separadas** — estão no mesmo prompt da análise. O custo é apenas o incremento de entrada:

| Componente | Opus 5 | Sonnet 5 |
|---|---|---|
| Análise base (currículo 15k) | R$ 0,654 | R$ 0,392 |
| + redes sociais (URLs, ~100 tokens) | R$ 0,657 | R$ 0,394 |
| **+ vaga completa (10.000 chars)** | **R$ 0,724** | **R$ 0,434** |

**Teto real da análise com todos os módulos ativos: R$ 0,72 (Opus) / R$ 0,43 (Sonnet).**

### 2.3 Reescrita — a única sem teto

`rewrite/route.ts:90` envia `resume.originalContent` **inteiro, sem `slice`**, diferente da análise. O upload só valida PDF ≤ 10 MB e conteúdo ≥ 50 caracteres — **não há limite máximo de caracteres**.

| Currículo | Opus 5 | Sonnet 5 |
|---|---|---|
| 4.000 caracteres | R$ 0,25 | R$ 0,15 |
| 15.000 caracteres | R$ 0,92 | R$ 0,55 |
| 60.000 caracteres | R$ 1,49 | R$ 0,90 |
| 120.000 caracteres | R$ 1,90 | R$ 1,14 |

Na prática o teto de 8.000 tokens de saída segura o crescimento, mas a entrada é ilimitada. **Correção de uma linha:** aplicar `.slice(0, 20000)` como a análise já faz. Com isso o ciclo passa a ter teto real de **R$ 1,70 (Opus) / R$ 1,02 (Sonnet)**.

### 2.4 Orientação vocacional

Chamada separada, `maxTokens: 3000`, entrada = `originalContent.slice(0, 12000)`.

| | Opus 5 | Sonnet 5 |
|---|---|---|
| Custo | R$ 0,49 | **R$ 0,30** |
| Créditos cobrados | **0** | 0 |

**Base de dados:** apenas o currículo. Nenhuma fonte externa — sem base de vagas, sem dados de mercado de trabalho, sem pesquisa. É o conhecimento próprio do modelo aplicado ao CV.

---

## 3. Custo por ciclo completo

| Cenário | **Opus 5** | **Sonnet 5** |
|---|---|---|
| Currículo típico (4.000 chars) | R$ 0,832 | R$ 0,499 |
| Currículo longo (15.000 chars) | R$ 1,439 | R$ 0,864 |
| Currículo de 30 páginas (120.000 chars) | R$ 2,55 | R$ 1,53 |
| **Com `slice` na reescrita (teto proposto)** | **R$ 1,70** | **R$ 1,02** |

---

## 4. Mapa de responsabilidade das IAs

| Função | IA responsável | Custo por execução |
|---|---|---|
| Análise 8 dimensões + redes + vaga | **Claude Opus 5** | R$ 0,72 |
| Reescrita | **Claude Opus 5** | R$ 0,25–1,90 |
| Orientação vocacional | **Claude Opus 5** (reusa `full_analysis`) | R$ 0,49 |
| Chat de suporte | **DeepSeek** | R$ 0,008 |
| Boletim do Coordenador (admin) | **Claude Opus 5** | R$ 0,074 |
| Importar vaga | **nenhuma** — Jina Reader | R$ 0 |
| Extração de PDF | **nenhuma** — `pdf-parse` local | R$ 0 |

### Os "4 agentes" do painel — o que cada um é de fato

| Agente | Realidade verificada no código |
|---|---|
| **1 — Suporte & Atendimento** | IA real: DeepSeek, R$ 0,008 por conversa |
| **2 — Auto-Diagnóstico & Reparo** | **Não analisa nada com IA.** Envia `"Ping"` com `max_tokens: 5-10` para 3 provedores só para ver se respondem, testa o banco com `user.count()`, e monta um texto fixo. Custo: ~R$ 0,0002 |
| **3 — Qualidade & Auditoria** | **JavaScript puro** (`quality-agent.ts`) — valida JSON, conta caracteres, checa se as `rationale` têm ≥ 15 chars. Zero IA, zero custo |
| **4 — Economia & OCR** | **Regex puro** (`ocr/extractor.ts`) — remove caracteres de controle, espaços duplos, rodapés de paginação. Zero IA, zero custo. E o "OCR" não existe |

Do ponto de vista de custo isso é ótimo: o "enxame" é quase todo determinístico. Do ponto de vista de comunicação, a tela do admin descreve os agentes 3 e 4 como se avaliassem qualidade e economizassem tokens por inteligência, quando são validação e regex.

---

## 5. Comparação entre provedores

Custo da análise isolada (2.464 tokens de entrada / 3.800 de saída, currículo típico):

| Modelo | $/1M in | $/1M out | BRL | Adequação a esta tarefa |
|---|---|---|---|---|
| **Opus 5** (atual) | 5 | 25 | R$ 0,580 | Melhor qualidade; **não cabe em 60 s** |
| **Sonnet 5** | 3 | 15 | R$ 0,348 | 1,8 s medidos; structured outputs |
| **Kimi K3** | 3 | 15 | R$ 0,348 | Ver ressalvas abaixo |
| **Haiku 4.5** | 1 | 5 | R$ 0,116 | Mais fraco em escrita avaliativa |
| **DeepSeek V4-Flash** | 0,14 | 0,28 | R$ 0,010 | Adequado a tarefas mecânicas |

> ⚠️ **A tabela de preços do código está desatualizada em dois provedores.** `registry.ts:33-35` declara `deepseek-chat` a $0,27/$1,10; os modelos atuais são V4-Flash ($0,14/$0,28) e V4-Pro ($0,435/$0,87). E `registry.ts:158` reescreve silenciosamente qualquer modelo com "v4" no nome de volta para `deepseek-chat` — o mesmo anti-padrão do Claude em `registry.ts:155`.

> 📌 **Atualização de 14/08/2026 — o DeepSeek divulgou o aumento.** A tabela acima
> é a que vale até **16/08/2026 16:00 UTC**. Depois disso o preço passa a variar
> com a hora, e a linha do V4-Flash sai de $0,14/$0,28 para:
>
> | Modelo | $/1M in (miss) | $/1M out | $/1M in (hit) |
> |---|---|---|---|
> | V4-Flash fora de pico | 0,22 | 0,66 | 0,007 |
> | V4-Flash em pico | 0,44 | 1,32 | 0,014 |
> | V4-Pro fora de pico | 0,66 | 1,98 | 0,022 |
> | V4-Pro em pico | 1,32 | 3,96 | 0,044 |
>
> Pico é **01:00–04:00 e 06:00–10:00 UTC**; todo o resto do dia é fora de pico.
> Fora de pico o V4-Flash custa 1,6x a entrada e 2,4x a saída de hoje; no pico,
> 3,1x e 4,7x. A prévia gratuita passa de US$ 0,0017 para US$ 0,0011 fora de
> pico e US$ 0,0022 no pico — a comparação com o número antigo é enganosa,
> porque US$ 0,0017 foi calculado com o preço de `deepseek-chat` que já estava
> desatualizado no código.
>
> O código agora resolve o preço no instante da chamada
> (`registry.ts:resolveModelPricing`), então o painel administrativo acompanha a
> variação sem edição manual.

### Ressalvas do Kimi K3

Mesmo preço do Sonnet 5, mas com dois problemas estruturais para um laudo pontuado:

- **`temperature` forçado em 1** (`router.ts:114`, via `isReasoningModel`). Para uma avaliação com nota de 0 a 10, o mesmo currículo pode receber notas diferentes a cada execução. Um candidato que reenvia o CV e vê a nota mudar sem alterar nada perde a confiança no laudo.
- **Tokens de raciocínio consomem o orçamento de saída.** Com `maxTokens: 3800` e um schema que exige perto disso em JSON, o raciocínio corta o JSON no meio. Isso explica o `tryParseAndRepairJson` de `analyze/route.ts:191` — a assinatura clássica de saída truncada.

Histórico: cinco commits brigando com a integração (`e510e87`, `a09d40a`, `c370895`, `3cec7be`, `2aefa6d`), incluindo um cujo título é *"eliminate Kimi 404 and Vercel 60s timeout"*.

### Ressalvas do DeepSeek

Mais barato por larga margem e adequado ao que faz hoje. Três ressalvas para ampliar o uso:

- **Aumento confirmado em 13/08/2026, em vigor a partir de 16/08/2026 16:00 UTC** (anunciado sem números em 06/08). O pico **2×** vale em **01:00–04:00 e 06:00–10:00 UTC** = **22:00–01:00 e 03:00–07:00 BRT** — fora do horário comercial brasileiro. O fuso favorece: na prática a operação paga a faixa fora de pico. Valores no quadro da seção 5.
- **`deepseek-chat` foi retirado em 24/07/2026 15:59 UTC.** Era o `defaultModel` do provedor no código até 14/08/2026 — ou seja, toda chamada ao DeepSeek sem modelo configurado no painel batia num ID inexistente e caía para o suplente. Hoje o padrão é `deepseek-v4-flash`.
- **Qualidade em português e espanhol** é inferior à do inglês — relevante com a operação global.
- **Transferência internacional**: enviar currículos para provedor na China sem decisão de adequação é problema concreto de GDPR (ver `PLANO-GLOBAL.md`).

### Cache de prompt não utilizado

O `SYSTEM_ANALYZE_PROMPT` tem 5.057 caracteres **idênticos em toda requisição**, e nenhum provedor está com cache de prompt ativado. O Claude cobra ~10% do preço de entrada na porção cacheada. Economia disponível e não capturada, independente do modelo.

---

## 6. Consistência do Plano de Entrada

`credits-catalog.ts:48` descreve o Plano de Entrada (R$ 9,90 / 40 créditos) como *"suficiente para 2 avaliações completas de currículo"*.

Somando o `CREDIT_COSTS` para um ciclo efetivamente completo:

```
análise 20 + reescrita 10 + download do laudo 1 + download do currículo 1 = 32 créditos
```

**40 créditos compram um ciclo completo, sobrando 8** — insuficientes para uma segunda análise (20). As "2 avaliações" só existem se o usuário fizer duas análises **secas**: sem reescrita e sem nenhum download.

Duas saídas, ambas decisão de negócio: ajustar a descrição, ou elevar o pacote para ~64 créditos.

---

## 7. Infraestrutura e margem por volume

### Custos fixos futuros

| Item | Custo | O que inclui |
|---|---|---|
| Vercel Pro | $20/mês por assento | ~1.000 GB-horas de função, +$20 de crédito de uso |
| Supabase Pro | $25/mês | 8 GB de banco, $10 de crédito de compute, 250 GB de egress |
| **Total** | **$45/mês ≈ R$ 243/mês** | |

### Custo variável por venda (R$ 9,90)

| Item | Sonnet 5 | Opus 5 |
|---|---|---|
| Gateway de pagamento¹ | R$ 0,79 | R$ 0,79 |
| IA (análise + reescrita) | R$ 0,50 | R$ 0,83 |
| **Margem de contribuição** | **R$ 8,62 (87%)** | **R$ 8,28 (84%)** |

¹ Estimado em 3,99% + R$ 0,39. **A taxa real do gateway é a maior incerteza destes números.**

### Margem bruta por volume

| Vendas/mês | Infra por venda | **Sonnet 5** | **Opus 5** |
|---|---|---|---|
| 30 | R$ 8,10 | R$ 0,52 · **5%** | R$ 0,18 · **2%** |
| 50 | R$ 4,86 | R$ 3,76 · **38%** | R$ 3,42 · **35%** |
| 100 | R$ 2,43 | R$ 6,19 · **62%** | R$ 5,85 · **59%** |
| 250 | R$ 0,97 | R$ 7,64 · **77%** | R$ 7,31 · **74%** |
| 500 | R$ 0,49 | R$ 8,13 · **82%** | R$ 7,80 · **79%** |
| 1.000 | R$ 0,24 | R$ 8,37 · **85%** | R$ 8,04 · **81%** |
| 2.500 | R$ 0,10 | R$ 8,52 · **86%** | R$ 8,19 · **83%** |

**Break-even da infraestrutura: 29 vendas/mês** (Sonnet) ou **30** (Opus). A partir de ~250 vendas/mês a infra vira ruído e a margem converge para os 84–87% da contribuição.

### Tempo de função não é gargalo

| Modelo | Duração | GB-h por análise | Cabe nas 1.000 GB-h incluídas |
|---|---|---|---|
| Sonnet 5 | ~5 s | 0,0024 | ~423.000 análises/mês |
| Opus 5 | ~60 s | 0,0283 | ~35.000 análises/mês |

O Opus consome 12× mais tempo de função, mas 35.000 análises/mês está muito além da escala prevista. **Na prática o Opus não custa mais em infraestrutura**, só em tokens.

### Fora do escopo desta análise

Margem **bruta** exclui, por definição: impostos (Simples Nacional Anexo III começa em ~6% sobre faturamento; IVA na UE e sales tax nos EUA — ver `PLANO-GLOBAL.md`), domínio, e-mail transacional, monitoramento e tempo de trabalho.

### Custos não precificados no produto

- **Orientação vocacional é gratuita** — R$ 0,30 (Sonnet) por uso, sem receita associada.
- **Downloads saem de graça abaixo de 1 crédito** — `download/route.ts:28` só cobra `if ((user.credits || 0) >= costCredits)`, exatamente no fim do pacote.

---

## 8. Três números de custo incompatíveis no projeto

Existem hoje **três** valores diferentes para o custo por ciclo, e nenhum é o real:

| Fonte | Valor por ciclo | Erro vs. real (Opus 5) |
|---|---|---|
| README, seção "Modelo de negócio" | $0,0050 | **31× menor** |
| `llm.ts:47` → `/api/pricing` (rota pública) | $0,0684 | 2,3× menor |
| **Real, medido** | **$0,1540** | — |

E a causa raiz do erro no painel administrativo:

**`registry.ts:23-24` declara o Opus 5 a $15/$75 por 1M de tokens. O preço real é $5/$25.**

Como `router.ts:139-141` calcula `costUsd` a partir dessa tabela e grava em `AiLog.costUsd`, e `admin/dashboard/route.ts:100-106` soma esse campo, **todo o custo de IA e o lucro do painel estão inflados em 3×**. Somado ao P1-7 (valores em USD/EUR gravados como BRL), o dashboard financeiro está errado nas duas pontas.

---

## 9. Recomendação

**Curto prazo — `claude-sonnet-5` como modelo primário de `full_analysis` e `rewrite`.** Não pelo custo (3 a 7 pontos de margem), mas porque o Opus 5 não termina dentro do teto de 60 s e hoje entrega timeout ou laudo fabricado. É uma linha em `registry.ts:19`.

**Manter `support_chat` no DeepSeek**, mas não construir nada no caminho da requisição paga que dependa dele — aumento anunciado, instabilidade admitida e preço variável por horário.

**Kimi K3 como fallback, não como primário.** Mesmo preço do Sonnet 5, provedor independente, útil em indisponibilidade da Anthropic. Mas `temperature: 1` forçado o torna inadequado para gerar nota reproduzível.

**Médio prazo — o custo não impede o Opus 5.** A R$ 0,83 por ciclo sobre venda de R$ 9,90, o Opus 5 é perfeitamente pagável. O que impede é a arquitetura. Com streaming ou fila, o teto de 60 s desaparece e o Opus 5 passa a ser escolha de qualidade legítima.

**Antes de qualquer troca, meça.** Estes números são de custo, não de qualidade. Rode os mesmos 10 currículos reais em cada candidato e compare os laudos lado a lado — especialmente `targetedChanges` e as `rationale`. Rode o mesmo currículo 3× em cada um para medir a variância das notas. A tabela `AiLog` já registra `responseTimeMs`, `usedModel` e `tokensOut` para sustentar essa comparação.
