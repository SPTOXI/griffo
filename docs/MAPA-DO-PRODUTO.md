# GriffoWork — Mapa de Funcionalidades

**Data:** 2026-08-24
**Base:** `main` em `ccdac2c`
**Método:** leitura do código, rota por rota e módulo por módulo. Nada aqui foi
inferido de documentação anterior — quando este documento diverge de
`ANALISE-CUSTOS.md` ou `PRECIFICACAO.md`, a divergência está marcada.

> **Nota de procedência.** A primeira versão deste documento foi escrita em
> 14/08/2026 no PR #22, que acabou fechado sem merge — o arquivo passou seis
> dias existindo só naquela branch. Ele foi recuperado e reescrito contra a
> `main` atual. O que mudou entre as duas versões não é detalhe: **a seção 8 era
> uma proposta de busca de vagas, e hoje é o Radar em produção.** Onde o texto
> antigo dizia "não existe", este diz onde está. As passagens que descreviam o
> modelo de créditos foram removidas — ele foi encerrado no PR #16.
>
> **Segunda atualização, 24/08.** O documento ficou dez commits atrás da `main`
> enquanto esperava merge. Foi conferido de novo, linha por linha, contra
> `ccdac2c`. O que mudou nesta passagem: a faxina semântica de duplicadas (§8.10)
> e o segundo cron que a dispara, a telemetria de funil e a priorização por
> mercado no painel (§5), o RLS e a revisão de segurança de agosto (§7), e o
> filtro de data da Adzuna (§8.2).

Este documento descreve **o que existe hoje**. A memória cronológica de *por que*
cada decisão foi tomada está em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`; o resumo
operacional para quem vai mexer no código está em `docs/HANDOFF-CONTINUIDADE.md`.

---

## 1. O que o produto é

Uma plataforma que lê o currículo de uma pessoa, emite um laudo, reescreve o
documento, orienta o próximo passo de carreira e — desde as etapas 5 a 8 —
monitora vagas reais e avisa quando aparece uma que merece interromper a rotina
dela. Roda em Next.js na Vercel, com PostgreSQL no Supabase, e usa quatro
provedores de IA intercambiáveis.

**Modelo comercial:** existe UM produto à venda, a *Análise Completa*. Uma compra
destrava UM currículo, e a partir daí todos os itens daquele currículo ficam
disponíveis quantas vezes o usuário quiser. Não há assinatura, plano, saldo por
ação nem vitalício — o modelo de créditos foi encerrado no PR #16 e sobrevive
apenas como rastro auditável (`CreditTransaction`).

O Radar é **gratuito** e deliberadamente não está atrás do pagamento. A regra que
governa isso é o §21: assinatura só depois de o Radar provar valor.

**Idiomas:** português, inglês e espanhol (`src/lib/i18n`), com o endereço de
contato acompanhando o idioma.

---

## 2. Funcionalidades do usuário

### 2.1 Conta e sessão

**Cadastro e login** (`api/auth/register`, `api/auth/login`). Senha com `scrypt`
do Node, sem dependência externa.

**Sessão revogável de verdade** (`lib/session-store.ts`, `lib/auth.ts`). O cookie
é assinado por HMAC e carrega um `sid` conferido no banco a cada requisição. É o
que faz o logout revogar de fato: antes, sair apenas apagava a cópia do
navegador e um token copiado seguia valendo até expirar. O cookie é
não-persistente — sem `maxAge`, sem `expires` —, então fechar o navegador
encerra a sessão.

**Configurações** (`api/user/settings`, `api/user`). Dados cadastrais, redes
sociais salvas, e os dois consentimentos: transferência internacional de dados e
visibilidade do perfil para recrutadores (esta última só pode ser ligada se o
`recruiterOptIn` estiver ligado).

**Exportação de dados** (`api/user/export`). JSON com tudo que a plataforma
guarda sobre a pessoa — cadastro, currículos originais e reescritos, laudos,
ledger de análises, perfil profissional, preferências e alertas do Radar. Existe
para atender ao Art. 18, V da LGPD e ao Art. 20 do GDPR.

### 2.2 Envio do currículo

**Upload** (`api/resume/upload`). Aceita PDF de até 10 MB ou texto. A extração é
local, com `pdf-parse` — não custa token nenhum.

**Extração por visão, quando o PDF não tem camada de texto**
(`api/resume/profile-pdf-text`, `lib/pdf-text.ts`). Rota separada de propósito:
quando o PDF viajava dentro da requisição de análise, as duas disputavam o mesmo
teto de 60 s e um documento escaneado simplesmente era recusado. Separadas, cada
uma tem o prazo inteiro, e o usuário **vê** o texto extraído antes de seguir.
Esta é a única tarefa de OCR real do produto (`ocr_extraction`).

**Higienização** (`lib/ocr/extractor.ts`). Regex puro, sem IA: remove caracteres
de controle, espaços duplos, rodapés de paginação e sequências de separação.
Reduz o volume enviado ao modelo.

**Currículo ilegível não é pontuado** (PR #50). Quando a extração devolve pouco
texto aproveitável, o produto diz que não conseguiu ler em vez de emitir nota
sobre o vazio. Nota sobre documento não lido é o pior tipo de erro deste
produto: parece resultado.

### 2.3 Prévia gratuita

`api/resume/preview`. Só as notas de 0 a 10 nas oito dimensões — sem diagnóstico
e sem texto. Uma por conta, controlada por `User.freePreviewAt`. É o único item
que roda deliberadamente no modelo barato (DeepSeek). A conversão vem exatamente
de a pessoa ver a nota e não ver o porquê.

### 2.4 Análise Completa — o único movimento cobrável

`api/resume/analyze` destrava o currículo (`Resume.unlockedAt`), consome uma
análise do saldo e cria o job. `lib/entitlements.ts` é quem decide: as rotas
derivadas não cobram nada, só perguntam se o currículo está destravado.

O catálogo (`lib/pricing/catalog.ts`) promete nove itens, e desde o PR #23 cada
um tem produtor declarado em `DELIVERABLE_PRODUCERS` — uma tabela que existe
justamente para que a promessa possa ser **conferida contra o código**, e não
apenas lida:

| Item (`ANALYSIS_DELIVERABLES`) | Onde é produzido |
|---|---|
| `dimensions` | `lib/analysis/segments.ts` — segmentos `dimensions_a` e `dimensions_b` |
| `job_match` | `lib/analysis/segments.ts` — segmento `job_match` |
| `targeted_changes` | `lib/analysis/segments.ts` — segmento `targeted_changes` |
| `rewrite` | `api/resume/rewrite` |
| `career_orientation` | `api/resume/career-orientation` |
| `social_analysis` | `api/resume/social-analysis` + `lib/social/analysis.ts` |
| `cover_letter` | `api/resume/cover-letter` |
| `professional_summary` | `api/resume/cover-letter` (mesma chamada da carta) |
| `pdf_download` | `api/resume/download` + `lib/pdf.ts` |

#### Laudo das 8 dimensões

As dimensões avaliadas (`lib/analysis/stages.ts`):

1. **Estrutura & Compatibilidade ATS** — formato, parseabilidade, leitura por robôs de triagem
2. **Resumo & Posicionamento Profissional** — headline, objetivo, síntese de carreira
3. **Resultados Quantificados (STAR/XYZ)** — quantificação e indicadores numéricos
4. **Habilidades & Palavras-Chave de Busca** — vocabulário técnico e termos buscados por recrutadores
5. **Experiência Profissional & Verbos de Ação** — escopo, autonomia, verbos
6. **Palavras-Chave & Match com Vagas** — termos estratégicos para os filtros
7. **Trajetória & Plano de Carreira** — progressão, estabilidade, próximo passo
8. **Capacitação & Cursos Recomendados** — lacunas e certificações

A nota geral **não** é pedida ao modelo: é derivada das oito localmente, em
`mergeSegments`.

#### A análise é dividida em cinco chamadas paralelas

`lib/analysis/segments.ts`. Este é o ponto de arquitetura mais importante do
produto. A versão anterior pedia o laudo inteiro numa chamada de ~3.800 tokens
de saída — 82 s medidos, dentro de uma função com teto de 60 s. Geração é
serial: aqueles 3.800 tokens *eram* a latência, e trocar de provedor não muda
isso.

Cinco chamadas de algumas centenas de tokens rodando ao mesmo tempo terminam no
tempo da mais lenta, não na soma. Os cinco segmentos:

- `dimensions_a` — dimensões 1 a 4
- `dimensions_b` — dimensões 5 a 8
- `job_match` — comparação com a vaga alvo
- `targeted_changes` — trechos específicos a reescrever, com o porquê
- `executive` — parecer, pontos fortes, vulnerabilidades, recomendações, palavras-chave

Nenhum depende do resultado de outro. O currículo é repetido na entrada dos
cinco, e o custo disso é absorvido pelo cache de prompt: `buildSharedContext`
produz um bloco idêntico marcado como cacheável.

#### O trabalho sobrevive ao navegador

`lib/analysis/job.ts` + modelo `AnalysisJob`. A análise vive numa linha do banco,
não na conexão HTTP. Três garantias, nesta ordem:

1. **Não se perde** — fechar o navegador no meio deixa o laudo sendo escrito.
2. **Retoma de onde parou** — cada segmento é gravado ao terminar; quem reassume refaz só o que falta.
3. **Um de cada vez** — `leaseUntil` (60 s, renovado a cada segmento) impede que duas execuções processem o mesmo job e paguem a IA duas vezes.

Quem detecta e reassume é a consulta de status (`api/resume/analyze/status`) —
**sem fila**. O cron do Radar existe (§8), mas não toca em análise.

Duas correções desta arquitetura merecem registro, porque desfazê-las por engano
é fácil:

- **O limitador de requisições não pode estrangular o status** (PR #54). A
  consulta de status é o que mantém a análise viva; quando ela levava 429, o
  trabalho parava e parecia travamento do produto. Foi a causa-raiz de
  praticamente todos os travamentos relatados. Ver `lib/rate-rules.ts` e §10.8 do
  handoff.
- **A concessão é liberada quando a invocação para** (PR #53), em vez de esperar
  o `leaseUntil` vencer. Sem isso, cada interrupção custava até 60 s de tempo
  morto antes de alguém poder retomar.

#### Comparação com a vaga alvo

O usuário informa o cargo ou cola o link da vaga. `api/resume/job-fetch` busca a
página e extrai o conteúdo por JSON-LD `JobPosting` (LinkedIn, Gupy, Catho,
Glassdoor, Indeed), caindo para OpenGraph e meta tags. Toda busca passa pelo
`lib/url-guard.ts`, que bloqueia endereços internos e valida cada salto de
redirecionamento — proteção contra SSRF.

O bloco de compatibilidade na tela é pintado conforme o resultado (PR #51):
incompatibilidade alta aparece em vermelho. Antes saía sempre na mesma cor, e um
"não serve para esta vaga" era lido como aprovação.

#### Reescrita

`api/resume/rewrite`. Aplica STAR e Google XYZ preservando empresas, cargos,
datas e formação reais. Entrada cortada em 20.000 caracteres — sem o corte, um
documento de 30 páginas fazia custo e tempo crescerem sem limite. Roda com
`maxProviderAttempts: 1`: geração longa não cabe em meio orçamento, e guardar
metade do tempo para um suplente que também não caberia troca um sucesso por
duas falhas.

#### Carta de apresentação e resumo profissional

`api/resume/cover-letter`. Uma chamada produz os dois itens — eram os dois
"vendidos sem produtor" do diagnóstico de 14/08, e o PR #23 os construiu.

#### Orientação profissional

`api/resume/career-orientation`. Produz `profileSummary`, três
`topMatchingAreas` (cargo, percentual de afinidade, justificativa, competências
a estudar) e `careerAdvice`. Quando o usuário importou uma vaga real, ela entra
como referência concreta de mercado.

Uma ressalva importante, herdada de `ANALISE-CUSTOS.md` §2.4 e confirmada no
código: **a base é apenas o currículo**. O `matchPercentage` é juízo do modelo
sobre o currículo, não medida de mercado — e é por isso que o Radar filtra pelos
`role`, nunca por esse número (§8).

#### Presença digital

`api/resume/social-analysis` + `lib/social/fetchers.ts`. Visita os perfis de
verdade — GitHub tem API pública oficial; as demais plataformas dependem do que
é legível, e o LinkedIn sempre exige que o usuário forneça o conteúdo. Cada
perfil sai marcado como **lido** ou **não lido**, e a distinção sobrevive à
exportação: sem ela, o documento perderia justamente a informação que diz o
quanto confiar nele. Produz diagnóstico por perfil, headline pronta para copiar,
texto "Sobre" e ações.

#### Downloads

`api/resume/download`. Formatos: currículo reescrito em **PDF**, **Markdown** e
**TXT**; laudo em **PDF**; presença digital em **TXT** ou **Markdown**. Geração
local com `pdf-lib`, sem IA.

### 2.5 Perfil Profissional

`api/user/professional-profile` + `lib/profile/`. Modelo `ProfessionalProfile`,
um por usuário. É a peça que o documento de 14/08 apontava como faltando — sem
ela, o filtro de vagas não tinha o que perguntar.

Guarda identidade profissional (cargo atual, senioridade, área, especializações,
competências, anos de experiência, escolaridade), objetivos (cargos-alvo,
áreas-alvo, setores, trajetória desejada) e mobilidade — com **residência e
destino como campos separados**, porque morar no Brasil e querer vaga em Portugal
são duas informações, não uma.

**Importação a partir do currículo** (`professional-profile/suggest`): a IA
propõe o preenchimento e a pessoa confirma. Duas regras governam isso:

- **§30 — perfil não muda sozinho e em silêncio.** A sugestão é proposta, nunca
  gravação direta.
- **Perfil de outra área não decide as vagas caladamente** (PR #49). Quando o
  currículo importado diverge do perfil salvo, o produto pergunta
  (`profile-conflict-prompt.tsx`) em vez de escolher.

Se o DeepSeek tropeçar na sugestão, a cadeia alcança o Claude — o failover nessa
rota foi conferido no PR #57, que passou a registrar o motivo real da falha em
vez de engolir.

### 2.6 Radar de vagas

Ver §8, que descreve o subsistema inteiro. Do ponto de vista do usuário:
`components/app/radar-view.tsx` mostra as oportunidades encontradas,
`api/user/radar-preferences` controla frequência e critério, e
`api/radar/prepare` gera um currículo direcionado a partir de uma vaga
específica — a ponte entre o Radar e a venda.

### 2.7 Suporte

`api/support/chat` + `components/app/support-view.tsx`. Assistente com o catálogo
e as regras do produto no prompt do sistema. Roda no DeepSeek. Gratuito.

---

## 3. Motor de IA

### 3.1 Roteador multi-provedor

`lib/ai-router/`. Quatro provedores configurados:

| Provedor | Modelo padrão | US$/1M entrada | US$/1M saída |
|---|---|---|---|
| Claude (Anthropic) | `claude-sonnet-5` | 3,00 | 15,00 |
| Kimi (Moonshot) | `kimi-k3` | 3,00 | 15,00 |
| DeepSeek | `deepseek-v4-flash` | 0,22 / 0,44¹ | 0,66 / 1,32¹ |
| Google Gemini | `gemini-2.0-flash` | 0,075 | 0,30 |

¹ Fora de pico / em pico, a partir de 16/08/2026 16:00 UTC. Ver
`lib/ai-router/pricing.ts`.

**Roteamento por tarefa.** A divisão é por natureza do trabalho, não por preço:
o que o usuário lê e leva embora vai para o Claude; o maquinário interno
(suporte, juiz de qualidade, análise de logs) e a prévia gratuita vão para o
DeepSeek.

**Cadeia de suplentes.** Kimi é o primeiro suplente de todas as cadeias; Gemini
fica por último. Só os dois primeiros candidatos são de fato tentados — o
terceiro e o quarto existem para o caso de o filtro de residência eliminar
algum.

**Preço por horário.** Desde a atualização do DeepSeek, o preço é resolvido no
instante da chamada (`resolveModelPricing`), a partir da hora UTC e da data de
vigência.

**Custo gravado por chamada.** `AiLog.costUsd` recebe entrada, saída e o cache
(gravar custa 1,25× e ler 0,1× no Claude). O painel soma esse campo.

**O raciocínio do modelo não é resposta** (PR #58). Quando o provedor devolve
bloco de *reasoning* junto do conteúdo, ele é descartado. Sem isso, o rascunho do
modelo chegava à tela como se fosse o laudo.

### 3.2 Residência de dados

`lib/data-residency.ts`. Currículo é dado pessoal denso, e enviá-lo a um
provedor é transferência internacional. DeepSeek e Kimi processam na China, que
não tem decisão de adequação da UE — para usuário do EEA, Reino Unido ou Suíça,
os dois são removidos da lista de candidatos. Se isso esvaziaria a lista, a rota
falha em vez de fazer transferência irregular.

O consentimento explícito fica em `User.dataTransferConsent`.

O país usado nessa decisão vem do IP que o Cloudflare escreve, não do cabeçalho
que o cliente manda (PR #52, `lib/request-ip.ts`). Antes vinha do data center, o
que significa que a proteção podia ser decidida pela geografia errada.

### 3.3 Controle de qualidade — dois níveis

**Agente determinístico** (`lib/agents/quality-agent.ts`), no caminho da
requisição: valida JSON, checa se as dimensões vieram completas, se as
justificativas não estão vazias. É barato e é o que **dispara o failover** para
outro provedor. Valida cada tarefa pelo formato que ela produz — tipo novo exige
regra nova, senão respostas corretas são reprovadas por regra alheia (foi o que
aconteceu com `career_orientation`).

**Juiz por amostragem** (`lib/agents/quality-judge.ts`), fora do caminho da
requisição: chamada de LLM sobre uma amostra, depois da resposta ao usuário.
Grava em `AiLog.qualityScore`. Nulo significa "não sorteado", não "reprovado".

### 3.4 Orçamento de tempo

Toda a arquitetura é moldada pelo teto de 60 s das funções da Vercel. Orçamento
padrão do roteador: 52 s, dividido entre as tentativas; 25 s por provedor; 3 s
de reserva por tentativa. Rotas que trabalham **antes** da IA — a presença
digital gasta até 10 s buscando perfis — declaram o que sobrou, senão o roteador
planeja em cima de um orçamento já gasto.

Os três números são um sistema, não três constantes soltas: §10.7 do handoff
explica o que quebra ao mexer em um só.

---

## 4. Pagamento

**Catálogo** (`lib/pricing/catalog.ts`) — ponto único de verdade. Nenhum preço
existe fora dele.

| Faixa | Países (exemplos) | Unitário | Pacote de 5 |
|---|---|---|---|
| 1 | US, CA, GB, DE, FR, AU, JP, SG, NL, IE | US$ 12,90 | US$ 49,90 |
| 2 | PT, ES, IT, PL, CL, TR, ZA | US$ 8,90 | US$ 34,90 |
| 3 | **BR**, MX, CO, AR, TH, RO | US$ 5,90 | US$ 22,90 |
| 4 | IN, ID, PH, VN, NG, EG, KE | US$ 3,90 | US$ 16,90 |

- **Piso absoluto:** US$ 2,60 por análise. Custo direto medido: US$ 1,0449. O
  teste do catálogo falha se qualquer preço violar o piso, incluindo o unitário
  dentro do pacote.
- **A faixa é decidida pelo país do meio de pagamento**, não pelo IP. O IP só
  sugere a moeda de exibição antes da primeira compra — um usuário atrás de VPN
  não escolhe a própria faixa.
- **Fora da Faixa 1, exibir dólar é proibido.** O valor cobrado é o de
  `LOCAL_PRICES`, fixo e já arredondado para o formato da moeda. Preço em dólar
  aparecendo para um usuário brasileiro é sintoma de resolução de moeda errada,
  e é receita saindo errada — não é detalhe de tela.
- **O preço nunca vem do cliente.** A rota antiga aceitava `currency` no corpo
  da requisição.
- **Upsell:** pacote de 5, oferecido apenas dentro do resultado e apenas depois
  da primeira compra. A regra é aplicada no servidor.

**Checkout e webhook** (`api/checkout`, `api/webhooks/stripe`). A idempotência é
a falha da inserção única de `WebhookEvent.eventId`, não uma consulta anterior —
duas entregas simultâneas do mesmo evento passariam por qualquer verificação
feita antes da escrita. A assinatura do webhook é conferida sobre o **corpo
cru**; qualquer parse antes disso invalida a verificação (§10.2 do handoff).

O `AnalysisLedger` registra faixa aplicada, preço em dólar, país do meio de
pagamento, moeda e valor local: sem essas colunas não há como conferir, meses
depois, se alguém pagou o preço da região certa.

---

## 5. Painel administrativo

Oito abas (`components/admin/admin-view.tsx`):

| Aba | O que faz |
|---|---|
| **Usuários** | Lista, filtra, muda papel, desabilita conta, cria conta, ajusta saldo de análises e edita a conta inteira em modal |
| **Cadastrar APIs de IA** | Chave, base URL e modelo por provedor. Chaves cifradas em AES-256-GCM |
| **Monetização & Preços** | Faixas, moedas e métodos de pagamento por região |
| **Telemetria de IA** | Chamadas, custo, latência e failover por provedor, tarefa, modelo e usuário. Desde 24/08 carrega também o **funil de conversão** (visitante → checkout → compra), a performance do upsell e a **economia unitária** — AOV, ARPU e margem — além da tabela de **performance por mercado** descrita abaixo |
| **Central de Agentes & Incidentes** | `SystemIncident` — severidade, status, resultado do diagnóstico |
| **Coordenador Mestre 24h** | Boletim diário consolidado do "enxame" de agentes |
| **Radar e Cotas** | Cota das APIs de vagas e saúde das fontes. Responde "por que apareceu menos vaga hoje?" |
| **Saúde do Sistema** | Ping no banco e nos provedores |

### Performance por mercado — onde a verba vai

`lib/analytics/market-performance.ts` cruza `AnalyticsEvent` com
`AnalysisLedger` e devolve, por país: visitantes únicos, checkouts, compras,
conversão final, receita, custo direto de IA, taxa de gateway, lucro e margem.

A recomendação é algorítmica e tem três estados — escalar verba (conversão
≥ 3,5% com margem ≥ 50%), testar mais (amostra ainda inicial) e otimizar ou
reduzir (tráfego expressivo com conversão < 1,5%, ou margem negativa).

O país vem dos cabeçalhos de borda `x-vercel-ip-country` e `cf-ipcountry`, e as
campanhas vêm das UTMs que `page-view-tracker.tsx` guarda no `localStorage` no
primeiro acesso e propaga por todos os eventos do funil. **IP nenhum é gravado**
— o que fica é o código ISO do país, e o motivo está no §7.

Isto é a metade de medição da estratégia de Global Day 1: o produto nasce em
vários mercados, e o dado — não o palpite — decide onde a verba entra. Os 13
mercados com regras nativas declaradas estão em `lib/market/index.ts`.

### Os agentes do painel — o que cada um é de fato

| Agente | Realidade no código |
|---|---|
| **Suporte & Atendimento** | IA real (DeepSeek) |
| **Auto-Diagnóstico** | Envia `"Ping"` com `max_tokens: 5-10` a três provedores só para ver se respondem, testa o banco com `user.count()` e monta texto fixo. Quase zero custo |
| **Qualidade & Auditoria** | JavaScript puro — valida JSON, conta caracteres, checa tamanho das justificativas. Zero IA |
| **Economia & OCR** | Regex puro. Zero IA — e o "OCR" desta caixa não existe (o OCR real é o `pdf-text.ts`) |
| **Analista de logs** | IA real, em lote: procura correlação no `AiLog` que a contagem do painel não mostra |
| **Coordenador Mestre** | IA real: consolida e gera o boletim diário |
| **Faxina de duplicadas** | IA real, em três camadas, e a única que APAGA linha do banco. Descrita em §8.10 |

Do ponto de vista de custo isso é ótimo — o enxame é quase todo determinístico.
Do ponto de vista de comunicação, a tela ainda descreve dois deles como se
avaliassem qualidade e economizassem tokens por inteligência, quando são
validação e regex. **Continua em aberto.**

---

## 6. Estado real vs. prometido

Esta seção existe porque um mapa de funcionalidades que lista o que é vendido em
vez do que é entregue não serve para decidir nada. Na versão de 14/08 ela tinha
três subseções abertas; duas foram fechadas.

### 6.1 ✅ RESOLVIDO — os itens vendidos sem produtor

Eram três: `cover_letter` e `professional_summary` não tinham rota nenhuma, e
"otimização de perfil (LinkedIn/Gupy)" estava contada duas vezes, porque era o
que a `social-analysis` já entregava.

O PR #23 construiu `api/resume/cover-letter`, que produz os dois primeiros numa
chamada só, e trocou o item duplicado por `targeted_changes` — que já existia,
devolve trechos reais do currículo com a substituição sugerida, e não era
anunciado em lugar nenhum. Um item real no lugar de um item duplicado.

A garantia contra a recaída é `DELIVERABLE_PRODUCERS` (§2.4): item sem produtor
declarado é item que a landing vende e o produto não entrega, e `catalog.test.ts`
verifica que a lista continua com nove.

### 6.2 🟡 PARCIAL — código morto e rotas fantasma

- **`lib/llm.ts` foi removido.** Continha as versões antigas de `full_analysis` e
  `rewrite`, e era a origem do custo por ciclo de US$ 0,0684 que
  `ANALISE-CUSTOS.md` §8 apontava como incompatível com o real.
- **`full_analysis` não tem chamador vivo**, mas o tipo sobrevive em três
  lugares: `quality-judge.ts` (lista de tarefas julgadas), `quality-agent.ts`
  (regra de validação) e `ai-router/metrics.ts` (rótulo padrão de log antigo).
  O de `metrics.ts` é legítimo — logs históricos têm esse `taskType`. Os outros
  dois são resíduo.
- **`normalization` continua declarada em `ai-router/types.ts` e nunca é
  chamada.**

Correção a `ANALISE-CUSTOS.md`, que ainda vale: `ocr_extraction`, que aquele
documento dava como morta, **é usada** por `pdf-text.ts`.

### 6.3 ✅ RESOLVIDO — conteúdo de exemplo na tela do laudo

`analysis-view.tsx` tinha um `defaultTargetedChanges` com texto inventado
("Profissional dedicado e dinâmico buscando novos desafios") usado como fallback
quando a análise não trazia `targetedChanges`. Não existe mais — nem o símbolo,
nem o texto. É a aplicação do §43: nunca inventar dado para a tela parecer
completa.

Na mesma linha, o PR #59 parou de mostrar ao usuário a mensagem interna do erro.
A mensagem que vai para a tela é **escrita**, nunca a do erro (§10.9 do handoff).

---

## 7. Conformidade e retenção

`lib/retention.ts`. Prazos declarados como ponto de partida defensável, não como
decisão jurídica fechada:

| Dado | Prazo | Razão |
|---|---|---|
| Eventos de webhook | 90 dias | Só servem para conciliar pagamento |
| Logs de IA | 365 dias | Métrica operacional, sem conteúdo do currículo |
| Trilha de auditoria | 730 dias | Registro de conformidade |
| Currículos de contas inativas | 730 dias | É o produto que a pessoa pagou para ter |

**O expurgo continua não rodando sozinho** — só pela rota administrativa
(`api/admin/retention`). O `vercel.json` declara **dois** crons, o do Radar
(`/api/cron/radar`, `0 6 * * *`) e o da faxina de duplicadas
(`/api/cron/dedup`, `0 18 * * *`), e **nenhum dos dois chama a retenção**.
Ligar o expurgo num cron é exclusão irreversível em produção: §10.5 do handoff
explica por que isso não é uma linha de configuração.

Segredos (`AiApiKey.apiKey`, chaves da Stripe em `SystemConfig`) são cifrados em
AES-256-GCM (`lib/crypto.ts`). Antes ficavam em texto puro: qualquer backup ou
credencial de leitura vazada entregava as chaves de produção prontas.

**Descadastro do e-mail** (`api/radar/unsubscribe`, `lib/email/unsubscribe.ts`).
O link é assinado, funciona sem sessão e sem confirmação, e o erro aqui é
jurídico, não estético — §10.10 do handoff.

**RLS no banco.** `prisma/rls.sql` liga *row level security* em todas as
tabelas e é idempotente — aplicado com `npm run db:rls`, que roda por
`src/scripts/apply-rls.ts`. O script não chama `psql` nem depende de sintaxe de
shell, então funciona igual no Windows; ele usa a conexão DIRETA
(`POSTGRES_URL_NON_POOLING`), porque DDL através do PgBouncer em modo transação
é caminho para erro intermitente.

**Telemetria sem dado pessoal.** `AnalyticsEvent` guarda o evento, o `visitorId`
anônimo, o SKU, as UTMs e o **código ISO do país** — lido dos cabeçalhos de
borda. O IP não é gravado em lugar nenhum. É o que permite medir mercado sem
transformar o funil num cadastro de rastreamento.

**Revisão de segurança de agosto** (`docs/AUDITORIA-SEGURANCA-2026-08.md`, PR
#64), cinco frentes que valem como referência do que não regredir:

| Frente | O que estava aberto |
|---|---|
| `/api/admin/jobs/dedup` | Sem verificação nenhuma — o único controle era o botão viver dentro do `AdminView`. Um POST sem sessão gastava IA paga e escrevia no banco. Hoje exige `getAdminUser` e registra em `AuditLog` |
| `/api/cron/dedup` | Conferia o `Authorization` dentro de `if (secret)`: sem `CRON_SECRET`, a verificação era pulada e a rota respondia 200 para qualquer um. Hoje responde 503 |
| `applicationUrl` de terceiro | Sem validação de esquema, terminava em `window.open` e em `href` do e-mail, onde `javascript:` executa na origem da aplicação. `lib/safe-url.ts` recusa o esquema — escapar HTML não cobria este caso |
| Entradas sem teto | Sete campos `z.string()` sem `max` em colunas sem tamanho. `lib/validation.ts` centraliza os limites, porque duas definições iguais em arquivos diferentes divergem na primeira correção que só uma recebe |
| Upload sem conferência | `parsePdfBuffer` cru, sem a assinatura `%PDF-` — qualquer arquivo caía na transcrição por visão paga |

`/api/admin` e `/api/cron` também entraram no `matcher` do limitador.

**Pendências que não são código:** cláusulas contratuais assinadas,
representante na UE (GDPR Art. 27) e registro de tratamento.

---

## 8. Radar de vagas — a proposta que virou produto

> Na versão de 14/08 esta seção começava com "**8.1 A ideia**" e listava quatro
> impedimentos. Três foram construídos; um continua de pé. O que segue descreve o
> que existe.

### 8.1 O que é

Monitorar vagas reais e usar o **perfil profissional + a orientação que o
GriffoWork já produz** como filtro. Quando aparece uma vaga que merece
interromper a rotina da pessoa, ela é avisada. Quando não aparece nada, ninguém
é avisado — a regra do silêncio é o produto.

Roda por cron diário (`api/cron/radar`, 06:00 UTC) e pode ser disparado sob
demanda (`api/radar/run`). Doze horas depois da coleta, às 18:00 UTC, um segundo
cron passa a faxina de duplicadas descrita em §8.10.

### 8.2 As sete fontes

| Fonte | Cobre | Contrato | Fecha por ausência |
|---|---|---|---|
| Greenhouse | Empresas (US, GB, CA) | Público | Sim |
| Lever | Empresas (variado) | Público | Sim |
| Páginas de carreira (schema.org) | Quem for configurado | Padrão aberto | Sim |
| Gupy | Brasil | **API interna — risco declarado** | Não |
| Adzuna | 10 mercados | Público, com cota | Não |
| Remotive | Remoto internacional | Público | Não |
| RemoteOK | Remoto internacional | Público | Não |

O risco que o documento de 14/08 apontava como decisivo era exatamente este: os
três ATS internacionais não cobrem o mercado brasileiro, e a Gupy, onde está o
volume, não tem API pública de leitura. A resposta foi o adaptador da Gupy sobre
API interna, **com o risco declarado no código** e com `fecha por ausência =
não` — uma fonte instável não pode encerrar vaga.

Portugal e Japão não têm fonte de busca por cargo; são atendidos pelas fontes de
vaga remota.

A busca da Adzuna pede `max_days_old=30` e `sort_by=date`: sem os dois, a fonte
devolvia anúncio de meses atrás ocupando o orçamento de leitura da rodada — e
vaga velha não é vaga, é ruído que empurra a recente para fora do teto.

Fonte não é a única forma de a mesma vaga aparecer duas vezes; a segunda camada
contra isso está em §8.10.

### 8.3 §12 — coleta vazia NUNCA fecha vaga

O defeito que a seção 8.6 antiga previu no coletor de rascunho é hoje a regra
mais importante do subsistema, em `lib/jobs/collection.ts` e
`lib/jobs/lifecycle.ts`.

Se o adaptador devolve HTTP 200 com lista vazia — acontece em manutenção e em
troca de endpoint —, fechar todas as vagas daquela empresa faria elas
reaparecerem como novas no ciclo seguinte, contaminando a métrica de
antecedência. **Ausência não é prova de encerramento.** Só fonte com contrato
público e estável tem permissão de fechar por ausência, e é o que a última coluna
da tabela acima declara.

### 8.4 O filtro: três eixos, e o que elimina vs. o que ordena

`lib/matching/`. A compatibilidade tem três eixos (`compatibility.ts`), o encaixe
por vaga sai de `job-fit.ts`, e `filters.ts` guarda a distinção que mais custa
caro se for desfeita:

- **`targetMarketsOf` responde "o que a pessoa declarou"** e governa
  **eliminação**. Perfil sem alvo vê tudo.
- **`marketScopeOf` responde "o que ler primeiro quando não dá para ler tudo"** e
  governa **ordem**. Perfil sem alvo cai em residência, depois idioma.

Palpite é aceitável para ordenar e inaceitável para excluir. Não unifique as
duas.

Vale a ressalva de §2.4: o filtro usa os `role` da orientação, **nunca** o
`matchPercentage`. Aquele número sai do modelo sem fonte externa; filtrar por ele
seria empilhar juízo sobre juízo e chamar o resultado de dado.

**O Radar cala quando não sabe o que procurar** (PR #55). Perfil vazio não gera
chute — gera silêncio.

### 8.5 Orçamento de leitura

`openJobsWithinBudget`, em `lib/radar/runner.ts`. O teto é de 500 vagas por
rodada, gasto em ordem de prioridade: primeiro as vagas dos mercados da pessoa
e, **se sobrar orçamento**, o resto do mundo numa segunda consulta.

A segunda consulta não pode ser removida: é ela que mantém a mudança sendo de
ORDEM e não de ESCOPO. O filtro duro deixa passar vaga sem mercado declarado,
vaga remota para quem aceita remoto internacional, e tudo para quem não declarou
alvo nenhum. Se o SQL parasse na primeira consulta, o banco estaria eliminando o
que o filtro decidiu não eliminar — e essa eliminação não apareceria como
rejeição em lugar nenhum.

`NEWEST_FIRST` usa `nulls: 'last'`. Em Postgres, `ORDER BY x DESC` põe os nulos
na frente; sem isso, as vagas que a fonte não datou consumiam o orçamento antes
das vagas realmente recentes.

### 8.6 Cota compartilhada

`lib/jobs/quota.ts`. A rodada compartilhada e a busca individual disputam a mesma
cota de API, e há uma reserva de 20% que protege a primeira. É a trava que
precisa existir antes de a busca imediata paga entrar (§9).

### 8.7 E-mail do digest — ligado, com envio real confirmado

`lib/email/` (`send.ts`, `digest.ts`, `unsubscribe.ts`) e
`lib/radar/digest.server.ts`. O canal que o documento de 14/08 listava como
impedimento nº 1 existe: Resend no domínio `send.griffo.work`, com SPF, DKIM e
DMARC passando.

O que o digest respeita: idioma do usuário (`communicationLanguage`),
`RadarPreference.frequency === 'off'`, teto de `maxPerDigest`, link de
descadastro assinado, `Reply-To` em `@griffo.work`, e `RadarAlert.notifiedAt`
para não repetir alerta.

**O envio está ligado** desde 08/09/2026 (`RADAR_DIGEST_ENABLED=true` em
produção). Com a variável desligada o cron só registra no log quem receberia o
quê — foi assim que o conteúdo foi conferido antes de sair mensagem. O primeiro
disparo real saiu para 4 usuários, confirmado por `RadarAlert.notifiedAt`
gravado nos quatro registros, campo escrito só depois de `sendEmail()` ter
sucesso. Detalhe do incidente que atrasou esse primeiro envio (a `RESEND_API_KEY`
anotada no `.env` sem o `=`, e o redeploy que não bastou) em `§2.108` da
auditoria e em `§7.3` do documento de continuidade.

Mandar e-mail sobre vaga ruim queima o domínio, e domínio queimado não se
recupera fácil: o envio só ligou depois de o Radar estar validado com gente
real, e a qualidade do matching passa a ser o que protege a reputação.

### 8.8 O que continua não existindo

**Assinatura.** O modelo `Subscription` está no schema, mas só é lido para
contagem no painel e na exportação. Nada escreve nele. A Stripe está montada como
checkout único. É o impedimento nº 2 do documento antigo, e continua de pé — por
decisão, não por esquecimento: o §21 trava a assinatura até o Radar provar valor.

### 8.9 Economia

Julgamento por vaga, com ~2.500 tokens de entrada e ~600 de saída:

| Modelo | US$/vaga | 300 vagas/mês |
|---|---|---|
| Gemini 2.0 Flash | 0,00037 | **US$ 0,11** |
| DeepSeek V4-Flash (fora de pico) | 0,00095 | US$ 0,29 |
| Claude Sonnet 5 | 0,0165 | US$ 4,95 |

**O Gemini fica mais barato que o DeepSeek**, porque nesta tarefa a saída pesa e
o DeepSeek subiu a saída para US$ 0,66/1M contra US$ 0,30 do Gemini. E o Gemini é
**permitido para europeu**, ao contrário do DeepSeek e do Kimi: sem ele, usuário
do EEA cai no Sonnet e custa 17× mais.

**O custo escala com usuários × vagas, não com vagas.** A mesma vaga é julgada
uma vez por pessoa. A saída prevista — extrair a ficha da vaga uma vez e julgar
o encaixe por pessoa sobre a ficha, não sobre o anúncio inteiro — está registrada
como §27 no plano e **ainda não foi feita**. O PR #42 tirou a urgência dela ao
resolver o problema anterior: não era o custo por par, era *quantas vagas
irrelevantes chegavam até o julgamento*.

Latência não importa aqui. O teto de 60 s, que domina todo o resto do produto,
some — o que torna o modelo barato viável onde no caminho pago não seria.

### 8.10 Faxina semântica de duplicadas

A deduplicação determinística de `lib/jobs/dedup.ts` trabalha por chave exata —
`sid:`, `url:`, `cmp:` — e resolve o caso fácil. Ela não resolve o caso comum:
agregadores cadastram a mesma vaga com o nome da empresa diferente ("Nubank" vs.
"Nu Pagamentos S.A."), o título diferente ("Engenheiro Frontend" vs. "Dev
React/Next.js"), a URL embrulhada em redirect, ou simplesmente republicada dias
depois.

`lib/jobs/agent-dedup.ts` é a segunda camada, em três etapas, e a ordem importa
porque a primeira é de graça:

1. **Pré-filtro heurístico.** Agrupa só os pares suspeitos — empresa aproximada,
   mesmo estado ou país, título aproximado por `foldTitle`. Sem IA, instantâneo.
2. **Julgamento por IA** (Kimi K3 → DeepSeek → Gemini), sobre os textos dos dois
   anúncios, com veredito em JSON. Por rodada são no máximo **15 pares** por
   padrão, e a rota administrativa admite mais.
3. **Reconciliação no banco**, em transação.

**O que protege a rodada.** A reconciliação só acontece com `isDuplicate` e
**confiança ≥ 0,85** — abaixo disso a dúvida não vira exclusão. Ao unificar, os
`RadarAlert` da vaga descartada **migram** para a preservada, e só são apagados
quando aquele usuário já tem alerta para a canônica: alerta some é aviso que a
pessoa não recebe. A operação fica em `AuditLog` como `job_semantic_dedup`, com
os dois ids e a confiança.

Esta é **a única rotina do produto que apaga linha de vaga do banco** fora do
expurgo por tempo. É o motivo de o limiar ser alto, do teto de pares ser baixo,
e de a rota manual (`/api/admin/jobs/dedup`) exigir `getAdminUser` — ela estava
aberta até o PR #64, e §7 conta o que isso significava.

---

## 9. O que este documento não cobre

**Busca imediata paga.** Decidido: busca inicial grátis após a orientação, Radar
diário grátis, busca imediata como produto pago. Preço sugerido R$ 14,90 por 5
buscas, nunca unidade — a taxa do cartão brasileiro come 17% numa venda de R$ 3.
Falta saldo de busca no usuário, razão contábil, `sku` no checkout, concessão no
webhook e a rota que coleta sob demanda. Ver §7.4 do handoff.

**Calibragem dos três eixos.** Só faz sentido com retorno de usuário real, e o
que serve é um caso concreto: *qual vaga não deveria ter aparecido, e por quê*.
No abstrato, mexer nos pesos é chute.

**Os dois números que fecham a conta da §8.9:** quantas vagas por usuário por dia
sobram do filtro duro, e quantos usuários por coorte. É a razão entre eles que
decide se o custo de IA é ruído ou é o custo principal.

**Imposto e preço da busca imediata.**
