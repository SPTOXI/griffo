# Documento de continuidade — GriffoWork

**Para quem assumir o desenvolvimento deste projeto.**

Escrito em 19/08/2026, ao fim de uma sequência de trabalho que levou o produto
da Etapa 1 à Etapa 8 do prompt mestre. Revisado em 20/08/2026 (PR #61). Este
documento existe para que quem continuar não precise redescobrir o que já foi
decidido, e — mais importante — não repita erros que já custaram caro aqui.

Leia junto com `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, que registra o porquê de
cada decisão em ordem cronológica. Este documento é o resumo operacional; aquele
é a memória.

---

## 0. Onde as coisas estão agora

Este bloco envelhece rápido e é o primeiro a conferir. As datas e o commit dizem
o quanto confiar nele.

| | |
|---|---|
| Última revisão | 24/08/2026, telemetria de funil, UTMs, priorização dinâmica por mercado e unit economics |
| Suíte | 523 testes, `fail 0` — a regra da contagem está na seção 8 |
| `tsc`, `lint`, `build` | limpos nessa revisão |
| Banco | Sincronizado via `prisma db push` (inclui `AnalyticsEvent` e `RadarAlert.notifiedAt`) |

**Pendências que estão esperando alguém, não código:**

1. **`npx prisma db push`** — o PR #61 acrescentou `RadarAlert.notifiedAt` e o
   índice `[notifiedAt, userId]`. Enquanto a coluna não existir no banco, o
   passo do digest no cron diário levanta erro do Prisma. O `catch` do cron
   contém isso — a coleta do Radar termina normal e a resposta traz
   `digest: { ok: false, ... }` —, mas fica um erro por dia no log até rodar.
2. **Conferir o digest com o envio desligado.** Depois da migração, o cron passa
   a registrar no log quem receberia o quê, com o assunto montado. É o material
   para decidir se o conteúdo presta antes de ligar `RADAR_DIGEST_ENABLED`.
3. **Os três testes de produto** que só quem tem conta faz: importar currículo no
   Perfil Profissional, conferir se o preço aparece em real, e abrir o Radar com
   o perfil preenchido para ver se entra vaga de outra área.

**O que NÃO está pendente e parece que está:** o e-mail do digest está
implementado e desligado de propósito (§7.3). Não é trabalho pela metade.

---

## 1. O que é o produto

GriffoWork analisa currículos com IA e, desde a Etapa 7, mantém um **Radar**:
ele coleta vagas de várias fontes, avalia compatibilidade com o perfil de cada
usuário e só avisa quando encontra algo que justifique interromper a pessoa.

Pilha: Next.js 16 (App Router), React 19, TypeScript, Prisma + PostgreSQL
(Supabase, região `sa-east-1`), Stripe, Tailwind/shadcn. Hospedagem na Vercel,
**plano Hobby** — o que impõe limites reais descritos adiante.

---

## 2. Regras inegociáveis

Estas não são preferências de estilo. Cada uma tem uma falha real por trás, e
violá-las já quebrou o produto antes.

### §12 — Coleta vazia NUNCA fecha vaga

Se uma coleta falha, volta vazia ou incompleta, **nenhuma vaga é encerrada**.
Uma fonte fora do ar não pode apagar as vagas de uma empresa.

Isso vive em `src/lib/jobs/collection.ts` (`decideCollection`) e é o coração do
sistema. Toda fonte nova passa por ele. Se você precisar mexer, leia os testes
antes — eles descrevem os casos que motivaram cada linha.

Corolário implementado depois: **fonte de busca não fecha por ausência.**
Greenhouse e Lever listam o que está aberto, então sumir da lista é
encerramento. Gupy, Adzuna, Remotive e RemoteOK devolvem uma fatia de
resultados — sumir dali pode ser mudança de ranking. Isso está declarado em
`JobSourceDescriptor.closesByAbsence`.

### §43 — Nunca inventar dado para a tela parecer completa

Se o modelo não devolveu uma nota, a tela diz que não há nota. Não existe valor
padrão, não existe média inventada, não existe barra de progresso estimada.

Casos reais que motivaram isso:
- A tela de laudo preenchia dimensões ausentes com valores plausíveis.
- A orientação vocacional inventava três áreas com percentuais fixos (88%, 84%, 80%).
- A barra de progresso do envio era calibrada em tempo estimado: chegava a 96% e
  terminava em "erro".
- A Adzuna manda `salary_is_predicted`, e gravar esse salário poria no produto
  um número que ninguém prometeu.

### §21 — Assinatura só depois do Radar provar valor

Não implemente cobrança recorrente enquanto o Radar não tiver mostrado que
funciona com usuários reais. A compra única continua funcionando.

### §30 — Perfil não muda sozinho e em silêncio

O feedback do Radar (👍/👎) fica no `RadarAlert`, nunca é escrito de volta no
`ProfessionalProfile`. Quando algo preenche o perfil automaticamente — o
diagnóstico vocacional faz isso —, só preenche campo **vazio** e **devolve o que
preencheu**, para a tela contar à pessoa.

### Desconhecido nunca elimina

No filtro duro, um campo ausente na vaga não elimina o candidato. "Não sei" é
diferente de "não serve". Ver `src/lib/jobs/types.ts` → `UnknownReason` e
`src/lib/matching/filters.ts`.

### Falhar em silêncio é pior que falhar alto

Um adapter que engole a exceção e devolve lista vazia com `outcome: 'complete'`
está mentindo para o §12. Quando não se sabe se terminou, `partial` é a resposta
honesta.

---

## 3. Estado atual

| Etapa | Situação |
|---|---|
| 1 — Auditoria e estabilização | ✅ produção |
| 2 — Professional Profile | ✅ produção |
| 3 — Market Adapter | ✅ produção |
| 4 — Job Intelligence | ✅ produção |
| 5 — Job Sources | ✅ sete fontes |
| 6 — Matching (3 eixos) | ✅ produção |
| 7 — Radar | ✅ roda por cron, alertas reais gerados |
| 8 — Ação | ✅ Job Fit + currículo direcionado a partir da vaga |
| 9 — Assinatura | ⬜ travada pelo §21 |
| 10 — Escala global | 🟡 12 mercados declarados, cobertura real de fontes varia |
| Aviso por e-mail | 🟡 implementado, envio desligado por decisão — ver §7.3 |

**As sete fontes:**

| Fonte | Cobre | Contrato | Fecha por ausência |
|---|---|---|---|
| Greenhouse | Empresas (US, GB, CA) | Público | Sim |
| Lever | Empresas (variado) | Público | Sim |
| Páginas de carreira (schema.org) | Quem for configurado | Padrão aberto | Sim |
| Gupy | Brasil | **API interna — risco declarado** | Não |
| Adzuna | 10 mercados | Público, com cota | Não |
| Remotive | Remoto internacional | Público | Não |
| RemoteOK | Remoto internacional | Público | Não |

Portugal e Japão não têm fonte de busca por cargo; são atendidos pelas fontes de
vaga remota.

---

## 4. Mapa do código

```
src/lib/
  market/          Adaptação por país. index.ts (12 mercados) e countries.ts (nomes + ISO2)
  profile/         Professional Profile: tipos, validação, derivação de mercado
                   from-orientation.ts — o diagnóstico vocacional semeia o perfil
                   extract.ts — sugestão a partir do currículo
  jobs/
    adapter.ts     Contrato JobSourceAdapter (leia primeiro)
    collection.ts  §12 — a regra crítica
    normalize.ts   Vaga crua → NormalizedJob
    dedup.ts       Chaves sid: / url: / cmp:
    lifecycle.ts   Encerramento por tempo e expurgo
    quota.ts       Cota das APIs externas
    text.ts        Limpeza de HTML compartilhada
    adapters/      Uma fonte por arquivo
  matching/
    filters.ts     Filtro duro — desconhecido não elimina
    compatibility.ts  Três eixos, sem porcentagem única
    job-fit.ts     O que a pessoa vê
  email/
    digest.ts      Monta o conteúdo do e-mail. Puro e com teste
    send.ts        Fala com o Resend. Recebe fetch e config por parâmetro
    unsubscribe.ts Assina e confere o token do link de descadastro
  radar/
    curation.ts    Decide se vale interromper — silêncio é acerto
    runner.ts      A rodada: coleta, encerra por tempo, avalia, alerta
    digest.server.ts  Quem recebe e-mail, e o que vai nele
  ai-router/       Roteamento entre provedores, failover, cache de prompt
  analysis/
    segments.ts    Análise em 5 segmentos paralelos
    resume-context.ts  Bloco cacheável comum às entregas
```

Rotas relevantes: `src/app/api/cron/radar` (a rodada), `src/app/api/radar/*`
(leitura, execução sob demanda, ponte para o currículo),
`src/app/api/admin/quotas` (painel).

---

## 5. Convenções de trabalho

**Branch e PR.** Cada sessão de trabalho recebe uma branch `claude/...` própria e
trabalha só nela; `main` é o que está em produção. Cada bloco vira um PR,
mesclado com **squash**. Mesclar na `main` dispara o deploy pela integração da
Vercel — não existe `vercel deploy` pela linha de comando aqui, e o motivo está
em `.agents/rules/deployment.md`.

**Branch reescrita com `--force-with-lease` nunca aceita `git pull`.** A
`claude/analise-projeto-execucao-pw6cb9` é assim, e qualquer outra pode ser. Use
`git fetch` + `git reset --hard origin/<branch>`. Um `pull` numa branch
reescrita produz merge com histórico que já não existe, e o estrago só aparece
no PR.

**Uma sessão, uma branch — e quando dois blocos independentes caem na mesma.**
A convenção é um PR por bloco, mas a sessão às vezes só tem uma branch. Nesse
caso não force PRs separados: faça **um commit por bloco**, com mensagem que se
sustenta sozinha, e diga no corpo do PR que são assuntos independentes. Foi o
que o #61 fez.

**MCP da Vercel.** O `.mcp.json` registra `https://mcp.vercel.com` no escopo do
projeto, mas a autenticação é OAuth por pessoa e **não acontece em sessão
remota** — ela é não-interativa, e sem autorização nenhuma ferramenta da Vercel
fica disponível. Quem quiser consultar deployment e log pelo agente precisa
autorizar antes, com `/mcp` numa sessão interativa do Claude Code na própria
máquina. Em sessão remota, log de deploy continua vindo por cópia manual.

**Migração.** Não existe diretório de migrações versionadas. O fluxo é editar
`prisma/schema.prisma` e o operador rodar `npx prisma db push` na máquina dele —
o ambiente de desenvolvimento não tem acesso ao banco. Toda migração precisa ser
**aditiva**, e o PR precisa avisar em destaque que ela existe.

**Dependências.** Em sessão remota o contêiner nasce com o repositório clonado e
sem `node_modules`. O hook `.claude/hooks/session-start.sh` roda `npm install`
sozinho no início da sessão — e é por isso que ele está versionado. Se por algum
motivo ele não rodar, `npm install` antes de qualquer verificação: a suíte sem
dependências mente, e como ela mente está na seção 9.

**Verificação antes de qualquer PR:**

```
npx tsc --noEmit
npm test          # ver a nota sobre a contagem na seção 8
npm run lint
npm run build
```

Alterou `prisma/schema.prisma`? `npx prisma generate` antes do `tsc`, ou o
typecheck reclama de um campo que existe no schema e não no cliente gerado.

**Comentários e mensagens em português**, explicando *por que*, não *o que*. O
código diz o que faz; o comentário existe para o motivo que não é óbvio — em
geral, a falha que aquela linha evita. Mensagens de commit e PR seguem o mesmo
princípio: descrevem o problema real e a decisão, não a lista de arquivos.

**Testes descrevem regras, não implementação.** Olhe `jobs.test.ts` ou
`lifecycle.test.ts` para o padrão: o nome do teste é a regra, e o comentário diz
o que quebraria sem ela.

---

## 6. Armadilhas já pagas — não repita

**Escreva adapter contra o payload OBSERVADO, nunca contra a documentação
lembrada.** Cada uma destas só apareceu ao olhar a resposta real:

| Fonte | Armadilha |
|---|---|
| Lever | O cargo está em `text`, não `title`. `createdAt` em **milissegundos** |
| RemoteOK | O cargo está em `position`. `epoch` em **segundos**. Primeiro item do array é aviso legal. `salary_min: 0` significa "não informado" |
| Gupy | `country` vem `"Brasil"` por extenso — comparar com `"BR"` eliminaria toda vaga brasileira |
| Adzuna | `salary_is_predicted` marca salário **estimado por eles**. Responde **200 com `exception`** quando a cota acaba |
| Remotive | `salary` é texto livre (`"$120 - $170 /hour"`). Data **sem fuso** |
| Greenhouse | `updated_at` é edição, não publicação — use `first_published` |

O procedimento que funciona: peça ao operador para rodar um `curl` e colar a
saída, e só então escreva. O ambiente de desenvolvimento **não tem saída de rede
para hosts externos** — o proxy bloqueia.

**Limites do plano Hobby da Vercel.** Cron **diário** (um por dia, `0 6 * * *`),
função com teto de **60s**. Uma tentativa de cron horário teve o deploy recusado.
A região das funções está fixada em `gru1` (São Paulo) no `vercel.json`, ao lado
do banco — antes disso, a função rodava em Washington e cada consulta custava
mais de 100ms, o que já matou uma rodada com 504.

**Nunca faça N+1 no banco.** A gravação das vagas fazia duas consultas por vaga;
84 vagas viravam 168 idas ao banco e estouravam os 60s. Hoje são três:
descobrir o que existe, `createMany` para o novo, transação para as
atualizações.

---

## 7. Trabalho pendente, em ordem

### 7.1 ✅ RESOLVIDO — o Radar quebrava com escala, e antes disso ficava errado

Fica registrado porque a correção tem uma forma que não é óbvia, e desfazê-la por
engano é fácil.

**O erro.** Em `src/lib/radar/runner.ts`, `runForUser` carregava as 500 vagas
abertas mais recentes do banco inteiro, sem nenhuma menção a mercado. Com 300
vagas funcionava; com 50 mil, as 500 mais recentes poderiam ser todas de um país
só, e um usuário brasileiro receberia silêncio havendo vagas brasileiras abertas.
Não era lentidão: era **resultado errado**, calado, piorando sozinho.

**A correção.** `openJobsWithinBudget` (no mesmo arquivo) gasta o teto de 500 em
ordem de prioridade: primeiro as vagas dos mercados da pessoa
(`marketScopeOf`, em `lib/matching/filters.ts`), e — **se sobrar orçamento** — o
resto do mundo, numa segunda consulta.

**Por que a segunda consulta não pode ser removida.** Ela é o que mantém a
mudança sendo de ORDEM e não de ESCOPO. O filtro duro deixa passar vaga sem
mercado declarado, deixa passar vaga remota para quem aceita remoto
internacional, e deixa passar tudo para quem ainda não declarou alvo nenhum. Se o
SQL parasse na primeira consulta, o banco estaria eliminando o que o filtro
decidiu não eliminar — e essa eliminação nem aparece como rejeição em lugar
nenhum. Seria trocar um erro por outro, pior.

**`marketScopeOf` vs `targetMarketsOf`.** São perguntas diferentes.
`targetMarketsOf` responde "o que a pessoa declarou" e governa **eliminação** —
perfil sem alvo vê tudo. `marketScopeOf` responde "o que ler primeiro quando não
dá para ler tudo" e governa **ordem** — perfil sem alvo cai em
`marketInputFrom` + `resolveMarket` (residência, depois idioma). Palpite é
aceitável para ordenar e inaceitável para excluir; não unifique as duas.

**Ordenação.** `NEWEST_FIRST` usa `nulls: 'last'`. Em Postgres, `ORDER BY x DESC`
põe os nulos na frente — sem isso, as vagas que a fonte não datou consumiam o
orçamento antes das vagas realmente recentes.

Com isso feito, o §27 (cache de Job Intelligence — separar o que é da vaga do que
é do par vaga×usuário) passa a fazer sentido. `matchJob` roda por par, é
determinístico e barato; o problema nunca foi ele, era **quantas vagas
irrelevantes chegavam até ele**.

### 7.2 Currículo direcionado a partir da vaga — verificar em produção

`POST /api/radar/prepare` existe e funciona nos testes. Nunca foi exercitado com
usuário real. É a ponte entre o Radar e a venda; se ela falhar, o Radar não
converte.

### 7.3 🟡 IMPLEMENTADO E DESLIGADO — e-mail do digest

O caminho inteiro existe. O envio **não está ligado**, e ligar é decisão de
operação: `RADAR_DIGEST_ENABLED=true`.

O Resend está configurado no domínio `send.griffo.work`, com SPF, DKIM e DMARC
passando — mas os testes caem no spam do Gmail por reputação de domínio novo, o
que se resolve com uso real e não com configuração.

**Onde está.** `lib/email/digest.ts` monta o conteúdo (puro, com teste),
`lib/email/send.ts` fala com o Resend, `lib/email/unsubscribe.ts` assina o token
de descadastro, `lib/radar/digest.server.ts` decide quem recebe o quê, e
`/api/radar/unsubscribe` desliga. O disparo é o mesmo cron do Radar, depois da
rodada — o plano Hobby dá um cron por dia, então não há segundo agendamento a
pedir.

**O que já está resolvido:** idioma do perfil (`communicationLanguage`, com
português como padrão para o que não for pt/en/es), link de descadastro nas duas
versões do corpo mais os cabeçalhos `List-Unsubscribe` da RFC 8058,
`frequency === 'off'` respeitado, `Reply-To` em `@griffo.work`, e
`RadarAlert.notifiedAt` registrando o que já saiu.

**Com a variável desligada o caminho roda mesmo assim** e escreve no log quem
receberia o quê, com o assunto montado. É assim que se confere o conteúdo sem
arriscar a reputação do domínio.

**Três decisões que não são óbvias:**

- **Envia primeiro, marca depois.** Marcar antes tornaria uma falha de envio num
  aviso perdido em silêncio. O contrário, no pior caso, repete um aviso.
  Repetir constrange; sumir é dano.
- **`frequency: 'immediate'` se comporta como diário.** Com um cron por dia, o
  mais rápido que existe é diário. O valor continua aceito, e o código diz isso
  em vez de fingir.
- **GET não descadastra, POST descadastra.** Verificador de link e antivírus
  abrem sozinhos as URLs de um e-mail. Se o GET desligasse, gente seria
  descadastrada sem ter clicado.

**O que ainda não foi exercitado:** nenhuma mensagem saiu de verdade. O módulo
de envio foi escrito contra a documentação do Resend, não contra resposta
observada — exceção declarada à regra da seção 6, e o motivo de `sendEmail`
receber o `fetch` por parâmetro. O primeiro envio real é o primeiro teste real.

**Não ligue o envio antes do Radar estar validado.** Mandar e-mail sobre vaga
ruim queima o domínio, e domínio queimado não se recupera fácil.

### 7.4 Busca imediata paga

Decidido: busca inicial grátis após a orientação (já em produção), Radar diário
grátis, busca imediata como produto pago. Preço sugerido: **R$ 14,90 por 5
buscas**, nunca unidade — a taxa do cartão brasileiro come 17% numa venda de
R$ 3.

O custo marginal real de uma busca é menos de um centavo. O preço sai do valor,
não do custo. A trava que protege a rodada compartilhada da individual já existe
(`lib/jobs/quota.ts`, reserva de 20%).

Falta: saldo de busca no usuário, razão contábil, `sku` no checkout, concessão no
webhook, e a rota que coleta sob demanda com os termos daquele usuário.

### 7.5 Calibragem dos três eixos

Só faz sentido com retorno de usuário real. O que serve é um caso concreto:
*qual vaga não deveria ter aparecido, e por quê*. No abstrato, mexer nos pesos é
chute.

---

## 8. O que fazer antes de tocar em qualquer coisa

1. Leia `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` inteiro. Ele tem 24 seções, cada uma
   explicando uma decisão e o que ela evita.
2. Leia `src/lib/jobs/collection.ts` e seus testes. É a regra mais importante do
   sistema.
3. Rode `npm test` antes de mudar qualquer linha, e guarde o resultado.

   **O que importa é `fail 0`, e não a contagem.** Na data desta revisão eram
   495, mas o número sobe a cada PR e este documento vai ficar para trás — se
   ele não bater, olhe o último PR mesclado antes de concluir que quebrou
   alguma coisa. O que nunca muda é a regra: se havia zero falhas antes de você
   mexer e há falha depois, o problema é a sua mudança, não o teste.

   **Contagem MENOR que a esperada é outra coisa, e é grave.** Suíte que
   encolhe não quebrou: emagreceu em silêncio. As duas causas conhecidas — o
   glob sem aspas e o `node_modules` ausente — estão na seção 9. Confira as
   duas antes de investigar o código.
4. Ao acrescentar fonte de vaga: peça o `curl` ao operador primeiro. Sempre.

---

## 9. Coisas que parecem defeito e não são

- **Radar sem alerta.** Silêncio é o comportamento correto do §15 quando nada
  compatível apareceu. A tela diz isso com todas as letras.
- **`collectionStatus = partial` na Adzuna.** Ela tem mais resultados do que o
  teto de páginas permite ler numa rodada. É honesto, não falha.
- **Gupy e Adzuna com `lastSuccessfulCollection` nulo depois de coleta parcial.**
  Só coleta confiável avança essa data — é o §12.
- **`sourcesConfigured: 0` na resposta do cron.** Significa que nenhum usuário
  tem cargo-alvo declarado; sem termo, fonte de busca não roda.
- **Cache de prompt não acionado em currículo curto.** A Anthropic não cacheia
  prefixo menor que ~1024 tokens, e não avisa.
- **`npm test` com o glob entre aspas.** Sem elas o SHELL expandia
  `src/**/*.test.ts` — e sem `globstar` isso vira `src/*/*.test.ts`, um nível
  só. A suíte passou a rodar 4 testes em vez de 465 no dia em que apareceu o
  primeiro arquivo de teste em `src/lib/` raso, e reportou sucesso. As aspas
  entregam o glob para o `tsx`, que o expande direito. Não tire.
- **Suíte encolhida em sessão remota do Claude Code.** O contêiner nasce com o
  repositório clonado e **sem `node_modules`**. Nesse estado o `npm test` roda
  — o `tsx` vem por `npx` — mas os arquivos que importam `zod` (`matching`,
  `extract`, `profile`) morrem no carregamento com `Cannot find module 'zod'`,
  e os ~99 testes deles não rodam. O relatório vira `tests 375 / pass 372 /
  fail 3` em vez de `474 / 474 / 0`.

  Aqui as três falhas avisaram, mas isso foi sorte: se esses arquivos não
  importassem nada externo, o relatório mostraria `fail 0` com um terço da
  suíte ausente. É a mesma família de armadilha das aspas no glob.

  Resolvido pelo hook `.claude/hooks/session-start.sh`, que roda `npm install`
  no início de toda sessão remota. Se um dia a contagem vier abaixo da do
  último PR mesclado, confira `ls node_modules` **antes** de investigar o
  código.

---

## 10. Áreas onde o erro não aparece como erro

As seções acima tratam do Radar. Esta trata do que é mais perigoso que o Radar.

Nos sete pontos abaixo, uma mudança errada **não quebra teste, não quebra tela e
não aparece em log**. Ela cobra duas vezes, dá crédito de graça, manda dado
pessoal para fora da jurisdição ou apaga currículo de cliente ativo. Você
descobre pela reclamação.

**Regra: nestas áreas, pergunte ao operador ANTES de mexer. Sempre.**

### 10.1 `src/lib/entitlements.ts` — cobrança

O código mais sutil do repositório, e o cuidado dele é invisível para quem lê
rápido.

- `unlockAnalysis` põe as condições **na cláusula da escrita** — `updateMany`
  com `unlockedAt: null` reivindica o currículo, e `update` com
  `analysisBalance: { gte: 1 }` faz o decremento condicional. Trocar por
  `if (saldo >= 1) { decrementa }` reintroduz cobrança dupla em duplo clique.
- O `catch` do final **não compensa nada de propósito**. Preenchê-lo apagaria o
  `unlockedAt` que outra requisição concorrente acabou de gravar *e cobrar*.
- `grantAnalyses` é idempotente **pela restrição única de `paymentRef` no
  banco**, não por consulta prévia. O webhook da Stripe e o retorno do navegador
  correm em paralelo por construção; qualquer `findFirst` antes da escrita perde
  a corrida e credita duas vezes. "Verificar antes de criar" parece mais limpo e
  está errado.

### 10.2 `src/app/api/webhooks/stripe/route.ts` — assinatura sobre o corpo cru

`constructEvent(rawBody, signature, secret)` usa `req.text()`. Nada pode ler
`req.json()` antes, e nenhum parser pode entrar no caminho: quebra o HMAC. Sem
essa verificação, quem souber a URL credita análises para qualquer conta.

### 10.3 `src/lib/data-residency.ts` — isso é lei, não custo

`filterProvidersByResidency` proíbe enviar currículo de usuário do EEE, Reino
Unido ou Suíça para DeepSeek e Kimi — processam na China, que não tem decisão de
adequação da UE. É exigência do GDPR.

Nunca remova nem contorne essa filtragem na cadeia de fallback, por mais barato
que o provedor seja. **O sintoma de violar isto é zero.**

### 10.4 `src/lib/url-guard.ts` — SSRF

`/api/resume/job-fetch` recebe URL fornecida pelo usuário. O guard resolve DNS,
confere **todos** os endereços contra faixas reservadas e revalida **cada salto
de redirecionamento**. A versão anterior comparava texto de hostname e deixava
passar `http://2130706433/` (= 127.0.0.1) e o serviço de metadados da nuvem via
redirect. Nunca troque por `fetch` direto seguindo redirects.

### 10.5 `src/lib/retention.ts` — exclusão irreversível em produção

`resume.deleteMany` usa `updatedAt`, **não** `createdAt`: quem revisou o
currículo ano passado ainda o está usando. Não existe desfazer.

### 10.6 `src/app/api/resume/analyze/route.ts` — assíncrona por necessidade

A rota cria o job, responde na hora, e processa via `after()` gravando o
progresso no banco; a tela acompanha por `GET /api/resume/analyze/status`.

Era síncrona antes: 82s de IA dentro de função com `maxDuration = 60`, e o
usuário via "erro de conexão" depois de mais de um minuto. `await` + responder é
mais simples e traz o 504 de volta.

### 10.7 `src/lib/ai-router/router.ts` — os três números são um sistema

`DEFAULT_TASK_BUDGET_MS = 52_000`, `MAX_PROVIDER_ATTEMPTS = 2`,
`MIN_PROVIDER_TIMEOUT_MS = 12_000`. O teto por tentativa é **derivado** (metade
do orçamento) porque precisa caber **duas vezes**: com 35s fixos, um provedor
travado consumia o prazo inteiro e o segundo nunca era tentado. Mexer num número
isolado desliga o fallback em silêncio. Os 8s que sobram dos 60 existem para
gravar o resultado e responder o erro.

### 10.8 `src/middleware.ts` — o limitador pode matar o próprio produto

As regras casam por **prefixo mais longo**, e não pela ordem da lista. Não
volte para `find(r => path.startsWith(r.prefix))`.

O motivo é um defeito que travou análises em produção sem emitir erro nenhum:
`/api/resume/analyze/status` casava com o prefixo `/api/resume/analyze` e
herdava o limite da rota cara — 10 requisições por 10 minutos. A tela consulta
o status a cada 1,5 segundo por desenho, então tudo depois de quinze segundos
voltava **429**.

E o estrago passava longe da barra de progresso: é a consulta de status que
REATIVA um job cuja invocação a plataforma encerrou (`resumeIfStalled`).
Bloqueada no middleware, ela nunca chegava à rota — o laudo ficava parado no
primeiro segmento para sempre, e a tela girava sobre um trabalho que ninguém ia
retomar.

Ao criar sub-rota de qualquer rota já limitada, confira o limite que ela herda.
Rota de leitura que a tela consulta em laço precisa de regra própria.

### 10.9 A mensagem que vai para a tela é ESCRITA, nunca a do erro

Nenhuma rota devolve `e?.message` ao usuário. O texto de um erro é feito para o
log; mostrá-lo na tela entrega detalhe interno a quem não tem o que fazer com
ele — e às vezes expõe como o sistema é por dentro.

Aconteceu de verdade: a sugestão de perfil devolvia `e?.message`, e o usuário
recebeu *"Falha ao processar com as IAs ativas"*. Depois de uma correção no
roteador, a mesma linha teria mostrado o nome do modelo, o teto de `max_tokens`
e o tamanho do raciocínio do provedor.

O detalhe técnico não se perde e não precisa estar na tela: ele vai para o log
da rota, para `AiLog.errorMessage`, para `AuditLog`, e aparece no painel de
admin na tabela de falhas operacionais.

Exceção legítima: erro de tipo próprio cuja mensagem foi ESCRITA para o usuário
— `BlockedUrlError` em `job-fetch` é o caso, porque ela explica por que aquela
URL foi recusada.

Ao escrever a mensagem, lembre que ela tem duas tarefas: avisar da falha e
dizer o que a pessoa pode fazer agora. "Preencha à mão, funciona igual" evita
que ela abandone a tela; "tente de novo" sozinho, não.

### 10.10 O descadastro do e-mail — o erro aqui é jurídico

`/api/radar/unsubscribe` e `lib/email/unsubscribe.ts`.

Três coisas quebram sem fazer barulho:

- **Tirar o link do corpo do e-mail.** É obrigação legal (LGPD Art. 18, GDPR
  Art. 21). O sintoma de violar isto não é erro nenhum: é a pessoa marcando como
  spam, e o domínio afundando junto.
- **Fazer o GET desligar.** Antivírus e verificadores corporativos abrem as URLs
  de um e-mail sozinhos. Com o GET desligando, uma fatia dos usuários sai da
  lista sem ter clicado — e ninguém descobre, porque "não recebeu e-mail" é
  exatamente como o silêncio do §15 se parece.
- **Fazer o token expirar, ou tirar a assinatura.** Expirado, o direito de sair
  vira mensagem de erro. Sem assinatura, o id na URL deixa qualquer um desligar
  o Radar de qualquer pessoa.

O descadastro desliga o e-mail e **só** o e-mail: conta, análises e alertas na
tela continuam. Tratar as duas coisas como uma apagaria uma decisão que a pessoa
não tomou.

### 10.11 Rotas de administração

Toda rota nova sob `/api/admin/` precisa chamar `getAdminUser()` e tratar `null`
como 403. A função **não lança exceção** — devolve `null`. Esquecer de checar
deixa a rota aberta.

### 10.12 Telemetria de Funil, Upsell e Unit Economics (AOV / ARPU)

Implementado em 24/08/2026 para rastreamento ponta a ponta:
- **`AnalyticsEvent`**: modelo no Prisma com `event` (`page_view`, `checkout_initiated`, `upsell_viewed`), `visitorId`, `userId`, `sku`, `meta`.
- **`PageViewTracker`**: roda no cliente gravando `visitorId` em `localStorage` e disparando evento único de sessão via `/api/analytics/track`.
- **Checkouts**: log de `checkout_initiated` em `/api/checkout` ao criar sessão Stripe.
- **Upsell**: beacon `upsell_viewed` em `repurchase-upsell.tsx` ao exibir a oferta pós-compra.
- **Métricas no Admin (`/api/admin/dashboard`)**:
  - **AOV (Average Order Value)**: $\frac{\text{Receita}}{\text{Pedidos}}$ (em USD e BRL).
  - **ARPU (Receita / Comprador)**: $\frac{\text{Receita}}{\text{Compradores Únicos}}$ (em USD e BRL).
  - **Custo Real de IA / Cliente**: $\frac{\sum \text{AiLog.costUsd}}{\text{Compradores}}$.
  - **Margem Líquida Real**: Lucro após descontar consumo real de IA e taxas do gateway (~4%).
  - **Funil de Conversão e Taxa de Aceitação do Upsell**.

