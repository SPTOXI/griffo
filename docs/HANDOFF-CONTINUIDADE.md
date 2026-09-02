# Documento de continuidade — GriffoWork

**Para quem assumir o desenvolvimento deste projeto.**

Escrito em 19/08/2026, ao fim de uma sequência de trabalho que levou o produto
da Etapa 1 à Etapa 8 do prompt mestre. Revisado em 20/08/2026 (PR #61). Este
documento existe para que quem continuar não precise redescobrir o que já foi
decidido, e — mais importante — não repita erros que já custaram caro aqui.

São três documentos, com papéis diferentes:

| Documento | Responde |
|---|---|
| **este** | o que fazer, o que não quebrar, onde o erro não aparece como erro |
| `docs/MAPA-DO-PRODUTO.md` | **o que o produto é** — rota por rota, módulo por módulo, com o que é vendido conferido contra o que tem produtor |
| `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` | **por que** cada decisão foi tomada, em ordem cronológica |

Este é o resumo operacional, o mapa é o inventário, a auditoria é a memória.
Quem chega agora ganha tempo lendo o mapa antes deste.

---

## 0. Onde as coisas estão agora

Este bloco envelhece rápido e é o primeiro a conferir. As datas e o commit dizem
o quanto confiar nele.

| | |
|---|---|
| Última revisão | 02/09/2026: fase 3 do índice de temperatura de contratação (§2.54) — conectores ILOSTAT e CEPALSTAT, ambos `confidence: 'low'`, que levam a cobertura de **30 para 98 países** (2.757 linhas em `LaborMarketPoint`). Nenhum arquivo de UI ou de i18n foi tocado: o cartão e os 12 dicionários nunca ramificaram por fonte nem por métrica. Falta só da pendência 14: (e) agregação por continente. O cron **não** está agendado no `vercel.json` — é decisão de plataforma, ver o TODO no cabeçalho da rota |
| Suíte | 790 testes, `fail 0` — reverificado após o §2.54 (737 + 53 novos); a regra da contagem está na seção 8 |
| `tsc`, `build` | `tsc --noEmit` e `eslint` limpos após o §2.54; `npm run build` não rerodado nesta revisão — conferir antes de deploy |
| Banco | Sincronizado via `prisma db push` (inclui `AnalyticsEvent`, `RadarAlert.notifiedAt` — ver 7.6 — e `LaborMarketPoint` do §2.51, empurrado em 01/09/2026) |

**Pendências que estão esperando alguém, não código:**

1. **Conferir o digest com o envio desligado.** Com a migração feita, o cron
   registra no log quem receberia o quê, com o assunto montado. É o material
   para decidir se o conteúdo presta antes de ligar `RADAR_DIGEST_ENABLED`.
2. **Os três testes de produto** que só quem tem conta faz: importar currículo no
   Perfil Profissional, conferir se o preço aparece em real, e abrir o Radar com
   o perfil preenchido para ver se entra vaga de outra área. O terceiro já
   aconteceu de verdade em 24/08/2026 — ver 7.6 — e é a razão de a seção 7.5 ter
   deixado de ser hipotética.
3. **Apagar as branches `claude/*` já mescladas.** O `git push --delete` volta
   403 em sessão remota — é operação de humano, pelo navegador ou pela máquina
   dele. A conferência já foi feita e está registrada na seção 11.
4. **Revisão visual da revisão de design (ver 7.7), agora já em `main`.** Todo
   o trabalho foi verificado por `tsc`/`eslint`/`npm test`, mas ninguém olhou
   as telas autenticadas ainda — o agente não tem credencial de login e não
   pode digitá-la. Falta: abrir o produto em produção (ou o dev server) e
   percorrer as telas; comparar com a tag `backup-pre-design-refresh-20260824`
   se algo parecer errado.
5. ~~DeepSeek falhando em `profile_extraction`/`free_preview`/`support_chat`/
   `normalization`~~ — ✅ **resolvido em 25/08/2026** (commit `5c37f71`, ver
   2.28). Piso de tokens dos modelos que raciocinam subiu 4x (4.000→16.000);
   Kimi K3 confirmado como primeiro suplente do DeepSeek.
6. ~~Telas autenticadas sem tradução~~ — ✅ **resolvido em 25/08/2026** (ver
   2.32). As dez telas internas (Perfil Profissional, Histórico, Painel,
   Configurações, Suporte, Downloads, Reescrita, Radar, Envio de Currículo,
   Laudo) migraram para `useI18n`/`t.*`. Trocar o idioma no seletor agora
   tem efeito em toda a interface estática do app pós-login.

   **O que continua em português, de propósito, e não é a mesma pendência:**
   conteúdo gerado por IA por usuário (parecer executivo, justificativas,
   orientação vocacional, carta de apresentação, currículo reescrito) —
   exigiria rodar a geração de novo no idioma-alvo, mudança de backend fora
   do escopo desta rodada; dado de vaga de terceiro no Radar (cargo/empresa
   no idioma original da fonte); e nomes de plataforma social (`LinkedIn`,
   `Gupy`...) que são chave persistida em `socialLinks`, não rótulo de tela.
   Ver 2.32 na auditoria para a lista completa por categoria.
7. **Ver o adapter do JobBase rodar dentro do cron de verdade.** Ligado em
   26/08/2026 (ver 2.33), verificado por `curl` manual contra a API real e
   por 17 testes com `fetch` injetado — mas ainda não foi observado dentro de
   uma execução real do `/api/cron/radar` em produção (orçamento de tempo
   dividido com as outras fontes, paginação sob o teto de 12s por fonte).
   Primeiro deploy que rodar o cron mostra isso; conferir o log dessa rodada.
8. ~~Suplente do Claude e do DeepSeek no roteador de IA era o Kimi, que
   nunca salvava a chamada~~ — ✅ **resolvido em 26/08/2026** (ver 2.34).
   `FALLBACK_CHAIN.claude` e `FALLBACK_CHAIN.deepseek` trocaram o Kimi de
   primeiro suplente para segundo: em 30 dias de `AiLog`, o Kimi como
   segunda tentativa nunca salvou uma chamada (0 em ~46, seja depois do
   Claude ou do DeepSeek), contra 32 de 32 do DeepSeek quando ele ocupava
   essa posição depois do Claude. Regra registrada em `registry.ts`: o Kimi
   só ocupa posição de primário/suplente real em funções SERIAIS
   (`job_deduplication`). Além disso, `profile_extraction` (que tinha 80%
   de erro em 30 dias, pior que os 40% do `social_advice`) ganhou reparo de
   JSON malformado e passou a usar `deepseek-v4-pro` (via o novo
   `modelOverride` em `AiTaskRequest`) em vez do `deepseek-v4-flash`
   padrão. Efeito das trocas de ordem só é visível depois do próximo
   cluster de falha do provedor primário em produção — não há como forçar
   a reprodução sob demanda; conferir `AiLog`/`AuditLog(action:
   'failover')` quando um ocorrer.
9. **Ver as 5 telas de progresso real na prática.** Implementado, testado
   por `tsc`/`eslint`/`npm test`/`npm run build` (582 testes) e no ar desde
   26/08/2026 (ver 2.35 na auditoria) — mas o agente não tem login pra abrir
   o produto e ver as barras de verdade nas 5 telas (perfil social, perfil
   profissional, orientação, carta, reescrita). Falta: percorrer as 5 no
   dev server/preview, inclusive o caminho de erro (forçar falha do
   provedor primário e conferir que "tentando modelo alternativo" aparece
   nos 3 fluxos de chamada única, e que nada quebra se todos falharem).
10. **`REMOTIVE_LEGAL_NOTICE_KEY` (`remote-boards.ts`) — decisão do
    operador.** Achado na busca por código morto de 27/08/2026 (ver 2.40):
    a constante existe, mas só aparece em comentário — nunca é usada de
    fato pra filtrar o aviso legal do Remotive dos resultados da API. Ou é
    um filtro que ficou pela metade (bug: o aviso legal pode estar
    vazando pra dentro dos resultados como se fosse vaga) ou é
    resquício sem função nenhuma. Não decidido nesta rodada porque
    implementar o filtro é mudança de comportamento, não limpeza — fica
    para o operador escolher entre implementar ou remover a constante.
11. **Banner 1200×630 para redes sociais não existe no projeto.**
    Achado no §2.47: `og:image`/`twitter:image` apontavam para um
    arquivo (`/og-image.jpg`) que nunca existiu em `public/` — trocado
    por `/logo-full.png` (693×694, a maior imagem real disponível) como
    stopgap. Falta desenhar um banner de verdade nas proporções
    corretas (1200×630) e trocar a referência nos três arquivos
    (`layout.tsx`, `[country]/page.tsx`, `ats/[slug]/page.tsx`) — é
    trabalho de design, não de código.
12. ~~Domínio nu (`https://griffo.work/`, sem `/país`) sempre serve
    português no primeiro HTML~~ — ✅ **resolvido em 30/08/2026**
    (`src/middleware.ts`, ver §2.50). Redireciona (307) por geo-IP pra
    rota de país certa, respeitando sessão logada e escolha manual de
    idioma (cookies `ca_session`/`griffo_lang`), poupando bots/crawlers,
    e desligável via `GEO_REDIRECT_ENABLED=false` sem reverter commit.
    `<html lang="pt-BR">` do `layout.tsx` em si continua fixo — mas como
    o visitante agora chega direto em `/país` (que passa `forcedLang`
    pro componente certo), na prática deixa de ser alcançado pelo fluxo
    normal; só afeta quem entra sem cookie/redirect (ex.: bot).

13. ~~`npx prisma db push` do `LaborMarketPoint` (§2.51), e conferir que os
    conectores gravam de verdade em produção.~~ — ✅ **resolvido em
    01/09/2026.** Tabela criada (só adição). `npx tsx
    src/scripts/fetch-hiring-index.ts` rodado sem `--dry-run` contra o banco
    de produção: **729 linhas gravadas**, 30 séries de país (1 EUA via
    BLS, 29 EU/EEE via Eurostat). Conferido por consulta direta ao banco, não
    só pelo log do script — a linha mais recente dos EUA bateu com o valor
    (`4.4`), o período (jul/2026) e a nota de rodapé (`P`, preliminar) vistos
    na resposta real da API no §2.51.
14. **Fases 2 e 3 do índice de temperatura de contratação** — ✅ **(a), (b) e
    (c) resolvidos em 02/09/2026** (§2.52); ✅ **(d) resolvido em 02/09/2026**
    (§2.54). Só **(e)** continua aberto.

    - (a) ~~texto traduzido nos 12 idiomas para os rótulos das fases e para o
      estado "dado insuficiente"~~ — feito: bloco `hiringIndex` em
      `i18n/types.ts` e nos 12 locais, 22 chaves cada, 100% de paridade no
      `scripts/sync-i18n.ts`. Nome de instituição (`Eurostat`, `BLS`) fica
      FORA do dicionário de propósito — é nome próprio; nome de país sai de
      `Intl.DisplayNames` no idioma ativo.
    - (b) ~~tela~~ — feito: `components/app/hiring-index-card.tsx` no laudo
      pago, acima do parecer executivo, com mercado-alvo vindo do
      `primaryMarket` (recuo: `residenceCountry`). Regra do componente: ele
      **nunca some**. Quatro desfechos com texto próprio — fase, coberto sem
      histórico, sem cobertura, e falha de consulta.
    - (c) ~~ligação no cron~~ — feito, mas **não** dentro do
      `/api/cron/radar`: virou `/api/cron/hiring-index`, rota separada com
      autenticação idêntica (`CRON_SECRET`). O Radar tem orçamento de 12s por
      fonte dentro de 60s já divididos com o digest, e estatística oficial
      publicada por mês/trimestre não tem por que disputar tempo com coleta
      de vaga, que é diária. A lógica é compartilhada com o script manual em
      `lib/hiring-index/collect.ts`. **Pendência de plataforma que sobrou
      daqui:** o agendamento no `vercel.json` NÃO foi declarado — a conta é
      Hobby, já tem dois crons, e qual dia/hora custa invocação e é decisão
      do operador. A rota funciona e responde a `Bearer $CRON_SECRET`; o TODO
      está no cabeçalho dela.
    - (d) ~~**conectores ILOSTAT e CEPALSTAT**~~ — ✅ **feito em 02/09/2026**
      (§2.54). `connectors/ilostat.ts` (SDMX em `sdmx.ilo.org`, fluxo
      `DF_UNE_DEAP_SEX_AGE_RT`, trimestral) e `connectors/cepalstat.ts`
      (`api-cepalstat.cepal.org`, indicador 2182), mais
      `connectors/iso3.ts` para a tradução alfa-3 → alfa-2 que as duas
      precisam. Todo ponto sai `confidence: 'low'`, incondicionalmente — 0
      linhas com outra coisa, conferido no banco. Cobertura de **30 para 98
      países**, 2.757 linhas gravadas em produção. **Nenhum filtro de país
      foi escrito nos conectores**, de propósito: `selectSeries` já prefere
      BLS/Eurostat onde há sobreposição, e isso foi conferido contra o banco
      (Alemanha continua em `eurostat_jvs`, EUA em `bls_jolts`). Nenhum
      arquivo de UI nem de i18n precisou mudar. **Ponto de atenção:** a
      gravação passou de 729 para 2.757 linhas e a coleta inteira leva ~24s
      contra o teto de 60s da função do cron — a janela de 24 trimestres por
      fonte é o que segura esse número.
    - (e) **agregação por continente**, que precisa responder antes como se
      agrega uma série que o §2.51 diz não ser comparável entre países (a
      resposta provável é agregar as *fases*, não os valores).

**O que NÃO está pendente e parece que está:**

- O e-mail do digest está implementado e **desligado de propósito** (§7.3). Não é
  trabalho pela metade.
- O **`npx prisma db push` do `RadarAlert.notifiedAt`** foi listado como
  pendência do PR #61 até 24/08. A tabela acima registra o banco sincronizado
  com a coluna e o índice `[notifiedAt, userId]`, então o erro diário do Prisma
  no passo do digest deixou de acontecer. Se ele reaparecer no log, é a linha
  "Banco" desta tabela que está errada — não uma pendência que voltou.

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

### Nunca dar sensação de travamento, bug ou "sem resposta"

Toda ação que leva mais que um instante perceptível — geração de IA, upload,
processamento em segundo plano — mostra sinal REAL de que está em andamento.
Isso não é o mesmo que o §43 permite: aqui a exigência é usar só sinal real —
estado do servidor, etapa concluída, evento que de fato ocorreu — nunca
inventar um número ou uma frase pra parecer que algo está acontecendo quando
não está. Toda entrega, além disso, mira em qualidade da informação e em
superar a expectativa de quem está usando o produto — não só em não travar.

Motivado por: pedido do operador em 26/08/2026 ao encomendar progresso real
em cinco fluxos de IA (leitura de perfil social, preenchimento do Perfil
Profissional, orientação vocacional, carta de apresentação, reescrita do
currículo) — nenhum deles podia dar a impressão de bug, congelamento ou
ausência de ação. Ver 2.35 na auditoria para o desenho completo.

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
| 10 — Escala global | 🟡 13 mercados declarados, cobertura real de fontes varia |
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
  market/          Adaptação por país. index.ts (13 mercados) e countries.ts (nomes + ISO2)
  profile/         Professional Profile: tipos, validação, derivação de mercado
                   from-orientation.ts — o diagnóstico vocacional semeia o perfil
                   extract.ts — sugestão a partir do currículo
  jobs/
    adapter.ts     Contrato JobSourceAdapter (leia primeiro)
    collection.ts  §12 — a regra crítica
    normalize.ts   Vaga crua → NormalizedJob
    dedup.ts       Chaves sid: / url: / cmp: — a camada determinística
    agent-dedup.ts Faxina semântica. A ÚNICA rotina que apaga vaga fora do
                   expurgo por tempo: confiança ≥ 0,85, alerta migra, não some
    lifecycle.ts   Encerramento por tempo e expurgo
    quota.ts       Cota das APIs externas
    text.ts        Limpeza de HTML compartilhada
    adapters/      Uma fonte por arquivo
  analytics/
    market-performance.ts   Funil e margem por país. Decide onde a verba entra
    job-source-quality.ts   Qualidade/tempo de renovação/maturidade por fonte de vaga (2.30)
    agent-maturity.ts       Maturidade dos agentes de IA (por TaskType) e do sistema (2.31)
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
arriscar a reputação do domínio. A coluna `notifiedAt` já está no banco desde
24/08, então esse caminho roda inteiro — era ela que faltava.

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
chute. O primeiro caso concreto chegou — ver 7.6.

### 7.6 ✅ RESOLVIDO — coluna ausente em produção, e o defeito de matching que ela escondia

Registrado em detalhe em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, seção 2.25. Resumo
operacional aqui.

**O incidente.** `RadarAlert.notifiedAt` (schema do PR #61) nunca foi aplicada
ao banco de produção — o item 1 da seção 0 ficou pendente por dias sem que
nada avisasse. Não era um risco teórico: quebrava `GET /api/radar` e
`POST /api/radar/run` com `P2022` a cada chamada, e a tela escondia isso atrás
do estado "nada digno de nota", mostrando as duas mensagens juntas — o próprio
banner de erro dizia "não foi possível carregar" e o card abaixo dizia
"o Radar está monitorando e não encontrou nada", ao mesmo tempo. `db push`
resolve; a tela também foi corrigida para nunca mais mostrar as duas coisas
juntas (`radar-view.tsx`).

**O que a correção revelou.** Assim que os alertas voltaram a ser gravados,
apareceu o caso concreto que a seção 7.5 esperava: um perfil de gestão
hospitalar (`coordenação`, `saúde`) recebendo "Analista de Dados" e
"Coordenador de Desenvolvimento de Software" como **boa compatibilidade**.

Causa: vaga sem `requirements`/`skills` cadastrados recebe nota neutra (50) no
eixo Vaga — decisão de design correta, documentada em `compatibility.ts`. O que
não estava correto era essa neutralidade se combinar com senioridade batendo
**por coincidência de nível hierárquico, não de cargo** (o normalizador lê
"Coordenador" no título e classifica como senioridade `lead` — o mesmo nível
que o perfil da pessoa, para qualquer área) e produzir sinal suficiente para
"boa compatibilidade" sem nenhuma evidência real de que o cargo tem relação
com o perfil.

**A correção**, em `src/lib/matching/compatibility.ts`: o veredito só passa de
`partial` quando o cargo é reconhecido como o mesmo (`confirmedSameRole`,
função nova, única fonte dessa pergunta) **ou** a vaga lista requisito que bate
com competência declarada. Sem isso, senioridade e anos de experiência sozinhos
não bastam — eles dizem algo sobre a pessoa, nada sobre a vaga específica.

Os 43 testes de `matching.test.ts` continuam passando sem alteração, incluindo
o que documenta "vaga sem requisito não pode ser punida" (linha ~447) — o que
mudou é só o teto do veredito quando não há evidência a favor, não a regra que
protege contra penalizar ausência de dado.

**Efeito colateral aceito.** Os 31 `RadarAlert` já gravados (2 usuários) foram
apagados em produção para que a próxima varredura regrave com a regra nova — a
leitura não recalcula por desenho (§ do prompt mestre), então mantê-los teria
deixado o veredito antigo na tela até a próxima rodada de qualquer forma.
Nenhuma vaga foi apagada, só o registro do alerta.

### 7.7 🟡 EM REVISÃO — revisão visual de todo o app, branch `design-refresh-2026-08`

Pedido do usuário: interface mais moderna, fácil de navegar e visualmente
agradável, mantendo a paleta de marca e a sobriedade, sem alterar
funcionalidade, com backup do estado anterior. Detalhe completo em
`docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, seção 2.26.

**Backup.** Tag `backup-pre-design-refresh-20260824` no commit que era `main`
antes de qualquer mudança. Todo o trabalho está na branch
`design-refresh-2026-08` — `main` não foi tocado, e nada foi publicado em
produção.

**O achado que guiou tudo.** A "paleta da marca" (navy `#0B192E` + azul
`#0B63E5`) era usada de forma consistente, mas só como hex literal repetido
centenas de vezes — sem token central, com três gradientes escuros diferentes
fazendo o mesmo papel visual. Por cima disso, pelo menos 7 tons soltos
(slate/sky/violet/amber/emerald/blue/indigo) decidiam cor tela por tela sem
mapa de significado: o estado ativo do menu era emerald sem relação com a
marca, o botão de admin tinha forma diferente dos outros itens, badges de
status usavam 5 cores sem critério.

**O que foi feito, em 4 fases (cada uma com commit próprio):**
- **Fase A** — `globals.css`: registra `--primary` (azul da marca) e
  `--brand-navy` como tokens de verdade, com o mapa semântico documentado em
  comentário (primary/emerald/amber/destructive/violet-só-admin/slate).
  `tailwind.config.ts` foi deixado intocado: é Tailwind v4 com `@theme inline`
  no CSS, e o config `.ts` com `hsl(var(...))` não está carregado (sem
  `@config` no CSS) — é código morto, não quebrado.
- **Fase B** — `app-shell.tsx`: estado ativo do menu passa de emerald pra
  `primary`; botão de admin ganha a forma dos outros itens (a cor violeta fica,
  como identidade documentada da área admin); zero hex solto; breadcrumb para
  de repetir "Painel > Painel".
- **Fase C** — sweep em todas as telas de `src/components/app/`: zero hex de
  marca hardcoded restante no diretório inteiro; violeta só aparece em admin ou
  nos dois arquivos que o plano decidiu preservar por já terem sistema de cor
  por categoria bem cuidado (`radar-view.tsx` com indigo como identidade
  própria da tela, `analysis-view.tsx` com cor por tipo de entrega).
  `dashboard.tsx` também perdeu um card de estatística que duplicava o saldo já
  mostrado no banner acima.
- **Fase D** — landing: grid de features passa de 6 para 9 (Radar de Vagas,
  Orientação de Carreira, Carta de Apresentação), reordenado em blocos com
  sentido. Ver seção 2.26 do documento de auditoria para a lista completa.

**O que NÃO foi feito, por decisão registrada no plano:**
- Seção de destaque dedicada ao Radar na landing (estilo `#social`) — mais
  arriscada de acertar de primeira, não necessária pro pedido.
- Estatística nova no hero sobre o Radar — sem dado real auditável por trás,
  não inventa (regra permanente do produto).
- `admin-view.tsx` — fora do escopo funcional (área interna, não afeta usuário
  pagante).

**O que falta.** Verificação visual nas telas autenticadas — o agente não tem
credencial de login e não pode digitá-la (regra de segurança), então o usuário
optou por revisar tudo no final em vez de logar durante o trabalho. `tsc`,
`eslint` e `npm test` (510/510) estão limpos em cada commit, mas ninguém olhou
as telas no navegador ainda. Antes de mergear em `main`: abrir a branch
localmente ou no Preview da Vercel e percorrer dashboard, upload, perfil
profissional, radar, planos, histórico, downloads, configurações, suporte e a
landing nos três idiomas — inclusive o menu em mobile.

**Continuação (mesmo dia, mesma branch): hero + UX de laudo/perfil.**
Depois de revisar o resultado, o usuário pediu duas coisas mais específicas.
Detalhe completo em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, seção 2.27.

- **Hero da landing**: badge/CTAs/mockup tokenizados, faixa de confiança virou
  `flex flex-wrap` (era grid rígido, quebrava torto em tela estreita).
- **`analysis-view.tsx` (o laudo)**: achado estrutural, não estético — a
  navegação por abas era falsa. O padrão era `activeTab: 'all'`, que renderiza
  as 8 seções empilhadas na mesma rolagem; a barra de abas só filtrava o
  scroll. Corrigido: padrão vira `'overview'` (uma linha), mais uma faixa de
  resumo fixa (`sticky top-14`) com nota + status ATS visível em qualquer aba
  — a nota sumia da tela ao trocar de aba antes disso. Texto de leitura longa
  subiu de `text-xs` para `text-sm`. **Decisão registrada**: não trocar a
  barra de abas hand-rolled pelo componente `Tabs` do shadcn — a cor por aba
  não é decorativa (a aba "Match Vaga" herda a severidade do resultado),
  trocar tocaria as 8 seções condicionais do arquivo de 1500 linhas por ganho
  majoritariamente de acessibilidade. Fica pra depois.
- **`professional-profile-view.tsx`**: as 5 seções de dado (não o cartão de
  intro) viram `Accordion` com badge "Preenchido" por seção — calculado por
  leitura direta do `profile`, sem estado novo. Seção vazia abre sozinha.
- Mesma pendência de antes: verificação visual continua sem ser feita (sem
  login). `npm test` 510/510, `tsc`/`eslint` limpos em cada commit.

---

## 8. O que fazer antes de tocar em qualquer coisa

1. Leia `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` inteiro. Ele tem 24 seções, cada uma
   explicando uma decisão e o que ela evita.
2. Leia `src/lib/jobs/collection.ts` e seus testes. É a regra mais importante do
   sistema.
3. Rode `npm test` antes de mudar qualquer linha, e guarde o resultado.

   **O que importa é `fail 0`, e não a contagem.** Na data desta revisão eram
   523, mas o número sobe a cada PR e este documento vai ficar para trás — se
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

---

## 11. Branches `claude/*` no remoto — conferência de 20/08

Doze branches acumularam no remoto. A conferência abaixo foi feita comparando o
tip de cada branch com o head do PR correspondente, e — para as fechadas sem
merge — procurando cada linha adicionada dentro da `main` de então. Ela existe
para que ninguém precise repetir o trabalho, e para que ninguém apague por engano
a única cópia de alguma coisa.

**Nove com PR mesclado e tip igual ao head do PR. Seguras:**

```
claude/analise-projeto-execucao-pw6cb9        claude/painel-laudo-8-dimensoes-2uintg
claude/code-audit-planning-pc5sap             claude/price-changes-frontend-backend-stripe-a37av5
claude/github-code-changes-ru61f3             claude/profile-pdf-analysis-timeout-g5dvhx
claude/handoff-revisao-pos-61                 claude/vercel-claude-code-connection-nvz7jn
claude/mcp-vercel-integration-c5qpvw
```

**Três com PR fechado SEM merge.** Nenhuma delas guarda trabalho vivo:

| Branch | PR | Situação verificada |
|---|---|---|
| `claude/deepseek-v4-pricing-update-z1aijg` | #22 | O commit de preço foi recuperado **inteiro** pelo PR #45: `pricing.ts` e `pricing.test.ts` byte a byte idênticos, e nenhuma das 68 linhas adicionadas em `registry.ts`, `types.ts`, `admin-view.tsx` e `ANALISE-CUSTOS.md` falta na `main`. O segundo commit era o `MAPA-DO-PRODUTO.md` — recuperado depois, ver abaixo |
| `claude/index-page-design-review-3okhnq` | #15 | **Não** foi recuperado — 77 de 90 linhas da `landing.tsx` e as 155 do `i18n/index.ts` não estavam na `main`. Mas o segundo commit mexe em `lib/credits.ts` e `api/credits/*`, três arquivos que a `main` apagou junto com o modelo de créditos, e a landing foi reescrita depois. Trabalho superado, não perdido |
| `claude/page-load-error-39mpbh` | #2 | Recuperado **inteiro** pelo PR #45, e melhorado: as três regras de `Cache-Control` estão na `next.config.ts` com os mesmos valores, agora com a constante `HTML_ONLY` e a tabela explicando cada uma |

**A quarta fechada sem merge, e por quê.** A `claude/mapa-do-produto-recuperado`
(PR #63) trazia o mapa de volta, reescrito contra a `main` de 20/08. Ficou aberta
esperando merge enquanto a `main` andava dez commits, e o documento envelheceu
dentro do próprio PR que existia para desenvelhecê-lo — além de passar a
conflitar com a §0 daqui. O conteúdo foi conferido de novo contra `ccdac2c` e
entrou pelo PR #66. A branch foi fechada como superada, não descartada.

**A lição, que vale mais que a lista.** O PR #45 se chama *"Recupera o preço do
DeepSeek e a política de cache dos PRs #22 e #2"* — alguém já teve de refazer à
mão trabalho que estava pronto numa branch fechada por engano. Fechar PR sem
mesclar é decisão que precisa ser dita em voz alta; senão o conteúdo não some,
mas fica caro de achar.

E documentação parada em PR aberto apodrece por conta própria: o #63 cobrou o
preço em retrabalho de conferência, não em conflito de git. Doc que descreve a
`main` precisa entrar junto com ela, ou nasce vencida.
