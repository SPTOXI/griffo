# GriffoWork — Mapa de Funcionalidades

**Data:** 2026-08-14
**Base:** `main` em `219f8de`, mais a atualização de preço do DeepSeek (PR #22)
**Método:** leitura do código, rota por rota e módulo por módulo. Nada aqui foi
inferido de documentação anterior — quando este documento diverge de
`ANALISE-CUSTOS.md` ou `PRECIFICACAO.md`, a divergência está marcada.

Este documento tem duas partes. As seções 1 a 6 descrevem **o que existe hoje**.
A seção 8 propõe **uma funcionalidade nova** — busca de vagas guiada pela
orientação profissional — e diz o que ela exigiria.

---

## 1. O que o produto é

Uma plataforma que lê o currículo de uma pessoa, emite um laudo, reescreve o
documento e orienta o próximo passo de carreira. Roda em Next.js na Vercel, com
PostgreSQL no Supabase, e usa quatro provedores de IA intercambiáveis.

**Modelo comercial:** existe UM produto à venda, a *Análise Completa*. Uma compra
destrava UM currículo, e a partir daí todos os itens daquele currículo ficam
disponíveis quantas vezes o usuário quiser. Não há assinatura, plano, saldo por
ação nem vitalício — o modelo de créditos foi encerrado e sobrevive apenas como
rastro auditável (`CreditTransaction`).

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

**Configurações** (`api/user/settings`). Dados cadastrais, redes sociais salvas,
e os dois consentimentos: transferência internacional de dados e visibilidade do
perfil para recrutadores (esta última só pode ser ligada se o `recruiterOptIn`
estiver ligado).

**Exportação de dados** (`api/user/export`). JSON com tudo que a plataforma
guarda sobre a pessoa — cadastro, currículos originais e reescritos, laudos,
ledger de análises. Existe para atender ao Art. 18, V da LGPD e ao Art. 20 do
GDPR.

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

### 2.3 Prévia gratuita

`api/resume/preview`. Só as notas de 0 a 10 nas oito dimensões — sem diagnóstico
e sem texto. Uma por conta, controlada por `User.freePreviewAt`. É o único item
que roda deliberadamente no modelo barato (DeepSeek), a US$ 0,0011 por conta
fora de pico. A conversão vem exatamente de a pessoa ver a nota e não ver o
porquê.

### 2.4 Análise Completa — o único movimento cobrável

`api/resume/analyze` destrava o currículo (`Resume.unlockedAt`), consome uma
análise do saldo e cria o job. `lib/entitlements.ts` é quem decide: as rotas
derivadas não cobram nada, só perguntam se o currículo está destravado.

O catálogo (`lib/pricing/catalog.ts`) promete nove itens. O que cada um é:

| Item | Onde é produzido | Estado |
|---|---|---|
| Laudo das 8 dimensões | `analysis/job.ts` (5 chamadas) | ✅ |
| Comparação com a vaga alvo | segmento `job_match` | ✅ |
| Reescrita de experiências | `api/resume/rewrite` | ✅ |
| Orientação profissional | `api/resume/career-orientation` | ✅ |
| Otimização de perfil (LinkedIn/Gupy) | `api/resume/social-analysis` | ⚠️ ver 6.1 |
| Análise de mídias sociais | `api/resume/social-analysis` | ✅ |
| Carta de apresentação | — | ❌ ver 6.1 |
| Resumo profissional | — | ❌ ver 6.1 |
| Download em PDF | `api/resume/download` | ✅ |

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
**sem cron e sem fila**. Isso é decisão deliberada, e é a restrição que a
proposta da seção 8 mais desafia.

#### Comparação com a vaga alvo

O usuário informa o cargo ou cola o link da vaga. `api/resume/job-fetch` busca a
página e extrai o conteúdo por JSON-LD `JobPosting` (LinkedIn, Gupy, Catho,
Glassdoor, Indeed), caindo para OpenGraph e meta tags. Toda busca passa pelo
`lib/url-guard.ts`, que bloqueia endereços internos e valida cada salto de
redirecionamento — proteção contra SSRF.

#### Reescrita

`api/resume/rewrite`. Aplica STAR e Google XYZ preservando empresas, cargos,
datas e formação reais. Entrada cortada em 20.000 caracteres — sem o corte, um
documento de 30 páginas fazia custo e tempo crescerem sem limite. Roda com
`maxProviderAttempts: 1`: geração longa não cabe em meio orçamento, e guardar
metade do tempo para um suplente que também não caberia troca um sucesso por
duas falhas.

#### Orientação profissional

`api/resume/career-orientation`. Produz `profileSummary`, três
`topMatchingAreas` (cargo, percentual de afinidade, justificativa, competências
a estudar) e `careerAdvice`. Quando o usuário importou uma vaga real, ela entra
como referência concreta de mercado.

Uma ressalva importante, herdada de `ANALISE-CUSTOS.md` §2.4 e confirmada no
código: **a base é apenas o currículo**. Não há base de vagas, dados de mercado
nem pesquisa externa. O `matchPercentage` é juízo do modelo sobre o currículo,
não medida de mercado.

#### Presença digital

`api/resume/social-analysis` + `lib/social/fetchers.ts`. Visita os perfis de
verdade — GitHub tem API pública oficial; as demais plataformas dependem do que
é legível, e o LinkedIn sempre exige que o usuário forneça o conteúdo. Cada
perfil sai marcado como **lido** ou **não lido**, e a distinção sobrevive à
exportação: sem ela, o documento perderia justamente a informação que diz o
quanto confiar nele. Produz diagnóstico por perfil, headline pronta para copiar,
texto "Sobre" e ações.

Antes desta rota existir, a "análise de redes" recebia apenas a URL como texto —
o modelo nunca abria nada e o conselho saía da suposição.

#### Downloads

`api/resume/download`. Formatos: currículo reescrito em **PDF**, **Markdown** e
**TXT**; laudo em **PDF**; presença digital em **TXT** ou **Markdown**. Geração
local com `pdf-lib`, sem IA.

### 2.5 Suporte

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

### 3.2 Residência de dados

`lib/data-residency.ts`. Currículo é dado pessoal denso, e enviá-lo a um
provedor é transferência internacional. DeepSeek e Kimi processam na China, que
não tem decisão de adequação da UE — para usuário do EEA, Reino Unido ou Suíça,
os dois são removidos da lista de candidatos. Se isso esvaziaria a lista, a rota
falha em vez de fazer transferência irregular.

O consentimento explícito fica em `User.dataTransferConsent`.

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

---

## 4. Pagamento

**Catálogo** (`lib/pricing/catalog.ts`) — ponto único de verdade. Nenhum preço
existe fora dele.

| Faixa | Países (exemplos) | Unitário | Pacote de 5 |
|---|---|---|---|
| 1 | US, CA, GB, DE, FR, AU, JP | US$ 12,90 | US$ 49,90 |
| 2 | PT, ES, IT, PL, CL, TR, ZA | US$ 8,90 | US$ 34,90 |
| 3 | **BR**, MX, CO, AR, TH, RO | US$ 5,90 | US$ 22,90 |
| 4 | IN, ID, PH, VN, NG, EG, KE | US$ 3,90 | US$ 16,90 |

- **Piso absoluto:** US$ 2,60 por análise. Custo direto medido: US$ 1,0449. O
  teste do catálogo falha se qualquer preço violar o piso, incluindo o unitário
  dentro do pacote.
- **A faixa é decidida pelo país do meio de pagamento**, não pelo IP. O IP só
  sugere a moeda de exibição antes da primeira compra — um usuário atrás de VPN
  não escolhe a própria faixa.
- **O preço nunca vem do cliente.** A rota antiga aceitava `currency` no corpo
  da requisição.
- **Upsell:** pacote de 5, oferecido apenas dentro do resultado e apenas depois
  da primeira compra. A regra é aplicada no servidor.

**Checkout e webhook** (`api/checkout`, `api/webhooks/stripe`). A idempotência é
a falha da inserção única de `WebhookEvent.eventId`, não uma consulta anterior —
duas entregas simultâneas do mesmo evento passariam por qualquer verificação
feita antes da escrita. O `AnalysisLedger` registra faixa aplicada, preço em
dólar, país do meio de pagamento, moeda e valor local: sem essas colunas não há
como conferir, meses depois, se alguém pagou o preço da região certa.

---

## 5. Painel administrativo

Sete abas (`components/admin/admin-view.tsx`):

| Aba | O que faz |
|---|---|
| **Usuários** | Lista, filtra, muda papel, desabilita conta, cria conta e ajusta saldo de análises |
| **Chaves de IA** | Cadastra chave, base URL e modelo por provedor. Chaves cifradas em AES-256-GCM |
| **Precificação** | Faixas, moedas e métodos de pagamento por região |
| **Roteador de IA** | Chamadas, custo, latência e failover por provedor, tarefa, modelo e usuário |
| **Incidentes** | `SystemIncident` — severidade, status, resultado do diagnóstico |
| **Diretor** | Boletim diário consolidado do "enxame" de agentes |
| **Saúde** | Ping no banco e nos provedores |

### Os agentes do painel — o que cada um é de fato

| Agente | Realidade no código |
|---|---|
| **Suporte & Atendimento** | IA real (DeepSeek) |
| **Auto-Diagnóstico** | Envia `"Ping"` com `max_tokens: 5-10` a três provedores só para ver se respondem, testa o banco com `user.count()` e monta texto fixo. Quase zero custo |
| **Qualidade & Auditoria** | JavaScript puro — valida JSON, conta caracteres, checa tamanho das justificativas. Zero IA |
| **Economia & OCR** | Regex puro. Zero IA — e o "OCR" desta caixa não existe (o OCR real é o `pdf-text.ts`) |
| **Analista de logs** | IA real, em lote: procura correlação no `AiLog` que a contagem do painel não mostra |
| **Coordenador Mestre** | IA real: consolida e gera o boletim diário |

Do ponto de vista de custo isso é ótimo — o enxame é quase todo determinístico.
Do ponto de vista de comunicação, a tela descreve dois deles como se avaliassem
qualidade e economizassem tokens por inteligência, quando são validação e regex.

---

## 6. Estado real vs. prometido

Esta seção existe porque um mapa de funcionalidades que lista o que é vendido em
vez do que é entregue não serve para decidir nada.

### 6.1 Três dos nove itens vendidos não têm produtor

`ANALYSIS_DELIVERABLES` lista nove itens. A landing (`i18n/index.ts`), o prompt
do chat de suporte e `PRECIFICACAO.md` repetem os nove.

- **Carta de apresentação** — `cover_letter` existe como tipo de tarefa e está
  roteada para o Claude em `INITIAL_TASK_ROUTING`, mas **nenhuma rota a chama**.
  Não há rota, nem tela, nem prompt.
- **Resumo profissional** — sem produtor. `PRECIFICACAO.md` diz que roda em
  `deepseek-v4-flash`; nenhum código faz isso. O mais próximo que existe é o
  `summary` do segmento `executive`, que é parte do laudo.
- **Otimização de perfil (LinkedIn/Gupy)** — não é um item separado: é o que a
  rota `social-analysis` já entrega (headline, texto "Sobre" e ações). Está
  contado duas vezes nos nove.

Decisão de negócio, não técnica: ou os itens são construídos, ou a lista de nove
é corrigida nos quatro lugares onde aparece.

### 6.2 Código morto e rotas fantasma

- **`lib/llm.ts` não é importado por ninguém.** Contém as versões antigas de
  `full_analysis` e `rewrite`. É a origem do custo por ciclo de US$ 0,0684 que
  `ANALISE-CUSTOS.md` §8 aponta como incompatível com o real.
- **`full_analysis` não tem chamador vivo.** O laudo é produzido por cinco
  chamadas `analysis_segment`. O tipo sobrevive no roteamento e nas regras do
  agente de qualidade.
- **`normalization` está no roteamento e nunca é chamada.** (Correção a
  `ANALISE-CUSTOS.md`: `ocr_extraction`, que aquele documento também dava como
  morta, **hoje é usada** por `pdf-text.ts`.)

### 6.3 Conteúdo de exemplo na tela do laudo

`components/app/analysis-view.tsx` tem um `defaultTargetedChanges` com texto
inventado ("Profissional dedicado e dinâmico buscando novos desafios") usado
como fallback quando a análise não traz `targetedChanges`. É o mesmo padrão que
a orientação profissional eliminou de propósito — lá, a versão anterior
inventava três áreas com percentuais fixos, e hoje a rota prefere falhar a
devolver resultado plausível. Vale aplicar a mesma regra aqui.

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

**O expurgo não roda sozinho** — só pela rota administrativa. Não há `vercel.json`
nem cron configurado.

Segredos (`AiApiKey.apiKey`, chaves da Stripe em `SystemConfig`) são cifrados em
AES-256-GCM (`lib/crypto.ts`). Antes ficavam em texto puro: qualquer backup ou
credencial de leitura vazada entregava as chaves de produção prontas.

**Pendências que não são código:** cláusulas contratuais assinadas,
representante na UE (GDPR Art. 27) e registro de tratamento.

---

## 8. Proposta — Busca de Vagas guiada pela Orientação Profissional

### 8.1 A ideia

Monitorar vagas diretamente nas páginas de carreira das empresas (via ATS), em
vez de agregar de portais, e usar a **orientação profissional que o GriffoWork
já produz** como filtro. Quando aparece uma vaga que merece interromper a rotina
da pessoa, ela é avisada. Quando não aparece nada, ninguém é avisado.

Duas peças já existem em rascunho: um coletor (`coletor.js`, adaptadores para
Greenhouse, Lever e Ashby) e um prompt de julgamento vaga × perfil.

### 8.2 Por que o encaixe é legítimo

A orientação já produz o insumo que um agregador não tem: três cargos-alvo
derivados do currículo, com justificativa, persistidos em
`Resume.careerOrientationJson`. Isso é a semente natural do filtro duro.

Uma ressalva que vem da seção 2.4: use os `role`, **não** o `matchPercentage`.
Aquele número sai do modelo sem nenhuma fonte externa. Filtrar vaga por ele
seria empilhar juízo sobre juízo e chamar o resultado de dado.

### 8.3 O que falta — em ordem de tamanho

**1. Não existe envio de e-mail.** Zero: sem Resend, SendGrid, nodemailer ou
SMTP em `package.json` ou em `src/`. A "regra do silêncio" — só avisar quando
vale a pena — *é* o produto, e o canal inteiro não existe.

**2. Não existe assinatura.** O modelo `Subscription` está no schema, mas só é
lido para contagem no painel e na exportação de dados. Nada escreve nele. A
Stripe está montada como checkout único. Assinatura recorrente é webhook novo,
ciclo de cobrança, cancelamento e inadimplência.

**3. Não existe cron nem fila — e isso é decisão de arquitetura.** `analysis/job.ts`
é explícito: a consulta de status é quem reassume o trabalho, "sem cron nem
fila". O trabalho assíncrono do Griffo só anda quando alguém está olhando a
tela; um monitor diário precisa andar quando ninguém está.

**4. O perfil que o prompt pede não existe no banco.** O bloco `PERFIL DO
CANDIDATO` exige região, modelo de trabalho aceito, pretensão e tipo de
contratação. Nenhum desses campos existe em `User` ou `Resume`. O
`paymentCountry` é país do meio de pagamento — não serve como local de trabalho.
E a orientação entrega prosa e três cargos, não capacidades estruturadas.

### 8.4 Economia

Julgamento por vaga, com ~2.500 tokens de entrada e ~600 de saída:

| Modelo | US$/vaga | 300 vagas/mês |
|---|---|---|
| Gemini 2.0 Flash | 0,00037 | **US$ 0,11** |
| DeepSeek V4-Flash (fora de pico) | 0,00095 | US$ 0,29 |
| Claude Sonnet 5 | 0,0165 | US$ 4,95 |

Dois pontos:

**O Gemini fica mais barato que o DeepSeek novo**, porque nesta tarefa a saída
pesa e o DeepSeek subiu a saída para US$ 0,66/1M contra US$ 0,30 do Gemini. O
Gemini está no registry desde sempre, último na cadeia, "enquanto não se decide
se entra em uso" — e é **permitido para europeu**, ao contrário do DeepSeek e do
Kimi. Sem ele, assinante do EEA cai no Sonnet e custa 17× mais: seriam duas
economias diferentes no mesmo produto.

**O custo escala com assinantes × vagas, não com vagas.** A mesma vaga é julgada
uma vez por pessoa. A saída é quebrar o prompt em dois: extrair a ficha da vaga
**uma vez** (custo dividido por todos) e julgar o encaixe por pessoa sobre a
ficha, não sobre o anúncio inteiro — corta ~3× a parte que multiplica.

Nota favorável: latência não importa aqui. O teto de 60 s, que domina todo o
resto do produto, some — o que torna o modelo barato viável onde no caminho pago
não seria.

### 8.5 O risco que decide a ideia

Greenhouse, Lever e Ashby são majoritariamente tecnologia e empresa
internacional. O usuário do GriffoWork é PT-BR, e o volume do mercado brasileiro
está na Gupy, Solides, InfoJobs e Catho. **Antes de escrever código: montar a
lista das 50 empresas do setor do piloto e contar quantas estão nesses três
ATS.** Se forem 8, o piloto mede a antecedência de um mercado que não é o seu — e
a Gupy, onde está o volume, é justamente a que não tem API pública de leitura.

Custa uma tarde de planilha e decide o resto.

### 8.6 Um defeito no coletor

`fechar.run(emp.nome, agora)` marca como fechada toda vaga não tocada na rodada.
Se o ATS responder HTTP 200 com lista vazia — acontece em manutenção e em troca
de endpoint —, **todas as vagas da empresa são fechadas de uma vez** e no ciclo
seguinte reaparecem como novas, contaminando exatamente a métrica que o piloto
existe para medir (`primeira_vez`). Guarda: não fechar nada quando o adaptador
devolveu zero vaga para uma empresa que tinha vagas abertas.

### 8.7 Como agregar, em três fases

**Fase 1 — piloto sem produto.** Coletor rodando fora da Vercel (Cloudflare
Workers + D1 + Cron Trigger, para onde o script já foi escrito), lista de
empresas, e o prompt julgando contra 5 a 10 currículos reais que já têm
orientação no banco. Mede precisão e antecedência sem tocar no GriffoWork.

**Fase 2 — perfil de matching.** Formulário de preferências (região, modelo de
trabalho, pretensão, contratação) e derivação do perfil estruturado a partir de
currículo + orientação, numa chamada cacheada por currículo. É a única parte que
precisa entrar no produto desde já — e tem valor mesmo se o resto morrer, porque
melhora a própria orientação.

**Fase 3 — assinatura e e-mail.** Só depois de a Fase 1 bater as metas: precisão
≥ 70%, zero falso positivo grave, taxa de aprovação entre 2% e 8%.

### 8.8 O que dá para reusar sem reescrever

- `lib/ai-router/` inteiro — failover, custo por chamada, residência de dados
- O padrão `leaseUntil` do `AnalysisJob`, para trabalho retomável
- `lib/url-guard.ts`, para os links das vagas
- `User.dataTransferConsent`, que já existe

E uma armadilha conhecida: o agente de qualidade valida por tipo de tarefa, e
tipo novo sem regra própria passa batido ou é reprovado por regra alheia. Tipo
novo, regra nova.

---

## 9. O que este documento não cobre

Preço da funcionalidade nova, imposto, e a decisão sobre os três itens vendidos
sem produtor (§6.1). Os números que faltam para fechar a conta da seção 8 são
dois: quantas vagas por assinante por dia sobram do filtro duro, e quantos
assinantes por coorte. É a razão entre eles que decide se o custo de IA é ruído
ou é o custo principal.
