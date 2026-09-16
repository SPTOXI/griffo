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
 * Enquanto `CF_ORIGIN_SECRET` não estiver definido, o comportamento antigo é
 * mantido (os cabeçalhos são aceitos) para o deploy não quebrar a detecção de
 * país antes da regra existir — com um aviso no log.
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
    if (!warned && process.env.NODE_ENV === 'production') {
      warned = true
      console.warn('[edge-trust] CF_ORIGIN_SECRET ausente: cabeçalhos cf-* aceitos sem verificação.')
    }
    return true
  }
  const sent = headers.get(EDGE_SECRET_HEADER)?.trim() || ''
  return constantTimeEqual(sent, secret)
}
