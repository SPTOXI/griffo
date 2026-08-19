# Documento de continuidade — GriffoWork

**Para quem assumir o desenvolvimento deste projeto.**

Escrito em 19/08/2026, ao fim de uma sequência de trabalho que levou o produto
da Etapa 1 à Etapa 8 do prompt mestre. Este documento existe para que quem
continuar não precise redescobrir o que já foi decidido, e — mais importante —
não repita erros que já custaram caro aqui.

Leia junto com `docs/AUDITORIA-EVOLUCAO-GLOBAL.md`, que registra o porquê de
cada decisão em ordem cronológica. Este documento é o resumo operacional; aquele
é a memória.

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
  radar/
    curation.ts    Decide se vale interromper — silêncio é acerto
    runner.ts      A rodada: coleta, encerra por tempo, avalia, alerta
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

**Branch e PR.** Todo trabalho vai em `claude/analise-projeto-execucao-pw6cb9`,
que é reescrita com `--force-with-lease` a cada mudança. Cada bloco vira um PR
próprio, mesclado com squash. **Não use `git pull` nessa branch** — use
`git fetch` + `git reset --hard origin/<branch>`.

**Migração.** Não existe diretório de migrações versionadas. O fluxo é editar
`prisma/schema.prisma` e o operador rodar `npx prisma db push` na máquina dele —
o ambiente de desenvolvimento não tem acesso ao banco. Toda migração precisa ser
**aditiva**, e o PR precisa avisar em destaque que ela existe.

**Verificação antes de qualquer PR:**

```
npx tsc --noEmit
npm test          # 418 testes hoje
npm run lint
npm run build
```

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

### 7.1 🔴 URGENTE — o Radar quebra com escala, e antes disso fica errado

Em `src/lib/radar/runner.ts`, `runForUser` faz:

```ts
const rows = await db.job.findMany({
  where: { closedAt: null },
  orderBy: { publishedAt: 'desc' },
  take: MAX_JOBS_PER_USER,   // 500
})
```

**Ele carrega as 500 vagas mais recentes do banco inteiro, sem filtrar por
mercado.** Com 300 vagas isso funciona. Com 50 mil, as 500 mais recentes podem
ser todas de um país só — e um usuário brasileiro receberia silêncio mesmo
havendo vagas brasileiras abertas.

Isso **não é lentidão, é resultado errado**, e piora sozinho conforme o banco
cresce.

O conserto: filtrar no SQL antes de carregar. O índice já existe
(`@@index([market, closedAt])` no modelo `Job`). Derive o mercado do usuário com
`marketInputFrom` + `resolveMarket` (em `lib/profile` e `lib/market`) e filtre
por `market` e por `country`, considerando também quem aceita remoto
internacional — esse aceita vaga de qualquer mercado.

Cuidado: o filtro precisa **incluir** vaga remota internacional para quem marcou
`openToInternationalRemote`, senão você troca um erro por outro.

Depois disso, o §27 (cache de Job Intelligence — separar o que é da vaga do que é
do par vaga×usuário) passa a fazer sentido. Hoje `matchJob` roda por par e é
determinístico e barato; o problema não é ele, é **quantas vagas irrelevantes
chegam até ele**.

### 7.2 Currículo direcionado a partir da vaga — verificar em produção

`POST /api/radar/prepare` existe e funciona nos testes. Nunca foi exercitado com
usuário real. É a ponte entre o Radar e a venda; se ela falhar, o Radar não
converte.

### 7.3 E-mail do digest

Nada existe ainda. O Resend está configurado no domínio `send.griffo.work`, com
SPF, DKIM e DMARC passando — mas os testes caem no spam do Gmail por reputação de
domínio novo, o que se resolve com uso real e não com configuração.

Quando for implementar: idioma do usuário (`communicationLanguage` no perfil),
link de descadastro (obrigatório por LGPD/GDPR), respeitar
`RadarPreference.frequency === 'off'`, registrar o que foi enviado para não
repetir alerta, e `Reply-To` para um endereço em `@griffo.work` que o Cloudflare
Email Routing encaminha.

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
3. Rode `npm test` e confirme 418 passando antes de mudar qualquer linha.
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
