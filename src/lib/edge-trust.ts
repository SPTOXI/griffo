/**
 * Os cabeçalhos `cf-*` só valem quando a requisição passou pelo Cloudflare.
 *
 * `cf-ipcountry` e `cf-connecting-ip` são escritos pelo Cloudflare, mas a
 * Vercel não os remove de requisições que chegam DIRETO nela — pela URL
 * `*.vercel.app` do deploy, ou por qualquer um que descubra a origem. Sem esta
 * checagem, `curl -H "cf-ipcountry: IN"` compra na Faixa 4, e um
 * `cf-connecting-ip` diferente a cada chamada zera o limitador de taxa.
 *
 * Como fechar: uma Transform Rule no Cloudflare (Rules → Transform Rules →
 * Modify Request Header) define `x-griffo-edge: <segredo>` em TODAS as
 * requisições de griffo.work, e o mesmo valor vai para `CF_ORIGIN_SECRET` na
 * Vercel. Só quem conhece o segredo produz o cabeçalho.
 *
 * Em produção, sem `CF_ORIGIN_SECRET` os cabeçalhos `cf-*` são RECUSADOS
 * (falha fechada): aceitá-los deixava qualquer um zerar o limitador de login
 * trocando `cf-connecting-ip` a cada tentativa. País e IP caem nos cabeçalhos
 * que a própria Vercel escreve. Fora de produção (dev/teste) continuam aceitos.
 *
 * Sem `node:crypto`: roda no Edge Runtime do middleware.
 */
export const EDGE_SECRET_HEADER = 'x-griffo-edge'

let warned = false

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function cameThroughCloudflare(headers: { get(name: string): string | null }): boolean {
  const secret = process.env.CF_ORIGIN_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') return true
    if (!warned) {
      warned = true
      console.warn('[edge-trust] CF_ORIGIN_SECRET ausente: cabeçalhos cf-* ignorados em produção.')
    }
    return false
  }
  const sent = headers.get(EDGE_SECRET_HEADER)?.trim() || ''
  return constantTimeEqual(sent, secret)
}
