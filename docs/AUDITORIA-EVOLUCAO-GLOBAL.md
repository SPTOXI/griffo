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
- **Lint pré-existente, corrigido** — ver 2.6.
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

### 2.6 Lint pré-existente (`npm run lint` voltou a passar)

O `eslint-config-next` do Next 16 trouxe o conjunto de regras do React Compiler,
e o repositório ficou com 14 erros em 9 arquivos. Nenhum deles foi introduzido
por esta etapa. Divididos em duas famílias, com desfechos opostos:

**`react-hooks/immutability` — 4 erros, todos corrigidos como defeito real.**

- `analysis-view.tsx` guardava `useState<Record<string, boolean>>({})[0]` e
  mutava o objeto por dentro para lembrar quais currículos já haviam disparado
  a análise. Funciona por acidente: o React não garante identidade do valor
  inicial entre renderizações, e a mutação é invisível para ele. Virou
  `useRef`, que é exatamente o que a estrutura é.
- A mesma tela tinha um ciclo entre `loadResume` e `reanalyze`: a carga
  disparava a análise, a análise avisava o fim pelo `onCompleted` do
  `useAnalysisJob`, e o `onCompleted` chamava a carga de novo. Num ciclo não
  existe ordem de declaração possível. A decisão de disparar saiu da carga e
  virou um efeito próprio; `loadResume` voltou a ser só carga.
- `admin-view.tsx`, `downloads-view.tsx` e `rewrite-view.tsx` tinham a variante
  simples do mesmo problema — o efeito declarado acima da função que ele chama.
  Resolvido por reordenação.

**`react-hooks/set-state-in-effect` — 12 pontos, regra desligada.**

É a busca de dados no `useEffect` de montagem, com `setLoading(true)` antes do
primeiro `await`. Aparece em 9 arquivos, incluindo `ui/carousel.tsx` e
`hooks/use-mobile.ts`, que são código de terceiros (shadcn).

Desligada no `eslint.config.mjs`, junto das irmãs que o projeto já havia
desligado (`purity`, `exhaustive-deps`, `react-compiler`), **com a correção real
registrada no próprio comentário**: mover a carga de dados para o React Query,
que já é dependência do projeto e não é usado em nenhuma dessas telas. Um
`eslint-disable` por arquivo espalharia a dívida sem registrá-la; desligar com
justificativa a mantém em um lugar só.

`react-hooks/immutability` **continua ligada** — foi ela que encontrou o defeito
de verdade.

### 2.7 Testes

| Arquivo | Testes | Cobre |
|---|---|---|
| `lib/market/market.test.ts` | 12 (novo) | Resolução de mercado, precedência, país desconhecido → GLOBAL, o caso pt-BR→US que motivou a camada, moeda de salário ≠ moeda de cobrança |
| `lib/pricing/catalog.test.ts` | +4 | Nove entregas, sem duplicata, toda entrega com produtor, nenhum produtor órfão |

**107 testes passando.** `tsc --noEmit` limpo.

---

## 2.8 Etapa 3 concluída — taxonomia profissional (§8)

`lib/market/taxonomy.ts` resolve o exemplo literal do §8: o mesmo candidato é
"Analista de Dados" no Brasil, "Data Analyst" nos Estados Unidos e "Data Analyst
/ Datenanalyst" na Alemanha. Doze conceitos declarados, cada um com rótulo por
mercado e aliases em vários idiomas.

Duas decisões que valem registro:

- **Título desconhecido devolve `null`**, nunca o conceito mais parecido. Forçar
  um desconhecido no vizinho mais próximo é a mesma classe de invenção que a
  Etapa 1 arrancou do laudo.
- **Senioridade desconhecida não elimina ninguém.** `seniorityMeets` devolve
  `true` quando qualquer lado é desconhecido: um filtro duro que descarta por
  falta de informação transforma silêncio em rejeição.

Um teste percorre todos os aliases declarados e falha se algum resolver para
outro conceito — colisão silenciosa aqui viraria cargo errado no matching. Ele
encontrou um defeito real durante a implementação: `staff nurse` perdia o
"staff" na remoção de ruído de senioridade (que existe por causa de "Staff
Engineer") e ficava irreconhecível.

## 2.9 Etapa 4 concluída — Job Intelligence (§13, §14) e a regra do §12

**`JobSource` e `Job`** no schema, com a vaga normalizada nos campos do §13.

**Ausência com motivo.** O §13 exige suportar *desconhecido*, *não informado* e
*não aplicável*. Os três vivem em `Job.unknownFields`, e não colapsam em `null`:
o filtro duro precisa distinguir "não sei o salário" de "a empresa não divulga
salário" para não eliminar uma vaga de quem declarou pretensão mínima.

**Deduplicação (§14)** em três níveis, na ordem que o prompt pede: `company +
sourceJobId`, depois URL canônica (sem parâmetros de rastreamento), e só então
combinação controlada. A composta inclui localização e cargo normalizado de
propósito — dois "Data Analyst" na mesma empresa e cidade para times diferentes
são duas vagas, e agrupá-las esconderia uma oportunidade de forma invisível.

O teste da canonização de empresa encontrou outro defeito real: `S.A.` perde a
pontuação e vira dois tokens (`s` e `a`), escapando da lista de sufixos — a
mesma vaga vinda de duas fontes que escrevem o nome de formas diferentes entrava
duas vezes.

**A regra do §12** vive em `decideCollection`, função pura e por isso testável
sem infraestrutura. Ela recusa encerramento em cinco situações:

| Situação | Encerra? |
|---|---|
| Coleta falhou (timeout, 4xx/5xx, bloqueio) | Não |
| Coleta parcial (paginação truncada) | Só o que a fonte declarou encerrado |
| **HTTP 200 com lista vazia, havendo vagas abertas** | **Não** |
| Desaparecimento em massa (>50% de uma vez, com volume) | Não |
| Coleta completa, com resultados, perda pequena | Sim |

O raciocínio por trás de todas: **o erro é assimétrico**. Fechar uma vaga aberta
por engano tira do usuário uma oportunidade real e é invisível — ele nunca fica
sabendo, e não há como distinguir depois o que encerrou de verdade do que foi
apagado por erro. Manter aberta uma vaga encerrada custa um clique numa página
que diz "vaga não disponível". Todo o arquivo escolhe o clique.

`lastSuccessfulCollection` só avança em coleta confiável, e é ela — não
`lastCollectionAt` — que autoriza encerramentos futuros. Uma fonte que responde
há semanas sempre vazia tem as duas datas distantes, e é essa distância que o
painel deve mostrar como problema.

## 2.10 Etapas 5 a 8 — do filtro duro ao Job Fit

**Filtro duro (§16).** Elimina antes da IA o que é obviamente incompatível. A
regra que governa todos os filtros é a do §12 vista do outro lado do sistema:
**desconhecido nunca elimina**. Uma vaga que não diz o modelo de trabalho não é
uma vaga presencial — é uma vaga que não disse. Descartar por ausência de
informação transforma silêncio da fonte em rejeição ao candidato, e ele nunca
fica sabendo que a vaga existiu.

**Três eixos (§9).** O problema do número único não é a imprecisão: é que ele
apaga a informação necessária para decidir. "78%" não diz se falta uma
competência que se aprende num fim de semana ou se falta autorização de trabalho
no país — as duas produzem o mesmo 78 e pedem decisões opostas.

O **impedimento tem veto estrutural**, não desconto numérico. Foi um teste que
forçou essa correção: com o veto ligado ao nível do eixo, um candidato perfeito
para uma vaga presencial num país onde não pode morar recebia "forte
compatibilidade". Impedimento é porta fechada, não pontuação baixa.

**Silêncio por padrão (§15).** `curate` recusa alertar em cinco situações: Radar
desligado, nenhuma oportunidade, todas abaixo do mínimo do usuário, todas com
impedimento, e todas já avisadas. O padrão de fábrica é exigente de propósito —
um alerta ruim custa mais que o minuto que toma: custa a confiança de que vale
abrir o próximo. Três alertas ruins e o quarto, que era bom, não é aberto.

**Job Fit (§18).** Três blocos — por que recomendamos, atenção, prepare-se — e
`jobPromptContext`, que leva os requisitos e **as lacunas** para os prompts de
currículo direcionado e carta. Uma carta escrita sabendo o que falta pode tratar
a ausência com honestidade em vez de contorná-la.

**Adapters (§11).** O contrato deixa claro o que o adapter **não** decide:
`CollectResult` não tem campo para "feche estas vagas". Quem decide é
`decideCollection`. Se cada adapter decidisse por conta, a regra mais importante
do sistema estaria replicada em N implementações, e bastaria uma esquecer.
`safeCollect` envelopa qualquer adapter para que ele nunca lance — a regra "não
lance" é fácil de escrever no contrato e fácil de violar na implementação.

## 2.11 O Radar passa a rodar (§28, §29, §30)

**Cron, não requisição.** O §28 separa o Radar da análise de currículo: ele
"precisa funcionar mesmo quando ninguém estiver olhando a tela". Entrada em
`GET /api/cron/radar`, agendada de hora em hora no `vercel.json`, autenticada
por `CRON_SECRET`. **Sem o segredo configurado a rota responde 503 e não roda** —
uma rota que dispara coleta e escreve no banco não pode ficar aberta porque
alguém esqueceu uma variável de ambiente.

**Duas metades independentes.** Coletar é por fonte e serve a todo mundo;
avaliar é por usuário. Separá-las evita coletar a mesma vaga uma vez por pessoa,
e é a base da economia do §27.

**Rotação justa.** Cada invocação atende 25 usuários, escolhendo sempre quem
esperou mais (`lastRunAt` mais antigo). Tentar atender todos e ser interrompida
pelo teto de tempo deixaria metade sem rodada e sem registro disso.

**Reaparecer reabre.** Uma vaga que volta numa coleta tem `closedAt` limpo: se
ela voltou, não estava encerrada — e um fechamento anterior pode ter sido
engano. É a contrapartida do §12 do outro lado.

**A leitura não recalcula.** `GET /api/radar` devolve o veredito **gravado no
alerta**. Recalcular mostraria um resultado diferente do que motivou o aviso — o
perfil pode ter mudado no meio — e tornaria impossível auditar por que aquele
alerta saiu.

**Feedback sem alterar o perfil às escondidas (§30).** O 👍/👎 e o motivo ficam
no `RadarAlert`, nunca escritos de volta no `ProfessionalProfile`. Quando o
produto for sugerir um ajuste a partir de rejeições repetidas — o §31 —, a
sugestão é feita ao usuário e quem altera é ele.

**A tela trata silêncio como acerto.** Sem oportunidade, ela diz que o Radar
está monitorando e que não encontrou nada que justifique interromper. Uma tela
que trata silêncio como erro desfaz a promessa do §15.

### Um desvio deliberado do §16

O fluxo do §16 prevê "Matching IA" depois do filtro duro. A implementação usa o
matcher determinístico de `lib/matching/`.

É escolha, não esquecimento: numa rodada que avalia milhares de pares sem
ninguém olhando, ser barato, reprodutível e **incapaz de inventar uma evidência
que não existe** vale mais que a profundidade de leitura que a IA acrescentaria.
A camada de IA cabe depois, sobre as poucas vagas que já passaram por aqui —
onde custa pouco e acrescenta muito.

## 3. O que **não** foi feito — e por quê

O prompt mestre é explícito: *"Não tente implementar tudo de uma vez"*. Esta
etapa cobre a **Etapa 1 (auditoria e estabilização)** por inteiro e a **fundação
da Etapa 3 (Market Adapter)**. O resto está mapeado abaixo, não implementado.

| Etapa | Situação | Primeiro passo concreto |
|---|---|---|
| **1 — Auditoria e estabilização** | ✅ Feita, em produção | — |
| **2 — Professional Profile** (§7, §8) | ✅ Feita, em produção | — |
| **3 — Market Adapter** (§2, §10) | ✅ Feita | Falta apenas `SalaryContext`, que depende de dados de mercado que ainda não coletamos |
| **4 — Job Intelligence** (§13, §14) | ✅ Feita | — |
| **5 — Job Sources** (§11, §12) | ✅ Greenhouse, Lever e Gupy | A Gupy é API interna, com risco declarado; o caminho estável é parceria oficial. Boards do Greenhouse/Lever saem de variável de ambiente |
| **6 — Matching** (§9, §16) | ✅ Feita | — |
| **7 — Radar** (§15, §22, §23) | ✅ Roda por cron, entrega no produto | Falta o e-mail — não há provedor configurado no projeto |
| **8 — Ação** (§18, §19, §20) | ✅ Job Fit na tela do Radar | Falta o currículo direcionado partir da vaga encontrada, e não só da vaga digitada |
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

---

## 2.12 O Greenhouse sai do papel (Etapa 5)

O adapter existia desde a Etapa 5 com a conversão testada e o contrato não
verificado — testes com `fetch` injetado provam que, *dada* uma resposta no
formato esperado, a conversão está certa; não provam que a API responde nesse
formato. A diferença importa: uma fonte cujo comportamento ninguém observou,
rodando sem ninguém olhando, é o cenário que o §12 existe para conter.

Em 18/08/2026 a verificação foi feita contra `boards-api.greenhouse.io`,
board `vercel`. Três perguntas, porque são as três que decidem se a fonte pode
rodar sozinha:

| Pergunta | Resposta observada | Por que decide |
|---|---|---|
| Os campos são os esperados? | Sim — `title`, `absolute_url`, `id`, `location.name`, `updated_at`, `content` | Campo errado vira vaga descartada ou, pior, vaga com dado trocado |
| Há paginação a truncar? | Não — `meta.total` 84 e `jobs` com 84 | Declarar `complete` sobre resposta truncada faria o §12 fechar vaga viva |
| Board inexistente responde o quê? | **404** | Se respondesse 200 com lista vazia, um token errado apagaria as vagas da empresa |

O 404 é o achado que mais importa, e é o que autoriza ligar a fonte: o
`!response.ok` do adapter já converte isso em `outcome: 'failed'`, e o decisor
de coleta não fecha nada diante de falha.

### O que a verificação mudou no código

**A data passou a ser a de publicação.** O payload real traz `first_published`
*e* `updated_at`. O adapter usava `updated_at`, que é a última edição do
anúncio. Como o Radar prioriza vaga nova, uma vaga antiga reeditada furaria a
fila a cada edição. Agora usa `first_published`, com recuo para `updated_at`
nos boards que não o preenchem, e `null` quando não há nenhuma — nunca "hoje".

**O nome da empresa ganhou recuo.** O payload traz `company_name`. O nome
configurado continua vencendo — é o que o operador escolheu e o que fica
estável entre coletas —, mas quando não há configuração o payload serve.

### O que continua sem observação

O comportamento sob instabilidade: 5xx intermitente, resposta parcial,
conexão caindo no meio. O tratamento existe e está testado com `fetch`
injetado, mas nunca foi visto acontecendo de verdade. É a diferença entre
"sabemos o que o código faz" e "sabemos o que a API faz" — a primeira metade
está resolvida, a segunda só o tempo em produção resolve.

### Acrescentar boards não é mais um deploy

A lista sai de `GREENHOUSE_BOARDS`, no formato `token:Nome,outro:Outro Nome`.
Vazia, valem os boards já conferidos. Entrada malformada é **descartada**, não
remendada: um token adivinhado a partir de lixo produziria uma fonte que falha
toda rodada, gastando o orçamento de tempo das fontes que funcionam.

A variável **substitui** a lista conferida em vez de somar a ela. Quem declara
os boards está dizendo quais quer; receber junto um que não pediu seria
surpresa.

Conferir o board antes continua obrigatório — a variável de ambiente removeu o
deploy, não a verificação.

---

## 2.13 A primeira coleta real estourou o teto, e o que ela ensinou

A rodada seguinte ao #27 devolveu **504**: a função foi morta pelo teto de 60s
da Vercel. A causa não estava na coleta nem no matching — estava na gravação.

O laço fazia **duas consultas por vaga**: uma para saber se ela já existia,
outra para gravar. Com 84 vagas, 168 idas ao banco. Isso passou despercebido
porque em teste é instantâneo e porque, até então, `ACTIVE_ADAPTERS` estava
vazio e nenhuma vaga era gravada.

O que tornou o custo intolerável é geográfico: a função roda em `iad1`
(Washington) e o banco está em `sa-east-1` (São Paulo). Cada ida custa mais de
cem milissegundos. 168 × 120ms ≈ 20 a 30 segundos só de espera de rede, antes
de qualquer trabalho.

### A correção

Gravação em lote: uma consulta para descobrir o que já existe, um `createMany`
para o que é novo, uma transação para as atualizações — que o Prisma manda numa
ida só. De 168 viagens para três.

E um **prazo declarado**. A rodada agora recebe um instante-limite (45s dos 60
disponíveis) e para sozinha ao alcançá-lo, entre fontes ou entre usuários,
nunca no meio de um. A diferença entre parar e ser morto é o que a resposta
carrega: um 504 não diz o que rodou; uma resposta com `ranOutOfTime: true` diz
o que foi feito e o que faltou.

**Gravação incompleta é tratada como coleta parcial**, mesmo quando a fonte
respondeu inteira. O retrato do que está aberto ficou pela metade, e decidir
fechamento a partir dele é precisamente o que o §12 proíbe. O decisor já
recusava fechar diante de `partial`; bastou passar o estado certo.

### O que continua valendo a pena arrumar

A distância entre função e banco não é problema do Radar — é de todo o
produto. Toda rota de IA, toda página que lê do banco paga o mesmo pedágio de
ida e volta até São Paulo. O Radar apenas foi o primeiro lugar onde o custo
ficou grande o bastante para matar a requisição.

Por isso a região das funções passou a ser declarada no `vercel.json`:
`"regions": ["gru1"]`, São Paulo — ao lado do banco. Fica no repositório, e não
numa configuração de painel, porque é uma decisão de arquitetura: o produto
inteiro depende de um banco em `sa-east-1`, e essa dependência merece estar
escrita junto do código que a tem.

O plano Hobby aceita **uma** região; declarar várias é recurso do Pro. Se
algum dia a lista crescer sem que o plano acompanhe, o deploy é recusado —
como já aconteceu com a frequência do cron.

---

## 2.14 O Radar estava pendurado no formulário errado

O Radar nasceu para buscar vagas **das áreas que a orientação profissional
recomendou**, no país da pessoa. Não foi isso que ele virou.

`runRadar` só avalia usuários com `ProfessionalProfile` gravado, e o único jeito
de ter um era preencher trinta campos à mão. Quem rodava o diagnóstico
vocacional, lia as três áreas recomendadas e fechava a tela ficava **fora do
Radar** — tendo dito ao produto, com todas as letras, o que queria. A informação
estava gravada em `careerOrientationJson` e não chegava a quem precisava dela.

### O diagnóstico passou a abrir a porta

A rota da orientação agora semeia o perfil: os `role` de `topMatchingAreas`
viram `targetRoles`, e o país de acesso vira `residenceCountry` quando não há
um. Só preenche o que está vazio, e devolve na resposta o que preencheu —
perfil que muda sozinho e em silêncio é o que o §30 proíbe.

Duas coisas da orientação ficam **deliberadamente de fora**:

- **`matchPercentage`**, que ordena a lista para leitura humana e não tem
  relação com os três eixos do `lib/matching`. Deixá-lo viajar faria um número
  virar outro pelo caminho.
- **`requiredSkillsToLearn`**, que são as competências que a pessoa **não tem**.
  Gravá-las em `skills` faria o matching acreditar que ela as domina —
  inventando qualificação, que é o que o §43 proíbe.

### O formulário detalhado vira refinamento

Preencher os trinta campos à mão continua existindo, para quem quer discordar da
recomendação ou detalhar o que ela não cobre. Deixa de ser a porta de entrada.

Decisão de produto registrada: **esse formulário detalhado é candidato a plano
Plus**. Não implementado — o §21 trava a assinatura até o Radar provar valor, e
implementar a cobrança antes disso seria cobrar por algo cujo valor ainda não
foi demonstrado.

### E um botão para quem já tem currículo

`POST /api/user/professional-profile/suggest` lê o último currículo com uma
chamada de IA barata e devolve **sugestão**, que a tela usa para preencher os
campos vazios do formulário. A pessoa revisa e salva. Os cargos-alvo dessa
resposta vêm do diagnóstico, não da IA: o diagnóstico é a recomendação do
próprio produto, já vista pela pessoa, e uma leitura de currículo competindo
com ela às vezes ganharia — dizendo algo diferente do que a tela do diagnóstico
disse.

O que a extração **não** deduz, de propósito: país, mercado-alvo, pretensão
salarial e disponibilidade para mudança. Um endereço no cabeçalho do currículo
diz onde a pessoa morava quando o escreveu, não onde quer trabalhar — e essas
quatro respostas mudam o produto inteiro.

## 2.15 Países por extenso

A tela pedia "código de 2 letras (BR, PT, US...)" num campo de texto, e os
mercados alternativos pediam "os mesmos códigos". Isso presume que a pessoa
conheça a tabela ISO de cor. Quem não conhece erra, desiste, ou escreve algo que
o normalizador descarta em silêncio.

Agora são listas com o nome do país escrito. `lib/market/countries.ts` traz
mais de 160 países em português, em dois grupos: os que têm adaptação própria
primeiro — porque escolher um deles muda o comportamento do produto — e os
demais depois, que existem porque as pessoas moram neles e caem no perfil
global. O que se guarda continua sendo o código ISO; o nome é para ler.

Os mercados alternativos viraram caixas de seleção, e o mercado principal some
da lista: um "alternativo" igual ao principal não significa nada.

---

## 2.16 O segundo ATS, e o que ele não resolve

O Lever entrou pelo mesmo caminho do Greenhouse: formato observado primeiro,
código depois. Verificado em 18/08/2026 contra
`api.lever.co/v0/postings/leverdemo?mode=json`, 388 vagas, array puro sem
envelope nem paginação, e token inexistente respondendo 404 — a garantia de que
um erro de configuração não vira "empresa sem vagas".

### Duas vantagens sobre o Greenhouse

O Lever entrega **`country` em ISO2** já pronto. O Greenhouse manda só um texto
livre de localização ("Hybrid - London"), e o país precisa ser inferido. E
entrega `descriptionPlain`, texto já sem marcação, dispensando a limpeza de HTML
que no Greenhouse tem uma ordem certa e frágil.

### Três armadilhas que só o payload real mostrou

**O cargo está em `text`, não em `title`.** Ler `title` devolveria vazio, a vaga
seria descartada, e a fonte pareceria não ter vaga nenhuma — falhando do jeito
mais silencioso possível.

**`createdAt` vem em milissegundos desde a época**, não em texto ISO. Passá-lo
adiante faria o normalizador ler um número onde espera data, e vaga sem data
some da priorização do Radar, que ordena por vaga nova.

**O payload não traz o nome da empresa.** Diferente do Greenhouse, não há de
onde tirar — e `company` é obrigatório na normalização. Sem nome declarado, as
vagas seriam descartadas uma a uma e a coleta terminaria "bem-sucedida" com zero
resultados. O token do board vira o nome nesse caso: é o identificador da
própria empresa no Lever, então é dado feio, não dado inventado.

### Uma resposta 200 que é falha

O adapter recusa payload que não seja array, mesmo com HTTP 200. Um erro
embrulhado em 200 seria lido como coleta vazia bem-sucedida, e o §12 fecharia as
vagas da empresa. Verificação barata, consequência cara.

### O que isto NÃO resolve

**O mercado brasileiro.** Nubank e Loft foram testados e responderam 404 — não
usam Lever. Greenhouse e Lever são ATS dominantes nos Estados Unidos e no
Reino Unido; no Brasil quem concentra vaga é Gupy e Vagas.com, e nenhum dos dois
tem board público documentado como estes.

Enquanto isso não for resolvido, um perfil brasileiro que não aceite trabalho
remoto internacional continua sem fonte — e o Radar continua calado, o que é o
comportamento correto do §15, não uma falha. Vale dizer claramente em vez de
deixar parecer que a cobertura existe.

A lista do Lever começa **vazia**: o único board conferido é o `leverdemo`, de
demonstração, e encher o Radar de vaga de mentira é pior que silêncio.

---

## 2.17 O Brasil entra, e a fonte de busca muda o contrato

A Gupy é quem concentra vaga no Brasil, e entrar nela obrigou a rever duas
coisas que Greenhouse e Lever nunca puseram à prova.

### É busca, não board

Os dois primeiros são boards por empresa: pede-se o board, vem o que está
aberto. A Gupy é busca por termo — não existe "todas as vagas", existe "as
vagas que casam com esta palavra". **Alguém precisa dizer qual palavra.**

A resposta é o próprio produto: os cargos que a **orientação profissional
recomendou** aos usuários. É isto que o Radar sempre foi para ser — buscar vaga
das áreas sugeridas, no país da pessoa — e é a única origem de termos que não é
chute de quem escreveu o código.

Buscar pela união dos cargos-alvo não transforma a coleta em algo por usuário: a
vaga achada pelo termo de um entra no banco e serve ao matching de todos. Muda só
de onde saem as palavras.

Os termos são ordenados por **quantas pessoas** querem aquele cargo, e não por
quantas vezes a palavra aparece. O orçamento de tempo não cobre todos, e o corte
por frequência atende mais gente por segundo gasto.

### Ausência deixou de significar encerramento

`JobSourceDescriptor` ganhou `closesByAbsence`. Num board de empresa, sumir da
lista é encerramento — o board lista o que está aberto. Numa fonte de busca,
não: a vaga pode ter caído fora do termo, da página ou da ordenação e continuar
perfeitamente aberta.

Fechar por ausência numa fonte de busca encerraria vaga viva a cada mudança de
ranking. A Gupy declara `false`, e `runCollection` passa uma lista de abertas
vazia ao decisor nesse caso — mantendo o §12 num lugar só, sem que o decisor
precise saber que existem fontes de busca.

### Duas armadilhas do payload

`country` vem por extenso e em português ("Brasil"), não em ISO2 como no Lever.
Guardá-lo cru faria o filtro duro comparar "Brasil" com "BR" e eliminar toda
vaga brasileira de um perfil brasileiro. A conversão reusa a lista de países da
tela do perfil, em vez de criar uma segunda tabela que um dia divergiria.

`pagination.total` é do termo pesquisado. Interromper antes de alcançá-lo é
coleta parcial, e dizer `complete` ali seria a mentira que o §12 existe para
impedir — ainda que aqui ela não feche nada.

### O risco, declarado

Greenhouse e Lever publicam seus endpoints **para consumo de terceiros**. A Gupy
não: o que se usa aqui é a API interna do portal dela. Pode mudar sem aviso,
pode ser bloqueada, e os termos de uso provavelmente vedam o consumo
programático.

A decisão de usar assim mesmo foi tomada com os riscos à vista, para uma coleta
por dia. Está escrita no `accessNote` do descritor e no cabeçalho do adapter,
onde quem mexer vai ler. **O caminho que não quebra é a API oficial de
parceria** — enquanto ela não existir, a cobertura brasileira do Radar depende
de uma dependência frágil, e isso é fato do produto, não detalhe de
implementação.

---

## 2.18 Não ficar na mão de uma fonte só

A pergunta era direta: dependemos da Gupy, ou dá para buscar e mostrar o que se
acha — por exemplo no Google?

**Pelo Google, não.** O Google for Jobs não tem API pública, e raspar página de
resultado viola os termos e é bloqueado por robô. Ficaria mais frágil que a
Gupy, não menos. A Custom Search API é oficial mas busca a web: devolve link e
trecho, não vaga estruturada.

**O que o Google esconde, sim.** O motivo de ele conseguir mostrar vagas é que
os empregadores publicam `schema.org/JobPosting` em JSON-LD nas próprias
páginas. É padrão aberto, publicado justamente para consumo automatizado, e
está no site de quem contrata — sem chave, sem API interna, sem zona cinzenta.

### O que o adapter de JSON-LD resolve, e o que não

**Resolve ler**: qualquer página que publique os dados estruturados vira fonte.

**Não resolve descobrir**: ele precisa saber quais páginas visitar. Descoberta
ampla continua dependendo de agregador ou de fonte de busca. Dizer o contrário
seria vender cobertura que não existe.

Por isso ele é uma fonte de **páginas escolhidas**: a instalação lista os
empregadores que interessa acompanhar em `CAREER_PAGES`. Para os empregadores
escolhidos, o Brasil deixa de depender só da Gupy.

### Diferente das outras três, foi escrito contra a especificação

Greenhouse, Lever e Gupy tiveram o formato observado antes do código. Este não:
a especificação do schema.org é pública e estável, e foi ela a referência.

O risco disso está tratado onde dá: o parser tolera as três variações que
páginas reais usam — objeto embrulhado em `@graph`, vários blocos na mesma
página, array no lugar de valor único — e há teste para cada uma. O que continua
sem verificação é o comportamento diante de uma página específica de verdade,
e por isso conferir antes de acrescentar uma página é obrigatório.

### Ausência aqui É encerramento

Ao contrário da Gupy, esta fonte lê cada página por inteiro toda rodada. Se a
vaga saiu da página de carreiras da empresa, saiu de verdade — então
`closesByAbsence` fica no padrão. É o mesmo raciocínio que fez a Gupy declarar o
contrário, aplicado a uma fonte de natureza diferente.

### Adzuna ficou pendente

O agregador com API oficial e cobertura do Brasil seria a resposta para
descoberta ampla. A tentativa parou em `AUTH_FAIL` com credenciais de tamanho
plausível, o que aponta para app ainda não ativo na conta. Continua sendo o
próximo candidato — e, com o contrato `JobSourceAdapter`, acrescentá-lo é um
arquivo.

### Uma proteção que a configuração precisava

`CAREER_PAGES` aceita **só `http` e `https`**. Sem isso, uma entrada malformada
viraria requisição a `file://` ou a um host interno, feita pelo servidor em nome
de quem escreveu a variável.
