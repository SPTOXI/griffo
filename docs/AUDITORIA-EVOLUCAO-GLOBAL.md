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
| **5 — Job Sources** (§11, §12) | ✅ Sete fontes | Greenhouse, Lever, Gupy, páginas de carreira, Adzuna, Remotive e RemoteOK. Só a Gupy é API interna; as demais têm contrato público |
| **6 — Matching** (§9, §16) | ✅ Feita | — |
| **7 — Radar** (§15, §22, §23) | ✅ Roda por cron, entrega no produto | Falta o e-mail — não há provedor configurado no projeto |
| **8 — Ação** (§18, §19, §20) | ✅ Completa | Job Fit na tela e currículo direcionado a partir da vaga do Radar, sem colar nada |
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

---

## 2.19 A Adzuna, e o salário que quase entrou inventado

A Adzuna é a primeira fonte que resolve **descoberta ampla com contrato
público**: API documentada, chave própria, e cadastro em que o uso é declarado.
Greenhouse e Lever só acham vaga de quem já se conhece; a Gupy resolve o Brasil
por API interna, com o risco escrito no cabeçalho dela.

Verificada em 18/08/2026 contra
`api.adzuna.com/v1/api/jobs/br/search/1?what=enfermeiro`.

### A armadilha

O payload traz `salary_is_predicted`. Quando vale `"1"`, o salário foi
**estimado pela Adzuna** — não informado pela empresa. Gravá-lo como salário da
vaga poria no produto um número que ninguém prometeu, e o usuário o leria como
promessa.

Quando a estimativa está ligada, o salário é descartado. Vaga sem salário é o
estado normal do mercado brasileiro; vaga com salário inventado é o que o §43
proíbe. Este é o tipo de campo que só aparece olhando o payload — nenhuma
documentação lida de memória teria avisado.

### Duas coisas menores que também vieram do payload

O país está em `location.area`, uma hierarquia do mais geral para o mais
específico (`["Brasil", "Sul", "Paraná", "Curitiba"]`), por extenso e em
português. É a mesma conversão que a Gupy precisa — e por isso
`countryCodeFromName` saiu do adapter da Gupy e passou a morar em
`lib/market/countries.ts`, junto dos nomes. Duas tabelas divergiriam no primeiro
país acrescentado a uma só.

E a Adzuna responde **200 com um campo `exception`** quando a credencial não
vale. Ler isso como "nenhuma vaga" faria uma chave expirada parecer um mercado
vazio — e mercado vazio, numa fonte que fechasse por ausência, apagaria vaga
viva. O adapter trata `exception` como falha.

### `redirect_url` e a deduplicação

A URL de candidatura passa pelo domínio da Adzuna: é como a API funciona e como
a atribuição é contada. O efeito colateral é que a mesma vaga vinda da Gupy e da
Adzuna tem URLs diferentes — quem as junta é a deduplicação por empresa + cargo,
não a por URL. A camada de dedup da Etapa 4 já cobre isso, e é a primeira vez
que essa estratégia ganha um caso de uso real.

### As cinco fontes, e o que cada uma resolve

| Fonte | Resolve | Contrato | Fecha por ausência |
|---|---|---|---|
| Greenhouse | Empresas conhecidas (EUA, GB, CA) | Público | Sim |
| Lever | Empresas conhecidas (variado) | Público | Sim |
| Páginas de carreira | Empregadores escolhidos | Padrão aberto | Sim |
| Gupy | Descoberta no Brasil | **Interno** | Não |
| Adzuna | Descoberta ampla | Público | Não |

O Brasil deixou de depender de uma fonte só.

---

## 2.20 O primeiro alerta, e o defeito que ele expôs

O Radar produziu **4 alertas** a partir de 277 vagas coletadas de três fontes —
Gupy (100), Adzuna BR (92) e Greenhouse (85). Quatro é exatamente o teto por
envio: ele achou candidatas e parou onde devia, em vez de despejar tudo.

A coleta da Adzuna voltou `partial`, e isso é correto: ela tem mais resultados
do que o teto de páginas por termo permite ler numa rodada. O registro dela no
banco diz *"Coleta incompleta. Nenhuma vaga encerrada"* — o §12 funcionando pela
primeira vez com dados reais.

### O defeito que só apareceu ao pensar em testadores

Com o pipeline funcionando, a pergunta virou: como outra pessoa testa isso? E a
resposta era ruim. Alguém se cadastra, gera o diagnóstico, abre o Radar — e vê
tela vazia **até as 6h UTC do dia seguinte**, porque a única coisa que dispara o
Radar era o cron diário.

Uma tela vazia por 24 horas é indistinguível de produto quebrado. Nenhum
testador chegaria ao segundo dia.

### Separar o que é caro do que não é

Coletar varre a internet: cinco fontes, dezenas de idas à rede, orçamento de
tempo apertado. **Avaliar** um perfil contra as vagas já coletadas são quatro
consultas e cálculo em memória, sem rede nenhuma.

Só a primeira precisa ser diária. A segunda passou a rodar:

- ao **salvar o perfil** — quem acabou de declarar o que procura vê o resultado
  na mesma tela, junto do aviso de que salvou;
- ao **gerar o diagnóstico vocacional**, logo depois da semeadura do perfil;
- sob demanda, no botão **"Procurar agora"** da tela do Radar.

Nos dois primeiros casos a rodada é *oportunista*: `runForUserQuietly` engole a
falha, porque a entrega principal é outra — derrubar o diagnóstico porque a
avaliação de vagas não deu certo trocaria o que a pessoa pediu pelo que ela nem
sabe que está acontecendo. Na rota `/api/radar/run`, que existe só para isso, a
falha é a resposta e precisa ser dita.

### O botão não coleta, e o texto não promete que coleta

`/api/radar/run` **não** dispara coleta. Deixar cada usuário coletar
multiplicaria por N as idas às fontes e daria a qualquer visitante um botão que
faz o servidor chamar cinco APIs externas.

O efeito prático é que uma vaga publicada hoje só aparece depois da coleta da
madrugada. O estado vazio da tela diz isso com todas as letras, em vez de deixar
a pessoa concluir que o botão está quebrado.

Há intervalo mínimo de 30 segundos: avaliar é barato, mas o resultado não muda
entre dois cliques seguidos — as mesmas vagas contra o mesmo perfil dão o mesmo
veredito.

### O que ainda piora com o tempo

Gupy e Adzuna nunca fecham vaga por ausência, por desenho — sumir de uma busca
não prova encerramento. Mas isso significa que vaga delas **não fecha por nada**.
Em alguns meses o banco terá vaga encerrada há muito tempo, e o Radar pode
alertar sobre ela.

Falta encerramento por idade ou por `applicationDeadline` (a Gupy manda esse
campo). É o único problema conhecido que piora sozinho, e o próximo da fila.

---

## 2.21 Vaga também acaba

A pergunta era simples — quanto tempo a vaga fica no banco — e a resposta era
**para sempre**. O expurgo de retenção cobria eventos de webhook, logs de IA,
auditoria e currículos de contas inativas; `Job` não estava lá. E o
encerramento era desigual: boards fecham por ausência, Gupy e Adzuna
declaram `closesByAbsence: false` e portanto **não fechavam por nada**.

Duas consequências, e a segunda é comercial:

1. Em alguns meses o Radar estaria avisando sobre vaga encerrada há muito
   tempo. Numa ferramenta que promete só interromper quando vale a pena, isso é
   o oposto exato do prometido — e, num produto em que se paga por resultado,
   é entregar o contrário do que foi vendido.
2. O banco cresce sem teto. Cada vaga guarda a descrição inteira.

### Encerrar por tempo, não por ausência pontual

Sumir de UMA coleta não diz nada. Não aparecer em coleta NENHUMA por 45 dias
diz. A janela é longa de propósito: o custo de fechar cedo (esconder vaga viva)
é maior que o de fechar tarde (mostrar vaga velha por mais uns dias), e vaga
real reaparece em toda coleta.

### A trava que herda o §12

Se a **fonte** está quebrada há mais tempo que a janela, o silêncio é nosso e
não da vaga. Fechar aí seria exatamente o erro do §12 — apagar vaga viva porque
a coleta falhou — só que em câmera lenta, e por isso mais difícil de perceber.

A decisão exige que a fonte tenha tido coleta confiável **dentro da janela**. É
por isso que o encerramento roda por fonte e não numa consulta só: a pergunta
"esta coleta está saudável?" só tem resposta olhando cada uma.

### Onde ele roda na rodada

Depois de coletar e antes de avaliar. Depois de coletar porque vaga que
reapareceu teve o `lastSeenAt` atualizado e não deve ser dada como parada. Antes
de avaliar porque avaliar uma vaga recém-encerrada geraria alerta para algo que
já não existe — o erro que este mecanismo veio corrigir.

### Apagar é outra coisa, com outro critério

Encerrada há mais de 90 dias, a vaga pode ser apagada — e o prazo maior existe
para que ela sobreviva ao arrependimento: enquanto a linha existe, um
fechamento errado se desfaz sozinho quando a vaga reaparece numa coleta.
Depois de apagada, ela voltaria como vaga nova e quem já a viu seria avisado de
novo.

**Vaga com alerta nunca é apagada.** `RadarAlert` tem `onDelete: Cascade`:
apagar a vaga levaria junto o registro de que alguém foi avisado sobre ela,
destruindo o histórico da pessoa para economizar espaço. São poucas linhas; não
vale a troca.

### O modelo de cobrança que isto sustenta

Ficou decidido, para começar: **busca inicial gratuita** logo após a orientação
vocacional (entregue em `#33`), **Radar diário gratuito**, e busca imediata com
termos novos como produto pago mais adiante — quando os custos forem estudados.

O que se vende ali é **imediatismo, não acesso**: a varredura diária pega os
termos novos de qualquer forma no dia seguinte. A tela precisa dizer isso, e
nunca insinuar que sem pagar não se recebe nada.

---

## 2.22 A Adzuna deixa de ser só o Brasil

Os dez mercados foram **testados um a um** contra
`/v1/api/jobs/{country}/search/1` em 18/08/2026:

| Cobertos (200) | Fora (404) |
|---|---|
| BR, US, CA, GB, ES, MX, DE, FR, IN, AU | **PT, JP** |

O código fixava `country: 'br'`. Agora o país sai do perfil de cada usuário.

### A cota não cabe todos toda noite

A camada gratuita da Adzuna é de **2.500 requisições por mês** — cerca de 83 por
dia. Varrer dez países com seis termos e duas páginas seria 120 por rodada:
estouraria na primeira semana.

A saída não é cortar arbitrariamente, e sim **rodízio**: quatro países por
rodada, três termos cada, uma página por termo — **12 requisições**. Em três
rodadas todos os dez mercados tiveram vez.

A fila é ordenada por `lastCollectionAt` da fonte daquele país
(`adzuna:br`, `adzuna:us`...), com quem nunca coletou na frente. Reusa estado
que a coleta já grava, em vez de um contador de rodízio que precisaria ser
mantido em sincronia com a realidade.

É a mesma decisão que a rodada do Radar já toma com usuários, pelo mesmo motivo:
tentar atender todos e ser cortado no meio deixa metade sem atendimento e sem
registro disso.

### A folga é o produto

12 × 31 = 372 requisições por mês. Sobram mais de 2.100 — e essa folga **é** a
busca sob demanda: ela serve uma pessoa, enquanto a rodada diária serve todas.
O compartilhado precisa estar protegido do individual, e é por isso que os três
limites são conservadores.

Há teste travando essa conta. Quem subir qualquer um dos três vai descobrir ali,
e não pela fatura.

### Perfil sem país fica de fora, e não é descuido

Sem saber onde a pessoa mora não dá para escolher o mercado, e chutar o Brasil
porque é o mais comum entregaria vaga do país errado. O país continua sendo o
campo que mais decide o que o Radar faz — e é por isso que a tela do perfil
agora o pede numa lista com o nome escrito.

### O que sobra descoberto

**Portugal e Japão** não têm fonte de busca por cargo. Portugal importa: é
mercado de língua portuguesa e está em `MARKETS`. As candidatas são ATS locais
(Net-Empregos, ITJobs) e os agregadores com chave sob solicitação (Jooble,
Careerjet).

E há um caminho que atende os dois de graça: as **APIs de vaga remota**
(Remotive, RemoteOK, Arbeitnow) — sem chave, sem zona cinzenta, servindo o
mercado `GLOBAL` que já existe no `lib/market`. É a melhor relação
esforço/retorno do que sobrou.

---

## 2.23 Portugal e Japão entram pela porta do remoto

A Adzuna cobre dez dos doze mercados. Portugal e Japão ficavam sem fonte de
busca por cargo — e Portugal importa, é mercado de língua portuguesa.

A saída não foi procurar um ATS local para cada um. Foi notar que **vaga remota
internacional não tem mercado local**: ela atende quem mora em qualquer lugar e
aceita trabalhar de casa para fora. É o mercado `GLOBAL` que já existia em
`lib/market` e que até aqui não tinha fonte nenhuma.

Remotive e RemoteOK: gratuitas, sem chave, com API documentada para terceiros.

### A Arbeitnow ficou de fora, de propósito

Ela apareceu no mesmo teste e foi descartada: a primeira vaga veio com
`remote: false` e `location: "Berlin"`. É quadro alemão, não de vaga remota — e
a Adzuna já cobre a Alemanha. Fonte redundante gasta orçamento de coleta sem
ampliar cobertura.

### Quatro armadilhas do payload real

**O cargo do RemoteOK está em `position`**, não em `title` — a mesma pegadinha
do `text` no Lever. Ler `title` descartaria tudo, e a fonte pareceria vazia em
vez de quebrada.

**`epoch` e `created_at` vêm em SEGUNDOS**, não em milissegundos como no Lever.
Tratar como milissegundos jogaria toda vaga para 1970.

**`salary_min: 0` significa "não informado"**, não "paga zero". Gravar o zero
poria no produto um salário que ninguém ofereceu.

**O `salary` da Remotive é texto livre** (`"$120 - $170 /hour"`). Interpretá-lo
exigiria adivinhar moeda, período e intervalo — três chances de errar num campo
que o usuário lê como promessa. Fica fora, e a vaga declara `notDisclosed`, que
é diferente de deixar o campo vazio por descuido.

### Duas sutilezas que não são armadilha, mas mudam o resultado

A data da Remotive vem **sem fuso** (`"2026-08-16T10:09:41"`). Sem marcador, o
`Date` a lê no fuso de quem executa — e a mesma vaga teria data diferente
conforme a região da função. É assumida como UTC.

O `candidate_required_location` (`"Americas, Europe, Israel"`) é de **onde se
pode candidatar**, não onde fica a vaga. Vai como texto de localização, e o país
fica nulo: vaga remota internacional não tem um.

### Ligadas por padrão, ao contrário das demais

Não pedem chave, não têm cota conhecida, e são a única fonte de quem mora em
país fora da Adzuna. Atrás de uma variável de ambiente, esses mercados ficariam
sem fonte por esquecimento. `REMOTE_BOARDS=off` desliga as duas, caso alguma
passe a exigir chave.

### E uma duplicação que virou defeito

A limpeza de HTML estava copiada em três adapters, e as três deixavam
`"Construir sistemas ."` — a tag no meio da frase vira espaço, e o espaço
encosta na pontuação. Três cópias são três lugares para corrigir o mesmo
defeito; agora é uma, em `jobs/text.ts`.

---

## 2.24 A ponte que faltava, e o painel que não existia

### O Radar levava a lugar nenhum

O Griffo sabe adaptar um currículo a uma vaga específica. Mas a vaga só entrava
no sistema de um jeito: **colada à mão** no formulário de envio.

Então o Radar encontrava a vaga certa, mostrava na tela — e a pessoa precisava
copiar a descrição, trocar de tela e colar. Quase ninguém faz. A fricção mata
exatamente no momento em que ela estava disposta a agir, e é o momento em que o
produto ganharia dinheiro.

Pior: já **havia** um botão ali chamando `setView('rewrite')`. Ele navegava sem
levar a vaga. A pessoa chegava na tela de reescrita e encontrava o mesmo campo
vazio de sempre — parecia funcionar e não funcionava.

Agora `POST /api/radar/prepare` grava a vaga no currículo e a tela abre já
direcionada.

**Direciona o currículo que existe, e não cria outro.** Criar um por vaga
pareceria mais limpo, mas as permissões de uso são por currículo: um currículo
novo exigiria destravá-lo de novo, e a pessoa receberia uma cobrança que não
pediu ao clicar em "preparar".

**E diz o que sobrescreveu.** Se o currículo estava direcionado a outra vaga, a
resposta devolve qual era, e a tela conta. Trocar o alvo em silêncio faria a
próxima análise sair diferente sem que ninguém soubesse por quê.

As ações do Job Fit deixaram de ser botões. Eram três botões que faziam a mesma
coisa — prometiam escolhas que não existiam. Viraram o que sempre foram:
recomendações escritas.

### Cota estourada era invisível

Uma fonte pode parar de responder por limite de plano, e isso **não aparece**
como erro. A Adzuna devolve 200 com um campo `exception` quando o mês acaba, o
que sem alguém olhando se parece com "não há vaga". O Radar continuaria rodando,
entregando menos, e ninguém saberia por quê.

`ApiQuotaUsage` conta requisições por provedor e por mês — uma linha por mês, não
uma por chamada: o que interessa é o total, e uma linha por requisição seriam
milhares de registros para responder uma pergunta de um número só.

O incremento é atômico (`increment`), e não leitura-e-escrita: duas rodadas
simultâneas somariam errado, e a soma é a única coisa que o registro existe para
saber.

### A regra que protege o compartilhado

**20% da cota é reserva da rodada agendada, intocável pela busca sob demanda.**

A rodada serve todos os usuários; a busca sob demanda serve um. Quando a cota
aperta, quem cede é o individual. Com a Adzuna, a reserva são 500 requisições —
bem acima das ~372 que a rodada consome no mês, com folga para um dia atípico.

O painel acende em dois níveis: **atenção aos 70%**, para decidir sem pressa, e
**crítico aos 90%**, para reagir antes de a fonte parar.

E `unknown` não é `ok`: provedor sem teto declarado não autoriza consumo
ilimitado — só significa que a decisão vem de outro lugar (o orçamento de tempo
da coleta). Confundir os dois faria a Gupy virar barra livre.

`GET /api/admin/quotas` devolve as cotas **e** o estado de cada fonte: cota é só
uma das formas de uma fonte parar, e uma que responde 500 há três dias precisa
aparecer no mesmo lugar.

---

## 2.25 A coluna que faltava, e o defeito de matching que ela escondia

Usuário real testou o Radar em produção e recebeu, ao mesmo tempo, "Não foi
possível carregar o Radar" e "Nada digno de nota no momento" — as duas
mensagens juntas, uma dizendo que falhou e a outra dizendo que está tudo bem.

### O erro estava nos dois lugares onde apareceu

Os logs da Vercel mostraram a causa em produção: `P2022`, `RadarAlert.notifiedAt`
does not exist in the current database. A coluna do PR #61 — nulável, aditiva,
o mesmo padrão seguro já usado antes — nunca teve seu `prisma db push` aplicado
ao banco de produção. Sem migração versionada, essa aplicação é manual, e
ninguém a fez depois do deploy. `GET /api/radar` e `POST /api/radar/run`
quebravam a cada chamada.

O segundo defeito estava em `radar-view.tsx`: quando `/api/radar` falha, os
estados `hasProfile`/`profileMatchable` não eram resetados e ficavam no padrão
`true`, então o card de "silêncio correto" do §15 renderizava por baixo do
banner de erro — uma tela que nunca deveria dizer duas coisas contraditórias ao
mesmo tempo passou a dizer. Corrigido: os blocos de resultado (vazio, digest,
lista de oportunidades) agora são condicionados a `!error`.

`db push` resolveu a coluna. A tela deixou de esconder erro atrás de silêncio.

### O silêncio anterior não era o comportamento correto — era o mesmo defeito, calado

Assim que os alertas voltaram a ser gravados, veio o caso concreto que a seção
7.5 do `HANDOFF-CONTINUIDADE.md` esperava havia tempo: um perfil de gestão
hospitalar (`coordenação`, `saúde`, `gestão de unidades de saúde`, 25 anos de
experiência) recebeu como **boa compatibilidade** vagas de "Analista de Dados"
(quatro delas, de empresas diferentes) e "Coordenador de Desenvolvimento de
Software". Nada ali tinha relação com a área da pessoa.

A tentação foi reverter o `db push` — "a versão anterior estava certa". Não
estava: a versão anterior não filtrava nada, só quebrava antes de chegar a
filtrar. Reverter teria escondido de novo o defeito, não corrigido.

### A causa: dois sinais neutros que nunca deveriam se somar em positivo

Nenhuma das vagas ruins tinha `requirements`/`skills` cadastrados. Vaga sem
requisito listado recebe nota neutra (50) no eixo Vaga — decisão de design
certa, e testada desde a Etapa 6: "vaga sem requisitos publicados não vira
aderência alta" (`matching.test.ts`). O problema não era essa neutralidade
sozinha.

O que faltava enxergar: `SENIORITY_TERMS` (em `lib/market/taxonomy.ts`) mapeia
"coordenador"/"supervisor"/"tech lead" para o nível `lead` — é assim que o
normalizador infere hierarquia a partir do texto do título, sem saber a área.
Uma pessoa cuja própria senioridade também resolve para `lead` (qualquer
gerente ou coordenadora sênior, de qualquer setor) bate com **qualquer** vaga
cujo título contenha essas palavras, em qualquer área. Somado à nota neutra do
eixo Vaga e a um eixo Contextual que parte de 100 e só desconta o que sabe que
está errado — e não sabia nada sobre essas vagas —, o sinal combinado bastava
para cruzar o limiar de "boa compatibilidade" sem nenhuma evidência de que o
cargo tinha relação com o perfil.

É a mesma classe de defeito da regra do §9 registrada na Etapa 6 ("aderência
zero nunca vira parcial por falta do que descontar"), só que do lado oposto:
lá, ausência de informação vestia nota cheia por não haver o que descontar;
aqui, ausência de requisito e uma coincidência de nível hierárquico vestiam
evidência positiva por não haver voto contrário.

### A correção

`src/lib/matching/compatibility.ts` ganhou `confirmedSameRole` — única função
que responde "o cargo declarado é reconhecido como o mesmo da vaga", usada pelo
eixo profissional e pelo veredito, para que a pergunta não exista em dois
lugares com o risco de divergir.

O veredito deixa de poder passar de `partial` quando **nem** o cargo é
confirmado como o mesmo **nem** a vaga tem requisito batendo com competência
declarada. Senioridade batendo e anos de experiência continuam pontuando o
eixo profissional — são sinal real sobre a pessoa —, mas sozinhos, sem cargo
confirmado nem competência evidenciada, não bastam para uma recomendação
positiva. Os 43 testes de `matching.test.ts` continuam passando sem alteração,
incluindo o caso que garante que vaga sem requisito não seja punida — o teto
mudou, a proteção contra punir ausência não.

Com a preferência padrão do usuário (avisar só de "boa compatibilidade" para
cima), esse tipo de vaga volta a produzir silêncio — silêncio de verdade desta
vez, por falta de evidência, não por erro de banco.

### O que isso não resolve

Não existe, em lugar nenhum do matching, comparação por área ou indústria:
`ProfessionalProfile.targetFields`/`targetIndustries` nunca são lidos por
`compatibility.ts`, e `NormalizedJob` não tem campo de indústria — nenhuma fonte
o declara. `confirmedSameRole` reduz o falso positivo a casos onde nem o cargo
nem a competência dão qualquer base, mas um "Coordenador de Operações" de TI
ainda pode confirmar o mesmo conceito de cargo que um "Coordenador de
Operações" da saúde, se a taxonomia tratar os dois como o mesmo `RoleConcept`.
Resolver isso de verdade pede um eixo de área/indústria que hoje não existe —
registrado aqui, não implementado.

### Efeito colateral aceito, e por quê

Os 31 `RadarAlert` gravados até então (2 usuários) foram apagados em produção.
A leitura de `GET /api/radar` nunca recalcula o veredito — é gravado no alerta
para poder ser auditado depois, por desenho (seção 2.11) —, então mantê-los
teria deixado o veredito antigo (calculado pela regra velha) na tela até a
próxima rodada de qualquer jeito. Apagar o alerta não apaga a vaga: ela volta a
ser avaliada, com a regra nova, na próxima varredura ou em "Procurar agora".

---

## 11. Global Day 1 & Priorização Dinâmica por Mercado (24/08/2026)

### Diagnóstico & Contexto Estratégico

A internacionalização de produtos digitais de IA costuma falhar por dois extremos:
1. **Linearismo excessivo:** esperar anos para dominar o mercado doméstico (Brasil) antes de abrir outros países, correndo o risco de concorrentes globais ocuparem os canais e o SEO antes.
2. **Ilusão do TAM bruto:** apostar cegamente em países de população massiva (Índia, Indonésia) onde o CAC e a conversão podem não cobrir os custos ou ter ticket médio irrelevante.

A estratégia adotada é **Global Day 1 com Priorização Dinâmica**:
- O produto nasce disponível em múltiplos mercados simultaneamente (idiomas, moedas, ATS e regras de currículo locais).
- Micro-testes controlados de tráfego de anúncios são executados.
- **O algoritmo de dados decide a alocação de verba**, priorizando mercados com maior margem de contribuição ($\text{Receita Líquida} - \text{CAC} - \text{Custo IA}$).

### O que foi implementado

1. **Captura de Campanhas e UTMs (`page-view-tracker.tsx`):**
   * Parâmetros `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term` são lidos da URL no primeiro acesso, salvos no `localStorage` do visitante e propagados em todos os eventos do funil (`page_view`, `checkout_initiated`, `upsell_viewed`).

2. **Detecção de Geolocalização na Borda (`/api/analytics/track`):**
   * Leitura dos cabeçalhos de edge `x-vercel-ip-country` e `cf-ipcountry`, associando o código ISO do país diretamente aos eventos de telemetria sem expor IP ou violar LGPD/GDPR.

3. **Cálculo de Performance por Mercado (`lib/analytics/market-performance.ts`):**
   * Agregação em memória cruzando `AnalyticsEvent` e `AnalysisLedger`.
   * Métricas computadas por país: Visitantes Únicos, Checkouts, Compras, Taxa de Conversão Final (Visitante $\rightarrow$ Compra), Conversão de Checkout, Receita (USD/BRL), Custo Direto de IA (\$1.0449/análise), Taxas de Gateway (4%), Lucro Líquido e Margem Líquida.
   * Recomendação algorítmica:
     * 🚀 **Escalar Verba:** Conversão $\ge 3.5\%$ e margem positiva $\ge 50\%$.
     * 🟡 **Testar mais:** Amostragem inicial.
     * 🔻 **Otimizar / Reduzir:** Tráfego expressivo com conversão $< 1.5\%$ ou margem negativa.

4. **Painel Visual no Dashboard Admin (`admin-view.tsx`):**
   * Tabela analítica completa com bandeiras Unicode, volumes, conversões e badges de decisão por país.

5. **Expansão do Market Adapter (`lib/market/index.ts`):**
   * Adicionado suporte ao mercado da Itália (`IT`), totalizando 13 mercados com regras nativas de ATS e currículo declaradas.

---

## 2.26 Revisão visual de todo o app — uma paleta, não sete

Pedido do usuário: interface mais moderna, fácil de navegar e visualmente
agradável, mantendo a paleta de cores e a sobriedade em todo o app, sem alterar
funcionalidade, com backup do estado anterior caso o resultado não agradasse.

### O levantamento antes de qualquer mudança

Duas explorações completas (app autenticado + landing) levantaram o estado real
do sistema de design antes de propor qualquer coisa. A conclusão mudou o
enquadramento do pedido: **a paleta "existente" não era uma coisa só.**

Era duas coisas coexistindo. Primeiro, uma paleta de marca de fato usada e
consistente — navy `#0B192E` e azul `#0B63E5` —, mas escrita como hex literal
centenas de vezes espalhado por `app-shell.tsx`, `upload-view.tsx`,
`plans-view.tsx`, `dashboard.tsx`, sem nenhum token central. Três gradientes
escuros diferentes (`#0B192E→#0B63E5` no rodapé da sidebar,
`#0B192E→#1A2E4B→#0B192E` no hero do upload, `#0F172A→#1E1B4B→#312E81` no
banner do dashboard) faziam o mesmo papel — "painel premium" — sem serem o
mesmo gradiente.

Segundo, um sistema de tokens shadcn (`globals.css` + `tailwind.config.ts`) que
existia, tinha dark mode pronto, mas era cinza puro — não conhecia a marca — e
tinha uma armadilha: o projeto é Tailwind v4, com `@theme inline` no CSS
mapeando `--color-primary: var(--primary)` direto (sem `hsl()`), que é o
mecanismo que de fato gera as classes. O `tailwind.config.ts`, com
`hsl(var(--primary))` e `content` apontando para `./app/**`, `./components/**`
(pastas que não existem neste repositório, que usa `src/`), não tinha
`@config` nenhum ligando ele ao CSS — **não estava quebrado, estava morto**,
um resíduo do Tailwind v3 que sobrou do scaffold do shadcn e nunca foi
carregado. Distinguir "quebrado" de "morto" importava: consertar um arquivo
morto não muda nada visível, e gastar a revisão nisso seria desperdício.

Em cima dos dois sistemas, pelo menos 7 tons soltos (slate, sky, violet, amber,
emerald, blue, indigo) decidiam cor tela por tela sem mapa de significado:
o estado ativo do menu lateral era emerald, sem relação com a marca; o botão de
admin tinha forma diferente (`rounded-xl` com sombra) dos itens de navegação
logo abaixo (`rounded-lg`, sem sombra); os badges de status do histórico de
currículos usavam 5 cores (slate/sky/violet/amber/blue) sem progressão nem
critério; o card de upsell usava amber, que em outro lugar da mesma tela
significava "carregando".

A landing page, por outro lado, já era a parte mais disciplinada
visualmente — só usa a paleta de marca, sem tons soltos. O problema lá era de
conteúdo: o grid de 6 features nunca mencionava Radar de vagas, orientação de
carreira ou carta de apresentação — três entregas reais do produto, já
vendidas na lista de itens do plano (`t.pricing.items`), mas invisíveis como
"qualidade" para quem decide comprar.

### O backup, antes de tocar em qualquer arquivo

Tag `backup-pre-design-refresh-20260824` no commit que era `main`. Toda a
revisão aconteceu na branch `design-refresh-2026-08` — `main` não foi tocado
em nenhum momento, e nada foi publicado em produção durante o trabalho.

### Fase A — a fundação de cor, um arquivo só

`globals.css` ganhou `--primary` (o azul da marca, `#0B63E5`, até então
hardcoded em dezenas de lugares) e `--brand-navy` (`#0B192E`), com o mapa de
uso documentado em comentário no próprio arquivo: `primary` para ação
principal/CTA/link/ativo; `emerald` para sucesso; `amber` para atenção/
pendência; `destructive` (já existia) para erro; `violet` reservado só para a
área admin; `slate` para neutro estrutural. Nenhum tom fora desse mapa deveria
entrar sem atualizar o comentário.

Decisão explícita de não tocar em `tailwind.config.ts` — é código morto, como
descrito acima, e mexer nele não muda nada visível. O risco de tocar num
arquivo que parece central mas não é seria maior que o benefício de "arrumá-lo"
por estética.

### Fase B — o shell, onde todo mundo entra primeiro

`app-shell.tsx`: o estado ativo do menu lateral passou de emerald (sinal sem
relação com a marca) para `primary`. O botão de admin ganhou a mesma
forma/peso dos itens de navegação — a cor violeta ficou, porque virou a
identidade documentada da área admin na Fase A, e destoar em forma não
acrescentava nada a essa distinção. A gambiarra de `<span>` aninhado que
particionava "Análises Ilimitadas (Admin)" em pedaços por breakpoint virou duas
strings simples. O breadcrumb parou de mostrar "Painel › Painel" quando a tela
atual já era o painel. Zero hex solto restante no arquivo.

### Fase C — o sweep, tela por tela

Todas as telas de `src/components/app/` passaram pela mesma pergunta: este tom
aqui está contando uma história (como o indigo do Radar, ou o emerald do
Perfil Profissional — cada tela grande pode ter sua cor de identidade própria,
e isso ajuda a orientação, não atrapalha) ou é só decoração sem critério?

Onde era decoração sem critério, a correção repetiu um padrão: itens **pares**
(4 badges de feature no upload, 4 atalhos rápidos no dashboard, 3 cards de
download) que tinham cada um sua cor sem relação nenhuma entre si viraram um só
tratamento consistente (`primary`), diferenciados por ícone e texto — não por
tom. Onde era progressão de **estado** (o `statusMap` de currículo, repetido
igual em `dashboard.tsx` e `history-view.tsx`), a cor passou a contar a mesma
história nos dois lugares: neutro → informativo (`primary`) → pendente
(`amber`) → concluído (`emerald`) → confirmado (`primary` sólido). Onde era um
card isolado com borda colorida sem nenhum outro card da mesma tela seguindo o
padrão (dois casos em `professional-profile-view.tsx`, um em
`settings-view.tsx`), a cor foi removida — a consistência ali era a maioria
neutra, não a minoria colorida.

Dois arquivos foram deliberadamente **preservados**: `radar-view.tsx` (indigo
como identidade da tela, já bem cuidado) e `analysis-view.tsx` (cor por
categoria de entrega ao longo do laudo — sky/indigo/violet por tipo de
seção — sistema grande e consistente por si, fora do escopo desta varredura;
só os 3 hex soltos que restavam viraram token).

`dashboard.tsx` também perdeu uma duplicação: o saldo de análises aparecia
duas vezes na mesma tela (banner grande no topo e um card de estatística
abaixo repetindo o mesmo número). O card de estatística saiu — o grid de stats
passou de 3 para 2 cards com dado que não se repete em lugar nenhum.

Ao final da Fase C, zero hex de marca hardcoded restava em qualquer arquivo de
`src/components/app/`, e violeta só aparecia em contexto admin ou nos dois
arquivos preservados.

### Fase D — a landing, e o que ela nunca mostrou

`t.features` (em `src/lib/i18n/index.ts`) tinha exatamente `f1`..`f6`
hardcoded no tipo `Translations` — acrescentar um recurso exigia mexer no
tipo, não só nos três idiomas. Ganhou `f7`..`f9`: Radar de Vagas com IA,
Orientação de Carreira, Carta de Apresentação Direcionada — nos três idiomas
(pt/en/es), no mesmo tom e tamanho dos 6 existentes, sem mencionar fonte de
dados, nome de ATS parceiro ou arquitetura interna (mesmo cuidado já registrado
num commit anterior deste projeto sobre a landing).

O grid de `#features` virou 3×3 (era 2×3), com os ícones vindos de imports que
já existiam no arquivo e nunca eram usados (`FileSearch`, `TrendingUp`,
`Edit3`) — nenhum import novo. A ordem ganhou sentido em blocos: diagnóstico/
descoberta (8 Dimensões, Radar, ATS) → preparação (Reescrita, Orientação,
Carta) → entrega/confiança (Presença Digital, PDF, Privacidade). Radar fica na
segunda posição do grid — visível sem rolar, ao lado do recurso mais antigo e
mais reconhecido do produto.

Dois itens do plano original ficaram **de fora**, por decisão registrada
antes de escrever qualquer linha: uma seção de destaque dedicada ao Radar na
landing (repetindo o padrão "janela de app falsa" da seção `#social`) — mais
arriscada de acertar de primeira num único passe, e não necessária para
resolver o pedido; e uma estatística nova no hero sobre o Radar — sem métrica
real e auditável disponível para preencher ali, e inventar número contraria
uma regra permanente do produto (seção 4 deste documento, item 1).

### O que ficou pendente

Verificação visual nas telas autenticadas. O agente que fez esta revisão não
tem — e não pode ter, por regra de segurança — credencial de login, então não
consegue abrir dashboard, upload, perfil, radar, planos, histórico, downloads,
configurações nem suporte para conferir visualmente. `tsc --noEmit`, `eslint`
e `npm test` (510/510) ficaram limpos a cada um dos commits das quatro fases,
mas isso garante que o código compila e não regride lógica — não garante que
o resultado visual agrada. O usuário optou por revisar tudo de uma vez ao
final, em vez de logar durante o trabalho. Fica registrado em
`docs/HANDOFF-CONTINUIDADE.md`, seção 7.7, como pendência aberta antes de
mergear a branch `design-refresh-2026-08` em `main`.

---

## 2.27 Hero reorganizado, e o problema estrutural por trás do laudo

Continuação da revisão visual (seção 2.26). Depois de ver o resultado, o
usuário pediu duas coisas mais específicas: o hero da landing "mais
organizado, moderno", mantendo a paleta; e uma revisão de UX nas telas
internas que mostram relatório/orientação/painéis — não mais cor, e sim
como a informação está organizada.

### O hero

`landing.tsx`: os blocos que ainda tinham hex solto (badge, título, CTAs,
card de mockup, blobs decorativos) passaram para os tokens `primary`/
`brand-navy`. A faixa de confiança abaixo dos CTAs (Free/No Card/
Security/Safe) trocou um `grid grid-cols-2` rígido — que forçava quebra de
linha torta em telas estreitas — por `flex flex-wrap`, que acomoda cada
item onde precisar. As 4 barras de dimensão do card de mockup usavam 3 tons
de azul e 1 de indigo sem critério; viraram uma cor só. Nenhum texto mudou.

### O achado que importava mais: abas falsas no laudo

Uma investigação (agente `Explore`, só leitura) nas 5 telas mais densas do
app achou um problema estrutural, não estético, em `analysis-view.tsx` — a
tela do laudo, 1496 linhas, o produto principal.

A tela tem 8 seções de conteúdo (visão geral, mídias sociais, match com
vaga, orientação vocacional, dimensões detalhadas, ajustes pontuais,
carta/resumo) navegáveis por uma barra de abas. Mas o estado padrão do
`activeTab` era `'all'`, e cada bloco de conteúdo checa
`activeTab === 'all' || activeTab === 'x'` — ou seja, **no modo em que a
pessoa cai ao abrir a tela, as 8 seções renderizam empilhadas na mesma
rolagem**. A barra de abas não trocava de tela: filtrava o scroll. Quem
clicava numa aba just via as outras sumirem, mas a página continuava do
mesmo tamanho gigante.

Consequência colateral: ao trocar de aba pra ler um detalhe (a carta, a
orientação), a nota geral — que só existe dentro do bloco "Score &
Veredito" — sumia da tela. Não havia nenhuma referência fixa do "8.7/10"
enquanto se lia o resto.

### O que foi corrigido, e o que foi decidido não tocar

**`activeTab` inicial passou de `'all'` para `'overview'`.** Uma linha.
A pessoa passa a cair numa visão focada, não numa rolagem de 8 seções.
"Visão Completa" continua existindo como opção — nada foi removido, só
deixou de ser o primeiro contato.

**Faixa de resumo fixa, nova.** Uma faixa `sticky top-14` (14 = altura do
cabeçalho do app-shell) aparece quando `activeTab` é diferente de
`'overview'`/`'all'`, mostrando nota geral + status ATS + um atalho de
volta. Reaproveita `score`, `hasScore`, `scoreColor`, `a.atsFriendly` —
todos já calculados no componente — sem introduzir lógica nova.

**Decisão registrada: não trocar a barra de abas hand-rolled pelo
componente `Tabs` do shadcn.** A cor por aba não é decoração sem critério
como em outros lugares já corrigidos nesta revisão — a aba "Match Vaga"
herda a cor de severidade do próprio resultado (vermelho/âmbar/verde),
então quem está noutra aba vê que há um problema sem precisar abrir. Trocar
pelo primitivo tocaria as 8 seções condicionais espalhadas por um arquivo
de 1500 linhas, por um ganho majoritariamente de acessibilidade/semântica —
risco alto para o momento. Fica como melhoria futura, não feita agora.

**Tipografia do texto de leitura longa** (parecer executivo, justificativa
por dimensão, orientação vocacional, carta de apresentação, resumo
profissional, pontos fortes/fracos, recomendações, trechos a ajustar) subiu
de `text-xs`/`text-[10px]`/`text-[11px]` para `text-sm`. Títulos de seção e
rótulos pequenos (badges, contadores) não mudaram — só a massa de texto que
a pessoa de fato lê linha a linha.

### `professional-profile-view.tsx` — o formulário que não mostrava o que faltava

A tela promete, no próprio texto ("Preencha aos poucos — nada é
obrigatório"), um preenchimento incremental. Mas era um formulário de 6
`Card`s em rolagem única, sem nenhum jeito de ver o que já tinha sido
preenchido sem rolar tudo.

As 5 seções de dado (Identidade profissional, Objetivos, Onde está/quer
trabalhar, Preferências de trabalho, Idiomas — o cartão de intro/CTA
"Preencher com o que já sei sobre você" não é seção de dado, ficou como
estava) viram um `Accordion` do shadcn (`type="multiple"`, pra não forçar
fechar uma seção pra abrir outra — incremental não deveria exigir isso).

Cada cabeçalho de seção ganhou um indicador — badge "Preenchido" — calculado
por checagem direta de presença nos campos daquela seção (ex.: Identidade =
`currentTitle || field || seniority || ...`), sem estado novo: é leitura do
`profile` que a tela já mantinha. Seção sem dado abre sozinha; as demais
começam fechadas — dá pra ver de relance o que falta sem abrir nada.

### O que ficou de fora, por decisão

`dashboard.tsx` e `radar-view.tsx` já tinham sido avaliados como bem
organizados na mesma investigação (a única redundância do dashboard — saldo
duplicado — já tinha sido corrigida na etapa anterior desta revisão) e não
entraram neste passo. Verificação visual continua pendente pelo mesmo
motivo da etapa anterior — sem credencial de login, o agente não confere
telas autenticadas; fica para o usuário revisar no dev server ou Preview.

---

## 2.28 Três achados de produção, e um deles ainda em aberto

O usuário trouxe três sintomas observados em produção depois do deploy: um
padrão de erro repetido no log de IA, uma fonte do Radar marcada como sempre
falhando, e o seletor de idioma sem efeito depois do login. Nenhum dos três
tinha relação com os dois anteriores.

### `adzuna:br` "nunca teve sucesso" — resolvido

Detalhe completo no commit `2f875bd`. Resumo: o painel calculava saúde da
fonte a partir de `decision.reliable`, que só é `true` numa coleta COMPLETA.
A Adzuna é fonte de busca grande e estoura o teto de páginas por termo **toda
rodada**, por desenho (seção 2.20) — `outcome: 'partial'` é o resultado
normal dela, não uma falha. `sourceStateAfter` tratava os dois como a mesma
coisa: `consecutiveFailures` crescia pra sempre e `lastSuccessfulCollection`
nunca avançava, mesmo a fonte entregando vaga real todo dia (293 no banco).

`CollectionDecision` ganhou um campo novo, `healthy`, separado de `reliable`:
`reliable` continua controlando só o que pode fechar vaga por ausência (sem
mudança de comportamento); `healthy` decide o que o painel mostra —
verdadeiro para `partial` que trouxe vaga real, falso para `partial` vazio
(esse sim parece falha no meio do caminho) e para as falhas de verdade.

### `profile_extraction` falhando — causa raiz encontrada, correção pendente

Log observado: DeepSeek consumiu o orçamento de saída "pensando"
(13-14 mil caracteres de raciocínio) sem chegar a responder; Kimi expirou
por tempo; Claude foi pulado por falta de orçamento — os três provedores da
cadeia falharam na mesma chamada.

Causa: a DeepSeek aposentou `deepseek-chat` — o apelido do V4-Flash em modo
**não-pensante** — em 24/07/2026 (já registrado em `registry.ts`, linha 34).
O que restou, `deepseek-v4-flash`, sempre raciocina antes de responder, e o
roteador **não tem como desligar isso para esse provedor**: `disableThinking`
(pedido explicitamente por esta rota, em `suggest/route.ts`) só é de fato
aplicado no branch do Claude (`router.ts`, linha 222) — no branch OpenAI-
compatible que atende DeepSeek e Kimi (linha 339 em diante) esse parâmetro
nunca é lido. O piso de tokens (`JSON_TASK_TOKEN_FLOOR = 4000`) ajuda mas não
resolve: o raciocínio observado já consome perto disso sozinho.

Efeito em cadeia: DeepSeek gasta ~30s "pensando", Kimi mais ~16s, e não sobra
orçamento dentro dos 52s para o Claude — que é descrito no próprio código da
rota como "o único que nunca falhou nesta tarefa".

Não é só `profile_extraction`: `free_preview`, `support_chat` e
`normalization` também têm o DeepSeek como primário (`registry.ts`,
`INITIAL_TASK_ROUTING`) e correm o mesmo risco estrutural.

**Resolvido em 25/08/2026 (commit `5c37f71`), por decisão do usuário.** Entre
trocar o provedor principal por Claude e aumentar o teto de tokens, escolheu
a segunda depois de ver o custo: `JSON_TASK_TOKEN_FLOOR` subiu de 4.000 para
16.000 (4x). O raciocínio observado nas falhas não passou de ~3.500 tokens —
o piso novo dá folga sem aumentar gasto real, porque o provedor cobra pelos
tokens GERADOS, não pelo teto. Kimi K3 já era o primeiro suplente do DeepSeek
em `FALLBACK_CHAIN`; ficou explícito em comentário, sem mudança de
comportamento. Vale para as quatro tarefas que compartilham esse branch do
roteador.

### Idioma sem efeito depois do login — registrado, não é bug do seletor

O `LanguageSelector` funciona: atualiza `lang` no `I18nContext` e persiste em
`localStorage` corretamente. O problema é estrutural, não um defeito pontual:
**só a landing e partes de duas telas (`plans-view.tsx`, `app-shell.tsx`) leem
`useI18n`/`t.*`**. Todas as demais telas autenticadas —
`analysis-view.tsx` (o laudo, a mais importante), `dashboard.tsx`,
`upload-view.tsx`, `radar-view.tsx`, `professional-profile-view.tsx`,
`rewrite-view.tsx`, `history-view.tsx`, `downloads-view.tsx`,
`settings-view.tsx`, `support-view.tsx` — têm texto 100% fixo em português,
nunca tocam o contexto de idioma. Trocar o idioma no seletor não tem o que
mudar nessas telas porque não há nada ali lendo o estado que ele altera.

Decisão do usuário: não corrigir agora — é um trabalho grande (traduzir ~10
telas para o sistema `t.*` já usado na landing, em 3 idiomas), registrado
aqui como pendência conhecida para planejar depois, não como bug a caçar.

---

## 2.29 Itália operacionalizada, e a Adzuna deixa de ser rodízio

Depois do achado da seção 2.28, o usuário perguntou por que a cobertura era
tão limitada "sendo plataforma global" e pediu pra calcular um orçamento
maior. No caminho, achou que o produto atendia 15 países — são 13 mercados
no catálogo (`lib/market/index.ts`) + GLOBAL, e a Adzuna só cobria 10 deles.
A Itália (`IT`) tinha sido adicionada ao catálogo de mercado por outra sessão
(seção 11) mas **nunca foi testada nem ligada à busca de vagas** — gap real,
achado ao investigar a pergunta.

**Itália verificada e ligada.** Testada contra
`api.adzuna.com/v1/api/jobs/it/search/1?what=analista`: HTTP 200, vaga real.
Ela devolve o nome do país em italiano ("Italia", sem acento) — diferente do
"Itália" em português já cadastrado — então um alias novo entrou em
`lib/market/countries.ts`, mesmo padrão já usado para "brazil"/"united
states"/"united kingdom". `ADZUNA_COUNTRIES` (`adzuna-plan.ts`) sobe de 10
para 11.

**Três opções calculadas, e a decisão.** Com a cota gratuita da Adzuna
(2.500 req/mês) usando só ~15% (372/mês, rodízio de 4 países por vez), havia
folga real. Três combinações foram calculadas para caber num teto de
1.500/mês:

| Opção | Países | Termos | Páginas | Req/mês |
|---|---|---|---|---|
| A | 11 (todos) | 4 | 1 | 1.240 |
| B | 11 (todos) | 5 | 1 | **1.705** ← escolhida |
| C | 11 (todos) | 3 | 2 | 2.046 |

Escolhida a B: mais categorias de cargo por país (5 termos) sem reduzir a
folga pra busca sob demanda (§21, ainda não implementada) abaixo da reserva
de 20% (500) — C deixaria só 454, C foi cogitada primeiro e descartada por
isso.

**O que muda de verdade, além do volume.** As três opções tinham em comum
`maxCountries: 11` — os onze países cobertos cabem numa rodada só. Isso
acaba com o rodízio na prática: antes um país esperava até 3 dias pra ser
revisitado (4 por vez, 10 no total); agora todo mercado é varrido todo dia.
O código do rodízio por `lastCollectionAt` continua existindo — ele só deixa
de ser exercitado enquanto o número de países cobertos não crescer além do
que uma rodada cobre.

Commit `08424db`. 525 testes, `tsc`/`eslint` limpos.

---

## 2.30 Medir antes de automatizar — qualidade e maturidade por fonte de vaga

O usuário pediu um agente que aprenda a dinâmica do mercado de vagas — tempo
de renovação, qualidade — para que, quando tiver "conhecimento robusto",
possa um dia gerenciar a busca sozinho, "com lógica, com razão e com bom
senso". Antes de automatizar qualquer coisa, a etapa certa é medir — e medir
o quanto dá para confiar em cada medida, não só a medida em si.

**O que existe agora.** `lib/analytics/job-source-quality.ts`, função pura no
mesmo padrão de `market-performance.ts` e `decideCollection`. Por fonte
(`adzuna:br`, `greenhouse`, `gupy`...), calcula:

- **Tempo de renovação** — média de dias entre `publishedAt` e `closedAt`,
  só quando há pelo menos 5 encerramentos observados. Abaixo disso o campo
  fica `null`, não vira média de amostra pequena — mesma regra do produto em
  todo lugar: ausência de dado não vira número inventado (§43).
- **Qualidade do dado** — % com salário informado, % com requisitos ou
  competências extraídos, % com título reconhecido pela taxonomia.
- **Rendimento real** — % dos alertas do Radar que essa fonte gerou como
  `strong`/`good`, e % de feedback 👍 entre quem respondeu (sem resposta
  fica `null`, nunca vira zero).
- **Maturidade** (`baixa`/`média`/`alta`) — a resposta à pergunta do usuário.
  Combina tamanho de amostra **e** janela de tempo observada. `alta` exige
  janela de pelo menos `STALE_AFTER_DAYS` (45 dias, a mesma janela que o
  produto já usa para dar uma vaga como encerrada) — confiar no padrão de
  renovação de uma fonte antes dela ter sido observada por um ciclo inteiro
  seria julgar o relógio antes de ele dar uma volta.

**Onde mora.** Nenhuma tabela nova, nenhum cron novo: lê `Job` e
`RadarAlert` direto na rota `/api/admin/quotas`, que já existia, e aparece
como seção nova no painel admin — "Qualidade e maturidade por fonte" —, ao
lado da saúde das fontes que já era mostrada ali.

**O que isto explicitamente não é.** Não decide nada sozinho, e não deveria
— é observação, não controle (§30: o produto não muda comportamento por
conta própria a partir de sinal indireto). A leitura continua sendo de uma
pessoa. O caminho para a automação que o usuário pediu passa por aqui: só
faz sentido considerar decisão automática quando a maturidade de uma fonte
chegar em `alta` de forma sustentada — e mesmo aí, é decisão a ser tomada
depois, não implementada nesta etapa.

10 testes novos (535 no total), `tsc`/`eslint` limpos.

## 2.31 Nenhuma IA por trás do "agente" de qualidade — e a mesma régua para os agentes de verdade

Pergunta direta do usuário sobre o módulo do §2.30: "qual a IA ficará por
trás desse agente?" A resposta é uma clarificação, não uma implementação —
`job-source-quality.ts` **não chama nenhum provedor de IA**. É uma função
pura que lê `Job`/`RadarAlert` e agrega números; "agente" ali era o nome que
o pedido original usou para o conceito, não uma indicação de que existe um
modelo de linguagem por trás. Vale registrar para não confundir com os
agentes de IA de verdade do produto (extração de perfil, carta, orientação
vocacional...), que são chamadas reais ao roteador (`lib/ai-router/`).

Aproveitando a pergunta, o usuário pediu a mesma régua de maturidade para
esses agentes de verdade — e para o sistema como um todo. Confirmado por
`AskUserQuestion`: maturidade do sistema combina confiabilidade dos agentes
de IA (`AiLog`) **e** incidentes (`SystemIncident`), não só uma das duas.

**`lib/analytics/agent-maturity.ts`** (novo, mesmo espírito do §2.30, agora
aplicado a `AiLog`/`SystemIncident` em vez de `Job`/`RadarAlert`):

- `calculateAgentMaturity()` agrupa `AiLog` por `TaskType` (cada tipo de
  tarefa do roteador é um "agente": extração de perfil, carta, orientação
  vocacional...) e calcula taxa de sucesso (`success` + `fallback` contam,
  só `error` é falha de vez), taxa de failover, tempo médio de resposta, e
  nota média de qualidade — só quando há pelo menos 5 amostras julgadas
  pelo juiz existente, senão fica `null`, nunca vira média de amostra
  pequena.
- `calculateSystemMaturity()` faz a mesma leitura de volume/janela para o
  total de chamadas, e soma os incidentes: se há incidente grave
  (`high`/`critical`) ainda em aberto agora, a maturidade é rebaixada um
  nível — sistema com problema grave aberto não é "alta maturidade" nesse
  momento, não importa o volume histórico acumulado.
- Limiares de maturidade por agente: `baixa` com menos de 30 chamadas ou
  menos de 7 dias de janela; `média` até 200 chamadas ou 30 dias; `alta`
  acima disso — 30 dias é a referência porque cobre um ciclo mensal
  completo (variação de dia de semana incluída), mesmo raciocínio do
  `STALE_AFTER_DAYS` usado no §2.30, com limiares próprios porque chamada
  de IA acontece com frequência bem maior que coleta de vaga.

**Onde mora.** `GET /api/admin/dashboard` passou a ler `AiLog` (até 20 mil
linhas) e `SystemIncident` (até 5 mil) em paralelo com as demais consultas,
e expõe `agentMaturity`/`systemMaturity` na resposta. Aparece na aba
"Roteador de IA" do admin, abaixo do log de falhas operacionais: um card de
maturidade do sistema (chamadas totais, sucesso geral, incidentes,
incidentes graves em aberto, taxa de resolução) e uma grade de cards por
`TaskType`, mesmo padrão visual da seção "Qualidade e maturidade por fonte"
do §2.30.

**O que isto explicitamente não é**, mesma régua do §2.30: observação, não
controle. Nenhum agente passa a decidir nada sozinho a partir da própria
maturidade — a leitura continua sendo de uma pessoa.

10 testes novos (545 no total), `tsc`/`eslint` limpos.

## 2.32 A pendência do idioma (§2.28) fechada — as dez telas internas

O gap descrito no §2.28 — seletor de idioma sem efeito depois do login,
porque só a landing e partes de duas telas liam `useI18n`/`t.*` — foi
fechado nesta rodada, com o usuário autorizando modo autônomo por não estar
disponível nas horas seguintes.

**As dez telas** migraram para `useI18n`/`t.*`, uma por commit, cada uma
verificada com `tsc --noEmit`/`eslint`/`npm test` antes do commit:

| Tela | Commit | Chaves novas |
|---|---|---|
| Perfil Profissional | `cb0d3b0` | ~90 |
| Histórico | `885bf15` | 16 |
| Painel (dashboard) | `524373d` | — |
| Configurações | `3d86cb2` | ~48 |
| Suporte | `c57a224` | 16 |
| Downloads | `c208c37` | 36 |
| Reescrita | `49b46b9` | 51 |
| Radar | `47f123b` | 92 |
| Envio de Currículo | `68b7129` | 61 |
| Laudo (analysis-view) | `c7fed3a` | ~118 |

Mais de 500 chaves novas no dicionário (`lib/i18n/index.ts`), em pt/en/es,
seguindo o padrão já usado pela landing: `pt` copiado literalmente do texto
original, `en`/`es` traduzidos com o mesmo tom.

**Datas passaram a formatar no locale do idioma escolhido.** Novo helper
`localeForLang(lang)` em `lib/i18n/index.ts` (mapeia `pt→pt-BR`,
`en→en-US`, `es→es-ES`), usado em toda tela que chamava
`toLocaleDateString('pt-BR', ...)` fixo antes.

**O que ficou de propósito em português — três categorias, não é bug:**

1. **Conteúdo gerado pela IA por usuário.** O parecer executivo, as
   justificativas por dimensão, a orientação vocacional (`whyFit`,
   conselho de carreira), a carta de apresentação, o resumo/currículo
   reescrito — tudo isso é saída de IA já gravada em português para aquele
   usuário específico. Traduzir isso exigiria rodar a geração de novo no
   idioma alvo (mudança de arquitetura no backend, prompt precisa saber o
   idioma-alvo), não uma troca de string na tela. Fora do escopo desta
   rodada, que foi deliberadamente só de interface.
2. **Dado de terceiro.** No Radar, cargo/empresa/local/modalidade das
   vagas vêm das fontes externas (Adzuna, Gupy, Greenhouse...) no idioma
   original da vaga — não é texto do produto para traduzir.
3. **Valor persistido como chave, não como rótulo.** Nomes de plataforma
   em `professional-profile-view.tsx`/`upload-view.tsx`/`settings-view.tsx`
   (`LinkedIn`, `Gupy`, `GitHub`...) são gravados literalmente em
   `socialLinks` no banco — traduzir o rótulo mudaria o dado salvo
   dependendo do idioma da tela no momento do envio. Ficaram como estão,
   mesmo raciocínio em todas as telas que os usam.

Zero mudança de lógica de negócio, chamada de API ou estrutura de dado em
qualquer uma das dez telas — só o texto exibido trocou de string fixa para
`t.<tela>.*`. `tsc --noEmit`, `eslint` e `npm run build` limpos ao final;
suite de testes manteve os mesmos 545 (nenhuma destas telas tem teste
unitário dedicado — é toda mudança de apresentação).
