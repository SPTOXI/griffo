# Índice de `AUDITORIA-EVOLUCAO-GLOBAL.md`

Este arquivo existe para achar uma seção sem abrir o arquivo inteiro. Ele **não
substitui** a auditoria — é só o mapa de onde cada coisa está, com a linha
exata pra ler direto com `Read(offset=linha, limit=N)` ou `sed -n`.

**Como usar**: primeiro decida o que procura — um número de seção (se já
souber o `§`) ou um tema. Se for tema, filtre a coluna Tema abaixo antes de
abrir a auditoria. Nunca abra o arquivo inteiro só para achar uma seção.

**Manutenção**: toda vez que uma seção nova entrar em `AUDITORIA-EVOLUCAO-
GLOBAL.md`, acrescente uma linha aqui. Sem isso o índice fica desatualizado e
pior que inútil — parece confiável e não é. `docs/HANDOFF-CONTINUIDADE.md`
já lista os três documentos de continuidade; este é o quarto.

**Temas usados**: `fundacao` `vagas` `radar` `matching` `ia-router` `i18n`
`seo-geo` `hiring-index` `ats` `preco` `seguranca` `design-ui` `performance`
`limpeza` `produto` `docs` `infra`

| § | Linha | Tema | Título |
|---|---|---|---|
| 1 | 14 | fundacao | O que foi encontrado |
| 2 | 109 | fundacao | O que foi executado nesta etapa |
| 2.8 | 255 | vagas | Etapa 3 concluída — taxonomia profissional (§8) |
| 2.9 | 277 | vagas | Etapa 4 concluída — Job Intelligence (§13, §14) e a regra do §12 |
| 2.10 | 319 | vagas | Etapas 5 a 8 — do filtro duro ao Job Fit |
| 2.11 | 356 | radar | O Radar passa a rodar (§28, §29, §30) |
| 3 | 402 | fundacao | O que **não** foi feito — e por quê |
| 4 | 436 | fundacao | Regras herdadas do prompt mestre que valem para todo trabalho futuro |
| 2.12 | 450 | vagas | O Greenhouse sai do papel (Etapa 5) |
| 2.13 | 508 | vagas | A primeira coleta real estourou o teto, e o que ela ensinou |
| 2.14 | 559 | radar | O Radar estava pendurado no formulário errado |
| 2.15 | 611 | i18n | Países por extenso |
| 2.16 | 629 | ats,vagas | O segundo ATS, e o que ele não resolve |
| 2.17 | 683 | vagas | O Brasil entra, e a fonte de busca muda o contrato |
| 2.18 | 746 | vagas | Não ficar na mão de uma fonte só |
| 2.19 | 807 | vagas | A Adzuna, e o salário que quase entrou inventado |
| 2.20 | 865 | radar | O primeiro alerta, e o defeito que ele expôs |
| 2.21 | 931 | vagas | Vaga também acaba |
| 2.22 | 996 | vagas | A Adzuna deixa de ser só o Brasil |
| 2.23 | 1057 | vagas | Portugal e Japão entram pela porta do remoto |
| 2.24 | 1119 | vagas,infra | A ponte que faltava, e o painel que não existia |
| 2.25 | 1187 | matching | A coluna que faltava, e o defeito de matching que ela escondia |
| 11 | 1292 | preco | Global Day 1 & Priorização Dinâmica por Mercado (24/08/2026) |
| 2.26 | 1329 | design-ui | Revisão visual de todo o app — uma paleta, não sete |
| 2.27 | 1486 | design-ui,produto | Hero reorganizado, e o problema estrutural por trás do laudo |
| 2.28 | 1584 | ia-router,produto | Três achados de produção, e um deles ainda em aberto |
| 2.29 | 1661 | vagas | Itália operacionalizada, e a Adzuna deixa de ser rodízio |
| 2.30 | 1707 | vagas | Medir antes de automatizar — qualidade e maturidade por fonte de vaga |
| 2.31 | 1750 | ia-router | Nenhuma IA por trás do "agente" de qualidade — e a mesma régua para os agentes de verdade |
| 2.32 | 1803 | i18n | A pendência do idioma (§2.28) fechada — as dez telas internas |
| 2.33 | 1861 | vagas,infra | JobBase — uma base própria de vagas, num segundo projeto Supabase |
| 2.34 | 1920 | ia-router | Ordem errada de suplente no roteador de IA — Kimi nunca salvava o Claude |
| 2.35 | 2040 | ia-router,produto | Progresso real em cinco fluxos de IA — nova regra inegociável |
| 2.36 | 2114 | ia-router | Quinto provedor de IA cadastrado — OpenAI (GPT-5.6 Luna) |
| 2.37 | 2167 | ia-router | Modelos desatualizados nas chaves já cadastradas — corrigido no banco |
| 2.38 | 2204 | ia-router | OpenAI recusava `max_tokens` — primeira chamada real ao gpt-5.6-luna |
| 2.39 | 2227 | ia-router | "Erro geral" no Kimi/GPT/Gemini — três causas diferentes, uma por uma |
| 2.40 | 2267 | limpeza | Busca sistêmica por código morto — 10 itens removidos |
| 2.41 | 2334 | i18n | Internacionalização Completa do Sistema e Paridade Multilíngue (PT, EN, ES) |
| 2.42 | 2374 | radar,preco | Integração do Radar de Vagas à Proposta de Valor e Catálogo de Preços |
| 2.43 | 2397 | seo-geo | SEO: SSR multi-país na landing, e as páginas de carreiras saem para o ATS |
| 2.44 | 2413 | i18n | i18n salta de 3 para 12 idiomas, dicionário quebrado em arquivos por locale |
| 2.45 | 2440 | i18n | E-mail de contato corporativo: fonte de verdade única em todos os idiomas |
| 2.46 | 2448 | radar | Radar: filtro de compatibilidade mínima não estava sendo aplicado |
| 2.47 | 2461 | seo-geo | Auditoria SEO/GEO externa — 2 acertos, 2 alarmes falsos, 3 bugs reais |
| 2.48 | 2538 | seo-geo | Novo slogan — só na meta description, de propósito |
| 2.49 | 2565 | i18n | Regra reafirmada: nada fixo em português — JSON-LD raiz vazava PT |
| 2.50 | 2616 | i18n,seo-geo | Domínio nu passa a redirecionar por geo-IP |
| 2.51 | 2690 | hiring-index | Índice de temperatura de contratação — fase 1: esquema e conectores |
| 2.52 | 2820 | hiring-index | Índice de temperatura — fase 2: 12 idiomas, tela no laudo, cron próprio |
| 2.53 | 2984 | hiring-index | Revisão de código do índice de temperatura — 3 bugs reais, 2 duplicações |
| 2.54 | 3056 | hiring-index | Índice de temperatura — fase 3: ILOSTAT e CEPALSTAT, 30 para 98 países |
| 2.55 | 3288 | vagas | Adzuna: de 11 para 19 países verificados |
| 2.56 | 3510 | hiring-index | Mapa-múndi público de temperatura de contratação (`/market-pulse`) |
| 2.57 | 3791 | hiring-index | Dois defeitos achados pelo operador — página órfã e texto estourando |
| 2.58 | 3833 | hiring-index | Índice GriffoWork na home — versão leve |
| 2.59 | 3882 | hiring-index | Agregação por continente — pendência 14(e) fechada |
| 2.60 | 4069 | seo-geo,performance | Lighthouse mobile: geo-IP era o maior custo — trocado por rewrite |
| 2.61 | 4108 | hiring-index,design-ui | Índice discreto demais na home, aviso escondido num acordeão |
| 2.62 | 4158 | limpeza | Limpeza de código morto — 39 arquivos e 38 dependências |
| 2.63 | 4232 | i18n,hiring-index | "No fundo" trocado por "Tocando o fundo" no dicionário PT |
| 2.64 | 4260 | i18n,hiring-index | 6 rótulos do índice em PT trocados por vocabulário de mercado financeiro |
| 2.65 | 4306 | hiring-index | América Central e Caribe separam de América do Norte |
| 2.66 | 4369 | hiring-index | Removida a seção "Como isto é calculado" de `/market-pulse` |
| 2.67 | 4403 | hiring-index,design-ui | Índice enxuto, tabela de países retrátil, metodologia curta |
| 2.68 | 4461 | hiring-index | "+5" virou termo ("Equilíbrio") — normalizado por percentual |
| 2.69 | 4521 | seo-geo | Zero páginas indexadas: domínios duplicados + hreflang descartado |
| 2.70 | 4581 | performance | App autenticado inteiro (com `recharts`) ia no JS de todo visitante |
| 2.71 | 4643 | i18n | Nome do país no título e no JSON-LD virou português fixo |
| 2.72 | 4691 | seo-geo,i18n | Reposicionamento da home: tagline, CTA e headline nas 12 línguas |
| 2.73 | 4756 | seo-geo | IndexNow (Bing + demais motores participantes) |
| 2.74 | 4808 | i18n,design-ui | Cortes reais de layout em idiomas com frase mais longa |
| 2.75 | 4873 | i18n,design-ui | Cabeçalho sobrepondo no desktop + seletor de idioma sem efeito |
| 2.76 | 4957 | i18n | 36 chaves de i18n perdendo dado real em 9 de 12 idiomas |
| 2.77 | 5073 | seo-geo | Parágrafo BLUF no hero — frase factual pra citação por IA (GEO) |
| 2.78 | 5114 | seo-geo,design-ui | Badge do hero: fora "IA"/"Global", dentro mais prova de ATS real |
| 2.79 | 5140 | i18n,seo-geo | "CV" vs "resume" por mercado, e o termo nativo nas keywords |
| 2.80 | 5194 | seo-geo | Item "Information Gain": número falso achado em produção |
| 2.81 | 5248 | seo-geo | Fonte e data viram obrigação de tipo, não de disciplina |
| 2.82 | 5309 | ats,i18n | Páginas de ATS multilíngues, com escopo por relevância |
| 2.83 | 5389 | i18n,seo-geo | "Sem revisão nativa" virou um defeito concreto e corrigido |
| 2.84 | 5432 | produto,seo-geo | `/hiring`: primeira porta de entrada, e a direção invertida da palavra |
| 2.85 | 5497 | seo-geo | Autoridade externa: página órfã, dataset sem `distribution`, fila de pauta |
| 2.86 | 5564 | i18n | Site inteiro declarava ser português, árabe renderizava espelhado |
| 2.87 | 5639 | seo-geo,i18n | A casa do árabe não tinha porta, lista de países se partiu em duas |
| 2.88 | 5704 | i18n,seo-geo | `#OpenToWork` e `job hunting`: a hashtag que não se traduz |
| 2.89 | 5763 | seguranca | `REVOKE ... FROM anon` não fecha função nenhuma |
| 2.90 | 5839 | docs | README desatualizado — Postgres/Stripe real vs. SQLite/simulado |
