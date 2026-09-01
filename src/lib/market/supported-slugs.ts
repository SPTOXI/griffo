/**
 * Slugs de país com rota própria e pré-gerada por SSG.
 *
 * Extraído para arquivo próprio (sem nenhum outro import) para poder ser
 * usado tanto por `[country]/page.tsx` (gera as rotas estáticas) quanto por
 * `middleware.ts` (decide para onde redirecionar o domínio nu) sem puxar a
 * árvore de dependências da página para dentro do bundle do Edge Runtime.
 */
export const SUPPORTED_COUNTRY_SLUGS = [
  'br', 'us', 'pt', 'es', 'mx', 'gb', 'ca', 'de', 'at', 'fr', 'be', 'lu',
  'it', 'au', 'nz', 'in', 'jp', 'global',
  'pl', 'cz', 'cl', 'my', 'tr', 'za', 'ae', 'co', 'ar', 'th', 'ro', 'bg',
  'id', 'ph', 'vn', 'ng', 'eg', 'pk', 'bd', 'ke', 'sg', 'nl', 'ie'
]
