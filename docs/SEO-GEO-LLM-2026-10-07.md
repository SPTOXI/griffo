# SEO, GEO e LLM — diagnóstico de 2026-10-07

Base: export do Search Console (Web, 28/08 a 04/10/2026 — o "últimos 3 meses" só tem
38 dias de dado, o site é novo) + leitura do código que gera o HTML. O site público
não abre a partir do ambiente de análise, então **nada aqui foi medido em produção**:
o que está dito sobre o HTML vem do código-fonte.

## 1. O que o Search Console diz

| Métrica | Valor |
|---|---|
| Cliques | 4 |
| Impressões | ~440 |
| CTR | ~0,9% |
| Posição média | ~10–15 |
| Impressões por quinzena | 74 → 240 → 122 |

Leitura: **o Google já mostra o site, mas ninguém clica.** Não é problema de
indexação — é de snippet, de relevância e de ainda não haver autoridade.

Fatos que importam:

1. **Páginas ATS são o motor.** 255 de 443 impressões (58%) e 2 dos 4 cliques.
   `/ats/solides` (51 imp., pos 9,3), `/ats/gupy` (46, pos 10,1), `/ats/personio`
   (26, pos 7,9), `/ats/infojobs` (16, pos 7,1): todas na primeira página ou na
   fronteira dela, **0 cliques**. Título/descrição não convencem.
2. **As variantes `?lang=` têm 23% das impressões e 75% dos cliques** (3 de 4:
   `taleo?lang=es`, `workday?lang=de`, `ats-check?lang=de`). Conteúdo traduzido
   enfrenta pouca concorrência e ranqueia melhor (pos 4,9 e 8,7). É a alavanca
   mais barata do site — e estava sabotada (item 3.1).
3. **Alemanha é o melhor país**: 2 cliques em 37 impressões, pos 7,4.
   Brasil: 111 imp., pos 11,3. EUA: 132 imp., pos 16,8, 0 cliques.
4. **Marca quase invisível.** "griffo" aparece 1 vez, pos 35; "quero workar" /
   "queroworkar" (4+2) pos ~51. Quem procura a marca não encontra.
5. **Queries são curtas e de sistema** ("taleo ats", "ats gupy", "personio ats",
   "workday ats"). Nenhuma é intenção de compra. É topo de funil.
6. **Coreano**: `지원자 필터` 19 impressões, pos 7,95, em `/hiring?lang=ko`. Demanda
   real sem clique.
7. **Resíduo de domínio**: `www.griffo.work` ainda soma 16 impressões (3,6%) e há
   `www.griffo.work/carreiras/gerente-de-projetos` (pos 84) — URL antiga que hoje
   não existe no código (`src/app/carreiras` foi removido). Deve responder 404/410
   ou redirecionar.

## 2. O que já está bom (não mexer)

- `robots.txt`/`robots.ts` liberam Googlebot, Bingbot, GPTBot, ClaudeBot,
  PerplexityBot, OAI-SearchBot, Google-Extended, Applebot, CCBot. Sitemap declarado.
- Sitemap derivado das mesmas listas das rotas (sem divergência), hreflang
  bidirecional nas 41 páginas de país.
- JSON-LD: `Organization`, `WebSite`, `SoftwareApplication`; nas páginas ATS,
  `TechArticle` + `FAQPage` + `BreadcrumbList`. Conteúdo em 12 idiomas.
- 4 hostnames duplicados já redirecionam 301 para `griffo.work` (§2.69).
- IndexNow implementado. Bots de IA pulam o rewrite por geo-IP no middleware.
- `llms.txt` existe, `/market-pulse` é dado aberto CC BY 4.0 (ótimo para citação).

## 3. Problemas encontrados

### 3.1 Canonical contradiz o hreflang nas páginas multilíngues — **corrigido neste PR**

`/ats/[slug]`, `/hiring`, `/enterprise` (+2 pilares) e `/market-pulse` declaravam
sempre `canonical = URL sem ?lang`, mas o hreflang apontava para `?lang=xx`. A
variante alemã dizia "minha versão preferida é a inglesa" e "sou a alemã" ao mesmo
tempo; o Google descarta o hreflang e trata `?lang=` como duplicata. `/ats-check`
já fazia certo (mas dependia do idioma resolvido por geo, o que muda por
rastreador).

Correção: `src/lib/seo/lang-alternates.ts` — `?lang=` válido ⇒ canonical
autorreferente; sem parâmetro ⇒ canonical limpo, que também é `x-default`.
Aplicado nas 6 rotas, com teste. É a mudança que mais deve ajudar a aproveitar o
que já está dando clique (item 2 da seção 1).

### 3.2 `llms.txt` incompleto — **corrigido neste PR**

Listava só `/ats/workday` e nada de `/ats-check` nem das páginas de país. Agora
lista os 10 guias ATS com uma linha cada, o teste gratuito e as páginas de país.

### 3.3 Canonical herdado da home (a verificar)

`layout.tsx` define `alternates.canonical = "https://griffo.work"` e
`languages: rootHreflang()` para todas as rotas. Páginas que **não** definem o
próprio `alternates` herdam o canonical da home. Já definem: país, ATS, hiring,
enterprise, market-pulse, ats-check, privacy. Conferir `/verificar-curriculo` (já verificado: redireciona 308 para `/ats-check`, sem problema; e qualquer rota nova) — se não definir, vira duplicata da home. Dê preferência a
tirar o canonical do layout.

### 3.4 Títulos e descrições que não vendem — **reescritos em pt, en, es, de, ko**

Novo padrão: `{ATS}: seu currículo passa na triagem? Teste grátis`. Medir CTR por 2–3 semanas no Search Console antes de estender aos outros 7 idiomas. O texto original, para comparação:

Título atual das ATS: `Currículo para ATS Gupy — Como funciona a triagem | GriffoWork`.
Descreve; não promete resultado. Posição 7–10 com CTR 0% é sinal de que o snippet
não ganha do vizinho. Sugestão de teste (um idioma/ATS por vez, 2–3 semanas):

- `Seu currículo passa na Gupy? Teste grátis em 30s | GriffoWork`
- `Taleo ATS: por que seu CV é rejeitado + teste grátis`
- Descrição começando pelo benefício e terminando com a ação: *"Veja como a Gupy
  lê seu currículo e o que faz ele ser descartado. Envie o arquivo e receba o
  diagnóstico sem cadastro."*

### 3.5 Home e marca

- `<title>` da raiz (`GriffoWork — Inteligência de Carreira`) e descrição
  (`Conectamos você a oportunidades, não a vagas.`) são genéricos e só em
  português; a raiz que o Google vê (sem geo, bot pulado) é essa.
- `sameAs` só tem Instagram. Para marca/GEO, faltam LinkedIn da empresa,
  Crunchbase, GitHub, Product Hunt, Wikidata.
- Sem `SearchAction`, `AggregateRating`/`Review` (só incluir com avaliações reais).

## 4. Plano para "rankear para vender"

Ordem por retorno esperado. Itens com ✅ já estão neste PR.

**Semana 1 — destravar o que já aparece**
1. ✅ Canonical/hreflang por idioma (3.1). Depois do deploy: Search Console →
   Inspeção de URL → "Solicitar indexação" para `/ats/solides`, `/ats/gupy`,
   `/ats/taleo?lang=es`, `/ats/workday?lang=de`, `/hiring?lang=ko`; rodar
   `npm run indexnow:submit`.
2. Reescrever título/descrição dos 4 guias com impressão e posição ≤10 (solides,
   gupy, personio, infojobs) — 3.4.
3. ✅ `/carreiras/*` agora dá 301 para `/ats/gupy` (`next.config.ts`).
4. Confirmar no Search Console a propriedade de **domínio** (cobre www + apex) e
   enviar o sitemap.

**Semanas 2–4 — expandir onde há demanda comprovada**
5. Mais guias ATS: o Search Console mostra procura por **iCIMS, Lever, Taleo,
   Workday, Personio, Ashby**. Cada "X ATS resume checker" / "como passar no X" é
   uma página com intenção direta de compra. Duplicar o padrão de `/ats/[slug]`
   para SmartRecruiters, SAP SuccessFactors, Oracle Recruiting, BambooHR, Jobvite,
   Recruitee, Teamtailor, Pinpoint, Kenoby/Vagas.com, Catho — priorizando os que
   o país-alvo usa.
6. Prioridade de idioma: **alemão** (melhor posição/CTR), **espanhol**, **coreano**.
   Revisar a tradução com o agente `translation-reviewer` antes de promover.
7. Artigos de fundo de funil, 1 por ATS: "o que é triagem de currículo"
   (já aparece: pos 68), "currículo para Gupy: modelo", "por que o Workday
   rejeita PDF". Linkar de volta para `/ats-check`.
8. Linkagem interna: hoje só o rodapé da landing liga as ATS. Colocar bloco
   "Outros sistemas" em cada guia e linkar guia → `/ats-check` com âncora
   descritiva.

**Mês 1–3 — autoridade (o gargalo real)**
9. Site novo, 0 backlinks relevantes: sem isto, os EUA (pos 16,8) não sobem.
   Publicar o `/market-pulse` como dado aberto e distribuir (já é CC BY 4.0):
   Reddit r/jobs e r/recruitinghell, LinkedIn, imprensa de RH, newsletter de
   carreira. Product Hunt, AlternativeTo, G2/Capterra, diretórios de IA.
10. Parcerias: bootcamps, mentores de carreira, blogs de RH com link para o
    teste gratuito.
11. Vídeo curto "Seu currículo passa na Gupy?" no YouTube/TikTok/Instagram,
    com link — YouTube é fonte muito citada por LLMs.

**GEO / LLM (aparecer em ChatGPT, Perplexity, Gemini, Claude)**
12. ✅ `llms.txt` completo. Considerar `llms-full.txt` com o conteúdo textual dos
    guias ATS em Markdown.
13. Começar cada guia por **resposta direta de 1–2 frases** ("A Gupy lê currículos
    em PDF de coluna única e rejeita…") — modelos extraem esse bloco. As FAQs em
    JSON-LD já ajudam; repetir o texto visível.
14. Dados citáveis com fonte e data (o `MarketShareAttribution` já faz isso para
    participação de mercado). Mais números próprios: "% de currículos que falham
    em X" a partir do `/ats-check`, publicado como estudo.
15. Entidade: LinkedIn/Crunchbase/Wikidata + `sameAs`; nome e descrição idênticos
    em todos os lugares ("GriffoWork — AI resume audit and ATS compatibility").
16. Medir: perguntar mensalmente a ChatGPT/Perplexity/Gemini 20 perguntas-alvo
    ("como saber se meu currículo passa na Gupy", "ATS resume checker grátis") e
    registrar se a marca aparece e é citada. Logar referrers `chatgpt.com`,
    `perplexity.ai`, `gemini.google.com` no analytics.
17. Se o domínio estiver atrás da Cloudflare: conferir que "Block AI bots"/"AI
    Labyrinth" **não** estão ativos — o `robots.txt` do app libera os crawlers,
    mas a Cloudflare pode bloqueá-los antes.

**Conversão (rankear sem vender não adianta)**
18. 4 cliques em 440 impressões é a primeira barreira; a segunda é o que
    acontece depois. Medir `ats-check` → cadastro → pagamento por página de
    entrada. Todas as ATS levam ao mesmo CTA — vale testar CTA específico
    ("Teste seu currículo na Gupy") em vez do genérico do cabeçalho.

## 5. Metas realistas

Site com 5 semanas e quase sem backlink: a expectativa honesta é **tráfego orgânico
relevante em 3–6 meses**, não em semanas. Metas para 90 dias: CTR ≥ 3% nas páginas
em posição ≤10; 30+ páginas ATS indexadas; 20 backlinks de domínios distintos;
marca em 1ª posição para "griffowork"; ≥ 50 cliques/semana vindos de ATS.

## 6. Limites desta análise

- Sem acesso ao site em produção: não verifiquei HTML renderizado, Core Web Vitals,
  Cloudflare nem o estado real do índice (`site:`).
- 38 dias de dado e 4 cliques: qualquer proporção é indicativa, não estatística.
- Não tive acesso a Bing Webmaster, GA ou ao painel da Vercel.

## 7. Exposição das APIs (auditoria de 2026-10-07)

66 rotas em `src/app/api`. Conferido no código e por chamadas sem credencial a
produção (só leitura):

| Grupo | Proteção | Resultado sem credencial |
|---|---|---|
| `admin/*` (15) | `getAdminUser` + limite no middleware | 403 |
| `cron/*` (7) | `CRON_SECRET` + limite | 401 |
| `resume/*`, `user/*`, `radar/*`, `analyses/*`, `checkout`, `support/chat` | sessão | 401 |
| `webhooks/stripe` | assinatura Stripe | — |
| `public/ats-check`, `public/match-preview` | sem sessão, **limite de 3 por 10 min por IP** + cota diária no banco | — |
| `public/match-result/[token]`, `radar/unsubscribe` | token válido/assinado; inexistente e vencido respondem igual | 404 |
| `hiring-index`, `pricing`, `i18n/geo`, `auth/me` | públicas de propósito | 200 |

Mutações passam por checagem de mesma origem (CSRF) no middleware; o preflight
`OPTIONS` não devolve `Access-Control-Allow-Origin`, então outro site não lê as
rotas autenticadas pelo navegador do usuário. **Nenhuma rota privada ficou
aberta.**

Achados e o que foi feito:

1. **`robots.txt` não protegia `/admin` e `/api/cron/` dos bots nomeados.** Um grupo
   `User-agent` substitui o grupo `*`; o grupo do Googlebot/GPTBot/etc. só tinha
   `Allow: /`. Eram rotas autenticadas (nada vazou), mas o rastreio era
   desperdiçado. Os `Disallow` agora estão nos dois grupos. ✅
2. **`public/robots.txt` e `src/app/robots.ts` coexistiam** (o Next acusa
   "conflicting public file and page file"). Em produção valia o gerado, mas a
   ambiguidade é frágil. Arquivo estático removido. ✅
3. **`GET /api` devolvia `{"message":"Hello, world!"}`**, resto do scaffold.
   Rota removida. ✅
4. **`/api/hiring-index` (32 KB, público, CC BY 4.0) saía com `no-store`**, porque o
   `next.config.ts` força isso em todo `/api/*`. O dado já é cacheado 1 h na
   memória da função; agora a CDN também guarda (`s-maxage=3600`). ✅
5. **Sem limite de taxa** em `hiring-index`, `pricing` e `i18n/geo` (fora do
   `matcher` do middleware). Risco baixo — são leituras baratas — e o cache do item 4
   cobre a primeira. Se `pricing` passar a consultar o banco, incluir no `matcher`.
6. **Decisão sua, não alterada:** liberar CORS (`Access-Control-Allow-Origin: *`) só
   em `/api/hiring-index` permitiria a terceiros consumirem o dataset do navegador.
   Não é necessário para SEO/GEO; só vale se quiser que o dado seja usado em sites
   de terceiros.

Não bloqueei `/api/` inteiro no robots de propósito: componentes de cliente
buscam `pricing` e `i18n/geo`, e o Googlebot precisa dessas respostas para
renderizar a página.

## 8. Novos guias de ATS

`smartrecruiters`, `successfactors` e `workable` em en/pt/es/de; `teamtailor` em
en/de/sv. Idiomas limitados aos que têm público (mesmo critério do `meta.ts`):
`/ats/teamtailor?lang=pt` cai no inglês, como já ocorre com `gupy?lang=de`. Todos
com `marketShare` qualitativo, sem número sem fonte. Entram no sitemap, nas rotas
estáticas, no rodapé da landing e no `llms.txt`.

### 8.1 Segunda leva (+5 guias, total de 19)

`oraclerecruiting` (en/pt/es/de — sucessor de nuvem do Taleo, que já aparece no
Search Console), `bamboohr` (en/es), `jobvite` (en), `recruitee` (en/de/nl) e
`breezyhr` (en/pt/es). Mesmo critério: só idiomas com público, `marketShare`
qualitativo, nenhuma afirmação de rejeição automática.

Fora desta leva, de propósito: ATS brasileiros menores (Kenoby, Abler, Pandapé etc.)
e Phenom/Eightfold. Não tenho como confirmar com segurança o que cada um faz hoje,
e um guia com fato errado custa mais que um guia a menos. Entram quando alguém
com acesso ao produto conferir o texto.
