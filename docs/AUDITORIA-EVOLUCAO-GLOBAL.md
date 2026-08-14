# Auditoria e Plano — Evolução Global do GriffoWork

**Data:** 2026-08-14
**Base:** commit `219f8de`
**Origem:** Prompt Mestre de Evolução do Produto (43 seções, 10 etapas)

> O prompt mestre manda usar **o código real como fonte definitiva**, não a
> documentação. Esta auditoria foi feita lendo o código. Onde a documentação
> anterior (`MAPA-DO-PRODUTO.md`, citado no prompt) divergir, vale o que está
> aqui — aquele arquivo não existe neste repositório.

---

## 1. O que foi encontrado

### 1.1 Conteúdo inventado apresentado como diagnóstico do usuário — **crítico**

`components/app/analysis-view.tsx` continha quatro fabricações que a tela
mostrava com a mesma tipografia e no mesmo lugar do resultado real:

| Fabricação | Onde | O que a pessoa via |
|---|---|---|
| Oito dimensões com nota **7,0** fixa e justificativas genéricas | `parseDimensions`, retorno final | Um laudo completo, com selo verde, que ninguém mediu |
| Nota **7,0** para qualquer dimensão sem número | `parseDimensions` | Uma nota inventada indistinguível de uma medida |
| Nota geral **70 → 7,0** quando o laudo não tinha nota | `numOverall` | "Bom", com anel colorido |
| Dois `targetedChanges` de exemplo | `defaultTargetedChanges` | Trechos fictícios (*"Responsável pelo acompanhamento diário das atividades"*) atribuídos ao currículo dela |
| `strengths`/`weaknesses`/`recommendations` de reserva | objeto `a` | Pontos fortes que a análise nunca apontou |
| `atsFriendly ?? true` | objeto `a` | Atestado de compatibilidade com ATS que a análise não emitiu |

Este é o defeito mais caro que um produto de inteligência de carreira pode ter:
a pessoa pagou por um diagnóstico do currículo dela e recebia um número
inventado. **Corrigido** — ver seção 2.1.

### 1.2 Duas das nove entregas vendidas não existiam no código

O produto anuncia nove entregas na landing (pt/en/es), no checkout, na descrição
do produto na Stripe e na base de conhecimento do suporte.

| Item vendido | Situação encontrada |
|---|---|
| Carta de Apresentação | `cover_letter` existia como `TaskType`, tinha provedor primário declarado em `ai-router/registry.ts` e custo orçado por análise — **e nenhuma rota que o produzisse** |
| Resumo Profissional | Existia **apenas** no catálogo e na landing. Sem tipo de tarefa, sem rota, sem prompt |
| Otimização de Perfil (LinkedIn/Gupy) | Contado duas vezes: é exatamente o que `social_analysis` já entrega (`headline`, `aboutSummary`, `tips` por perfil, em `lib/social/analysis.ts`) |
| Trechos a ajustar no currículo | **Produzido de verdade** pelo segmento `targeted_changes` e **anunciado em lugar nenhum** |

Uma compra entregava sete dos nove itens vendidos. **Corrigido** — ver 2.3 e 2.4.

### 1.3 O Brasil estava codificado como padrão estrutural

`lib/i18n/server.ts` resolvia o contexto de mercado por
`ATS_BY_MARKET[lang]` — uma tabela indexada pelo **idioma da interface**.

Isso confunde três eixos que o prompt mestre manda separar (§32, §33):

```
idioma da interface  ≠  idioma do currículo  ≠  mercado profissional
```

No caso mais comum de um produto global — pessoa no Brasil, tela em português,
mirando vaga nos Estados Unidos — o produto devolvia recomendação de
palavra-chave otimizada para a **Gupy** a quem será triado pelo **Workday**. Não
é inútil: é conselho errado, que piora a triagem. O mesmo valia para a reescrita
(formato de currículo), a orientação (nomenclatura de cargo) e a presença
digital (plataformas). **Corrigido** — ver 2.2.

### 1.4 Promessa de contratação na interface

Dois textos transformavam leitura de currículo em previsão de resultado de
processo seletivo, contra §17:

- *"as 3 áreas/cargos do mercado em que você tem **maior chance imediata de contratação**"*
- `{matchPercentage}% Match` exibido sem dizer o que mede

**Corrigido** — ver 2.5. A reestruturação do matching em três eixos
(profissional / vaga / contextual), que §9 pede, é Etapa 6 e **não** foi feita.

### 1.5 Código morto

`lib/llm.ts` (13 KB, prompts completos de análise e reescrita) não era importado
por arquivo nenhum — o caminho real passa por `lib/analysis/segments.ts` desde a
divisão da análise em segmentos. Ele continha a maior concentração de "Gupy"
hardcoded do repositório, o que o tornava uma armadilha para quem fosse corrigir
o item 1.3 pelo grep. **Removido.**

### 1.6 Falta de validação por tipo de tarefa

`agents/quality-agent.ts` valida `full_analysis`, `analysis_segment`,
`career_orientation` e `rewrite`. Todo tipo novo caía no `return { approved:
true, score: 8.5 }` do fim — aprovação incondicional. §35 exige regra própria por
tipo. **Corrigido para `cover_letter`**; os tipos futuros (`job_matching`,
`job_intelligence`) precisarão da sua.

### 1.7 Observações que **não** viraram alteração

- **`paymentCountry` está correto hoje.** É usado só para preço
  (`lib/pricing/resolve.ts`) e nunca como localização profissional. A regra de
  §7 já era respeitada; o Market Adapter a torna explícita, recusando
  `paymentCountry` como entrada.
- **Residência de dados está implementada** (`lib/data-residency.ts`) e cobre
  §25: DeepSeek e Kimi são removidos da cadeia para usuários do EEE.
- **4 erros de lint pré-existentes** em `analysis-view.tsx`
  (`react-hooks/immutability`: um `useState` usado como `ref` mutável). Existem
  antes destas alterações e não foram introduzidos por elas. Corrigi-los é
  mexer na gestão de estado da tela — fora do escopo desta etapa, registrado
  aqui para não se perder.
- **Não há migrações versionadas** (`prisma/migrations/` não existe; o fluxo é
  `prisma db push`). A coluna nova desta etapa é anulável e aditiva, então o
  `db push` é seguro. Para as etapas seguintes, que mexem em relacionamentos,
  migrações versionadas passam a ser necessárias.

---

## 2. O que foi executado nesta etapa

### 2.1 Fim dos fallbacks inventados (§6)

`analysis-view.tsx` passa a distinguir **ausência** de **valor**:

- `parseDimensions` descarta dimensão sem nota utilizável e devolve lista vazia
  quando não há nenhuma — nunca uma lista de reserva.
- A nota geral é `number | null`. Sem dimensão medida não há nota, e a tela
  mostra `—` com o rótulo "Não avaliado" em vez de um `7,0` inventado.
- `atsFriendly` virou `boolean | null`: `undefined` significa "não avaliado",
  não "passa no ATS".
- Parecer executivo, pontos fortes, fragilidades, recomendações e trechos a
  ajustar: sem reserva. Cada ausência tem seu aviso, e o aviso diz o que fazer
  (reprocessar não custa nada, porque o currículo continua destravado).
- O gráfico de radar e o painel de cálculo somem quando não há o que
  representar, em vez de desenhar um octógono de setes.

### 2.2 Market Adapter (§2, §10, §32, §33) — fundação da Etapa 3

Novo módulo `lib/market/`, client-safe (sem Prisma, sem `server-only`), com 12
mercados declarados — BR, PT, US, CA, GB, ES, MX, DE, FR, IN, AU, JP — mais
`GLOBAL_MARKET`, que é também o mercado do trabalho remoto internacional.

Cada mercado declara ATS, fontes de vagas, plataformas de presença, convenções
de currículo (foto, páginas, dados pessoais), tipos de contrato, idioma
predominante das vagas e moeda de salário.

A resolução tem ordem deliberada, e **`paymentCountry` não entra em nenhuma
posição**:

```
alvo profissional declarado  >  país de residência  >  idioma da interface  >  GLOBAL
```

O idioma vem por último porque é o sinal que mais engana. País desconhecido cai
em `GLOBAL`, **não no Brasil**: o Brasil é um mercado entre os outros.

Ligado a quatro caminhos de IA: análise (`lib/analysis/job.ts` →
`segments.ts`), reescrita, orientação profissional e presença digital. Nenhum
prompt escreve mais o nome de um ATS diretamente.

Acrescentar um mercado é acrescentar uma entrada em `MARKETS` — nenhum outro
arquivo muda.

### 2.3 Carta de apresentação e resumo profissional (§5)

Nova rota `POST /api/resume/cover-letter`, com:

- prompt com regras de honestidade explícitas (não inventar empregador, cargo,
  período, número, nem nome de empresa contratante);
- contexto de mercado injetado — convenção de candidatura é local;
- **validação própria** (§35), em dois lugares: no `parse` da rota e em
  `quality-agent.ts`. Além de tamanho mínimo, recusa texto com espaço reservado
  não preenchido (`[empresa]`), que é rascunho entregue como produto;
- persistência em `Resume.coverLetterJson` (coluna nova, anulável, aditiva);
- aba própria na tela, com os dois textos, os termos da vaga incorporados e
  botão de cópia por artefato;
- nada é cobrado: como toda rota derivada, só pergunta se o currículo está
  destravado.

Os dois artefatos saem de **uma** chamada — derivam do mesmo par (currículo,
vaga alvo), e separá-los dobraria custo e tempo para produzir duas leituras do
mesmo material que ainda poderiam divergir entre si.

O resumo aqui é o **do topo do currículo**, direcionado à vaga. Não se confunde
com o texto "Sobre" que a presença digital gera por perfil — aquele é escrito
para o algoritmo do LinkedIn, este para o recrutador humano. A distinção está
dita na própria tela.

### 2.4 Catálogo coerente (§5, §43)

`ANALYSIS_DELIVERABLES` continua com nove itens, agora todos reais e nenhum
repetido:

- **saiu** `profile_optimization` — era `social_analysis` contado duas vezes;
- **entrou** `targeted_changes` — real desde sempre, anunciado nunca.

Novo `DELIVERABLE_PRODUCERS` mapeia cada entrega ao arquivo que a produz, e
`catalog.test.ts` verifica os dois sentidos: nenhuma entrega sem produtor,
nenhum produtor órfão. A promessa comercial passa a ser conferível contra o
código, não apenas lida.

Alinhados à mesma lista: landing nos três idiomas, checkout, script de setup da
Stripe, painel do usuário e a base de conhecimento do suporte — que agora também
descreve a comparação com a vaga, os trechos a ajustar, a orientação e a carta,
e diz explicitamente que a otimização de perfil **é** a análise de presença
digital, não um produto à parte.

### 2.5 Sem promessa de contratação (§17)

- *"maior chance imediata de contratação"* → *"maior aderência ao que você já
  construiu"*.
- `% Match` → `% aderência`, exibido só quando existe, com uma linha embaixo
  dizendo o que mede e o que **não** mede: *"Não é probabilidade de contratação
  nem medição do mercado de trabalho."*

### 2.6 Testes

| Arquivo | Testes | Cobre |
|---|---|---|
| `lib/market/market.test.ts` | 12 (novo) | Resolução de mercado, precedência, país desconhecido → GLOBAL, o caso pt-BR→US que motivou a camada, moeda de salário ≠ moeda de cobrança |
| `lib/pricing/catalog.test.ts` | +4 | Nove entregas, sem duplicata, toda entrega com produtor, nenhum produtor órfão |

**107 testes passando.** `tsc --noEmit` limpo.

---

## 3. O que **não** foi feito — e por quê

O prompt mestre é explícito: *"Não tente implementar tudo de uma vez"*. Esta
etapa cobre a **Etapa 1 (auditoria e estabilização)** por inteiro e a **fundação
da Etapa 3 (Market Adapter)**. O resto está mapeado abaixo, não implementado.

| Etapa | Situação | Primeiro passo concreto |
|---|---|---|
| **1 — Auditoria e estabilização** | ✅ Feita | — |
| **2 — Professional Profile** (§7, §8) | ⬜ Não iniciada | Modelo `ProfessionalProfile` no Prisma com identidade, objetivos, preferências e **mobilidade separada da residência**; `targetCountry` daí passa a alimentar `resolveMarket`, que já o aceita |
| **3 — Market Adapter** (§2, §10) | 🟡 Fundação pronta | Falta `MarketRules` por vínculo, `SalaryContext` e taxonomia profissional (`Analista de Dados` ↔ `Data Analyst` ↔ `Datenanalyst`) |
| **4 — Job Intelligence** (§13, §14) | ⬜ Não iniciada | Modelo `Job` normalizado com os campos de §13, suportando *desconhecido* / *não informado* / *não aplicável*; deduplicação por `company + sourceJobId` com fallback por similaridade |
| **5 — Job Sources** (§11, §12) | ⬜ Não iniciada | Interface `JobSourceAdapter` + o primeiro adapter. **Regra crítica de §12:** lista vazia com HTTP 200 **nunca** fecha vagas — gravar `collectionStatus`, `collectionError`, `lastSuccessfulCollection` e exigir evidência para encerrar |
| **6 — Matching** (§9, §16) | ⬜ Não iniciada | Filtro duro antes da IA; separar compatibilidade profissional / com a vaga / contextual; lacunas e evidências. Aposenta o `matchPercentage` como número único |
| **7 — Radar** (§15, §22, §23) | ⬜ Não iniciada | Cron + fila + leases + idempotência. **Silêncio por padrão**: sem oportunidade relevante, sem alerta |
| **8 — Ação** (§18, §19, §20) | ⬜ Não iniciada | Job Fit; currículo direcionado à vaga. A rota de carta desta etapa já é metade do caminho — falta recebê-la a partir de uma vaga do Radar, e não só da vaga alvo digitada |
| **9 — Assinatura** (§21) | ⬜ Não iniciada | Só depois do Radar provar valor. Compra única continua funcionando |
| **10 — Escala global** (§34) | ⬜ Não iniciada | Novos mercados são entradas em `MARKETS`; painel administrativo por mercado/fonte/adapter |

### Pendências que não são código

- **Cache de Job Intelligence** (§27): separar inteligência da vaga (uma vez por
  vaga) de compatibilidade com o usuário (uma vez por par vaga×usuário). Decide
  o custo do Radar antes de a primeira linha ser escrita — vale desenhar na
  Etapa 4, não depois.
- **Jurídico** (§24): representante na UE (GDPR Art. 27), registro de
  tratamento, cláusulas contratuais padrão. Já pendente desde
  `PLANO-GLOBAL.md`. Quando houver dúvida jurídica, registrar a necessidade de
  validação — não inventar regra.
- **Migrações versionadas**: adotar antes da Etapa 2, que mexe em
  relacionamentos.

---

## 4. Regras herdadas do prompt mestre que valem para todo trabalho futuro

1. Nunca mostrar conteúdo inventado como se fosse produzido pela análise da
   pessoa. Ausência se informa, não se preenche.
2. Nunca anunciar funcionalidade sem verificar o código que a produz.
3. Nunca tratar um país como arquitetura global.
4. Nunca confundir país de pagamento com mercado profissional.
5. Nunca transformar estimativa de IA em promessa de contratação.
6. Nunca enviar notificação inútil — silêncio por padrão.
7. Nunca sacrificar segurança por velocidade.
8. Coleta que volta vazia é falha até prova em contrário, nunca vaga encerrada.
