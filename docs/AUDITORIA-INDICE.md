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
| 2.91 | 5903 | seo-geo | Qwoted, Featured e Help a B2B Writer cadastrados pelo operador |
| 2.92 | 5934 | seo-geo | Os sete diretórios de produto do item 3 do kit, todos cadastrados |
| 2.93 | 5959 | seo-geo | Os sete diretórios de produto, submetidos — pendência 22 fecha |
| 2.94 | 5983 | performance,seo-geo | LCP mobile da home em 3,9s — a logo pesava 47 KB a mais |
| 2.95 | 6050 | seo-geo | Bing Webmaster Tools: IndexNow, H1 ausente, backlinks — duas corrigidas |
| 2.96 | 6100 | seo-geo | Os seis termos de busca ("job/hiring/work/careers/employment/workforce") |
| 2.97 | 6190 | seo-geo | Correção: "remote work" não pedia página nova, `/global` já existia |
| 2.98 | 6239 | ats,performance | Nove termos de ATS verificados (árabe corrigido) e teste real do `optimizeCss` |
| 2.99 | 6301 | infra,limpeza | As branches remotas mescladas, apagadas — pendência 3 e seção 11 fecham |
| 2.100 | 6346 | vagas,produto | Verificação visual em produção: JobBase confirmado no cron, sessão expirada não redireciona |
| 2.101 | 6398 | infra,hiring-index | Gatilho mensal do hiring-index fora do Vercel — GitHub Actions |
| 2.102 | 6454 | produto | Sessão expirada não redirecionava — corrigido |
| 2.103 | 6495 | vagas,limpeza | REMOTIVE_LEGAL_NOTICE_KEY era código morto — removida |
| 2.104 | 6522 | produto | Pendências 2 e 9 fecham — barra de progresso confirmada de ponta a ponta |
| 2.105 | 6568 | produto,i18n | "Workforce" B2B — recorte concreto implementado |
| 2.106 | 6611 | vagas,produto,precos | Busca avulsa do Radar — §7.4 fecha, preço R$14,90 era rascunho nunca usado |
| 2.107 | 6720 | vagas,produto,performance | Botão da busca avulsa + 504 real: coleta síncrona não cabia na resposta HTTP, corrigido com `after()` |
| 2.108 | 6802 | infra,email | Pendência 1 fecha: RESEND_API_KEY estava escrita no .env mas não era variável de ambiente; primeiro digest real confirmado por banco |
| 2.109 | 6843 | design,produto | Pendência 4 fecha: revisão visual autenticada — sticky header/faixa de resumo não gruda, card B2B sem link novo em plans-view.tsx |
| 2.110 | 6937 | design,i18n | Tagline "Global AI Career Intelligence" dentro do app — mapa duplicado desatualizado, centralizado em brandTaglineForLang |
| 2.111 | 6967 | precos,i18n | Legenda nova: a moeda segue o país de acesso, não o idioma — landing e plans-view.tsx |
| 2.112 | 7008 | vagas,produto | Pendência 7.2 fecha: confirmado por leitura que a rota do currículo direcionado é POST /api/radar/prepare |
| 2.113 | 7049 | infra,git | As duas últimas branches claude/* auditadas (conteúdo já em main, byte a byte) e apagadas do remoto |
| 2.114 | 7086 | dados,i18n,juridico | Licença do dataset decidida: CC BY 4.0 — campo license no JSON-LD e licenseNote nos 12 idiomas do mapa |
| 2.115 | 7141 | docs,infra,email | Deriva de documentação: handoff §7.3 e mapa §8.7 ainda diziam que o digest estava desligado — corrigidos |
| 2.116 | 7193 | infra,limpeza | CI no GitHub Actions: tsc, eslint e suíte a cada PR e push em main — sem segredo, sem banco |
| 2.117 | 7261 | infra,cobranca,ia-router | Testes de cobrança e failover: 33 casos, 12 mutações, o H6 fecha — e o teste de PDF que passava sobre código quebrado |
| 2.118 | 7400 | infra,decisao | Bloqueio de merge fica desligado: plano gratuito não aplica ruleset em repo privado — reavaliar na primeira venda |
| 2.119 | 7439 | seo,geo,i18n | "Job interview" — lacuna de SEO/GEO achada em dado externo; termo novo em job-search-terms.ts e em /hiring, 12 idiomas |
| 2.120 | 7533 | design-ui,produto,i18n | Hero D + faixa "A ordem importa": landing reposicionada da vaga para a auditoria, contagem real de vagas, cartão ilustrativo rotulado, 12 idiomas |
| 2.121 | 7640 | seguranca,i18n,produto | `/privacy` nos 12 idiomas, todo fato verificável no código; nasce o agente `translation-reviewer` |
| 2.122 | 7713 | docs,infra,limpeza | Revisão geral: tudo verde no código, handoff §7.7 desatualizado corrigido, dois ponteiros de branch obsoletos limpos |
| 2.123 | 7762 | design-ui | Cartão do Hero D mudava de altura ao trocar de aba e empurrava o texto lateral — abas empilhadas na mesma célula de grid |
| 2.124 | 7793 | seo-geo,i18n | Google Trends real nos 12 idiomas: termo isolado de currículo entra em job-search-terms.ts, termo de vaga fica de fora por direção |
| 2.125 | 7867 | vagas,produto | Pendência 16 reaberta: causa raiz era país vazio, não falta de vaga — inferência por cidade, backfill de 3.975 vagas, cobertura 52%→93% (fase 1 de 4) |
| 2.126 | 7952 | vagas,i18n,infra | Campo Job.category + "vaga remota" sobrepondo (fase 2 de 4) — código pronto, push represado até `db push` do operador |
| 2.127 | 8015 | vagas,produto,design-ui | Lista "vagas por país" na home (fase 3 de 4); bug real achado: seção desaparecia pós-hidratação por prop ausente num dos dois retornos de home-client.tsx |
| 2.128 | 8059 | vagas,produto,radar,docs | Análise do `career-ops`; sinal de legitimidade de vaga (banco de talentos sai do Radar); calibração da nota (pausada por falta de clientes); `expired_by_age` que o schema previa e o código nunca fez; funil com 800 visitas e zero conversões |
| 2.129 | 8222 | seguranca,ia,produto,docs | Análise do `linkedin-agent-skill`: 9 das 11 skills não servem e `li-profile` já existe; dois furos reais achados — tag characters vazando por baixo do escape de prompt (#76) e saída gerada de IA sem crivo nenhum (#77) |
| 2.130 | 8344 | vagas,radar,decisao | Idade basta para apagar (pedido do operador, critério do JobBase): `agedJobPurgeWhere` sem `closedAt`, e a trava do laço apaga-reimporta-reavisa migra para `isTooOldToImport` na coleta |
| 2.131 | 8412 | infra,conformidade,docs | O expurgo nunca teve gatilho automático (só o painel de admin) e o §2.130 dizia que tinha; nasce `/api/cron/retention` + workflow diário, e um teste que exige gatilho para toda rota de cron |
