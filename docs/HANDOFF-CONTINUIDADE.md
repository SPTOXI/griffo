# Documento de continuidade — GriffoWork

**Para quem assumir o desenvolvimento deste projeto.**

Escrito em 19/08/2026, ao fim de uma sequência de trabalho que levou o produto
da Etapa 1 à Etapa 8 do prompt mestre. Revisado em 20/08/2026 (PR #61). Este
documento existe para que quem continuar não precise redescobrir o que já foi
decidido, e — mais importante — não repita erros que já custaram caro aqui.

São quatro documentos, com papéis diferentes:

| Documento | Responde |
|---|---|
| **este** | o que fazer, o que não quebrar, onde o erro não aparece como erro |
| `docs/MAPA-DO-PRODUTO.md` | **o que o produto é** — rota por rota, módulo por módulo, com o que é vendido conferido contra o que tem produtor |
| `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` | **por que** cada decisão foi tomada, em ordem cronológica |
| `docs/AUDITORIA-INDICE.md` | **onde** achar um `§` da auditoria por linha e por tema, sem abrir o arquivo inteiro |

Este é o resumo operacional, o mapa é o inventário, a auditoria é a memória,
o índice é como não ler a memória inteira pra achar uma lembrança.
Quem chega agora ganha tempo lendo o mapa antes deste.

---

## 0. Onde as coisas estão agora

Este bloco envelhece rápido e é o primeiro a conferir. As datas e o commit dizem
o quanto confiar nele.

| | |
|---|---|
| Última revisão | 11/09/2026: **`/privacy` sai do papel, e nasce um agente de revisão de tradução (§2.120)** — resposta do operador às duas pendências do §2.119. Cartão ilustrativo do Hero D: confirmado que dados pessoais fictícios servem para simulação, sem precisar de auditoria real — fechado sem mudar código. Falta de página de privacidade: "pode criar uma que não nos comprometa" — como não existe razão social/CNPJ formalizado ainda (confirmado com o operador antes de escrever qualquer texto), a página cita "GriffoWork" como marca, não pessoa jurídica, e evita qualquer promessa que o produto não cumpre. Todo fato é verificável no código: sub-processadores de IA de `ai-router/registry.ts` (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI), retenção de `lib/retention.ts` (currículo inativo 730 dias, log de IA 365, auditoria 730, pagamento 90), restrição por residência de dados de `lib/data-residency.ts` (UE/Reino Unido/Suíça sem DeepSeek/Kimi), direitos do usuário como rotas que já existem (`GET /api/user/export`, `DELETE /api/user`) — nada prometido que não está implementado. Módulo próprio `lib/privacy/` (mesmo padrão de `lib/enterprise/`), rota `src/app/privacy/page.tsx` fora do `[country]`, "LGPD & GDPR" do Hero D virou link. **12 idiomas** — decisão do operador, "só em inglês corremos o risco de perder clientes"; aqui o **inglês** é a fonte (não português, diferente do Hero D), com o português escrito em paralelo com os mesmos fatos. Nasce `.claude/agents/translation-reviewer.md`, pedido explícito do operador ("precisamos criar um agente para revisar e sempre aprimorar as traduções") — disponível a partir da próxima sessão (registro de agente não recarrega em sessão em andamento); nesta sessão a mesma revisão rodou por um fork seguindo as instruções do agente. `tsc`, `eslint`, `build` limpos; `/privacy` verificado por `curl` em inglês e português. Pendente: revisão jurídica de verdade antes de tratar como blindagem definitiva, e atualizar a página quando existir CNPJ |
| Anterior | 11/09/2026: **Hero D + faixa "A ordem importa" — landing reposicionada da vaga para a auditoria (§2.119)** — a partir de um handoff de design (4 direções de hero, só a D aprovada), o hero público e uma faixa nova (`hero-d.tsx`, `order-band.tsx`) passaram a comunicar a cadeia oficial (inteligência → análise → auditoria → otimização → direcionamento → Radar) em vez de abrir pela vaga; "Conectamos você a oportunidades, não a vagas." A parte que mais importava não era visual: quatro pontos de dado do protótipo eram ilustrativos e foram checados contra a implementação antes de publicar. `{N}` vagas abertas trocou o 1.284 inventado por `db.job.count({closedAt:null})` real (**8.281** hoje) — exigiu `src/app/page.tsx` virar Server Component (lógica antiga foi para `home-client.tsx` novo) e as 41 rotas `/[country]` ganharem o mesmo tratamento (`revalidate=300` nas duas). O cartão de exemplo (91%→43%) é ilustrativo, não uma auditoria real — ganhou rótulo visível "Exemplo ilustrativo", a saída que a própria especificação autoriza na ausência de um caso real anonimizado. A frase "seu arquivo não vai para lugar nenhum" foi **descartada** da linha de confiança: é falsa — o currículo vai sim a provedores de IA de terceiros para a própria análise (`lib/ai-router`) e fica retido até 730 dias. "12 idiomas" e "LGPD & GDPR" mantidos, verificados contra código real. Chaves novas (`heroD`, `orderBand`) escritas nos 12 idiomas, não só português — mas só o português é copy aprovada pelo cliente; as outras 11 traduções ainda não têm revisão nativa. `tsc`, `eslint`, `build` limpos; contagem do banco conferida duas vezes fora do Next. Achado à parte: o navegador via Playwright mostrou "0" persistente nesta sessão onde `curl` (inclusive imitando cabeçalhos de Chrome) sempre confirmou o valor certo — isolado como artefato da ferramenta de automação, não bug do código (registrado em memória) |
| Anterior (2) | 10/09/2026: **Bloqueio de merge fica desligado por limite de plano — decisão registrada (§2.118)** — o §2.116 deixou como pendência marcar o check do CI como *required* na `main`. O operador tentou e o GitHub recusou: em repositório **privado no plano gratuito** não há como aplicar *ruleset* nem proteção clássica ("until you move to GitHub Team organization account"). Três saídas apresentadas — deixar informativo, GitHub Pro (~US$ 4/mês) ou tornar o repo público (descartada) —, **decisão: deixar informativo e reavaliar na primeira venda**. Consequência dita sem eufemismo: um commit vermelho PODE ser mesclado na `main`, e mesclar dispara o deploy; o que impede isso hoje é processo, não o GitHub. Gatilho para reabrir: primeira venda ou segundo colaborador com acesso de escrita. Registrada também a instrução permanente do operador — documentar tudo, inclusive o que não foi feito e por quê (seção 5) |
| Anterior (3) | 10/09/2026: **Cobrança e failover ganham teste — o H6 fecha por inteiro (§2.117)** — as duas áreas que a seção 10 marca como "onde o erro não aparece como erro" estavam sem cobertura porque começam com `import 'server-only'`, que lança fora do Next. Resolvido com `scripts/test-setup.mjs` (`registerHooks` redirecionando SÓ esse specifier; `--conditions=react-server` foi medido antes e descartado: derrubava a suíte de 938 para 907 com 2 falhas). O banco entra pelo `globalThis.prisma`, o mesmo ponto do hot reload — **zero linha de produção mudou**. 20 casos de cobrança (idempotência da compra, duplo destrave, corrida perdida, rollback do destrave quando o saldo some, admin sem ledger, as três guardas de rota) e 13 de failover (suplente por erro, por lixo aprovado em 200, por truncamento; rastro em AuditLog; erro do usuário sem vazar provedor; **residência de dados provada pelo endereço que recebeu a chamada**). Os testes foram testados: 12 mutações no código de produção, **uma passou verde** — o teste de PDF usava uma tarefa que já ia para o Claude —, corrigida com tarefa roteada para outro provedor e asserção sobre `primaryModel`. Sem cobertura, e dito: o corte por orçamento de tempo, que exigiria dormir 25s. Suíte **971/971**, `tsc` e `eslint` limpos |
| Anterior (4) | 10/09/2026: **CI no GitHub Actions — a verificação sai da memória humana (§2.116)** — pedido do operador na sequência do §2.115 ("não quero nada que dependa da memória humana"). Até aqui o único workflow era o cron mensal do hiring-index, e os checks dos PRs eram do Vercel, que só prova que o preview buildou: `next build` não executa teste, então um commit podia entrar em `main` com a suíte quebrada e o PR ficar verde. `.github/workflows/ci.yml` roda `npm ci` → `prisma generate` → `tsc --noEmit` → `eslint` → `npm test` a cada `pull_request` e a cada `push` em `main`. **Sem segredo e sem banco**, verificado e não suposto: `prisma generate` roda com as duas env vars do Postgres ausentes, e o único teste que toca ambiente (`middleware.test.ts`) seta e restaura `GEO_REDIRECT_ENABLED` sozinho. `npm run build` fica de fora porque o Vercel já builda o preview com as env vars reais. Validado num clone limpo, com os passos exatos do workflow na ordem exata. Falta um botão que só o dono do repositório aperta: marcar o check como *required* na proteção de `main` — sem isso o CI informa, mas não barra |
| Anterior (5) | 10/09/2026: **Conferência de fim de sessão — nada pendente de push, uma deriva de documentação corrigida (§2.115)** — `main` no remoto exatamente no commit local, árvore limpa, só `main` no remoto, nenhum PR aberto; `tsc`, `eslint` e a suíte (938/938, `fail 0`) reconferidos limpos. O que a conferência achou foi documentação errada, não código: o §7.3 deste documento ("🟡 IMPLEMENTADO E DESLIGADO... nenhuma mensagem saiu de verdade") e o §8.7 do `MAPA-DO-PRODUTO.md` ("o envio está desligado por decisão") ainda descreviam o digest como desligado, oito dias depois de o §2.108 registrar o contrário — ligado em 08/09, 4 e-mails reais confirmados por `notifiedAt` no banco. Documento errado é pior que documento ausente: parece confiável. As duas seções agora descrevem o estado real, com a armadilha reutilizável do `RESEND_API_KEY` escrito sem `=` no `.env` e o redeploy que não bastou. O aviso de reputação de domínio continua nos dois lugares — deixou de ser motivo para manter o envio desligado, virou o motivo de o matching ser inegociável agora que sai e-mail |
| Anterior (6) | 09/09/2026: **Licença do dataset decidida: CC BY 4.0 (§2.114)** — pendência aberta desde o §2.85, registrada como jurídica/não técnica. Apresentadas três opções: (1) CC BY 4.0 — uso livre com atribuição; (2) licença própria restritiva — uso editorial sim, redistribuição comercial não, sem bloqueio técnico; (3) CC0 no dado bruto, proprietário só na metodologia/apresentação. Recomendação dada — CC BY 4.0, porque o objetivo desde o §2.85 era autoridade externa/backlink, não proteger dado que já é majoritariamente público de origem (BLS/Eurostat/ILOSTAT/CEPALSTAT) — **aceita pelo operador**. Implementado: campo `license` no `Dataset` JSON-LD de `market-pulse/page.tsx`; chave `licenseNote` nova em `i18n/types.ts` (12 idiomas); propagada por `map-model.ts` até `hiring-map.tsx`, que ganhou um link `rel="license"` no rodapé do mapa, ao lado do crédito do mapa-base (Natural Earth) que já existia — são licenças diferentes, créditos separados. Verificado em dev server local (`/market-pulse?lang=en`): linha "Data licensed under CC BY 4.0 — free to use with attribution." aparece como link; `curl` confirmou o campo no JSON-LD renderizado. `tsc`, `eslint`, `build` e suíte (938/938) limpos |
| Anterior (7) | 09/09/2026: **As duas últimas branches `claude/*` auditadas e apagadas do remoto (§2.113)** — sobra do §2.99/pendência 3: `claude/project-status-update-m6kqex` e `claude/security-vulnerabilities-review-2qtbz1` ficaram preservadas de propósito até alguém conferir o conteúdo. Conferidas: cada uma parava num `main` de 24/08 com 1–2 commits reais — o `db:rls` sem `psql`/shell (`sql-split.ts`, `apply-rls.ts`) de uma, `docs/MAPA-DO-PRODUTO.md` (758 linhas) da outra — e os dois já estavam em `main`: os arquivos existem lá, e o `MAPA-DO-PRODUTO.md` veio byte a byte idêntico num `git diff` entre as versões. O `diff --stat` enorme contra `main` era só deriva de dez dias de trabalho depois do ponto onde as branches pararam, não conteúdo delas ausente de `main`. Apagadas do remoto com confirmação do operador antes do comando (ação irreversível sobre estado compartilhado). Só `main` no remoto agora — pendência 3 fecha por completo |
| Anterior (8) | 09/09/2026: **Pendência 7.2 fecha — confirmada a rota exata do currículo direcionado a partir da vaga (§2.112)** — desde o §2.100 a evidência era só de produto: uma carta de apresentação real vista em produção, "Direcionada a: Página da Vaga \| BIOMÉDICO(A)", sem confirmar se o caminho era `POST /api/radar/prepare` ou outro fluxo. Confirmado por leitura de código, sem ambiguidade: o botão "Preparar Currículo" em `radar-view.tsx:642` chama exatamente essa rota com `{alertId}`; ela direciona o currículo mais recente do usuário (ou o indicado) — nunca cria um novo, porque a permissão de uso é por currículo e um novo cobraria de novo por algo não pedido —, grava `resume.targetJob`/`targetJobDescription` a partir do `RadarAlert`, avisa o alvo anterior em vez de trocar em silêncio, e marca `RadarAlert.clickedAt` como sinal de conversão. É esse `targetJob` que a tela de reescrita mostra como "Direcionada a: {job}" — bate exatamente com o texto visto em produção. Nenhum código mudou, só confirmação; nenhuma pendência de código restante nesta lista |
| Anterior (9) | 08/09/2026: **Legenda: a moeda segue o país de acesso, não o idioma da tela (§2.111)** — operador perguntou se o preço (R$ 29,90) e o upsell deviam seguir o idioma escolhido "em vez de ficar em reais". Resposta: não — `resolvePricingContext()` já resolve por país de pagamento (se já houve compra) ou país de acesso por IP, nunca por idioma; amarrar ao idioma reabriria o problema que o catálogo já corrigiu (preço mostrado divergente do cobrado). Operador concordou e pediu uma legenda discreta embaixo do preço avisando disso — texto ajustado em conversa até fechar em **"A moeda corrente acompanha a origem do seu acesso, não o idioma da tela."** Chave nova `currencyFollowsAccess`, 12 idiomas, usada na landing (`PlanCard`, novo prop `priceCaption`) e em `plans-view.tsx` (abaixo do preço principal, cobrindo também o upsell da mesma tela). Verificado em produção na tela autenticada "Comprar Análise" com login real; a landing pública não foi reconferida visualmente (sessão do navegador autenticada, sem forçar logout) — mesmo padrão de componente já confirmado, tipo checado. `tsc`, `eslint`, `build` e suíte (938/938) limpos |
| Anterior (10) | 08/09/2026: **Tagline "Global AI Career Intelligence" dentro do app — mapa duplicado desatualizado (§2.110)** — operador reportou, olhando o app já com os fixes do §2.109: ao lado da logo, dentro do sistema, ainda dizia "Global AI Career Intelligence" em vez de só "Career Intelligence". Causa: `landing.tsx` e `app-shell.tsx` tinham cada um sua própria cópia do mapa de tagline por idioma — a de `landing.tsx` seguia a decisão de posicionamento já registrada ("sem 'AI'/'Global'"), a de `app-shell.tsx` nunca recebeu essa decisão: só três idiomas (pt/en/es), todos ainda com "GLOBAL AI CAREER INTELLIGENCE". Centralizado em `brandTaglineForLang(lang)`, `lib/i18n/index.ts`, os 12 idiomas, fonte única pros dois componentes — evita um terceiro lugar divergir de novo. Verificado em produção, tela autenticada: "INTELIGÊNCIA DE CARREIRA", igual à landing. `tsc`, `eslint`, `build` e suíte (938/938) limpos |
| Suíte | **971 testes, `fail 0`** — 938 até o §2.116, mais 33 de cobrança e failover no §2.117 (20 em `entitlements.test.ts`, 13 em `ai-router/failover.test.ts`); o contrato do `rls.sql` continua em 5 instruções desde o §2.89, regra de contagem na seção 8 |
| `tsc`, `build` | `tsc --noEmit`, `eslint` e `npm run build` limpos após o §2.107 (`/api/radar/search-now` com `maxDuration=60`, `ƒ` dinâmica; `/[country]` segue `●` SSG) — §2.109 não mudou código, só documentou achados |
| Banco | Sincronizado via `prisma db push` (inclui `AnalyticsEvent`, `RadarAlert.notifiedAt` — ver 7.6 —, `LaborMarketPoint` do §2.51, empurrado em 01/09/2026, e `RadarPreference.onDemandSearchCount`/`onDemandSearchWindowStart` do §2.106, empurrado em 07/09/2026) |

**Pendências que estão esperando alguém, não código:**

1. ✅ **RESOLVIDO em 08/09/2026.** `RADAR_DIGEST_ENABLED=true` ligado pelo
   operador, e o primeiro envio real do digest — o caminho que
   `digest.server.ts` avisava nunca ter sido exercitado — funcionou.

   **A volta**: primeira tentativa (cron manual, 16:38) falhou pros 4
   destinatários reais com `Variável de ambiente obrigatória ausente:
   RESEND_API_KEY`. A causa não era DNS (`send.griffo.work` já passa SPF/
   DKIM/DMARC) — a chave existia no `.env` local, só que anotada como texto
   solto (`resend apikey: ...`, sem o `=` que faz virar variável de
   ambiente de verdade) e nunca tinha sido cadastrada na Vercel. Corrigido
   o formato do `.env` local; cadastrado `RESEND_API_KEY` na Vercel
   (Production) pelo operador; um primeiro redeploy não bastou (Vercel só
   aplica env var nova a partir do deployment seguinte, não ao já rodando)
   — um segundo redeploy resolveu.

   **Confirmado por banco, não só por log**: os 4 `RadarAlert` dos 4
   usuários (`cmrxqmybg...`, `cmryzidss...`, `cmt21tcuz...`,
   `cmta4o2bn...`) têm `notifiedAt = 08/09/2026 14:03:37 BRT` — campo que
   só é gravado DEPOIS de `sendEmail()` retornar sucesso
   (`digest.server.ts`, comentário "Só depois do envio bem-sucedido").
   E-mail real, para gente real, confirmado.
2. ✅ **RESOLVIDO em 07/09/2026** (§2.104). Preço em reais confirmado
   (`R$ 29,90`, "Pague em BRL com Cartão"). "Preencher com o que já sei
   sobre você" executado sem erro com currículo recém-analisado — nada
   mudou visualmente porque só preenche campo vazio, e todos já
   estavam preenchidos (comportamento correto). Vaga de área diferente
   no Radar já confirmada no §2.100/§7.6.
3. ✅ **RESOLVIDO em 07/09/2026, completado em 09/09/2026** (§2.99,
   §2.113). O 403 era da sessão remota sem permissão de escrita; numa
   sessão local com as credenciais do operador, `git push --delete`
   funcionou sem erro. **11 branches apagadas em 07/09**: as 7
   mescladas em `main` (confirmado por `git branch -r --merged`) mais
   as 4 que a seção 11 já tinha auditado como sem trabalho vivo
   (conteúdo recuperado por outros PRs). Ficaram só `main` e duas
   branches nunca auditadas (`claude/project-status-update-m6kqex`,
   `claude/security-vulnerabilities-review-2qtbz1`), preservadas de
   propósito até alguém conferir o conteúdo delas.

   **Em 09/09/2026, as duas últimas foram conferidas e apagadas**
   (§2.113): cada uma parava num `main` de 24/08 com 1–2 commits reais
   — o `db:rls` sem `psql`/shell (`sql-split.ts`, `apply-rls.ts`) de
   uma, e `docs/MAPA-DO-PRODUTO.md` (758 linhas) da outra. Os dois já
   estavam em `main`: os arquivos de código existem lá, e o
   `MAPA-DO-PRODUTO.md` veio **byte a byte idêntico** num `git diff`
   entre as duas versões. Apagadas com confirmação do operador
   (`git push origin --delete`, ação irreversível sobre estado
   compartilhado). Só `main` no remoto agora.
4. ✅ **RESOLVIDO em 08/09/2026** (§2.109). Login feito pelo operador;
   percorridas em produção Painel, Enviar Currículo, Laudo (Score & Veredito
   e 8 Dimensões), Perfil Profissional, Radar, Reescrita, Downloads,
   Histórico, Comprar Análise, Suporte & Dúvidas, Configurações, mais a
   landing em português e árabe (RTL). A maior parte passou limpa. **Dois
   achados reais, corrigidos na sequência da mesma sessão** ("corrija
   agora"):
   - O cabeçalho (`sticky top-0`) e a faixa de resumo do laudo (`sticky
     top-14`, ver §7.7) não grudavam no topo ao rolar. Causa: `overflow-
     x-hidden` no `<div>` raiz de `app-shell.tsx` e `overflow-hidden` no
     `<main>` — o par de eixos (`hidden` num, `visible` no outro) faz o
     CSS computar o eixo visível como `auto`, criando um contêiner de
     rolagem que nunca rola de verdade (cresce pra caber o conteúdo) e
     tira o `sticky` do contexto de rolagem real da página. Trocado por
     `overflow-x-clip`/`overflow-clip`, que corta o overflow do mesmo
     jeito sem entrar nessa regra.
   - O card "Empresas e RH" de `plans-view.tsx` (tela "Comprar Análise")
     não tinha o link `businessDataCta` que o §2.105 acrescentou à cópia
     da landing pública. Adicionado, no mesmo padrão (`ArrowRight`,
     `/market-pulse`).

   **Reverificado em produção de verdade** numa aba nova, com `wait` antes
   da captura pra não confundir atraso de pintura do scroll com o bug de
   novo: cabeçalho e faixa presos no topo ao rolar o Laudo; card B2B com
   "Ver o mapa de mercado →" igual à landing. `tsc`, `eslint`, `build` e
   suíte (938/938) limpos.

   Viewport mobile não verificado — `resize_window` não mudou a resolução
   real da captura nesta sessão.
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
7. ✅ **RESOLVIDO em 07/09/2026** (§2.100). Confirmado no Painel Admin
   master → "Radar e Cotas" → "Fontes de vagas": `jobbase` com
   **5.572 vagas, última coleta há 16h, 11 dias de observação**. O
   adapter está rodando de verdade dentro do `/api/cron/radar` em
   produção, não mais só o `curl` manual do §2.33.
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
9. ✅ **RESOLVIDO em 07/09/2026** (§2.104). Currículo de teste enviado
   e acompanhado ao vivo: percentual real (0%→20%→60%), cronômetro,
   texto mudando, dimensões aparecendo uma a uma. Terminou com score
   6,3/10, ATS PASS, 8 dimensões, Match Vaga Alvo 78% — pipeline
   completo confirmado, não só a animação. **Não observado**: o caminho
   de erro (forçar falha de provedor) — não dá pra forçar isso numa
   verificação visual sem simular falha real de API; fica em aberto se
   algum dia precisar ser conferido de propósito.
10. ✅ **RESOLVIDO em 07/09/2026** (§2.103). Reli `parseRemotivePayload`:
    ela lê só `payload.jobs`, e o aviso legal (`0-legal-notice`) mora
    fora desse array, como chave irmã — estruturalmente não tem como
    virar vaga. Não era filtro incompleto, era código morto mesmo
    (confirmado: zero import em qualquer lugar do projeto). Constante
    removida, `accessNote` do descritor reescrito pra descrever o campo
    sem depender do símbolo.
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
14. **Fases 2 e 3 do índice de temperatura de contratação** — ✅ **FECHADA POR
    INTEIRO.** (a), (b) e (c) resolvidos em 02/09/2026 (§2.52); (d) em
    02/09/2026 (§2.54); (e) em 02/09/2026 (§2.56) e **complementado em
    03/09/2026 com o recorte por continente que a redação original pedia**
    (§2.59). Nada desta pendência continua aberto.

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
      `lib/hiring-index/collect.ts`. ✅ **Agendamento resolvido em 07/09/2026
      (§2.101), fora do Vercel.** `vercel.json` continua com só os dois
      crons (Hobby não tem espaço pra um terceiro) — criado em vez disso
      `.github/workflows/hiring-index-monthly.yml`, GitHub Actions, dia 1
      de cada mês às 06:00 UTC (mais `workflow_dispatch` pra rodar sob
      demanda), chamando a rota com o mesmo `Bearer $CRON_SECRET`. ✅
      **Cadastrado e verificado no mesmo dia.** A Vercel não revela env
      var marcada *Sensitive* nem no ícone de revelar — o `CRON_SECRET`
      antigo não pôde ser lido de volta, então foi gerado um valor novo
      (64 hex) e trocado nos dois lugares (Vercel com redeploy; secret
      do GitHub Actions). Testado direto contra produção: `200`, coleta
      real, **142 séries, 2.758 pontos gravados** — o `/market-pulse`,
      parado desde 02/09, foi atualizado nessa verificação.
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
    - (e) ~~**agregação**~~ — ✅ **feita em 02/09/2026** (§2.56), e a
      resposta antecipada estava certa: agregam-se as **fases**, nunca os
      valores. Mas **não por continente**, como a redação original dizia:
      um continente não mede nada. A África reúne países cobertos pelo
      ILOSTAT com países sem fonte alguma, e "África: 60% aquecendo" seria
      uma afirmação sobre os 12 que têm dado apresentada como afirmação
      sobre 54. O agregado é a **distribuição global** — quantos países em
      cada fase, com `84 de 98` dito junto — mais um único escalar
      declarado como o que é: `netBreadth = heating_up − cooling`,
      contagem de países, não média de valores.

      ✅ **E por continente também, desde 03/09/2026** (§2.59) — sem
      desdizer nada do parágrafo acima. O corte continental voltou porque
      passou a carregar o DENOMINADOR: `ContinentSummary` traz
      `totalCountries` (os países daquele continente que
      `lib/market/countries.ts` conhece) e `uncovered` no mesmo objeto da
      distribuição, e a barra da tela tem como denominador o continente
      inteiro — o pedaço sem fonte sai hachurado, com a mesma hachura do
      mapa. Nenhuma percentagem aparece sozinha: a linha da África diz
      "16 de 48 países com fonte oficial" antes de qualquer cor.
      `continentBreakdown` **reaproveita `phaseDistribution`**, não
      reconta — a soma dos seis continentes bate com o agregado global
      por construção, e há teste que falha se deixar de bater.

      A tabela país→continente é `lib/hiring-index/continents.ts`, 173
      pares pela regra **UN M49** (`Americas` dividida pela região
      intermediária: *South America* de um lado, *Northern America* +
      *Central America* + *Caribbean* do outro), conferida par a par
      contra dois conjuntos independentes que publicam o M49 da UNSD —
      concordaram em 172/173, e a exceção é Taiwan, que a UNSD não lista
      em separado. **Não é para trocar por `Intl.DisplayNames`**: nome de
      continente vem do bloco `continents` do dicionário nos 12 idiomas,
      pelo mesmo motivo que derrubou a hidratação do mapa uma vez.

15. **O sinal da métrica no índice de temperatura** — ✅ **resolvido em
    02/09/2026** (§2.56), e registrado aqui porque a classe do erro vai
    voltar. `classifyHiringPhase` lê uma CURVA: subindo é `heating_up`. Para
    taxa de vaga em aberto está certo; para **taxa de desemprego é o
    contrário**, e as duas fontes da fase 3 publicam taxa de desemprego —
    68 dos 98 países. O Brasil, com desemprego caindo de 6,87% para 6,03%,
    era classificado `cooling`, e o laudo pago dizia "a abertura de vagas
    vem caindo". A correção nega o VALOR antes de classificar
    (`METRIC_ORIENTATION` em `lookup.ts`), e não espelha a fase depois —
    espelhar não é bijeção, porque `bottoming_out` espelhado viraria "parou
    de subir perto do topo", que é o oposto de fundo de poço.

    **A trava é o TIPO:** `Record<LaborMetric, 1 | -1>`. Uma métrica nova
    em `types.ts` sem uma decisão de sentido não compila. Foi a falta dessa
    trava que deixou a fase 3 entrar invertida, sem nenhum teste falhar.

16. **"Profissões em alta por país" continua INVIÁVEL — e a ampliação da
    Adzuna (§2.55) não a resolveu.** A ideia é usar o dado do próprio produto
    (`Job.normalizedTitle`, de `lib/market/taxonomy.ts`), não estatística
    oficial. O bloqueio é volume: 5.347 vagas totais, 1.035 só do Brasil, e a
    maioria dos outros países em unidades ou dezenas — não dá recorte por
    profissão em lugar nenhum.

    **Pedido de novo, e recusado de novo, no §2.56.** O mapa público
    `/market-pulse` foi pedido com um tooltip de "top 10 profissões em alta
    por país" junto. Ele **não** foi construído, e a página é declaradamente
    de países, sem nenhum recorte por ocupação — só 24,5% das vagas têm
    profissão reconhecida e a taxonomia tem 12 categorias. Quando o volume
    justificar, o lugar natural é o painel do país selecionado, que já
    existe na tela.

    O §2.55 atacou a **causa** desse número, não o número: a Adzuna passou de
    11 para 19 países verificados, e a rodada deixou de varrer só os países
    onde alguém declarou morar (o que a mantinha presa a `adzuna:br`).
    Expectativa realista, não promessa: da ordem de **200 a 350 vagas novas
    por dia** contra ~50 hoje, distribuídas por 19 países.

    **Só reavalie depois de algumas semanas de coleta, e olhando o banco** —
    contagem de `normalizedTitle` por país, com um piso declarado de vagas por
    país antes de mostrar qualquer ranking. Estimar a viabilidade a partir da
    projeção acima seria o mesmo erro de sempre.

    Um limite que a coleta nova **não** remove: a varredura de base é amostra
    do que foi publicado *naquele dia*, não do estoque do mercado. Serve para
    série temporal; não responde "quantas vagas de X existem na Polônia".

17. ~~As 3 alegações numéricas que sobreviveram à auditoria do §2.80 não
    citam fonte na tela~~ — ✅ **resolvido em 06/09/2026** (§2.81), e não
    só para as 3: `marketShare` virou união discriminada
    (`MarketShare` em `lib/ats/data.ts`), onde `kind: 'sourced'`
    **obriga** `source`, `sourceUrl` e `asOf` — não compila sem. Corrigir
    só as 3 frases deixaria o mecanismo intacto, e foi o mecanismo que
    deixou a alegação falsa da Gupy meses no ar. Brecha que o tipo não
    fecha (escrever "70%" dentro de um `qualitative`) coberta por teste
    com regex de "parece estatística", **verificado reintroduzindo o texto
    original da Gupy para confirmar que o teste falha**. Workday cita o
    8-K na SEC (2024), Sólides e iCIMS o site oficial (2026); o recorte
    "nos EUA e Europa" do iCIMS saiu porque a fonte não quebra por região.

18. **Dado próprio de análise ainda não tem volume para virar conteúdo
    público** (frente 1 do §2.80). Banco em 06/09/2026: **64 currículos, 39
    com análise, 8 usuários** — a maioria provavelmente teste interno.
    Qualquer estatística publicada a partir daí ("X% dos currículos falham
    na dimensão de estrutura") seria autoridade fabricada, o §43 numa roupa
    nova. **Só reavaliar com centenas de currículos de usuários reais
    distintos** — e olhando o banco, não a projeção. A consulta em si é
    trivial; o que falta é a base.

19. ~~As 10 páginas de `/ats/*` são só em português~~ — ✅ **resolvido em
    06/09/2026** (§2.82). Operador pediu "a melhor opção para atingir todos
    os mercados", e a resposta honesta NÃO era 10×12=120 páginas: cada guia
    já declarava seu alcance em `marketName` (Gupy/Sólides só no Brasil,
    InfoJobs em ES/BR/IT, Personio no eixo DACH, iCIMS em EUA/UK), e o
    produto cartesiano geraria ~50 páginas sem leitor possível — o padrão
    que o sistema de conteúdo útil do Google mira. Escopo por relevância dá
    **67 páginas, todas com público real**, cobrindo os 12 idiomas.
    Arquitetura separa meta (nome do produto, país, fonte) de conteúdo
    (`locales/{lang}.ts`), espelhando `lib/i18n`. PT migrado por script
    (148 campos) usando o parser real do TS, não regex. URL segue o padrão
    `?lang=` de `/market-pulse`, preservando as URLs já indexadas.

20. ✅ **Os nove termos nativos de "ATS" restantes — verificados no §2.98.**
    O §2.83 já tinha confirmado alemão, japonês e espanhol. Os outros
    nove (pt, fr, it, nl, sv, zh, ar, ko, en) foram checados contra fonte
    oficial — oito já estavam certos, sem mudança de texto. **O árabe
    tinha defeito real**: a página de ATS descrevia a FUNÇÃO do sistema
    entre parênteses em vez de nomeá-lo, diferente do padrão "ATS (termo
    nativo)" que toda outra língua segue (e diferente do próprio FAQ do
    arquivo, que já usava o termo certo). Corrigido para `نظام تتبع
    المتقدمين` (Applicant Tracking System), com teste novo
    (`ats-native-terms.test.ts`) travando os 12 termos contra o copy
    real.

21. **Tom e registro das 12 traduções seguem sem revisão nativa.** Distinto
    da pendência 20, que é terminologia (verificável sozinho, e já
    verificado em parte). Tom não dá para checar sem falante nativo — o
    japonês e o coreano de negócios são altamente convencionalizados, e o
    conteúdo atual pode soar levemente fora do registro esperado. Vale para
    TODA a camada multilíngue do produto (os 12 dicionários de i18n, não só
    as páginas de ATS), porque toda ela foi produzida da mesma forma.
22. ✅ **Cadastros e submissões da divulgação (§2.85, §2.91–§2.93) —
    concluídos pelo operador em 07/09.** Os onze cadastros do
    `KIT-DIVULGACAO.md` feitos (fila de pauta: Qwoted, Featured, Help a B2B
    Writer, Source of Sources; diretórios de produto do item 3: Product
    Hunt, AlternativeTo, SaaSHub, Capterra, G2, SourceForge, BetaList) —
    criar conta/digitar senha continuava vedado para mim mesmo com
    autorização explícita dele. **Nos sete diretórios, o texto do item 3
    (nome, tagline, descrições, categorias) também já foi inserido em cada
    painel** — não confirmável daqui se cada listagem já publicou (alguns
    diretórios revisam manualmente antes de publicar). A partir de agora,
    trabalho recorrente meu na fila de pauta: ler o pedido que chegar,
    separar os de mercado de trabalho / contratação / triagem por IA, e
    redigir a resposta com o dado do atlas (`/market-pulse`,
    `/api/hiring-index`) para ele revisar e enviar — SoS chega por e-mail em
    `contact@griffowork.com` (marcador `SOS`); as outras três exigem checar
    a plataforma com sessão logada. **Ainda pendente, sem mudança:** os
    **dois e-mails de release** seguem como rascunho no Gmail **sem
    destinatário**, esperando revisão e envio; e a **licença do dataset**
    que o `distribution` expõe — ✅ **decidida em 09/09/2026, CC BY 4.0**
    (ver §2.114). Não é mais pendência.

**O que NÃO está pendente e parece que está:**

- O e-mail do digest está implementado e **ligado desde 08/09/2026** (§7.3,
  §2.108), com envio real confirmado por `RadarAlert.notifiedAt` no banco. Não é
  trabalho pela metade nem pendência de operação.
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
| Aviso por e-mail | ✅ ligado em 08/09/2026, primeiro envio real confirmado por banco — ver §7.3 |

**As sete fontes:**

| Fonte | Cobre | Contrato | Fecha por ausência |
|---|---|---|---|
| Greenhouse | Empresas (US, GB, CA) | Público | Sim |
| Lever | Empresas (variado) | Público | Sim |
| Páginas de carreira (schema.org) | Quem for configurado | Padrão aberto | Sim |
| Gupy | Brasil | **API interna — risco declarado** | Não |
| Adzuna | 19 mercados (§2.55) | Público, com cota | Não |
| Remotive | Remoto internacional | Público | Não |
| RemoteOK | Remoto internacional | Público | Não |

Portugal e Japão não têm fonte de busca por cargo; são atendidos pelas fontes de
vaga remota. Verificado de novo em 02/09/2026: a Adzuna responde 404
`UNSUPPORTED_COUNTRY` para os dois — e também para `ru`, `ie`, `se`, `no`, `dk`,
`fi` e `ae`. Não existe endpoint de descoberta de países nesta assinatura; a
lista só se descobre país a país, e é por isso que ela mora em
`lib/jobs/adzuna-plan.ts` com a data da verificação.

**Rodízio da Adzuna:** 19 países, 8 por rodada, ordenados por quem esperou mais
(`lastCollectionAt`). Cobre todos em três dias. País onde ninguém declarou morar
é varrido **sem termo** — as vagas mais recentes daquele mercado —, e não fica
de fora como antes: a regra antiga fazia a coleta internacional inteira depender
de onde os primeiros usuários calharam de morar.

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

**Documentar TUDO — instrução permanente do operador (10/09/2026).** Toda
mudança, decisão e recusa entra na documentação: seção nova em
`AUDITORIA-EVOLUCAO-GLOBAL.md` com o porquê, linha no `AUDITORIA-INDICE.md`,
e o que envelhece a seção 0 deste documento. Vale inclusive — e
principalmente — para o que NÃO foi feito e por quê: uma decisão não
registrada volta como pergunta daqui a três meses, e a resposta se perde
junto com o motivo. O §2.118 é o exemplo curto: sem ele, alguém tentaria
ligar o bloqueio de merge de novo, receberia a mesma recusa do GitHub e
perderia a tarde achando que configurou errado.

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
| Adzuna | `salary_is_predicted` marca salário **estimado por eles**. Responde **200 com `exception`** quando a cota acaba. `location.area[0]` vem **no idioma do mercado** — "UK" (que nem é ISO2), "Deutschland", "España", "Polska", "Österreich"; comparar com o nome em português perde o país da vaga em silêncio (§2.55) |
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

### 7.2 ✅ RESOLVIDO — Currículo direcionado a partir da vaga, rota confirmada

Registrado em detalhe em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, seção 2.112.
Resumo operacional aqui.

Em 07/09/2026 (§2.100), vi em produção uma carta de apresentação real
marcada "Direcionada a: Página da Vaga | BIOMÉDICO(A)" — evidência de
que currículo/carta direcionados a uma vaga específica funcionam de
verdade, sem confirmar ainda o caminho exato. **Confirmado em
09/09/2026 por leitura de código**: o botão "Preparar Currículo" em
`radar-view.tsx:642` chama `POST /api/radar/prepare` com `{ alertId }`;
a rota direciona o currículo mais recente do usuário (ou o indicado)
para a vaga do alerta — grava `resume.targetJob`/`targetJobDescription`
a partir do `RadarAlert`, avisa qual era o alvo anterior em vez de
trocar em silêncio, e marca `RadarAlert.clickedAt` como o sinal de
conversão mais forte que existe. É esse `targetJob` que a tela de
reescrita mostra como "Direcionada a: {job}" — bate exatamente com o
que foi visto em produção no §2.100. É a ponte entre o Radar e a
venda; se ela falhar, o Radar não converte. Nenhum código mudou, só
confirmação.

### 7.3 ✅ RESOLVIDO — e-mail do digest, ligado e exercitado em produção

O caminho inteiro existe e **está ligado** desde 08/09/2026:
`RADAR_DIGEST_ENABLED=true` em produção, decisão do operador ("libera logo essa
função"), registrada no §2.108.

O Resend está configurado no domínio `send.griffo.work`, com SPF, DKIM e DMARC
passando — os testes caíam no spam do Gmail por reputação de domínio novo, o
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

**O primeiro envio real, e o que ele achou (§2.108).** O módulo de envio tinha
sido escrito contra a documentação do Resend, não contra resposta observada —
exceção declarada à regra da seção 6, e o motivo de `sendEmail` receber o
`fetch` por parâmetro. O primeiro envio real foi o primeiro teste real, e
falhou: cron manual de 08/09 às 16:38 rodou para os **4 usuários reais** e
morreu em `Variável de ambiente obrigatória ausente: RESEND_API_KEY`. A chave
existia no `.env` local, mas anotada como texto solto (`resend apikey: ...`,
sem o `=`) — nunca foi variável de ambiente, nem local nem na Vercel. Corrigido
o formato do `.env`, cadastrada a chave na Vercel (Production) pelo operador;
**um redeploy não bastou** — a Vercel só aplica env var nova a partir do
deployment seguinte, não no que já está rodando —, um segundo resolveu.

**Confirmado por banco, não por ausência de erro no log**: os 4 `RadarAlert`
dos 4 usuários têm `notifiedAt = 08/09/2026 14:03:37 BRT`, campo que só é
gravado DEPOIS de `sendEmail()` retornar sucesso. E-mail real, para gente real.

**O aviso de reputação continua valendo** — mandar e-mail sobre vaga ruim queima
o domínio, e domínio queimado não se recupera fácil. Ele deixou de ser motivo
para manter o envio desligado (o Radar foi validado antes, §7.4/§7.6), e passou
a ser o motivo de a qualidade do matching ser inegociável agora que sai e-mail.

### 7.4 ✅ RESOLVIDO — Busca avulsa do Radar

**Correção sobre a versão anterior desta seção**: o preço de "R$ 14,90 por 5
buscas" listado aqui estava desatualizado e nunca foi o preço real. Registrado
em detalhe em `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, seção 2.106. Resumo
operacional aqui.

**O desenho final não tem preço próprio nenhum.** Não é um produto à parte —
é um benefício de quem já comprou a Análise Completa (R$ 29,90 no Brasil, ou o
equivalente na faixa de cada país, o mesmo `priceFor()` de sempre). Sem SKU
novo, sem saldo novo, sem `AnalysisLedger` novo.

**A mecânica**: quem já destravou algum currículo (`requireAnyUnlockedResume`,
em `lib/entitlements.ts` — checagem por USUÁRIO, não por currículo específico,
porque o Radar trabalha em cima do Perfil Profissional, não de um laudo) ganha
3 buscas avulsas por semana, além da busca inicial grátis já existente. Cada
busca avulsa dispara coleta ao vivo no JobBase — só nele, porque é banco
nosso (projeto irmão, sem cota de terceiro) e já cobre boa parte do que Adzuna
e as demais fontes trazem — e reaproveita a mesma avaliação que o cron e
`/api/radar/run` já usam.

O usuário só sabe que são "3 buscas por semana"; qual fonte responde por elas
é detalhe de implementação, não texto de produto.

**Implementado**: `prisma/schema.prisma` (`RadarPreference.onDemandSearchCount`
+ `onDemandSearchWindowStart`), `lib/radar/on-demand-search.ts` (regra pura,
janela rolante de 7 dias — testada em `on-demand-search.test.ts`),
`lib/radar/on-demand-search.server.ts` (persistência),
`lib/entitlements.ts::requireAnyUnlockedResume`, e a rota
`POST /api/radar/search-now`, que chama `runCollection()` só para o adapter do
JobBase e depois `runForUser()` — as duas funções que o cron já usa, sem
lógica de coleta ou avaliação duplicada.

**Botão construído e verificado em produção** (§2.107), na mesma rodada.
Achado ao clicar de verdade em produção: a primeira versão respondia `504` —
`runCollection()` grava TODAS as vagas abertas da fonte a cada rodada (sem
coleta incremental), e com o JobBase já na casa de milhares de linhas, a
escrita em lotes não cabia no tempo de uma requisição HTTP, só no orçamento
do cron. Corrigido: a coleta roda em `after()` (mesmo mecanismo de
`profile_extraction`/`career_orientation`), a rota responde antes de coletar,
e o cliente descobre que terminou olhando `lastRunAt` avançar em
`/api/user/radar-preferences` — sem endpoint novo. `maxDuration` da rota
subiu de 30 para 60 (mesmo teto do cron). Verificado com login real do
operador em produção: botão aparece, clique não trava mais.

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

### 7.8 CSS bloqueando renderização na home — `optimizeCss` testado e negativo, ainda em aberto (§2.94, §2.98)

O Search Console mediu **3,9s de LCP mobile na home** (dado de campo,
CrUX). O elemento de LCP é o `<h1>` do hero — texto, não imagem — e o
Lighthouse aponta dois chunks CSS do Next (`_next/static/chunks/*.css`,
a folha Tailwind da página inteira) como render-blocking, 580ms de
economia estimada: o navegador não pinta nenhum texto até baixar e
processar esse CSS por inteiro (evita flash sem estilo), e isso atrasa
justamente o `<h1>`.

**O que já foi feito (§2.94):** a imagem que competia pela mesma conexão
(`logo-icon.png`, 6× maior que o exibido) trocada para `next/image`.
Isso reduz o que disputa banda com o CSS, mas **não remove o bloqueio
em si** — é o fator menor dos dois.

**Testado no §2.98, resultado negativo.** `next.config.ts` já existe
(correção: eu tinha registrado aqui que não existia — errado, existe
desde 28/08/2026). Ativei `experimental.optimizeCss` (via `critters`)
nele: o build aceitou a flag sem erro, mas o HTML estático gerado
(`/br`, conferido byte a byte) saiu **idêntico** com e sem ela — mesmo
tamanho, mesma contagem de `<link rel="stylesheet">`, zero `<style>`
inline nos dois casos. **`optimizeCss` é no-op sob Turbopack** nesta
versão do Next (16.2.11) — aceita a flag e não faz nada. Revertido.

**O que ainda resolveria o fator maior, então:** ou trocar o bundler de
build para Webpack (perde os ganhos do Turbopack em tudo mais, troca
grande demais por este ganho isolado), ou esperar suporte real do
Turbopack a `optimizeCss`/CSS crítico inline numa versão futura do
Next. Não há botão barato restante aqui — só voltar a isto quando o
Next anunciar suporte, ou aceitar o LCP atual.

✅ **DECISÃO DO OPERADOR em 07/09/2026: aceitar o LCP atual.** Trocar
de bundler pra Webpack só por este ganho isolado foi descartado —
perderia os ganhos do Turbopack em tudo mais do projeto. Fica fechado
por ora; reabrir só quando o Next anunciar suporte real de
`optimizeCss` sob Turbopack.

### 7.9 Termos de busca — o que sobrou em aberto do §2.96/§2.97

Do levantamento dos seis termos ("job, hiring, work, careers,
employment, workforce"), cinco já estavam resolvidos ou foram
implementados (`employment` no §2.96; `remote work` no §2.97 — ver
correção abaixo). Fica uma em aberto, por decisão, não por
esquecimento:

- ✅ **"Remote work" — RESOLVIDO no §2.97, sem página nova.** Eu tinha
  registrado aqui "página nova" — errado, corrigido na mesma sessão
  depois do operador perguntar "pq página nova?". `/global` já existia
  (rota de `[country]/page.tsx`); faltava só o texto. Implementado:
  título/descrição/keywords dedicados a "international remote work"
  em `generateMetadata()`, só em inglês — `GLOBAL_MARKET.jobLanguage`
  é fixo em `'en'` (a única das 41 rotas que não resolve idioma por
  `?lang=`/cookie/geo como `/market-pulse`/`/hiring`; manter assim foi
  decisão explícita do operador, para não perder o SSG da rota).
- ✅ **"Workforce" — RESOLVIDO em 07/09/2026** (§2.105), recorte
  concreto e pequeno de propósito: `businessDesc` (12 idiomas) ganhou
  uma segunda frase citando o `/market-pulse` como ferramenta de
  planejamento de força de trabalho, e o card ganhou um segundo link
  (`businessDataCta`) pro atlas, ao lado do "Talk to sales" que já
  existia. **Não é** página nova nem audiência formal nova — se o
  volume de interesse via esse link justificar mais à frente, uma
  página dedicada é o próximo degrau, fora do escopo desta rodada.

### 7.10 ✅ RESOLVIDO — sessão expirada não redirecionava dentro da SPA (§2.100, §2.102)

Verificação visual em produção (07/09/2026) expôs isto por acidente: a
sessão de um usuário expirou entre duas navegações internas do app
(sem reload de página), e a interface continuou mostrando o shell
autenticado inteiro — barra lateral, nome, contador de créditos — com
a área de conteúdo dizendo **"Nenhum currículo encontrado"**. Essa
mensagem é enganosa: sugere "você não tem currículo" quando o problema
real é "sua sessão morreu, faça login de novo". Confirmado com
`fetch('/api/auth/me')` retornando `{user: null}` nesse estado exato.

**Não é vazamento de dado entre contas** — `localStorage`,
`sessionStorage` e `document.cookie` inspecionados, sem vestígio de
dado de outro usuário. Um recarregamento completo da página (F5)
corrige sozinho, mostrando a landing pública deslogada corretamente —
o problema é só que a navegação client-side (SPA) não detecta a
expiração e não força esse redirecionamento sozinha.

**Corrigido em 07/09/2026 (§2.102), sem tocar em cada tela uma por
uma.** Causa raiz: `useAuth.hydrate()` só roda uma vez, no primeiro
mount — nada reagia a uma chamada autenticada voltando 401 depois
disso. `lib/internal-fetch.ts` agora dispara `window.dispatchEvent(new
Event('griffo:session-expired'))` em qualquer 401 de rota relativa
(401 = sessão inválida, diferente de 403 = sem permissão — convenção já
usada nas rotas do produto); `store/auth.ts` ouve esse evento e limpa
o usuário, o que faz a tela cair sozinha de volta pra `<Landing>` (via
`effectiveScreen = user ? 'app' : screen`). Evento de DOM em vez de
import direto, porque `auth.ts` já importa `internal-fetch.ts` — import
de volta criaria ciclo. Teste novo (`store/auth.test.ts`, 2 casos).
`tsc`, `eslint`, `build` e suíte (931/931) limpos.

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
5. **O CI roda os três sozinho** desde 10/09/2026 (§2.116):
   `.github/workflows/ci.yml` executa `npm ci` → `prisma generate` →
   `tsc --noEmit` → `eslint` → `npm test` a cada PR e a cada push em `main`.
   Isso NÃO substitui rodar antes de subir — o CI é a rede embaixo, não a
   corda —, mas acaba com o caso em que ninguém rodou e ninguém percebeu.

   Duas coisas para saber sobre ele: `prisma generate` vem antes do `tsc` de
   propósito (os tipos do `@prisma/client` são gerados; sem esse passo o
   type-check reprova num checkout limpo), e o workflow **não usa segredo
   nenhum** — se algum dia precisar de credencial para passar, alguma
   dependência de ambiente entrou na suíte e é isso que deve ser investigado,
   não o CI.

   O CI **informa** e NÃO **barra** — decisão registrada, não esquecimento
   (§2.118). Barrar exigiria marcar o check como *required* na proteção da
   `main`, e o GitHub não aplica isso em repositório **privado** no plano
   gratuito: "Your rulesets won't be enforced on this private repository until
   you move to GitHub Team organization account". Não adianta tentar de novo
   sem mudar de plano. Reavaliar na primeira venda (critério do operador) ou
   quando entrar um segundo colaborador com acesso de escrita — o que vier
   primeiro. Até lá o que impede um merge vermelho é processo, não o GitHub:
   trabalhar por PR e não mesclar nada vermelho. Lembrando que mesclar na
   `main` dispara o deploy.
6. **`npm test` carrega `scripts/test-setup.mjs`** desde o §2.117, e isso não é
   opcional: é ele que redireciona o pacote-marcador `server-only` para um
   módulo vazio. Sem esse `--import`, os testes de `entitlements.ts` e do
   roteador de IA nem carregam — `server-only` lança em qualquer import fora do
   Next. Se algum dia a suíte encolher de repente, confira se o `--import`
   continua no script (é a terceira causa conhecida de suíte que emagrece, ao
   lado das duas da seção 9).

   Nos testes, o cliente do banco é trocado em `globalThis.prisma` — o mesmo
   ponto que `lib/db.ts` usa para sobreviver ao hot reload. Nenhum código de
   produção conhece o fake. O que ele prova e o que NÃO prova está escrito no
   cabeçalho de `lib/testing/fake-prisma.ts`; em resumo, ele verifica a reação
   do código à resposta do banco, não a garantia do banco.

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

✅ **RESOLVIDO em 07/09/2026 (§2.99, pendência 3): todas as branches
desta seção foram apagadas do remoto** (as 9 "seguras" já tinham sido
apagadas por fora desta sessão antes de 07/09; as 4 restantes — três
"PR fechado sem merge" mais `mapa-do-produto-recuperado` — apagadas
nesta sessão, reconferidas contra a `main` atual antes). A análise
abaixo fica como registro de COMO a verificação foi feita, não como
lista de branches ainda existentes — nenhuma das citadas aqui está
mais no remoto.

**As duas que sobraram fora desta seção** (`claude/project-status-
update-m6kqex`, `claude/security-vulnerabilities-review-2qtbz1`) foram
conferidas e apagadas em 09/09/2026, pelo mesmo método — ver §2.113.
Não sobra nenhuma branch `claude/*` no remoto.

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
