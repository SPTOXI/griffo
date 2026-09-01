import { normalizeCountry } from './catalog'

/**
 * O país de onde a requisição veio.
 *
 * `cf-ipcountry` vem PRIMEIRO, e a ordem é a correção de um erro real.
 *
 * O domínio está atrás do Cloudflare. Quando ele proxia, quem se conecta à
 * Vercel é um nó do Cloudflare, não a pessoa — e `x-vercel-ip-country`, que a
 * Vercel calcula do IP conectante, passa a descrever o data center do
 * Cloudflare. `cf-ipcountry` é calculado do IP do VISITANTE de verdade.
 *
 * Com a ordem antiga, um usuário no Brasil podia ser lido como outro país. Isso
 * não é cosmético: o país de borda decide a FAIXA DE PREÇO (um brasileiro veria
 * US$ 12,90 da Faixa 1 em vez do preço em real) e alimenta o mercado
 * profissional da análise (o laudo saía com convenção de currículo americano).
 *
 * Quando o Cloudflare não está proxiando, o cabeçalho simplesmente não existe e
 * a leitura cai na da Vercel, como antes.
 *
 * Sem `server-only` de propósito: precisa rodar também no Edge Runtime do
 * `middleware.ts` (que decide o redirecionamento do domínio nu) e ser
 * importável direto por teste (`node:test`/`tsx`), que não reconhece a
 * condição de build que o pacote `server-only` verifica. `resolve.ts`
 * continua com `server-only` para as funções que de fato não podem vazar
 * para o client (resolução de preço por pagamento).
 */
export function edgeCountry(req: Request): string {
  return normalizeCountry(
    req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || ''
  )
}
