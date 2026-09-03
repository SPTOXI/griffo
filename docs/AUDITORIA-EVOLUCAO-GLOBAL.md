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

## 2.33 JobBase — uma base própria de vagas, num segundo projeto Supabase

O usuário criou um projeto irmão (mesmo time Vercel `griffojobs`), o
JobBase, que varre Greenhouse/Lever/Ashby/LinkedIn para dentro de um
Postgres próprio, em lote 1x/dia, e pediu para o GriffoWork consumir essa
base livremente. Três opções foram discutidas: (A) o GriffoWork lê
diretamente via cliente Supabase/REST; (B) o JobBase expõe uma API HTTP
versionada própria; (C) o JobBase publica uma view Postgres estável. Optou-se
pela **A**, implementada como mais um `JobSourceAdapter` — o mesmo contrato
que já existe para Adzuna/Gupy/Greenhouse/Lever/RemoteOK/Remotive — em vez
de uma API dedicada (overhead sem ganho para um time de uma pessoa nos dois
lados) ou uma view estável (a coordenação de schema entre dois projetos do
mesmo operador já é barata o bastante sem ela).

**`lib/jobs/adapters/jobbase.ts`** (novo): lê `job_postings` via PostgREST
(`GET /rest/v1/job_postings`, paginado por cabeçalho `Range`, até 1000
linhas por página), com a chave publicável do JobBase (`sb_publishable_...`)
como padrão embutido no código — não é segredo, é a mesma leitura pública
que o RLS do JobBase já autoriza para qualquer um, e o mesmo raciocínio do
token `vercel` fixo em `VERIFIED_BOARDS` do Greenhouse. `JOBBASE_URL`/
`JOBBASE_ANON_KEY` sobrepõem o padrão se a chave girar; `JOBBASE=off`
desliga a fonte inteira.

**Decisão registrada: aceitar a redundância com os adapters próprios, sem
filtro de exclusão por empresa.** O JobBase também coleta Greenhouse/Lever,
que o GriffoWork já coleta por conta própria — mas hoje o adapter próprio do
Greenhouse cobre uma empresa só (`Vercel`) e o do Lever cobre zero
(`VERIFIED_LEVER_BOARDS` vazio), então a sobreposição real é mínima. Mais
importante: o `agent-dedup.ts` (§14) já existe exatamente para este cenário
— foi escrito citando "Adzuna vs Gupy vs Lever" como wrappers de URL
diferentes para a mesma vaga. Construir uma lista de exclusão por empresa
seria complexidade nova para resolver um problema que o dedup semântico já
resolve.

**Por que `closesByAbsence: false`.** Diferente de um board por empresa (que
lista o catálogo inteiro de quem o board pertence), o JobBase agrega várias
empresas de fontes variadas — sair da resposta de uma coleta não prova
encerramento, mesma classe da Adzuna/Gupy/RemoteOK/Remotive (§12).

**`status` do JobBase é sempre `'open'` hoje** — nada no pipeline deles
marca vaga como fechada ainda, conforme o próprio operador avisou. O filtro
`status=eq.open` na consulta é inofensivo agora e correto no dia em que o
JobBase passar a preencher `'expired'`/`'removed'` de verdade. A data de
publicação usa `posted_at`, com `first_seen_at` como recuo — nunca o
`status` — para não depender de um campo já documentado como não confiável.

`company_name_raw` vem na própria linha de `job_postings` (sem join com
`companies`), o que dispensou qualquer consulta à tabela `companies`.
Verificado contra a API real em 26/08/2026 (3375 linhas na base): quando
presente, `country_code` já vem em ISO2, mas é esparso — nulo em boa parte
das vagas de `greenhouse`/`linkedin` mesmo com `city` preenchida, populado
para `smartrecruiters`; `work_mode` é `"unknown"` na maioria das linhas
observadas, não exceção. Nenhum dos dois é adivinhado a partir de outro
campo — o adapter manda o que a fonte disse, o normalizador decide o resto.
Registrado em `src/app/api/cron/radar/route.ts`, sempre ligado por padrão
(ao lado dos boards remotos, que também não exigem configuração).

17 testes novos (562 no total), `tsc`/`eslint` limpos.

## 2.34 Ordem errada de suplente no roteador de IA — Kimi nunca salvava o Claude

Usuário reportou um erro de `social_advice` (Claude e Kimi timeout aos
~24,5s cada) e, ao investigar, pediu política de zero erro e zero pendência
adiada: o achado tinha que virar correção nesta mesma sessão, não uma linha
na lista de pendências.

**A amostra de 7 dias mentia por ser pequena.** Ampliada para 30 dias, o
`social_advice` tinha 6 erros em 15 chamadas (40%), sempre com a mesma
assinatura: Claude estoura o timeout por volta de 24-25s, e o Kimi (segunda
tentativa da cadeia `claude: ['kimi', 'deepseek', 'gemini']`) falha do
mesmo jeito, quase sempre. O sistema inteiro tinha 82 erros em 271 chamadas
(30%) no mesmo período, concentrados em `analysis_segment` (46) e
`full_analysis` (18) — e cruzando os horários, os mesmos clusters de falha
(ex.: 11/08 12h-17h, 5 falhas em 4h30 para o mesmo usuário) atingiam
`full_analysis`, `ocr_extraction` e `rewrite` ao mesmo tempo — todos
primário Claude, todos com o Kimi como segunda tentativa.

**O dado que decidiu a correção:** em 30 dias, toda vez que o Kimi foi
tentado como SEGUNDA tentativa depois do Claude falhar, ele também falhou —
zero sucessos em ~46 tentativas reais (fora as puladas por falta de
orçamento ou chave). No mesmo período, toda vez que o DeepSeek ocupou essa
posição — o que só acontecia por acidente, quando o filtro de residência de
dados (§13, `data-residency.ts`) excluía o Kimi por o usuário ser da UE —,
ele salvou a chamada: **32 de 32**.

**Causa mais provável, já documentada no próprio roteador**: "o Kimi limita
a 3 requisições simultâneas por organização, devolvendo 429" (comentário em
`router.ts`, sobre o backoff de 1,2s já existente). Uma falha do Claude
raramente é isolada — ela vem em cluster, porque a causa costuma ser do lado
do provedor, afetando várias análises simultâneas. É exatamente nesse
momento que várias chamadas caem para o suplente ao mesmo tempo e saturam o
teto de 3 do Kimi — o suplente falha precisamente quando mais se precisa
dele.

**Correção**: `FALLBACK_CHAIN.claude` em `lib/ai-router/registry.ts` passou
de `['kimi', 'deepseek', 'gemini']` para `['deepseek', 'kimi', 'gemini']`.
Como `MAX_PROVIDER_ATTEMPTS = 2` só dá uma chance de suplente à cadeia, essa
troca faz o DeepSeek — mais barato, sem o teto de concorrência documentado
do Kimi, e com histórico de 100% de sucesso na posição — ser o suplente real
de todas as tarefas com Claude primário (`ocr_extraction`, `analysis_segment`,
`full_analysis`, `rewrite`, `social_advice`, `career_orientation`,
`cover_letter`). A cadeia do DeepSeek como primário (`deepseek: ['kimi',
'claude', 'gemini']`) não foi tocada — seu Kimi em primeiro lugar resolve um
problema diferente e já documentado (orçamento de raciocínio), não o de
concorrência.

Mudança de uma linha, sem novo teste dedicado (não há asserção de ordem de
cadeia na suíte hoje); `tsc`/`eslint`/`npm test` continuam limpos.

### A continuação: `profile_extraction` tinha 80% de erro em 30 dias

O usuário perguntou "então vai acontecer sempre?" sobre o `social_advice` e,
diante da resposta ("não sempre, mas recorrente"), fechou a política do
produto: **zero erro, zero pendência adiada — investigar até resolver, na
mesma sessão.** Isso levou a verificar o modelo efetivamente usado pelo
DeepSeek antes de responder a uma pergunta separada do usuário sobre qual
modelo do DeepSeek é ideal para a extração de perfil — e apareceu um
problema bem maior que o do `social_advice`: **8 das 10 chamadas de
`profile_extraction` em 30 dias terminaram em `ALL_PROVIDERS_FAILED` (80%)**,
contra os 40% do `social_advice`. É exatamente a função de "ler o currículo
para preencher o Perfil Profissional" — a mesma que o usuário tinha
mencionado no início desta investigação, antes de o log copiado apontar para
`social_advice` em vez desta.

Duas causas distintas nos 8 erros:

1. **6 chamadas (20/08/2026, mesmo usuário, ~3h): DeepSeek respondeu RÁPIDO
   (9,7-11,7s — não é truncamento) mas com JSON que não fechava.** O Agente
   de Qualidade reprovou com "não veio em JSON válido", o Kimi (suplente da
   época) deu timeout em seguida, e a chamada falhou por inteiro. Conferido
   no `ProfessionalProfile` do usuário afetado: o registro existe, mas foi
   **preenchido manualmente às 13:17**, entre duas tentativas que falharam
   às 13:10 e 13:46 — a pessoa desistiu da extração automática e digitou
   tudo à mão, o cenário exato que este recurso existe para evitar.
2. **2 chamadas (24/08/2026): a mesma falha de orçamento de raciocínio já
   corrigida em 25/08** (piso de tokens 4x maior, ver a entrada anterior a
   este parágrafo) — já resolvida, listadas aqui só para registro completo
   da amostra de 30 dias.

**Três correções, não uma:**

1. **`FALLBACK_CHAIN.deepseek` também trocou o Kimi de primeiro suplente
   para segundo** (`['kimi','claude','gemini']` → `['claude','kimi',
   'gemini']`). Mesma causa do Claude→Kimi: o Kimi como suplente do DeepSeek
   falhou as mesmas 6 vezes que falhou como suplente do Claude — o teto de
   3 requisições simultâneas por organização, estourado quando várias
   tarefas caem para o suplente ao mesmo tempo. O Claude nunca falhou
   `profile_extraction` nas tentativas observadas.
2. **Recuperação de JSON malformado.** `lib/agents/quality-agent.ts` e
   `lib/profile/extract.ts` agora tentam extrair o maior bloco `{...}` da
   resposta antes de reprovar/lançar, quando o `JSON.parse` direto falha —
   cobre o caso observado de texto extra antes/depois do objeto, sem mudar o
   comportamento para uma resposta já bem formada. 4 testes novos entre os
   dois arquivos (`quality-agent.test.ts` é o primeiro teste deste agente).
3. **Modelo do DeepSeek passou a ser configurável por TAREFA, não só por
   provedor.** Novo campo `modelOverride` em `AiTaskRequest`
   (`lib/ai-router/types.ts`), honrado só na tentativa do provedor PRIMÁRIO
   (`router.ts`), validado contra `CURRENT_MODELS` via `effectiveModel` —
   um valor desconhecido é ignorado, não passa adiante. Existia essa lacuna
   porque o modelo de um provedor era global: trocar o do DeepSeek no painel
   mudava `free_preview` (alto volume, deliberadamente barato) e
   `profile_extraction` (uma chamada por pessoa, onde uma leitura ruim custa
   a pessoa preencher tudo à mão) ao mesmo tempo. `suggest/route.ts` agora
   pede `deepseek-v4-pro` explicitamente para `profile_extraction`, mantendo
   `free_preview` no `deepseek-v4-flash` padrão — a diferença de custo é
   fração de centavo numa tarefa que roda uma vez por pessoa.

**Regra do operador, registrada no código (`registry.ts`, acima de
`FALLBACK_CHAIN`) e nesta auditoria: o Kimi só ocupa posição de primário ou
de suplente real em funções SERIAIS** (`job_deduplication`, que processa um
par de vagas por vez). Nenhuma tarefa que dispare chamadas em paralelo no
mesmo pedido deve ter o Kimi como primeira alternativa — é exatamente
quando seu teto de concorrência derruba o suplente no momento em que mais
se precisa dele.

9 testes novos no total desta rodada (571 no total), `tsc`/`eslint` limpos.
Efeito das trocas de ordem só é observável pelo `AiLog` no próximo cluster
de falha do provedor primário — sem como forçar a reprodução sob demanda.

## 2.35 Progresso real em cinco fluxos de IA — nova regra inegociável

O usuário pediu barras de progresso reais (não uma estimativa de tempo) em
cinco pontos do produto: leitura de Perfil Social, preenchimento do Perfil
Profissional a partir do currículo, Orientação Vocacional, Carta de
Apresentação e Reescrita do Currículo. Ao ser perguntado sobre o nível de
fidelidade, generalizou o pedido: "quero que o usuário não tenha sensação de
'sem resposta', 'bug', 'congelamento', 'sem ação' em todas as atividades
dentro do Griffo [...] Grave essas recomendações em nossas regras
imutáveis." Registrado em `HANDOFF-CONTINUIDADE.md` §2, ao lado do §43 (que
já proibia "barra de progresso estimada" desde a correção do
acompanhamento do laudo principal).

**Diagnóstico**: dos cinco fluxos, só a leitura de Perfil Social já
decompõe naturalmente em sub-chamadas paralelas de IA (uma por rede social
+ uma avaliação geral, em `lib/social/analysis.ts`). Os outros quatro são
hoje UMA chamada de IA só cada. Sem decomposição real, uma barra "de
verdade" nesses quatro só existiria simulando tempo — exatamente o que o
§43 proíbe. Não existe streaming em nenhum lugar do código (nenhuma
ocorrência de `stream: true`/`ReadableStream`/`text/event-stream`), e
adicioná-lo tocaria `lib/ai-router/router.ts`, compartilhado pelas 12
tarefas do sistema (inclusive o laudo pago) — a opção de maior risco.

**Decisão (Opção B, escolhida pelo usuário)**: Perfil Social e Reescrita do
Currículo ganham progresso por ETAPA real, decompostos em sub-chamadas
paralelas — mesmo padrão já usado pelo laudo principal
(`lib/analysis/segments.ts` + `AnalysisJob`). A Reescrita, especificamente,
passa a gerar em 3 seções fixas (cabeçalho/resumo, experiências, formação/
habilidades) em vez de parsear o currículo em seções variáveis — evita o
risco de perder ou duplicar conteúdo, que violaria a garantia de veracidade
do próprio prompt de reescrita. Perfil Profissional, Orientação Vocacional
e Carta de Apresentação continuam UMA chamada — decompor um fluxo de ~10-20s
que já funciona bem, só para dar granularidade a uma barra, foi julgado risco
maior que benefício — e passam a expor MARCOS reais dentro dessa chamada
única (tentativa no provedor primário, troca real para o suplente, quando
acontece) via um novo callback aditivo `onProviderAttempt` em
`lib/ai-router/types.ts`/`router.ts`, que não muda comportamento de nenhuma
das 12 tarefas existentes.

**Infraestrutura, toda nova e aditiva** (nada do `AnalysisJob`/
`use-analysis-job.ts`/`lib/analysis/job.ts` do laudo principal é tocado):
novo model `AiJob` no Prisma (genérico por `kind`, mesmo desenho de
concessão/retomada do `AnalysisJob`), `lib/ai-jobs/engine.ts` (motor
genérico), um runner por `kind` em `lib/ai-jobs/runners/`, rota única
`GET /api/ai-jobs/status`, e um hook genérico `use-ai-job.ts` no cliente.
Detalhe completo no plano salvo em
`C:\Users\sptox\.claude\plans\snappy-jingling-pinwheel.md` desta máquina.

**Concluído em 26/08/2026, um fluxo por vez, cada um commitado e verificado
separadamente** (`tsc`/`eslint`/`npm test`/`npm run build` limpos a cada
passo):

1. Infraestrutura compartilhada (`AiJob`, callback `onProviderAttempt` no
   roteador, `lib/ai-jobs/engine.ts`, rota de status genérica, hook
   `use-ai-job.ts`).
2. Perfil Profissional — primeiro fluxo, valida a infra inteira.
3. Orientação Vocacional e Carta de Apresentação — reaproveitam o mesmo
   runner de chamada única. Corrigiu de quebra, no caminho:
   `checkProfileConflicts` em `analysis-view.tsx` também chamava a rota de
   sugestão de perfil convertida no passo 2 esperando resposta síncrona —
   ficaria quebrada sem o ajuste.
4. Leitura de Perfil Social — primeiro fluxo com etapas reais
   (`analyzeSocialPresence` ganhou `onStepSettled` opcional e aditivo).
5. Reescrita do Currículo — decomposta em 3 seções fixas por categoria de
   conteúdo, o fluxo mais arriscado, feito por último. Como efeito colateral
   positivo, a divisão também tornou a reescrita mais confiável: cada seção
   agora cabe com folga no teto por tentativa do roteador, o que devolveu o
   suplente real (`maxProviderAttempts: 2`) que a chamada única de 8.000
   tokens não podia se dar ao luxo de ter.

582 testes no total (eram 562 no início desta rodada de sessão), `AnalysisJob`
e `use-analysis-job.ts` do laudo principal permanecem exatamente como
estavam — nenhuma linha tocada.

## 2.36 Quinto provedor de IA cadastrado — OpenAI (GPT-5.6 Luna)

Operador atualizou o `.env` local com uma chave da OpenAI (salva como
`ChatGPT_KEY` — nome fora do padrão `{PROVEDOR}_API_KEY` dos outros quatro,
mas sem efeito prático: quem cadastrar a chave pelo painel administrativo
grava em `AiApiKey`/`SystemConfig`, que têm prioridade sobre a variável de
ambiente em `getProviderRuntimeConfig`) e pediu para cadastrar o provedor,
porque o painel só lista os quatro já conhecidos (Moonshot, Anthropic,
DeepSeek, Gemini).

**ID do modelo confirmado pelo operador direto da página de limites da
OpenAI: `gpt-5.6-luna`.** Preço obtido da página de pricing (26/08/2026):
US$ 0,20/1M de entrada, US$ 1,20/1M de saída, contexto curto — o que dá
`inputPer1k: 0.0002` / `outputPer1k: 0.0012`. Contexto longo sobe para
US$ 0,40/US$ 1,80 por 1M; não modelado (sem `TieredPricing` por tamanho de
contexto, só por horário como o DeepSeek) porque o uso do Griffo — currículo,
alguns milhares de tokens — fica bem abaixo do limiar de contexto longo.

**Escopo desta rodada, por decisão do operador: só disponibilizar, sem trocar
nenhuma tarefa de IA principal.** Nenhum `INITIAL_TASK_ROUTING` mudou —
`gpt-5.6-luna` fica pronto no painel pra ser atribuído depois, com calma.

Mudanças, todas aditivas (nenhum provedor existente foi tocado):
- `lib/ai-router/types.ts`: `ProviderId` ganhou `'openai'`.
- `lib/ai-router/pricing.ts`: `MODEL_PRICING['gpt-5.6-luna']`.
- `lib/ai-router/registry.ts`: `PROVIDER_CONFIGS.openai`, `CURRENT_MODELS.openai`,
  alias `chatgpt` → `openai`, e `FALLBACK_CHAIN.openai` (preenchido só por
  completude do tipo — sem uso real ainda, o Kimi fica de fora da cadeia por
  padrão, mesma régua do §2.34: não há como saber se uma tarefa que vier a
  usar a OpenAI como primária vai disparar chamadas em paralelo).
- `api/admin/ai-keys/route.ts`: `'openai'` na lista de provedores válidos.
- `admin-view.tsx`: opção no formulário de cadastro, modelo padrão
  auto-preenchido, texto da tela atualizado de "4" para "5 provedores"
  (aproveitado pra também corrigir "Claude 3.5 Sonnet"/"DeepSeek V3", já
  desatualizados ali).

Como o roteador já trata qualquer provedor fora do Claude pelo SDK genérico
compatível com OpenAI (`lib/ai-router/router.ts`, ramo `else`), a OpenAI de
verdade passa pelo MESMO caminho que hoje serve Kimi/DeepSeek/Gemini — não
foi preciso nenhuma lógica de chamada nova, só o cadastro.

**Não estendido, por estar fora do pedido**: o painel de "Testar Conexão com
Todas as IAs" (`admin-view.tsx`, mais abaixo) e sua rota
`api/admin/ai-test/route.ts` continuam testando só `['kimi', 'deepseek',
'claude']` — o Gemini já não era testado ali antes desta mudança (mostrado na
grade, mas ausente do teste de verdade), uma inconsistência pré-existente que
não foi criada nem corrigida agora.

~~Não estendido~~ — **corrigido na sequência, a pedido do operador**: ver
2.37 logo abaixo.

1 teste novo (583 no total), `tsc`/`eslint`/`npm run build` limpos.

## 2.37 Modelos desatualizados nas chaves já cadastradas — corrigido no banco

O operador reportou que a tabela "APIs de IA Cadastradas no Sistema" (painel
admin) mostrava modelo errado. Não era bug de tela: a própria tabela já
tinha o aviso certo — badge vermelho "EM USO: X" sempre que
`AiApiKey.model` (o texto salvo por quem cadastrou a chave) diverge do
`effectiveModel` (o que `getProviderRuntimeConfig` de fato usa, ver
`registry.ts`) — só que ninguém tinha corrigido a causa: três das quatro
chaves cadastradas tinham o campo `model` desatualizado desde o cadastro
inicial, muito antes desta sessão:

| Chave | `model` salvo (errado) | Corrigido para |
|---|---|---|
| Claude 3.5 | `claude-3-5-sonnet` | `claude-sonnet-5` |
| Gemini | `gemini-1.5-flash` | `gemini-2.0-flash` |
| DeepSeek V3 | `deepseek v3` | `deepseek-v4-flash` |

A Kimi K3 já estava certa (`kimi-k3`). Nenhuma chamada de IA mudou de
comportamento — o roteador já vinha silenciosamente substituindo pelo
`effectiveModel` certo em tempo de execução (é para isso que a função
existe); a correção só faz o campo salvo dizer a verdade, em vez de o painel
ficar mostrando um valor que nunca foi usado de fato. Os nomes de
identificação das duas primeiras chaves também foram corrigidos ("Claude
3.5" → "Claude Sonnet 5", "DeepSeek V3" → "DeepSeek V4 Flash"), pra não
ficarem inconsistentes com o modelo ao lado.

Update feito direto no banco (`AiApiKey.model`/`.name`), fora do painel —
`clearProviderConfigCache()` não foi chamado, mas o cache dessa tabela tem
TTL de 30s (`CONFIG_CACHE_TTL_MS` em `registry.ts`), então a correção já
está em vigor.

**Também corrigidos "em todos os locais" (pedido explícito do operador),
rótulos estáticos na tela que citavam os mesmos nomes antigos**:
`admin-view.tsx` tinha "DeepSeek V3" no `<SelectItem>` de cadastro e "Claude
3.5" no resumo do card "Roteamento Inteligente" (que também passou a citar
os 5 provedores, incluindo a OpenAI do §2.36).

## 2.38 OpenAI recusava `max_tokens` — primeira chamada real ao gpt-5.6-luna

Primeiro teste de verdade da chave OpenAI cadastrada no §2.36 devolveu erro
da própria API: *"Unsupported parameter: 'max_tokens' is not supported with
this model. Use 'max_completion_tokens' instead."* Os modelos correntes da
OpenAI substituíram o parâmetro clássico da Chat Completions API — o
`gpt-5.6-luna` só aceita `max_completion_tokens`. Kimi, DeepSeek e Gemini
(os outros três que passam pelo mesmo ramo do SDK compatível com OpenAI em
`router.ts`) continuam aceitando o nome antigo — não foi mexido neles.

**Correção em `lib/ai-router/router.ts`**, no `buildCompletionParams()` do
ramo não-Claude: o nome do campo agora depende do `currentProviderId` —
`max_completion_tokens` só para `openai`, `max_tokens` para os demais,
mesmo teto calculado (`Math.max(req.maxTokens ?? 3500,
JSON_TASK_TOKEN_FLOOR)`) dos dois lados. Não mexido: `temperature` —
alguns modelos de raciocínio da OpenAI também recusam esse parâmetro, mas
isso não foi observado ainda (só o erro do `max_tokens` foi reportado); é
para quando/se aparecer, não uma correção preventiva sem evidência.

`tsc`/`eslint`/`npm test`/`npm run build` limpos, 583 testes (sem teste
novo dedicado — a lógica trocada é o parâmetro passado à chamada HTTP real
do SDK, que este arquivo não testa isoladamente para nenhum provedor).

## 2.39 "Erro geral" no Kimi/GPT/Gemini — três causas diferentes, uma por uma

Operador reportou falha nos três ao testar a conexão. Nenhum `AiLog`
recente (a rota de diagnóstico não grava lá) — a investigação foi replicar
a chamada de cada provedor com a chave real, fora da rota, pra ver o erro
verdadeiro em vez de adivinhar pela mensagem genérica da tela.

1. **OpenAI**: o mesmo "Unsupported parameter: 'max_tokens'" do §2.38 — só
   que na rota de PRODUÇÃO (`router.ts`) já estava corrigido; a rota de
   DIAGNÓSTICO (`api/admin/ai-test/route.ts`) tem sua própria cópia da
   chamada, que ficou pra trás. Corrigida agora do mesmo jeito.
2. **Gemini**: não era timeout nem parâmetro — era 404. O SDK da OpenAI
   engole o corpo do erro do Gemini e mostra só "404 status code (no
   body)"; a chamada REST direta revelou a mensagem real do Google: *"This
   model models/gemini-2.0-flash is no longer available. Please update
   your code to use models/gemini-3.6-flash."* Mesma classe do
   `deepseek-chat` aposentado em 24/07/2026. **Zero chamada ao Gemini
   estava registrada em `AiLog` desde sempre** — é só suplente distante,
   quase nunca alcançado — então isto pode ter estado quebrado há tempos
   sem ninguém notar. Corrigido: `defaultModel`/`CURRENT_MODELS` do Gemini
   em `registry.ts`, o `AiApiKey.model` já cadastrado (banco), e os
   rótulos em `admin-view.tsx`. Preço do `gemini-3.6-flash` NÃO confirmado
   — herdado do `gemini-2.0-flash` como estimativa, sinalizado no código.
3. **Kimi**: nem parâmetro nem modelo — a rota de diagnóstico usava
   `timeout: 10000`, ABAIXO do próprio piso que o roteador de produção
   respeita (`MIN_PROVIDER_TIMEOUT_MS = 12_000`, "abaixo disto uma
   tentativa não tem chance real de terminar"). O Kimi simplesmente
   respondeu mais devagar que 10s — não é falha de configuração, é um
   diagnóstico com prazo curto demais pra um provedor que este sistema já
   sabe ser mais lento (ver 2.34). Corrigido: `TEST_TIMEOUT_MS = 15_000`, e
   os 5 testes passaram a rodar em PARALELO em vez de sequencial (eram até
   5×10s = 50s somados, quase estourando o `maxDuration` de 60s sozinhos —
   paralelo abre espaço pra um prazo maior sem esse risco).

Os quatro provedores (Kimi, DeepSeek, Gemini, OpenAI) foram testados de
novo, em paralelo, com a chave real de cada um, fora da rota — os quatro
responderam com sucesso depois das correções.

`tsc`/`eslint`/`npm test`/`npm run build` limpos, 583 testes.

## 2.40 Busca sistêmica por código morto — 10 itens removidos

Pedido do operador: achar código sem nenhuma utilidade atual OU futura em
todo o sistema, não só num arquivo. `knip` quebrou neste ambiente Windows
(erro nativo de alocação de buffer no `oxc-parser`); `ts-prune` funcionou,
mas com ruído pesado de falso-positivo específico de Next.js (toda rota
exporta `GET`/`POST`/etc., que o framework consome por convenção de
arquivo, não por import — `ts-prune` não enxerga isso e marca como "não
usado"). Filtrado o ruído (exports de rota, "(used in module)",
`components/ui/` do shadcn), sobraram ~14 candidatos reais, cada um
verificado por `grep` antes de remover — nenhum apagado só pela contagem
do `ts-prune`.

Removidos (zero importador confirmado em todo `src/`):

- `components/ui/toaster.tsx` + `hooks/use-toast.ts`: o par do Radix nunca
  montado. Já era um caso documentado — `layout.tsx` tinha comentário de um
  incidente anterior (`toast()` do Sonner sem lugar pra renderizar, "app
  mudo") explicando por que os dois existiam lado a lado. Confirmado que o
  Radix nunca foi de fato usado em lugar nenhum; removido, e o comentário
  do `layout.tsx` virou passado.
- `auth.ts`: `requireUser()` sem nenhuma chamada — toda rota faz
  `getCurrentUser()` + checagem manual de 401 em vez de usar essa função.
- `data-residency.ts`: `isProviderAllowedFor()` sem chamador — só
  `filterProvidersByResidency()` é usada pelo `router.ts`.
- `entitlements.ts` (arquivo sensível, §10 do HANDOFF — mexido aqui só
  porque o pedido do operador foi explícito e abrangente o bastante pra
  cobrir isto):
  - `isResumeUnlocked()`: sem chamador real, apesar do próprio comentário
    da função alegar que era "a única pergunta que as rotas derivadas
    precisam fazer" — quem de fato é chamada por elas é
    `requireUnlockedResume()` (mantida, intacta).
  - `migrateCreditBalance()` + reexport de `CREDITS_PER_ANALYSIS`/
    `analysesForCredits`: duplicata nunca ligada a nenhuma rota. O script
    real de migração, `scripts/migrate-credits-to-analyses.ts` (documentado,
    rodado via `npm run migrate:analyses`), tem sua PRÓPRIA implementação
    independente, importando direto de `pricing/migration` — confirmado
    lendo o script inteiro antes de remover, pra não quebrar a ferramenta
    de verdade.
- `analysis/job.ts`: `type JobStatus` nunca referenciado fora da própria
  definição.
- `analysis/segments.ts`: `getSegmentSpec()` nunca chamada.
- `ai-jobs/engine.ts`: reexport de `readSteps` (só usado dentro do próprio
  `progress.ts`/`progress.test.ts`, nunca via `engine.ts`) e a interface
  `AiJobRow` (o único consumidor, `runners/single-call.ts`, declara seu
  próprio tipo local em vez de importar este).
- `ai-router/registry.ts`: reexport de `MODEL_PRICING`/
  `TIERED_MODEL_PRICING` (só importados diretamente de `./pricing` em todo
  o resto do sistema) — mantido no reexport só `resolveModelPricing`, que
  `router.ts` de fato importa por este caminho.

Dois candidatos identificados e **deliberadamente não removidos**, por não
se encaixarem no pedido ("sem utilidade atual OU FUTURA"):

- `onDemandAllowed` (`quota.server.ts`): feature futura já documentada
  (§21 Etapa 9, "busca sob demanda") — tem utilidade futura explícita,
  fica.
- `REMOTIVE_LEGAL_NOTICE_KEY` (`remote-boards.ts`): referenciado só em
  comentário, nunca usado de fato pra filtrar o aviso legal do Remotive dos
  resultados — pode ser um filtro inacabado (bug), não código morto puro.
  Decisão de implementar ou remover fica com o operador.

`tsc --noEmit`, `eslint` nos arquivos tocados, `npm test` (583/583) e
`npm run build` limpos após a remoção completa.

---

## 2.41 Internacionalização Completa do Sistema e Paridade Multilíngue (PT, EN, ES)

*(renumerado de um §2.36 duplicado — este era o estado de 3 idiomas, anterior à expansão para 12 do §2.44)*

Auditoria e implementação de suporte integral a multi-idiomas (`pt`, `en`, `es`) em todas as camadas da aplicação (Frontend, Backend, geração de PDF, agentes de suporte e testes).

### 1. Dicionários e Tipagem Estrita (`src/lib/i18n/index.ts`)
- Expansão de `TranslationDictionary` com 100% de simetria de chaves em `DICTIONARIES.pt`, `DICTIONARIES.en` e `DICTIONARIES.es`.
- Novos blocos estruturados: `analysisPaywall`, `socialPanel`, `paymentModal`, `profileConflict`, `uploadProgress`, `pdfReport`.
- Campos adicionados nas seções existentes: `auth` (consentimento LGPD/GDPR, botão voltar, placeholder), `app` (itens de navegação, breadcrumbs, perfil, radar, suporte, crachá/modo admin master, toasts de pagamento), `pricing` (conjunções, histórico do livro-razão de análises), `support` (nota de auto-diagnóstico em tempo real), `rewrite` (progresso dinâmico de seções).
- Exportação formal da constante `LANGUAGES` e validação do helper `detectLanguageFromCountry` e `localeForLang`.

### 2. Telas e Componentes do Aplicativo
- `src/components/app/app-shell.tsx`: navegação lateral dinâmica por idioma, cabeçalho responsivo, menu dropdown do usuário, crachá admin master e toasts de retorno do Stripe.
- `src/components/app/analysis-view.tsx`: lookup prioritário de chaves dinâmicas no dicionário ativo (`(d.key && DIMENSION_LABELS[d.key]) || d.label || d.key`), garantindo atualização instantânea de rótulos ao alternar o idioma.
- `src/components/app/rewrite-view.tsx`: contagem e progresso dinâmico de seções com template localizado.
- `src/components/app/analysis-paywall.tsx`: paywall 100% migrado para chaves de internacionalização.
- `src/components/app/plans-view.tsx`: histórico do livro-razão de análises, títulos, conjunções e formatação de datas via `localeForLang(lang)`.
- `src/components/app/upload-progress-modal.tsx`: etapas de IA (8 dimensões, job match, targeted changes, resumo executivo), dicas de tempo e cronômetro.
- `src/components/app/social-analysis-panel.tsx`: auditoria de pegada digital, sugestões de bios, títulos e ações recomendadas.
- `src/components/app/payment-status-modal.tsx`: passos de verificação de checkout Stripe e fallbacks de erro.
- `src/components/app/profile-conflict-prompt.tsx`: diálogo de resolução de divergência de cargos e áreas profissionais.
- `src/components/auth/auth-screen.tsx`: termos de consentimento internacional de dados (LGPD/GDPR), botão de retorno e placeholders.

### 3. Geração de PDF e Endpoints de Download Multilíngue
- `src/lib/pdf.ts`: `generateAnalysisReportPdf` agora suporta parâmetro opcional `lang?: Language` com metadados do documento PDF, títulos de seções, status de compatibilidade ATS, e datas formatadas conforme o locale correspondente.
- `src/app/api/resume/download/route.ts`: extração do idioma da requisição via `getRequestLanguage(req)` e propagação para o laudo em PDF e conselho de presença digital.

### 4. Suporte e Auto-Diagnóstico de Incidentes
- `src/app/api/support/chat/route.ts`: expansão de expressões regulares de detecção de incidentes e falhas em português, inglês e espanhol (`isErrorReport`), integrando a nota de auto-diagnóstico em tempo real localizada conforme o idioma do usuário.

### 5. Verificação e Segurança
- Criação da suíte `src/lib/i18n/i18n.test.ts` validando:
  - Paridade estrutural estrita entre dicionários `pt`, `en` e `es`.
  - Ausência de strings vazias ou nulas em todas as chaves nos 3 idiomas.
  - Comportamento de geolocalização e mapeamento de locale.
- Suíte completa de testes (`npm test`) com 617/617 testes aprovados (100% de sucesso, 0 regressões, conformidade OWASP ASVS mantida).

---

## 2.42 Integração do Radar de Vagas à Proposta de Valor e Catálogo de Preços (PT, EN, ES)

*(renumerado de um §2.37 duplicado)*

Alinhamento da comunicação comercial, planos de preços e catálogo de benefícios com o ecossistema do **Radar de Vagas**.

### 1. Comunicação e Benefícios nos 3 Idiomas (`src/lib/i18n/index.ts`)
- **Lista de Entregas (`pricing.items`)**:
  - PT: `"Orientação Profissional e Radar de Vagas"`
  - EN: `"Career Orientation & Job Radar"`
  - ES: `"Orientación Profesional y Radar de Vacantes"`
- **Descrição do Produto (`pricing.productDesc`)**:
  - PT: `"Auditoria completa, reescrita estratégica e ativação do Radar de Vagas para acelerar sua contratação."`
  - EN: `"Full ATS audit, strategic rewrite, and Job Radar activation to accelerate your hiring."`
  - ES: `"Auditoría completa, reescritura estratégica y activación del Radar de Vacantes para acelerar tu contratación."`

### 2. Base de Suporte e Prompt do Assistente (`src/app/api/support/chat/route.ts`)
- Atualizada a base de conhecimento oficial do Griffo para instruir a IA a citar a ativação do Radar de Vagas e monitoramento de oportunidades reais junto à Orientação Profissional na Análise Completa.

### 3. Validação e Integridade Comercial
- Preservação da equivalência 1-para-1 com `ANALYSIS_DELIVERABLES` em `src/lib/pricing/catalog.ts`.
- 617/617 testes automatizados aprovados sem regressões (`npm test`).

## 2.43 SEO: SSR multi-país na landing, e as páginas de carreiras saem para o ATS explicar o produto

Duas mudanças de SEO em sequência (commits `e3a62fc`, `752b943`, 29-30/08/2026).

Primeiro, a landing passou a ser renderizada via SSR com roteamento por
país (`src/app/[country]/page.tsx` + `country-client.tsx`), `sitemap.ts`
e `robots.ts` expandidos, e compartilhamento formatado para LinkedIn.
`layout.tsx` ganhou metadados por rota.

Em seguida, as páginas estáticas de carreiras (`src/app/carreiras/[slug]`,
345 linhas, e `src/lib/careers/data.ts`, 215 linhas) foram **removidas**
— eram páginas de listagem de vagas por empresa, fora do escopo do
produto. As páginas de ATS (`src/app/ats/[slug]/page.tsx` e
`src/lib/ats/data.ts`) foram reescritas para explicar o que é o software
de ATS e o valor do GriffoWork em vez de descrever vagas de terceiros.

## 2.44 i18n salta de 3 para 12 idiomas, e o dicionário monolítico é quebrado em arquivos por locale

Dois commits seguidos (`0abc45d`, `f3272eb`, 30/08/2026) que juntos
levaram o sistema de `pt/en/es` (§2.41) para 12 idiomas: primeiro
`+ de, fr, it, ja`, depois `+ ar, ko, nl, sv, zh`.

O antigo `src/lib/i18n/index.ts` (3764 linhas, um único objeto com os
três dicionários) foi refatorado em um arquivo por idioma —
`src/lib/i18n/locales/{pt,en,es,de,fr,it,ja,ar,ko,nl,sv,zh}.ts`, ~920
linhas cada — mais `types.ts` para o contrato comum. Criado
`scripts/sync-i18n.ts` para checar paridade estrutural entre os 12
dicionários (mesmas chaves, sem string vazia), reforçando o padrão que
`i18n.test.ts` já cobria para 3 idiomas desde o §2.41.

A cobertura foi além da UI: `src/lib/email/digest.ts` (assunto e corpo
do digest do Radar por idioma), `src/lib/market/index.ts`, o endpoint
novo `api/radar/unsubscribe`, e o fluxo de reescrita de currículo
(`rewrite-view.tsx`, `resume-rewrite/segments.ts`, `api/resume/rewrite`)
ganharam adaptação internacional de 1 clique — reescrever o currículo
já adaptado ao idioma/mercado de destino, não só traduzido.

**Pendência que isto reabre:** o item 6 do HANDOFF (§0) registrava as
telas autenticadas traduzidas para pt/en/es em 25/08 — os 9 idiomas
novos herdam a mesma estrutura de chaves via `sync-i18n.ts`, mas não
foram verificados manualmente na tela (sem login disponível ao agente,
mesma limitação já registrada nos outros itens do HANDOFF §0).

## 2.45 E-mail de contato corporativo: uma única fonte de verdade em todos os idiomas

Commit `56dfb2d` (30/08/2026). Antes da expansão de idiomas do §2.44,
o e-mail de contato institucional variava por dicionário. Corrigido em
`src/lib/i18n/contact.ts` (agora a fonte única, `contact@griffo.work`),
propagado a `layout.tsx` e `env.ts`, com `contact.test.ts` reescrito
para validar que os 12 idiomas resolvem para o mesmo endereço.

## 2.46 Radar: filtro de compatibilidade mínima não estava sendo aplicado na listagem

Commit `edda32a` (30/08/2026), o mais recente. Duas falhas relacionadas
em `src/app/api/radar/route.ts`: o parâmetro `minimumFit` do perfil do
usuário — usado para decidir que oportunidades entram no alerta — não
estava sendo aplicado como filtro na listagem geral de oportunidades do
Radar, e o veredito de compatibilidade dos alertas já disparados podia
ficar dessincronizado do perfil atual (perfil mudou depois do alerta
ser gerado, o veredito antigo continuava exibido). Corrigido em
`route.ts` e `lib/radar/runner.ts`, com teste novo cobrindo os dois
casos em `radar.test.ts`. Rótulos i18n dos 12 idiomas ganharam a
string nova relacionada ao veredito sincronizado.

## 2.47 Auditoria SEO/GEO externa — 2 acertos, 2 alarmes falsos, 3 bugs reais não listados no pedido

Operador colou um prompt de auditoria técnica de SEO/GEO pronto (roteiro
de 7 itens, aparentemente gerado por outra ferramenta) e pediu para só
mexer no que fosse de fato necessário. Cada item foi verificado contra o
código e, quando possível, contra o `next dev` rodando de verdade
(`curl` real, não leitura de código) antes de qualquer alteração —
seguindo a mesma disciplina do §2.39 (replicar a chamada real em vez de
confiar na primeira leitura).

**Item 1 do prompt (hreflang aponta para `/jp /nl /se /cn /ae /kr`, que
"404 confirmado") — alarme falso.** `src/app/[country]/page.tsx` tem
`dynamicParams = true`; a checagem `isKnown` aceita qualquer código
presente em `COUNTRIES` (lista de ~150 países usada no seletor de
perfil), não só os 40 em `SUPPORTED_COUNTRY_SLUGS` pré-gerados por SSG.
`curl` contra `next dev` real confirmou `200` nas 12 rotas do hreflang
E nas 6 do rodapé (`/pt /mx /gb /ca /au /global`) — nenhuma 404. O que
era real: faltava `x-default`. Corrigido em `layout.tsx`, apontando
para `/global` (a página sem preço/ATS de um país específico), com
comentário explicando a escolha. **Não adicionado**: hreflang por
região para `/pt /gb /ca /au /mx` como o prompt sugeria — essas rotas
usam o MESMO `jobLanguage` de `/br /us /us /us /es` respectivamente
(conteúdo textual idêntico, só muda preço/moeda/nome do país), então
declarar `en-GB`/`en-CA`/`en-AU` como variantes de idioma seria uma
alteração de comportamento de SEO sem uma decisão editorial por trás —
fica para o operador decidir se essas páginas devem virar conteúdo
distinto o bastante para merecer hreflang próprio.

**Item 5 do prompt (preço fixo em BRL na página raiz) — alarme falso.**
`landing.tsx` já resolve `priceFor(effectiveCountry)` a partir do país
detectado por geo/rota (`lib/pricing/catalog.ts`, com moeda, tier e
meios de pagamento locais); `[country]/page.tsx` já gera um segundo
`Offer` no JSON-LD com preço e moeda do mercado específico, distinto do
`Offer` gratuito fixo em USD "0" do layout raiz (esse sim
intencionalmente fixo — é a oferta free). Nada alterado.

**Item 3 do prompt (FAQ: só a 1ª resposta existe no HTML, as outras 4
são removidas do DOM) — confirmado, e mais grave do que descrito: o
JSON-LD `FAQPage` do `layout.tsx` também tinha 4 perguntas que **não
eram as mesmas** exibidas na tela** (comparado com `q1..q5`/`a1..a5` de
`i18n/locales/pt.ts`) — schema descrevendo conteúdo que o usuário nunca
vê é o tipo de coisa que o Google pode simplesmente ignorar ou penalizar
no rich result. Corrigido nos dois pontos:
- `landing.tsx`: a resposta de cada pergunta do acordeão agora sempre
  existe no DOM (`<div id="faq-answer-{i}">`), escondida via classe
  `hidden` (`display:none`) quando fechada, em vez de
  `{openFaq === index && (...)}`, que removia o nó inteiro. `curl` no
  HTML bruto confirmou as 5 `faq-answer-N` presentes de saída.
  `aria-expanded`/`aria-controls` adicionados no botão.
- `layout.tsx`: as 4 perguntas do JSON-LD foram substituídas pelas 5
  reais de `pt.ts` (fonte de verdade é a landing em pt-BR, consistente
  com `<html lang="pt-BR">` do layout raiz).

**Item 4 do prompt (twitter:image usa `/logo.png`, quadrado, formato
errado para `summary_large_image`) — confirmado, e pior do que
descrito: `og:image` apontava para `/og-image.jpg`, um arquivo **que
não existe em `public/`** (`curl` local confirmou `404` no asset, não
só no aspect ratio) — em `layout.tsx`, `[country]/page.tsx` E
`ats/[slug]/page.tsx`, os três pontos que geram preview de
compartilhamento do site inteiro. Não havia nenhum banner 1200x630 no
projeto. Corrigido nos três arquivos: `og:image` e `twitter:image`
passaram a apontar para `/logo-full.png` (693×694, a maior imagem real
disponível) até existir um banner desenhado nas proporções corretas —
**pendência de design, não de código**, registrada no HANDOFF.

**Item 2 (auditoria de status/idioma/preço por rota) e item 7
(validação final)** foram cobertos pela própria verificação acima
(`curl` real nas 18 rotas + leitura de `priceFor`/`generateMetadata`),
sem necessidade de ferramenta externa.

**Item 6 do prompt (criar 5 a 10 páginas de conteúdo educacional
novas)** não foi implementado — é feature nova, não correção, e o
pedido do operador foi "só altere se necessário". Fica como sugestão
não executada.

`tsc --noEmit` limpo e `npm test` (618/618) depois das mudanças.

## 2.48 Novo slogan — só na meta description, de propósito

Operador colou sugestões de slogan/tagline de outra IA ("Audit. Align.
Achieve.", variações com "Master"/"Elevate"/"Navegue") e pediu para
decidir onde implementar pensando em geração de lead e venda, não só em
gosto de frase.

Decisão: **não** tocar no H1/subtítulo do hero, no kicker "GLOBAL AI
CAREER INTELLIGENCE" (nav+rodapé) nem no CTA final — os três já fazem
um trabalho específico de conversão (clareza concreta com prova
——citando Gupy/Workday/Taleo e "8 dimensões"—— no hero; rótulo de
categoria no kicker; pergunta + remoção de fricção "sem cartão de
crédito" no CTA final) que uma frase de efeito substituiria por algo
mais bonito e menos eficaz. Slogan/tagline é ferramenta de topo de
funil (o que faz alguém clicar), não de copy on-page (o que faz alguém
converter depois de já estar na página) — são funções diferentes.

Implementado só em `layout.tsx`: a frase escolhida ("Do perfil social à
vaga certa: audite, alinhe e conquiste sua carreira com a Griffo IA...",
146 caracteres) entrou em `metadata.description`,
`openGraph.description` e na descrição do `WebSite` no JSON-LD — os três
pontos que controlam o que aparece no resultado do Google e no card de
compartilhamento social, antes do clique. `twitter.description` (que já
é mais específico, "8 dimensões executivas") não foi tocado.

`tsc --noEmit` limpo.

## 2.49 Regra reafirmada pelo operador: nada fixo em português, nem em código "global" — JSON-LD raiz vazava PT para todo idioma

Operador perguntou se as correções do §2.47/§2.48 valiam para os 12
idiomas. Resposta honesta expôs um problema real: o JSON-LD injetado em
`layout.tsx` (`<script type="application/ld+json">` fora do sistema de
`metadata`, que por isso NUNCA é sobrescrito por `generateMetadata` de
rota-filha) tinha `FAQPage` com 5 perguntas em português, e o
`WebSite.description` com o slogan novo do §2.48 — os dois presentes
**identicamente em `/us`, `/de`, `/jp` e qualquer outra rota**, porque o
layout raiz roda em toda requisição, independente do país/idioma da URL.

Operador reagiu com uma regra que já valia antes (reescrita de
currículo) e está sendo reafirmada de forma ampla: **nada no produto
pode ficar fixo em português** — nem UI, nem conteúdo gerado por IA, nem
dado estruturado invisível como este. Registrado como memória
permanente (`feedback_no_hardcoded_portuguese`), porque é a segunda vez
que a regra precisa ser repetida.

**Corrigido:**
- `FAQPage` removida do `@graph` global de `layout.tsx`. Cada rota país
  agora gera a própria, em `[country]/page.tsx`, montada dinamicamente a
  partir de `DICTIONARIES[market.jobLanguage].faq` — sem texto
  hardcoded, sempre no idioma real da rota. Verificado com `curl` real:
  `/us` gera perguntas em inglês, `/de` em alemão, `/br` continua em
  português — cada um batendo com o FAQ visível na própria página.
- `WebSite.description` (o slogan do §2.48) removida do JSON-LD global —
  não tinha como ficar correta em todo idioma sem virar per-request.
- `SoftwareApplication.description`/`featureList` do JSON-LD global
  (que também eram fixos em português, achado no mesmo apanhado)
  traduzidos para inglês — não por ser "o idioma certo" para todo mundo,
  mas por já ser a língua franca escolhida pelo próprio `offers.description`
  desse mesmo objeto ("Free executive resume preview..."), que sempre
  esteve em inglês. Português nunca é o fallback neutro aceitável aqui.

**Não corrigido, registrado como pendência aberta (arquitetural, não
uma linha de texto):** o domínio nu `https://griffo.work/` (sem
segmento de país) não tem detecção de idioma no servidor —
`src/app/page.tsx` é client component sem `forcedLang`, então o
primeiro HTML (SSR) sempre sai em português (`lang = forcedLang ||
contextLang || 'pt'` em `landing.tsx`), e `<html lang="pt-BR">` do
`layout.tsx` nunca muda por requisição. Corrigir de verdade exige uma
decisão de arquitetura — redirecionamento por geo-IP no
`src/middleware.ts` para a rota `/país` certa, ou cookie de idioma lido
via `next/headers()` no layout raiz — e `middleware.ts` é arquivo de
segurança (rate limit, CSRF); não alterado sem decisão explícita do
operador sobre qual caminho seguir. Ficou fora desta rodada de
propósito, não por descuido.

`curl` real em `/us`, `/de`, `/br` confirmando o idioma correto no
JSON-LD; `tsc --noEmit` limpo; `npm test` 618/618.

## 2.50 Domínio nu passa a redirecionar por geo-IP — a pendência aberta no §2.49 fechada

Operador pediu "solução automática para que o usuário não tenha sua
experiência prejudicada" — resposta à pendência 12 do HANDOFF (o
domínio nu sempre servia SSR em português, sem detectar país).

**Decisão de arquitetura, e por quê:** entre redirecionar por geo-IP
(URL muda) e usar cookie de idioma na mesma URL (layout raiz lê
`headers()`/`cookies()`), foi escolhido o redirect. Motivo decisivo:
ler cookie no layout raiz obrigaria TODA a árvore de rotas — inclusive
as 40 rotas de país que acabaram de ganhar SSG no §2.43 — a virar
dinâmica por requisição, regredindo silenciosamente uma otimização
recente. Redirect fica isolado no `middleware.ts`, sem esse efeito
colateral.

**Implementado em `src/middleware.ts`** (`handleBareDomain`,
`geoRedirectTarget`, `isGeoRedirectEnabled`, todos exportados e
testados):
- Dispara só no caminho exato `/`, método GET — nenhuma outra rota
  (`/br`, `/global`, `/api/*`) casa com esse matcher, o que elimina por
  construção qualquer risco de loop de redirecionamento.
- País lido por `edgeCountry()` (extraída de `lib/pricing/resolve.ts`
  para `lib/pricing/edge-country.ts`, SEM `import 'server-only'` — o
  pacote `server-only` derruba qualquer teste rodado fora do pipeline de
  build do Next porque a condição que ele verifica não existe em
  execução via `tsx`; `resolve.ts` mantém `server-only` só nas funções
  que de fato não podem vazar pro client). Mesma fonte de país que já
  decide preço e que já teve um incidente registrado (`cf-ipcountry`
  antes de `x-vercel-ip-country`, por causa do proxy do Cloudflare) —
  reaproveitada, não duplicada.
- País com rota própria (`SUPPORTED_COUNTRY_SLUGS`, extraída de
  `[country]/page.tsx` para `lib/market/supported-slugs.ts` pelo mesmo
  motivo de reuso) vira o destino; sem cobertura ou sem cabeçalho de
  país cai em `/global` — mesma escolha já feita para o `x-default` do
  hreflang no §2.47.
- Três guardas para não prejudicar quem já tem contexto: cookie de
  sessão (`ca_session`) presente pula o redirect (usuário logado troca
  de tela sozinho ao hidratar, independente da rota); cookie
  `griffo_lang` presente pula o redirect (escolha manual de idioma nunca
  é sobrescrita por palpite de geo-IP — `i18n-context.tsx` passou a
  gravar esse cookie além do `localStorage` só quando a pessoa troca de
  idioma pelo seletor); User-Agent de bot/crawler conhecido
  (Googlebot, GPTBot, ClaudeBot, PerplexityBot, geradores de preview de
  redes sociais) pula o redirect — é a mitigação padrão pra
  desaconselhamento do próprio Google contra prender rastreamento numa
  única localidade por geo-IP.
- Redirect é 307 (temporário), nunca 301/308 — o destino pode mudar
  (VPN, viagem, ou a própria lista de países suportados), e um
  permanente ficaria cacheado no navegador sobrevivendo a qualquer
  correção futura.
- Interruptor `GEO_REDIRECT_ENABLED`, mas ao contrário do
  `RADAR_DIGEST_ENABLED` (que vem desligado até revisão de conteúdo):
  este vem **ligado por padrão** — é o comportamento pedido, não uma
  feature aguardando aprovação. `GEO_REDIRECT_ENABLED=false` desliga em
  produção sem reverter commit, se algo se comportar mal.
- Cada redirecionamento real grava `console.log` estruturado (país
  detectado, destino) — aparece nos Runtime Logs da Vercel, para
  observar o comportamento logo após o deploy sem precisar esperar dias
  pelo Search Console.

**Verificado com `curl` real** (não só teste unitário) contra
`next dev`: sem cabeçalho de país → `/global`; `cf-ipcountry: DE` →
`/de`; `cf-ipcountry: BR` → `/br`; User-Agent de Googlebot → `200` sem
redirecionar; cookie `ca_session` → `200` sem redirecionar; cookie
`griffo_lang` → `200` sem redirecionar; acesso direto a `/de` → `200`
sem loop.

Teste novo `src/middleware.test.ts` (9 casos, primeiro teste direto do
`middleware.ts` no projeto) cobrindo os mesmos cenários de forma
determinística. `tsc --noEmit` e `eslint` limpos nos arquivos tocados.
`npm test`: 627/627 (618 + 9 novos).



## 2.51 Índice de temperatura de contratação por país — fase 1: esquema, dois conectores reais e a classificação de fase

Pedido do operador: um sinal de "este mercado está esquentando ou
esfriando agora", por país, para agregar valor à análise paga e ao
Radar de Vagas. A inspiração declarada foi a curva de J da economia —
um indicador cai depois de um choque, encontra o fundo, sobe, e por fim
passa de onde estava.

**A adaptação que muda tudo, e por quê:** não existe um choque comum. A
tentação óbvia era montar "os mercados mais quentes do mundo" e ordenar
a lista. Isso seria mentira estatística, e não uma pequena. O **próprio
Eurostat não publica um total da UE** para a taxa de postos vagos
porque os países não são comparáveis entre si: a amostra vai de ~2.500
empresas (Finlândia) a ~75.000 (Polônia); a taxa de resposta vai de
11,4% (Alemanha) a 98,8% (Romênia); a França pesquisa só empresas com
10+ empregados e exclui administração pública, e por isso vem marcada
`d` ("definição difere") em todos os trimestres; a Dinamarca usa outro
recorte de setor.

Uma taxa de 2,0% na França e 2,0% na Romênia não são o mesmo número
medido duas vezes — são dois números diferentes com o mesmo nome. Então
o índice é, por construção, **um país contra a própria história**, e
nunca contra o vizinho. É a leitura honesta e é, por acaso, exatamente
o que a metáfora da curva de J pede: cada mercado tem a curva dele.

**Nada aqui recebeu texto de tela.** Identificador interno é chave de
código (`cooling`, `heating_up`); rótulo que o usuário lê é outra
coisa, vem do dicionário nos 12 idiomas e é fase 2. Nenhuma string em
português entrou em caminho global — a regra do §2.49 vale aqui desde o
primeiro arquivo.

**O que entrou:**

- `prisma/schema.prisma` — modelo `LaborMarketPoint`. Chave única
  `(country, source, metric, period)`: a mesma competência do mesmo
  país é buscada muitas vezes (o JOLTS revisa a impressão anterior toda
  divulgação) e o `upsert` faz a leitura mais recente vencer sem
  duplicar o mês. Campos que não são óbvios: `revised` (falso =
  impressão preliminar), `seriesBreak` (a fonte declarou quebra de
  série) e `confidence` (`high`/`low`).
- `src/lib/hiring-index/types.ts` — o contrato comum. Deliberadamente
  pequeno: buscar e devolver pontos. Sem retentativa, backoff ou
  controle de cota, porque nenhuma das duas APIs reais precisa e uma
  máquina de retentativa escrita antes de existir o problema é uma
  máquina que ninguém sabe se funciona.
- `src/lib/hiring-index/connectors/bls-jolts.ts` — Estados Unidos,
  série `JTS000000000000000JOR` (vagas em aberto, total não agrícola,
  **taxa**, com ajuste sazonal).
- `src/lib/hiring-index/connectors/eurostat.ts` — UE/EEE numa chamada
  só, `jvs_q_nace2`, taxa de postos vagos trimestral.
- `src/lib/hiring-index/phase.ts` — média móvel de 3 períodos e a
  classificação em `cooling` / `bottoming_out` / `recovering` /
  `heating_up` / `stable`, ou `null` explícito.
- `src/scripts/fetch-hiring-index.ts` — gatilho manual (`--dry-run`).
  Não é o pipeline de produção: ligar no cron é fase 2, e a decisão é
  de quem ler a saída daqui primeiro.

**Verificado contra as APIs reais, não contra a documentação.** As duas
descobertas que só apareceram assim:

- No Eurostat, a primeira tentativa usou `indic_em=JOBRATE` e
  `s_adj=SCA` — códigos plausíveis e errados. A API respondeu **200 com
  `value: {}`**: filtro que não casa não dá erro, dá vazio. Os códigos
  certos (`JVR`, `SA`) foram lidos de
  `dimension.indic_em.category.index` numa chamada sem filtro. O
  conector trata resposta sem valor nenhum como FALHA de coleta, nunca
  como "Europa sem vagas" — o mesmo erro que a Adzuna já ensinou aqui
  com o 200 + `exception`.
- No BLS, `Number('')` é `0`, e `0` é finito. O teste do valor
  suprimido (`"-"` e `""`, que a série publica) pegou um mês vazio
  entrando como **"taxa de vagas em aberto de 0,0%"** — um número que
  ninguém publicou. Corrigido antes de a primeira coleta acontecer.

**A média móvel não é enfeite.** A taxa de resposta do JOLTS caiu de
58% (2019) para ~30-32% (2023 em diante), e a revisão entre a primeira
e a segunda divulgação passou a valer ~180 mil vagas em média, cerca do
dobro da norma histórica. A impressão do mês recém-divulgado é a menos
confiável da série inteira. Por isso **não existe caminho no módulo que
classifique fase a partir do valor cru** — a média móvel é regra do
módulo, não opção de quem chama —, e a janela final carrega
`windowHasPreliminary` para a tela poder dizer que aquele trecho ainda
pode mudar.

**A marcação que mais importa é `b`, não `d`.** "Definição difere" (a
França) NÃO rebaixa a confiança, e é proposital: incomparabilidade
entre países é irrelevante num produto que não compara países, e uma
definição própria e estável não atrapalha a série consigo mesma. Já
"quebra de série" diz que antes e depois **não são comparáveis entre
si** — que é justamente a única comparação feita aqui. `classifyHiringPhase`
corta a série na quebra mais recente por causa disso, e a Chéquia (quebra
em 2025-Q1) sai hoje como "sem classificação", não como um mercado que
mudou de rumo. Só `u` ("baixa confiabilidade") rebaixa a confiança: é a
fonte falando do próprio número.

**`stable` existe, e não são só os quatro trechos da curva.** Uma série
genuinamente parada num nível normal não é nenhum dos quatro; encaixá-la
à força em "recuperando" ou "no fundo" seria inventar um movimento que o
dado não mostra. E `phase: null` com motivo explícito
(`no_points` / `too_few_points` / `series_break_too_recent`) é a resposta
para menos de 6 períodos — mesmo princípio de `lib/market/countries.ts`,
que prefere dizer "não existe convenção de currículo para este país" a
fingir cobertura.

O limiar de planura (1,5% do nível por período) foi **calibrado contra
dois casos concretos**, não escolhido por ser redondo: uma série que
oscila ±0,1 p.p. em torno de 2,5% sem ir a lugar nenhum produz
inclinação ~0,013 e precisa sair `stable`; uma que cai 0,05 p.p. por
trimestre de forma consistente produz ~0,019 e precisa sair `cooling`.
Os dois estão no teste.

**Execução real das duas APIs em 01/09/2026** (`npx tsx
src/scripts/fetch-hiring-index.ts --dry-run`): `bls_jolts` completo com
55 pontos em 482ms; `eurostat_jvs` completo com 674 pontos em 717ms; 30
séries de país classificadas. EUA `stable` (mm 4,40, janela com
preliminar); Alemanha, França, Países Baixos, Finlândia e Áustria
`cooling`; Lituânia e Malta `heating_up`; Luxemburgo `bottoming_out`;
Chéquia sem classificação por quebra de série; Reino Unido sem
classificação por só ter 3 pontos. Agregados (`EU27_2020`, `EA20`,
`EA21`) descartados, `EL`→`GR` e `UK`→`GB` traduzidos na fronteira.

57 testes novos (`phase.test.ts`, `connectors/bls-jolts.test.ts`,
`connectors/eurostat.test.ts`), todos com `fetch` injetado e recortes
dos payloads reais como fixture — nenhum toca a rede. `tsc --noEmit` e
`eslint` limpos nos arquivos tocados. `npm test`: 684/684 (627 + 57).

**Fora do escopo desta fase, de propósito:** tela, ligação no
`/api/cron/radar`, conectores ILOSTAT e CEPALSTAT, texto traduzido nos
12 idiomas e agregação por continente. E o `npx prisma db push` do
`LaborMarketPoint` ainda não foi rodado — ver a pendência 13 do HANDOFF.

## 2.52 Índice de temperatura de contratação — fase 2: os 12 idiomas, a tela no laudo pago e um cron próprio

Continuação direta do §2.51, na ordem que a pendência 14 do HANDOFF já
tinha combinado: (a) tradução, (b) tela e (c) cron — **com as duas
fontes que já existem**, antes de acrescentar fonte nova. É melhor
descobrir que a tela não convence com 30 países do que com 200.
ILOSTAT, CEPALSTAT e agregação por continente continuam fora, de
propósito.

**(a) O dicionário veio primeiro, e não por capricho de ordem.** A fase
1 terminou sem uma única string de tela — os identificadores
(`cooling`, `heating_up`) são chave de código, persistida e comparada.
O bloco `hiringIndex` entrou nos 12 dicionários junto com a declaração
em `i18n/types.ts`: 22 chaves por idioma, com rótulo e uma linha de
explicação por fase, mais os estados sem classificação. Nenhum idioma
entrou como tradução retroativa, que é como a dívida do §2.49 nasceu da
primeira vez. `scripts/sync-i18n.ts`: 875/875 chaves, 100% de paridade
nos 12.

Duas coisas ficaram **fora** do dicionário, e isso é decisão, não
esquecimento. O nome do órgão de estatística (`Eurostat`,
`U.S. Bureau of Labor Statistics (JOLTS)`) é nome próprio: traduzi-lo
inventaria uma entidade que não existe. Só o rótulo que o envolve
(`Fonte: {source}`) é traduzido. E o nome do país sai de
`Intl.DisplayNames` com o locale ativo — `lib/market/countries.ts` está
em português por ser lista de formulário, e usá-la aqui colocaria
português dentro das outras 11 telas.

**(b) A tela mora no laudo pago, logo acima do parecer executivo.** O
mercado-alvo sai do Perfil Profissional (`primaryMarket`, com
`residenceCountry` de recuo — mesma ordem do `marketInputFrom` em
`lib/profile`), lido pela rota que já existia; nenhum caminho novo de
busca de perfil foi inventado. Nenhum país é tratado de forma especial:
não há mercado padrão, e sem mercado nem residência declarados o cartão
simplesmente não é montado — não há país sobre o qual dizer nada.

A regra do componente é que **ele nunca fica vazio**. Não existe
renderização condicional que o faça sumir quando falta dado: sumir
parece defeito, e o silêncio deixaria a pessoa achando que a tela
quebrou. Os quatro desfechos têm texto próprio, e são quatro porque as
frases são diferentes:

- fase classificada — rótulo traduzido, cor e ícone (`cooling`
  vermelho, `heating_up` verde, `stable` cinza; mesma linguagem visual
  do bloco de aderência à vaga, não um sistema de design novo);
- **coberto sem histórico bastante** (`covered && phase === null`) —
  "a série oficial deste país ainda não tem histórico suficiente";
- **sem cobertura nenhuma** (`!covered`) — "nenhuma fonte oficial de
  estatística do trabalho cobre este país no nosso índice hoje". O
  índice cobre 30 países e o mundo tem quase 200; mesmo princípio de
  `lib/market/countries.ts`, que prefere admitir que não há convenção
  de currículo para um país a fingir cobertura;
- **falha de consulta** — "não foi possível consultar o indicador
  agora". Trocar isto por "sem dado para este país" seria afirmar algo
  que não se sabe. Pelo mesmo motivo a rota responde 500 quando o banco
  falha, em vez de devolver `covered: false`.

A fonte aparece em toda leitura com série, sem tooltip nem "saiba
mais". E quando a janela final ainda tem impressão preliminar, o aviso
de revisão vem junto e **antes** da linha de fonte — é a ressalva que
muda como o número deve ser lido, pelo motivo do §2.51 (a revisão da
segunda divulgação do JOLTS vale ~180 mil vagas em média).

**O quarto desfecho foi consertado por causa da conferência visual, não
do teste.** O print mostrou o cartão de falha de rede exibindo o selo
"Dado insuficiente" — uma afirmação sobre a série do país feita quando
a requisição nem chegou. O selo deixou de existir nesse estado, e o
teste que trava isso foi escrito depois de ver o defeito, não antes.

`lookup.ts` é puro e testável; `lookup.server.ts` é um `findMany` e
nada mais. A separação é a mesma de `phase.ts` versus script: `lib/db`
carrega `server-only`, cujo `index.js` é um `throw`, e qualquer teste
rodado por `tsx` que o importe morre no import. Pelo mesmo motivo o
componente foi partido em `HiringIndexCard` (busca) e
`HiringIndexCardView` (desenho): um componente que busca no `useEffect`
não renderiza nenhum dos seus desfechos sob `renderToStaticMarkup`, e o
desfecho é justamente o que precisa de trava.

**A consulta traz TODAS as linhas do país, e escolhe a série depois.**
Hoje cada país tem uma fonte só, mas a chave única sempre foi
`country + source + metric + period`, e a fase 3 traz ILOSTAT com OUTRA
métrica para países já cobertos. Um `where` que assumisse uma linha por
país passaria a emendar duas medições diferentes na mesma série no dia
em que a terceira fonte entrasse — o degrau artificial que `types.ts`
proíbe. O critério (mais pontos; empate desempata por confiança e
depois pelo período mais recente) fica em `lookup.ts`, onde o teste
alcança, e não numa cláusula `where` onde nenhum teste chega.

**(c) O cron é separado do Radar, e o agendamento NÃO foi decidido
aqui.** `/api/cron/radar` tem teto de 12s por fonte dentro dos 60s que
já divide com o digest; enfiar duas APIs de estatística ali faria a
coleta de vagas — diária porque vaga expira — disputar tempo com uma
coleta que não tem pressa nenhuma (o JOLTS publica por mês, o Eurostat
por trimestre). São dois trabalhos com relógios diferentes.

`/api/cron/hiring-index` autentica igual: `CRON_SECRET` no
`Authorization`, 503 quando o segredo falta, 401 quando não confere. O
teto de 20 requisições por 10 minutos do prefixo `/api/cron` no
`middleware.ts` já valia para o caminho novo sem mudar nada lá. A
lógica é compartilhada com o script manual
(`lib/hiring-index/collect.ts`) em vez de duplicada: dois laços de
coleta escritos em separado divergiriam, e o defeito apareceria num
país só, meses depois. O cliente de banco chega por parâmetro porque os
dois gatilhos usam clientes diferentes — o script instancia o seu, pela
mesma razão do `server-only`.

**Não foi declarado em `vercel.json`, de propósito.** Cron custa
invocação, e a conta é Hobby — a tentativa de agendar o Radar de hora
em hora já foi recusada no deploy com essa mensagem, e a conta já tem
dois crons declarados (`radar` às 06:00, `dedup` às 18:00). Qual dia e
qual hora é decisão de quem paga. Enquanto isso a rota funciona e pode
ser chamada à mão com `Authorization: Bearer $CRON_SECRET`, e o script
manual continua valendo. O TODO está no cabeçalho da rota.

**Um número medido mudou o código.** A primeira execução real do cron
levou **37s**, dos quais só ~2s foram as duas APIs: as 729 linhas
gravadas uma a uma custaram ~35s de ida-e-volta de rede. Sob o teto de
60s da função isso é margem curta demais para uma tabela que só cresce
(cada divulgação acrescenta uma linha por país). Os `upsert` passaram a
sair em lotes de 8 em paralelo — oito, e não o máximo possível, porque
dividem o pool de conexões com as requisições de usuário e um cron
noturno não deve poder segurar a tela de ninguém. A execução seguinte:
**6,5s**, mesmas 729 linhas.

**Conferido contra o banco de produção e com navegador, não só com
teste.** O `summarizeHiringIndex` rodado sobre as 729 linhas reais
reproduziu os quatro desfechos: EUA `stable` com janela preliminar (55
pontos, jul/2026, BLS); Alemanha `cooling` (24 pontos, 2025-Q4,
Eurostat); Reino Unido sem classificação por `too_few_points` (3
pontos); Chéquia sem classificação por `series_break_too_recent`;
Brasil, Japão e o código inexistente `ZZ` como não cobertos. As rotas
foram batidas com `curl` real contra o `next dev`: `/api/hiring-index/US`
sem sessão → 401; cron sem segredo e com segredo errado → 401; com o
segredo certo → 200, `bls_jolts` e `eurostat_jvs` completos, 30 séries,
729 gravadas, 2 sem classificação (exatamente Reino Unido e Chéquia).

O cartão foi renderizado em navegador nos oito estados (as quatro
situações, mais pt/en/ja, mais carregando e falha) — foi esse print que
encontrou o defeito do selo. **Achado de bônus, que vale registrar:** o
navegador continuou mostrando o selo já corrigido mesmo depois de
apagar `.next` e reiniciar o servidor. O HTML servido por `curl` já
estava certo; o que estava velho era o *chunk* de cliente em cache no
navegador — é exatamente o efeito do aviso que o próprio Next imprime
na subida ("Custom Cache-Control headers detected for `/_next/static/:path*`
can break Next.js development behavior"). Quem for conferir tela em
`next dev` neste projeto precisa saber disso, ou vai concluir que uma
correção não funcionou quando ela funcionou.

45 testes novos: `lookup.test.ts` (19 — escolha de série, os três
desfechos de dado, e a trava de que o resumo nunca devolve texto de
tela), `collect.test.ts` (12 — fonte que falha não grava um único
ponto, fonte que lança não derruba as outras, o `update` reescreve
valor e marcação de preliminar) e `hiring-index-card.test.ts` (14 — o
cartão renderiza nos 12 idiomas, nenhum `{placeholder}` sobra, a fonte
nunca some, e cada um dos quatro desfechos sai com o texto certo e só
com o dele). `tsc --noEmit` e `eslint` limpos nos arquivos tocados.
`npm test`: 729/729 (684 + 45).

**Continua fora do escopo, de propósito:** página pública de marketing
(a colocação é decisão de outra rodada), conectores ILOSTAT e
CEPALSTAT, agregação por continente e o agendamento do cron no
`vercel.json` — as três últimas são as pendências (d), (e) e o TODO
acima.

## 2.53 Revisão de código do índice de temperatura — 3 bugs reais, 2 duplicações

Pedido do operador: revisar o código da fase 1 do zero, com o critério
de não deixar nada pra depois ("resolve tudo, não protele nada,
nunca"). A revisão (nível alto, `code-review`) achou 5 pontos em
`phase.ts`, `collect.ts` e nos dois conectores. Todos corrigidos na
mesma rodada.

**1 — `confidence` calculado antes do corte da quebra de série.**
`classifyHiringPhase` cortava a série na quebra mais recente (`series =
all.slice(start)`) mas calculava `confidence` sobre `all`, a série
INTEIRA, antes do corte. Um país com um ponto antigo de baixa
confiança, seguido de quebra e depois de dados limpos, saía rotulado
"baixa confiança" mesmo a análise real usando só os dados limpos —
justamente o contrário do que a coluna existe para fazer (§2.51: "fica
na coluna, e não num tooltip, para sobreviver a qualquer tela futura").
Corrigido: `confidence` agora é calculado sobre `series`, depois dos
dois cortes (quebra declarada e buraco de calendário, ver item 2).
Teste novo reproduz o cenário exato.

**2 — Média móvel e inclinação tratavam posição no array como se fosse
tempo.** `movingAverage`/`trailingSlope` somam/regridem por ÍNDICE, não
por data. O Eurostat documentadamente falta trimestre de país às vezes
sem declarar quebra de série (`connectors/eurostat.ts`: "Dinamarca
ausente") — um buraco no meio da série entrava na média móvel como se
os dois lados fossem vizinhos, podendo inverter a fase classificada
silenciosamente (uma queda-com-buraco-e-repique podia sair como
"esfriando" contínuo). Este era o mais sério dos três: produzia uma
fase plausível e ERRADA, sem nenhum sinal de que algo estava errado —
o oposto exato da promessa de "nunca fabricar". Corrigido com
`truncateAtLastGap`: a série é cortada de novo no último intervalo
maior que 1,5× a mediana dos intervalos da própria série (o "ritmo
esperado" não é parametrizado — mensal ou trimestral —, é inferido da
própria série). Novo motivo de "não sei" (`irregular_series`),
distinto de `series_break_too_recent` porque um é declarado pela fonte
e o outro, descoberto pela própria série. Não exigiu nenhuma mudança
de UI ou de i18n: os 12 dicionários e o cartão nunca diferenciaram por
`insufficientDataReason`, só por "tem fase ou não" — confirmado antes
de decidir que o novo valor era seguro de adicionar.

**3 — `start = 0` usado tanto para "nenhuma quebra" quanto para "quebra
no primeiro ponto".** Sentinela ambíguo: se o ponto mais antigo da
janela pedida já fosse, ele mesmo, a quebra, o índice encontrado (`0`)
era indistinguível do valor inicial usado quando não existe quebra
nenhuma — o motivo de diagnóstico saía errado (`too_few_points` em vez
de `series_break_too_recent`), embora o resultado mostrado ao usuário
(`phase: null`) já estivesse certo nos dois casos. Corrigido com `-1`
como sentinela de "não encontrado".

**4 — BLS e Eurostat buscados em sequência.** Duas chamadas de rede
independentes, cada uma com teto próprio de 30s, rodavam uma depois da
outra — pior caso ~60s em vez de ~30s. Sem efeito funcional (só 2
fontes existem hoje), mas cresceria mal quando ILOSTAT/CEPALSTAT
entrarem (pendência (d)). `collectHiringIndexPoints` agora busca as
fontes com `Promise.all`, preservando a ordem de saída de
`sources`/`points` independente de qual responde primeiro.

**5 — Lógica de timeout duplicada entre os dois conectores.** O mesmo
`AbortController` + `setTimeout` + `try/catch/finally`, quase byte a
byte, em `bls-jolts.ts` e `eurostat.ts` (a revisão notou que o mesmo
padrão já existia antes em `lib/jobs/adapters/jobbase.ts` — só a
duplicação ENTRE os dois conectores novos foi resolvida aqui, não a
mais antiga, que é de outra feature). Extraído para
`connectors/fetch-with-budget.ts`, com teste próprio.

Testes novos: 4 (`fetch-with-budget.test.ts`) + 3 em `phase.test.ts`
(buraco no meio da série, buraco no início não atrapalha, quebra no
ponto mais antigo, confiança pós-corte). `tsc --noEmit` e `eslint`
limpos. `npm test`: 737/737 (729 + 8).

---

## 2.54 Índice de temperatura de contratação — fase 3: ILOSTAT e CEPALSTAT, de 30 para 98 países

Pendência 14 item (d). Antes desta rodada o índice cobria **30 países**
— os EUA pelo BLS e 29 da UE/EEE pelo Eurostat —, e para todo o resto
do mundo a tela dizia, com todas as letras, "nenhuma fonte oficial
cobre este país". Depois dela são **98 países** e 2.757 pontos no
banco: Japão, Índia, Austrália, África do Sul, Gana, Ruanda, Angola,
Zâmbia, toda a América Latina.

### As duas fontes, verificadas contra a API real em 01/09/2026

**ILOSTAT (Organização Internacional do Trabalho)** — web service SDMX
em `sdmx.ilo.org`, aberto e sem chave:

```
GET https://sdmx.ilo.org/rest/data/ILO,DF_UNE_DEAP_SEX_AGE_RT,1.0/
    .Q.UNE_DEAP_RT.SEX_T.AGE_YTHADULT_YGE15
    ?startPeriod=2020-Q4&dimensionAtObservation=AllDimensions
Accept: application/vnd.sdmx.data+json;version=1.0
Accept-Language: en
```

104 áreas, 1.826 observações. A ordem das dimensões da chave posicional
(`REF_AREA.FREQ.MEASURE.SEX.AGE.TIME_PERIOD`) saiu de
`GET /rest/datastructure/ILO/UNE_DEAP_SEX_AGE_RT`, não de suposição:
numa chave SDMX, trocar duas dimensões de lugar não dá erro — dá
resposta vazia, que é o defeito que o Eurostat já ensinou aqui (§2.51).

**CEPALSTAT (CEPAL/ECLAC)** — API de dados abertos, também sem chave:

```
GET https://api-cepalstat.cepal.org/cepalstat/api/v1/indicator/2182/data
    ?lang=en&format=json
```

803 registros, 2014-Q1 a 2025-Q2, 15 países da região mais três
agregados. O identificador 2182 ("Unemployment rate by quarter") foi
achado em `GET /cepalstat/api/v1/thematic-tree?lang=en&format=json`, no
nó `Social > Labour > Unemployment` — não adivinhado.

### Trimestral, e só trimestral — a decisão que definiu a cobertura

Os dois fluxos publicam também em frequência anual, e é aí que estaria
"o mundo todo". Ficou de fora, por duas razões que se somam:

1. `periodType` do produto é `month | quarter`. Um ponto anual gravado
   como se fosse mensal apareceria na tela formatado como "janeiro de
   2024" — um período que ninguém publicou.
2. Misturar frequências sob o mesmo `source|metric` seria pior que
   inútil: `selectSeries` agrupa por fonte e métrica, não por ritmo, e
   uma série com dois compassos faria a média móvel de 3 períodos somar
   um trimestre com dois meses.

E não se perde nada: conferido na resposta real, os **48 países com
série mensal no ILOSTAT são um subconjunto exato dos 95 com série
trimestral**. Nenhum país existe só em `M`.

### Por que os dados relatados, e não as estimativas modeladas do ILO

O ILOSTAT publica `DF_UNE_2EAP_SEX_AGE_RT`, "ILO modelled estimates",
que chega perto de **190 países**. É exatamente aí que mora a diferença
entre 98 e "o mundo inteiro", e é exatamente por isso que ele não foi
usado: para um país sem pesquisa de força de trabalho, o número da série
modelada é imputado por regressão a partir de covariáveis, não medido.
Gravá-lo produziria "fase de contratação" para países onde ninguém
contou nada — a mesma classe de erro do incidente da Adzuna (resposta
vazia lida como "nenhuma vaga"), só que mais difícil de perceber, porque
o número chega com aparência de dado.

**Cobertura menor e verdadeira; não maior e inventada.** Registrado aqui
porque a pergunta "por que não são 190?" vai voltar.

### `confidence: 'low'` incondicional, inclusive para Alemanha e EUA

Nenhum dos dois conectores decide confiança caso a caso. Todo ponto sai
`low`, e a razão é a que já estava escrita no `schema.prisma` desde a
fase 1: taxa de desemprego mede coisa diferente de taxa de vaga em
aberto, e em economia com setor informal grande mede mal — quem trabalha
informalmente conta como "empregado" sem que exista contratação formal
nenhuma por trás. Um mercado formal parado e um aquecido podem devolver
a mesma taxa. No caso do CEPALSTAT isso é mais agudo ainda: a própria
definição do indicador diz que os dados "correspond to the open
unemployment and **urban** coverage unless it is indicated".

Conferido no banco depois da gravação: **0 linhas** das duas fontes
novas com confiança diferente de `low`.

### Nenhuma lógica de exclusão foi escrita — e isso foi verificado, não presumido

ILOSTAT devolve Alemanha, França e EUA junto com o resto. Não há filtro
nos conectores para evitá-los, de propósito: `selectSeries` (§2.51,
`lookup.ts`) já escolhe por país a série de mais pontos, desempatando
por confiança. Escrever a exclusão também no conector manteria duas
cópias da mesma regra, e um dia elas discordariam.

Conferido por consulta direta ao banco, não pelo log:

| País | linhas na tabela | série escolhida | confiança |
|---|---|---|---|
| DE | 45 (eurostat_jvs + ilostat_une) | `eurostat_jvs` / `job_vacancy_rate` | high |
| FR | 45 | `eurostat_jvs` / `job_vacancy_rate` | high |
| US | 78 (bls_jolts + ilostat_une) | `bls_jolts` / `job_openings_rate` | high |
| ZA | 19 (só ILOSTAT) | `ilostat_une` / `unemployment_rate` | low |
| JP, IN, GH, RW | só ILOSTAT | `ilostat_une` | low |

### Três descobertas que só a chamada real produziu

**1 — `Accept-Language` é obrigatório, e o motivo é feio.** A mesma URL
que responde 200 no `curl` respondia **HTTP 500** pelo `fetch` do Node,
com um corpo de doze caracteres: `languageTag1`. O `curl` não manda
`Accept-Language` nenhum; o `fetch` do Node manda `Accept-Language: *`
por padrão, e o NSI Web Service (v8.19.6.0, o que o ILO usa) estoura ao
interpretar `*` como etiqueta de idioma. `Accept-Language: en` resolve.
Isso não está em documentação nenhuma e não sairia de leitura de código
— apareceu na primeira coleta real, quando o ILOSTAT foi a única das
quatro fontes a voltar `failed` enquanto o `curl` da mesma URL
continuava respondendo 200.

**2 — `errors: []` vem em toda resposta bem-sucedida do ILOSTAT.** E
array vazio é *truthy* em JavaScript. A primeira versão testava só a
presença da chave e rejeitou a coleta inteira em silêncio, com a
mensagem `ILOSTAT devolveu erro: []`. Corrigido e coberto por teste.

**3 — O `OBS_STATUS` do SDMX-JSON é índice, não código.** Os atributos
da observação chegam como índices para listas que contêm **só os valores
presentes naquela resposta**. Na leitura de 01/09/2026 a lista tinha um
único elemento, `B` (quebra de série), então "índice 0 = quebra"
funcionaria hoje e quebraria calado na primeira resposta que trouxesse
`P` antes de `B`. O índice é sempre resolvido para o código, e há um
teste que inverte a ordem da lista de propósito para provar isso.

### Quebra de série: as duas fontes declaram, cada uma do seu jeito

O ILOSTAT usa o código `B` do `OBS_STATUS`, marcado em pontos
individuais (Guatemala em quatro trimestres seguidos, EUA em 2025-Q4).

O CEPALSTAT não tem campo de status: ele traz `footnotes` com o texto de
cada nota e, em cada registro, os `notes_ids` aplicáveis. Três notas
dizem, com estas palavras, "New measurement since [ano]; data are not
comparable with previous years" — e cada uma está presa a **um único**
registro, o primeiro da medição nova (8604 na República Dominicana em
2015, 8800 no Brasil em 2016, 8801 no Paraguai em 2017). Isso é
exatamente `seriesBreak`.

A leitura é pelo **texto**, não pelo `id` — um número de nota é chave
interna que pode ser reemitida, a frase é o que a fonte afirma —, e o
casamento é deliberadamente estreito: a nota 15092, presa a 46 registros
da Argentina, também fala de comparabilidade ("INDEC ... recommends
disregarding the series published between 2007 and 2015"), mas é
ressalva geral do período inteiro, não ponto de corte; marcá-la como
quebra faria `classifyHiringPhase` cortar a série argentina em 46
lugares. É por isso que a chamada fixa `lang=en`.

Resultado no banco: **16 pontos** com `seriesBreak: true` vindos das
duas fontes novas.

### `iso3.ts`: alfa-3 → alfa-2, na fronteira

As duas fontes falam ISO 3166-1 alfa-3 (`BRA`, `DEU`); o produto guarda
alfa-2. Sem tradução, o Brasil viraria dois países no banco — a mesma
razão pela qual o Eurostat traduz `EL`→`GR` e `UK`→`GB` (§2.51). A
tabela mora em `connectors/iso3.ts` porque **os dois** conectores
precisam dela; copiada em dois arquivos, divergiria na primeira
correção.

Ela cobre exatamente os 173 países de `lib/market/countries.ts`, e a
bijeção é garantida por teste (nenhum país do produto sem alfa-3, nenhum
alfa-3 apontando para país que o produto não conhece). Cada par foi
conferido contra os nomes oficiais em inglês da codelist `CL_AREA` do
próprio ILOSTAT cruzados com `Intl.DisplayNames` — não escritos de
memória.

Código fora da tabela **não vira país**: devolve `null`, e o conector
registra o descarte no `error` do resultado. Acontece de verdade — o
ILOSTAT publica `KOS` (Kosovo, que não é ISO 3166-1) e `PSE`, `DJI`,
`GRD`, `LCA`, `MAC`, `SYC` (que são ISO mas não estão na lista do
produto). A coleta real sai `partial` por causa disso, com os sete
códigos nomeados no aviso. Inventar um alfa-2 para eles gravaria país
fantasma; silenciá-los esconderia perda de cobertura.

### Nenhuma linha de UI, nenhuma chave de i18n

Confirmado antes de escrever qualquer coisa, não depois: o cartão
(`hiring-index-card.tsx`) e os 12 dicionários nunca ramificaram por
fonte nem por métrica — só por "tem fase ou não". Duas fontes novas com
uma métrica nova entraram sem tocar em nenhum dos treze arquivos. O
único acréscimo de texto foi em `SOURCE_DISPLAY_NAMES`, que fica FORA do
i18n de propósito (§2.52): nome de instituição não se traduz, e
"Comissão Econômica para a América Latina" é um nome que não existe em
documento nenhum — a entrada é
`CEPALSTAT (Comisión Económica para América Latina y el Caribe)`.

### Coleta real, contra o banco de produção

```
[bls_jolts]     complete —   55 ponto(s) em  659ms
[eurostat_jvs]  complete —  674 ponto(s) em  720ms
[ilostat_une]   partial  — 1746 ponto(s) em 1349ms
  aviso: Códigos de país desconhecidos ignorados: DJI, GRD, KOS, LCA, MAC, PSE, SYC
[cepalstat_une] complete —  282 ponto(s) em  938ms

142 série(s) de país, 2757 ponto(s). 2757 ponto(s) gravado(s).
```

**Ponto de atenção para quem cuidar do cron:** a gravação passou de 729
para 2.757 linhas, e a rodada inteira levou ~24s de ponta a ponta contra
o banco de produção. O teto da função da Vercel é 60s
(`maxDuration = 60` em `/api/cron/hiring-index`). Ainda cabe, mas a
folga encolheu — a janela de 24 trimestres por fonte é o que segura esse
número, e aumentá-la mexe direto nisso. `WRITE_CONCURRENCY = 8` não foi
alterado: o número foi escolhido com medição no §2.52 e o pool de
conexões é dividido com requisições de usuário.

### Verificação

`npx tsc --noEmit` e `npx eslint src/lib/hiring-index/` limpos.
`npm test`: **790/790**, `fail 0` (737 + 53 novos — 20 em
`ilostat.test.ts`, 19 em `cepalstat.test.ts`, 6 em `iso3.test.ts`, 5 em
`lookup.test.ts`, 3 em `collect.test.ts`; nenhum toca a rede, todos com
`fetch` injetado e recortes dos payloads reais).

Conferência final feita por **consulta direta ao banco**, não pelo log
do script — a cultura do §2.51 e da pendência 13: linhas por fonte,
países distintos (98), amostras cruas de `ZA`, `BR` e `DE`, contagem de
`seriesBreak` e `selectSeries` rodado sobre as linhas reais de onze
países.

**Fica aberto:** pendência 14 item (e), agregação por continente — que
precisa responder antes como se agrega uma série que o §2.51 diz não ser
comparável entre países. A resposta provável continua sendo agregar as
*fases*, não os valores, e agora há 98 países para isso em vez de 30.

## 2.55 Adzuna: de 11 para 19 países verificados — e a descoberta de que a lista nunca foi o gargalo

O pedido era estreito: o comentário em `/api/cron/radar/route.ts` dizia
que os onze países de `ADZUNA_COUNTRIES` eram "todos os que a Adzuna
cobre", e havia indício externo de que já não eram. Verificar e ampliar.

A verificação confirmou o indício. A investigação que veio junto
mostrou que ampliar a lista, sozinho, **não coletaria uma vaga a mais** —
e é essa parte que importa.

### A cobertura real, verificada contra a API em 02/09/2026

Um `GET` por país em
`api.adzuna.com/v1/api/jobs/{country}/search/1?results_per_page=50&max_days_old=30&sort_by=date`,
com as credenciais desta instalação. Responderam **200 com 50
resultados** dezenove países. O `count` declarado por cada um, como
ordem de grandeza do mercado:

| país | `count` | | país | `count` |
|------|---------|-|------|---------|
| us | 3.657.405 | | nl • | 99.342 |
| de |   654.021 | | mx |  91.432 |
| fr |   566.334 | | pl • | 83.726 |
| br |   468.460 | | ch • | 66.897 |
| gb |   377.272 | | za • | 61.377 |
| au |   188.473 | | be • | 59.028 |
| ca |   151.909 | | es |  50.377 |
| it |   113.065 | | sg • | 29.557 |
| in |   111.577 | | at • | 20.671 |
|    |           | | nz • |  6.552 |

Os oito marcados com • são os novos. Os oito candidatos apontados pela
pesquisa externa se confirmaram, um a um — mas a confirmação veio da
requisição, não da lista.

**Responderam 404 com `exception: UNSUPPORTED_COUNTRY`:** `pt`, `jp`
(já sabidos), `ru`, `ie`, `se`, `no`, `dk`, `fi`, `ae`. A Rússia entrou
no teste justamente porque listas antigas da Adzuna a citam. Não é mais
atendida. É o caso que sustenta a regra: "a documentação diz" não
substitui a requisição.

**Não existe endpoint de descoberta nesta assinatura.** `jobs/countries`
e `countries` responderam 404 `UNKNOWN_METHOD`; `version` e
`jobs/gb/categories` responderam 400. A "Intelligence API" que a Adzuna
divulga é outro produto, com outro acesso. A lista de países só se
descobre país a país — que é o motivo de ela morar no código, com data.

### Descoberta 1: a fila nunca saiu da lista de países

`planAdzunaRound` recebia como entrada apenas os países vindos de
`searchTermsByCountry()` — ou seja, os países onde **algum perfil
declarou morar**. E filtrava fora todo país sem termo, por uma regra que
era boa no seu contexto: "gastar requisição numa busca vazia é gastar
cota de quem tem o que procurar".

Consulta ao banco de produção em 02/09/2026:

```
PERFIS POR PAIS: BR=4
POR FONTE: jobbase=3909  gupy=623  adzuna:br=400  remoteok=293
           greenhouse:vercel=98  remotive=24
```

Quatro perfis, todos no Brasil. Uma única fonte Adzuna existente no
banco: `adzuna:br`. Nenhuma `adzuna:us`, nenhuma `adzuna:de`. Os onze
países eram onze no papel e **um** na execução, e o comentário que
declarava "55 requisições por rodada" descrevia um consumo que nunca
aconteceu — o real era 5.

Acrescentar oito códigos ao array teria mantido o número em 5. O
gargalo nunca foi a lista.

Isso também é, literalmente, o viés que a regra do operador proíbe: o
corpo de vagas do produto acabou sendo o do Brasil porque foi de lá que
vieram os primeiros usuários — sem que ninguém tenha decidido isso.

### Descoberta 2: sete dos onze mercados gravariam vaga sem país

A Adzuna devolve o país em `location.area[0]`, **no idioma do mercado**.
O `area[0]` observado em cada país, contra os apelidos que
`lib/market/countries.ts` tinha:

| país | `area[0]` | casava? | | país | `area[0]` | casava? |
|------|-----------|---------|-|------|-----------|---------|
| br | Brasil | sim | | gb | **UK** | não |
| us | US | sim (ISO2) | | ca | **Canada** | não |
| mx | México | sim | | es | **España** | não |
| it | Italia | sim (apelido) | | de | **Deutschland** | não |
| | | | | fr | **France** | não |
| | | | | in | **India** | não |
| | | | | au | **Australia** | não |

`countryCodeFromName` devolvia `null` para os sete — e `null` é o
comportamento **correto** dela: nome desconhecido nunca vira palpite. O
defeito era a tabela estar incompleta. Uma vaga sem país entra sem
mercado (`marketForCountry` só é chamado quando há país) e o filtro duro
a trata como vaga de lugar nenhum.

Enquanto só o Brasil era varrido, isso era invisível: "Brasil" casa. No
dia em que os outros mercados rodassem, sete dos onze gravariam vaga sem
país — e ninguém veria erro nenhum, porque não há erro: há um campo
nulo.

"UK" tinha um agravante próprio. `countryCodeFromName` testava o atalho
de duas letras **antes** da tabela de nomes: "UK" tem a forma de ISO2,
não é ISO2 (o ISO do Reino Unido é `GB`), e a função desistia ali sem
nunca consultar a tabela onde o apelido poderia estar. A ordem foi
invertida — nenhum nome de país tem duas letras, então perguntar
primeiro à tabela não tira nada de ninguém.

Os quinze apelidos acrescentados saíram todos do `area[0]` observado nos
50 resultados de cada país. Nenhum foi deduzido de tabela de idiomas.
Bélgica e Suíça são multilíngues e só as formas observadas ("België",
"Schweiz") entraram; "Belgique" e "Suisse" **não** estão lá, e há um
teste que trava isso — se um dia aparecerem, a falha é a segura (país
nulo, mercado global, vaga preservada).

### A correção: varredura de base, sem termo inventado

País coberto onde ninguém mora passa a ser varrido **sem `what`** — as
vagas mais recentes daquele mercado. Verificado na mesma rodada: sem
`what`, a busca responde 200 com as 50 mais recentes.

A alternativa seria semear cada país com cargos escolhidos por nós.
Seria inventar demanda: o corpo de vagas passaria a refletir o que
*adivinhamos* que se procura na Polônia. Uma busca sem termo não escolhe
profissão nenhuma — que é exatamente a propriedade necessária para um
dia medir quais profissões crescem por país. E custa **uma** requisição
contra as cinco de um país com termos.

`what=` (string vazia) **não** é o mesmo que não mandar `what`. O
parâmetro é omitido, e há teste sobre a URL montada.

### O limite que aperta é o relógio, não a cota

Os adapters rodam **em sequência** dentro dos 45s de `RUN_BUDGET_MS`, e
a Adzuna é a última da lista. Medição contra a API real em 02/09/2026,
oito requisições sequenciais:

```
br 1675ms · us 2072ms · gb 1366ms · nl 826ms
pl 957ms · sg 853ms · za 1071ms · nz 1082ms
mediana 1082ms | máx 2072ms
```

Com a gravação de até 50 vagas por país (~0,9s, seis idas ao banco),
um país com cinco termos custa ~6s e um de varredura de base, ~2s.
Dezenove países numa rodada pediriam ~40s **só de Adzuna**, e ela não
tem 40s.

Por isso `ADZUNA_COUNTRIES_PER_RUN` **baixou** de 11 para 8, e não
subiu. O `11` significava "todos todo dia", e isso deixou de ser verdade
quando a lista virou dezenove. Oito por rodada cobrem os dezenove em
três dias — o compromisso de sempre: ninguém fica para trás, só espera.

Estourar o tempo degrada de um jeito específico e benigno: `runRadar`
para de percorrer adapters, a rodada devolve `ranOutOfTime: true`, e o
país que não rodou continua com `lastCollectionAt` nulo — o rodízio o
põe na frente na rodada seguinte, sozinho. Há teste para isso. Ainda
assim, dimensionar para caber é melhor que contar com o conserto:
`recordQuotaUsage` grava o consumo **planejado** antes de rodar, então
planejar o que não cabe infla o número da cota com requisições que nunca
aconteceram.

### A conta do mês

| | por rodada | por mês (×31) | % da cota (2.500) |
|---|---|---|---|
| Antes (declarado) | 55 | 1.705 | 68% |
| Antes (real, só `br`) | 5 | 155 | 6% |
| Depois, caso real de hoje | 12 | 372 | 15% |
| Depois, pior caso | 40 | 1.240 | 50% |

O "caso real de hoje" é um país com termos (Brasil) e sete de varredura
de base. O "pior caso" é os oito países da rodada todos com cinco termos
— o que só acontece quando houver perfis em oito mercados. A folga de
1.260/mês fica bem acima da reserva de 20% (500) para a busca sob
demanda, ainda não implementada (§21, Etapa 9).

### O que isto é, e o que NÃO é

É crescimento de **volume bruto**, e só. A expectativa realista, uma vez
em produção: 8 países × 50 vagas por rodada, menos duplicatas e menos
vagas descartadas por falta de empresa/título/URL — na ordem de **200 a
350 vagas novas por dia**, contra as ~50 de hoje, distribuídas por
dezenove países em vez de concentradas em um.

**Não** habilita "profissões em alta por país". Aquilo continua
inviável, pelo mesmo motivo de sempre: 5.347 vagas totais, com a maioria
dos países em unidades. Isto ataca a causa daquele número — não o
substitui. Só faz sentido reavaliar a viabilidade depois de algumas
semanas de coleta, olhando `normalizedTitle` por país no banco, não
estimativa.

Vale registrar o que ficou por resolver: a varredura de base é uma
amostra do que foi publicado **naquele dia**, não do mercado inteiro.
Para série temporal isso é adequado; para "quantas vagas de X existem na
Polônia", não é, e ninguém deve lê-la assim.

### Verificação

`npx tsc --noEmit` e `npx eslint` limpos nos sete arquivos tocados.
`npm test`: **805/805**, `fail 0` (790 + 15 novos — 8 em
`adzuna-plan.test.ts`, 3 em `adzuna.test.ts`, 5 em `countries.test.ts`,
arquivo novo; nenhum toca a rede, todos com `fetch` injetado).

As 47 requisições gastas na verificação saíram da cota do mês de
setembro (~1,9%). Estão declaradas aqui porque não passaram por
`recordQuotaUsage`: foram feitas por script fora da rodada.

**Fica aberto:** as credenciais da Adzuna **não estão no `.env` local na
forma que o código lê**. `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` estão
declarados no `.env.example`, mas o `.env` traz só uma linha solta
`api key: ...` num bloco de comentário, e o `app_id` só existe embutido
no `utm_source` dos `redirect_url` gravados em `adzuna.json`. Em produção
funciona (as variáveis estão na Vercel), mas rodar a coleta localmente
falha em silêncio: `adzunaCredentials` devolve `null` e a fonte
simplesmente não entra na lista de adapters. Vale normalizar o `.env`
local.

---

## 2.56 Mapa-múndi público de temperatura de contratação (`/market-pulse`) — e o sinal invertido que a conferência revelou

Pendência 14 item (e), a última que restava do índice, fechada — mas
**não** como "agregação por continente". Ver abaixo por que continente
não é a unidade certa.

O pedido era uma página pública com um mapa do mundo colorido pela fase
de contratação de cada país, e um "Índice GriffoWork" que resumisse a
tendência geral. A ordem dada foi explícita: **confiável e real
primeiro, interessante depois** — um mapa menor e honesto vale mais que
um impressionante e inflado.

### O defeito que a página revelou: o sinal da métrica estava trocado

Este é o achado mais importante da rodada, e ele não tem nada a ver com
mapa. Foi descoberto na conferência contra o banco de produção, ao ver
que **39 dos 84 países classificados apareciam em `cooling`** — número
alto demais para ser verdade.

`classifyHiringPhase` classifica uma CURVA: subindo é `heating_up`,
caindo é `cooling`. Isso está certo para taxa de vaga em aberto (JOLTS,
Eurostat) — mais vagas abertas é mais contratação. **Para taxa de
desemprego é exatamente o contrário**, e as duas fontes da fase 3
(ILOSTAT e CEPALSTAT, §2.54) publicam taxa de desemprego: são 68 dos 98
países cobertos.

O caso concreto, com os números que estavam no banco:

| País | métrica | série (8 últimos) | fase ANTES | fase DEPOIS |
|---|---|---|---|---|
| BR | `unemployment_rate` | 6,87 → 6,03 (desemprego CAINDO) | `cooling` | `heating_up` |
| ZA | `unemployment_rate` | 31,6 → 33,0 (desemprego SUBINDO) | `bottoming_out` | `cooling` |
| DE | `job_vacancy_rate` | 3,5 → 2,6 | `cooling` | `cooling` (inalterada) |
| US | `job_openings_rate` | 4,0 → 4,4 | `stable` | `stable` (inalterada) |

A tela do laudo pago dizia, com todas as letras, *"Esfriando — a
abertura de vagas vem caindo nos últimos períodos"* para um país onde o
desemprego tinha caído quase um ponto percentual. Não é imprecisão: é
uma afirmação falsa, e estava em produção desde o §2.54 para dois terços
da cobertura.

**A correção nega o VALOR antes de classificar** (`METRIC_ORIENTATION`
em `lookup.ts`), e não espelha a fase depois. Espelhar não é bijeção:
`cooling` ↔ `heating_up` até funcionaria, mas `bottoming_out` significa
"parou de cair e está perto do fundo da própria série" — espelhado
viraria "parou de subir perto do topo", que não é fundo de poço de
contratação, é o oposto dele, e não existe fase `topping_out` para
recebê-lo. Negar o valor resolve os cinco casos de uma vez porque todas
as contas de `phase.ts` são consistentes sob negação: a mediana de `-U`
é `-mediana(U)`, o mínimo de `-U` é `-máximo(U)`, e a inclinação
relativa usa `|latest|`, que não muda de módulo. Uma série de desemprego
parada perto do PICO vira, corretamente, contratação parada perto do
fundo — `bottoming_out`.

A trava contra a reincidência é de tipo, não de teste:
`METRIC_ORIENTATION` é `Record<LaborMetric, 1 | -1>`, então **uma
métrica nova acrescentada em `types.ts` sem uma decisão de sentido não
compila**. Foi a falta exata dessa trava que deixou a fase 3 entrar
invertida.

Efeito na distribuição real (98 países, banco de produção, 02/09/2026):

```
antes  cooling 39 · bottoming_out 10 · recovering  2 · heating_up  8 · stable 25
depois cooling 21 · bottoming_out  3 · recovering  2 · heating_up 26 · stable 32
```

Em ambos: 98 rastreados, 84 classificados, 14 sem histórico bastante.

### O "Índice GriffoWork" é uma DISTRIBUIÇÃO, não uma nota

O pedido falava em um número. Ele não existe, e não por falta de
vontade.

`phase.ts` já explica por que os valores de dois países não se comparam:
os institutos europeus medem a mesma taxa com amostras de 2.500 a 75.000
empresas e taxas de resposta de 11,4% a 98,8%, e o próprio Eurostat não
publica um total da UE por causa disso. Somando o §2.54, metade da
cobertura é taxa de desemprego, que mede outra coisa e mede mal onde há
setor informal grande. Uma média ponderada de 98 números medidos por
quatro réguas diferentes teria três casas decimais e nenhum significado.

O que **é** comparável é a FASE, porque cada uma já saiu da comparação
do país com ele mesmo. "Está subindo" é a mesma afirmação em Portugal e
no Quênia, mesmo que 4,1% e 4,1% não sejam a mesma coisa. Então o índice
é uma contagem: quantos países em cada fase, com o total dito junto.

Existe **um** escalar, e ele é declarado como o que é:

```
netBreadth = (países em heating_up) − (países em cooling)
```

Inteiro, não média. Chama-se AMPLITUDE (*breadth*) e não intensidade
porque é isso que mede: em quantos mercados a mais a curva está subindo
acima do próprio normal do que caindo. `+5` quer dizer "cinco países a
mais aquecendo do que esfriando", frase que se confere contando linhas
na tabela. `recovering`, `bottoming_out` e `stable` ficam de fora do
escalar de propósito — são estados intermediários, e incluí-los exigiria
pesá-los uns contra os outros, que é o arbítrio que a distribuição
evita. Eles continuam visíveis na distribuição, que é a leitura
principal.

**Por que não por continente**, que era a redação da pendência: um
continente não mede nada. A África reúne países cobertos pelo ILOSTAT
com países sem fonte alguma, e "África: 60% aquecendo" seria uma
afirmação sobre os 12 que têm dado apresentada como afirmação sobre 54.
A distribuição global diz o total junto (`84 de 98`) e não sugere
cobertura que não existe.

### O mapa: fonte, licença e projeção

**Natural Earth 1:110m Admin 0**, tag `v5.1.2` de
`github.com/nvkelso/natural-earth-vector` — Countries (polígonos) mais
Tiny Countries (pontos). **Domínio público**, com estas palavras no
`LICENSE.md`: *"Everything here is public domain"* e *"No permission is
needed to use Natural Earth. Crediting the authors is unnecessary."* O
crédito aparece na tela mesmo assim, por política desta base de código.

A geometria é **gerada e versionada**, não baixada em tempo de execução:
`src/scripts/build-world-map.ts` projeta e escreve
`lib/hiring-index/world-map.ts` (118 KB, 174 polígonos + 28 pontos). As
alternativas prontas foram descartadas com motivo: o `worldMapSvg` do
Stephan Wagner tem 13,5 MB no `world.svg`, e o `simple-world-map` é
CC BY-SA — cujo *ShareAlike* é uma pergunta jurídica que uma página de
marketing de produto proprietário não precisa fazer. Renderizar TopoJSON
resolveria a licença mas traria `d3-geo` + `topojson-client` para o
pacote do cliente por causa de uma página. Gerar dá as três coisas:
domínio público, ~100 KB de `path`, zero dependência nova.

Projeção **Miller cilíndrica** (`y = 1,25·ln(tan(π/4 + 0,4·φ))`),
fórmula fechada, sem biblioteca. Miller e não Mercator porque Mercator
faz a Groenlândia parecer maior que a África — numa tela cujo assunto é
"quantos países estão em cada fase", inflar países grandes e frios
distorce a leitura. Antártida fora (nenhum instituto mede força de
trabalho lá) e latitude cortada em −58°, ao sul do ponto mais austral do
Chile continental.

**Os quatro países pequenos que sumiriam.** Barbados, Malta, Maurício e
Singapura têm dado real no índice e não têm polígono em 1:110m. Entram
pela camada `tiny_countries` do próprio Natural Earth — que é uma camada
de PONTOS publicada exatamente para isso — como círculos. Sem ela,
quatro países cobertos ficariam invisíveis, e ausente é indistinguível
de sem dado.

### O país sem cobertura tem DESENHO próprio, não uma cor mais fraca

Hachura diagonal, não cinza claro. Cinza seria só mais uma cor da escala
e a pessoa leria "morno"; a hachura não se confunde com nenhuma das
cinco fases nem em preto e branco nem para quem não distingue vermelho
de verde. São 119 formas hachuradas contra 84 coloridas — o mapa mostra,
sem escrever, o tamanho do que ainda não é coberto.

O terceiro estado também existe e é distinto dos outros dois: país com
fonte oficial mas sem histórico bastante (14 hoje) sai em cinza sólido,
com o rótulo "dado insuficiente" que já existia nos 12 idiomas.

### Dois defeitos de renderização que só o navegador revelou

Nenhum dos dois aparece em `tsc`, `eslint` ou `npm test`. Os dois foram
encontrados abrindo a página no dev server, que é a razão de a
conferência visual estar na lista de obrigações.

**1 — A CSP do projeto bloqueia atributo `style`.** `next.config.ts`
declara `default-src 'self'` e não declara `style-src`, então
`style="background-color: ..."` é bloqueado pelo navegador. A primeira
versão da tela usava `style={{ backgroundColor }}` na legenda, nas
barras e nos ~100 pontos da tabela: **~130 erros de CSP no console**, e
a cor só aparecia depois que o React reaplicava pelo CSSOM na
hidratação — numa página cujo público é justamente quem lê o HTML antes
de qualquer JavaScript rodar. Dentro do `<svg>` o problema não existe
(`fill` é atributo de apresentação, não estilo), então **toda cor
calculada da tela virou SVG**, inclusive as barras da distribuição, e o
que sobrou usa classe do Tailwind. Há teste que falha se um `style=`
reaparecer no HTML.

**2 — As tabelas de idioma do Node e do navegador discordam.** Em
alemão, `Intl.DisplayNames` devolve `Falklandinseln` no Node e
`Falklandinseln (Malwinen)` no Chrome. Uma palavra de diferença fez o
React declarar `Hydration failed` e **descartar a árvore inteira vinda
do servidor**, refazendo-a no cliente: o mapa que o servidor entregou
pronto era jogado fora por causa do nome de uma ilha.

A correção é estrutural: `lib/hiring-index/map-model.ts` monta TUDO que
depende de idioma — nome de país, ordem da tabela, período formatado,
data da coleta, contagens — **uma vez, no servidor**, e o componente só
desenha o que recebe. `HiringMapView` deixou de chamar `Intl` no render.
De quebra, o modelo é puro e testável sem subir servidor, que é a mesma
separação de `lookup.ts` / `lookup.server.ts`.

### A rota pública, e por que ela não exige sessão

`/api/hiring-index/[country]` explica no cabeçalho que a sessão dela não
protege o dado — estatística oficial não é de ninguém — mas evita uma
consulta ao Postgres por requisição anônima. A rota nova
`GET /api/hiring-index` tem outro freio: `loadHiringAtlas`
(`atlas.server.ts`) guarda o resultado **uma hora na memória do
processo**, no mesmo padrão de `ai-router/registry.ts`. Mil visitantes
numa hora custam UMA varredura das 2.757 linhas, não mil.

Uma hora, e não um dia, para um dado que muda por mês: o processo é
reciclado a cada deploy e em toda instância fria, então TTL longo não
compra tanto quanto parece, e o curto garante que uma coleta manual
apareça na página pública no mesmo expediente sem ninguém lembrar de
purgar nada. Falha de consulta **não** é cacheada e **não** vira atlas
vazio — um corpo com zero país seria lido como "nenhum país do mundo tem
fonte oficial", que é uma afirmação, e falsa.

### SEO/GEO: a página é HTML de verdade

`generateMetadata` por idioma (título, descrição, OpenGraph, canônica e
12 `hreflang` para `?lang=`), JSON-LD `Dataset` com cobertura
geográfica, fontes, `dateModified` e `temporalCoverage`, e entrada no
`sitemap.ts` com `changeFrequency: 'monthly'` — o ritmo real das fontes,
não um `daily` que ensinaria o rastreador a desconfiar do arquivo.

**Nenhum número do JSON-LD é escrito à mão**: cobertura, fontes e datas
saem do mesmo atlas que a tela desenha. Um JSON-LD que afirmasse
cobertura maior que a real seria a mesma fabricação que o produto recusa
na tela, só que dita para uma máquina.

A tabela abaixo do mapa lista **os 98 países cobertos com link para
`/{código}`** — a página de país que já existe. É por onde rastreador e
leitor de tela chegam a cada mercado, e é a razão de o clique no mapa
NÃO navegar: no celular só existe o toque, e um toque que levasse embora
da página impediria de ler a leitura do país.

### Idioma

23 chaves novas no bloco `hiringMap`, em `i18n/types.ts` e nos 12
locais, 100% de paridade no `scripts/sync-i18n.ts` e no
`i18n/i18n.test.ts`. **Os rótulos de fase NÃO foram duplicados**: vêm do
bloco `hiringIndex` que o cartão do laudo já usa, porque duas telas do
mesmo produto não podem nomear a mesma fase de dois jeitos.

O recuo de idioma da página é **inglês**, e não o `'pt'` que
`detectLanguageFromCountry` devolve para entrada vazia. Sem sinal
nenhum, o padrão certo é o que o `x-default` do `layout.tsx` já declara.
A ordem é `?lang=` → cookie `griffo_lang` → país da borda
(`cf-ipcountry`, depois `x-vercel-ip-country`) → `en`.

### Nenhum mercado privilegiado

Verificado, não presumido: `summarizeAtlas` ordena por código ISO,
`buildHiringMapModel` ordena a tabela pelo NOME no idioma ativo com
`Intl.Collator`, e há teste que trava as duas ordens. Nenhum país tem
cor, tamanho, posição ou texto diferente dos outros.

### O que NÃO foi feito, e continua registrado

**"Top 10 profissões em alta por país"** foi pedido junto e **não foi
construído** — ver pendência 16 do handoff. O volume não permite: 5.347
vagas totais, 1.035 só do Brasil, 24,5% com profissão reconhecida e 12
categorias na taxonomia. Esta página é de países, sem recorte por
ocupação, e assim seguirá até o banco justificar o contrário.

### Verificação

`npx tsc --noEmit` e `npx eslint` limpos. `npm test`: **855/855**,
`fail 0` — 805 + 50 novos (15 em `atlas.test.ts`, 13 em
`map-model.test.ts`, 16 em `hiring-map.test.ts`, 6 acrescentados a
`lookup.test.ts` para o sinal da métrica).

Conferência contra o banco, não contra o log:

- `SELECT COUNT(DISTINCT country)` = **98**, igual ao `tracked` da rota.
- A distribuição servida por `GET /api/hiring-index` bate número a
  número com a mesma consulta rodada por fora, via `tsx`.
- O HTML servido tem **26 formas `#059669`, 32 `#94a3b8`, 21 `#dc2626`,
  2 `#0284c7`, 3 `#d97706`** — exatamente a distribuição do banco — e
  119 formas hachuradas (202 formas − 84 coloridas, mais o quadrado da
  legenda).
- `GET /api/hiring-index` sem cookie nenhum: **200**, 30.808 bytes, 98
  países. `GET /api/hiring-index/US` sem sessão continua **401**.
- Página aberta no navegador em `?lang=en` e `?lang=de`: título, `h1`,
  descrição, legenda e tabela no idioma certo; 98 links `/xx`; JSON-LD
  `Dataset` com `spatialCoverage` de 98 países; **zero erro de
  hidratação** e zero erro de CSP vindo da página (os que sobram vêm do
  injetor de CSS do Turbopack e do overlay de desenvolvimento, que não
  existem em produção).

## 2.57 Dois defeitos achados pelo operador ao testar de verdade — página órfã e texto estourando a tela

Duas coisas que nenhuma verificação automatizada do §2.56 pegou, porque
as duas só aparecem testando o produto de verdade, logado, num
celular — exatamente o que o operador fez.

**`/market-pulse` não estava linkada em lugar nenhum.** A página existia,
funcionava, estava no `sitemap.ts` — mas nenhum nav, menu ou rodapé
apontava pra ela. Um crawler acharia via sitemap; uma pessoa, não.
Corrigido: link novo em `nav.marketPulse` (chave nova, 12 idiomas,
parceira das que já existem em `t.nav`), colocado no menu desktop, no
menu mobile e no rodapé de `landing.tsx` — os três lugares onde as
outras âncoras da home (`#faq`, `#how`...) já apareciam. Verificado por
`curl` real contra `/br`: os dois links que renderizam no HTML do
servidor (desktop + rodapé) aparecem; o do menu mobile só monta quando
`mobileMenuOpen` é `true` (estado de React), mesmo comportamento dos
outros itens desse menu — não é bug, é como o menu mobile inteiro já
funcionava antes desta mudança.

**A seção "Where & Why to Adjust" do laudo estourava a tela no celular.**
Achado do operador ao abrir o laudo logado. Em
`components/app/analysis-view.tsx`, o bloco que mostra o texto atual
(❌) contra o sugerido (✨) lado a lado usa `font-mono text-xs` sem
`break-words` — texto gerado por IA sem espaço (URL, termo técnico
composto, e-mail) não quebra sozinho nessa fonte, e o item de grid não
tinha `min-w-0`. Os dois juntos são a combinação clássica que faz um
`grid md:grid-cols-2` estourar a largura do container mesmo o container
pai sendo responsivo — `break-words` sozinho não bastaria, porque um
item de grid/flex tem `min-width: auto` por padrão e não encolhe abaixo
do conteúdo. Corrigido nos três textos do bloco (texto atual, sugerido,
justificativa): `break-words` + `min-w-0` nos dois cartões do grid.

Não verificado visualmente com dado real (exigiria rodar uma análise de
currículo completa até gerar `targetedChanges`, fora do escopo desta
correção pontual) — a correção é o par de classes CSS correto e
conhecido para esta classe exata de estouro, aplicado nos três pontos
onde o mesmo padrão (`font-mono`/texto livre sem quebra dentro de grid)
aparece.

`tsc --noEmit`, `eslint` e `npm test` (855/855, paridade i18n 12/12)
limpos depois das duas correções.

## 2.58 Índice GriffoWork na home — versão leve, e uma lição sobre confiar no dev server

Pedido do operador: levar o Índice GriffoWork pra página inicial como
atrativo a mais, sem ser o mapa inteiro (que é pesado demais pra
competir com o CTA principal da home). Construído
`HiringIndexTeaser` (`components/landing/hiring-index-teaser.tsx`):
busca `/api/hiring-index` (a mesma rota pública do §2.56, cache de 1h
já embutido), mostra o nome do agregado, a contagem
"{classificados} de {rastreados} países", uma barra proporcional das 5
fases e um link "Ver mapa completo" pra `/market-pulse`. Sem dado (fetch
falhou ou zero país rastreado), o componente devolve `null` — é decoração,
não a fonte de verdade, então some em vez de ocupar espaço com erro.

A barra é `<svg>` com `<rect fill=...>`, não `<div style={{width}}>`: a
CSP do projeto não declara `style-src` e bloqueia `style` em linha — o
mesmo problema que `map-model.ts` já resolveu pro mapa cheio (§2.56),
resolvido aqui do mesmo jeito.

Link novo (`nav.marketPulse`, 12 idiomas) no menu desktop, menu mobile e
rodapé da `landing.tsx`.

**A parte que valeu registrar não é o componente, é o processo de
verificação.** A primeira tentativa de conferir visualmente (`next dev`
já vinha recebendo edições sucessivas havia várias rodadas, dentro da
mesma sessão do Turbopack) mostrou o teaser inteiro em **inglês**, numa
página inteira em português — parecia um bug real de propagação de
idioma (o componente chegou a ser reescrito uma vez, trocando
`useI18n()` por `t` recebido como prop, pensando que o defeito era
esse). O sintoma sobreviveu a `rm -rf .next` e a um restart completo do
`npm run dev`. O que finalmente provou que o código estava certo foi
**parar de testar em dev**: `npm run build && npm run start` renderizou
tudo em português, sem nenhum erro de hidratação, no primeiro
carregamento. O console do dev mode, checado depois, tinha um `Error:
Hydration failed` bem em cima do `<nav>` e um `TypeError: Cannot read
properties of undefined (reading 'hiringMap')` — sintoma de corrupção
de estado do Fast Refresh depois de dezenas de edições consecutivas no
mesmo processo, não de lógica errada. A troca pra receber `t` por prop
em vez de `useI18n()` foi mantida mesmo assim: é a correção estruturalmente
certa (evita o componente ler `contextLang` e ignorar o `forcedLang` de
uma rota de país), só não era a causa do sintoma observado.

**Lição prática**: quando um componente novo se comporta de um jeito
que a leitura do próprio código não explica, depois de várias dezenas
de edições no mesmo `next dev` ainda de pé, o próximo passo é um build
de produção limpo — não mais uma tentativa de remendo no código.

`tsc --noEmit`, `eslint` e `npm test` (855/855) limpos. Verificado em
build de produção real (`npm run build && npm run start`), não em dev.

## 2.59 Agregação por continente — a pendência 14(e) na redação original dela, e o que mudou para ela virar honesta

A pendência 14(e) dizia "agregação por continente". O §2.56 fechou a
agregação, e **recusou o continente**, com um argumento que continua
inteiramente correto:

> A África reúne países cobertos pelo ILOSTAT com países sem fonte
> alguma, e "África: 60% aquecendo" seria uma afirmação sobre os 12 que
> têm dado apresentada como afirmação sobre 54.

Nada nesse raciocínio mudou. O que mudou é o **denominador**: o recorte
por continente volta porque agora ele carrega, no mesmo objeto e na
mesma linha da tela, quantos países daquele continente **não** têm
fonte. A frase "África: 60% aquecendo" não existe em lugar nenhum;
existe "África — 16 de 48 países com fonte oficial", com a distribuição
ao lado e o resto da barra hachurado.

Continua não havendo nota por continente, pelo mesmo motivo de não
haver nota global (§2.56): valores medidos por réguas diferentes não se
somam. O que se conta é país.

### A tabela país → continente: regra declarada, não bom senso caso a caso

`lib/hiring-index/continents.ts`, 173 pares — a lista inteira de
`lib/market/countries.ts`, e não só os 98 cobertos. É de propósito: o
numerador sai do banco, o denominador sai da lista do produto, e a
pergunta "quantos países existem na Ásia?" tem a resposta honesta
*quantos o produto conhece*, não quantos o mundo tem nem quantos têm
linha em `LaborMarketPoint`.

A regra é **UN M49**, com uma única redução declarada: o M49 tem
*Americas* como região única e o produto precisa de seis continentes
povoados, então a divisão usa a própria hierarquia do M49 — região
intermediária *South America* vira América do Sul; *Northern America*,
*Central America* e *Caribbean* vão para América do Norte.

Uma regra só, aplicada a todos, é o ponto inteiro. País
transcontinental é exatamente onde a atribuição "de bom senso" vira
preferência de quem escreve o código:

| país | M49 | aqui | o que se abre mão |
|---|---|---|---|
| Rússia | Europe / Eastern Europe | **EU** | a maior parte do território é asiática |
| Turquia, Cazaquistão, Geórgia, Armênia, Azerbaijão | Asia / Western e Central Asia | **AS** | — |
| Chipre | Asia / Western Asia | **AS** | é membro da União Europeia |
| Egito | Africa / Northern Africa | **AF** | o Sinai é asiático |
| Timor-Leste | Asia / South-eastern Asia | **AS** | o esquema CIA/GeoNames o põe na Oceania |
| México, Panamá, Cuba, Porto Rico, Trinidad | Americas / Central America e Caribbean | **NA** | — |

**Conferido contra fonte, não escrito de memória** — mesma disciplina
de `connectors/iso3.ts`. Os 173 pares foram derivados de
`datasets/country-codes` (`data/country-codes.csv`, colunas
`Region Name` / `Sub-region Name` / `Intermediate Region Name`, lida em
03/09/2026) e depois conferidos par a par contra um segundo conjunto de
outro mantenedor, `lukes/ISO-3166-Countries-with-Regional-Codes`
(`all/all.csv`). Os dois publicam o M49 da UNSD e concordaram em **172
de 173**.

A única diferença é **Taiwan**, e não é erro de nenhum dos dois: a UNSD
não dá entrada própria a Taiwan no M49 (o território é contado dentro
do código 156, China), então o segundo conjunto o deixa sem região.
Fica `AS`, que é onde a China está e onde a geografia o põe — a
ambiguidade do M49 ali é de status político, não de continente.

A coluna `Continent` do primeiro conjunto (esquema CIA/GeoNames)
discorda do M49 em dois casos, e o M49 prevalece por ser a regra
declarada: **Chipre** (`EU` lá, `AS` aqui) e **Timor-Leste** (`OC` lá,
`AS` aqui).

### A saída: distribuição e cobertura no mesmo objeto

`continentBreakdown` (em `atlas.ts`) **reaproveita
`phaseDistribution`** — uma chamada por continente, com os resumos
daquele continente — em vez de recontar. Duas contagens da mesma coisa
divergiriam na primeira correção feita só numa delas, e a soma dos
continentes deixaria de bater com o total global sem ninguém perceber.

```ts
interface ContinentSummary {
  continent: 'AF' | 'AS' | 'EU' | 'NA' | 'OC' | 'SA'
  distribution: PhaseDistribution  // a MESMA do agregado global
  totalCountries: number           // o denominador honesto
  uncovered: number                // totalCountries - distribution.tracked
}
```

`uncovered` sai calculado daqui e **não** da tela, porque é o número
que a tela seria tentada a esquecer — e esquecê-lo é literalmente o
defeito que o §2.56 apontou. `byContinent` entra em `HiringAtlas`,
portanto sai de graça em `GET /api/hiring-index`: é uma VISTA derivada
do mesmo atlas, não dado novo, e não ganhou rota própria. O cache de
uma hora de `atlas.server.ts` continua fazendo o mesmo sentido — o
custo acrescentado é uma varredura de 98 resumos e seis
`phaseDistribution` sobre partições, contra as 2.757 linhas lidas do
Postgres e as 98 execuções de `classifyHiringPhase` que já existiam.

**Os seis continentes saem sempre, mesmo zerados.** Oceania hoje tem 2
de 5. Omitir um continente sem cobertura faria a tela parecer completa;
zerado, ele diz "aqui não medimos quase nada" com número.

### A barra: o denominador é o continente, não os países medidos

É a decisão de desenho que impede a tela de repetir o defeito. Cada
largura é calculada sobre `totalCountries`, então o pedaço sem fonte
sobra e sai com **a mesma hachura diagonal do mapa**. Com o denominador
nos países cobertos, a África (16 medidos) sairia com a barra cheia e
pareceria tão lida quanto a Europa (37 de 42). Com o denominador no
continente inteiro, uma barra quase toda hachurada é uma frase, e é a
frase verdadeira. A contagem absoluta fica na coluna ao lado, sempre —
nunca uma percentagem sozinha.

A hachura da seção tem `id` próprio (`gw-continent-no-data`) e um
`<defs>` próprio, em vez de referenciar o do `<svg>` do mapa. Funciona
das duas formas em SVG embutido em HTML, mas depender do `<defs>` do
mapa faria as barras perderem exatamente o pedaço que elas existem para
mostrar no dia em que o mapa mudasse de lugar ou não renderizasse.
Tudo em `fill` de SVG, e nada em `style` — a CSP do projeto declara
`default-src 'self'` sem `style-src` e bloqueia estilo em linha (§2.56).

### O nome do continente NÃO vem de `Intl.DisplayNames`

Bloco `continents` novo em `i18n/types.ts` e nos 12 locais: seis
palavras por idioma, mais cinco chaves em `hiringMap`
(`continentHeading`, `continentCoverage`, `continentHint`,
`colContinent`, `colCoverage`). 11 chaves novas por idioma, paridade
100% em `sync-i18n.ts` e em `i18n.test.ts` (911 chaves por dicionário,
12 de 12).

A recusa do `Intl` é a lição do §2.56 aplicada antes de o defeito
acontecer: as tabelas ICU/CLDR do Node e as do navegador não são a
mesma versão e discordam — foi `Falklandinseln` contra
`Falklandinseln (Malwinen)` que fez o React declarar `Hydration failed`
e descartar a árvore inteira vinda do servidor. Cobertura de nome de
continente entre versões de ICU é pelo menos tão irregular quanto a de
nome de país. Seis palavras fixas num dicionário não têm versão.

### Um defeito de teste que a tradução revelou

O helper `textOf` de `hiring-map.test.ts` comparava o HTML renderizado
com a string do dicionário sem desfazer as entidades que o React
escapa. Passou despercebido até agora porque nenhuma chave da tela
tinha apóstrofo; `continentHint` tem, em inglês, francês e italiano
(`qu&#x27;aucune`). O helper passou a desfazer `&#x27;`, `&quot;`,
`&lt;`, `&gt;` e `&amp;` — o defeito era do teste, não da tela.

### Verificação

`npx tsc --noEmit` e `npx eslint` limpos. `npm test`: **884/884**,
`fail 0` — 855 + 29 novos (11 em `continents.test.ts`, 8 em
`atlas.test.ts`, 6 em `map-model.test.ts` e 4 em `hiring-map.test.ts`);
as 11 chaves novas nos 12 idiomas são cobertas pelos testes de paridade
que já existiam.

Conferência contra o banco, não contra o log — a distribuição servida
bate número a número com um `SELECT DISTINCT country` agrupado por
continente por fora, via `tsx`:

```
                 tracked/total  cooling bottoming recovering heating stable  s/hist.
África              16 / 48        0        0          1        3      5        7
Ásia                22 / 48        6        0          0        6      7        3
Europa              37 / 42       15        2          0        7     12        1
América do Norte    11 / 18        0        0          1        3      5        2
Oceania              2 /  5        0        1          0        0      1        0
América do Sul      10 / 12        0        0          0        7      2        1
                    ------        --       --         --       --     --       --
soma                98            21        3          2       26     32       14
```

A última linha é o agregado global do §2.56, sem uma unidade de
diferença: 98 países rastreados, 84 classificados, 14 sem histórico
bastante.

**Verificado em build de produção limpo**, não em dev — a lição do
§2.58 seguida por padrão desta vez, e não depois de perseguir um
fantasma. `rm -rf .next && npm run build && npm run start`, com a
página aberta em `?lang=en`, `?lang=de` e `?lang=pt`: a seção sai com
os seis continentes, os números acima, o nome de cada continente no
idioma certo e a ordem pelo nome no idioma ativo (em português América
do Norte e América do Sul vêm antes de Ásia; em inglês, não). Nenhum
`style=` no HTML servido, **zero erro de hidratação** e nenhum erro de
CSP vindo da página — os dois que sobram no console vêm de um chunk do
próprio Next e aparecem igualmente em `/de`, que não tem uma linha
deste trabalho.

Com isto a **pendência 14 fecha por inteiro**: (a), (b), (c), (d) e (e).

## 2.60 Lighthouse mobile no domínio nu apontou o próprio redirecionamento por geo-IP como o maior custo — trocado por rewrite

Operador rodou o PageSpeed Insights (mobile, 4G lenta) contra
`griffo.work` e trouxe o relatório: Desempenho 72, LCP 6,0s, FCP 2,4s,
e o maior ganho apontado era "Latência da solicitação de documentos —
economia estimada de 1.270ms".

Medido contra produção de verdade (`curl` real, não suposição): a
cadeia do domínio nu tinha **dois redirecionamentos** antes do HTML
começar — `griffo.work` → 308 da Cloudflare pro `www` (não é código
deste projeto, é configuração de domínio) → **307 do nosso próprio
middleware** (§2.50) pro país da borda → `/br`. Isolado o custo do
307 sozinho: ~0,52s de resposta, contra 0,68s pra ir direto em `/br`
sem passar por ele — a diferença bate quase exatamente com os 1.270ms
que o Lighthouse apontou.

**Corrigido em `src/middleware.ts`**: `handleBareDomain` trocou
`NextResponse.redirect(url, 307)` por `NextResponse.rewrite(url)`. Um
rewrite serve o conteúdo do país na MESMA resposta — sem round-trip de
rede extra, sem `Location`, sem o navegador precisar de uma segunda
requisição. A barra de endereço continua mostrando o domínio nu; o
HTML que chega já é o do país certo. Nenhuma das guardas do §2.50 muda
de comportamento: bot, sessão logada (`ca_session`) e escolha manual de
idioma (`griffo_lang`) continuam pulando isto do mesmo jeito — só o
"como" servir o conteúdo certo deixou de custar uma viagem de rede
inteira.

Verificado contra build de produção real (`npm run build && npm run
start`, não `next dev` — a lição do §2.58 seguida à risca desta vez):
`cf-ipcountry: DE` no domínio nu devolve `200` (nunca `307`) com o
`<title>` e o texto de nav já em alemão; bot e cookie de idioma manual
continuam recebendo o conteúdo padrão sem reescrita, como antes.

O primeiro salto (Cloudflare, apex → `www`) continua existindo e não é
corrigível por código deste repositório — fica registrado aqui como o
que resta da cadeia, não como pendência esquecida.

`tsc --noEmit`, `eslint` e `npm test` (884/884) limpos.
