# Auditoria e Plano — Evolução Global do GriffoWork

**Data:** 2026-08-14
**Base:** commit `219f8de`
**Origem:** Prompt Mestre de Evolução do Produto (43 seções, 10 etapas)

> O prompt mestre manda usar **o código real como fonte definitiva**, não a
> documentação. Esta auditoria foi feita lendo o código. Onde a documentação
> anterior (`MAPA-DO-PRODUTO.md`, citado no prompt) divergir, vale o que está
> aqui — aquele arquivo não existe neste repositório.

> **Este arquivo passou de 5.800 linhas.** Antes de abrir por inteiro, veja
> `docs/AUDITORIA-INDICE.md` — lista todo `§` com linha e tema, pra ler só a
> seção que interessa.

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

## 2.61 Índice GriffoWork discreto demais na home, e aviso de idioma escondido dentro de um acordeão fechado

Operador trouxe dois pontos depois de usar o produto: o teaser do
Índice GriffoWork na home "precisa ficar nos olhos de quem abre a
página", e a frase de aviso em Perfil Profissional → Idiomas ("O
idioma da tela não decide o idioma do seu currículo...") estava
escondida.

**Teaser da home (`src/components/landing/hiring-index-teaser.tsx` e
`landing.tsx`)**: o componente existia mas era um cartão claro e
discreto, posicionado depois da seção "Como funciona" — quase no meio
da página. Refeito como cartão de fundo em gradiente escuro
(`from-[#0B192E] via-slate-900 to-[#0B63E5]`), reaproveitando a mesma
linguagem visual do bloco "Pronto para transformar..." no rodapé — o
único outro lugar da página que já usa esse contraste — com indicador
"ao vivo" pulsante (`animate-ping`), tipografia maior e CTA em botão
branco de alto contraste. Reposicionado para logo depois da faixa de
estatísticas do hero, virando o segundo bloco visível da página (antes
de "Presença Digital"), sem entrar dentro do próprio hero e disputar
espaço com o CTA principal de análise de currículo. A barra de
distribuição das fases continua em SVG com `fill`/`x`/`width` como
atributos de apresentação — a CSP do projeto não declara `style-src` e
bloqueia `style` em linha, o mesmo cuidado já documentado em
`map-model.ts`.

**Aviso de idioma escondido (`src/components/app/professional-profile-view.tsx`)**:
a causa raiz não era o texto em si, mas onde ele morava. O acordeão de
Perfil Profissional (`defaultOpenSections`) abre por padrão só as
seções que o usuário ainda **não** preencheu (`.filter((key) =>
!sectionFilled[key])) — ou seja, justamente quem já configurou um
idioma vê essa seção **fechada** ao entrar na página, e o aviso vivia
dentro do `AccordionContent`, invisível até alguém expandir de novo.
É exatamente para quem já preencheu que o aviso mais importa: é quem
está prestes a mudar de idioma sem saber que currículo e interface são
independentes. Corrigido movendo o aviso para fora do
`AccordionContent`, como irmão direto logo após o `AccordionTrigger`
— sempre renderizado, seção aberta ou fechada — reestilizado como caixa
de atenção (fundo âmbar, ícone `Info`) em vez do texto simples que
antes passava despercebido dentro do conteúdo recolhido.

Verificado com build de produção limpo (`rm -rf .next && npm run
build && npm run start`, não `next dev`) e screenshot Playwright em
desktop (1280×900) e mobile (390×844) em `/br`: teaser aparece logo
após as estatísticas do hero, sem overflow em nenhuma largura; aviso
de idiomas visível mesmo com a seção de idiomas fechada por padrão.

`tsc --noEmit`, `eslint` e `npm test` (884/884) limpos — mudança
puramente visual, sem lógica nova a testar (mesmo padrão já usado para
`hiring-index-card.tsx`).

## 2.62 Limpeza de código morto — 39 arquivos e 38 dependências nunca usadas em produção

Operador pediu para apagar arquivos e código "que não serão nunca mais
utilizados". Em vez de apagar por suspeita, cada item foi verificado
antes: `npx knip` (varredura de grafo de import) para o levantamento
inicial, e depois `grep` cruzado item a item confirmando zero
referência real em `src/` antes de qualquer exclusão — a mesma
disciplina de "nada sai sem verificação" já seguida pro resto do
projeto.

**Scaffold de template abandonado, já citado como "não usado" numa
auditoria anterior do próprio projeto (`docs/AUDITORIA.md`, item P3-6)**:
`examples/websocket/` (2 arquivos), `.zscripts/` (6 shell scripts de
build/dev de um template genérico, sem qualquer referência em
`package.json` ou no build real na Vercel), `mini-services/` (pasta
vazia, só `.gitkeep`).

**Scripts CLI substituídos por UI de admin**: `src/scripts/save-stripe-configs.ts`
e `save-webhook-secret.ts` gravavam `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/
`STRIPE_WEBHOOK_SECRET` direto na tabela `SystemConfig` via linha de
comando. `admin-view.tsx` (~linha 2096-2210) já faz exatamente isso por
uma tela de admin, gravando na mesma tabela — os scripts eram uma via
paralela e obsoleta pro mesmo dado.

**Cluster de 27 componentes shadcn/ui nunca ligados ao app** (`alert-dialog`,
`aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`,
`collapsible`, `command`, `context-menu`, `drawer`, `form`,
`hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`,
`popover`, `radio-group`, `resizable`, `separator`, `sheet`,
`sidebar`, `slider`, `table`, `toast`, `toggle-group`, `toggle`,
`tooltip`, todos em `src/components/ui/`) mais `src/hooks/use-mobile.ts`
— scaffold em massa (típico de gerar todo o catálogo do shadcn/ui de
uma vez) que nunca foi importado por nenhuma tela real. Conferido que
as únicas referências entre eles eram uns componentes mortos
importando outros componentes mortos (`sidebar.tsx` importava
`separator`/`sheet`/`tooltip`/`use-mobile`, `toggle-group.tsx`
importava `toggle`) — nenhum tinha uso de verdade.

**38 dependências órfãs removidas do `package.json`** (`npm uninstall`,
323 pacotes a menos em `node_modules`): as que ficaram sem consumidor
depois da limpeza acima (`@radix-ui/react-*` dos componentes apagados,
`cmdk`, `date-fns`, `react-day-picker`, `embla-carousel-react`,
`input-otp`, `vaul`, `react-hook-form`, `@hookform/resolvers`,
`react-resizable-panels`, `@tanstack/react-table`) e outras já
sinalizadas como não usadas numa auditoria anterior do próprio projeto
mas nunca removidas (`puppeteer` — ~300 MB sozinho —, `pdfkit`,
`sharp` como dependência direta, `@mdxeditor/editor`, `next-intl`,
`react-syntax-highlighter`, `@tanstack/react-query`, `@dnd-kit/*`,
`uuid`, `framer-motion`, `@reactuses/core`) e o devDependency `shx`.
Cada uma foi conferida por `grep` de import antes da remoção — em
especial as que soam a peça de infraestrutura (`pdfkit`, `sharp`,
`next-intl`, `puppeteer`, `uuid`, `date-fns`), justamente pra não
derrubar algo usado só dinamicamente. Nenhuma tinha `@types/*`
correspondente para remover junto.

**O que foi deixado de propósito**: os arquivos `*.test.ts` que o
`knip` também apontou como "não usados" são falso positivo — rodam
via glob em `npm test` (`tsx --test "src/**/*.test.ts"`), não por
import direto, e o `knip` não entende essa forma de invocação.
`scripts/sync-i18n.ts`, `src/scripts/fetch-hiring-index.ts` e
`src/scripts/build-world-map.ts` também apareceram como "não usados"
pela mesma razão — são ferramentas de CLI documentadas e ativamente
usadas (ver §2.51, §2.54), disparadas manualmente via `npx tsx`, não
importadas por outro arquivo. As 74 exportações e 36 tipos exportados
que o `knip` listou como não usados dentro de arquivos que **são**
usados ficaram intocados — remover export-a-export dentro de arquivo
vivo é um risco alto (efeito colateral em consumidor não óbvio) pra um
ganho baixo (não reduz peso de bundle nem de instalação), diferente de
apagar arquivo/dependência inteira.

Verificado depois da limpeza inteira: `tsc --noEmit` limpo, `eslint`
limpo, `npm test` 884/884, e build de produção limpo (`rm -rf .next &&
npm run build`) sem erro de módulo faltando.

## 2.63 "No fundo" (fase `bottoming_out`) trocado por "Tocando o fundo" no dicionário PT

Operador achou os termos das fases do Índice GriffoWork ruins.
Conferido os 5 rótulos (`phaseCooling`/`phaseBottomingOut`/
`phaseRecovering`/`phaseHeatingUp`/`phaseStable`) nas 12 línguas: em
inglês, espanhol, francês, alemão, italiano e japonês já eram
vocabulário de imprensa financeira de verdade ("bottoming out",
"tocando fondo", "Bodenbildung", "底打ち"). O único fraco era o
português: `phaseBottomingOut: 'No fundo'`. Sem verbo, "no fundo" em
português coloquial também significa "basicamente/na essência" (ex:
"no fundo, ele sabia") — numa legenda curta e fora de contexto, dá pra
ler como esse idiomatismo em vez de "tocou o fundo do ciclo".

Trocado para `'Tocando o fundo'` — espelha o espanhol `'Tocando
fondo'`, o verbo tira a ambiguidade, e mantém o paralelismo gramatical
com os outros quatro rótulos (todos descrevem um ESTADO do mercado:
"Esfriando", "Em recuperação", "Esquentando", "Estável" — todos
completam "o mercado está ___"). Uma alternativa mais técnica, "Fundo
do ciclo", foi descartada por ser substantivo/lugar em vez de estado
(quebra esse paralelismo) e por introduzir "ciclo", termo que não
aparece em nenhum outro texto do índice. Só `phaseBottomingOut` mudou
— `phaseBottomingOutHint` já era uma frase completa sem a mesma
ambiguidade ("Parou de cair e está perto do ponto mais baixo da
própria série.").

`tsc --noEmit`, `eslint` e `npm test` (884/884) limpos — troca de uma
string, sem lógica nova.

## 2.64 Os 6 rótulos do índice em PT trocados por vocabulário de mercado financeiro (supera o §2.63)

Operador propôs um conjunto novo pros 5 rótulos de fase mais o "sem
dado": **aquecido, viés de alta, estável, viés de baixa, em baixa, sem
dados**. Melhor que o patch pontual do §2.63 (que só trocava "No
fundo"): resolve de vez a mistura de metáforas que os termos antigos
tinham (temperatura + posição física + saúde) usando um único
vocabulário nativo da imprensa financeira brasileira ("ações com viés
de alta", "mercado aquecido") — e o mais importante, esse vocabulário
separa TENDÊNCIA (viés de alta/baixa: ainda subindo/caindo, não chegou
no extremo) de ESTADO JÁ ATINGIDO (aquecido/em baixa: já passou do
nível habitual do país, ou já está no mínimo da própria série), o que
bate exatamente com a definição do algoritmo em `phase.ts` — algo que
nenhuma versão anterior do rótulo capturava.

Mapeamento em `pt.ts` (`hiringIndex`):
- `phaseCooling`: "Esfriando" → **"Viés de baixa"**
- `phaseBottomingOut`: "Tocando o fundo" (§2.63) → **"Em baixa"**
- `phaseRecovering`: "Em recuperação" → **"Viés de alta"**
- `phaseHeatingUp`: "Esquentando" → **"Aquecido"**
- `phaseStable`: sem mudança ("Estável")

E em `pt.ts` (`hiringMap`):
- `noDataLabel`: "Sem dado oficial" → **"Sem dados"**

Os `*Hint` (frases completas explicando cada fase) não mudaram —
continuam corretos e sem a ambiguidade que só existia nos rótulos
curtos. Deixado de propósito sem mudar: `hiringIndex.insufficientLabel`
("Dado insuficiente") — é um conceito DIFERENTE de `noDataLabel`
("Sem dados"): o primeiro é país com fonte oficial mas histórico
curto demais pra classificar (14 dos 98 países rastreados), o segundo
é país sem nenhuma fonte oficial cobrindo (a área hachurada do mapa,
75 dos 173 países existentes). O operador pediu 6 termos, e a
"Legenda" do mapa (`map-model.ts`, array `legend`) tem exatamente 6
itens — as 5 fases mais `noDataLabel` — confirmando que era esse o
alvo, não o `insufficientLabel` do cartão de distribuição no topo da
página.

Verificado com build de produção limpo e Playwright em `/market-pulse`
e no teaser da home, desktop (1280×1000) e mobile (390×844): a
legenda de 6 itens cabe numa linha só no desktop e quebra em duas
linhas limpas no mobile, sem truncar; a coluna "Fase" da tabela de 98
países não trunca com os rótulos mais longos ("Viés de alta"/"Viés de
baixa"); a barra do teaser da home também renderiza correta com os 5
rótulos novos. `tsc --noEmit`, `eslint` e `npm test` (884/884) limpos.

## 2.65 América Central e Caribe separam de América do Norte — sétimo continente no recorte

Operador apontou que juntar América do Norte com América Central e o
Caribe sob um rótulo só ("América do Norte", 18 países) estava errado.
Investigação (com busca real, não memória — ver fontes) mostrou uma
distinção que muda a resposta: pela geografia FÍSICA (a linha que a
maioria dos atlas escolares traça na fronteira Panamá–Colômbia),
Central America e Caribbean SÃO parte do continente América do Norte
— os 18 países de antes não eram, em si, um erro de continente. O
problema real é que a regra que este projeto já cita como autoridade
(**UN M49**) não é uma classificação de continente: é uma convenção
ESTATÍSTICA da ONU que agrupa *Central America* e *Caribbean* junto de
*South America* sob "Latin America and the Caribbean" — uma categoria
socioeconômica da ONU, não geográfica (confirmado contra
[UN M49 — Wikipedia](https://en.wikipedia.org/wiki/UN_M49) e
[UNSD M49 Methodology](https://unstats.un.org/unsd/methods/m49/m49regin.htm)).
Como o arquivo já declara o M49 como a regra e não a geografia física,
separar em sete continentes é a aplicação mais fiel da MESMA regra —
não uma opinião nova por cima dela.

**Mudança em `src/lib/hiring-index/continents.ts`**: novo continente
`CA` ("América Central e Caribe"), `CONTINENTS` de seis para sete
(`['AF', 'AS', 'CA', 'EU', 'NA', 'OC', 'SA']`). América do Norte cai
de 18 para **2 países** (só Canadá e EUA — a *Northern America* real
do M49; Bermudas, Groenlândia e Saint-Pierre-et-Miquelon não estão na
lista de 173 do produto). América Central e Caribe fica com os outros
**16**: Belize, Costa Rica, Cuba, El Salvador, Guatemala, Haiti,
Honduras, Jamaica, México, Nicarágua, Panamá, Porto Rico, República
Dominicana, Bahamas, Barbados, Trinidad e Tobago — México e Panamá
inclusive, que o M49 classifica em *Central America*, não *Northern
America*, apesar do senso comum. Reaproveitado o código `CA` mesmo
colidindo com o ISO2 do Canadá — o arquivo já tinha esse padrão de
colisão aceito (`AF` continente vs. Afeganistão, `NA` continente vs.
Namíbia, `SA` continente vs. Arábia Saudita).

**i18n**: nova chave `continents.centralAmericaCaribbean` em
`i18n/types.ts` e nas 12 línguas (`"América Central e Caribe"` em PT,
`"Central America and the Caribbean"` em EN, e equivalentes nativos
nas outras 10 — nenhuma tradução veio de `Intl.DisplayNames`, mesma
regra do resto do dicionário de continentes).

**Efeito colateral correto, não bug**: como a ordem dos continentes na
tela é alfabética pelo NOME no idioma ativo (não pelo código), o novo
continente muda a posição dos outros em alguns idiomas — em português,
"América Central e Caribe" entra entre "África" e "América do Norte"
(porque "Central" vem antes de "do" alfabeticamente). Os testes que
travavam a ordem exata (`map-model.test.ts`) foram recalculados e
atualizados, não relaxados.

Atualizados: `continents.ts` (dados + cabeçalho), `map-model.ts`
(`CONTINENT_LABELS` + comentários "seis"→"sete"), `i18n/types.ts`,
as 12 locales, e os testes que hardcodavam contagem/ordem de seis
continentes (`continents.test.ts`, `atlas.test.ts`,
`map-model.test.ts`, `hiring-map.test.ts` — este último tinha
`'1 of 18 countries...'` fixado no atlas de teste, agora `'1 of 2'`).

Verificado com build de produção limpo e Playwright em `/market-pulse`
nos três locais que mostram continente — tabela "Por continente" em
PT e EN, mobile (390×844) — confirmando a ordem alfabética prevista em
cada idioma e nenhum truncamento com o nome mais longo. `tsc --noEmit`,
`eslint` e `npm test` (884/884, mesma contagem — só reescrita de
asserções existentes, nenhum teste novo) limpos.

## 2.66 Removida a seção "Como isto é calculado" / "Fontes oficiais" de `/market-pulse`

Operador achou desnecessário o bloco de metodologia e fontes no fim da
página pública do mapa — o texto explicando a média móvel de três
períodos comparada com mediana/mínimo da série, mais a lista de
fontes oficiais (CEPALSTAT, Eurostat, ILOSTAT, BLS JOLTS) repetida por
extenso.

Removido de `src/components/market/hiring-map.tsx`: os dois blocos
(`methodHeading`+`methodBody`+`comparisonNote`, e
`sourcesHeading`+lista de `model.sources`). Mantida a linha final —
"Coleta mais recente" (`updatedLine`) e o crédito cartográfico
(`mapCredit`, "Base cartográfica: Natural Earth") — que o operador não
citou e que segue cumprindo uma função diferente (transparência de
atualização e atribuição legal do mapa, não explicação de metodologia).

**Deixado de propósito**: as chaves do dicionário (`methodHeading`,
`methodBody`, `sourcesHeading`, `comparisonNote`) continuam existindo
em `i18n/types.ts` e nas 12 locales — `comparisonNote` ainda é usada
em outro lugar (`hiring-index-card.tsx`, o cartão do laudo pago, um
contexto diferente onde a mesma frase justifica a leitura pra quem já
pagou pelo relatório) e `methodBody` alimenta o `measurementTechnique`
do JSON-LD (`schema.org/Dataset`) em `market-pulse/page.tsx` — dado
estruturado pra buscador, não texto visível, fora do escopo do pedido.
Remover essas chaves do dicionário exigiria mexer em 12 arquivos de
locale e no schema de SEO por um ganho que o pedido não pediu.

`tsc --noEmit`, `eslint` e `npm test` (883/883 — um teste a menos, o
que travava a presença do `comparisonNote` na página, removido porque
protegia um texto que devia mesmo sumir) limpos. Verificado com build
de produção e Playwright em `/br/market-pulse`: a página termina
direto na linha de coleta/crédito, sem espaço vazio nem seção
remanescente.

## 2.67 Índice enxuto, tabela de países retrátil, e metodologia/fontes de volta — só que curtas

Operador pediu três ajustes em `/market-pulse` depois de ver a página
com as mudanças do §2.66 no ar: (1) o cartão "Índice GriffoWork" só
devia mostrar o índice, não a lista de fase-por-fase; (2) a tabela
"Todos os países cobertos" estava feia — precisava de layout melhor ou
ficar retrátil, mas SEM prejudicar SEO; (3) repensou a remoção do
§2.66 e quer de volta, ao menos, as fontes de dados e uma frase
dizendo que o índice vem da tendência da média dos últimos meses de
dados disponíveis.

**(1) Cartão do índice**: removida a lista de 6 linhas (`model.bars` +
`unclassifiedLabel`/`unclassifiedCount`) e o `netBreadthHint` de
`hiring-map.tsx`. Ficou só cabeçalho, resumo ("84 de 98 países...") e
o número "+5 / Amplitude líquida" — o mesmo card que já existia,
sem a barra-lista de baixo. As chaves do dicionário continuam
existindo (mesma razão do §2.66: baixo custo, outros consumidores
podem usar).

**(2) Tabela retrátil sem custo de SEO**: embrulhada em `<details>`/
`<summary>` NATIVO do HTML, fechada por padrão — não um
`useState`/`display:none` condicionado a JavaScript. A diferença
importa: `<details>` fechado ainda manda o conteúdo INTEIRO (as ~98
linhas, com todos os `<a href="/{código}">`) na resposta HTML do
servidor — só o CSS visual esconde até o clique. Conferido direto no
HTML cru, sem executar nenhum JS (`curl` puro): os `href="/al"`,
`/ao"`, `/ar"` etc. de cada país aparecem no HTML da primeira resposta
com a tabela fechada. Rastreador de busca e leitor de tela continuam
enxergando o mesmo conteúdo de antes; só quem usa o mouse/toque vê a
tabela dobrada por padrão. Ícone de seta (`ChevronDown` do
`lucide-react`) gira com `group-open:rotate-180` — classe Tailwind
estática, não `style` inline, então passa pela CSP do projeto.

**(3) Metodologia e fontes, versão curta**: `methodBody` reescrito
nas 12 línguas — de um parágrafo técnico (`"uma média móvel de três
períodos... comparada com a mediana e o ponto mais baixo..."`) para
uma frase, no espírito exato do que o operador pediu: em PT, "O
índice é calculado pela tendência da média dos últimos meses de dados
oficiais disponíveis para cada país." Reaproveitada a MESMA chave que
já alimentava o JSON-LD (`measurementTechnique` em
`market-pulse/page.tsx`) — uma frase de verdade, não duas descrições
que podem divergir com o tempo. Reinstalado em `hiring-map.tsx` como
UMA linha compacta (ícone `Info` + texto pequeno, mesmo estilo visual
do resto dos avisos da página), com `sourcesHeading` + a lista de
fontes (`model.sources.join(', ')`) na MESMA frase — sem os dois
`<h2>` de heading que existiam antes do §2.66. `comparisonNote`
("países nunca são comparados entre si") não voltou: o operador só
pediu fontes + a frase da tendência, e não citou essa nota ao pedir a
volta.

Verificado com build de produção limpo, `curl` no HTML cru (prova de
que os links de país sobrevivem à tabela fechada) e Playwright em
`/br/market-pulse` — desktop (1280×900) e mobile (390×844) — com a
tabela fechada, depois clicada e aberta, confirmando a seta girando e
as linhas aparecendo. `tsc --noEmit`, `eslint` e `npm test` (883/883,
um teste reescrito pra não travar mais o texto do `netBreadthHint`
removido) limpos.

## 2.68 "+5" virou termo ("Equilíbrio") — normalizado por percentual, não por número bruto

Operador pediu pra trocar o número da Amplitude líquida (`+5`) por um
termo, "dentro de uma escala que represente fielmente... a realidade".
O risco de fazer isso mal era concreto: o `atlas.ts` já documenta, em
dois pontos (§2.54, §2.56), que o projeto recusou de propósito um
score único pro índice global — cortar um número contínuo em faixas
("moderado", "forte") é decidir uma fronteira, e fronteira decidida a
gosto é a mesma arbitrariedade que a distribuição inteira existe pra
evitar. `recovering`/`bottoming_out`/`stable` já ficam de fora do
`netBreadth` por essa exata razão.

**A saída sem inventar fronteira**: normalizar `netBreadth` pelo total
CLASSIFICADO antes de cortar em faixas (`netBreadth / classified`),
nunca pelo número bruto. Duas razões: (1) o número bruto se desloca
sozinho quando o produto passa a cobrir mais países — `+12` de 30
classificados e `+12` de 90 não significam a mesma coisa, e uma faixa
sobre o bruto ficaria errada no dia em que a cobertura crescesse sem
ninguém tocar o código; (2) o percentual tem teto e piso conhecidos e
simétricos por definição (−100% a +100%, os extremos onde TODO
classificado está numa única fase) — a fronteira vira uma fração desse
intervalo, não um palpite sobre "quantos países seriam muitos".

**A escala**: 5 faixas simétricas de largura igual, cortando o
intervalo −100%/+100% em blocos de 40 pontos por lado (±20%, ±60%):
"Esfriamento generalizado" / "Predomínio de esfriamento" /
"Equilíbrio" / "Predomínio de aquecimento" / "Aquecimento
generalizado". Com o dado real de hoje (26 aquecendo − 21 esfriando =
+5, de 84 classificados → +5,95% ≈ **+6%**), cai em "Equilíbrio" — o
que bate com a realidade: 26 contra 21 de 84 não é domínio claro de
nenhum lado.

`classified === 0` devolve `null`, não "Equilíbrio" por omissão:
nenhum termo é menos errado do que um termo inventado sobre zero país
(mesma disciplina do resto do arquivo — ver `continentOf` recusando
chutar continente pra código desconhecido).

**Implementação**: `netBreadthTerm(netBreadth, classified)` nova em
`atlas.ts`, pura e testada isoladamente (fronteiras exatas em ±20% e
±60%, normalização por percentual conferida com dois pares
proporcionais diferentes, caso `classified <= 0`). `map-model.ts`
expõe `netBreadthTerm: string | null` (o termo traduzido) e
`netBreadthPercent: string | null` (o percentual formatado com sinal,
`Intl.NumberFormat` com `signDisplay: 'exceptZero'`) em vez do antigo
`netBreadth: string`. `hiring-map.tsx` mostra o termo em destaque com
o percentual pequeno ao lado — a leitura principal é o termo, mas quem
quiser conferir a conta não precisa sair da tela. 5 chaves novas no
dicionário (`netBreadthStronglyCooling`…`netBreadthStronglyHeating`)
nas 12 línguas; no árabe, alinhadas ao vocabulário de
aceleração/desaceleração que as fases já usam lá (`في تسارع`/`في
تباطؤ`), não à metáfora de temperatura usada nas outras 11 línguas —
único idioma onde a fase em si não usa temperatura, então o termo novo
segue a mesma régua já estabelecida, não a das outras línguas.

Verificado com build de produção e Playwright em `/br/market-pulse`,
desktop e mobile: "Equilíbrio +6%" renderiza correto, sem quebra.
`tsc --noEmit`, `eslint` e `npm test` (886/886 — 3 testes novos pra
`netBreadthTerm`, 2 reescritos nos arquivos que checavam o `+1`/`+25%`
antigo) limpos.

## 2.69 Zero páginas indexadas: 4 domínios duplicados + hreflang que o Google descartava por inteiro

Operador pediu urgência em tráfego orgânico ("estamos sem tráfego
orgânico"). Investigação com dado real, não suposição: `site:griffo.work`
não retornava NENHUMA página — nem a home. `robots.txt`, `meta robots`
e resposta ao Googlebot (testado com `curl -A "Googlebot/2.1..."`)
estavam todos corretos, então o bloqueio não era ali. Duas causas reais
foram confirmadas, uma de infraestrutura (fora deste repositório) e
uma de código.

**Causa 1 — quatro domínios servindo o MESMO conteúdo, sem redirecionamento
nenhum entre eles.** `griffo.work`, `www.griffo.work`, `griffowork.com`
e `www.griffowork.com` respondiam todos com `200` e o mesmo `Etag`
(mesmo deploy da Vercel, quatro hostnames). O Search Console tinha
`www.griffo.work` indexado (de uma configuração antiga, com redirect
apex→www da Cloudflare que o operador removeu) e `griffo.work` marcado
como "problema de redirecionamento" — o Google com o status antigo em
cache, de antes da mudança. Corrigido na Vercel (Project → Settings →
Domains): os três domínios secundários configurados como "Redirect to"
`griffo.work`, permanente, preservando caminho e query — conferido com
`curl -IL` num caminho real (`/us?nocache=...`) que os três convergem
com `301` e o caminho intacto, não caem todos na home.

**Causa 2 — hreflang existia só na home do `sitemap.ts` (15 pares) e
nunca era bidirecional; nenhuma página de país tinha uma tag `hreflang`
sequer.** A documentação oficial do Google
([developers.google.com/search/docs/specialty/international/localized-versions](https://developers.google.com/search/docs/specialty/international/localized-versions))
é direta: *"If two pages don't both point to each other, the tags will
be ignored"* e *"Each language version must list itself as well as
all other language versions"*. O hreflang do site inteiro estava sendo
descartado, não só incompleto.

Corrigido em `src/app/[country]/page.tsx`: `HREFLANG_ALTERNATES`, uma
constante derivada de `SUPPORTED_COUNTRY_SLUGS` + `marketForCountry`
— nunca uma lista copiada à mão, para não divergir da lista real de
rotas. Cada uma das 41 páginas de país agora lista a si mesma e todas
as outras 40, bidirecionalmente (`pt-BR`↔`en-US`↔`de-AT`↔... até
`ko-KR`), mais `x-default` apontando pra `/global` — o uso que o
próprio Google recomenda para essa chave, e que aqui é literal: `/global`
já É a página de fallback internacional do produto. País que herda
mercado de outro (Áustria de `DE`, Bélgica/Luxemburgo de `FR`, Nova
Zelândia de `AU`) usa o idioma do mercado herdado com o PRÓPRIO código
de país (`de-AT`, `fr-BE`, `fr-LU`, `en-NZ`) — nunca o país âncora.

Removido o bloco de hreflang incompleto que existia na entrada da home
em `sitemap.ts`: a raiz reescreve pro país da borda e renderiza a
MESMA página de `[country]/page.tsx` (`middleware.ts`), que agora já
carrega o hreflang completo — manter os dois seria duas fontes de
verdade competindo, exatamente o problema que causou isto.

Verificado com build de produção limpo e `curl` direto no HTML (sem
JS): `/br` sai com as 41 tags `<link rel="alternate" hreflang="...">`,
incluindo a autorreferência (`pt-BR` apontando pra si mesma); `/us`
tem a entrada de volta pra `/br` (bidirecionalidade real, não só na
direção óbvia); `x-default` aponta pra `/global`; `/global` também sai
com as 41. Canonical intacto, sem mudança. `tsc --noEmit`, `eslint` e
`npm test` (886/886, sem teste novo — página de rota, não módulo de
`lib/`, mesmo padrão de cobertura já usado pro resto de `src/app`)
limpos.

## 2.70 O app autenticado inteiro (com `recharts`) ia no JS de todo visitante anônimo — achado real do PageSpeed/Search Console

Operador trouxe três apontamentos do Search Console mobile: "reduza o
JavaScript não usado" (303 KiB estimados, um chunk de 320 KiB
transferidos com 256 KiB nunca usados), imagens sem `width`/`height`
explícitos (CLS) e uma tarefa longa de 186ms na thread principal —
tudo apontando pro MESMO chunk (`0qpw58snw4ar9.js` no relatório deles).

**CLS — resolvido em 6 lugares**: todo `<img src="/logo-icon.png">`
do site (`landing.tsx` ×2, `auth-screen.tsx`, `app-shell.tsx`,
`ats/[slug]/page.tsx` ×2) não tinha `width`/`height`. Lidas as
dimensões reais do arquivo direto do cabeçalho PNG (`553×424`, sem
adivinhar) e adicionadas como atributos HTML em todos os seis — o
navegador reserva o espaço certo antes do CSS carregar, e as classes
Tailwind (`h-13`, `w-auto` etc.) continuam controlando o tamanho
exibido normalmente.

**JS não usado + tarefa longa — a causa era arquitetural, não uma
lib solta**: `src/app/page.tsx` e `src/app/[country]/country-client.tsx`
são componentes cliente que trocam de "tela" (`Landing`/`AuthScreen`/
`AppShell`) por estado em memória, não por rota do Next.js — e os
três eram `import` estático no topo dos dois arquivos. Isso significa
que **todo visitante anônimo baixava e processava o app autenticado
inteiro** (dashboard, admin, e o laudo de análise com a biblioteca de
gráficos `recharts`) mesmo nunca fazendo login. Confirmado direto no
bundle: o chunk de 1,24 MB carregado por padrão na home tinha 44
ocorrências de `recharts` e 485 de `zod` — o app inteiro, não só a
Landing.

Corrigido com `next/dynamic({ ssr: false })` em `AuthScreen` e
`AppShell`, nos dois arquivos. A primeira tentativa (`dynamic()` sem
`ssr: false`) NÃO bastou — o chunk continuava saindo como
`<script async>` no HTML da primeira resposta, porque o App Router
inclui o import dinâmico no grafo de hidratação crítico por padrão a
menos que `ssr: false` seja explícito. Só depois de adicionar isso nos
DOIS arquivos (havia duas entradas estáticas independentes pro mesmo
import — corrigir só `page.tsx` não bastou, porque o bundler
compartilhava o chunk com `country-client.tsx`) o `recharts` sumiu de
verdade da lista de chunks carregados na home: **zero ocorrências**,
contra 44 antes. Total de JS bruto na home caiu de ~2,43 MB pra
~1,46 MB (~40% a menos) — o `Landing` continua `import` estático de
propósito (é o que sai pronto no HTML da primeira resposta pra
buscador e bot de IA).

Verificado com Playwright: clique em "Já tenho conta" carrega e
renderiza o `AuthScreen` normalmente sob demanda, sem flash nem erro
novo no console (os mesmos 6 erros de CSP de sempre, framework do
Next.js, nenhum novo). Mobile conferido, logo sem distorção.

**Achado à parte, fora do escopo de hoje**: `/us` (e provavelmente
outras páginas de país fora do PT) sai com o título
"GriffoWork **Estados Unidos** — Global AI Career Intelligence..." —
nome do país em português misturado com tagline em inglês, confirmado
com `curl` sem cookie nenhum. É `countryName()` não respeitando
`market.jobLanguage` na hora de montar o título. Não corrigido agora
por não fazer parte do que foi pedido — registrado aqui pra não se
perder.

`tsc --noEmit`, `eslint` e `npm test` (886/886, sem teste novo —
mudança de bundling/carregamento, não de lógica testável em `lib/`)
limpos.

## 2.71 Nome do país no título e no JSON-LD virou português fixo em toda página não-PT

Corrigido o achado à parte do §2.70. `countryName()` de
`lib/market/countries.ts` é documentado no próprio arquivo como "nome
em português, para leitura" — é a lista da tela de perfil, com nome
em UM idioma só de propósito (guardar o nome traduzido junto do dado
seria guardar tradução que um dia muda). `[country]/page.tsx` usava
essa mesma função pra montar o título/description de CADA página, sem
considerar `market.jobLanguage` — daí `/us` sair "GriffoWork **Estados
Unidos** — Global AI Career Intelligence...", nome em português
grudado numa frase em inglês.

**Duas tabelas, não uma reforma do dicionário inteiro.** Criar um
bloco `countries` de 173 nomes × 12 idiomas no `TranslationDictionary`
resolveria isto também, mas seria uma reforma desproporcional ao
problema: cada
uma das 41 páginas só precisa do PRÓPRIO nome, no idioma que ELA já
renderiza — não dos outros 172 países nos outros 11 idiomas. Duas
tabelas pequenas em `[country]/page.tsx` resolvem exatamente o que
está quebrado:

- `COUNTRY_NAME_BY_SLUG` — as 40 rotas não-`global`, cada uma no
  idioma que a própria página usa (`Deutschland` pra `/de`, `日本` pra
  `/jp`, `الإمارات العربية المتحدة` pra `/ae`, `United States` pra
  `/us`...). Usada no título/description/OpenGraph.
- `COUNTRY_NAME_EN_BY_SLUG` — só os 10 casos onde o nome em inglês
  diverge do nativo (`Brasil`→`Brazil`, `Deutschland`→`Germany`,
  `Österreich`→`Austria`, etc.). Usada no JSON-LD
  (`SoftwareApplication`/`Offer`), cujo texto ao redor já é em inglês
  fixo independente do idioma da página — outra frente do mesmo
  problema, não corrigida por inteiro agora (o JSON-LD nunca varia por
  `market.jobLanguage`, só o nome do país precisava parar de
  contradizer o resto da frase).

`countryName(code)` continua como fallback nas duas tabelas, pra
nenhuma rota ficar sem nome se uma faltar por engano — mas hoje as 40
estão cobertas.

Verificado com build de produção e `curl` direto: `/us` → "United
States", `/de` e `/at` → "Deutschland"/"Österreich" (mercado
compartilhado, país certo cada um), `/fr` → "France", `/nl` →
"Nederland", `/jp` → "日本", `/ae` → "الإمارات العربية المتحدة", `/pl`
(sem mercado próprio, cai no idioma global) → "Poland" — nenhuma
mistura de idioma em nenhuma. JSON-LD de `/de` conferido também:
"GriffoWork Germany", "for Germany market" — inglês consistente, sem
"Deutschland" no meio da frase em inglês. `tsc --noEmit`, `eslint` e
`npm test` (886/886) limpos.

## 2.72 Reposicionamento da home: tagline sem "IA/Global", CTA e headline novos, nas 12 línguas

Operador trouxe uma análise de posicionamento com 5 pontos e pediu
pra executar 3 deles (os que são texto puro, sem depender de feature
nova — os outros 2 ficam pro planejamento de conteúdo/campanha).
Antes de escrever qualquer copy, investiguei uma afirmação factual da
própria análise: que "o prompt de indicações (âncora/lateral/salto) já
é o produto central". Não é — `career-orientation.ts` devolve 3 áreas
com % de encaixe, sem essa categorização em três tipos de movimento.
Essa investigação separou o que era proposta de MARKETING (que segue
abaixo) do que seria proposta de PRODUTO NOVO (não pedida, não feita).

**1. Tagline sem "IA"/"Global"** — `appSubtitles` em `landing.tsx`
tinha um problema próprio, achado no caminho: só 7 das 12 línguas
estavam preenchidas (`pt, en, es, de, fr, it, ja`), e as 5 que faltavam
(`nl, sv, zh, ar, ko`) caíam no fallback `|| appSubtitles.pt` — sem
consequência visível até agora porque as 7 preenchidas eram todas a
MESMA string em inglês ("GLOBAL AI CAREER INTELLIGENCE"). Trocar por
textos DIFERENTES por idioma sem completar as 12 teria vazado inglês
pras 5 línguas que faltavam — exatamente o defeito que o projeto evita
há sessões. Corrigido preenchendo as 12, cada uma com o equivalente
nativo de "Inteligência de Carreira" (`KARRIERE-INTELLIGENZ`,
`キャリア・インテリジェンス`, `职业智能`, etc.), sem menção a IA nem a
"global" em nenhuma. O "AI"/"Global" continuam nos `<title>` de SEO
(`[country]/page.tsx`, inalterado) — tagline visual e `<title>` de
busca são textos diferentes, e o volume de busca por "AI" ainda
importa lá.

**2. CTA — "Descobrir minhas melhores direções profissionais"** e
**5. Headline — "Sua experiência vale mais do que o cargo no seu
currículo"**: `hero.title1`/`titleAccent`/`title2`/`ctaPrimary`
reescritos nas 12 línguas, mantendo a palavra em destaque (gradiente)
sobre "experiência" (ou equivalente) em vez de "currículo" — o oposto
do que a home dizia até agora. No árabe, `title1` ficou vazio na
primeira tentativa (a frase começa pela palavra em destaque) e o teste
de paridade (`i18n.test.ts`) corretamente recusou string vazia;
corrigido com `'إنّ '` (partícula de ênfase formal), gramaticalmente
correto e sem alterar o sentido.

**Achado de layout ao verificar no mobile**: o CTA novo, mais longo
que o antigo, estourava a largura do botão — `whitespace-nowrap` vem
embutido nas classes base do componente `Button` (`components/ui/button.tsx`),
e a página tem `overflow-x-hidden` no container raiz, então o excesso
não virava scroll, virava corte silencioso de texto. Corrigido só
nesta instância do botão (`whitespace-normal` + `h-auto min-h-12` no
lugar de `h-12` fixo, `shrink-0` na seta) — o componente `Button`
global não foi tocado, então nenhum outro botão do site foi afetado.
O H1 (headline) nunca teve esse problema: quebra de linha normal,
sem clipping — a suspeita inicial de bug ali era falsa, descartada
depois de reconferir com screenshot limpo.

**Deixado para confirmação do operador**: o badge/pílula acima do
headline ("IA + Padrões Gupy, LinkedIn & Recrutamento Global") também
menciona "IA" e "Global", mas é um texto DIFERENTE da tagline
(`hero.badge`, não `appSubtitles`) e não foi citado no pedido — não
alterado, por não ter sido pedido, mas fica registrado como
inconsistência em potencial com a decisão de tirar esses termos da
tagline.

Verificado com build de produção limpo, `curl` (headline correto em
`/br`, `/us`, `/de`, `/ae`) e Playwright em desktop e mobile —
tagline, headline e CTA renderizando corretos nas duas resoluções
depois do fix do botão. `tsc --noEmit`, `eslint` e `npm test`
(886/886) limpos.

## 2.73 IndexNow (Bing + demais motores participantes)

Operador trouxe uma chave IndexNow (`5aa728fe6a274c0d8fb10530a78312fa`)
e o protocolo oficial, pedindo pra implementar a indexação via Bing.
IndexNow é um protocolo compartilhado — um único POST no endpoint
genérico (`api.indexnow.org`) distribui a notificação pra todos os
motores participantes (Bing, Yandex, Seznam, Naver...), não só o Bing;
não existe um endpoint "só Bing" a mais que valha a pena chamar
separado.

**Hospedagem da chave (passo 2, opção 1 do protocolo)**:
`public/5aa728fe6a274c0d8fb10530a78312fa.txt`, contendo só a chave —
fica servido em `https://griffo.work/5aa728fe6a274c0d8fb10530a78312fa.txt`
assim que o deploy for ao ar, sem rota nem código adicional (é
`public/`, Next serve estático).

**Código (passo 3)**: `lib/seo/indexnow.ts` expõe
`submitUrlsToIndexNow(urls, fetchImpl?)` — `fetchImpl` recebido por
parâmetro pelo mesmo motivo de `lib/email/send.ts` (§7.3): a chamada
real ao endpoint nunca foi observada em teste, só a documentação
oficial, então o teste injeta um fetch falso em vez de bater na rede.
`scripts/submit-indexnow.ts` é o gatilho MANUAL — reaproveita
`app/sitemap.ts` como única fonte da lista de URLs (mesmo princípio
de `[country]/page.tsx` reaproveitar `SUPPORTED_COUNTRY_SLUGS`: uma
lista de rotas só, nunca duas que podem divergir). `npm run
indexnow:submit` roda o script.

**Não criado**: cron automático. O projeto já documenta (pendência 14c
do handoff) que o plano Hobby da Vercel limita quantos crons cabem em
`vercel.json`, e que rota nova sem esse limite resolvido fica sem
agendamento até decisão do operador — mesma régua aplicada aqui: o
gatilho manual cobre o pedido (bulk agora, e depois de qualquer
mudança grande de conteúdo), agendamento automático fica em aberto
pra quando fizer sentido, sem gastar o orçamento de cron sem decisão.

Testado com 2 casos em `indexnow.test.ts` (corpo da requisição
correto — `host`, `key`, `keyLocation`, `urlList`; e o caminho de
recusa, `403`, devolvendo `ok: false`). `tsc --noEmit`, `eslint` e
`npm test` (888/888) limpos.

**Rodado de verdade, contra o endpoint real, depois do deploy**: `curl`
confirmou `https://griffo.work/5aa728fe6a274c0d8fb10530a78312fa.txt`
servindo a chave em produção (levou 5 tentativas de 15s pra sair de
404 pra 200 — tempo normal de propagação do deploy da Vercel), e só
então `npm run indexnow:submit` enviou as 53 URLs do `sitemap.ts` de
uma vez. Resposta: `202` — código de sucesso do próprio protocolo
IndexNow (aceito para processamento; `submitUrlsToIndexNow` trata
`200`-`299` como `ok`, então isto não exigiu ajuste). Confirmação de
que o Bing efetivamente indexou fica pro Bing Webmaster Tools (passo 4
do protocolo, fora do que dá pra automatizar sem login) — pendência
igual à do Search Console no §2.69/§2.71, registrada como tal.

## 2.74 Dois cortes reais de layout em idiomas com frase mais longa (achado ao investigar "sobreposição de texto e imagens")

Operador reportou texto sobrepondo imagem em "alguns idiomas". Achar
o caso real exigiu descartar dois falsos positivos do próprio ambiente
de teste antes de chegar ao defeito de verdade:

**Falso positivo 1 — cache do Turbopack dev**: `.next` tinha um build
de produção de mais cedo na sessão; limpar (`rm -rf .next`) e reiniciar
o `next dev` não bastou sozinho.

**Falso positivo 2 — cache HTTP imutável do navegador**: os chunks de
`_next/static/chunks/` saem com `Cache-Control: public, max-age=31536000,
immutable`, e no Turbopack dev o nome do arquivo NÃO muda por conteúdo
(é derivado do caminho, estável) — diferente da produção, onde o nome
muda por hash. Resultado: o mesmo Chrome (perfil persistente do
Playwright) continuou servindo, do próprio disco, uma versão JS de
horas atrás, mesmo depois do servidor reiniciado do zero — `curl`
provava conteúdo novo, o DOM renderizado mostrava conteúdo velho. Só
`Network.setCacheDisabled` + `Network.clearBrowserCache` via CDP
resolveu. Isto é uma armadilha de AMBIENTE DE TESTE, não do produto —
produção usa nome de arquivo por hash de conteúdo, e um usuário real
não fica com o MESMO nome de chunk apontando pra conteúdo diferente
entre deploys.

**O defeito real, confirmado em `/de` (alemão) e pela forma da causa,
replicável em qualquer idioma cuja frase seja longa o bastante**: dois
elementos com `white-space: nowrap` (via classe `truncate` num, via
`whitespace-nowrap` embutido no `<Button>` base no outro) forçam a
CAIXA inteira — não só o texto — a crescer além da viewport quando a
tradução não cabe. A página tem `overflow-x-hidden` na raiz (decisão
antiga, documentada no §2.72 pro botão do hero), que evita o scroll
horizontal só ESCONDENDO o excesso — sem `text-overflow:ellipsis`
funcionar (`truncate` só corta quando a CAIXA em si é forçada a ficar
menor que o conteúdo; aqui a caixa cresceu junto, então nunca chegou a
cortar) e sem quebra de linha. Resultado visual: frase cortada no meio
da palavra, sem reticências, sangrando pra fora do cartão.

Dois pontos achados, mesma causa:
1. `components/landing/hiring-index-teaser.tsx`: `<p className="...
   truncate">` no resumo do índice (`"{classified} von {tracked}
   Ländern mit klassifizierter Phase"`, 44 caracteres em alemão) —
   `truncate` removido; o cartão tem espaço vertical de sobra, então a
   frase simplesmente quebra em 2 linhas agora, sem cortar nada.
2. `components/landing/landing.tsx`, botão final da página
   (`t.ctaFinal.button`, "Kostenlose Lebenslauf-Diagnose starten" em
   alemão) — mesmo fix do hero no §2.72: `whitespace-normal` +
   `h-auto min-h-12 sm:min-h-13 py-3` no lugar de `h-12` fixo,
   `shrink-0` na seta, sem tocar no componente `Button` global.

**Por que não um fix na raiz (tentado e descartado)**: cheguei a testar
`min-w-0` no wrapper raiz e depois um seletor `[&>*]:min-w-0` — nenhum
dos dois mudou o layout renderizado, porque o crescimento não vem de
`min-width:auto` num item flex (a seção em si mede 375px sozinha); vem
do conteúdo `nowrap` que se recusa a encolher, ponto final. Confirmado
isolando a variável certa: forçar `white-space:normal` só no parágrafo
problemático (via `element.style` no DevTools, antes de tocar no
código) já devolvia a seção a 375px — a prova de que o ponto certo do
fix é o elemento com `nowrap`, não um ancestral genérico.

**Varredura de confirmação**: script no console percorrendo a página
inteira (mobile 390px E desktop 1280px) em `de, nl, sv, fr, it, jp, ae,
us, br, es` — zero elementos com texto extrapolando a viewport depois
do fix, nas duas resoluções, nos 10 idiomas. `tsc --noEmit`, `eslint` e
`npm test` (888/888) limpos.

## 2.75 Cabeçalho sobrepondo no desktop em alemão/outras línguas + seletor de idioma sem efeito nenhum

Operador reportou dois problemas novos depois do §2.74 (achados numa
sessão à parte, não durante a varredura anterior — o script do §2.74 só
procurava texto vazando pra FORA da viewport; este defeito é
sobreposição vertical DENTRO do próprio cabeçalho, forma diferente do
mesmo tipo geral de problema).

**1. Cabeçalho: "Funktionen" sobrepondo "KARRIERE-INTELLIGENZ" no
desktop, em QUALQUER largura, não só janela estreita.** Reproduzido em
`/de` de 768px a 1440px — inclusive 1440px, o que descartava de cara
"falta de espaço na tela": o container tem `max-w-7xl` (1280px), então
telas maiores que isso não ajudam em nada.

Causa real: o `<nav>` do menu desktop (`flex items-center gap-8`, 6
links) não tinha `flex-wrap`, e cada `<a>` não tinha `whitespace-nowrap`.
Quando a LARGURA NATURAL somada dos 6 links (que em alemão passa de
750px com os gaps — bem mais que em português/inglês) excede o espaço
que sobra entre logo e botões de CTA dentro do container de 1280px, o
flexbox força cada link a encolher **até a largura da sua palavra mais
longa** (esse é o "tamanho mínimo automático" de texto que pode
quebrar linha — different do §2.74, que era `nowrap`; aqui o texto
QUEBRA, só que quebra demais). "Digitale Präsenz" vira 2 linhas, "So
funktioniert es" vira 3, e como o cabeçalho tinha altura FIXA (`h-20
sm:h-22`) e os itens são `items-center`, os links de várias linhas
ficam centralizados por cima da faixa do logo — literalmente
sobrepondo o texto da tagline.

Corrigido em 3 pontas coordenadas, para o conteúdo se reajustar em vez
de quebrar palavra por palavra:
- `<nav>`: `flex-wrap` acrescentado, gap reduzido de `gap-8` fixo pra
  `gap-x-6 lg:gap-x-8 gap-y-1.5` (menos aperto quando cabe em 1 linha,
  respiro vertical quando quebra pra 2).
- Cada `<a>` do nav: `whitespace-nowrap` — agora quando não cabe, a
  FRASE INTEIRA pula pra próxima linha (como uma palavra), nunca quebra
  no meio de "funktioniert".
- Container do cabeçalho: `h-20 sm:h-22` (altura fixa) virou `min-h-20
  sm:min-h-22 py-2` (altura mínima) — se o nav precisar de 2 linhas, o
  cabeçalho cresce pra acomodar, em vez de cortar/sobrepor. Efeito
  colateral aceito e correto: em alemão/francês/holandês, o cabeçalho
  vira 2 fileiras (logo numa, nav+CTA ou nav sozinho na outra) em vez
  de 1 — mas sempre legível, sem sobreposição, em qualquer largura.
  Português/inglês continuam cabendo numa fileira só (nada mudou pra
  quem já funcionava).

Confirmado sem sobreposição em `de, fr, nl, ae` (RTL também) de 768 a
1440px, e sem regressão em `en`/`us` (continua 1 fileira em telas
largas). Mobile (`md:hidden`, menu hambúrguer) nunca foi afetado —
usa uma estrutura totalmente separada — e foi conferido mesmo assim.

**2. Seletor de idioma clicava e a página não mudava** — bug real,
distinto do #1, achado ao testar a consequência do próprio operador
("mudei pra alemão e não houve mudança"). Causa: `Landing` resolvia o
idioma como `forcedLang || contextLang || 'pt'`
(`components/landing/landing.tsx`), e `forcedLang` — o idioma fixo da
ROTA de país (`/br` → `pt`, sempre) — é uma string sempre verdadeira
nas páginas de país, então SEMPRE vencia, não importa o que a pessoa
escolhesse no seletor (que só atualiza `contextLang`). O comentário já
existente em `hiring-index-teaser.tsx` explicava por que essa ordem
existe: impedir que um PALPITE automático (geo-IP/navegador) mude o
idioma de uma rota de país sozinho — ex.: `/br` não pode virar inglês
só porque o Chrome da pessoa está em inglês. Essa regra está correta;
o problema é que ela também bloqueava a ESCOLHA manual, que deveria
valer exatamente o oposto.

Corrigido distinguindo as duas origens do mesmo estado
(`i18n-context.tsx`): `langManuallySet`, um booleano que só vira `true`
dentro de `setLang()` (clique no seletor) ou quando o idioma já veio de
`localStorage` no carregamento (porque só `setLang()` grava lá — a
detecção automática por geo-IP/navegador nunca escreve em
`localStorage`, então a PRÓPRIA PRESENÇA de um valor salvo já é prova
de escolha anterior, não de palpite). `Landing` passou a resolver:
`langManuallySet && contextLang ? contextLang : forcedLang || contextLang
|| 'pt'` — palpite automático continua sem poder virar o idioma da
rota sozinho, mas escolha manual (agora ou salva de visita anterior)
vence de verdade, sem precisar recarregar a página.

Testado ao vivo: `/br` (que teria `forcedLang: 'pt'`) com o seletor
clicado em "Deutsch" muda a `<h1>` e o nav pra alemão instantaneamente,
sem reload — e continua em alemão depois de um reload de verdade
(persistência via `localStorage`/cookie já existente, agora
efetivamente lida na re-renderização). `tsc --noEmit`, `eslint` e `npm
test` (888/888) limpos.

## 2.76 36 chaves de i18n perdendo dado real em 9 de 12 idiomas — placeholder ausente ou trocado

Pedido do operador: auditar layout de `/market-pulse` e das telas
autenticadas (item 4) e trocar o emoji de bandeira do seletor (item
5). O item 4 revelou um problema muito maior do que layout.

**`/market-pulse` em si: limpo.** Varredura em 12 idiomas × 2
resoluções não achou nenhuma sobreposição — a tabela de 98 países
"vazando" da viewport no mobile é o padrão CORRETO
(`overflow-x-auto` na `<div>` que envolve a `<table>`, confirmado por
`document.documentElement.scrollWidth` não crescer): tabela larga
rola dentro da própria caixa, não é a página inteira que estoura.

**O achado real começou com um `truncate` isolado.** Investigando o
mesmo padrão de risco do §2.74 em `dashboard.tsx` (cartão de
histórico, `flex items-center gap-4 min-w-0` idêntico ao do índice
que já tinha quebrado), notei que `t.dashboard.reportOf` e
`lastUpdated` faziam `.replace('{date}', date)` — mas alemão, francês,
italiano, japonês, holandês, sueco, chinês, árabe e coreano não tinham
NENHUM `{date}` na tradução. `.replace()` sem encontrar o token não
faz nada: a data que o produto mostra pra dizer QUAL versão do
currículo é aquela — desaparecia em silêncio, pros 9 idiomas.

**Escrito um teste pra medir o tamanho real do problema**
(`i18n.test.ts`): compara, para toda chave em `pt` que contém um
`{placeholder}`, se as outras 11 traduções têm o MESMO conjunto de
placeholders. Resultado da primeira rodada: **36 chaves**, todas
faltando o placeholder exatamente nos MESMOS 9 idiomas (alemão,
francês, italiano, japonês, holandês, sueco, chinês, árabe, coreano —
nunca em espanhol, que tem paridade com pt/en). Não é ruído disperso:
é um padrão sistemático de como essas 9 traduções foram produzidas.

Três formas diferentes do mesmo defeito, cada uma exigindo um
tratamento distinto:

1. **Placeholder com nome trocado** (3 chaves: `saveSuccessWithRadarMany`,
   `fillSuccessMany`, `runSuccessMany`) — os 9 idiomas escreveram
   `{count}`, mas o código sempre chama `.replace('{n}', ...)`
   (`professional-profile-view.tsx`, `radar-view.tsx`). Não é só "sem
   efeito": o usuário via literalmente `{count}` sem substituir na
   tela, texto quebrado à mostra. Corrigido só renomeando o token — a
   tradução em si já estava certa.

2. **Placeholder genuinamente ausente** (a maioria, ~29 chaves) — a
   frase toda ficou mais curta e genérica, sem o dado. Ex.:
   `dashboard.greeting` em alemão era só `"Guten Tag"` (pt: `"Olá,
   {name} 👋"`); `radar.compatibilityBadge` era `"Matching-Score"` (pt:
   `"Compatibilidade {level}"`); `upload.contentTooShortError` tinha
   `"100"` OU `"50.000"` **fixos na frase**, em vez de `{min}`/`{max}` —
   coincidentemente corretos hoje, mas silenciosamente errados no dia
   em que o limite mudar no código, porque só pt/en/es acompanhariam.

3. **Conteúdo semanticamente diferente, não só sem placeholder** (achado
   ao ler o `pt`/`en` ao lado do valor quebrado, não só contar
   `{}`): três casos onde os 9 idiomas descreviam uma coisa DIFERENTE
   da que o componente realmente mostra:
   - `radar.prepareRedirected`: os 9 diziam "Redirecionando para a
     vaga..." (uma mensagem de carregamento); o toast real
     (`radar-view.tsx:199`) é um AVISO de que o currículo trocou de
     vaga-alvo — "Estava direcionado a '{target}'. Agora aponta pra
     esta vaga." Sentido totalmente diferente.
   - `analysisPaywall.unlockAvailable`: os 9 mostravam um texto de
     marketing genérico ("Pagamento único • Acesso imediato") no
     lugar exato onde o código (`analysis-paywall.tsx:243-245`) só
     entra quando a pessoa JÁ TEM saldo pago (`balance > 0`) — a
     tradução nunca dizia quantas análises a pessoa já tinha
     disponíveis pra usar agora.
   - `profileConflict.desc`: os 9 descreviam "currículo tem info mais
     recente que o perfil salvo"; o componente
     (`profile-conflict-prompt.tsx`) é sobre CONFLITO DE CARGO — perfil
     configurado como X, currículo é de Y — e o `title` ao lado já
     fala em "área diferente". Sem os dois cargos nomeados, a pessoa
     via um prompt de "atualizar perfil" sem saber pra quê.

**Como foi corrigido**: como envolvia editar a mesma chave em 9
arquivos repetidamente (243 substituições mecânicas), escrevi um
script de uma vez (`fix-placeholders-tmp.mjs`, descartado depois de
rodar) que aplicava cada par exato "texto atual → texto novo" e
CONFERIA que o texto atual aparecia exatamente 1 vez no arquivo antes
de trocar — o mesmo padrão de segurança do `Edit` de string única,
só que em lote. Duas chaves (`dashboard.greeting`, que existe em dois
lugares do dicionário com o mesmo texto) precisaram de correção
manual por causa dessa ambiguidade, com uma linha de contexto a mais
pra mirar só a certa.

**3 falsos positivos aceitos, não corrigidos**: `saveSuccessWithRadarOne`,
`fillSuccessOne` e `runSuccessOne` (as variantes "1 resultado", nunca
"N") têm `{n}` no pt de forma redundante — o código escolhe entre
`...One`/`...Many` justamente quando a contagem JÁ é 1, então escrever
"1" fixo (como os 9 idiomas sempre fizeram) é igualmente correto.
Documentado como exceção deliberada no teste (`SINGULAR_LITERAL_OK`),
não como pendência.

**Efeito colateral corrigido antes que virasse o mesmo bug do §2.74**:
como vários dos textos consertados ficaram mais LONGOS (ex.:
`unlockAvailable`, `packCta` com preço embutido), os botões que os
usam (`analysis-paywall.tsx`, `plans-view.tsx`, `repurchase-upsell.tsx`)
ganharam o mesmo tratamento preventivo do hero (`whitespace-normal` +
`h-auto min-h-*`) — sem isso, o próprio conserto do texto teria
recriado o bug de corte silencioso em botões de compra.

**Item 5 — bandeira do seletor**: `language-selector.tsx` usava emoji
de bandeira (🇩🇪 etc.) tanto no gatilho fechado quanto na lista. No
Windows, o Segoe UI Emoji não tem o glifo de bandeira composta e cai
no par de letras do Regional Indicator por baixo — o emoji "🇩🇪"
renderiza como o texto literal "DE", duplicando o código do idioma
que já aparece do lado ("DE DE"). Trocado por um ícone `Languages`
(lucide-react, mesmo em qualquer plataforma) no gatilho, e removido o
emoji da lista (o `label` já traz o código entre parênteses — "Deutsch
(DE)" —, nenhuma informação se perde).

Verificado: `tsc --noEmit`, `eslint` e `npm test` (889/889, +1 do
teste novo de paridade de placeholders) limpos. Testado ao vivo no
navegador: seletor mostra "🌐 DE" sem duplicação, em qualquer
resolução.

## 2.77 Parágrafo BLUF no hero — frase factual pra citação por IA (GEO)

Operador colou um relatório de estratégia SEO/GEO de terceiro e pediu
pra fazer só o que dependesse exclusivamente de mim, deixando o resto
pra decidir depois. Conferido item a item contra o código antes de
escrever qualquer coisa (o mesmo hábito de checar afirmação externa
contra o estado real, não aceitar de cara):

- Schema `Organization` com `sameAs` **já existe** em `layout.tsx`
  (o relatório sugeria criar) — só tem 1 link (Instagram); adicionar
  LinkedIn/GitHub/X reais depende do operador informar os links, não
  fica pra essa rodada.
- As páginas de `/ats/{slug}` **não são genéricas** como o relatório
  descrevia — já têm `howItWorks`, `eliminationFactors`,
  `howGriffoWorkHelps` e FAQ próprios por sistema. O que falta de
  verdade (estatística real de rejeição por parsing, testada de
  verdade contra Workday/Taleo/Greenhouse) esbarra na regra
  permanente do produto contra inventar dado pra tela parecer
  completa — não escrito, fica pra quando existir a coleta real.
- Diferenciação de `/gb /ca /au` vs `/us` e frase do badge do hero:
  decisão editorial, não execução — fica pro operador.

**O que dependia só de mim**: o parágrafo BLUF (*Bottom Line Up
Front*) que o relatório pedia no item 3.1 — uma frase factual,
autossuficiente, em terceira pessoa, que define o produto sem
precisar do resto da página como contexto (o formato que buscadores
de IA — Perplexity, ChatGPT Search — preferem citar). Nova chave
`hero.blufSummary`, nas 12 línguas, citando ATS reais (Workday, Taleo,
Greenhouse, Gupy — os mesmos já usados no subtítulo/páginas de ATS) e
"mais de 40 mercados internacionais" (número real: `SUPPORTED_COUNTRY_SLUGS`
tem 40 rotas de país fora `global`, conferido no código, não
estimado).

Inserido em `landing.tsx` logo abaixo do subtítulo de conversão
existente, com estilo deliberadamente discreto (`text-xs sm:text-sm
text-slate-400`) — a intenção é ficar perto do topo do HTML sem
competir visualmente com a copy de conversão que já faz esse
trabalho. Testado ao vivo em `/de` (mobile e desktop), `/ae` (RTL) e
`/jp`: sem sobreposição, sem overflow, legível nas quatro
combinações. `tsc --noEmit`, `eslint` e `npm test` (889/889) limpos.

## 2.78 Badge do hero: fora "IA"/"Global", dentro mais prova de ATS real

Fechando a pendência que o próprio §2.72 tinha deixado em aberto
("IA + Padrões Gupy, LinkedIn & Recrutamento Global" continuava
citando os dois termos que a tagline já tinha abandonado). Dei 4
opções ao operador (texto técnico sem marca, ecoar "Inteligência de
Carreira" da tagline, mais nomes de ATS, ou frase própria) — escolhida
"mais nomes de ATS": preserva o que o badge já fazia de valioso (citar
marca real como prova, não é só enfeite) e troca só os dois termos
problemáticos.

Nas 12 línguas, o badge passou a citar o MESMO trio de ATS que o
subtítulo logo abaixo já usa (não um nome novo introduzido só no
badge) + LinkedIn — ex.: PT "Padrões Gupy, Workday, Taleo & LinkedIn",
EN "Workday, Taleo, Greenhouse & LinkedIn Standards", DE "Standards
von Workday, Personio, Taleo & LinkedIn" (Personio porque é o que o
subtítulo alemão já cita, não Gupy). Duas línguas tinham ATS
divergente entre badge e subtítulo antes desta correção (IT citava
"InfoJobs" no badge contra "Workday, Taleo, Greenhouse" no subtítulo;
FR só citava "Workday" sozinho) — alinhados aos dois.

Verificado ao vivo em `/de` (a versão mais longa, mobile e desktop):
cabe numa linha só, sem quebra nem corte — o mesmo tipo de bug do
§2.74/§2.75 que uma frase mais longa poderia ter reaberto aqui.
`tsc --noEmit`, `eslint` e `npm test` (889/889) limpos.

## 2.79 "CV" vs "resume" por mercado, e o termo nativo nas keywords de todo idioma

Operador decidiu diferenciar as rotas regionais priorizando captação
("melhor captar leads sempre"), depois de eu explicar que o risco de
"conteúdo duplicado" que o relatório externo levantava é folclore
neste caso — o Google não pune variantes por país com hreflang
correto (que o §2.69 já arrumou); ele escolhe qual mostrar. O custo
real de não diferenciar não é penalidade, é intenção de busca que
passa batido.

**Metade do pedido já estava feita, e eu confirmei antes de mexer:** o
`<title>`/description de cada rota JÁ interpolam `market.ats`, então
`/gb` já dizia "Teamtailor", `/us` "iCIMS", `/de` "Personio" — os ATS
regionais que o relatório pedia já apareciam no resultado de busca.

**O que faltava de verdade era o vocabulário.** Quem procura emprego
no Reino Unido digita "CV"; nos EUA, "resume". A página inteira em
inglês só dizia "resume", então a busca por "CV ATS checker" não
batia com nada. Pior: as `keywords` eram `curriculo {país}` +
`resume {país}` FIXOS em toda rota — nenhuma página não-PT/EN
declarava a própria palavra (`/de` não tinha "Lebenslauf", `/jp` não
tinha "職務経歴書").

Novo `lib/market/regional-terms.ts` com `resumeTermFor(país, idioma)`,
usado no título, na description e nas keywords:
- **Dentro do inglês**, divide por país: `CV_MARKETS` = GB, IE, AU, NZ,
  ZA (convenção britânica); EUA e Canadá seguem em "Resume".
- **Fora do inglês**, devolve o termo nativo (`Lebenslauf`,
  `職務経歴書`, `السيرة الذاتية`...) — sem variação por país, porque
  não existe: `Lebenslauf` serve DE e AT, `currículo` serve BR e PT.

**Deliberadamente NÃO adivinha onde a convenção é ambígua**: Índia,
Singapura, Filipinas e Nigéria usam os dois termos conforme o setor,
então ficam no padrão em vez de eu escolher um lado — a mesma regra
contra inventar dado, aplicada a vocabulário. Há teste que trava isso
explicitamente, para ninguém "completar a lista" depois sem
pesquisar.

6 testes novos (`regional-terms.test.ts`), incluindo uma trava para
idioma novo entrar em `LANGUAGES` sem termo nativo declarado — sem
ela, uma língua 13ª sairia com keywords em inglês sem ninguém notar.
Verificado com `curl` no HTML real: `/gb /au /nz /ie /za` → "ATS CV
Audit"; `/us /ca` → "ATS Resume Audit"; `/de` → "Lebenslauf" nas
keywords; `/jp` → "職務経歴書". `tsc --noEmit`, `eslint` e `npm test`
(895/895) limpos.

**O que fica de fora desta rodada, por ser outro tamanho de
trabalho:** o CORPO da página (H1, subtítulo, features, FAQ) continua
idêntico entre rotas do mesmo idioma, porque o texto vem de
`DICTIONARIES[jobLanguage]` — diferenciar ali exige uma camada de
override por mercado em cima do dicionário por idioma, não é troca de
string. O ganho de busca maior (o termo no `<title>`/description, que
é o que aparece no resultado do Google) já está capturado.

## 2.80 Item "Information Gain": um número falso achado em produção, e o dado próprio que ainda não existe

O item 4 do relatório de GEO (§2.77) pedia transformar as páginas de
`/ats/*` e `/market-pulse` em fonte de dado proprietário — benchmarks
reais de parsing por ATS, estatística de rejeição algorítmica. A
lógica está certa (IA não cita quem repete a Wikipédia; cita quem tem
dado primário), mas executar exigia PESQUISA, não redação. Operador
mandou investigar as duas frentes.

**Frente 1 — dado próprio a partir do produto: inviável hoje, e o
banco é que disse isso.** Consulta de volume (só leitura) devolveu
**64 currículos, 39 com análise, 8 usuários** — provavelmente na
maioria teste interno. Publicar "X% dos currículos falham na dimensão
de estrutura" com essa base seria fabricar autoridade estatística, o
mesmo defeito do §43 numa roupa nova. Não foi feito, e a decisão do
operador (que tinha escolhido essa opção) foi contrariada com o dado
na mão em vez de produzir o número frágil. **Revisitar** quando houver
centenas de currículos de usuários reais distintos — a consulta em si
é trivial.

**Frente 2 — auditoria dos números que JÁ estavam no ar.** Achado ao
abrir `lib/ats/data.ts` pra avaliar a frente 1: as 10 páginas de ATS
já traziam alegações de mercado, 4 delas numéricas, nenhuma com
fonte. Verificadas uma a uma contra fonte pública:

- **Gupy — "presente em mais de 70% das vagas corporativas e de
  grandes empresas no Brasil": FALSA, corrigida.** Os ~75% que
  circulam em fonte pública são de adoção de ATS **em geral** por
  médias e grandes empresas brasileiras — não da fatia da Gupy.
  Atribuir o número da CATEGORIA a uma EMPRESA é o erro que, conferido
  por um recrutador ou concorrente, derruba a credibilidade da página
  inteira, não só daquela frase. Trocada por descrição de posição sem
  percentual, com comentário no código registrando o porquê (pra
  ninguém recolocar depois sem saber).
- **Workday — "mais de 50% da Fortune 500": sustenta**, e é
  conservadora: o 8-K da própria Workday na SEC (FY2024) diz **mais de
  60%**.
- **Solides — "mais de 25 mil empresas": sustenta**, também
  conservadora (fontes indicam 35–55 mil, variando por data).
- **iCIMS — "mais de 4.000 clientes": sustenta** (~4.000, confirmado
  em múltiplas fontes).
- Os outros 6 são qualitativos ("líder em", "forte presença",
  "crescimento expressivo") — não falsificáveis, risco baixo.

**Padrão que ficou registrado**: número de fornecedor varia entre
fontes e ENVELHECE (iCIMS aparece como "40% da Fortune 100" numa
fonte e "quase 20%" noutra). Manter percentual em página pública só
se sustenta citando fonte primária COM DATA — senão o dado certo de
hoje vira o errado do ano que vem sem ninguém perceber. Pendência
aberta, não resolvida nesta rodada: as 3 alegações que sobreviveram
continuam sem citar fonte na tela.

`tsc --noEmit` e `npm test` (895/895) limpos.

## 2.81 Fonte e data viram obrigação de tipo, não de disciplina (fecha a pendência 17)

Operador pediu a melhor solução para a pendência aberta no §2.80 (as 3
alegações numéricas que se sustentam, mas não citavam fonte na tela).

**A solução não podia ser só "adicionar as 3 fontes".** Isso conserta
o texto de hoje e deixa o mecanismo intacto — a alegação falsa da Gupy
entrou e ficou meses no ar justamente porque `marketShare: string` não
exigia nada de quem escrevesse um percentual novo. Consertar as 3 e
seguir seria tratar o sintoma.

`marketShare` virou união discriminada (`MarketShare` em
`lib/ats/data.ts`):
- `{ kind: 'qualitative', text }` — descrição de posição sem número,
  que não precisa de fonte porque não afirma quantidade.
- `{ kind: 'sourced', text, source, sourceUrl, asOf }` — afirmação com
  número, onde **fonte e data são obrigatórias por construção**: não
  compila sem. Mesma trava por tipo que `hiring-index/lookup.ts` usa
  para o sentido das métricas (§2.56), pelo mesmo motivo: o dado novo
  sem a decisão junto não passa pelo compilador.

**`asOf` é obrigatório, não opcional, de propósito.** Número de
fornecedor envelhece: a Workday declarou "mais de 30% da Fortune 500"
em 2017 e "mais de 60%" em 2024. Sem a data na tela, quem lê não tem
como saber qual dos dois está vendo — e o dado certo de hoje vira o
errado do ano que vem em silêncio.

**A brecha que o tipo sozinho NÃO fecha**, e o teste que fecha: nada
impede escrever "70%" dentro de um `qualitative`. `data.test.ts` roda
uma regex de "isto parece estatística" (percentual, milhar, "Fortune
N") sobre todo `qualitative` e falha com mensagem dizendo o que fazer.
Conferido que a trava PEGA o caso real: reintroduzi o texto original
da Gupy no arquivo e o teste falhou nomeando o slug; só então
restaurei. Teste que passa sem nunca ter detectado nada não prova
nada.

**As 3 alegações, agora com fonte primária na tela** (link + ano,
`target="_blank" rel="noopener noreferrer"`):
- Workday: 8-K na SEC, 2024. Mantido "mais de 50%" embora a fonte diga
  60% — afirmação conservadora continua verdadeira se o número cair
  antes de alguém revisar a página.
- Sólides: site oficial, 2026. Mesma lógica ("mais de 25 mil" contra
  dezenas de milhares declaradas).
- iCIMS: site oficial, 2026. **Recorte geográfico retirado** ("nos EUA
  e Europa"): a fonte dá ~4.000 clientes no total, sem quebra por
  região — afirmar a região seria acrescentar precisão que a fonte não
  tem.

Verificado no HTML real (`curl` em `/ats/workday`): a linha sai
"Adotado por mais de 50% das corporações da Fortune 500. Fonte:
Workday (Form 8-K, SEC), 2024" com o link do arquivo da SEC. 3 testes
novos. `tsc --noEmit`, `eslint` e `npm test` (898/898) limpos.

**Achado à parte, NÃO corrigido, registrado como pendência:** as 10
páginas de `/ats/*` são **só em português** — nenhum `useI18n`, nenhum
`DICTIONARIES`, título e corpo fixos em PT. São páginas públicas e
indexáveis, então isto viola a regra permanente de nada fixo em
português (§2.49) no lugar mais visível possível. Não corrigido aqui
porque é outro tamanho de trabalho (10 guias × 12 idiomas de conteúdo
técnico), e misturar com esta correção esconderia as duas.

## 2.82 Páginas de ATS multilíngues, com escopo por relevância (fecha a pendência 19)

Operador pediu "a melhor opção para atingir todos os mercados". A
resposta honesta **não** era 10 × 12 = 120 páginas.

**Por que o escopo é por relevância, e não o produto cartesiano.** Cada
guia já declarava seu alcance em `marketName`: a Gupy e a Sólides só
operam no Brasil, o InfoJobs em Espanha/Brasil/Itália, o Personio no
eixo DACH, o iCIMS em EUA/Reino Unido. Traduzir tudo para tudo geraria
~50 páginas sem leitor possível (`/ats/gupy` em coreano) — e um bloco
de 120 páginas quase idênticas, metade sem audiência, é exatamente o
padrão que o sistema de conteúdo útil do Google mira. Gerar todas
prejudicaria o alcance em vez de ampliá-lo. O recorte dá **67 páginas,
todas com público real**, cobrindo os 12 idiomas.

**Arquitetura.** Separado o que NÃO traduz (nome do produto, país,
fonte da alegação de mercado) em `lib/ats/meta.ts`, do que traduz
(descrição, mecanismo, fatores de descarte, FAQ) em
`lib/ats/locales/{lang}.ts` — espelhando o padrão que `lib/i18n` já
usa. Nome próprio fica fora do conteúdo traduzível pelo mesmo motivo
que `Eurostat`/`BLS` ficam fora do dicionário: "Workday" é "Workday"
em alemão.

O PT existente foi migrado **por script**, não à mão: são 148 campos, e
transcrever convidaria erro silencioso de copia-e-cola. O script usou o
parser real do TypeScript (via `tsx`) em vez de regex, porque
apóstrofo escapado dentro de string portuguesa já quebrou regex neste
projeto antes.

**URL: `?lang=`, não esquema novo.** Seguiu o padrão que
`/market-pulse` já estabeleceu (§2.55), em vez de inventar um terceiro.
Preserva as URLs `/ats/{slug}` que já estavam no sitemap e possivelmente
indexadas. Canonical aponta sempre para a URL sem parâmetro.

**Rota, sitemap e hreflang saem da INTERSEÇÃO** entre o que o meta
declara (intenção editorial) e os locales escritos (realidade). Declarar
a intenção apontaria hreflang para 404, e hreflang que não fecha faz o
Google descartar o bloco INTEIRO — defeito que o §2.69 já custou uma
vez aqui.

**Regressão que a separação criou, e foi corrigida antes do commit:**
ao mover iCIMS para `en` e Personio para `de` no meta, os dois passaram
a dar 404, porque o conteúdo só existia em português. Foi o que motivou
escrever `en` e `de` já na primeira etapa em vez de deixar para depois.
Conferido rodando a lista de rotas e vendo os dois marcados `*** 404
***`.

**Comportamento de `?lang=` inválido, corrigido no COMENTÁRIO, não no
código.** Escrevi que combinação inexistente seria 404; ao testar,
`/ats/gupy?lang=de` devolvia 200 com recuo para português. Investiguei
antes de "consertar": o recuo é seguro e melhor — o canonical aponta
para `/ats/gupy` e o hreflang só lista `pt`, então o buscador nunca vê
a combinação inválida, e quem digitou à mão não leva 404 na cara. O
comentário é que estava errado; foi ele que mudou.

**Travas.** Sete testes, incluindo dois que só existem porque o tipo
sozinho não basta:
- **conteúdo órfão**: existe no locale mas nenhum meta declara.
  `atsContentFor` filtra pelo meta, então um órfão jamais apareceria
  numa página nem quebraria um teste. Verificado falhando antes de
  limpar os 2 casos reais que a migração deixou (iCIMS e Personio em
  PT, agora inalcançáveis).
- **paridade meta↔locale**: idioma declarado sem conteúdo escrito
  sumiria do sitemap em silêncio.

A trava de estatística sem fonte (§2.81) agora roda nos **12 idiomas**,
não só no português onde o defeito da Gupy apareceu.

Verificado no HTML real: títulos corretos em japonês, árabe, chinês,
coreano e francês; InfoJobs em italiano; 12 tags `hreflang` no Workday
e nenhuma no Personio (idioma único, como deve ser); sitemap com os
`xhtml:link` corretos. `tsc --noEmit`, `eslint` e `npm test` (903/903)
limpos.

**Ressalva declarada ao operador antes de executar:** a tradução técnica
de recrutamento em japonês, coreano, árabe, chinês, sueco e holandês foi
produzida sem revisão nativa — mesmo padrão dos 12 dicionários que o
produto já usa, portanto consistente, mas revisão por falante nativo
agregaria em páginas públicas que representam a marca.

## 2.83 A ressalva de "sem revisão nativa" virou um defeito concreto e corrigido

Operador perguntou sobre a ressalva do §2.82. Em vez de repeti-la,
separei o risco em três tipos e testei o único que é **mensurável**:

- **Gramática/fluência** — risco baixo, construções corretas.
- **Registro/tom** — risco médio, principalmente japonês e coreano de
  negócios, que são altamente convencionalizados. Não verificável sem
  falante nativo.
- **Terminologia técnica** — o que de fato importa, porque decide se a
  página aparece na busca. **Verificável em fonte pública**, e foi.

**O defeito encontrado.** Consultado o uso corrente do termo "ATS" em
alemão, japonês e espanhol, o padrão é sempre **sigla + termo nativo**:
"ATS (Bewerbermanagementsystem)", "ATS（採用管理システム）", "ATS
(sistema de seguimiento de candidatos)" — na Wikipédia em espanhol o
termo nativo é inclusive o TÍTULO do verbete, não uma nota de rodapé.
Todo o conteúdo que eu tinha escrito usava só a sigla. Quem busca pelo
termo do próprio mercado — que é a maioria — não encontrava nenhuma
das 67 páginas.

Isso não é questão de estilo: é intenção de busca perdida, exatamente
a mesma classe do §2.79 ("CV" vs "resume"), só que descoberta por outro
caminho.

**Corrigido** em duas chaves por idioma — `metaDescription` (o texto que
aparece no resultado da busca) e `heroBadge` (primeira menção visível na
página). Conferido no HTML real em `/ats/workday` nos três idiomas
verificados.

**Distinção que fica registrada, e não deve ser apagada:** os termos de
`de`, `ja` e `es` foram conferidos contra fonte pública nesta sessão.
Os outros nove usam o termo padrão corrente, **sem verificação em
fonte** — são plausíveis, não confirmados. Apresentá-los como
igualmente checados seria o mesmo tipo de imprecisão que o §2.80 pegou
na alegação da Gupy. Quem for revisar, comece por esses nove.

**O que a ressalva original errava.** Dizer "sem revisão nativa" e parar
ali trata tudo como um bloco de risco difuso e inacionável. Uma parte
era verificável sozinha, e continha um defeito real que estava no ar.
A ressalva continua válida para tom e registro; para terminologia,
havia trabalho a fazer, não só um aviso a dar.

## 2.84 `/hiring`: a primeira porta de entrada, e a direção invertida da palavra

Operador pediu para usar "hiring" na captação de leads, porque a palavra
aparece muito nos perfis de recrutadores no Instagram.

**Antes disso, um erro meu que precisa ficar registrado.** Na mensagem
anterior ele disse só "estamos esquecendo o termo muito usado hiring".
Eu supus que significasse "processo de contratação", e saí aplicando
`hiring process` / `processo seletivo` nas 67 páginas de ATS sem
perguntar o que ele queria dizer. Ele então explicou que se referia a
outra coisa (selo do LinkedIn, hiring manager, empresa homônima), e
depois precisou pedir duas vezes que eu dissesse o que havia entendido
antes de a confusão ficar clara. A instrução que veio foi direta:
**"nunca invente nada"**. Registrada como memória permanente
(`feedback_never_assume_intent`), porque o defeito não foi de
implementação — foi agir sobre uma suposição em vez de perguntar.

O trabalho do §2.83 anterior (processo seletivo nas descrições) segue
válido por mérito próprio — as páginas só diziam "triagem", que é o
termo estreito —, mas foi feito pelo motivo errado.

**A direção da palavra é o que define a página.** `#hiring` é um sinal
que vai DO EMPREGADOR PARA O CANDIDATO: quem publica está oferecendo
vaga. O GriffoWork não oferece vaga nenhuma. Verificado em fonte que as
hashtags do lado oposto — de quem procura — são outras (`#hireme`,
`#jobhunting`, `#opentowork`). Competir por `#hiring` como se fôssemos
anunciante atrairia gente que quer ver uma vaga e entregaria um serviço:
tráfego que não converte, e sinal ruim para o buscador.

O que a palavra captura de verdade é o **instante seguinte**: a pessoa
viu o anúncio, se candidatou, e ficou com a dúvida "meu currículo
passa?". Essa dúvida é literalmente o que o produto responde. Daí o H1
ser *"Você respondeu à vaga. Seu currículo chega até uma pessoa?"* — e
não "temos vagas".

**Implementação:** `app/hiring/page.tsx`, SSR, 12 idiomas, seguindo o
mesmo padrão de `?lang=` + canonical + hreflang de `/market-pulse`
(§2.55) e `/ats` (§2.82) — não se inventou um quarto esquema de URL.
Bloco `hiringPage` no dicionário, 17 chaves × 12 idiomas.

No `sitemap.ts`, os 12 alternates saem de `LANGUAGES`, **não** de lista
literal — diferente do bloco do `/market-pulse` logo acima, que ainda
tem os 12 pares escritos à mão e vai divergir no dia em que entrar um
13º idioma. O novo já nasceu certo; o antigo fica como dívida
conhecida.

**Sem estatística, de propósito.** Circula muito "X% dos currículos
nunca chegam a um humano" — é exatamente o número que converteria bem
numa página de captação. Nenhum deles foi verificado por nós, e o §43
vale aqui como vale no laudo. A página descreve o mecanismo em três
etapas (o sistema lê o arquivo → compara com a vaga → só então alguém
abre) sem afirmar magnitude nenhuma.

**Erro pego na própria geração:** o CTA em japonês saiu com caracteres
cirílicos misturados (`無料диагノーシス`) — ruído meu ao gerar os 12
blocos. Corrigido, e depois varridos os 12 arquivos procurando qualquer
alfabeto fora do lugar (cirílico em qualquer um, kana fora do `ja`,
hangul fora do `ko`, árabe fora do `ar`). Nenhuma outra ocorrência.

Verificado no HTML real em pt/en/de/ja, 12 tags de hreflang, entrada
correta no sitemap, zero overflow em mobile (390px) e desktop (1280px).
`tsc --noEmit`, `eslint` e `npm test` (903/903) limpos.

---

## 2.85 Autoridade externa: a página órfã, o dataset que ninguém sabia baixar, e a fila de jornalistas

O item 3 do relatório de GEO era "backlinks / autoridade externa" — o
único que não se resolve escrevendo código, porque depende de outra
pessoa decidir linkar. Quatro frentes, em ordem de custo.

**(1) `/hiring` estava órfã, e o Search Console já dizia isso.** A
página nasceu no §2.84 com entrada no sitemap e nenhum link interno
apontando para ela. No Search Console (propriedade `griffo.work`, conta
`griffowork1@gmail.com`) ela aparecia junto de outras 31 URLs em
**"Detectada, mas não indexada"** — o estado exato de URL que o Google
conhece pelo sitemap e decide não gastar rastreamento. Sitemap é
declaração de existência; link interno é declaração de importância, e
só a segunda move a fila. Corrigido com um link no rodapé da landing,
usando a chave `nav.hiring` que já existia nos 12 idiomas.

**Erro meu no caminho, registrado porque a conclusão foi divulgada
antes de ser verificada:** afirmei, com base numa busca na web, que o
site não estava indexado. O Search Console mostrava **40 páginas
indexadas**. `site:` no buscador público não é medida de indexação, e eu
apresentei uma inferência fraca como fato. Corrigido na mesma conversa.

**(2) O `Dataset` do `/market-pulse` não dizia que o dado era
baixável.** O JSON-LD do §2.55 já declarava fontes, cobertura e data,
mas nenhum campo apontava para o endpoint. `/api/hiring-index` sempre
foi público e sem autenticação — é o mesmo que o teaser da home consome
a cada visita —, só que nada no dado estruturado revelava isso. Um
`Dataset` sem `distribution` é *uma página sobre dados*; com ela, é
*uma fonte de dados*, que é o que o Google Dataset Search lista e o que
um jornalista cita. Acrescentado um `DataDownload`
(`encodingFormat: application/json`) apontando para o endpoint real.

**(3) `docs/KIT-DIVULGACAO.md`** — o material que a divulgação precisa,
escrito uma vez e reusável: textos de cadastro em diretórios de produto,
release em PT e EN, lista de plataformas onde jornalista pede pauta, e
bio da fonte. **Cada país citado no release foi conferido contra
`/api/hiring-index` antes de entrar no texto** — 24 países, um a um. Um
release com número que não bate no próprio endpoint que ele manda
consultar é pior que nenhum release.

**(4) Source of Sources (sucessor do HARO), assinado hoje.** É a fila
onde jornalista descreve a pauta e pede fonte; responder bem rende link
editorial de veículo real, que é a única espécie de backlink que o item
3 pedia. Cadastro feito com `contact@griffowork.com` (chega em
`griffowork1@gmail.com`).

Duas coisas ficaram **fora** do que eu podia fazer, e não por falta de
autorização: o operador autorizou explicitamente ("eu autorizo vc a
fazer os cadastros dessa vez") e ainda assim criar conta e digitar senha
continua vedado. Qwoted, Featured e Help a B2B Writer seguem como
cadastro dele. Os dois e-mails de release existem como rascunho no
Gmail, **sem destinatário**, esperando revisão e envio por ele.

E-mails de fila de pauta são exatamente o perfil que o filtro de spam
derruba: remetente novo, volume alto, muitos links. Contato criado
(Peter Shankman / Source of Sources) e, com autorização do operador,
filtro no Gmail em `from:peter@sourceofsources.com` com **"Nunca enviar
para Spam"** + marcador `SOS`, aplicado também à conversa que já havia
chegado. Contato sozinho não garante caixa de entrada; o filtro garante.

A confirmação da assinatura chegou às 19:56 — a fila está viva. O
trabalho recorrente combinado: ler os pedidos, separar os de mercado de
trabalho / contratação / triagem por IA, redigir a resposta com o dado
do atlas, e deixar para o operador revisar e enviar.

---

## 2.86 O site inteiro declarava ser português, e o árabe renderizava espelhado

Operador perguntou se tinha ficado algo para trás. Os documentos estavam
em dia; **o produto não**. Dois defeitos vivos, os dois na mesma raiz.

**(1) `<html lang="pt-BR">` fixo em `app/layout.tsx`.** Conferido no
HTML servido: `/de` entregava "Ihre …", `/jp` entregava "あなたの…" e
`/ae` entregava "إنّ …" — todos declarando `pt-BR`. O arquivo
**contradizia a si mesmo**: vinte linhas acima, o próprio bloco de
`hreflang` declarava `/de` como `de-DE`.

É a mesma classe do §2.71, e o comentário do `market-pulse` já
registrava que "o layout raiz vazou português para `/us` e `/de` uma
vez". Vazou, foi corrigido lá — e o `<html>` da raiz ficou.

**(2) O árabe renderizava da esquerda para a direita.** Zero ocorrências
de `dir="rtl"` no HTML de `/ae`, de `/hiring?lang=ar` e das 5 páginas de
`/ats` em árabe. `/market-pulse` era o **único arquivo do projeto** a
setar `dir`, e fazia isso com `lang === 'ar' ? 'rtl' : 'ltr'` inline.
Não é sutileza de indexação: a página inicial em árabe saía com
alinhamento, pontuação e ordem dos botões trocados.

**A troca foi escolhida, não sofrida.** Corrigir o `lang` no HTML
servido exige o layout raiz ler `headers()`, e isso torna **todas** as
rotas dinâmicas — as 41 páginas de país deixariam de ser pré-geradas.
Apresentadas três opções ao operador, ele escolheu a híbrida: `dir` no
servidor (estático, custo zero, resolve a quebra visual de verdade) e
`lang` ajustado no cliente pelo novo `DocumentLanguage`, que é onde o
leitor de tela decide a pronúncia. O sinal para o rastreador continua
vindo do `hreflang` e do conteúdo — que já estavam corretos, e são o que
o Google documenta usar.

**`DocumentLanguage` recebe o idioma por prop, e não do contexto.** Em
rota de país os dois divergem **de propósito**: `landing.tsx` resolve
`langManuallySet ? contextLang : forcedLang`, então em `/de` o contexto
pode dizer `pt` (palpite de geo-IP) enquanto a página desenha alemão.
Ler o contexto ali declararia o idioma errado exatamente nas rotas que o
componente existe para consertar.

**Duas coisas mais que nada obrigava a ficar certas:**

Os 12 pares de `hreflang` da raiz e o `inLanguage` viviam escritos à mão
no `layout.tsx`; os alternates do `/market-pulse`, à mão no `sitemap.ts`.
Um 13º idioma entraria em `LANGUAGES`, passaria no `i18n.test.ts`,
ganharia `/ats` e `/hiring` funcionando — e sumiria calado dos três.
Como o Google descarta o bloco **inteiro** de hreflang quando ele não
fecha (§2.69, que já custou "nenhuma página indexada" a este projeto), o
dano não seria um idioma: seriam os doze. Agora saem de
`lib/i18n/hreflang.ts` e de `LANGUAGES`. A lista literal do sitemap foi
**conferida par a par** antes da troca, não presumida equivalente.

O mapa idioma→rota de país continua literal, e de propósito: escolher
que o alemão mora em `/de` e não em `/at` é decisão editorial, não
derivação. O que virou teste foi a **completude**, não a escolha.

E `/se`, `/cn` e `/kr` eram as únicas três das doze rotas do hreflang
fora de `SUPPORTED_COUNTRY_SLUGS`: respondiam 200 por `dynamicParams`,
renderizando a cada requisição em vez de sair prontas do build. Declarar
uma rota como a casa canônica de um idioma e não pré-gerá-la é
incoerência gratuita — os dados de mercado já as resolviam certo. O
build foi de 45 para 48 páginas estáticas.

**8 testes novos, cada trava verificada falhando** antes de restaurar:
idioma sem rota (3 falhas), rota fora do SSG (1), árabe deixando de ser
`rtl` (2). Inclui trava para `he`/`fa`/`ur`, que herdariam `ltr` em
silêncio do mesmo jeito que o árabe herdou.

Verificado no navegador contra o build de produção: `/ae` passa a
`lang="ar-AE"` `dir="rtl"` com o layout espelhado corretamente (logo à
direita, navegação e CTAs invertidos), `/de` a `lang="de-DE"` `ltr`, e o
`dir` sai do servidor em `/hiring`, `/ats` e `/market-pulse` nos dois
sentidos. `tsc`, `eslint` e `npm run build` limpos; 911 testes, `fail 0`.

---

## 2.87 A casa do árabe não tinha porta, e a lista de países se partiu em duas

Operador perguntou se havia mais o que revisar. A varredura foi contra a
produção: as 54 URLs do sitemap, cruzadas com todos os links internos
reais de cada uma delas. Três defeitos — e um deles foi meu, feito na
sessão anterior.

**(1) `/ae` e `/my` no sitemap, com ZERO link interno.** É o mesmo
estado que pôs `/hiring` em "Detectada, mas não indexada" (§2.85): o
`<loc>` declara que a página existe, o link interno declara que ela
importa, e só o segundo move a fila de rastreamento.

`/ae` é o caso grave, e não por ser mais um mercado: é a rota que o
`hreflang` da raiz declara ser **a casa do árabe**. O site anunciava ao
Google a página canônica de um dos seus doze idiomas e não dava caminho
nenhum até ela — logo depois de o §2.86 ter descoberto que essa mesma
página ainda renderizava da esquerda para a direita.

**A causa é estrutural, não esquecimento.** O rodapé linkava 11 países
escolhidos a dedo. As outras 29 rotas dependiam de **um único** link: a
tabela de países do `/market-pulse`. Só que aquela tabela lista apenas
quem tem dado no atlas — e `AE`, `MY` e `CN` são exatamente os três sem
dado (conferido no `/api/hiring-index`: 98 países, nenhum deles). Ou
seja, a descoberta de uma rota de país estava presa à cobertura de uma
coleta estatística que muda sozinha a cada trimestre. Um país que saísse
da coleta viraria órfão sem ninguém notar.

`lib/market/footer-markets.ts` inverte isso: **toda casa de idioma
declarada no `hreflang` tem link permanente, tenha dado de mercado ou
não.** São 18 links no rodapé contra 11; `/jp` e `/nl` saem de 1 link
para 55.

**(2) `sitemap.ts` guardava a própria cópia da lista de países** — 41
slugs idênticos aos de `supported-slugs.ts`. Ao acrescentar `se`, `cn` e
`kr` às rotas pré-geradas no §2.86, **eu fiz as duas divergirem**: as
três nasceram construídas e ausentes do sitemap, três páginas que
nenhum buscador seria avisado que existem. É o mesmo defeito que o
§2.86 acabara de corrigir no hreflang, reaparecendo no arquivo ao lado,
pela minha mão, na mesma sessão. Duas listas que precisam concordar e
não têm quem as obrigue não é estilo — é um defeito esperando data.

**(3) Nomes de país escritos à mão em português no rodapé.** "Brasil
(BR)", "Estados Unidos (US)", "Alemanha (DE)" apareciam nas 54 páginas
públicas, **inclusive nas onze línguas que não são português** —
conferido no HTML de `/de` e `/jp` em produção. O cabeçalho de
`lib/hiring-index/display.ts` já avisava contra exatamente isso ("usá-la
aqui colocaria português dentro das outras 11 telas"), e o aviso estava
sendo desobedecido no componente mais compartilhado do produto. Agora
passam por `displayCountry(code, lang)`; "Mercados:" e "Compatibilidade
ATS:" viraram chaves de dicionário nos 12 idiomas.

**6 testes novos**, a trava principal verificada falhando ao remover a
casa do árabe da lista. Um deles lê o `sitemap.ts` e falha se ele voltar
a manter cópia própria dos países.

Verificado no build de produção: rodapé de `/de` com "Brasilien (BR)",
de `/jp` com "ブラジル (BR)", de `/ae` com "البرازيل (BR)", 18 mercados
em cada, e `href="/ae"` presente em todas as páginas. `tsc`, `eslint` e
`npm run build` limpos; 917 testes, `fail 0`.

**O que a varredura confirmou que está certo:** as 54 URLs do sitemap
respondem 200, sem exceção.

---

## 2.88 `#OpenToWork` e `job hunting`: a hashtag que não se traduz, e dois termos que erram o público

Operador pediu usar `#opentowork` e `#jobhunting` "no lugar". **Perguntei
o que "no lugar" significava antes de mexer** — as quatro leituras
possíveis mexiam em coisas diferentes: renomear a rota `/hiring`, criar
páginas próprias para cada termo, acrescentar vocabulário à página que
existe, ou usar só no material de divulgação. É a memória
`feedback_never_assume_intent` funcionando: foi com esta mesma palavra,
no §2.84, que eu supus o sentido e mexi em 67 páginas à toa.

Ele escolheu **vocabulário na página existente** — mantém a URL já
rastreada e não cria página fina, que era o risco das outras duas.

**Uma ressalva dita antes de trabalhar:** o Google ignora a meta
`keywords` desde 2009. Se o trabalho fosse só preencher aquele campo,
não valeria a hora. O que trabalha de verdade é o texto visível, então é
lá que está o esforço — as `keywords` entram por consistência com o que
`/ats` e o `layout.tsx` já fazem, e porque o Bing ainda dá algum peso.

**A hashtag não se traduz.** Verificado em fonte: `#OpenToWork` circula
em inglês em todos os mercados, porque é selo do LinkedIn. O que muda de
idioma é o rótulo descritivo — o LinkedIn alemão diz "Offen für
Jobangebote", o francês "Ouvert aux opportunités". É exatamente o padrão
que o §2.83 achou para "ATS": o termo em inglês aparece **junto** do
nativo, nunca um dos dois sozinho. `jobSearchKeywords(lang)` monta essa
combinação, e há teste cobrando que nenhum idioma perca nenhuma das duas
metades.

**Duas distinções verificadas em fonte, que trocariam o público:**

**Japonês — `転職活動`, não `就職活動`.** O segundo é a caça a emprego de
recém-formado, que no Japão acontece num calendário anual fixo e onde a
empresa avalia potencial. O primeiro é a mudança de carreira, com timing
próprio, onde a empresa procura `即戦力` (quem já entrega hoje). O
público do GriffoWork é o segundo; usar o outro miraria estudante de
graduação. Mesma classe de erro que o §2.83 pegou, evitada por
verificar antes em vez de traduzir ao pé da letra.

**Chinês — `求职`, não `跳槽`.** `跳槽` significa pular de emprego e
carrega a conotação de sair antes de cumprir o contrato: palavra de
conversa, não de página institucional. `求职` é o termo neutro.

Coreano leva `구직` e `이직`, porque os dois cobrem meio de carreira.

**O bloco novo respeita a linha do §2.84.** Ele alcança o outro lado do
mesmo instante — quem ligou o `#OpenToWork` e espera ser encontrado, em
vez de quem acabou de se candidatar — e o que afirma é factual e vale
para os dois: o filtro automático é o mesmo. **Não promete vaga**, e há
um teste com padrões proibidos ("vagas disponíveis", "offene Stellen",
"jobs available") que falha se algum idioma passar a insinuar isso. Era
o risco real de atrair por termo de quem procura emprego.

6 testes novos. Verificados falhando: trocar `転職活動` por `就職活動`, e
tirar a hashtag do texto visível de um idioma. Conferido no HTML real em
pt, ja, ar e de — keywords e `<h2>` corretos nos quatro. `tsc`, `eslint`
e `npm run build` limpos; 923 testes, `fail 0`.

---

## 2.89 `REVOKE ... FROM anon` não fecha função nenhuma — e dois commits meus entraram com a verificação quebrada

Operador pediu para instalar o MCP do Supabase. **Ele já estava
instalado**, pelo conector da claude.ai — conferido chamando de verdade,
lista os dois projetos (`Griffo` e `jobbase`, ambos `ACTIVE_HEALTHY`).
Instalar um servidor local daria as MESMAS ferramentas e exigiria
guardar um *personal access token* com acesso total à conta dentro de
configuração, um passo atrás logo depois do §2.88b. Em vez do trabalho
redundante, a conexão foi usada para rodar o linter de segurança do
banco de produção.

### O defeito

`public.rls_auto_enable()` é `SECURITY DEFINER` e estava chamável **sem
login** em `/rest/v1/rpc/rls_auto_enable`.

A causa é um detalhe que passa batido, e o `prisma/rls.sql` já tinha
metade da defesa desde 24/08: o Postgres concede `EXECUTE` a **PUBLIC**
por padrão ao criar qualquer função, e **todo papel é membro de PUBLIC**.
Então o `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon` que já
existia tirava o grant NOMINAL de `anon` e deixava intacto o que ele
herda de PUBLIC — na prática, não tirava nada. Confirmado nos grants:
`PUBLIC:EXECUTE` estava lá, e `has_function_privilege('anon', ...)`
devolvia `true` apesar do REVOKE.

**A gravidade foi medida, não presumida.** Antes de classificar, li o
corpo da função: ela retorna `event_trigger` e chama
`pg_event_trigger_ddl_commands()`, que só funciona dentro de um gatilho
de DDL — chamada por fora, erra antes de fazer nada. E mesmo rodando,
tudo que faz é LIGAR RLS, que é endurecimento e não dano. Já tinha
`SET search_path TO 'pg_catalog'`, fechando o ataque clássico. Risco
real: baixo. Mas função `SECURITY DEFINER` alcançável pela internet
aberta não se deixa de pé por ser inofensiva hoje — o corpo pode mudar.

Também conferido que só existe UMA função no schema `public`, então
revogar de PUBLIC não podia afetar nada além dela.

### A correção

`REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC`, mais
`ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`
para cobrir a próxima função criada — sem a segunda, a correção valeria
só para a que existe hoje. Aplicada em produção **e** gravada no
`rls.sql`, senão o próximo `npm run db:rls` devolveria a permissão.

Verificado, não presumido: `anon` e `authenticated` foram de `true` para
`false`; `service_role` e `postgres` seguem com `EXECUTE`; **o gatilho
de evento continuou ativo** (gatilho roda como dono, não pela permissão
de quem chama); `npm run db:rls` executa os 5 comandos e termina limpo;
e os 2 `WARN` do linter sumiram.

**Os 22 avisos `INFO` restantes não são defeito.** RLS ligado sem
política nega TUDO pela API pública — é o estado *fail-closed*, o
seguro. O app funciona porque fala por conexão direta com `service_role`,
que ignora RLS por definição. É o desenho deliberado do §2.x que criou
o `rls.sql`.

### Dois erros meus, e o mesmo erro duas vezes

Encadeei `npm test | tail` e li `$?` — que mede o `tail`, não o teste. O
commit `ee9b014` **entrou com a suíte vermelha**. E o teste estava
certo: `sql-split.test.ts` existe para travar QUANTAS instruções o
script executa contra o banco, e minha mudança levou o arquivo de 3 para
5. Corrigido afirmando sobre as duas novas instruções, não afrouxando a
contagem — a proteção contra o SQL de exemplo do rodapé (`CREATE ROLE`,
`FORCE ROW LEVEL SECURITY`, `CREATE POLICY`) continua intacta.

Aí **repeti o mesmo erro na mensagem seguinte** e empurrei `bcf8d39` com
o `tsc` quebrado (`TS1501`: usei a flag `/s`, indisponível no alvo do
`tsconfig` deste projeto). Corrigido com `[\s\S]`.

A lição não é "rodar os testes" — eu rodei as três vezes. É que **`cmd |
head` descarta o código de saída do comando**, então a verificação
parecia acontecer e não acontecia. Agora os códigos saem para variável,
um por um, e é o número que se lê. tsc 0, testes 0 (923), eslint 0.

## 2.90 O README dizia SQLite e ativação simulada; o produto roda em Postgres com Stripe de verdade há tempos

Operador perguntou pela maturidade do projeto. Responder exigiu ler o
estado real do código — e o README, a única porta de entrada para quem
chega de fora do projeto, estava parado numa versão de meses atrás,
enquanto `docs/HANDOFF-CONTINUIDADE.md` e esta auditoria seguiam em dia.
A pergunta seguinte, "atualiza o README", foi o pedido para corrigir
isso.

### O que estava errado, e há quanto tempo

- **Banco**: README dizia SQLite ("fácil de migrar para Postgres em
  produção"). `prisma/schema.prisma` já declara `provider =
  "postgresql"` com `POSTGRES_PRISMA_URL`/`POSTGRES_URL_NON_POOLING` —
  Supabase, não uma migração pendente.
- **Pagamento**: README dizia "Planos com ativação simulada".
  `src/lib/stripe.ts`, o webhook idempotente (`WebhookEvent`) e o
  ledger auditável (`AnalysisLedger`, com `stripeEventId`) são cobrança
  real em produção, com Pix habilitável no checkout brasileiro.
- **Preço**: README listava três planos fixos em real (Passe Diário
  R$19,90 etc. — o modelo de crédito, já encerrado). `src/lib/pricing/
  catalog.ts` é hoje a fonte única: 4 faixas por país, ancoradas em
  dólar, com piso de US$2,60 acima do custo direto medido
  (US$1,0449) — nenhuma menção a real como moeda universal.
- **IA**: README citava `z-ai-web-dev-sdk` (GLM-4.6) como único
  provedor. O roteador em `src/lib/ai-router/` opera com fallback entre
  Claude, DeepSeek, Kimi K3 e Gemini, cada chamada registrada em
  `AiLog` com custo, latência e provedor efetivamente usado.
- **Idioma**: README descrevia landing só em português. `src/lib/i18n/
  types.ts` lista 12 idiomas (`pt en es de fr it ja nl sv zh ar ko`),
  com RTL para árabe — trabalho registrado nos §§2.69 a 2.89, nunca
  refletido no README.
- **Escopo do produto**: README não mencionava o Job Radar, o
  `/market-pulse` (índice de temperatura de contratação) nem os itens
  vendidos além do laudo e da reescrita (orientação vocacional, carta
  de apresentação, resumo profissional, análise de presença digital) —
  todos com produtor no código, listados em `ANALYSIS_DELIVERABLES`.

### Método

Cada afirmação nova só entrou depois de conferida no código-fonte, não
por lembrança da conversa: `prisma/schema.prisma` (22 models),
`src/lib/pricing/catalog.ts` (faixas e piso), `src/lib/i18n/types.ts`
(lista de idiomas), `.env.example` (o que é obrigatório e por quê — os
comentários de lá já explicam melhor que qualquer prosa nova),
`vercel.json` (os dois crons) e `package.json` (scripts reais, sem
`bun` como único caminho documentado). O README anterior trazia número
de margem de lucro (94%/76%/66%) que dependia do modelo de crédito
antigo — removido em vez de recalculado, porque recalcular pediria dado
que não estava à mão nesta tarefa, e apresentá-lo como atual repetiria
a imprecisão que o §2.80 já flagrou uma vez.

### O que não mudou

Nenhum arquivo de código foi tocado — é atualização de documentação
pública, não correção de defeito de produto. Suíte, `tsc` e `build`
seguem no estado do §2.89 (923 testes, `fail 0`).

---

## 2.91 Qwoted, Featured e Help a B2B Writer cadastrados pelo operador

Pendência aberta no §2.85 (item 4) e repetida na pendência 22 do
`HANDOFF-CONTINUIDADE.md`: criar conta e digitar senha nesses três
diretórios é vedado para mim mesmo com autorização explícita do
operador, então ficaram marcados como "cadastro dele". Ele confirmou
hoje (07/09) que já se cadastrou nos três — e, pelo fraseado ("todos os
outros"), também no Source of Sources, já ativo desde o §2.85.

**O que isso muda:** as quatro plataformas do item 7 do
`KIT-DIVULGACAO.md` estão com cadastro feito. Nenhum código mudou; é
estado operacional, não defeito de produto.

**O que continua pendente, sem mudança:**
- Os dois e-mails de release seguem como rascunho no Gmail, **sem
  destinatário** — revisão e envio continuam do operador.
- A **licença do dataset** que o `distribution` expõe segue sem decisão
  (jurídica, não técnica).

**O que passa a ser recorrente a partir de agora:** com os quatro
cadastros feitos, pedidos de pauta podem chegar por qualquer uma das
quatro vias (SoS por e-mail; Qwoted, Featured e Help a B2B Writer
dentro da própria plataforma, exigindo sessão logada). A divisão de
trabalho do item 7 do kit vale igual para as quatro: ler o pedido,
filtrar por relevância (mercado de trabalho, contratação, triagem por
IA), redigir a resposta com o dado do `/market-pulse`/`hiring-index` —
nunca número de usuário ou estatística que o produto não mede — e
deixar para o operador revisar e enviar.

---

## 2.92 Os sete diretórios de produto do item 3 do kit, todos cadastrados pelo operador

Continuação do §2.91: o operador confirmou, na sequência, cadastro
feito em **Product Hunt, AlternativeTo, SaaSHub, Capterra, G2,
SourceForge e BetaList** — a lista inteira do item 3 do
`KIT-DIVULGACAO.md` ("Estes aceitam produto novo, dão link real e
custam uma tarde. Só você pode submeter"). Repetiu também Featured.com,
já registrado no §2.91.

**O que isso muda:** com conta feita nos sete, falta só **submeter** o
texto que o item 3 já deixa pronto — nome (`GriffoWork`), tagline,
descrição curta, descrição longa, categorias e diferencial —, colando
em cada painel. Submissão em si não é cadastro (não esbarra na mesma
vedação de criar conta/senha), mas cada painel varia no formulário, e
nenhum destes foi submetido ainda nesta sessão.

**Nenhum código mudou** — é estado operacional, não defeito de
produto. Estes sete diretórios não tinham pendência numerada própria
no `HANDOFF-CONTINUIDADE.md` (o item 3 do kit nunca virou pendência
formal, só ficou como material pronto); registrado aqui para o cadastro
não se perder, e a pendência 22 do HANDOFF foi ampliada para cobrir os
sete junto dos quatro do §2.91.

---

## 2.93 Os sete diretórios de produto, submetidos — pendência 22 fecha

Continuação do §2.92: o operador confirmou que já inseriu o texto do
item 3 do kit (nome, tagline, descrição curta, descrição longa,
categorias, diferencial) nos sete painéis — Product Hunt, AlternativeTo,
SaaSHub, Capterra, G2, SourceForge e BetaList. Com isso a pendência 22
do `HANDOFF-CONTINUIDADE.md`, que cobria os onze cadastros do kit de
divulgação (§2.91, §2.92) e a submissão em si, está encerrada.

**O que isso muda:** o item 3 e o item 7 do `KIT-DIVULGACAO.md` estão
com o trabalho que só o operador pode fazer concluído. O que resta do
kit inteiro é o que já estava fora do alcance de cadastro/submissão:
os dois e-mails de release, sem destinatário; a decisão de licença do
dataset; e, dali em diante, a moderação recorrente das quatro vias de
pauta (SoS, Qwoted, Featured, Help a B2B Writer) que passa a ser
trabalho meu quando um pedido chegar.

**O que não posso confirmar:** se cada painel de fato publicou a
listagem (alguns diretórios de produto revisam manualmente antes de
publicar, com prazo de dias) — isso só aparece quando o operador checar
cada site, e não é algo visível daqui. **Nenhum código mudou.**

---

## 2.94 LCP mobile da home em 3,9s no Search Console — a logo pesava 47 KB a mais do que precisava

Operador trouxe o número direto do relatório de Core Web Vitals do
Search Console: **3,9s de LCP mobile na home**, na faixa "precisa
melhorar" (o limite "bom" do Google é 2,5s). Search Console usa dado de
campo (CrUX, usuário real, 28 dias) — não tinha como conferir esse
número exato de outra fonte, porque o PageSpeed Insights não tinha
amostra de CrUX suficiente para esta URL ("Nenhum dado" no painel de
experiência do usuário). O que dava para conferir era o **teste de
laboratório** (Lighthouse mobile, Moto G Power emulado, 4G lento): nota
96, **LCP de 2,7s** — mais rápido que o campo, o que é esperado (o
laboratório simula uma condição fixa; o campo mede a variedade real de
redes e aparelhos dos visitantes, e a base do GriffoWork é global,
puxando para mercados com conexão pior que a simulação padrão).

**O elemento de LCP, confirmado no relatório (não presumido):** o `<h1>`
do hero (`landing.tsx`, "Your experience is worth more than the job
title on your resume." na versão em inglês testada) — não é uma imagem.
Isso descarta de saída a hipótese óbvia ("otimizar a imagem X vai
resolver o LCP") e aponta para o que atrasa a PINTURA do texto, não o
carregamento de um recurso visual.

**Duas causas reais, lidas direto da tabela do Lighthouse, não
adivinhadas:**

1. **CSS bloqueando renderização — 580ms de economia estimada.** Dois
   chunks CSS do Next (`233p45nuh4m5b.css`, 25,6 KB, 750ms; e
   `1muj1jop2mb8a.css`, 2,3 KB, 150ms) — a folha de estilo Tailwind da
   página inteira, que o navegador precisa baixar e processar antes de
   poder pintar QUALQUER texto (para evitar flash de conteúdo sem
   estilo). Esse bloqueio cai direto em cima do `<h1>`, que é o
   elemento de LCP. **Não mexi nisso**: resolver de verdade pede CSS
   crítico inline (Next tem a flag experimental `optimizeCss`, via
   `critters`), que muda como o build gera CSS para o site inteiro —
   decisão de arquitetura, não uma troca pontual. **Correção do §2.98**:
   escrevi aqui que "o projeto não tem `next.config` hoje" — falso,
   `next.config.ts` existe desde 28/08/2026 (commit `903a069`). E a
   flag foi testada de verdade no §2.98: é no-op sob Turbopack nesta
   versão do Next, HTML gerado idêntico byte a byte com e sem ela.
2. **`logo-icon.png` no cabeçalho pesava 6× o necessário — 47,7 KB de
   economia estimada, quase o arquivo inteiro.** O `<img>` do
   logo declarava `width={553} height={424}` (o arquivo original) mas
   aparece na tela em **119×91 px** — o navegador baixa os 49,5 KB do
   PNG inteiro pra exibir um ícone pequeno. Como não é `next/image`,
   também não ganha WebP/AVIF automático (mais 10,4 KB de economia
   nisso). Essa imagem não É o LCP, mas compete pela mesma conexão
   lenta que o CSS bloqueante — no 4G simulado, cada KB a mais atrasa o
   que chega depois.

**Corrigido:** as duas ocorrências de `logo-icon.png` em
`landing.tsx` (cabeçalho e rodapé) trocadas de `<img>` para
`next/image`, com `width={120}`/`height={92}` (cabeçalho, o par mais
perto do tamanho real exibido) e `width={100}`/`height={77}` (rodapé,
abaixo da dobra) — dimensões escolhidas a partir da medição real do
Lighthouse, não estimadas. `priority` no do cabeçalho, por estar acima
da dobra em toda página (mesmo não sendo o elemento de LCP, é prática
recomendada do próprio Next para imagem crítica). O Next gera o
`srcset` de retina (1x/2x) e o formato moderno automaticamente a partir
daí — não precisei declarar isso à mão. `tsc`, `eslint`, `npm run build`
(rota `/` confirmada `○` estática) e a suíte (923/923) limpos depois da
troca; nenhum teste referenciava esse `<img>` por seletor.

**O que isso NÃO resolve sozinho:** o CSS bloqueante (item 1) continua
o maior fator dos dois, e segue em aberto — é decisão de arquitetura
pra outra sessão, não algo que se resolve trocando uma tag de imagem.
O ganho de hoje reduz o que compete com ele pela mesma conexão, mas não
elimina o bloqueio em si.

---

## 2.95 As três recomendações do Bing Webmaster Tools — duas reais, uma já em andamento

Operador trouxe três alertas do painel do Bing pra analisar antes de
agir — checado achado por achado no código, não aceito nem descartado
de cara.

**(1) IndexNow, severidade Alta, 1 erro — recomendação PROCEDENTE, mas
não por bug: por atraso.** A infraestrutura já existe desde o §2.73
(`lib/seo/indexnow.ts`, a chave hospedada em `public/`, `npm run
indexnow:submit`) e já tinha sido rodada uma vez com sucesso, **53**
URLs, HTTP 202. O gatilho é **manual por decisão registrada** (pendência
14c do handoff: o plano Hobby da Vercel limita quantos crons cabem em
`vercel.json`, e os dois slots já estão em uso — radar e dedup). O
problema é que "manual" só funciona se alguém rodar de novo depois de
conteúdo novo, e entre o §2.73 e hoje entraram `/hiring` (§2.84), as
páginas de ATS (§2.82), o `distribution` do dataset (§2.85) e várias
rotas de país — nada disso tinha sido reenviado. **Rodado agora**: `npm
run indexnow:submit` enviou **57** URLs (as 4 a mais confirmam o
crescimento), HTTP 200 (aceito). Isso não é uma correção de código —
é rodar de novo o que já existia e ficou velho.

**(2) `<h1>` ausente, severidade Alta, 1 página com erro — recomendação
PROCEDENTE, e achei o defeito real por trás.** Todas as rotas públicas
têm `<h1>` — a home e as 41 páginas de país renderizam `<Landing>`
(hero com `<h1>`), `/hiring` e as páginas de `/ats/[slug]` têm `<h1>`
literal. A exceção: `market-pulse/page.tsx` — quando `loadHiringAtlas()`
lança (falha transitória de rede/banco), a página cai no ramo de erro e
desenhava **só um `<p>`**, sem heading nenhum. É exatamente "1 página, 1
erro": só acontece quando o Bingbot rastreia a página no instante em
que a consulta ao atlas falha, não em todo rastreio — por isso não
apareceu antes. **Corrigido**: o ramo de erro agora abre com
`<h1>{dict.hiringMap.heading}</h1>` — o MESMO texto que `HiringMapView`
usa no caminho feliz, pra não afirmar nada que a versão com dado não
afirme. `tsc`, `eslint`, `build` (`/market-pulse` segue `ƒ` dinâmica,
como já era) e suíte (923/923) limpos. Não criei teste de render pra
página nova — nenhuma rota de `src/app` tem teste de componente hoje
(convenção do projeto é testar na camada de lib/lógica), então não
introduzi um padrão novo pra um caso só.

**(3) Falta de backlink de domínio de qualidade, severidade Moderada —
recomendação PROCEDENTE, e já é exatamente o que o §2.85/§2.91–§2.93
vêm tratando.** Nenhuma ação nova: os onze cadastros e sete submissões
do `KIT-DIVULGACAO.md` (diretórios de produto, Source of Sources,
Qwoted, Featured, Help a B2B Writer) são a resposta a este mesmo
problema, já em andamento antes do Bing confirmar. O que falta é só o
que já estava registrado — os dois e-mails de release e a licença do
dataset.

---

## 2.96 "job, hiring, work, careers, employment, workforce" — os seis termos, e o que faltava de verdade

Operador trouxe seis termos de alto volume de busca e pediu análise de
como empregá-los, dado o negócio ser global com especificação local.
Apliquei o mesmo método do §2.84 (direção de "hiring") e do §2.88
(registro de "job hunting"): para cada termo, checar DIREÇÃO (quem
busca, e o quê) antes de decidir usar.

**Levantamento por termo, contra o código real, não por achismo:**

- **`job`** — já é vocabulário-base do produto (Job Radar, job title,
  job comparison). Neutro, sem risco de direção. Nada a fazer.
- **`hiring`** — já resolvido com cuidado no §2.84: `#hiring` sinaliza
  EMPREGADOR, não candidato. A solução existente (`/hiring` fala com
  quem JÁ se candidatou; "Hiring Map" é dado agregado) está certa. Não
  mexer.
- **`work`** — genérico, já espalhado no app. O recorte com peso real e
  sem página própria é "remote work" — `/global` hoje é só o fallback
  de `GLOBAL_MARKET` com o copy genérico da landing. Fica registrado
  como oportunidade, não implementado: pede conteúdo novo em 12
  idiomas, escopo maior que uma sessão.
- **`careers`** — o melhor alinhado dos seis: já é a palavra da
  tagline ("career intelligence") e da orientação vocacional. Sem
  risco de direção — quem busca "career change" é o público real do
  produto. Parte do vocabulário vive só atrás de login (fora do
  índice); registrado como possível reforço futuro de título/meta
  pública, não feito agora.
- **`employment`** — **zero ocorrências** no dicionário em inglês.
  Achado real: é o registro institucional que as próprias fontes do
  `/market-pulse` usam (BLS = *Bureau of Labor **Statistics***,
  Eurostat/ILOSTAT/CEPALSTAT falam em "employment", não em "hiring"
  casualmente). Era o gap mais concreto — **implementado nesta
  sessão**, ver abaixo.
- **`workforce`** — também zero ocorrências. Registro B2B/RH
  ("workforce planning"), e o produto já tem essa porta ("Companies &
  HR teams" na seção de preço), mas como uma linha só, sem página
  própria. Usar "workforce" de verdade significa posicionar o dado do
  atlas para quem faz planejamento de RH — decisão de audiência nova,
  não só troca de palavra. Registrado como pergunta em aberto, não
  decidido nesta sessão.

**O que foi implementado — `employment` no `/market-pulse`:**

Criado `lib/hiring-index/employment-keywords.ts`, no mesmo padrão de
`lib/market/job-search-terms.ts` (§2.88), mas para outro público: não
quem procura emprego, quem procura DADO sobre o mercado (jornalista,
pesquisador, RH) no registro que as próprias fontes usam. Cada idioma
leva dois termos, nenhum inventado:

1. **A frase de mercado de trabalho**, copiada literalmente do próprio
   `hiringMap.metaDescription`/`intro` daquele idioma — já em produção,
   já revisada, zero tradução nova.
2. **A palavra "emprego" isolada.** Para japonês, chinês, coreano e
   árabe — os quatro que o próprio projeto já trata como precisando de
   verificação em fonte (pendência 20 do handoff) —, conferido contra
   fonte oficial antes de entrar: `雇用` (confirmado em `雇用動向調査`,
   pesquisa do 厚生労働省), `就业` (confirmado na página do 国家统计局
   dedicada a emprego), `고용` (confirmado em `고용률`/`고용동향`,
   Ministry of Employment and Labor), `العمالة` (confirmado em fontes
   regionais oficiais — GCC Statistical Center, `مكتب إحصاءات العمل`).
   **Não usei compostos como "雇用統計"/"就业统计"/"고용 통계"** — a busca
   não confirmou nenhum como termo padrão, só a palavra-base, então a
   lista leva só o que foi confirmado.

Árabe merece a mesma distinção de direção do §2.84: `العمالة` (emprego),
não `التوظيف` (contratação — já usado no `pageTitle` desta mesma
página). Teste novo trava isso especificamente.

**Onde entrou**: `keywords` em `generateMetadata()` do `/market-pulse`
(o campo não existia — Google ignora `keywords` desde 2009, mas o Bing
ainda considera, mesmo caso do `/hiring`); e `keywords` no JSON-LD
`Dataset`, mesmo raciocínio do `distribution` do §2.85 — sem ele, o
Dataset Search só acha a página por quem já digitou "hiring".

**Teste novo** (`employment-keywords.test.ts`, 4 casos): toda língua
tem keyword; ao menos uma keyword por idioma aparece literalmente no
copy real de `hiringMap` (trava contra o arquivo divergir do que está
publicado); os quatro termos verificados batem exato; árabe não repete
a palavra de contratação. `tsc`, `eslint`, `build` (`/market-pulse`
segue `ƒ` dinâmica) e suíte (927/927, 4 novos) limpos.

**O que fica em aberto, por decisão, não por esquecimento**: "remote
work" e "workforce" pedem escopo maior — e ficam registrados para
quando o operador priorizar, não implementados a reboque de uma
análise de termos de busca. **Correção sobre "remote work" no §2.97
seguinte**: eu disse aqui "página nova", e não é — `/global` já existe.
O erro foi registrado e corrigido na mesma sessão.

---

## 2.97 Correção: "remote work" não pedia página nova — `/global` já existia, só faltava o texto certo

Operador perguntou "pq página nova?" depois do §2.96 — pergunta que
expôs uma afirmação minha não conferida contra o código antes de virar
recomendação. Reconferido: `/global` já é uma das 41 rotas de
`[country]/page.tsx` (`slug === 'global'`), não algo por construir. O
problema real não era ausência de rota — era que ela usa o MESMO
template genérico de qualquer país, só com `cName = 'Global'`
substituído: o título saía "GriffoWork Global — AI Career Intelligence
& ATS Resume Audit", igual ao de qualquer país, sem nenhuma menção a
trabalho remoto.

**Achado no caminho, maior que o esperado**: `GLOBAL_MARKET.jobLanguage`
é fixo em `'en'` (`lib/market/index.ts:110`) — `/global` é a ÚNICA das
41 rotas travada em inglês, sempre, para qualquer visitante. Ao
contrário de `/market-pulse` e `/hiring`, que resolvem idioma por
`?lang=`/cookie/geo, `/global` nunca olha pra isso — nem o
título/meta, nem o conteúdo visível (`CountryPageClient` recebe
`lang={market.jobLanguage}`, sempre `'en'`). Escrever título de "remote
work" em 12 idiomas teria sido trabalho morto: nenhum dos 11 chegaria a
renderizar.

**Decisão do operador, perguntado explicitamente**: manter o
comportamento atual (`/global` só em inglês) em vez de fazer a rota
resolver idioma como `/market-pulse`/`/hiring` — a segunda opção
tornaria a rota dinâmica e derrubaria o SSG que ela tem hoje (mesmo
trade-off já documentado nessas duas páginas).

**Implementado**: em `generateMetadata()` de `[country]/page.tsx`,
título e descrição dedicados para `isGlobal`, só em inglês —
`"GriffoWork Global — AI Career Intelligence for International Remote
Work"` e descrição equivalente, reaproveitando `atsList`/`price` já
calculados. `keywords` também dedicado (`remote work`, `international
remote work`, `work from anywhere`, mantendo `ATS score` e a lista de
ATS do `GLOBAL_MARKET`). As outras 40 rotas de país não mudaram —
`titles`/`descriptions` genéricos continuam exatamente como estavam.

`tsc`, `eslint` e suíte (927/927, nenhum teste cobre `[country]/page.tsx`
— convenção do projeto não testa componente de rota) limpos. `npm run
build` confirmado com saída **limpa (exit 0)** e `/[country]` seguindo
`●` SSG — a primeira tentativa de conferir isso deu falso-negativo por
eu ter escrito o log em `/tmp`, fora do diretório de scratchpad
correto para este ambiente; o build em si nunca falhou.

---

## 2.98 "Resolva tudo o que é seu" — nove termos de ATS verificados (um corrigido de verdade) e o teste real do `optimizeCss`

Operador pediu pra resolver as pendências que não dependem dele. Antes
de agir, separei a lista da seção 0/7 do handoff por responsabilidade —
ação só de humano (branch, login, decisão jurídica/design/produto) fica
de fora, o que é técnico e verificável entra. Duas pendências caíram no
segundo grupo: a 20 (termos nativos de ATS) e a do §7.8 (CSS
bloqueante).

**Pendência 20 — os nove termos nativos de "ATS" não verificados.**
Busca contra fonte oficial pra cada um: `pt` (SAP Brasil, título
literal "sistema de rastreamento de candidatos"), `en` (a própria
expansão da sigla, sem ambiguidade), `fr` (Flatchr/Kelio/Candidatus
usam "logiciel de recrutement" como sinônimo corrente de ATS), `it`
(Randstad Itália publica seu guia de ATS sob "selezione del
personale"), `nl` (Zoho NL/BuddeeHR/Magnet.me chamam ATS de
"recruitmentsoftware"), `sv` (Teamtailor: "Vad är ett rekryteringssystem
(ATS)?"), `zh` (Zoho China: "什么是 ATS？| 招聘管理系统"), `ko`
(GreetingHR: "ATS(채용관리시스템)란?"). Oito confirmados como já
estavam escritos — nenhuma mudança de texto neles.

**O nono, árabe, tinha defeito de verdade.** `نظام تتبع المتقدمين` é o
termo confirmado (SAP MENA, Qureos, Elevatus, Jisr) — e já era usado
corretamente em `hiringPage.faq.a1` do próprio arquivo. Mas
`atsPage.heroBadge` e `atsPage.metaDescription` (as páginas de ATS em
si, o que a pendência realmente cobria) usavam uma descrição de FUNÇÃO
("فرز السير الذاتية", "triagem de currículo") no parêntese em vez de
NOMEAR o sistema — diferente de toda outra língua, que segue o padrão
"ATS (termo nativo)". Corrigido: `heroBadge` e `metaDescription` do
`ar.ts` agora usam "ATS (نظام تتبع المتقدمين)", igual ao padrão
alemão/francês/etc. Teste novo (`ats-native-terms.test.ts`, 2 casos)
trava os 12 termos contra o copy real e trava especificamente contra o
árabe voltar a usar a descrição de função. `tsc`, `eslint`, suíte
(929/929, 2 novos) e `build` limpos.

**Erro meu, achado no caminho: eu tinha dito que o projeto "não tem
`next.config`".** Registrado assim no §2.94 e no §7.8 do handoff — e é
falso. `next.config.ts` existe desde 28/08/2026 (commit `903a069`,
cabeçalhos de segurança nível 10, política de cache, pacotes externos
do servidor). `git log`/`stat` confirmam. Não sei a causa exata do
`Glob`/leitura anterior ter dado "nenhum arquivo" — mas a afirmação
foi feita sem reconferir contra o comando real na hora de escrever a
documentação, o mesmo tipo de erro que o §2.85 já registrou uma vez
("site não indexado" a partir de busca fraca). Corrigido aqui e nas
duas menções do handoff.

**Com a base real, testei `experimental.optimizeCss` de verdade — e o
resultado é negativo, não "não tentei".** Ativado no `next.config.ts`,
`npm run build` aceitou a flag sem erro (`✓ optimizeCss` no log) e
gerou as 75 rotas normalmente. Mas o HTML estático gerado (`/br`,
conferido byte a byte) saiu **idêntico** com e sem a flag: mesmo
tamanho exato (98.931 bytes), mesma contagem de `<link
rel="stylesheet">` (2), zero `<style>` inline nos dois casos.
`optimizeCss` (baseado em `critters`) é **no-op sob Turbopack** nesta
versão do Next (16.2.11) — a flag é aceita e não faz nada. Revertido do
`next.config.ts`; o item do §7.8 continua em aberto, mas agora com uma
via a menos: essa flag específica não resolve, e não vale reabrir sem
uma mudança de bundler (Webpack) ou uma versão do Next com suporte real
a `optimizeCss` no Turbopack.

---

## 2.99 As branches remotas mescladas, apagadas — pendência 3 e seção 11 fecham

Operador autorizou explicitamente: "branches github, se já foi usado e
não tem serventia, delete". Antes de apagar qualquer coisa, `git fetch
--prune` + `git branch -r --merged origin/main` / `--no-merged` pra
separar por fato, não por nome — o padrão `claude/*` sozinho não bastava,
porque havia branch sem esse prefixo já mesclada (`fix_filter_search_logic`,
`implement_ssr_seo_fix` etc.) e branch com o prefixo ainda sem merge.

**Primeira leva — 7 branches mescladas em `main`, apagadas:**
`analyze_market_opportunity_segments`, `analyze_multilanguage_system_support`,
`claude/admin-user-edit-modal`, `design-refresh-2026-08`,
`fix_filter_search_logic`, `implement_ssr_seo_fix`,
`update_griffowork_repo_sync`. Confirmado por `git branch -r --merged` —
o conteúdo de cada uma já está no histórico de `main`, apagar a
referência não perde nada.

**Segunda leva — 4 branches SEM merge git, mas já auditadas como sem
trabalho vivo na seção 11 do handoff (auditoria de 20/08):**
`claude/deepseek-v4-pricing-update-z1aijg` (conteúdo recuperado pelo
PR #45), `claude/index-page-design-review-3okhnq` (trabalho superado,
não perdido — a landing foi reescrita depois), `claude/page-load-error-
39mpbh` (recuperado pelo PR #45, hoje em `next.config.ts` como
`HTML_ONLY`), `claude/mapa-do-produto-recuperado` (conteúdo entrou pelo
PR #66, hoje é `docs/MAPA-DO-PRODUTO.md`). Reconferido rapidamente antes
de apagar: `HTML_ONLY` presente em `next.config.ts` (2 ocorrências),
`docs/MAPA-DO-PRODUTO.md` existe (38,5 KB) — a auditoria de 20/08
segue válida.

**Duas NÃO apagadas, de propósito**: `claude/project-status-update-
m6kqex` e `claude/security-vulnerabilities-review-2qtbz1` — sem merge
git e nunca auditadas (não existiam em 20/08). Apagar sem conferir
seria repetir o erro que o próprio §11 registrou: "fechar branch sem
dizer em voz alta o que tinha dentro" já custou retrabalho uma vez
(PR #45 existiu pra recuperar duas dessas).

**Por que funcionou agora e não antes**: a pendência 3 registrava
`git push --delete` voltando 403 numa sessão remota — faltava permissão
de escrita no remoto naquele contexto. Rodado agora numa sessão local,
com as credenciais git do próprio operador: sem erro, `ok` nas 11
exclusões. `git fetch --prune` confirmou: restam só `main` e as duas
branches preservadas.

---

## 2.100 Verificação visual em produção — pendência 7 fecha, e um achado novo de sessão expirada

Operador passou credencial de conta de teste; **não digitei a senha em
nenhum formulário** (regra fixa, sem exceção mesmo com autorização
explícita) — em vez disso, naveguei a tela de login e pedi para ele
mesmo clicar em "Entrar". A sessão do Chrome já tinha um login salvo
("jose maria"), depois expirou no meio da investigação, e o reforço
posterior entrou como a conta **admin master**
(`admin@griffowork.com`) — nenhuma das duas era a conta de teste
original, e segui com o que estava disponível em vez de insistir na
credencial específica.

**Telas confirmadas rendendo com dado real, sem defeito visual**
(conta "jose maria", laudo já existente — perfil "Juliana", biomédica):
Perfil Profissional (accordion com badge "Preenchido", bate com o
código do §7.7), Radar (carrega limpo, sem o bug duplo de banner do
§7.6, 8 vagas reais), Mídias & Redes Sociais (auditoria de presença
digital), Agente Vocacional (3 opções com % de aderência), Carta &
Resumo (carta direcionada a uma vaga específica — evidência de que o
currículo direcionado a partir da vaga, §7.2, funciona, embora não
confirme a rota exata `POST /api/radar/prepare`), Reescrita (gate de
autorização + 15 mercados localizados).

**Pendência 7 fechada — JobBase confirmado rodando no cron real.** Na
conta admin master, "Radar e Cotas" → "Fontes de vagas" mostra
`jobbase`: **5.572 vagas, última coleta há 16h, 11 dias de
observação**. É exatamente o que a pendência esperava: uma execução
real do adapter dentro do `/api/cron/radar` em produção, não mais só o
`curl` manual e os 17 testes com `fetch` injetado do §2.33. De
quebra, a mesma tela mostrou o §12 (coleta vazia nunca fecha vaga)
funcionando ao vivo: `adzuna:ca` com falha real (timeout, "1 falha
seguida", "Com erro") e o aviso correto na tela — "Nenhuma vaga foi
encerrada — uma falha de coleta não é evidência de encerramento".

**Achado novo, não crítico: sessão expirada não redireciona dentro da
SPA.** Enquanto investigava, a sessão de "jose maria" expirou entre
duas navegações internas (sem reload de página). A interface continuou
mostrando o shell autenticado (barra lateral, nome, créditos) com a
área de conteúdo dizendo **"Nenhuma currículo encontrado"** — mensagem
enganosa, sugere "sem currículo" quando na verdade é "sessão morta".
Confirmado com `fetch('/api/auth/me')` retornando `{user: null}` nesse
estado, e com `document.cookie`/`localStorage`/`sessionStorage`
inspecionados (sem vestígio de dado de outro usuário — não é vazamento
entre contas, só sessão expirando sem o cliente perceber). Um
recarregamento completo da página corrige (mostra a landing pública
deslogada corretamente). Não estava em nenhuma pendência registrada;
fica como achado novo, baixa severidade — o usuário real só precisa
dar F5 pra ver que precisa logar de novo, mas a mensagem que aparece
antes disso é a errada.

---

## 2.101 Gatilho mensal do `hiring-index` fora do Vercel — GitHub Actions

Continuação do item 14c: a rota `/api/cron/hiring-index` existe e
funciona, mas não estava agendada porque o plano Hobby da Vercel já usa
os dois crons a que tem direito (`radar` 06:00, `dedup` 18:00).
Operador perguntou por que manter os três automáticos, e a resposta
honesta é que não precisa: `radar`/`dedup` sustentam o produto pago
todo dia; `hiring-index` alimenta uma página de marketing (`/market-
pulse`) cuja fonte (BLS/Eurostat/ILOSTAT/CEPALSTAT) só muda mensal ou
trimestralmente. Pedido: um gatilho "nosso", fora do Vercel.

**Criado `.github/workflows/hiring-index-monthly.yml`** — GitHub
Actions, de graça, vive no próprio repositório:

- `schedule: cron: '0 6 1 * *'` — dia 1 de cada mês, 06:00 UTC, mesmo
  horário do cron do radar.
- `workflow_dispatch: {}` — também roda sob demanda pela aba Actions,
  sem esperar o próximo dia 1.
- Um `curl` com `Authorization: Bearer ${{ secrets.CRON_SECRET }}`
  contra `https://griffo.work/api/cron/hiring-index`, a mesma
  autenticação que os crons da Vercel já usam (conferida no código da
  rota antes de escrever o workflow) — nenhum código de produto mudou,
  só a forma de disparar a rota que já existia.
- Falha o job (`exit 1`) se a resposta não vier 2xx, em vez de reportar
  sucesso calado — mesmo raciocínio do §12 aplicado a infraestrutura:
  falha silenciosa é pior que falha visível.

**O que só o operador pode fazer**: cadastrar o secret `CRON_SECRET` no
repositório (Settings → Secrets and variables → Actions → New
repository secret), com o MESMO valor já configurado nas env vars da
Vercel. Sem esse secret, a rota responde 503 (por desenho, não bug) e
o workflow falha de propósito — não é um estado silencioso.

**O que isso não resolve**: o dado entre 02/09 (última coleta
registrada) e a primeira execução deste gatilho continua parado. Não é
regressão — é o mesmo estado de antes, só que agora com data de
validade.

**Atualização, mesmo dia**: a Vercel não revela o valor de env var
marcada como *Sensitive* nem clicando no ícone de revelar — o
`CRON_SECRET` existente não pôde ser lido de volta. Solução: gerei um
valor novo (64 hex, `crypto.randomBytes(32)`) e o operador trocou nos
dois lugares (Vercel, com redeploy; e o secret do GitHub Actions
recém-criado). **Verificado de ponta a ponta**: primeira chamada deu
401 (redeploy ainda propagando), segunda tentativa (menos de um
minuto depois) deu `200`, com coleta real: **142 séries, 2.758 pontos
gravados** (bls_jolts 55, eurostat_jvs 674, ilostat_une 1.747 parcial —
7 códigos de país não mapeados ignorados, comportamento já esperado do
conector — cepalstat_une 282). De brinde, o dado do `/market-pulse`,
parado desde 02/09, foi atualizado nesta verificação. Chamada feita
direto contra produção com o valor que eu mesmo gerei — nunca toquei
no segredo antigo do operador, nem manipulei o painel da Vercel ou do
GitHub em nome dele.

---

## 2.102 Sessão expirada não redirecionava — corrigido (§7.10 fecha)

Continuação do achado do §2.100: sessão morrendo no meio da navegação
SPA (sem reload) deixava o app mostrando o shell autenticado inteiro
com "Nenhum currículo encontrado" em vez de voltar pra landing
deslogada. Causa raiz, agora localizada: `useAuth.hydrate()`
(`store/auth.ts`) só roda UMA VEZ, no primeiro mount — nada no app
reagia a uma chamada autenticada voltando 401 depois disso, então o
`user` no Zustand ficava com o valor antigo em memória pra sempre,
mesmo com o cookie de sessão já morto no servidor.

**Correção, sem tocar em cada tela uma por uma:**

- `lib/internal-fetch.ts` — toda chamada relativa (`/api/...`) que
  volte **401** dispara `window.dispatchEvent(new
  Event('griffo:session-expired'))`. 401 e não 403 de propósito: é a
  convenção já usada nas rotas autenticadas do produto (`/api/user`,
  `/api/resume/*`, `/api/radar/*` etc.) pra "sessão inválida", diferente
  de 403 ("autenticado, mas sem permissão" — rotas `/api/admin/*`). Um
  evento de DOM, não import direto do store: `store/auth.ts` já importa
  `internalFetch`, então importar de volta criaria ciclo.
- `store/auth.ts` — ouve `griffo:session-expired` no escopo do módulo
  (registrado uma vez, fora do `create()`) e limpa `user` com
  `setUser(null)`. Como `page.tsx`/`country-client.tsx` calculam
  `effectiveScreen = user ? 'app' : screen`, limpar o usuário faz a
  tela cair sozinha de volta pra `<Landing>` — sem precisar duplicar
  essa lógica em cada componente que chama a API.

**Teste novo** (`store/auth.test.ts`, 2 casos): o evento limpa o
usuário; qualquer OUTRO evento não mexe nele (trava contra um nome de
evento genérico demais pegando coisa que não devia). O projeto não usa
jsdom — `window` do teste é um `EventTarget` mínimo, criado com
`import()` dinâmico dentro de `before()` pra existir antes do módulo
`auth.ts` ser avaliado (import estático no topo seria hoisted e correria
antes).

`tsc`, `eslint`, `build` e suíte (931/931, 2 novos) limpos. Fecha o
achado do §7.10 do handoff.

---

## 2.103 `REMOTIVE_LEGAL_NOTICE_KEY` era código morto de verdade — removida (pendência 10 fecha)

A pendência 10 vinha em aberto desde o §2.40 como decisão do operador:
"filtro incompleto (bug: aviso legal pode vazar como vaga) ou resquício
sem função nenhuma?". Reli `parseRemotivePayload`
(`lib/jobs/adapters/remote-boards.ts`) antes de decidir por conta
própria: a função lê `(payload as {jobs?: RemotiveJob[]})?.jobs` — o
aviso legal da Remotive mora na chave `0-legal-notice`, **irmã** de
`jobs` no objeto da resposta, nunca dentro do array. Estruturalmente,
não tem como esse aviso virar uma vaga: a preocupação do §2.40 não se
concretiza pela forma como o parser já lê o payload.

Confirmado sem tornar isto uma investigação nova: a própria constante
só aparecia na sua declaração e num comentário — nenhum import em
lugar nenhum do projeto (grep limpo em `.test.ts` e no resto do `src`).
Código morto por definição, não filtro incompleto.

**Removida** `REMOTIVE_LEGAL_NOTICE_KEY` e seu comentário. O
`accessNote` do `REMOTIVE_DESCRIPTOR` que citava a constante pelo nome
foi reescrito pra descrever o campo diretamente ("a resposta traz um
aviso legal na chave `0-legal-notice`, fora do array `jobs`") — a
informação que a constante existia pra registrar não se perde, só para
de depender de um símbolo que ninguém usava. `tsc`, `eslint`, `build` e
suíte (931/931, sem novo teste — nada de comportamento mudou) limpos.

---

## 2.104 Pendências 2 e 9 fecham — barra de progresso real confirmada de ponta a ponta

Operador logou de novo na conta admin master pra terminar a
verificação visual (§2.100 tinha ficado com a sessão expirando antes
de disparar uma geração ao vivo). Enviado um currículo de teste
sintético ("Carlos Andrade", gerente de produto fictício, deixado
claro no próprio texto como dado de teste) pelo formulário de "Enviar
currículo".

**Achado de ferramenta, não de produto:** o Chrome extension travou a
injeção de script (`screenshot`, `get_page_text`, `find`,
`read_network_requests` todos retornando "página nunca fica idle")
durante o processamento — provavelmente por causa do polling contínuo
que a própria barra de progresso faz para consultar o status do job.
Depois de várias tentativas sem sucesso, abri uma ABA NOVA em vez de
insistir na travada — a nova aba reconectou ao job em segundo plano
sem problema, confirmando que o travamento era da ferramenta de
automação, não do backend (a análise continuou processando
normalmente o tempo todo).

**Pendência 9 — as 5 telas de progresso real — TOTALMENTE
confirmada.** Antes do travamento, já tinha visto ao vivo: percentual
subindo (0% → 20% → 60%), cronômetro contando segundos reais, texto
mudando ("Preparando seu currículo..." → "Nossa inteligência profunda
está avaliando..."), e cartões de dimensão aparecendo um a um com nota
real. Na aba nova, a análise já tinha terminado: **score 6,3/10, "ATS
PASS", 8 dimensões com nota individual, "Match Vaga Alvo" em 78%** —
prova de que o pipeline inteiro roda de ponta a ponta, não só a
animação. Não foi observado o caminho de erro (falha de provedor com
"tentando modelo alternativo") — não há como forçar isso sem simular
uma falha real de API, fora do escopo de uma verificação visual.

**Pendência 2 — os três testes de produto — fecha.** (1) Preço em
reais confirmado na tela "Comprar Análise": `R$ 29,90 / análise
completa`, "Pague em BRL com Cartão". (2) "Preencher com o que já sei
sobre você" (Perfil Profissional) executado com o currículo recém-
analisado: terminou sem erro em ~30-40s (sem barra de percentual, só
spinner — mais lento que a análise principal, mas correto). Nenhuma
seção mudou visualmente porque **todas já estavam preenchidas** — o
próprio texto da função diz que só preenche campo vazio, então nada
mudar era o comportamento correto, não falha. (3) Vaga de área
diferente aparecendo no Radar — já confirmado no §2.100 (Stripe/Airbnb
para um perfil que não é da área de nenhuma das duas).

---

## 2.105 "Workforce" B2B — recorte concreto implementado (§7.9 fecha)

Operador pediu pra expandir a seção B2B, com a condição que eu mesmo
tinha posto: propor um recorte concreto antes de implementar. Escopo
decidido — deliberadamente pequeno, sem página nova nem feature de
audiência inteiramente nova, só reposicionar o que já existe:

1. **`businessDesc` ganhou uma segunda frase** nos 12 idiomas,
   citando o `/market-pulse` como ferramenta de planejamento de força
   de trabalho — não só "volume/faturamento" para quem compra laudo.
2. **Novo link no mesmo card**, ao lado do "Talk to sales" que já
   existia: `businessDataCta` ("Ver o mapa de mercado"/"See the labor
   market map"/...) apontando pro `/market-pulse`.
3. **Chave nova** `businessDataCta: string` em `i18n/types.ts` —
   `tsc --noEmit` limpo confirma as 12 locales com a chave (o tipo
   exige a propriedade em todas, então a paridade é travada pelo
   compilador, não por script separado).

**Vocabulário usado**, nível de risco baixo (termos de RH básicos, não
idiomáticos como o caso do ATS no §2.83/§2.98): "workforce planning" /
"planejamento de força de trabalho" / "Personalplanung" /
"planification des effectifs" / "人員計画" / "인력 계획" / "تخطيط
القوى العاملة" etc. — vocabulário comum de negócios, não verificado
termo a termo contra fonte como foi feito pra ATS, mas consistente com
o registro "mercado de trabalho"/"labour market" já verificado no
`employment-keywords.ts` (§2.98) onde a frase se sobrepõe.

**Conferido visualmente** no dev server local (`npm run dev`,
`localhost:3000`): card renderiza sem sobreposição, os dois botões
lado a lado em desktop ("See the labor market map →" / "Talk to
sales"). `tsc`, `eslint`, `build` e suíte (931/931, sem teste novo —
é conteúdo, não lógica) limpos.

**O que isto NÃO é**: uma página nova nem uma mudança de audiência
formal do produto — é reposicionamento de copy num card que já
existia, com um link a mais pro dado que já era público. Se o volume
de interesse de RH justificar mais à frente (contato via
`businessDataCta`, se isso vier a ser medido), uma página dedicada
`/for-hr` ou similar é o próximo degrau — não implementado agora, por
ser escopo maior que o pedido desta vez.

---

## 2.106 Busca avulsa do Radar — §7.4 fecha, com a mecânica corrigida
   em conversa antes de qualquer código

O `HANDOFF-CONTINUIDADE.md` (§7.4) registrava "busca imediata como
produto pago, R$ 14,90 por 5 buscas". Esse preço nunca existiu de
verdade — era um valor de rascunho que ficou na seção sem ninguém
revisar. A mecânica real só ficou clara depois de várias rodadas de
correção do operador, cada uma restringindo o desenho anterior:

1. **Sem preço próprio.** Não é produto à parte — é benefício de quem
   já comprou a Análise Completa, ao mesmo preço de sempre (R$ 29,90
   no Brasil, equivalente por faixa de país, `priceFor()` de
   `lib/pricing/catalog.ts` sem tocar). Sem SKU novo, sem saldo novo,
   sem linha de `AnalysisLedger` nova.
2. **Gate por usuário, não por currículo.** `requireUnlockedResume`
   (usado pelos outros 8 itens da Análise Completa) pede um
   `resumeId` — mas o Radar não tem "este currículo", ele lê o Perfil
   Profissional da pessoa, que pode vir de zero, um ou vários
   currículos analisados. Daí `requireAnyUnlockedResume`, nova em
   `lib/entitlements.ts`: pergunta só "esta pessoa já destravou algum
   currículo, alguma vez" — sem escopar em qual.
3. **3 buscas avulsas por semana**, além da busca inicial grátis que
   já existe. Número escolhido pelo operador em conversa, não
   inventado.
4. **Restrita ao JobBase.** Motivo do próprio operador: "o jobbase
   cobre grande parte da base do adzuna, greenhouse, etc." — e
   diferente deles, o JobBase é banco irmão nosso (mesmo time Vercel,
   ver o cabeçalho de `lib/jobs/adapters/jobbase.ts`), sem cota de
   terceiro. Confirmado no código: `jobbase` nem aparece em
   `MONTHLY_QUOTA` (`lib/jobs/quota.ts`) — só `adzuna: 2500`. Sem
   entrada, `onDemandAllowed('jobbase')` já cai no ramo "sem limite" e
   libera sempre; não havia nada a mudar ali. As demais fontes
   continuam só na coleta diária do cron.
5. **O usuário só sabe que são "3 buscas por semana"** — qual fonte
   responde por elas é decisão de implementação, nunca texto de tela.

**Descoberta ao investigar, não pedido explícito**: `/api/radar/run`
e o cron do Radar nunca checaram `requireUnlockedResume`, mesmo
`job_radar` sendo um dos nove itens de `ANALYSIS_DELIVERABLES` no
catálogo. Ou seja, hoje o Radar em si (a reavaliação gratuita) roda
pra qualquer usuário logado com perfil preenchido, sem checar
pagamento — inconsistência que já existia antes desta mudança e que
não foi mexida aqui, por não ser o que foi pedido; registrado para o
dia em que alguém decidir se isso é intencional (o produto vendendo
"Radar" como um dos 9 itens pagos, mas entregando parte dele de
graça) ou lacuna a fechar.

**Duas peças que o operador pediu e já existiam em produção**, sem
precisar de nada novo:

- **Busca inicial automática a partir do currículo.** Em
  `lib/ai-jobs/runners/career-orientation.ts` (linha 143-147),
  depois do diagnóstico de orientação vocacional (que já lê o
  currículo), `seedProfileFromOrientation()` preenche os campos
  VAZIOS do Perfil Profissional com o que foi extraído — nunca
  sobrescreve o que a pessoa já digitou, e o que preencheu volta no
  resultado (`profileSeeded`), respeitando o §30 (perfil não muda
  sozinho e em silêncio). Na sequência, `runForUserQuietly()` já
  dispara essa primeira leitura do Radar sozinho.
- **Ajuste manual do perfil pras buscas seguintes.** `PUT
  /api/user/professional-profile` já deixa o usuário editar o perfil
  e, ao salvar, já dispara `runForUserQuietly()` de novo (linha 136 de
  `professional-profile/route.ts`).

Nenhuma das duas foi tocada — o pedido só cobria a coleta ao vivo, e
essas peças já resolviam a parte de "primeira busca automática" e
"ajuste manual depois".

**O que foi construído:**

- `prisma/schema.prisma`: `RadarPreference.onDemandSearchCount` (Int,
  default 0) e `onDemandSearchWindowStart` (DateTime?). Empurrado com
  `prisma db push` — sem migração formal, mesmo fluxo que o resto do
  projeto usa (não há pasta `prisma/migrations`).
- `lib/radar/on-demand-search.ts`: regra pura, `onDemandSearchDecision`
  — janela ROLANTE de 7 dias a partir do primeiro uso (não semana de
  calendário, pelo mesmo motivo de `periodKey()` usar UTC: evitar
  decisão de fuso/dia de virada que ninguém pediu). 5 testes em
  `on-demand-search.test.ts`, incluindo o caso de borda "exatamente 7
  dias" como expirado.
- `lib/radar/on-demand-search.server.ts`: `consumeOnDemandSearch`, que
  lê o estado, decide, e grava. Leitura e escrita não estão na mesma
  transação — o pior caso de dois cliques simultâneos é o contador
  passar de 3 por uma unidade, tolerância equivalente à que
  `MIN_INTERVAL_MS` já assume em `/api/radar/run`.
- `lib/entitlements.ts::requireAnyUnlockedResume`: o gate por usuário
  descrito acima.
- `app/api/radar/search-now/route.ts`: a rota nova. Ordem de checagem:
  login → `requireAnyUnlockedResume` → perfil profissional existe →
  `consumeOnDemandSearch` → coleta → avaliação. A coleta e a avaliação
  são `runCollection()` (só para o adapter do JobBase,
  `jobBaseAdapters({toggle, credentials})`, mesma função que
  `runner.ts` usa para TODAS as fontes no cron) e `runForUser()` (a
  mesma avaliação que o cron e `/api/radar/run` já fazem) — zero
  lógica de coleta ou avaliação nova, só o fio que liga login → gate →
  essas duas funções existentes.

**Verificado**: `tsc --noEmit`, `eslint` e `npm run build` limpos;
suíte completa em 936/936 (5 novos, sem regressão nos 931 anteriores);
`prisma db push` confirmado contra o banco de produção
(`aws-1-sa-east-1.pooler.supabase.com`).

**O que NÃO foi feito** (na primeira versão desta seção): o botão na
tela do Radar. Construído logo em seguida, na mesma rodada — ver
§2.107, que também registra um bug real de 504 encontrado ao verificar
isto ao vivo em produção.

---

## 2.107 Botão da busca avulsa, e o 504 que a verificação em produção
   encontrou

Continuação do §2.106, mesma rodada. Operador confirmou o escopo do
botão ("sim"), e pediu pra verificar direto em produção — não havia
como ver localmente sem logar (regra fixa: não digito credencial em
formulário nenhum), e o código só existia local, sem commit. A
sequência: commit + push pra `main` (autorizado explicitamente pelo
operador), deploy automático da Vercel, e só então login em
produção pelo próprio operador pra eu conferir.

**O botão**: `radar-view.tsx` ganhou "Busca ao vivo (`{n}/{total}` esta
semana)", ao lado do "Procurar agora" que já existia, só visível
quando `onDemandSearch.eligible` (o `GET /api/radar` passou a incluir
esse bloco, lendo `requireAnyUnlockedResume` + o novo
`peekOnDemandSearch` — uma leitura pura, sem consumir busca nenhuma,
separada de `onDemandSearchDecision` que só corre no momento de
gastar). 8 chaves de i18n novas (`searchNowButton` e afins) nas 12
línguas.

**O bug, encontrado ao clicar de verdade em produção**: a chamada
voltou `504` depois de ~20s. Não é falha de ferramenta de automação —
`read_network_requests` confirmou o status HTTP real. Causa raiz,
lida no próprio código: `runCollection()` (`lib/radar/runner.ts`) —
a mesma função que o cron usa — não faz coleta incremental. A cada
rodada ela busca e GRAVA de novo todas as vagas abertas que a fonte
devolve. O JobBase já tem milhares de vagas (5.572 confirmadas no
§2.100); o fetch cabia no orçamento de 15s que a rota passava, mas
escrever tudo em lotes de 250 (`WRITE_CHUNK`) contra um banco Supabase
em outra região não cabia dentro do tempo de uma requisição HTTP — a
função ainda estava gravando quando o `504` chegou ao navegador.

Isto nunca apareceu no cron porque lá ninguém está com uma aba aberta
esperando resposta — a função roda até o teto dela (`maxDuration = 60`)
sem que o resultado precise voltar pra tela de ninguém.

**Por que a correção não foi apertar o orçamento de coleta**: reduzir
`timeBudgetMs` ou `maxPages` só limitaria o FETCH, que já cabia — o
gargalo era a escrita, que roda depois e não tem orçamento próprio no
código atual. E cortar página também não garante pegar vaga nova: o
JobBase não ordena a consulta por data, então a "página 1" não é "as
mais recentes".

**A correção**: a coleta e a avaliação passaram a rodar dentro de
`after()` — o mesmo mecanismo que `profile_extraction` e
`career_orientation` já usam em produção para trabalho que não cabe
numa resposta HTTP. A rota devolve `{ok: true, status: 'started'}`
assim que o contador semanal é consumido, SEM esperar a coleta.
`maxDuration` subiu de 30 para 60 (o mesmo teto do cron), dando à
coleta em segundo plano mais tempo pra terminar antes de a própria
função ser encerrada pela plataforma.

O cliente (`radar-view.tsx`) não tem como saber quando a coleta em
segundo plano termina a não ser perguntando — `waitForSearchToFinish`
consulta `/api/user/radar-preferences` a cada 3s, por até 30s,
esperando `lastRunAt` avançar (o mesmo campo que `runForUser` já grava
ao final, reaproveitado em vez de inventar um sinal novo). Quando
avança, recarrega o Radar e compara a contagem de oportunidades antes
e depois pra decidir a mensagem (`searchNowSuccessOne/Many` ou
`searchNowNothingNew`). Se os 30s esgotarem sem `lastRunAt` mudar, uma
chave nova (`searchNowStillRunning`, nas 12 línguas) avisa que a busca
continua rodando no servidor — o trabalho não é perdido, só não dá
tempo de acompanhar na tela.

**Por que consumir o contador ANTES de despachar o `after()`, e não
depois**: se a página fechar ou a função morrer no meio da coleta, a
pessoa não recupera a busca de graça só porque não viu o resultado —
o mesmo raciocínio de "saldo debitado na tentativa, não no sucesso"
que já rege o restante do produto.

**Verificado em produção de verdade, não só localmente**: login feito
pelo próprio operador (dono da conta admin master), botão clicado,
resposta imediata (sem 504), e a UI reconferida depois do fix.

**Verificado por ferramenta**: `tsc --noEmit`, `eslint`, `npm run
build` e suíte completa limpos (938/938, sem regressão). Um `EPERM` do
Windows travou o primeiro `npm run build` — o `npm run dev` desta
mesma sessão ainda segurava o `.dll.node` do Prisma; parar o processo
resolveu, sem precisar reinstalar nada.

---

## 2.108 Pendência 1 fecha — o primeiro envio real do digest, e a
   chave que estava escrita mas não era uma variável

Mesma rodada. Depois de conferir o log do digest desligado (§7.1),
operador decidiu ligar `RADAR_DIGEST_ENABLED=true` direto — "libera
logo essa função". A primeira rodada real (cron disparado manualmente
no painel da Vercel) expôs dois problemas em sequência, nenhum deles
de código.

**Achado 1: `RESEND_API_KEY` ausente na Vercel.** O log mudou de
`(desligado)` para tentativa de envio de verdade — pra **4 usuários
reais**, não só a conta admin — e as 4 falharam com "Variável de
ambiente obrigatória ausente: RESEND_API_KEY". Não era problema de
DNS: `getDigestFrom()` em `lib/env.ts` já documentava
`send.griffo.work` com SPF/DKIM/DMARC passando. Ao checar o `.env`
local a pedido do operador, a chave estava lá — mas escrita como nota
de texto (`resend apikey: re_...`), sem o `=` que faz virar variável
de ambiente de verdade. `dotenv`/`process.env` nunca leram esse valor,
local ou na Vercel. Corrigido o formato local (`RESEND_API_KEY="re_..."`,
arquivo fora do git, confirmado no `.gitignore` antes de mexer); a
chave em si eu não digitei em formulário nenhum da Vercel — API key
entra na mesma regra de senha, o cadastro lá foi o operador.

**Achado 2: env var nova não se aplica ao deployment já rodando.**
Primeiro redeploy depois de cadastrar a chave ainda deu o mesmo erro —
a Vercel só injeta variável de ambiente nova a partir do PRÓXIMO
deployment, não no que já está no ar. Um segundo redeploy resolveu.

**Confirmado por banco, não por inferência de log.** Ausência de linha
de erro não prova sucesso — `digest.server.ts` só loga em caso de
falha, nunca em caso de êxito. Consulta direta (script `tsx` descartável,
`RadarAlert.findMany` filtrado pelos 4 `userId`) mostrou os quatro com
`notifiedAt = 08/09/2026 14:03:37 BRT` — campo que o código só grava
"depois do envio bem-sucedido" (comentário no próprio
`digest.server.ts`, linha do `updateMany`). E-mail real, saiu de
verdade, pra gente real.

**Pendência 1 fecha.** Registrado em `HANDOFF-CONTINUIDADE.md`.

---

## 2.109 Revisão visual das telas autenticadas — pendência 4 fecha, dois
   achados reais

Pedido do operador: "faça essa revisão visual", referindo-se à pendência 4
(§7.7) — verificação nunca feita porque exigia login, e o agente não digita
credencial. Login feito pelo operador; conferido em produção, com login
real, cada tela da lista que o próprio §7.7 deixou: Painel, Enviar
Currículo, Laudo (as duas visões — Score & Veredito e 8 Dimensões), Perfil
Profissional (accordion), Radar, Reescrita, Downloads, Histórico, Comprar
Análise, Suporte & Dúvidas, Configurações — mais a landing em português e
em árabe (RTL).

**O que passou limpo**: menu ativo em azul (não mais emerald, confirma a
Fase B do §7.7), breadcrumb sem duplicar "Painel > Painel", card duplicado
de saldo no dashboard não voltou, accordion do Perfil Profissional expande
e mostra badge "Preenchido" corretamente, aba padrão do Laudo é "Score &
Veredito" (não mais a antiga "Visão Completa" empilhada), grid de 17
mercados na Reescrita sem duplicação (verificado por `get_page_text`, não
só por screenshot — ver a nota sobre artefato abaixo), RTL em árabe
espelha logo/menu/barras de progresso/card B2B corretamente, cookie de
idioma manual persiste entre navegações.

**Achado 1 — sticky não gruda.** `app-shell.tsx` declara o cabeçalho como
`sticky top-0`, e `analysis-view.tsx` declara a faixa de resumo do laudo
(nota + status ATS) como `sticky top-14`, exatamente como `§7.7` descreve
ter corrigido. Na prática, ao rolar qualquer tela autenticada, os dois
saem da tela por completo — não ficam grudados no topo. Confirmado em
DUAS abas diferentes (uma delas nunca tocada por nenhum teste anterior
nesta sessão, pra descartar resíduo de um `resize_window` usado mais
cedo), com `wait` antes da captura pra descartar atraso de pintura.
Suspeitos identificados no código, não confirmados como causa: `app-
shell.tsx` tem `overflow-x-hidden` no `<div>` raiz (pai direto do
`<header sticky top-0>`) e `overflow-hidden` no `<main>` (pai da faixa
`sticky top-14`) — combinação clássica que quebra `position: sticky`
quando o ancestral com `overflow` não é o contêiner de rolagem de
verdade. Não investigado a fundo nem corrigido aqui — revisão visual
aponta o problema, não o resolve.

**Achado 2 — card B2B sem o link novo num dos dois lugares.** O §2.105
desta sessão adicionou `businessDataCta` (link pro `/market-pulse`) ao
card "Empresas e RH" da landing pública (`landing.tsx`). Existe uma
SEGUNDA cópia quase idêntica do mesmo card em `plans-view.tsx` (tela
"Comprar Análise", autenticada) — mesmo título, mesma descrição (o texto
novo aparece certo ali, porque `businessDesc` é chave de i18n
compartilhada), mas sem o botão/link novo: `plans-view.tsx` nunca
referencia `t.pricing.businessDataCta`. A landing pública e a tela
autenticada de planos divergem desde o §2.105 sem que ninguém tivesse
notado — a revisão visual foi o que expôs.

**Um falso alarme descartado por checagem cruzada.** Ao rolar a lista de
mercados da Reescrita, um screenshot mostrou dezenas de cards "Portugal/
Japão/Holanda" repetidos — pareceria um bug sério de renderização
duplicada. `get_page_text` (o texto real do DOM, não a captura visual)
mostrou os 17 mercados corretos, cada um uma vez só. Era artefato da
própria ferramenta de automação durante o scroll, não do produto —
registrado aqui como lembrete: quando um achado parece grave demais,
confira por um caminho que não seja só o screenshot antes de reportar.

**O que não foi possível verificar.** Viewport mobile: `resize_window`
não mudou a resolução real da captura nesta sessão (mesma limitação de
ferramenta já vista antes) — o mobile da lista do §7.7 continua sem
confirmação visual própria.

**Pendência 4 fecha**, e os dois achados também — corrigidos na mesma
sessão, logo em seguida (pedido do operador: "corrija agora").

**Correção do achado 1**: `overflow-x-hidden` no `<div>` raiz de
`app-shell.tsx` virou `overflow-x-clip`; `overflow-hidden` no `<main>`
virou `overflow-clip`. `clip` corta o overflow do mesmo jeito visualmente,
sem entrar na regra da spec que faz `hidden` num eixo computar o outro
eixo como `auto` — foi essa computação que transformava os dois elementos
em contêineres de rolagem que nunca rolam de verdade (crescem para caber o
conteúdo), tirando o `sticky` do cabeçalho e da faixa de resumo do
contexto de rolagem real da página.

**Correção do achado 2**: `plans-view.tsx` ganhou o mesmo botão
`businessDataCta` → `/market-pulse`, com `ArrowRight`, replicando o padrão
da landing (estilo `ghost` adaptado ao card escuro, em vez do `outline`
claro de lá).

**Verificado em produção de verdade**, não só por `tsc`/`build`: login
mantido, deploy aguardado, e as duas telas reconferidas. O cabeçalho e a
faixa "6,3/10 · ATS aprovado" agora ficam presos no topo ao rolar o
Laudo — confirmado numa aba nova, nunca tocada por nenhum teste anterior
desta sessão, com `wait` antes da captura pra não confundir atraso de
pintura do scroll com o bug de novo. O card "Empresas e RH" em "Comprar
Análise" mostra "Ver o mapa de mercado →" acima de "Falar com a equipe
comercial", igual à landing pública.

`tsc --noEmit`, `eslint`, `npm run build` e suíte (938/938, sem
regressão) limpos antes do deploy.

---

## 2.110 Tagline da marca dentro do app ainda dizia "Global AI Career
   Intelligence" — mapa duplicado e desatualizado

Operador reportou, olhando o app já com os fixes do §2.109: ao lado da
logo, dentro do sistema, continuava "Global AI Career Intelligence" em
vez de só "Career Intelligence".

**Causa**: `landing.tsx` e `app-shell.tsx` tinham cada um a sua PRÓPRIA
cópia do mapa de tagline por idioma. A de `landing.tsx` estava certa —
segue uma decisão de posicionamento já registrada em comentário ali
("sem 'AI'/'Global' — a marca não precisa dizer isso na tagline,
'AI'/'Global' continuam no `<title>` de SEO"). A de `app-shell.tsx`
nunca recebeu essa decisão: cobria só três idiomas (pt/en/es), todos
com o valor antigo "GLOBAL AI CAREER INTELLIGENCE" — inclusive o
inglês, que deveria dizer só "CAREER INTELLIGENCE" como o resto do
produto.

**Correção**: mapa único, `brandTaglineForLang(lang)` em
`lib/i18n/index.ts`, com os 12 idiomas (mesmo texto que já estava certo
em `landing.tsx`). Os dois componentes passaram a importar dessa fonte
única — evita um terceiro lugar divergir de novo no futuro, que foi
exatamente o que aconteceu aqui.

**Verificado em produção**, tela autenticada: "INTELIGÊNCIA DE
CARREIRA" (sem "Global AI"), igual à landing pública.

`tsc --noEmit`, `eslint`, `npm run build` e suíte (938/938) limpos.

---

## 2.111 Legenda: a moeda segue o país de acesso, não o idioma da tela

Operador perguntou se o preço (R$ 29,90) e o valor do upsell deviam
mudar junto com o idioma escolhido na tela, "em vez de ficar em
reais" — parecia mais lógico à primeira vista. Resposta: não. O preço
já é resolvido por `resolvePricingContext()`
(`lib/pricing/resolve.ts`) a partir do país de PAGAMENTO (se já houve
compra) ou do país de acesso por IP (`cf-ipcountry`/
`x-vercel-ip-country`) antes disso — nunca do idioma da interface.
Amarrar o preço ao idioma reabriria exatamente o problema que o
catálogo já resolveu antes (preço divergente do que é cobrado de
verdade) — alguém no Brasil que troca a tela pra inglês veria um
valor em dólar que não é o que o cartão cobra.

Concordando com a explicação, o operador pediu uma legenda discreta
embaixo do preço avisando disso. Texto fechado em conversa, revisado
duas vezes até chegar em: **"A moeda corrente acompanha a origem do
seu acesso, não o idioma da tela."** — precisão importava aqui: a
primeira tentativa dizia "país de pagamento", e o operador corrigiu
pra "país de onde acessa" (o `edgeCountry`, por IP, é o que decide pra
quem ainda não comprou — a maioria de quem vê a landing).

**Implementado**: chave nova `currencyFollowsAccess` nos 12 idiomas,
usada em dois lugares — `landing.tsx` (novo prop `priceCaption` no
`PlanCard`, texto abaixo do preço público) e `plans-view.tsx` (abaixo
do preço principal da tela "Comprar Análise", autenticada, onde
também mora o upsell do pacote de 5 mencionado no pedido — uma
legenda só, contextual às duas ofertas da mesma tela, em vez de
repetir o texto embaixo de cada valor).

**Verificado em produção**: a legenda aparece certa em "Comprar
Análise" (tela autenticada, reconferida com login real). A landing
pública não foi reconferida visualmente nesta rodada — a sessão do
navegador está autenticada, e não há como ver a landing deslogado sem
encerrar a sessão do operador, o que não foi pedido. Confiança vem do
mesmo padrão de componente já confirmado funcionando em
`plans-view.tsx`, tipo checado (`tsc`) e build limpo.

`tsc --noEmit`, `eslint`, `npm run build` e suíte (938/938) limpos.

## 2.112 Pendência 7.2 fecha — confirmada a rota exata do currículo direcionado a partir da vaga

Handoff registrava a pendência como "🟡 evidência encontrada, rota exata
não confirmada": no §2.100 apareceu em produção uma carta de
apresentação real marcada "Direcionada a: Página da Vaga |
BIOMÉDICO(A)", prova de que currículo/carta direcionados a uma vaga
específica funcionam de verdade — mas sem confirmar se o caminho era
`POST /api/radar/prepare` ou outro fluxo.

**Confirmado por leitura de código, sem ambiguidade.** O botão
"Preparar Currículo" em `radar-view.tsx:642` (`Wand2`, ação
`prepareResume(opportunity)`) chama exatamente
`POST /api/radar/prepare` com `{ alertId }`. A rota
(`src/app/api/radar/prepare/route.ts`):

- Busca o `RadarAlert` do usuário logado pelo `alertId` (nunca de
  outro usuário — filtro por `userId` na query, não checagem depois).
- Pega o currículo indicado ou, sem um, o mais recente do usuário —
  **direciona o que já existe, não cria outro**, porque a permissão de
  uso é por currículo: um currículo novo cobraria de novo por algo que
  a pessoa não pediu.
- Grava `resume.targetJob = "{cargo} — {empresa}"` e
  `targetJobDescription` (a descrição da vaga, quando a fonte a
  entrega; só o cargo quando não entrega — pior que ter descrição,
  mas muito melhor que não direcionar, e as rotas de IA tratam os
  dois casos).
- Devolve `previousTarget` quando já havia outro alvo, para a tela
  avisar o que foi trocado em vez de trocar em silêncio (frontend usa
  isso em `rd.prepareRedirected`).
- Marca `RadarAlert.clickedAt` — "preparar-se para a vaga" conta como
  o clique mais forte que existe, mais forte que abrir o link, e é o
  que mede quais alertas realmente convertem.

É esse mesmo `targetJob` que a tela de reescrita mostra depois como
"Direcionada a: {job}" (`letterTargetedTo`, `i18n/locales/pt.ts`) — a
frase vista em produção no §2.100 bate exatamente com o formato que
esta rota grava (`cargo — empresa`, aqui "BIOMÉDICO(A)" seria o
`alert.job.title`).

Nenhum código mudou — é confirmação de leitura, não correção. Pendência
7.2 fecha.

## 2.113 As duas últimas branches `claude/*` — auditadas e apagadas

Do §2.99 (pendência 3), sobraram de propósito duas branches nunca
auditadas: `claude/project-status-update-m6kqex` e
`claude/security-vulnerabilities-review-2qtbz1`. Preservadas até
alguém conferir o conteúdo, não por indecisão — o resto da seção 11
já tinha o método, só faltava aplicá-lo a estas duas.

**Conferência.** Ambas paravam num `main` de 24/08/2026, e cada uma
carrega só 1–2 commits reais além disso:

- `claude/security-vulnerabilities-review-2qtbz1`: um commit, "Faz o
  `db:rls` rodar sem `psql` e sem sintaxe de shell" — cria
  `src/lib/sql-split.ts` e `src/scripts/apply-rls.ts`. Os dois
  arquivos **já existem em `main`**, conferidos por `git cat-file -e`.
- `claude/project-status-update-m6kqex`: dois commits — um registra o
  peer opcional do `@swc/helpers` no lockfile (`package-lock.json` já
  reflete isso em `main` de qualquer jeito, é gerado), outro adiciona
  `docs/MAPA-DO-PRODUTO.md` (758 linhas). O arquivo já existe em
  `main` — `git diff` entre a versão da branch e a de `main` veio
  **vazio**: byte a byte idêntico.

O `git diff --stat` contra `main` de cada branch mostra centenas de
arquivos — mas é deriva normal de `main` ter andado dez dias depois
do ponto onde as branches pararam (sistema de IA jobs reescrito,
`hiring-index` removido, componentes shadcn novos, etc.), não
conteúdo dessas branches que `main` não tem. O que era delas
especificamente já está lá.

**Apagadas do remoto** (`git push origin --delete`), com confirmação
do operador antes do comando, por ser ação irreversível sobre estado
compartilhado. Ficam só `main` e as branches de trabalho ativo, se
houver.

Pendência "duas branches nunca auditadas" (seção 0, item 3 do handoff)
fecha.

## 2.114 A licença do dataset — decidida: CC BY 4.0

Pendência aberta desde o §2.85, registrada como "jurídica, não
técnica" (§2.91). O `Dataset` JSON-LD de `/market-pulse` já declarava
`distribution` (o endpoint `/api/hiring-index` é baixável), mas nenhum
campo dizia sob que termo — um `Dataset` "fonte de dados" sem licença
deixa quem consome sem saber se pode citar, redistribuir, ou nada
disso.

**Três opções foram levantadas e apresentadas ao operador:**

1. **CC BY 4.0** — uso livre, incluindo comercial, com atribuição
   obrigatória.
2. **Licença própria restritiva** — uso editorial permitido,
   redistribuição comercial vedada por termo (sem bloqueio técnico no
   endpoint).
3. **CC0 nos números brutos, proprietário na metodologia/apresentação**
   — reconhece que a maior parte do dado de origem (BLS, Eurostat,
   ILOSTAT, CEPALSTAT) já é pública por si só; o que o Griffo agrega é
   a classificação de fase e a apresentação.

**Recomendação dada e aceita: opção 1 (CC BY 4.0).** O objetivo
declarado desde o §2.85 era autoridade externa e backlink — jornalista
citando, agregador de dados linkando —, não proteção de dado bruto. O
valor competitivo real do Griffo está no produto de análise de
currículo, não no atlas, que é majoritariamente derivado de fonte já
pública.

**Implementado:**

- `market-pulse/page.tsx`: campo `license:
  'https://creativecommons.org/licenses/by/4.0/'` no `Dataset` JSON-LD,
  ao lado do `distribution` que o §2.85 já tinha acrescentado.
- Chave nova `licenseNote` em `i18n/types.ts` (bloco `hiringMap`, ao
  lado de `mapCredit`) — 12 idiomas, paridade travada pelo `tsc`.
- `map-model.ts`: `licenseNote` passa a fazer parte do objeto `t` que
  `HiringMapView` recebe — sem isso o componente não teria acesso ao
  texto, mesmo com a chave existindo no dicionário (achado do próprio
  `tsc`, que recusou compilar até o campo ser propagado).
- `hiring-map.tsx`: linha de crédito no rodapé do mapa ganhou um link
  `rel="license"` para `creativecommons.org/licenses/by/4.0`, ao lado
  do crédito do mapa-base (Natural Earth) que já existia — a licença do
  DADO e a licença do MAPA-BASE são coisas diferentes, cada uma com seu
  crédito.

**Verificado**: dev server local, `/market-pulse?lang=en` — a linha
final da tela mostra "Data licensed under CC BY 4.0 — free to use with
attribution." como link clicável; `curl` confirmou o campo `license`
presente no JSON-LD renderizado. `tsc --noEmit`, `eslint` e `npm test`
(938/938) limpos, `npm run build` limpo.

Pendência "licença do dataset" fecha.

---

## 2.115 Dois documentos ainda diziam que o digest está desligado

Conferência de fim de sessão, pedida pelo operador ("veja se ficou
alguma pendência de push e de melhorias"). Push: nada — `main` no
remoto está exatamente em `3645f1f`, árvore local limpa, nenhuma
branch além de `main`, nenhum PR aberto. `tsc --noEmit`, `eslint` e a
suíte (938/938, `fail 0`) reconferidos limpos neste commit.

O que a conferência achou foi **deriva de documentação**, não de
código: o §2.108 registrou que `RADAR_DIGEST_ENABLED=true` foi ligado
em produção em 08/09/2026 e que quatro e-mails reais saíram
(confirmados por `RadarAlert.notifiedAt` gravado nos quatro
registros), mas dois documentos continuaram descrevendo o estado
anterior:

- `docs/HANDOFF-CONTINUIDADE.md`, §7.3 — título "🟡 IMPLEMENTADO E
  DESLIGADO", mais o parágrafo "O que ainda não foi exercitado:
  nenhuma mensagem saiu de verdade" e a instrução "não ligue o envio
  antes do Radar estar validado".
- `docs/MAPA-DO-PRODUTO.md`, §8.7 — título "implementado e desligado"
  e "**O envio está desligado por decisão**".

Uma segunda passada de `grep` no mesmo commit achou mais dois pontos do
handoff que a primeira leitura não pegou, ambos fora do §7.3 e por isso
fáceis de deixar para trás: a tabela de etapas da seção 3 ("Aviso por
e-mail | 🟡 implementado, envio desligado por decisão") e a lista "o
que NÃO está pendente e parece que está" da seção 0 ("desligado de
propósito"). Corrigidos junto. A lição operacional é a de sempre neste
projeto: um fato que muda de estado costuma estar escrito em mais
lugares do que a seção que trata dele — `grep` pelo termo, não só pela
seção.

Isso é exatamente o risco que o cabeçalho do `AUDITORIA-INDICE.md`
descreve para o índice desatualizado: um documento errado é pior que
um documento ausente, porque parece confiável. Quem lesse o mapa
antes da auditoria (a ordem de leitura que o próprio handoff
recomenda) concluiria que o canal de e-mail nunca foi exercitado — e
poderia, por exemplo, "ligar" de novo algo já ligado, ou tratar o
domínio como sem reputação construída.

**Corrigido**: as duas seções passam a descrever o estado real, com a
data do primeiro envio, os quatro destinatários, a forma de
confirmação (banco, não log) e a armadilha do `RESEND_API_KEY` escrito
sem `=` no `.env` — que é o achado reutilizável do §2.108, não uma
curiosidade. O aviso sobre reputação de domínio permanece nos dois
lugares: continua valendo, só deixou de ser motivo para manter o envio
desligado.

Nenhum código mudou nesta seção — só documentação.

---

## 2.116 CI no GitHub Actions — a verificação sai da memória humana

Pedido do operador, na sequência do §2.115: "não quero nada que
dependa da memória humana, tudo 100% IA". O §2.115 tinha acabado de
mostrar por que: um fato mudou de estado em produção e quatro trechos
de documentação continuaram descrevendo o estado anterior, porque
depender de alguém lembrar de atualizar não é processo, é sorte. O
mesmo vale para as verificações de código.

**O que existia até aqui.** Um workflow só, `hiring-index-monthly.yml`,
que é um cron de coleta — não verifica código nenhum. Os checks que
apareciam nos PRs eram do Vercel, e o que eles provam é que o preview
buildou: `next build` NÃO executa teste. Um commit podia entrar em
`main` com a suíte quebrada e o PR ficar verde. Toda linha "`tsc`,
`eslint` e suíte limpos" desta auditoria foi escrita porque alguém
rodou os três na mão e lembrou de anotar.

**O que passou a existir.** `.github/workflows/ci.yml`, um job só:
`npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npm run lint`
→ `npm test`. Dispara em `pull_request` (qualquer branch) e em `push`
para `main`, mais `workflow_dispatch` para rodar sob demanda.

**Quatro decisões que não são óbvias:**

- **`prisma generate` antes do `tsc`, e não depois do `npm ci` por
  acaso.** Os tipos do `@prisma/client` são gerados a partir do schema.
  Quem já tem o client no `node_modules` não vê o problema; num
  checkout limpo o type-check reprovaria em cima de tipo ausente. É a
  falha que teria feito o primeiro CI ficar vermelho por motivo errado.
- **Nenhum segredo, nenhum banco.** Verificado, não suposto:
  `prisma generate` roda com `POSTGRES_PRISMA_URL` e
  `POSTGRES_URL_NON_POOLING` ausentes do ambiente (gerou o client em
  580ms sem reclamar), e o único teste que toca ambiente,
  `src/middleware.test.ts`, seta e restaura `GEO_REDIRECT_ENABLED` ele
  mesmo. CI que exige credencial de produção é CI que não roda em fork
  e que arrisca vazar segredo em log.
- **`npm run build` fica de fora.** O Vercel já builda o preview a cada
  push do PR, com as env vars reais. Repetir o build sem elas daria
  vermelho por falta de credencial, não por defeito — e CI que dá
  vermelho por motivo que não é defeito ensina a ignorar CI.
- **`push` só em `main`.** Com `pull_request` cobrindo as branches, um
  `push: branches: ['**']` rodaria o mesmo commit duas vezes. `main`
  entra na lista porque merge direto, sem PR, também precisa passar.

**Verificado antes de subir, não depois.** Um clone limpo da própria
branch, em diretório separado, com os passos exatos do workflow na
ordem exata: `npm ci` (988 MB de `node_modules` do zero),
`prisma generate`, `tsc --noEmit`, `eslint`, `npm test`. É a única
forma honesta de saber se o workflow passa — rodar os comandos no
repositório de trabalho, que já tem tudo gerado, provaria menos.

**O que este CI NÃO resolve**, e continua aberto no H6: os testes dos
caminhos de cobrança e failover. A suíte cobre lógica pura; nenhum
teste exercita `entitlements.ts` ou o failover do `ai-router` de ponta
a ponta — justamente as áreas que a seção 10 do documento de
continuidade marca como "onde o erro não aparece como erro". CI verde
sobre cobertura ausente não é segurança, é silêncio. O H6 fica metade
feito, e a metade que falta é a de mais valor.

**Falta um passo que não é código e que só o dono do repositório pode
dar**: marcar `tsc + eslint + suíte` como **required status check** na
proteção da branch `main` (Settings → Branches). Sem isso o CI informa
mas não barra — dá para mesclar por cima do vermelho. Enquanto esse
botão não for ligado, o resultado continua dependendo de alguém olhar,
que é exatamente o que este trabalho existe para eliminar.

---

## 2.117 Testes de cobrança e failover — o H6 fecha por inteiro

O §2.116 pôs o CI para rodar `tsc`, `eslint` e a suíte sozinho, e
registrou o que ele NÃO resolvia: a suíte cobria lógica pura, e nada
exercitava `lib/entitlements.ts` (cobrança) nem o failover do
`lib/ai-router/router.ts` — as duas áreas que a seção 10 do documento
de continuidade marca como "onde o erro não aparece como erro". CI
verde sobre cobertura ausente não é segurança, é silêncio. Operador
mandou fechar: "sim, faz os testes de cobrança e failover".

**Por que esses dois módulos nunca tinham teste.** Não era desleixo: os
dois começam com `import 'server-only'`, um pacote-marcador cujo
`index.js` só faz lançar um erro. É assim que o Next impede que um
módulo de servidor seja arrastado para o bundle do cliente — e fora do
Next qualquer import dele lança, o que deixava justamente os arquivos
mais críticos inalcançáveis pelo `node --test`.

**Três caminhos testados, dois descartados com medida, não com
opinião:**

1. `--conditions=react-server` (o pacote publica essa condição
   apontando para um `empty.js`). Resolveria — e mudaria a resolução de
   TODOS os pacotes que publicam a condição. Medido antes de decidir: a
   suíte caiu de **938 para 907 testes, com 2 falhas**. Encolher em
   silêncio é o cenário que a seção 8 classifica como grave.
2. `mock.module` do `node:test`: experimental no Node 22, exige outra
   flag, mesmo alcance global.
3. **Escolhido**: `scripts/test-setup.mjs`, carregado por `--import` no
   `npm test`, usando `registerHooks` para redirecionar UM specifier —
   `server-only` — para um módulo vazio. Precisou ser `registerHooks`
   (síncrono) e não `module.register`: o tsx transpila os `.ts` deste
   projeto para CommonJS, e um hook só de ESM não é consultado no
   `require('server-only')`. Testado, não suposto. Precisou também
   apontar para um ARQUIVO real, não um `data:` URL — o carregador CJS
   tenta abrir a URL devolvida pelo hook, e um `data:` vira ENOENT.
   Conferido depois da mudança: a suíte continua em **938/938**.

**Como o banco entra no teste sem virar banco de mentira.**
`lib/db.ts` guarda o cliente em `globalThis.prisma` — o truque que faz
o hot reload do Next não abrir conexão nova a cada recompilação — e só
constrói o cliente se essa referência estiver vazia. Preencher a
referência ANTES da primeira consulta faz o `db` do produto usar um
fake em memória (`lib/testing/fake-prisma.ts`), **sem uma linha de
código de produção mudar**. O fake lança em qualquer consulta com
formato que ele não conhece: se uma consulta do produto mudar de
forma, o teste quebra alto em vez de passar por acidente.

O arquivo do fake diz, em cima, o que ele NÃO prova: a unicidade de
`AnalysisLedger.paymentRef`, a atomicidade do `updateMany` com
`unlockedAt: null` e o rollback da transação são garantias do
Postgres; aqui são, respectivamente, um erro `P2002` imitado, um `if` e
uma cópia do estado. O que os testes provam é que **o código reage
certo ao que o banco responde**. Escrever isso em vez de deixar
implícito é o ponto: teste que finge ser garantia de banco é pior que
teste nenhum, porque convence.

**Cobrança — 20 casos** (`lib/entitlements.test.ts`). Compra credita e
registra a linha com os campos de conciliação; o MESMO pagamento
entregue duas vezes credita uma vez só (é a corrida real entre o
webhook da Stripe e a verificação direta da sessão); pagamentos
diferentes somam; país de pagamento passa a mandar na faixa seguinte e
país vazio não apaga o que havia; falha que não é `P2002` SOBE em vez
de virar "creditado". Destrave consome exatamente uma análise e
registra o movimento; o segundo destrave do mesmo currículo não cobra
de novo; sem saldo não destrava nem deixa rastro; admin destrava sem
consumir e sem linha no ledger; conta suspensa não passa; currículo de
outro usuário não é destravável. Dois casos de concorrência: quando
outra requisição destrava primeiro, o saldo não é tocado; e quando o
saldo some entre a leitura e a escrita, a transação desfaz o destrave
inteiro — o currículo não pode ficar liberado de graça. Mais as três
guardas de rota (402 com saldo para a tela oferecer a compra certa, 404
para currículo inexistente, e a regra do Radar, que pede "algum
currículo destravado", não aquele).

**Failover — 13 casos** (`lib/ai-router/failover.test.ts`). O dublê
aqui é o `globalThis.fetch`, e ele cobre os DOIS caminhos do roteador:
o Claude, que chama `fetch` direto, e os provedores compatíveis com
OpenAI, cujo SDK também usa o `fetch` global. Primário respondendo não
chama suplente; primário fora do ar cai para o DeepSeek e o failover
deixa rastro em `AuditLog` (não pode ser silencioso); o `AiLog` guarda
o primário pretendido E o que respondeu, senão o painel não distingue
"o Claude está caindo" de "esta tarefa sempre rodou no DeepSeek";
resposta 200 com lixo é reprovada pelo agente de qualidade e dispara o
suplente; truncamento em `max_tokens` é falha, não conteúdo parcial;
provedor sem chave é pulado sem consumir tentativa de rede; quando
todos falham o erro do usuário não vaza detalhe de provedor (o
diagnóstico existe, separado, como manda a seção 10.9) e a rodada
ainda é registrada. **Residência de dados com prova de destino**:
usuário em Portugal com o Claude fora cai no Gemini, e as asserções
verificam que nenhuma chamada saiu para DeepSeek ou Kimi — a regra do
GDPR verificada pelo endereço que recebeu a requisição, não pela
intenção do código. Mais o desvio para o Claude quando há PDF anexado,
a ausência de suplente nesse caso, e a repetição sem cache quando o
Claude recusa o bloco de cache com 400.

**Os testes foram testados.** Teste que passa não prova nada até
falhar quando deve: oito mutações no código de produção, uma por vez,
com o arquivo restaurado depois de cada uma.

| Mutação | Pego? |
|---|---|
| `P2002` deixa de ser tratado (compra duplicada credita de novo) | sim |
| `updateMany` sem `unlockedAt: null` | sim |
| `update` do saldo sem `gte: 1` | sim |
| Guarda derivada libera currículo não destravado | sim |
| Filtro de residência de dados removido | sim |
| Agente de qualidade desligado | sim |
| `status` do AiLog nunca marca failover | sim |
| Repetição sem cache removida | sim |
| Truncamento aceito como resposta boa | sim |
| Erro final sem diagnóstico | sim |
| PDF deixa de forçar o Claude | **não, na primeira versão** |
| Com PDF, a cadeia de suplentes volta a existir | sim |

A linha em negrito é o achado desta rodada, e ela vale mais que as
outras onze juntas: o teste de PDF usava `analysis_segment`, uma tarefa
que **já é roteada para o Claude** — com ou sem o desvio, a chamada ia
para o mesmo lugar, e o teste passava verde sobre código quebrado.
Corrigido em duas frentes: a tarefa passou a ser `profile_extraction`
(roteada para o DeepSeek por decisão de custo), e a asserção passou a
cobrir também `primaryModel`, porque o desvio muda o primário
REGISTRADO — sem isso o AiLog diria que a tarefa pretendia o DeepSeek e
"caiu" para o Claude, inventando um failover que nunca houve. É
exatamente a classe de teste inútil que este projeto não pode ter em
cima de cobrança e de rota de IA.

**O que continua sem cobertura, e é honesto dizer:** o corte por
orçamento de tempo do roteador (`MAX_PROVIDER_ATTEMPTS`,
`providerTimeoutMs`, a reserva de sobrecarga). Exercitá-lo exigiria
esperar dezenas de segundos reais, e um teste que dorme 25s não
sobrevive a CI nenhum. Continua verificado só pelo comportamento em
produção — que é como as duas falhas históricas dessa mecânica foram
descobertas.

Suíte: **971 testes, `fail 0`** (938 + 20 de cobrança + 13 de
failover). `tsc`, `eslint` limpos. O H6 fecha por inteiro.

---

## 2.118 O bloqueio de merge fica desligado até haver venda — decisão do operador

O §2.116 deixou uma pendência que não era de código: o CI **informa**
mas não **barra**, e barrar depende de marcar o check como *required*
na proteção da branch `main`, botão que só o dono do repositório
aperta.

O operador tentou. O GitHub recusou: *"Your rulesets won't be enforced
on this private repository until you move to GitHub Team organization
account."* Não é erro de configuração — em repositório **privado** no
plano gratuito o GitHub simplesmente não aplica regra de bloqueio, nem
por *ruleset* (modelo novo) nem por *branch protection* clássica (que
está sendo aposentada; se um dia isto for reativado, o caminho é
**Add branch ruleset**, não o clássico).

**Três saídas foram apresentadas:** (1) deixar como está — o
verificador roda e mostra ✅/❌ em cada PR, sem impedir o merge;
(2) GitHub Pro, ~US$ 4/mês na conta pessoal, que libera o bloqueio em
repositório privado; (3) tornar o repositório público, que libera de
graça e expõe o código — descartada na hora.

**Decisão do operador: opção 1, e reavaliar quando houver venda.**
"desativei, deixa começar a ter vendas que ativo". Registrado aqui para
que ninguém tente de novo daqui a três meses, receba a mesma recusa e
gaste tempo achando que configurou errado.

**O que isso significa na prática, sem eufemismo:** um commit vermelho
PODE ser mesclado na `main` — e mesclar na `main` dispara o deploy pela
Vercel. O que impede isso hoje é disciplina de processo (trabalhar por
PR e não mesclar nada vermelho), não o GitHub. Enquanto o repositório
tem um humano e um agente trabalhando por PR, o risco é aceitável; ele
sobe no dia em que entrar mais alguém com acesso de escrita — e é esse,
não a data de uma venda, o gatilho técnico real para ligar o bloqueio.

**Gatilho para reabrir:** primeira venda (critério do operador) ou
segundo colaborador com acesso de escrita, o que vier primeiro.

---

## 2.119 "Job interview" — lacuna real de SEO/GEO encontrada num dado externo, corrigida em `/hiring`

O operador trouxe um levantamento externo de share-of-search por país,
oito termos de carreira ("job application", "job interview", "job
vacancies", "job search", "career development", "career coaching",
"cv writing", "resume optimization"), pedindo leitura para SEO/GEO/LLM.
Três achados, o segundo com ação concreta:

1. **"resume optimization" e "cv writing" são termos mortos** — 0% em
   praticamente todas as 58 linhas, sem exceção real na primeira. Jargão
   de quem vende o serviço, não fala de usuário. Conferido: o código já
   evita os dois (`job-search-terms.ts`, `employment-keywords.ts`) —
   nada a corrigir aqui.
2. **"job interview" é lacuna real**: segunda maior fatia de busca no
   Brasil (73%, atrás só de "job application") e dominante isolado numa
   faixa que cobre quase toda a América Latina, Leste Europeu e Ibéria.
   Busca em código confirmou **zero termo de busca** em
   `job-search-terms.ts` e **zero cópia nessa direção em `/hiring`**.

   > **Correção (10/09/2026, conciliação).** A frase original aqui dizia
   > "zero conteúdo nessa direção — a única ocorrência de 'interview' no
   > projeto inteiro era incidental". Isso estava **errado**, e a revisão
   > automática do PR #68 pegou: `en.ts` já tinha cópia visível ao usuário
   > ("increase your interview chances", em `recommendationsDesc`) e
   > `matching/job-fit.ts` já definia uma ação `interview_prep`
   > ("Preparar para a entrevista", com justificativa própria). A lacuna
   > real era **de SEO em `/hiring`**, não de produto — e é só isso que a
   > mudança desta seção fecha.
   >
   > **Achado que veio junto, e que não é de SEO**: `interview_prep`
   > nunca chega à tela. A lista de ações do Job Fit é filtrada por
   > `primary` em `radar-view.tsx:656`, e `interview_prep` nunca é
   > marcada como principal em nenhum dos três caminhos de
   > `job-fit.ts` — existe no modelo de dados e no tipo, e o usuário
   > jamais a vê. Não é defeito de tela nem promessa quebrada (nada é
   > oferecido e não entregue), mas é código que não faz nada:
   > **fica em aberto** decidir entre exibir a recomendação ou remover
   > a ação. Não mexi nisto aqui — é decisão de produto, e este PR é de
   > conciliação.
3. Segmentação geográfica por bloco (África/Caribe → "job vacancies"
   transacional; Anglófonos/Ásia desenvolvida → "career development"
   mais presente) — registrado, sem ação nesta rodada.

**Escopo decidido com o operador antes de implementar**: só SEO/GEO —
sem feature nova de IA (havia a opção de um "preparador de entrevista"
por IA — que, como a correção acima mostra, já existe como RECOMENDAÇÃO
não exibida em `job-fit.ts` —, descartada por ora: maior custo, decisão de preço/entitlement
que este achado isolado não justifica).

**Implementado, `/hiring` — a página que já fala com este exato
momento do funil** (quem se candidatou e quer saber se o currículo
passa):

- `job-search-terms.ts`: termo nativo de entrevista acrescentado aos 12
  idiomas (`entrevista de emprego`, `job interview`,
  `Vorstellungsgespräch`, `面接`, etc.) — japonês e chinês levam a
  palavra isolada (`面接`/`面试`), não um composto com `転職`/`求职`, pelo
  mesmo cuidado documentado no cabeçalho do arquivo para os outros
  pares. Nenhuma tradução nova exigiu verificação institucional — ao
  contrário dos termos de mercado de trabalho, "entrevista de emprego"
  não muda de público por idioma.
- `closingSubtitle` de `hiringPage` (12 idiomas): uma frase a mais,
  verdadeira — o que a avaliação em 8 dimensões entrega É o primeiro
  passo para chegar à entrevista. Não é invenção de capacidade nova.
- **Por que a cópia visível, não só a meta `keywords`**: o próprio
  cabeçalho de `/hiring/page.tsx` já registra que o Google ignora
  `keywords` desde 2009 — quem de fato sustenta o termo é o texto que
  a pessoa lê, que é também o que um motor de resposta (GEO) cita.
- Teste novo em `job-search-terms.test.ts`: confirma o termo completo
  nas keywords E a raiz do termo no texto visível, nos 12 idiomas — a
  mesma dupla checagem que o teste da hashtag já fazia.

**Verificado**: dev server local, `/hiring?lang=pt` e `?lang=en` —
`get_page_text` confirmou a frase nova no corpo visível, `curl`
confirmou "entrevista de emprego"/"job interview" na meta `keywords`.
Achado no caminho: dois processos do Next dev de uma verificação
anterior na sessão não tinham morrido de verdade (seguravam a DLL do
Prisma, `EPERM` no build) — encerrados por PID via PowerShell antes de
buildar. `tsc --noEmit`, `eslint` e `npm test` (939/939, 1 novo) e
`npm run build` limpos.

> **Nota de conciliação (10/09/2026).** Esta seção foi escrita como
> §2.115 numa sessão que expirou antes do push; os dois commits ficaram
> só na máquina do operador e foram resgatados depois que a `main` já
> tinha um §2.115 diferente (a deriva de documentação do digest).
> Renumerada para §2.119 na conciliação — o CONTEÚDO é o original, sem
> corte. As referências a "§2.115" que apontavam para cá, no §7.11 do
> documento de continuidade e no índice, foram atualizadas junto. Fica
> o registro do porquê: número de seção é ordem de chegada ao
> repositório, não ordem de escrita, e duas sessões em paralelo colidem
> nele sem que nenhuma das duas esteja errada.

---

## 2.120 Hero D + faixa "A ordem importa" — landing reposicionada da vaga para a auditoria

Pedido do operador, a partir de uma especificação de design (handoff com
quatro direções de hero, A/B/C/D, das quais só a D foi aprovada): substituir o
hero público e acrescentar uma faixa nova logo abaixo, comunicando a cadeia
oficial do produto — inteligência → análise → auditoria → otimização →
direcionamento → Radar — em vez de abrir pela vaga. Frase central: "Conectamos
você a oportunidades, não a vagas." Implementado em
`src/components/landing/hero-d.tsx` e `order-band.tsx`, montados em
`landing.tsx` no lugar do hero antigo (o card de "Relatório Técnico" fixo em
nota 8.7 saiu; a "HOW IT WORKS" mais abaixo na página, que fala do fluxo de
uso — envio → laudo → reescrita —, não foi tocada, é uma tese diferente).

**A parte que importava mais não era CSS — era não publicar número
inventado.** A especificação era explícita: quatro pontos de dado no
protótipo eram ilustrativos, não reais, e cabia a esta sessão checar cada um
contra a implementação antes de publicar:

- **`{N}` vagas abertas** — o protótipo animava até 1.284, inventado. Trocado
  por `db.job.count({ where: { closedAt: null } })`, o mesmo critério de
  "aberta" que o resto do produto usa (`Job.closedAt` nulo — ver §12/§14).
  Conferido direto no banco: **8.281** vagas ativas agora, bem acima do
  placeholder, então a copy "Mais de N vagas abertas" não perde força.
  `src/app/page.tsx` virou Server Component (antes era `'use client'` puro);
  a lógica de estado que ele tinha foi para `src/app/home-client.tsx` novo,
  que recebe `openJobsCount` como prop. **`src/app/[country]/page.tsx`
  (as 41 rotas de país, SSG) precisou do mesmo tratamento** — não estava no
  escopo pedido literalmente, mas são a mesma `Landing`/`HeroD`, e deixá-las
  sem a contagem real publicaria "0" nessas 41 páginas. Ambas as rotas
  ganharam `export const revalidate = 300`: a contagem já não fica presa no
  valor do build, revalida a cada 5 minutos.
- **Cartão "91% → 43%" (Head de Operações — logística)** — é exemplo
  construído, não auditoria real de um usuário. A especificação oferecia
  duas saídas: dado real anonimizado (não disponível nesta sessão) ou rótulo
  visível de exemplo. Escolhida a segunda: badge discreto "Exemplo
  ilustrativo" (`cardIllustrativeBadge`) no canto do cabeçalho do cartão —
  não estava no texto aprovado, mas é a alternativa que a própria
  especificação autoriza para não publicar percentual de compatibilidade sem
  lastro.
- **"seu arquivo não vai para lugar nenhum"** — checado contra o código e
  **descartado da linha de confiança**, não publicado. É falso como
  afirmação: o currículo é enviado a provedores de IA de terceiros
  (`lib/ai-router` — OpenAI, Anthropic, Gemini, DeepSeek, Kimi) para a
  própria análise que é o produto, e fica retido até 730 dias em conta
  inativa (`lib/retention.ts`). Publicar "não vai para lugar nenhum" seria
  uma reivindicação factualmente errada no próprio hero.
- **"12 idiomas"** — mantido, é verificável e verdadeiro:
  `src/lib/i18n/locales/` tem exatamente 12 arquivos. Escrito como
  `{count} idiomas` com `LANGUAGES.length`, não `"12"` fixo — se um 13º
  idioma entrar um dia, a frase não fica desatualizada sozinha.
- **"LGPD & GDPR"** — mantido: já é uma afirmação publicada hoje
  (`hero.badgeSecurity` no hero antigo) e tem código real por trás
  (`lib/data-residency.ts`, `lib/retention.ts`). Registrado aqui, não
  resolvido nesta sessão: **não existe página pública de política de
  privacidade** no app — gap pré-existente, não introduzido por este
  trabalho, mas que sustenta cada vez menos quanto mais essa sigla aparece
  na landing.

**i18n.** [[feedback_no_hardcoded_portuguese]] é regra permanente do
projeto — as chaves novas (`heroD`, `orderBand`, em `i18n/types.ts`) foram
escritas nos **12 idiomas**, não só em português com fallback. O português é
a copy aprovada pelo cliente, verbatim, incluindo o bloco de texto
"embaralhado" do cartão ATS (o embaralhamento É o argumento visual da seção —
mostrar um parser destruindo a ordem das palavras). As outras 11 traduções
foram produzidas nesta sessão, sem revisão do cliente ainda — recomendado
revisão por falante nativo antes de tráfego amplo, principalmente no cartão
ilustrativo (a vaga de exemplo, as evidências, e o bloco embaralhado, que
precisou ser adaptado — não só traduzido — em cada idioma para preservar o
mesmo efeito).

**CSS.** O protótipo original usa `style` inline; a CSP do projeto bloqueia
isso (mesmo motivo já documentado em `hiring-index-teaser.tsx`). Tudo virou
Tailwind + tokens de `globals.css` (`--primary`/`--brand-navy` já batiam
exatamente com `#0B63E5`/`#0B192E` do design, reaproveitados). A única
animação (linha de varredura do cartão ATS) virou `@keyframes hero-ats-scan`
em `globals.css`, referenciada como classe Tailwind arbitrária — nunca como
atributo `style`. Desligada sob `prefers-reduced-motion` via
`motion-reduce:animate-none`.

**Verificação.** `tsc --noEmit`, `eslint` e `next build` limpos (78 páginas,
`/` e as 41 `/[country]` com `5m` de revalidate). Contagem do banco conferida
duas vezes por fora do Next (`node` + `@prisma/client` direto): 8.281,
estável. `next start` (build de produção) e uma bateria de `curl` — incluindo
um com User-Agent e cabeçalhos de Chrome completos, `--compressed` — sempre
devolveram o valor correto no HTML servido. **Achado à parte, registrado em
memória** ([[feedback_playwright_stale_ssr_preview]]): o navegador controlado
por Playwright nesta sessão mostrou "0" persistentemente, em aba nova, em
dev e em produção, mesmo depois de reiniciar o servidor — isolado como
artefato da própria ferramenta de automação (o `curl` nunca reproduziu,
inclusive imitando os cabeçalhos exatos do navegador), não um bug do código
publicado.

**O que fica pendente, não implementado por falta de dado/decisão do
cliente:**

1. Revisão nativa das 11 traduções novas (só português é copy aprovada).
2. Decisão do cliente: substituir o cartão ilustrativo por uma auditoria real
   anonimizada, ou manter o rótulo "Exemplo ilustrativo" em definitivo.
3. Página pública de política de privacidade — gap pré-existente que a
   afirmação "LGPD & GDPR" da landing expõe, não fechado nesta sessão.
4. Contador animado de `{N}` no carregamento (~1,1s) do protótipo foi
   deliberadamente **não implementado** — é opcional na especificação, e o
   valor estático renderizado no servidor evita qualquer risco de mostrar
   "0" antes da hidratação ou de um salto de layout.

---

## 2.121 `/privacy` sai do papel — pendência 3 do §2.120 fecha, e nasce um agente de revisão de tradução

Resposta do operador às duas pendências do §2.120. Sobre o cartão
ilustrativo do Hero D: "dados pessoais podem ser fictícios apenas para
simulação" — confirma a implementação já feita (nome, empresa e evidências
inventados, rotulados como "Exemplo ilustrativo"), sem necessidade de
substituir por auditoria real. Fechado sem mudança de código.

Sobre a falta de página pública de política de privacidade: "pode criar uma
que não nos comprometa". Como não existe ainda razão social/CNPJ formalizado
(confirmado com o operador antes de escrever qualquer texto — não seria
inventável), a página cita "GriffoWork" como marca operacional, não como
pessoa jurídica, e evita qualquer promessa que o produto não cumpre hoje
("segurança absoluta" nunca é afirmada, por exemplo).

**Todo fato da política é verificável no código, não inventado:**

- **Sub-processadores de IA** — Anthropic, OpenAI, Google, DeepSeek, Moonshot
  AI, exatamente os cinco de `lib/ai-router/registry.ts`.
- **Retenção** — as linhas da tabela vêm direto de `lib/retention.ts`:
  currículo em conta inativa até 730 dias, log de IA até 365, trilha de
  auditoria até 730, registro de pagamento/webhook até 90.
- **Transferência internacional** — descreve o mecanismo real de
  `lib/data-residency.ts`: usuários da UE/Reino Unido/Suíça não têm o
  currículo roteado a DeepSeek/Kimi (sem decisão de adequação), os demais
  usuários podem receber qualquer um dos cinco.
- **Direitos do usuário** — "exportar" e "excluir conta" descrevem rotas que
  já existem e funcionam: `GET /api/user/export` e `DELETE /api/user`. Nada
  prometido que ainda não está implementado.
- **Cookies** — só o cookie de sessão (`lib/auth.ts`) e o de preferência de
  idioma `griffo_lang` (`i18n-context.tsx`) são citados, porque são os únicos
  que o código de fato grava; nenhum rastreador de terceiro existe para
  citar.

Implementado como módulo próprio (`lib/privacy/content-types.ts` +
`locales/` + `content.ts`), no mesmo padrão de `lib/enterprise/` — não
dentro do `TranslationDictionary` principal, que já é grande demais para
conteúdo de uma página só. Rota `src/app/privacy/page.tsx` fora do
roteamento `[country]` (mesmo padrão de `/enterprise`, `/market-pulse`),
idioma resolvido por `resolveRequestLanguage` (o helper que uma sessão
anterior já tinha extraído para o `/enterprise`, reaproveitado aqui em vez
de duplicado uma terceira vez). A frase "LGPD & GDPR" da linha de confiança
do Hero D (§2.120) virou link para `/privacy`.

**Escopo de idioma: os 12 do site**, decisão do operador — "só em inglês é
interessante mas corremos o risco de perder clientes". Diferente do Hero D,
aqui o **inglês** é a fonte (não o português): a política foi escrita em
inglês primeiro como conteúdo mestre, e o português foi escrito em paralelo
com os mesmos fatos, não traduzido de um para o outro — as outras 10 línguas
partiram do inglês.

**Nasce `.claude/agents/translation-reviewer.md`.** Pedido explícito do
operador junto da resposta sobre idiomas: "precisamos criar um agente para
revisar e sempre buscar aprimorar as traduções". Agente reutilizável,
disponível a partir da próxima sessão neste repositório (registro de agente
não recarrega no meio de uma sessão em andamento) — compara cada idioma
contra a fonte da verdade do módulo (português para copy de marketing já
aprovada, inglês para conteúdo global-first como este), corrige erro
inequívoco direto, e **sinaliza em vez de editar** qualquer coisa que possa
mudar sentido jurídico em conteúdo de compliance. Nesta sessão, sem poder
invocá-lo ainda, a mesma revisão rodou por um fork com as instruções do
arquivo do agente — resultado registrado à parte quando terminar.

`tsc --noEmit`, `eslint` e `next build` limpos (`/privacy` sai como `ƒ`
dinâmica, mesmo padrão de `/enterprise`). Verificado por `curl` em inglês e
português (`?lang=pt`), e o link do Hero D confirmado apontando para
`/privacy` no HTML servido.

**O que fica pendente:** revisão jurídica de verdade antes de tratar esta
página como blindagem de conformidade definitiva — o texto foi escrito para
ser honesto e verificável contra o código, não para substituir um advogado;
e atualizar a página no dia em que existir razão social/CNPJ formalizado.

## 2.122 Revisão geral pedida pelo operador — nada de código pendente, dois ponteiros de branch obsoletos limpos

Pedido do operador: "revise o projeto veja se ficou algo pendente". Sem
mudança de escopo, é conferência, não desenvolvimento.

**Verificação de estado**: `main` local idêntico a `origin/main` (mesmo
commit `cc3c01f`), árvore limpa. `tsc --noEmit`, `eslint` e `npm run build`
sem erro; suíte em **973/973** (`fail 0`) — acima dos 972 do §2.117 por
causa dos dois commits de `interview-prep` que entraram depois do §2.121 e
não tinham seção própria na auditoria (identificação de área profissional
em vez de assumir "técnico"; vaga sem requisitos estruturados deixando de
rejeitar a resposta inteira).

**O achado real**: `git branch -a` mostrava duas branches locais —
`design-refresh-2026-08` (a mesma do §7.7 do handoff) e
`claude/admin-user-edit-modal` — que pareciam pendentes de mesclar. Não
estavam: as duas tinham **0 commits à frente de `main`** (todo o conteúdo
já dentro dela) e já tinham sido apagadas do remoto por fora desta sessão
(`git fetch --prune` confirmou `[origin/...: gone]` nas duas). Sobravam só
os ponteiros locais obsoletos, removidos com `git branch -D` — nada de
irreversível, porque não existia mais nada no remoto para perder.

A causa do falso alarme era **o handoff, não o git**: o §7.7 ainda descrevia
o design-refresh como "🟡 EM REVISÃO, falta verificar telas autenticadas",
quando essa verificação já tinha acontecido no §2.109 (produção, login
real) e o trabalho já estava mesclado havia mais de 170 commits. Mesma
classe de erro do §2.115 — documento que descreve estado velho é pior que
documento ausente, porque parece confiável. Corrigido para ✅ RESOLVIDO,
com a nota de que foi achado desatualizado, não código quebrado.

**Achado à parte, sem ação**: existem 10 worktrees em
`C:\Users\sptox\.gemini\antigravity\worktrees\griffo\...`, de uma ferramenta
de IA diferente (Google Antigravity) atuando neste mesmo repositório fora
de qualquer sessão do Claude Code. Todas com 0 commits à frente de `main`
— só snapshots antigos sem trabalho exclusivo, nada a recuperar ou apagar.
Registrado aqui porque é o tipo de estado inesperado que vale a pena
alguém saber que existe, não porque exige ação.

**Pendências reais que continuam de pé**, sem mudança nesta sessão — já
listadas na seção 0 do handoff e não repetidas aqui: banner social
1200×630 nunca desenhado (item 11), "profissões em alta por país" inviável
por volume (item 16), dado próprio sem volume para virar conteúdo público
(item 18), tom/registro nativo das 12 traduções sem revisão humana (item
21), dois e-mails de release parados no Gmail sem destinatário (item 22),
calibragem dos três eixos de matching esperando caso real (§7.5), e a
revisão jurídica de `/privacy` (§2.121). Nenhuma delas é código quebrado —
são decisões ou dados que só o operador ou o tempo resolvem.

## 2.123 Cartão do Hero D mudava de tamanho ao trocar de aba, e empurrava o texto ao lado

Reportado pelo operador: "na home quando clicamos em 'como ATS te vê' o
bloco branco diminuiu de tamanho e o texto lateral se move para cima".

**Causa.** Em `hero-d.tsx`, o "Corpo" do cartão (`<div className="relative
min-h-[320px]">`) só renderizava a aba ativa, e `min-h-[320px]` é um PISO,
não um teto — a altura real seguia o conteúdo de cada aba. A visão humana
(4 requisitos + evidência) é mais alta que a visão ATS (linhas de
diagnóstico mais curtas); trocar de aba trocava a altura real do cartão. E
como a coluna esquerda do hero está centralizada verticalmente contra a
direita (`items-center` na grid do `HeroD`), uma mudança na altura da
coluna direita recentralizava as duas colunas na nova altura da linha da
grid — o texto à esquerda "pulava" a cada clique.

**A correção**, sem mexer em conteúdo nem em texto: as duas abas passam a
ficar **sempre montadas**, empilhadas na mesma célula de grid
(`col-start-1 row-start-1`), técnica de CSS puro em que a altura da linha
vira automaticamente o MAIOR conteúdo entre as duas — sem precisar de
número mágico em pixel, o que importa porque o texto muda de tamanho por
idioma nos 12 idiomas do site. A aba inativa fica com `invisible`
(`visibility: hidden`), não `hidden`/`display:none`: continua ocupando
espaço e contribuindo pra altura da linha, só não é pintada nem clicável.
`tabIndex` e `aria-hidden` seguem a aba ativa, preservando o papel
`tabpanel` para leitor de tela.

**Verificado por medição de DOM, não só visual** (`getBoundingClientRect`
via `javascript_tool`, produção local após `npm run build` + `npm run
start` — dev/Turbopack tinha um erro de módulo à parte, sem relação com
esta mudança, que não reproduziu em build/produção): `cardHeight`,
`cardTop`, `cardBottom` e a posição do `h1` idênticos bit a bit entre as
duas abas (599,8px de altura nos dois casos). `tsc`, `eslint`, `build` e
suíte (973/973) limpos.

## 2.124 Google Trends real, nos 12 idiomas — o termo isolado de currículo entra, o de maior volume de todos fica de fora por direção

Pedido do operador: ir ao Google Trends de verdade, achar o termo mais
buscado em cada um dos 12 idiomas do site, e usar para atrair mais lead
orgânico — mesmo método do §2.96/§2.119 (dado de busca real, não achismo),
desta vez pesquisado ao vivo em vez de trazido pelo operador.

**Como foi feito.** `trends.google.com/explore`, no navegador, um país-sede
por idioma (BR, US, ES, DE, FR, IT, JP, NL, SE, CN, SA+EG, KR), últimos 12
meses, comparando os termos já usados em `job-search-terms.ts` contra
candidatos (termo isolado de currículo/CV/resume; termo de vaga/anúncio de
emprego). A ferramenta em si foi instável — o gráfico da Trends travou o
carregamento da página repetidas vezes em francês, japonês, sueco e coreano,
resolvido reabrindo a aba; nenhum dado foi lido de um gráfico que não
carregou.

**O achado maior não virou código.** Em quase todo mercado, o termo de
MAIOR volume não foi nenhum sinônimo de "busca de emprego" nem de
"currículo" — foi "vagas de emprego"/"ofertas de empleo"/`Stellenangebote`/
"offres d'emploi"/"offerte di lavoro"/`求人`/`vacatures`/"lediga jobb"/
`招聘`, de 3 a 10× mais buscado que qualquer termo já usado no site (na
Itália, "ricerca di lavoro" — o termo atual — ficou **quase zerado** contra
"offerte di lavoro"). Ficou de fora por decisão, não por esquecimento:
`/hiring` já rejeita a mesma direção para "hiring" desde o §2.84 — quem
digita "vagas de emprego" quer um QUADRO de vagas, não uma auditoria de
currículo pós-candidatura. Trazer esse termo pra `/hiring` atrairia o
público errado pra página errada. Registrado no cabeçalho de
`job-search-terms.ts` para ninguém repetir a pesquisa achando que foi
descuido.

**O que entrou: o termo isolado de currículo/CV/resume**, 2º colocado (ou
empatado em 1º, Brasil e Itália) em 9 dos 12 mercados, bem acima dos termos
de busca de emprego já usados — e com a direção certa, porque é exatamente
a dúvida que `/hiring` responde ("meu currículo passa no filtro?"). Nos
outros três (japonês, sueco, coreano) o sinal do Trends veio mais fraco, sem
separação clara do termo atual — entraram do mesmo jeito porque a palavra já
estava no texto visível de `hiringPage.searchBody` **antes** desta sessão
(currículo/CV/resume é o assunto central da página desde sempre, só nunca
tinha virado keyword), então o risco de keyword sem sustentação — a mesma
regra que os testes desta lista já cobram — é baixo mesmo com sinal fraco.
Confirmado nos 12 idiomas, um por um, contra o texto real antes de
adicionar: nenhuma cópia nova foi escrita, só a keyword passou a refletir o
que a página já dizia. Teste novo (`job-search-terms.test.ts`) trava as duas
pontas, mesmo padrão do teste de "entrevista de emprego" do §2.119 — árabe
precisou da mesma distinção raiz/termo completo que aquele teste já usa
(`سيرتك` no texto flexiona a `ة` para `ت` antes do sufixo possessivo; a raiz
comum é `سير`, sem a terminação).

**Achado à parte, sem entrar no código**: os dois países árabes testados
divergiram — na Arábia Saudita o termo atual (`البحث عن عمل`) andou
emparelhado com `السيرة الذاتية`, sem vencedor claro; no Egito (população
bem maior) `السيرة الذاتية` disparou na frente dos dois outros termos.
Decisão: somar ao lado que a maioria e a população maior indicam, registrado
aqui para não parecer que o resultado misto foi ignorado.

**Três sinônimos trocados em `[country]/page.tsx`**, sem mexer em frase,
posição ou estrutura — só a palavra que a própria descrição já usa no
contraste "conectamos a oportunidades, não a X" (posicionamento do Hero D,
§2.120) virou a de maior volume confirmado: alemão `Stellenanzeigen` →
`Stellenangeboten` (mesma ideia, declinação dativa depois de "mit"), italiano
`annunci di lavoro` → `offerte di lavoro`, sueco `jobbannonser` → `lediga
jobb`. As outras 9 descrições já usavam a palavra de maior volume — nada
mudou nelas. Isto **não** reabre a decisão do Hero D de não liderar a
mensagem pelo quadro de vagas; é só a palavra escolhida dentro da mesma
frase negativa que já existia.

`tsc`, `eslint`, `build` (`/[country]` segue `●` SSG) e suíte — **974/974**,
1 novo — limpos. Conferido também contra o HTML servido de verdade
(`npm run build` + `npm run start`, `curl` em `/de`, `/it`, `/se` e
`/hiring?lang=` para pt/ar/it/ja), não só contra o código-fonte.

## 2.125 Pendência 16 reaberta com dado real — a causa de "poucas vagas fora do Brasil" não era falta de vaga, era falta de país preenchido (fase 1 de 4)

O time do JobBase (mesmo grupo) avisou de uma view nova
(`job_category_country_counts`) categorizando vagas por atividade. Ao
verificar os números reais no banco (Supabase MCP, direto nos dois
projetos — `Griffo` e `jobbase`, não por estimativa) para decidir onde usar
esse dado, apareceu a pergunta certa do operador: por que a distribuição
por país é tão desigual (Brasil 4.441, 2º lugar Austrália só 146)?

**A causa raiz não era volume — era campo vazio.** De 9.645 vagas abertas
no Griffo, 4.641 (48%) não tinham `country`. Mas 4.197 dessas (90%) TINHAM
`city` preenchida — só que como texto livre nunca parseado ("San
Francisco, CA | New York City, NY", "Brazil (São Paulo - Hybrid)", "Dublin,
Ireland"; 725 strings distintas, mas concentradas — "San Francisco" sozinha
aparecia 640 vezes). O operador confirmou a intuição certa: "as outras
vagas que não têm país devem ter pelo menos uma cidade... dessa forma
identificamos o país."

**O que foi feito** — plano completo em 4 fases (documento salvo, aprovado
pelo operador antes de qualquer código); esta seção cobre a Fase 1:

Novo módulo `src/lib/jobs/location-country.ts`
(`inferCountryFromLocation`): lista fechada de nome de país (EN+PT) e das
cidades que realmente apareceram nos dados (não uma tabela de geocoding
genérica), mais sigla de estado americano após vírgula como recurso final.
Texto sem nenhum sinal reconhecível devolve `null` — nunca um palpite
forçado, mesma regra do resto do normalizador. Multi-localização
(`"X | Y | Z"`) usa só o primeiro trecho — suficiente pela amostra real.

**Por que isto não é uma nova exceção à regra de não inventar**: o
cabeçalho de `normalize.ts` já permite UMA inferência — "a que se lê do
próprio texto da vaga" — e é exatamente essa exceção que já autoriza
`normalizeRemoteType` a ler "remote"/"hybrid" dentro do texto de
localização. Ler o país no MESMO texto é a mesma classe de inferência, não
uma nova. Achado no caminho: `jobbase.ts` já documentava, de propósito,
"o normalizador decide o que fazer com um país ausente, este adapter não
adivinha" — o lugar certo para esta função já estava previsto no comentário
de outra sessão, só não tinha sido escrito ainda.

Wiring em `normalize.ts`: `country` tenta o valor declarado da fonte
primeiro, cai para `inferCountryFromLocation(city, region)` só quando a
fonte não disse. Teste novo (`location-country.test.ts`, 10 casos, todos
com string real observada no banco) trava os casos de acerto E o de
recusa (texto sem match, substring dentro de outra palavra).

**Backfill único** (`src/scripts/backfill-job-country.ts`, mesmo padrão de
`--dry-run` de `fetch-hiring-index.ts`) aplicado às 4.197 vagas já
gravadas sem país, com autorização do operador antes de tocar produção:
**3.975 resolvidas (94,7%)**, 222 continuam sem país — texto que
genuinamente não bate com nada da lista. Conferido por consulta direta ao
banco antes e depois, não só pelo log do script: cobertura de país sobe de
52% para **93%** (8.979 de 9.645). O quadro deixa de parecer um produto
quase só brasileiro: Brasil 4.441→4.884, **Estados Unidos 53→2.477**,
Reino Unido 112→315, Austrália 146→223, Singapura 29→175, **Canadá e
Irlanda, que não apareciam, entram com 140 e 123**.

**Achado à parte, sem ação nesta sessão**: o rodízio direto de Adzuna do
Griffo (`adzuna:br`/`au`/`be`/`at`/`ca`) está parado há 11-13 dias
enquanto as outras fontes coletaram hoje — parece bug real, registrado
para investigar depois. O operador esclareceu que isso importa menos do
que parecia: o JobBase TAMBÉM coleta Adzuna por conta própria (confirmado
no banco: 500 vagas, coletadas ontem), e a query do adapter do JobBase
nunca filtrou por `source` — todas as 10 fontes que o JobBase agrega
(inclusive InfoJobs, 2.942 vagas, e Catho, 1.154 — o comentário do
adapter que dizia "ainda não coletam nada" estava desatualizado, corrigido
nesta sessão) já chegam ao Griffo automaticamente, sem mudança de código
quando uma fonte nova passa a coletar de verdade.

**Frescor**: a exigência do operador ("atualizada em até 12 horas") já
está coberta pela mesma peça que já existe — a página usa ISR com
`revalidate=300` (5 minutos), bem dentro do limite; nenhuma infraestrutura
nova precisa entrar só por isso.

**Próximas fases, já combinadas com o operador**: Fase 2 (campo
`Job.category`, aditivo — pausa antes de pedir `npx prisma db push` —,
`category_slug` do JobBase importado por vaga, "vaga remota" sobrepondo a
categoria de função quando `remoteType === 'remote'`); Fase 3 (lista
"vagas por país" na home, com piso de exibição — não lista país com 1-2
vagas, soma no "+ vagas em N outros países"); Fase 4 (detalhamento por
categoria no painel do país selecionado de `/market-pulse`, pendência que
o próprio §2.56/pendência 16 já previa "quando o volume justificar").

`tsc`, `eslint`, `build` e suíte — **984/984**, 10 novos — limpos.

## 2.126 Categoria de vaga, com "vaga remota" sobrepondo — fase 2 de 4, aguardando `db push`

Continuação do §2.125, mesmo plano aprovado. Campo novo **aditivo**
`Job.category` em `prisma/schema.prisma` — setor amplo (`ti`, `vendas`...),
diferente de `normalizedTitle` (cargo fino, taxonomia própria do Griffo,
~24% de cobertura): vem de `category_slug` do JobBase (coluna gerada por
título, 19 categorias, ~74% de cobertura), avisado pelo time em
14-15/09/2026.

**"Vaga remota" sempre sobrepõe**, pedido explícito do operador: quando
`remoteType === 'remote'`, `category` vira `'vaga_remota'` mesmo que a
vaga já tivesse uma categoria de função — em `normalize.ts`, antes de
`markAbsent`. Fora do JobBase (Gupy/Adzuna/Greenhouse/Remotive/RemoteOK),
`category` fica `null` — nenhuma fonte que não categoriza ganha um setor
inventado.

**"vaga_remota" não entra no catálogo do JobBase** (`job_categories`) —
aquele sistema categoriza por função da vaga a partir do título; regime
de trabalho é outro eixo, e não é este projeto que decide o schema do
banco irmão. A sobreposição acontece só na leitura, do lado do Griffo.

**Onde mudou**: adapter do JobBase (`jobbase.ts`) pede `category_slug` no
`SELECT_COLUMNS` e mapeia pra `RawJob.category`; `normalize.ts` computa a
regra acima; `radar/runner.ts` (o ponto real de escrita no banco, achado
ao seguir `normalizeJob(...)` até o fim — não é `lib/jobs/` que grava,
como se poderia supor) grava `category` na `Job`; os dois lugares que
RECONSTROEM `NormalizedJob` a partir de uma linha do banco
(`api/radar/route.ts`, `ai-jobs/runners/interview-prep.ts`) também
precisaram do campo — `tsc` foi quem achou os dois, não haviam sido
listados no plano.

**Tradução das 19 categorias do JobBase + "vaga remota"** nos 12 idiomas
(`lib/jobs/category-labels.ts`) — JobBase só dá pt/en, as outras 10 são
tradução direta de palavra de setor (não frase de marketing), mesmo risco
baixo já aceito para "Diferenciais" (§2.123) e os termos de currículo
(§2.124); mesma ressalva já registrada (pendência 21) de tom sem revisão
nativa. Slug desconhecido cai em "outros" — nunca mostra o slug cru pra
quem usa a tela.

**Correção de comentário**, achada no caminho: `jobbase.ts` dizia
"Gupy/InfoJobs/Catho ainda não coletam nada" — não é mais verdade
(InfoJobs 2.942 vagas, Catho 1.154, conferido no banco do JobBase); a
query do adapter nunca filtrou por `source`, então isso já chegava ao
Griffo sem precisar de mudança de código.

**Ainda não foi para produção.** Rodei `npx prisma generate` localmente
(gera o cliente TypeScript a partir do schema, não toca o banco) só para
`tsc`/testes passarem — a coluna `category` **não existe ainda** na
tabela `Job` de produção. Não vou aplicar `db push` eu mesmo, mesmo tendo
acesso de escrita ao banco via MCP: é uma trava deliberada do projeto
(decisão humana antes de tocar produção), não uma limitação técnica. Sem
essa migração, o próximo cron que tentar gravar `category` falha. Commit
feito, **push para `origin/main` represado até o operador confirmar o
`db push`** — mesmo cuidado do §2.108 (env var nova só vale a partir do
próximo deployment; aqui é a mesma lógica para coluna nova).

`tsc`, `eslint`, `build` e suíte — **989/989**, 5 novos — limpos, contra o
cliente Prisma gerado localmente.

**Atualização, mesmo dia**: operador rodou `npx prisma db push`.
Confirmado por consulta direta ao banco de produção
(`information_schema.columns`), não só pela ausência de erro: a coluna
`category` existe, `text`, aceita nulo. Push liberado e feito para
`origin/main` (`c1361e9` + `31cf898`).

## 2.127 Lista "vagas por país" na home — fase 3 de 4, e um bug real achado na verificação

Continuação do §2.125/§2.126, mesmo plano aprovado. Com país já
resolvido pra 93% das vagas (fase 1) e categoria vindo do JobBase (fase
2), a home ganhou uma seção nova entre "Diferenciais" e a barra de
estatísticas: `getOpenJobsCountByCountry()` (novo, em
`open-count.server.ts`, mesmo padrão de retry de `getOpenJobsCount()`),
`db.job.groupBy(['country'])` só com vaga aberta e país preenchido.
`src/app/page.tsx` resolve as duas contagens em paralelo
(`Promise.all`) e passa pra `HomeClient` → `Landing`.

**Piso de exibição, decisão de apresentação (não de dado)**:
`MIN_COUNTRY_JOBS_TO_LIST = 30` em `landing.tsx` — país com menos vagas
não aparece nomeado, some no "+ vagas em N outros países" com número
real, mesma disciplina do mapa de contratação (nunca um total sem o
resto ao lado). Novo dicionário fechado `country-labels.ts` (31 códigos,
12 idiomas) traduz o código do país pro nome visível sem
`Intl.DisplayNames` — a mesma armadilha de ICU divergente entre Node e
navegador que já tinha quebrado `map-model.ts` antes; `Intl.NumberFormat`
(só formatação de dígito) continua seguro e já usado em `hero-d.tsx`.

**O bug real, achado na verificação visual**: depois de `build`+`start`
local, a seção aparecia no HTML servido por `curl` (confirmado com dado
real — "4.884" ao lado de "Brasil") mas nunca aparecia no navegador
depois de a página carregar. Não era cache do Chrome (descartado por
`fetch(..., {cache:'no-store'})` no mesmo request, por
`document.cookie` vazio, por zero *service worker* registrado, e por um
DOM lido direto via `querySelectorAll` numa aba nova, sem histórico
nenhum) — era `src/app/home-client.tsx`: o componente tem DOIS pontos
que renderizam `<Landing>`, um usado antes da hidratação (pra SEO/bot,
que recebia `jobsByCountry` certo) e outro usado depois que
`hydrated` vira `true` (o estado em que qualquer visitante real fica) —
e só o segundo **não** passava `jobsByCountry`, caindo no `= []` default
da prop. A seção nascia visível no HTML da primeira resposta e
desaparecia sozinha no instante em que o React hidratava — silencioso,
sem erro de console, porque não é exceção, é prop ausente com fallback
válido. Corrigido passando `jobsByCountry={jobsByCountry}` também no
retorno pós-hidratação. Confirmado depois da correção, em aba nova,
sem histórico: heading exato (`"Open jobs right now, by country"`) e 16
cards de país no DOM.

`tsc`, `eslint`, `build` e suíte — **989/989** (mesma contagem do
§2.126, nenhum teste novo nesta fase) — limpos.

## 2.128 Análise do `career-ops`, sinal de legitimidade de vaga, calibração da nota, e o encerramento por idade que o schema já previa

Pedido do operador: avaliar se o repositório aberto
[`career-ops-hq/career-ops`](https://github.com/career-ops-hq/career-ops)
(MIT) agrega ao GriffoWork — "ele foi considerado a melhor ferramenta".

### O que a análise concluiu

`career-ops` é ferramenta **local-first de CLI** (Node, v1.33.0, ~200
scripts na raiz): roda dentro de um AI coding CLI, guarda tudo em markdown
versionável ("files are canonical, databases are derived"), sem servidor no
caminho. A engenharia sustenta a reputação — suíte real, CodeQL, guarda de
SSRF que valida no momento do `dns.lookup` via `AsyncLocalStorage`, 17
traduções de README.

Mesmo domínio que o nosso, **modelo oposto**: eles são grátis e para quem
roda `node scan.mjs`; nós somos SaaS pago em 12 idiomas, para quem nunca
abriu terminal. Sobreposição de mercado pequena, de conhecimento de domínio
grande. Por isso **nada de arquitetura foi adotado** — nem arquivos-como-
banco, nem raiz plana, nem distribuição por CLI, nem o pipeline LaTeX, nem
o auto-updater, nem portar os ~100 providers em bloco (o custo real ali é
manutenção, não porte: quando um provider quebra lá um dev conserta
localmente; aqui **um cliente pagante vê vaga faltando**).

Registrado em `docs/PLANO-CAREER-OPS.md`, seis frentes ordenadas por
alavancagem no negócio.

### F1 — sinal de legitimidade da vaga (PR #70)

O buraco: `lifecycle.ts` responde se a vaga ainda **existe**; existir não é
a mesma pergunta que valer a candidatura. Banco de talentos fica aberto
para sempre e aparece em toda coleta — saudável pelo `lifecycle`, e do
outro lado um formulário sem vaga.

`assessLegitimacy()` é determinístico: sem IA, sem custo, sem campo novo.
Quatro sinais **afirmativos** — `talent_pool` (12 idiomas), `evergreen`,
`recirculated`, `thin_description`.

Duas decisões que valem além deste módulo:

**Neutro na compatibilidade por FORMA, não por disciplina.** No
`career-ops` o bloco G é "a separate, score-neutral signal that never
affects the score". Aqui foi um passo além: a saída **não tem número
nenhum** — nível (`ok`/`attention`/`suspect`) mais os motivos. Nota é
somável ao Job Fit por engano; nível não é. Há teste travando isso.

**Ausência de dado não pontua**, seguindo o que o `types.ts` já fixou
("eliminar por dado ausente transforma silêncio em rejeição"). Salário não
divulgado é a norma em boa parte dos mercados, não indício de fraude.

**A fase 2 saiu diferente do planejado, e o plano estava errado.** Estava
escrito "persistir o nível". Ao escrever, ficou claro que metade dos sinais
depende do tempo: `evergreen` depende de `now` (vaga gravada como `ok` no
dia 1 vira perpétua no dia 120 sem nada nela mudar) e `recirculated` cresce
conforme chegam irmãs. Nível gravado na coleta estaria velho na leitura
seguinte, e **dado errado no banco é pior que dado nenhum porque parece
confiável**. Nada é persistido: avalia-se na leitura, com uma consulta
agregada por lote (`legitimacy.server.ts`) e não uma por vaga. Efeito
colateral bom: sem campo novo, não dependeu de `prisma db push`.

**O que entrou em produção como comportamento é só o que o anúncio declara
sobre si**: vaga que se diz banco de talentos sai do lote do Radar.
`evergreen`, `recirculated` e `thin_description` são inferência nossa e só
vão para o log, agregados por rodada e sem nome de vaga — eliminar por
inferência antes de saber o volume é o que o §2.30 ("medir antes de
automatizar") existe para impedir: com o limiar errado ninguém descobre,
porque a vaga some do aviso sem deixar rastro.

### F2 — calibração da nota, e por que ela parou (PR #70)

`src/lib/learning/calibration.ts` responde "as suas candidaturas com nota
alta convertem mais, **para você**?". As duas regras de honestidade do
`calibrate.mjs` deles entraram como código testado: candidatura em
andamento **não é ponto de dado** (contar como fracasso pune o recente,
como sucesso lisonjeia tudo), e **nenhuma taxa abaixo do piso amostral**
("2 de 3" não é 67%) — mesma disciplina do piso de 30 vagas por país do
§2.127. Está escrito no módulo que ele **não é teste de significância**:
com dezenas de candidaturas, valor-p seria teatro.

Achado que reduziu o custo: **não precisa de modelo novo.** `RadarAlert` já
é o par (usuário, vaga) com `@@unique([userId, jobId])`, e já carrega
`overallFit`, `seenAt`, `clickedAt` e o feedback 👍/👎 do §30.

**A frente parou aqui, por decisão tomada na conversa.** Perguntado como a
pessoa registraria ter se candidatado, a resposta honesta foi que ela
**não deveria** — seria pedir escrituração ao cliente para uma métrica
nossa. O `career-ops` consegue porque o usuário dele é o dev que roda a
ferramenta. O nosso não é. A alternativa desenhada foi ler o que já flui
(`feedback`, `clickedAt`, `interviewPrepJson` como sinal de entrevista) —
mas o operador informou que **não há feedback nenhum no banco ainda,
porque a comercialização está devagar**. Com isso a F2 inteira é
prematura: é feature de **retenção**, e sem clientes ela não retém ninguém
nem pode ser validada (o piso amostral a manteria em `insufficient` por
meses). O módulo fica mesclado, sem consumidor e sem efeito em produção,
pronto para quando houver dado.

### O funil: 16 mil visitas no Instagram, ~800 na página, zero conversões

Zero é diagnosticamente diferente de baixo: com 800 visitas reais
(`page_view` é evento de cliente, e robô não executa JS), uma conversão
fraca daria *alguma* coisa. O funil já está instrumentado desde a fase 2 do
teste ATS — oito degraus em `analytics/funnel.ts`, de `page_view` a
`purchase_done`, visíveis em `/admin`. **O degrau onde zera decide o
trabalho**, e os três possíveis exigem correções completamente diferentes.
Fica registrado como pendente a leitura desse painel.

Hipótese levantada, sustentada pela própria auditoria: o §2.120 
reposicionou a landing *da vaga para a auditoria*, e o §2.124 registrou que
"vagas de emprego" tem 3 a 10× o volume de busca de qualquer termo em uso —
excluído **por decisão de direção**, tomada antes de existir tráfego para
testá-la. Se o público do Instagram procura vaga e a home abre falando de
auditoria, o descasamento de promessa explica zero melhor que fraqueza de
oferta. O operador decidiu inverter: atrair por vaga/emprego e usar a
auditoria como a ponte ("por que ninguém te responde").

### O encerramento por idade que faltava (PR #71)

Verificando se a promessa de frescor do acervo se sustentaria, dois
achados:

**`expired_by_age` estava documentado no `closedReason` do schema e não
existia em lugar nenhum do código.** Vaga nenhuma fechava por idade: uma
publicada há oito meses que a fonte ainda lista ficava aberta
indefinidamente. Não é caso raro — o adapter do JobBase documenta que o
`status` de lá é sempre `'open'` porque nada naquele pipeline expira vaga,
então o acervo inteiro dele dependia do ciclo de vida daqui, que só media
ausência.

**Idade é o fundo falso da trava do §12.** A trava impede fechar quando a
fonte não coletou na janela, porque o silêncio pode ser falha nossa — está
certa, e congela o acervo de uma fonte parada como "aberto"
indefinidamente. Idade de publicação é fato da vaga, não da nossa coleta,
então continua valendo justamente quando o outro critério desliga. Há teste
cobrindo o par: a mesma vaga que a trava recusa fechar, a idade fecha.

Implementado com corte de **120 dias**, escolhido pelo operador para
bater com "4 meses" — número de produto, não técnico: define o que o site
pode afirmar. Vaga sem `publishedAt` **nunca** fecha por idade (idade
desconhecida não é idade demais), e a borda é exclusiva, igual à de
`staleDecision`, com teste amarrando as duas.

**Efeito colateral tratado**: `EVERGREEN_AFTER_DAYS` era 120, o mesmo
corte — vaga na idade de expirar já estaria fechada e o sinal só olha vaga
aberta, então ele viraria código morto em silêncio. Baixado para 90, com
teste travando a relação entre os dois números.

Fica pendente (ver `HANDOFF-CONTINUIDADE.md`, item 0) conferir o volume da
**primeira** passada, que fecha o acumulado histórico de uma vez e pode
derrubar visivelmente a contagem do Hero D.

### Duas correções de rota registradas de propósito

A ordenação original do `PLANO-CAREER-OPS.md` assumia um funil com fluxo.
Com comercialização devagar, features de retenção são prematuras e o
gargalo é aquisição — a ordem foi revista na conversa, e a F2 pausada.

E um deslize de processo: o commit `1ecb604` (documentação) foi empurrado
direto para `main` sem branch nem PR, contrariando a regra seguida no resto
da sessão. Comunicado ao operador, que decidiu manter.

`tsc`, `eslint` e suíte — **1069/1069** ao fim da sessão (47 novos desde o
`bc5c764`) — limpos.

## 2.129 Análise do `linkedin-agent-skill`: o que não serve, e os dois furos que a comparação revelou

Pedido do operador: avaliar se
[`Jakeschincariol/linkedin-agent-skill`](https://github.com/Jakeschincariol/linkedin-agent-skill)
(MIT) daria diferencial ao GriffoWork.

### O que o repositório é

Onze skills de Claude em markdown, ~1.500 linhas de código real (dois
scripts Python e três JSON). **Não automatiza nada** por decisão explícita
do autor: o README diz que automatizar o LinkedIn viola o User Agreement e
restringe a conta, então "as skills escrevem, você posta".

### O que NÃO serve, e o porquê

Nove das onze skills são marketing de conteúdo pessoal — post, comentário,
carrossel, DM, triagem de inbox, plano semanal. Isso é produto de creator,
não de carreira: adotar seria construir um segundo produto.

E `li-profile` (auditoria de perfil do LinkedIn) **já existe aqui** desde
antes: `/api/resume/social-analysis` + `social-analysis-panel.tsx` (651
linhas), que inclusive aceita o PDF do "Mais → Salvar como PDF".

Uma primeira resposta minha ao operador ordenou o aproveitamento como
"agora: nada", raciocinando que competiria com o trabalho de funil. Estava
mal calibrado: o trabalho de funil está bloqueado no operador (os dois
números do §2.128 e o `db push` do #74), então a alternativa a construir não
era "focar no funil", era ficar parado. A ordem foi corrigida na mesma
conversa.

### Furo 1 — tag characters (#76)

Fui verificar o soft hyphen que faltava na classe de invisíveis do §2.128 e
encontrei coisa pior: `U+E0000–U+E007F`, um alfabeto ASCII inteiro
integralmente invisível, não era coberto.

Não é lacuna de cobertura — vaza **por baixo** da defesa do #75. O escape de
marcador do `wrapUntrustedDocument` supõe que o ataque esteja visível no
texto. Instrução escrita em tag characters é invisível para quem abre o
arquivo, invisível no laudo, e texto comum para o modelo: o delimitador
continua intacto e a defesa passa por cima do ataque sem vê-lo.

Nasce `src/lib/text/invisible.ts`, com **três famílias e pesos diferentes**,
porque tratá-las igual erraria nos dois sentidos:

| Família | Tolerância | Razão |
|---|---|---|
| Tag characters | zero | Nenhum editor, fonte ou idioma os produz |
| Largura zero (+ `U+061C`, `U+180E`, que faltavam) | 15 | Copiar-e-colar gera alguns |
| Soft hyphen `U+00AD` | 40, à parte | É hifenização de verdade |

O soft hyphen é a decisão que importa. Word e LibreOffice o produzem aos
montes em texto justificado; jogá-lo na família do meio transformaria
"justifiquei o texto" em acusação crítica de fraude. **Errar para cima mostra
um currículo manipulado como limpo; errar para baixo chama de fraudador quem
não é.** A tolerância reflete qual dos dois erros é pior.

Ficaram de fora os espaços **visíveis** (`U+00A0`, `U+2009`, `U+2003`), que o
levantamento de origem lista: fazem sentido para achar máquina num post, mas
num currículo seriam fábrica de falso positivo num achado crítico.

Na fronteira do prompt o contrabando é **removido**, e a remoção vem **antes**
do escape de marcador — um tag character escondido dentro do delimitador
(`<<<DOCU[tag]MENTO_DO_USUARIO>>>`) montaria o marcador depois de o escape já
ter passado. Há teste para essa ordem.

### Furo 2 — a saída gerada não tinha crivo nenhum (#77)

O `content-guard.ts` protege a **entrada**. Na **saída**, nada:
`cover-letter.ts` e `rewrite.ts` geram prosa com IA e ela vai direto para a
pessoa. O juiz de qualidade não cobre `cover_letter` (`JUDGED_TASKS` não a
inclui) e roda a 10% de amostragem, porque custa uma chamada de LLM.

O GriffoWork escrevia carta com IA sem ter como saber se ela saía com cara de
IA. Nasce `src/lib/writing/slop.ts`, determinístico e sem custo, rodando em
100% do que geramos. **A defesa é o prompt, não a detecção**: a lista de
proibidos entra no prompt da carta e nas três seções da reescrita; a medição
existe para saber se adiantou.

Quatro recusas deliberadas, escritas no módulo:

- **não reescreve** — a ferramenta pública que "humaniza" texto existe para
  derrotar detector (metade legítima, metade fraude), e troca palavra a
  palavra quebra concordância em português;
- **não devolve nota composta** — densidade é fato, nível é juízo; somá-los
  num 0–100 daria aparência de precisão a um limiar escolhido, pelo mesmo
  motivo que `jobs/legitimacy.ts` não tem número;
- **não bloqueia** — os limiares não foram calibrados contra produção, e
  reprovar a carta da pessoa com base num número chutado seria pior que não
  medir (§2.30: medir antes de automatizar);
- **não cobre idioma sem léxico** — o produto gera em 12 idiomas e isto cobre
  3. `writingLangOf` devolve nulo nos outros nove: pedir em português que o
  modelo evite expressões portuguesas num currículo alemão seria ruído no
  prompt com aparência de cuidado.

Das cinco heurísticas do `detect.py` de origem, **três** sobreviveram. A
impressão digital tipográfica não passa (travessão e aspas curvas em
currículo são normais) e a **voz por contrações não existe em português** —
"don't" é registro, "da" e "pelo" são obrigatórias.

O léxico é escrito daqui, com critério de entrada duplo: vazio de conteúdo
**e** desproporcionalmente produzido por modelo. `otimizar`, `liderar`,
`gerenciar` e `resiliência` ficaram fora, com teste que impede incluí-los
depois — acusar vocabulário profissional real trocaria detecção de clichê por
censura.

### Um defeito meu, pego pelo próprio teste

Eu descartava os clichês encontrados **junto com** as densidades quando o
texto era curto. Presença literal de clichê é fato, não inferência: o piso
protege a inferência, não o fato. Os achados passaram a ser levantados
sempre, e `judged: false` diz que o nível não é veredito.

### O contrapeso, que continua valendo

Nada disto resolve conversão. O item 0 do `HANDOFF-CONTINUIDADE.md` segue
esperando os dois números do operador: quantas vagas passam de 120 dias, e
qual etapa zera no `/admin`.

`tsc`, `eslint` e suíte — **1094/1094** no #76 e **1097/1097** no #77 (14 e
17 testes novos, cada PR medido sobre `main`) — limpos.

## 2.130 Idade basta para apagar a vaga, e a trava do laço muda para a importação

Pedido do operador, direto: *"as vagas que passaram 180 dias devem ser
deletadas, o JobBase também funciona assim"*. `agedJobPurgeWhere` deixa de
exigir `closedAt`.

### Por que não foi só apagar a condição

A exigência de `closedAt` tinha sido escrita no §2.128 justamente para evitar
um laço, e removê-la sozinha o reabriria.

O adapter do JobBase documenta que o `status` de lá é **sempre `'open'`**:
nada naquele projeto expira vaga. Logo, a vaga velha que ele ainda lista seria
apagada pelo expurgo e **recriada na coleta seguinte, com id novo**.

O estrago não é o churn. `RadarAlert` tem `onDelete: Cascade` e cai junto da
vaga, enquanto o "já avisei esta pessoa" é checado por `jobId`
(`runner.ts:667`):

```
apaga → reimporta com id novo → avisa de novo → apaga → ...
```

A pessoa seria reavisada de uma vaga que já viu — ou que já marcou 👎 — todo
dia. O §15 em laço, levando o feedback do §30 junto.

### A trava mudou de lugar, não sumiu

> Se uma vaga de 180 dias merece ser apagada, ela também não merece entrar.

`isTooOldToImport` recusa na coleta exatamente o que o expurgo apaga, com o
mesmo `DELETE_AFTER_PUBLISHED_DAYS`. Nada volta porque nada é reimportado —
sem tabela de lápide, sem migração, sem passo manual que alguém possa
esquecer. Um teste amarra as duas funções: mexer numa sem mexer na outra
reabre o laço, e a suíte passa a dizer isso em voz alta.

### O que ficou decidido junto, e não era óbvio

- **A guarda vale só para vaga NOVA.** Vaga já existente segue sendo
  atualizada mesmo velha — parar de atualizar faria a fonte parecer que a
  perdeu de vista, e isso é o §12.
- **`publishedAt` nulo entra e não é apagado**, dos dois lados. Idade
  desconhecida não é idade demais, a mesma regra do `types.ts`.
- **O limite exato não elimina** (180 dias cravados ainda passa), mesma
  convenção do `staleDecision`.
- **`CollectionRunResult` ganha `skippedTooOld`.** Recusa silenciosa numa
  coleta é indistinguível de fonte vazia, e o §12 existe para impedir
  exatamente esse tipo de confusão.

Um comentário sobreviveu por outro motivo, e foi corrigido: o critério
repetido dentro da transação do expurgo existia para pegar vaga *reaberta*
entre a leitura e o apagamento (`closedAt: null`). Com o `closedAt` fora do
critério isso deixou de valer — mas o caminho de *update* da coleta grava o
`publishedAt` que a fonte mandou, e uma correção na origem pode rejuvenescer a
vaga nesse intervalo. A guarda continua certa; a justificativa estava errada.

### O que esperar na primeira rodada

O expurgo apaga em lotes de 100 com teto de 20 por execução — 2.000 vagas por
rodada. Acúmulo maior que isso drena ao longo de alguns dias em vez de num
golpe só, o que é desejável: dá tempo de ver o número antes de ele sumir.

**Vale conferir a contagem pública do Hero D depois da primeira rodada**,
porque agora sai também a vaga velha que a fonte insiste em listar —
categoria que, até aqui, só ficava invisível ocupando linha no banco.

`tsc`, `eslint` e suíte — **1139/1139**, 5 novos — limpos.

## 2.131 O expurgo nunca teve gatilho, e a documentação que eu escrevi dizia que tinha

Operador mandou rodar o cron para ver o primeiro expurgo. Ele rodou: 269 vagas
novas coletadas, última coleta registrada. E **nada foi apagado** — as 287
vagas acima de 180 dias continuaram lá, `RadarOfferLog` com zero linhas.

### A causa

O cron do Radar chama `closeStaleJobs`, que **encerra** vaga parada (marca
`closedAt`). Quem **apaga** por idade é `purgeAgedJobs`, alcançável apenas por
`runRetentionPurge` — e essa função tinha um único chamador em todo o código:
`POST /api/admin/retention`, acionado por um humano clicando no painel. O
comentário daquela rota dizia, com todas as letras, que o agendamento "fica
como passo operacional, não de código". Ficou, e não aconteceu.

**A documentação errada é minha.** No §2.130 eu reescrevi o item 0 do handoff
para o mecanismo novo e mantive a frase "o gatilho é o cron do Radar", herdada
da versão do `expired_by_age` (#71, revertido) — aquele *de fato* rodava dentro
do `runRadar`. Troquei o conteúdo e não verifiquei o gatilho. É exatamente o
erro que o §2.130 existia para corrigir, repetido dentro do próprio texto que o
corrigia.

### O que estava em jogo além da faxina

`runRetentionPurge` não limpa só vaga. É ela que aplica os tetos de retenção de
**dado pessoal**: currículo de conta inativa (730 dias), log de IA (365),
trilha de auditoria (730), evento de webhook (90) e o histórico de ofertas do
Radar. Uma política de retenção que depende de alguém lembrar de clicar não é
política, é intenção — e é ela que o `/privacy` descreve publicamente nos 12
idiomas.

### A correção

`/api/cron/retention`, com a mesma forma das outras rotas de cron, inclusive na
parte que importa: **503 quando falta `CRON_SECRET`**, nunca 200 aberto.

Duas decisões que não eram óbvias:

- **Não entrou no `vercel.json`.** O plano Hobby agenda dois crons e os dois
  estão ocupados (`radar` 06:00, `dedup` 18:00). Um terceiro ali não falharia
  ruidosamente — seria ignorado, que é o mesmo tipo de armadilha que estamos
  fechando. O gatilho é GitHub Actions (`retention-daily.yml`, 09:00 UTC), pelo
  precedente do §2.101.
- **Não foi pendurada no cron do Radar.** Orçamento: o Radar divide 60s entre
  coleta, avaliação e digest, e `purgeAgedJobs` sozinho pode gastar quase tudo
  (até 20 transações de 20s). Somar as cargas faria as duas terminarem pela
  metade, e a cortada seria sempre a última.

A rota devolve **500 quando qualquer etapa falhou**, mesmo com as outras
verdes: `runRetentionPurge` isola cada etapa e nunca lança, então um 200 faria
o workflow passar verde sobre uma retenção quebrada.

### O teste que generaliza o bug

`cron-triggers.test.ts` afirma que **toda rota em `api/cron/` é chamada por
alguém** — `vercel.json` ou algum workflow. Rota de cron sem gatilho não falha,
não avisa, não aparece em log: só não acontece. O teste foi verificado por
mutação (quebrar o caminho no workflow faz o caso 1 reprovar).

Mais três invariantes no mesmo arquivo: o teto de dois crons do Hobby, toda
rota de cron passando por `cronAuthorized` **e** fechando com 503, e o Radar
não chamando `runRetentionPurge`.

### Os números, medidos antes e depois da rodada

| | antes | depois da coleta |
|---|---|---|
| Acima de 180 dias | 287 | 287 (nada apagado — era o bug) |
| Home (Hero D) | 10.631 | 10.900 |
| Linhas totais | 11.111 | 11.380 |

Um sinal bom escondido aí: as 287 **não aumentaram** depois de importar 269
vagas. O `isTooOldToImport` do §2.130 está funcionando — nenhuma vaga velha
entrou pela coleta.

`tsc`, `eslint` e suíte — **1143/1143**, 4 novos — limpos.

## 2.132 Foco de venda invertido: "envie seu currículo, a gente mostra as oportunidades" — decisões do operador e plano

Esta seção é a marcação que o operador pediu para encontrar ("falamos sobre
alterar o foco da venda para atrair leads"). A decisão de origem já estava no
§2.128 — *"O operador decidiu inverter: atrair por vaga/emprego e usar a
auditoria como a ponte"* —, mas ficou uma frase dentro de outra seção, sem
plano nem decisões de produto. Aqui ela ganha as duas coisas. **Nenhum código
mudou nesta seção**: é registro de decisão, com os números que a sustentam.

### O dado que decide a ordem do trabalho

Leitura do funil que o §2.128 deixou pendente (`AnalyticsEvent`, 30 dias até
23/09/2026, pessoas distintas por `visitorId`/`userId`):

| Degrau | Pessoas |
|---|---|
| `page_view` | 925 |
| `pricing_viewed` | 17 |
| `ats_check_done` | 2 |
| `checkout_initiated` | 2 |
| `cv_uploaded`, `signup_done`, `preview_viewed`, `purchase_done` | nenhum evento registrado |

O funil **zera no primeiro gesto**, não no preço: 0,2% dos visitantes fazem o
teste grátis e ninguém envia currículo. Não é oferta fraca — a pessoa não chega
a ver a oferta. Isso decide que a mudança começa pela porta (fase 1), e não
pelo preço (fase 2).

### A ideia, e por que ela resolve a tensão do §2.84/§2.124

Em vez de a pessoa caçar vaga, ela envia o currículo e o produto mostra as
oportunidades que combinam com ela. O §2.84 e o §2.124 excluíram "vagas de
emprego" porque "quem busca vaga quer um quadro de vagas, não a auditoria". A
inversão atende exatamente isso: quem busca vaga **recebe vaga**, e a
auditoria aparece como o caminho até ela — a "ponte" do §2.128. É também o
fluxo que `job-fit.ts` já documenta como "a inversão do §19" (currículo →
perfil → vaga encontrada → match → currículo adaptado).

Comparação de mercado discutida (de conhecimento geral, não verificada ao vivo
nesta sessão): LinkedIn (vaga pública, candidatura e Premium atrás de login),
Indeed/Jooble/Talent.com (tráfego de vaga, monetização do lado da empresa),
Gupy (portal de vagas como captura para o ATS B2B), Catho (vaga visível,
assinatura do candidato), Jobscan/Teal (vaga + nota de compatibilidade do
currículo — o análogo mais próximo do Griffo).

### Decisões do operador (23/09/2026)

1. **Chamada**: *"Procurando emprego? Envie seu currículo e descubra as
   oportunidades que combinam com você."* — "oportunidades" em vez de "vagas"
   para casar com o Hero D (§2.120). A proposta do operador ("…Encontra as
   oportunidades…") foi ajustada por gramática (verbo sem sujeito). "Vagas"
   continua nos metadados e no texto de apoio: é a palavra que se busca.
2. **Grátis = uma oportunidade completa**, e a chamada *"Há mais oportunidades
   com o seu perfil — a GriffoWork encontrou mais para você"*. O resto é pago.
3. **Lista completa só para quem paga.** E-mail capturado **no envio** do
   currículo ("receba seu resultado"), não para destravar a lista — assim quem
   não compra na hora continua alcançável pelo Radar.
4. **Isca quantificada, sem revelar a correção**: *"Encontramos N pontos que
   reduzem sua visibilidade nos sistemas de triagem — X em palavras-chave, Y em
   formatação, Z em experiência. Corrigir pode aumentar suas chances de ser
   chamado para entrevista."* Os números vêm do diagnóstico real daquele
   currículo. Frase genérica mostrada a todo mundo ("seu currículo pode ser
   melhorado") foi **descartada**: é afirmação que não se sustenta quando o
   currículo já é bom — CDC art. 37, §17 e "nunca invente nada".
5. **Não entregar o ouro**: `targeted_changes`, reescrita e carta nunca
   aparecem de graça. O grátis é a prova de competência (1 vaga) e o tamanho
   do problema (a contagem do item 4).
6. **Isto vem antes da home**: o envio do currículo vira o hero; o Hero D
   desce para explicação logo abaixo. As 41 rotas `/[country]` seguem SSG —
   o envio é componente de cliente — e a página mantém texto indexável.
7. **Passe 24h a US$ 2,60** (preço de referência), **sem Análise Completa**:
   lista completa de oportunidades com match, diagnóstico por vaga e 2 buscas
   ao vivo. A Análise Completa, a reescrita e a orientação profissional ficam
   no Essencial (R$ 19,90) e no Trimestral. O passe é degrau deliberado para o
   Essencial ("por mais R$ 5, a análise completa") — escolha do operador para
   "forçar" o Essencial.

Uma versão do passe **com** Análise Completa a US$ 2 foi descartada por três
razões já codificadas: violaria `ANALYSIS_FLOOR_USD = 2.6`; inverteria a
escada contra o Essencial (mesmo motivo da saída do `pack5`); e a taxa fixa por
transação pesa demais num pagamento de US$ 2.

### Custos de IA medidos (`AiLog`, 60 dias, só chamadas bem-sucedidas)

Funil grátis, por pessoa que envia o currículo:

| Etapa | Modelo | Custo médio |
|---|---|---|
| Extração de texto do PDF | nenhum | US$ 0 |
| OCR (só PDF escaneado) | Sonnet 5 | US$ 0,057 (p90 US$ 0,086) |
| `profile_extraction` | DeepSeek | US$ 0,008 |
| `free_preview` | DeepSeek | US$ 0,0014 |
| Teste ATS público | nenhum (regra) | US$ 0 |
| `matchJob` (cruzamento com vagas) | nenhum (determinístico) | US$ 0 |

**~US$ 0,01 por pessoa, ~US$ 0,07 com OCR.** Mostrar oportunidades com match
não custa IA; o risco de custo é abuso, e o limite por IP de
`ats-check/quota.ts` precisa valer também para o envio novo.

Análise Completa: 5 × `analysis_segment` (US$ 0,036) + `rewrite` (0,029) +
`career_orientation` (0,034) + `social_advice` (0,023) + `cover_letter`
(0,032) ≈ **US$ 0,30–0,36 de IA**. O `ANALYSIS_DIRECT_COST_USD` de US$ 1,04 é
conservador de propósito (overrun de 1,6×, 8% de retry, suporte e infra).

O passe, sem análise, custa ~US$ 0,01 de IA mais a taxa do meio de pagamento.

### O que ficou pendente de decisão

- **Preço local do passe fora do Brasil.** O Essencial não é US$ 9,90 em todo
  lugar: a âncora é US$ 9,90 na Faixa 1, 6,90 na 2, **3,70 na 3 (R$ 19,90)**
  e 2,90 na 4. US$ 2,60 fixo funciona como degrau onde o Essencial é barato
  (Brasil: ~R$ 14,90 contra R$ 19,90), mas na Faixa 1 fica a um quarto do
  Essencial e passa a competir com ele. Opções: US$ 2,60 fixo em todas as
  faixas, ou proporcional ao Essencial de cada faixa. Invariante que o teste
  do catálogo deve ganhar em qualquer caso: **passe < Essencial em toda
  moeda**.
- **Licença das fontes para acesso PAGO à lista.** Cruzar vaga com currículo
  internamente é um uso; vender acesso à lista agregada é outro. Os termos da
  API do Adzuna e a origem do que chega via JobBase (InfoJobs, Catho) precisam
  ser conferidos antes do lançamento do passe. Decisão do operador, não
  técnica.
- **LGPD do visitante**: currículo de quem não tem conta precisa de base legal
  e prazo de retenção declarados em `/privacy` (12 idiomas) antes da fase 1 ir
  ao ar.

### As três respondidas pelo operador (23/09/2026, mesma conversa)

1. **Preço do passe: proporcional por faixa.** A razão é a que o operador fixou
   no Brasil — US$ 2,60 contra os US$ 3,70 do Essencial, **~70%**. Aplicada a
   cada faixa: Faixa 1 ≈ US$ 6,90 (Essencial 9,90), Faixa 2 ≈ US$ 4,90 (6,90),
   Faixa 3 = R$ 14,90 (19,90), Faixa 4 ≈ US$ 2,00 (2,90). Os valores locais
   arredondados saem na fase 2, com o teste da escada. A Faixa 4 precisa ser
   conferida contra a taxa fixa do meio de pagamento (`payment-methods.ts`
   registra que ali ela pesa) antes de fechar.
2. **Fonte das vagas: JobBase, com nome e link da vaga.** Decisão do operador:
   as vagas vêm do JobBase (projeto irmão), e cada oportunidade exibida leva
   o título, a empresa e o link de candidatura da origem (`Job.applicationUrl`).
   A candidatura nunca acontece dentro do Griffo.
3. **Currículo do visitante: a pessoa escolhe.** Ou os dados são apagados em
   24 horas, ou ficam guardados para empresas a encontrarem. As duas opções são
   gratuitas. Pela LGPD, a opção pré-marcada é a que protege mais: **apagar em
   24 horas**. Guardar exige marcação ativa. Consequência aceita: quem escolhe
   apagar sai também da base de e-mails, então o Radar só alcança quem escolheu
   guardar (ou quem cria conta). A consulta por empresas ainda não existe como
   produto: `User.recruiterOptIn` e `Organization.marketplaceEnabled` estão no
   schema, mas nenhum código lê o opt-in hoje. O texto da opção diz "para que
   empresas possam te encontrar", sem prometer que já estão procurando.

### Plano

- **Fase 1 — a porta** (não depende de preço): hero de envio em `/[country]`,
  e-mail no envio, `profile_extraction` + `matchJob`, uma oportunidade completa,
  contagem trancada e isca quantificada; eventos de funil novos para os degraus
  novos; limite por IP; copy com o português como fonte, depois os 12 idiomas
  pelo `translation-reviewer`.
- **Fase 2 — o passe**: SKU de 24h no catálogo com preços locais, direito de
  acesso de 24h (lista + diagnóstico + 2 buscas), checkout, e o teste da escada.
- **Fase 3 — a volta**: Radar para os leads com e-mail (novas oportunidades,
  lista trancada) e o degrau passe → Essencial.

## 2.133 Fase 1 do foco invertido: o envio de currículo vira a porta da landing

Implementação da fase 1 do §2.132, com as decisões de produto daquela seção.
**Exige `prisma db push` antes do deploy** (tabela nova `VisitorLead`) — ver
"Para ir ao ar", no fim.

### O fluxo

1. O topo da landing (antes do Hero D, em `/` e nas 41 rotas `/[country]`)
   passa a ser `components/landing/match-hero.tsx`: *"Procurando emprego? Envie
   seu currículo e descubra as oportunidades que combinam com você."* — PDF ou
   texto colado, e-mail, e a escolha LGPD (apagar em até 24h, pré-marcada; ou
   guardar para empresas, marcação ativa).
2. `POST /api/public/match-preview` reserva a cota (1 por pessoa a cada 24h,
   por navegador e por hash de IP, o mesmo esquema do teste ATS), lê o PDF sem
   OCR, roda o teste de legibilidade (sem IA), grava a linha e responde. O
   resto roda em `after()`.
3. `processLead` (`lib/match-preview/server.ts`) lê o perfil com IA, cruza com
   as vagas pelo **mesmo pipeline do Radar** e manda o e-mail de resultado.
4. A tela consulta `GET /api/public/match-result/[token]` a cada 2s. O token
   vai para a URL (`?lead=`), que é também o link do e-mail.

### Decisões de implementação que não eram óbvias

- **Um pipeline só.** O trecho de `runForUser` que lê as vagas, descarta banco
  de talentos, aplica o filtro duro e roda `matchJob` virou
  `evaluateOpenJobsForProfile` (`radar/runner.ts`), usado pelo Radar e pelo
  visitante. A régua é a do Radar: `curate` com `minimumFit: 'good'`. As 28
  verificações do Radar passaram sem alteração depois da extração.
- **Modelo rápido para quem espera na tela.** A extração de perfil das contas
  leva **~53s na mediana** no DeepSeek Pro (`AiLog`: p50 52,8s, máx. 77s).
  Tipo novo `lead_profile_extraction`, roteado ao Claude com `modelOverride`
  Haiku 4.5. O prompt foi movido para `profileExtractionSystemPrompt` em
  `profile/extract.ts`, compartilhado pelas duas extrações, com o texto
  intacto.
- **A lista trancada é trancada no servidor.** `buildPublicResult` devolve a
  vaga grátis inteira e, das outras, só a contagem (e quantas são de alta
  compatibilidade). Não saem `evidence` nem `gaps` do `MatchResult`: são
  frases em português e são o diagnóstico que se vende. Teste trava isso.
- **A isca vem do teste ATS determinístico**, agrupada em quatro categorias
  grossas (`rules.ts`). "Pode aumentar suas chances" só aparece com pelo menos
  um ponto achado; currículo sem problema recebe "é bem lido". Nenhum número
  ou porcentagem de chance (§17), verificado por teste nos 12 idiomas.
- **24 horas, de verdade.** A linha vence em 22h, a leitura recusa linha
  vencida desde o primeiro segundo, e `/api/cron/visitor-leads` apaga de hora
  em hora (`.github/workflows/visitor-leads-hourly.yml`, fora do
  `vercel.json` pelo limite de dois crons do Hobby). A retenção diária também
  apaga, como reserva. Quem escolhe apagar **nem tem o texto do currículo
  gravado**: é processado em memória. Quem escolhe guardar fica 730 dias.
- **Falha nossa devolve a cota.** Se o processamento em segundo plano falha
  (IA fora do ar), a reserva do dia é apagada — sem isso o "enviar de novo"
  bateria no limite. Achado no teste de navegador, não no código.
- **Prefixos de limite separados.** O envio tem 3/10min; a consulta, que é
  chamada a cada 2s, tem prefixo próprio com 300/10min — o defeito que o
  cabeçalho de `rate-rules.ts` registra (status herdando o limite da rota pai).
- **Um `h1` por página.** O título do Hero D virou `h2`.
- **Plural.** "Há mais 1 oportunidades" apareceu no teste; nascem as chaves
  `lockedTitleOne`, `lockedStrongOne` e `emailBodyOne` nos 12 idiomas.

### Custo

Funil grátis por envio: US$ 0 para PDF com texto até a IA; extração no Haiku
4.5 (estimativa pela tabela de `pricing.ts`, ~4k tokens de entrada e ~0,5k de
saída: menos de US$ 0,01); cruzamento com vagas sem IA. O número medido virá
do `AiLog` com `taskType = 'lead_profile_extraction'`.

### O que foi verificado, e como

- `tsc`, `eslint` e suíte — **1160/1160** (17 novos em
  `match-preview.test.ts`), incluindo `cron-triggers.test.ts` com a rota nova.
- `next build` e `next start` contra um **Postgres local** com o schema novo
  (`db push` local) e cinco vagas semeadas. O pipeline real de cruzamento,
  rodado com um perfil de analista de dados, devolveu as três vagas de dados
  como `strong` e descartou a de enfermagem como `weak`.
- Navegador (Chromium, 1280px e 390px, português e árabe): formulário, envio
  de PDF gerado na hora, falha por falta de chave de IA local e "enviar de
  novo" sem bater no limite, tela de resultado (com o resultado gravado
  manualmente no banco local, porque sem chave de IA a extração não roda
  aqui), zero rolagem horizontal, `rtl` correto.
- Leitura de token vencido e malformado → 404 igual; cron sem segredo → 401;
  com segredo → apagou a linha vencida.

**Não verificado**: a extração real no Haiku e o e-mail real no Resend — este
ambiente não tem as chaves. É o primeiro envio em produção que vai prová-los.

### O que ficou para depois

- **Fase 2 (o passe de 24h)**: o botão "ver todas as oportunidades" leva por
  ora ao cadastro (Essencial/Trimestral).
- **Ligar o envio à conta**: quem se cadastra depois com o mesmo e-mail ainda
  envia o currículo de novo.
- **Limite de corpo da Vercel (~4,5 MB)** abaixo dos 5 MB anunciados — o mesmo
  vale desde sempre para o teste ATS; um PDF entre ~3,3 e 5 MB falha na
  plataforma antes de chegar à rota.

### Para ir ao ar

1. `npx prisma db push` (cria `VisitorLead`) e `npm run db:rls` (liga RLS na
   tabela nova — o laço do `rls.sql` pega sozinho).
2. Só então o merge. Antes disso, o envio responde erro genérico e o workflow
   horário falha a cada hora (sem apagar nada, porque não há o que apagar).

## 2.134 Todo PDF virava "sem texto" em produção: o rastreador não levava o canvas nem o worker do pdfjs

Achado no primeiro envio real da landing (§2.133), feito pelo operador com o
próprio currículo: nota de legibilidade **5/100** — exatamente a penalidade de
`no_text` —, perfil insuficiente, nenhuma chamada de IA, nenhuma vaga. O único
outro teste ATS com PDF já feito em produção (17/09) também deu 5; os feitos
com texto colado deram notas normais. Dois PDFs em dois não era coincidência.

### A causa, reproduzida

O pdfjs (dependência do `pdf-parse`) carrega duas coisas por caminho montado
em tempo de execução: `@napi-rs/canvas` (via `createRequire`, de onde vem o
`DOMMatrix`) e `pdf.worker.mjs` (`import("./pdf.worker.mjs")`). O rastreador
da Vercel só copia para a função o que é importado de forma estática — e o
`.nft.json` das rotas não tinha nenhum dos dois. Sem o canvas, o `pdf.mjs`
lança já na carga (`new DOMMatrix()`); o `catch` de `parsePdfBuffer` devolve
string vazia, e o PDF passa por "sem texto selecionável". Local funcionava
porque `node_modules` está inteiro.

Reprodução: copiar **só** os arquivos rastreados da rota `ats-check` para uma
pasta e ler um PDF com texto → falha na carga. Acrescentar o canvas → falha no
worker. Acrescentar os dois → 1.624 caracteres. Os dois são necessários.

### O custo que isso escondia

O upload pago cai na transcrição por imagem quando a extração local vem vazia
— `ocr_extraction` no Sonnet, ~US$ 0,057 e mais lento. O `AiLog` já mostrava
11 transcrições em 60 dias para ~21 análises: boa parte deve ter sido PDF com
texto pago como se fosse imagem. A conferir depois do deploy: essa contagem
deve cair.

### A correção

`outputFileTracingIncludes` em `next.config.ts`, **só nas 5 rotas que
importam `lib/pdf-text`** (`PDF_ROUTES`), com o canvas, o binário
`canvas-linux-x64-gnu` e o worker (`PDF_RUNTIME_FILES`). Não em `/api/**`: o
binário pesa ~30 MB, e o armazenamento de funções é o limite do §7.12 — são
~160 MB a mais por deployment, contra os 328 MB de hoje.

`pdf-routes.test.ts` falha se uma rota passar a importar `lib/pdf-text` sem
entrar na lista, ou se a lista perder o canvas ou o worker.

Verificado: `next build`, `.nft.json` das 5 rotas com os dois arquivos (e
`resume/analyze`, que não lê PDF, sem eles), e a mesma reprodução só com os
arquivos rastreados lendo o PDF nas rotas `ats-check`, `match-preview` e
`upload`. `tsc`, `eslint` e suíte — **1163/1163**, 3 novos.

## 2.135 Primeiro envio real da landing: o PDF foi lido, e nenhuma vaga "combinou" — três causas, uma corrigida

**Contexto.** 23/09/2026, depois do deploy do §2.134. O operador reenviou o currículo em griffo.work: currículo de uma coordenadora de unidade de análises clínicas, 13 anos, pós-graduação, BR. Resultado: legibilidade 73/100 (o PDF agora é lido), 4 pontos no teaser, e "Ainda não encontramos uma oportunidade forte para o seu perfil".

**O que o banco mostrou.** `VisitorLead` `ready` em 7s, perfil extraído certo, `matchesJson` vazio, e-mail enviado. `AiLog`: `lead_profile_extraction` com `status: failover`, custo US$ 0,0015, respondido pelo `deepseek-flash`. O `AuditLog` do failover diz por quê:

> CLAUDE (claude-haiku-4-5): ERR ([Claude API 400] output_config.format.schema: Invalid schema: Enum value 'intern' does not match declared type '['string', 'null']') após 525ms

### Causa 1 — corrigida aqui: o esquema da extração é recusado pelo Claude

`PROFILE_EXTRACTION_JSON_SCHEMA` declarava `seniority` e `educationLevel` como `{ type: ['string','null'], enum: [..., null] }`. A API do Claude recusa essa forma; toda extração da landing caía no suplente. O mesmo esquema é o da extração de conta, cujo primário é o DeepSeek (que recebe só `json_object`), então lá o defeito ficava escondido — só apareceria no dia em que o fallback fosse o Claude.

Correção: `anyOf: [{ type: 'string', enum }, { type: 'null' }]`. Teste em `extract.test.ts` impede voltar a combinar `enum` com `type` em lista.

Observação menor, não corrigida: o `AiLog.primaryModel` registra o modelo do painel (`claude-sonnet-5`), não o `modelOverride` efetivamente tentado (`claude-haiku-4-5`). O diagnóstico do `AuditLog` tem o nome certo.

### Causa 2 — estrutural, NÃO corrigida: nenhuma vaga aberta lista requisitos

Contagem em produção, vagas abertas: BR 6.084 com `requirements` preenchido = **0**, `skills` = **0**; US, GB, AU, GLOBAL idem. Só 401 vagas sem mercado têm `skills`. `intelligenceJson` vazio em todas.

Consequência em `matchJob`: sem requisito, `jobFitAxis` devolve 50 sem evidência, e a regra comentada em `matchJob` (o perfil de gestão hospitalar que recebeu "Analista de Dados") manda o desfecho para `partial` sempre que o cargo não for **confirmado** como o mesmo. Hoje, portanto, o único caminho para `good` é `confirmedSameRole`.

### Causa 3 — estrutural, NÃO corrigida: a taxonomia de cargos tem 12 conceitos

`isSameRole` só confirma cargo quando os dois títulos caem num dos 12 conceitos (`data_analyst`, `software_engineer`, `nurse`, `project_manager`…). Das 6.068 vagas BR frescas, **5.523 (91%) não caem em conceito nenhum**. "Coordenadora de Unidade" (perfil) e "Coordenador de Unidade" (vaga) são dois desconhecidos, e dois desconhecidos não são o mesmo cargo.

Somando 2 e 3: fora desses 12 cargos, **nenhum** perfil recebe oportunidade na landing — nem no Radar de quem paga. Reproduzido localmente: as 47 vagas BR de saúde/laboratório/coordenação, com o perfil deste envio, saem todas `partial`/`stretch`.

### Agravante — o teto de 500

`openJobsWithinBudget` avalia as 500 vagas mais recentes do mercado (`MAX_JOBS_PER_USER`). O BR tem 6.068 frescas; a primeira vaga de laboratório está na posição 1.068. Mesmo com as causas 2 e 3 resolvidas, este perfil nunca veria essas vagas.

### Decisão pendente do operador

Não é correção pontual: muda o que "combina" significa para o produto inteiro. Opções em ordem de custo:

1. **Requisitos da descrição, sem IA** — quando a vaga não lista requisito, procurar as competências declaradas no texto da descrição e contar como evidência ("a descrição menciona Hematologia"). Barato, determinístico; risco de falso positivo com competências genéricas (5S, Workflow).
2. **Extração de requisitos por IA na ingestão** — preencher `requirements`/`skills` uma vez por vaga (DeepSeek Flash, da ordem de US$ 0,0005 por vaga, ~US$ 3 para o estoque atual). Resolve a causa 2 de verdade, para landing e Radar.
3. **Similaridade de título para cargos fora da taxonomia** — títulos normalizados (sem gênero, acento, senioridade) iguais contam como mesmo cargo. Resolve "Coordenadora/Coordenador de Unidade", mas "Coordenador de Unidade" de academia não é o de laboratório: sem a área, erra.
4. **Pré-filtro por área antes do teto de 500** — gastar o orçamento nas vagas cujo título ou descrição toca a área do perfil, e não nas mais recentes.

Recomendação: 2 + 4. A 2 é a que torna a nota honesta e medível; a 4 impede que o teto esconda o que existe.

## 2.136 Opções 2 e 4 do §2.135: a ficha da vaga por IA e o teto de 500 gasto por área

**Decisão do operador (23/09/2026):** seguir com a extração de requisitos por IA (opção 2) e com o teto de 500 gasto pela área do perfil (opção 4). Perguntou também de quem era a falha das descrições ausentes.

### De quem é a falha — medido nos dois bancos

| Brasil, vagas abertas | Total | Com descrição ≥ 200 caracteres |
|---|---|---|
| JobBase · InfoJobs | 4.845 | 0 |
| JobBase · Catho | 1.627 | 0 |
| JobBase · Adzuna | 1.000 | 919 (cortadas em 500 pela API da Adzuna) |
| JobBase · Gupy | 259 | 259 (mediana 2.378) |
| JobBase · SmartRecruiters | 44 | 0 |

- **Do JobBase (a maior parte):** os coletores de InfoJobs e Catho não guardam descrição — 6.472 das 7.775 vagas BR dele. Nenhuma mudança no Griffo resolve isso.
- **Nossa (a menor):** `SELECT_COLUMNS` do adapter nunca pediu `description`. Perdíamos as ~1.178 descrições BR que o JobBase tem (e as ~4.166 longas, de Greenhouse/Lever/Ashby, das vagas sem país). Corrigido aqui.
- As 4.312 vagas do JobBase no nosso banco com `description` nula são, portanto, quase todas InfoJobs/Catho: continuarão sem texto depois desta correção.

### Opção 2 — a ficha da vaga (`lib/jobs/intelligence.ts`, `intelligence.server.ts`)

É o §27 ("inteligência da vaga, uma vez por vaga"), que o schema já previa em `Job.intelligenceJson` e nunca foi feito.

- **Tarefa de IA própria, `job_intelligence`**, primário DeepSeek (maquinário interno, barato), `internal: true` (fora do juiz por amostragem). O agente de qualidade a trata ANTES do piso de 50 caracteres: `{"requirements":[],"skills":[]}` é resposta certa para anúncio sem nada técnico, e reprovar mandaria o roteador atrás de uma lista inventada.
- **Formato do matching:** termos curtos (1–4 palavras), no idioma do anúncio, no máximo 8 por lista — `intersectSkills` compara por inclusão de texto, e a nota é `atendidos / pedidos`. Sem comportamentais, benefícios, tempo de experiência. Item repetido entre as listas fica só em `requirements`, para não contar duas vezes.
- **Anúncio é dado de terceiros:** vai por `wrapUntrustedDocument`, como o currículo. Cortado em 6.000 caracteres.
- **Grava onde o matching já lê** (`requirements`, `skills`); `intelligenceJson` guarda só o marcador `{ v, at, status }` — `ok`, `too_short` (menos de 200 caracteres, sem chamar IA) ou `unparseable` (pagou e não leu; não relê). Falha de provedor NÃO marca: a vaga volta na próxima rodada; 3 falhas seguidas encerram a rodada.
- **Recoleta não apaga a ficha:** `rowFor` grava `"[]"` quando a fonte não manda lista, e a atualização diária sobrescreveria o que foi extraído — sem que a extração relesse, porque a vaga já está marcada. `keepExtractedLists` só deixa a recoleta escrever lista quando a fonte mandou uma.
- **Gatilho:** `/api/cron/job-intelligence`, a cada 30 min por `.github/workflows/job-intelligence.yml` (Hobby: os dois crons da Vercel estão ocupados). Cada rodada inicia leituras até ~27s e termina até ~52s (orçamento de 25s por chamada), 6 simultâneas, mais recentes primeiro, e responde quantas faltam — da ordem de 30–60 vagas por rodada, ~1.500–2.900 por dia.
- **Custo estimado:** ~US$ 0,0005–0,001 por vaga (DeepSeek Flash, ~1,2 mil tokens de entrada). Estoque atual com descrição, mais o que o JobBase passa a mandar: da ordem de US$ 2–8, uma vez. Depois, ~230 vagas novas/dia ≈ US$ 0,10–0,20/dia. A conferir no `AiLog` depois da primeira rodada.

### Opção 4 — o teto de 500 gasto por área (`lib/matching/area-terms.ts`, `openJobsWithinBudget`)

Mesmo raciocínio do comentário existente ("a mudança é de ORDEM, não de escopo"), um nível abaixo: dentro do mercado, as camadas agora são (1) título toca a área, (2) descrição ou ficha toca a área, (3) o resto do mercado por data, (4) o resto do mundo. Nada sai do lote por não casar; filtro duro e `matchJob` continuam decidindo.

- Termos = frases inteiras do perfil (cargos, área, especializações, competências), com e sem acento, mínimo 4 caracteres; frases, não palavras, porque "gestão" sozinha está em milhares de vagas.
- Medido em produção para o perfil do §2.135: a camada de texto acha 245 vagas BR (entre elas "Coordenador de Aférese Terapêutica (TMO)" e "Enfermeiro Supervisor Medicina Diagnóstica"), em ~1,4s de varredura. Aceitável para a landing (roda em `after()`) e para o Radar com a base de usuários atual; se crescer, o caminho é um índice trigram (`pg_trgm`) em `title`/`description`.
- Verificado localmente com vagas semeadas: as vagas da área saem antes da mais recente de outra área.

### O que continua sem solução

As vagas sem descrição (InfoJobs/Catho, ~71% do Brasil) não ganham ficha. Para elas o único sinal segue sendo o cargo — a opção 3 do §2.135, que fica para decisão futura. Também sem solução aqui: a taxonomia de 12 cargos.

## 2.137 O JobBase fez a sua parte: vaga encerrada, texto limpo, seção de requisitos — e o Griffo passa a usar

**Contexto.** 23/09/2026, depois do §2.136. O operador levou à IA do JobBase um pedido com seis itens para reduzir o que pagamos na ficha da vaga. Conferido direto no banco do JobBase:

| Item pedido | Estado | Medido |
|---|---|---|
| Marcar vaga encerrada | ✅ | 7.228 `expired`, 9.035 `open` (antes: 16.263 `open`, 9.650 sem ser vistas há ≥3 dias) |
| `description_text` sem HTML | ✅ | 100% das que têm descrição; 0 com marcação |
| `requirements_text` (seção de requisitos, sem IA) | ✅ | Greenhouse 1.983/2.085 (média 1.426 caracteres, contra 6.475 do texto inteiro), Ashby 263/284, Lever 53/54, Gupy 77/84, Remotive 15/22; Adzuna 0 (trecho de 500 caracteres, sem seção) |
| `content_hash` | ✅ | 118 grupos repetidos, 374 linhas |
| Descrição onde faltava | parcial | InfoJobs, Catho e LinkedIn continuam sem (esperado: termos de uso). **SmartRecruiters também continua sem** (251 abertas), embora a API oficial permita — pendência a devolver ao JobBase |
| Leitura pela chave publicável | ✅ | colunas novas com `SELECT` para `anon`; a única policy é de leitura |

### O que muda no Griffo

- **Adapter lê `description_text`**, não `description`: texto limpo é token a menos na extração.
- **Paginação com ordem fixa** (`order=id.desc`). Sem ordem, o PostgREST devolve na ordem física, que muda a cada escrita: vaga saindo em duas páginas e outra em nenhuma. E com 9 mil abertas contra 5 páginas de mil por rodada, a ordem decide quem fica de fora — as mais antigas.
- **A extração usa `requirements_text` quando ela tem ≥ 60 caracteres** (`pickExtractionText`), e cai na descrição inteira quando não. É buscada no JobBase na hora da extração, uma requisição por fonte de origem por lote (`fetchJobBaseRequirementTexts`), e não guardada na coleta: guardar pediria coluna nova em `Job`, e toda leitura de `Job` sem `select` quebraria entre o deploy e o `db push`. Falha de rede devolve mapa vazio e a extração segue pela descrição.
- **Só lê vaga vista nos últimos 3 dias** (`lastSeenAt`). O JobBase agora tira a vaga encerrada da resposta, mas aqui ela só fecha após 45 dias sem reaparecer (`STALE_AFTER_DAYS`). Sem o corte, pagaríamos para ler o que a fonte já deu como encerrado.
- O retorno do cron passa a informar `fromRequirementsText`, para medir quanto do estoque vem pela seção curta.

### Não verificado daqui

O proxy deste ambiente recusa conexão com `poesywqtwnihizhkkbii.supabase.co`, então a busca por `requirements_text` não foi exercitada contra a API real — só contra resposta simulada (sintaxe `external_id=in.("…")`, `requirements_text=not.is.null`, padrão do PostgREST). A primeira rodada em produção responde `fromRequirementsText`; se vier 0 com vagas do Greenhouse no lote, é esta busca que falhou.

### Pendências

- **Fechar aqui o que o JobBase encerra.** Hoje a vaga `expired` continua aberta no Griffo por até 45 dias: fora da extração (pelo corte de 3 dias), mas ainda no matching e na contagem pública. O caminho é o adapter ler as `expired` recentes e encerrá-las com `closedReason: 'source_reported'`.
- `content_hash` ainda não é usado: 374 linhas em 118 grupos é pouco para justificar agora.
- SmartRecruiters sem descrição: devolver ao JobBase.

## 2.138 A ficha da vaga passa do DeepSeek para o Kimi K3 — decisão do operador, por crédito

**Primeira rodada em produção (23/09/2026, 18:04 UTC, DeepSeek):** 48 vagas lidas (45 Gupy, 3 Greenhouse), 48 com itens, 0 falhas, US$ 0,0383 no total — US$ 0,0008/vaga, 3,4s na mediana, ~1.500 tokens de entrada e ~708 de saída (a maior parte raciocínio). `fromRequirementsText = 0`, esperado: as vagas do JobBase só ganham descrição na coleta de 24/09 06:00 UTC. Amostra boa ("Graduação em Direito", "Registro ativo na OAB", "Contencioso trabalhista"…).

**Decisão:** o operador tem crédito sobrando no Kimi e pediu que a ficha rode nele. `INITIAL_TASK_ROUTING.job_intelligence = 'kimi'`.

**O que isso custa, dito antes da troca:**

- **Crédito, não caixa:** ~US$ 0,015/vaga no Kimi K3 ($3/$15 por 1M), contra US$ 0,0008 no DeepSeek. O estoque (~6,5 mil vagas) consome ~US$ 100 de crédito; as novas, ~US$ 3/dia.
- **Velocidade:** ~12s por chamada na mediana (`job_deduplication`, 30 dias) e teto de 3 simultâneas por organização (2.34). A concorrência da rodada caiu de 6 para 3; o estoque leva ~2 semanas em vez de ~3 dias.
- **Exceção consciente à regra "Kimi só em função serial" (26/08/2026):** esta tarefa dispara 3 em paralelo, exatamente o teto. O risco da regra — saturar o Kimi quando várias tarefas caem nele ao mesmo tempo — não se aplica aqui do mesmo jeito, porque o Kimi é o primário e o excedente (429) cai no DeepSeek, barato. O agente de deduplicação, serial e diário, pode coincidir; o custo disso é velocidade, não dinheiro.
- **Suplente:** `FALLBACK_CHAIN.kimi` começa pelo DeepSeek, e só dois provedores são tentados — o Claude sai do caminho desta tarefa, o que fecha o risco apontado antes (DeepSeek fora do ar mandando o estoque inteiro para o Claude, ~US$ 50–70).

**Para medir:** custo/vaga e tempo no `AiLog` (`taskType = 'job_intelligence'`, `provider = 'kimi'`), taxa de failover para o DeepSeek, e o `pending` caindo na resposta do cron. Se o Kimi ficar lento demais para acompanhar as ~230 novas por dia, a volta é uma linha em `registry.ts`.
