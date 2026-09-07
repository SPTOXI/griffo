import { HREFLANG_COUNTRY_ROUTE } from '@/lib/i18n/hreflang'

/**
 * Os mercados que o rodapé linka em toda página pública.
 *
 * ## Por que esta lista é uma obrigação, e não uma vitrine
 *
 * Um `<loc>` no sitemap declara que a página EXISTE; um link interno declara
 * que ela IMPORTA, e só o segundo move a fila de rastreamento — foi assim que
 * `/hiring` acabou em "Detectada, mas não indexada" no Search Console (§2.85).
 *
 * Antes daqui o rodapé linkava 11 países escolhidos a dedo, e as outras 29
 * rotas do sitemap dependiam de UM único link: a tabela de países do
 * `/market-pulse`. Só que aquela tabela lista apenas quem tem dado no atlas —
 * então a descoberta de uma rota de país ficava presa à cobertura estatística
 * de uma coleta que muda sozinha a cada trimestre. `/ae` e `/my` já estavam
 * assim: no sitemap, servindo página, e sem um único link apontando.
 *
 * `/ae` é o caso grave, porque não é um mercado a mais — é a rota que o
 * `hreflang` da raiz declara ser a **casa do árabe**. O site anunciava ao
 * Google a página canônica de um dos seus doze idiomas e não dava caminho
 * nenhum até ela.
 *
 * Daí a regra: **toda casa de idioma declarada no `hreflang` entra aqui,
 * sempre**, independente de haver dado de mercado. `footer-markets.test.ts`
 * cobra isso — a lista pode crescer por decisão comercial, mas não pode
 * encolher abaixo das doze.
 *
 * Os NOMES não moram aqui de propósito: saem de `displayCountry(code, lang)`
 * no idioma da tela. Escrevê-los seria enfiar português nas outras onze
 * telas, que é exatamente o que o cabeçalho de `hiring-index/display.ts` já
 * avisa para não fazer — e era o que estava acontecendo, com "Brasil (BR)" e
 * "Estados Unidos (US)" aparecendo no rodapé de `/de`, `/jp` e `/ae`.
 */
export const FOOTER_MARKET_SLUGS: readonly string[] = [
  // Casas de idioma — presença obrigatória, cobrada por teste.
  ...new Set(Object.values(HREFLANG_COUNTRY_ROUTE)),
  // Mercados comerciais que já eram linkados e não são casa de idioma.
  'au', 'ca', 'gb', 'mx', 'pt',
  // `my` não é casa de idioma nem estava no rodapé, mas era — junto de `ae` —
  // uma das duas únicas rotas do sitemap sem NENHUM link interno, porque a
  // Malásia não tem dado no atlas e portanto não tinha linha no
  // `/market-pulse`. Entra para deixar de ser órfã.
  'my',
]
