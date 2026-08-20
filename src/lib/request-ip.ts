/**
 * O IP de quem fez a requisição.
 *
 * ## Por que não é só ler `x-forwarded-for`
 *
 * O domínio está atrás do Cloudflare. `X-Forwarded-For` é uma LISTA que cada
 * intermediário vai acrescentando — e o começo dela é o que o CLIENTE mandou.
 * Um cliente que envia `X-Forwarded-For: 203.0.113.7` faz o Cloudflare
 * acrescentar o IP real DEPOIS, e quem lê o primeiro item da lista lê o número
 * que o atacante escolheu.
 *
 * Isso não é teórico para este produto: o limitador de taxa usa esse valor como
 * chave. Um número novo a cada requisição dá um balde novo a cada requisição, e
 * o limite deixa de existir — justamente nas rotas que gastam IA e disparam
 * busca externa.
 *
 * `CF-Connecting-IP` é escrito pelo Cloudflare a partir da conexão real e
 * SOBRESCREVE o que o cliente tiver mandado. Por isso ele vem primeiro.
 *
 * Sem Cloudflare na frente o cabeçalho não existe e a leitura cai na cadeia
 * antiga — que continua sendo o melhor disponível nesse caso.
 */
export function clientIpFrom(headers: {
  get(name: string): string | null
}): string {
  const cloudflare = headers.get('cf-connecting-ip')?.trim()
  if (cloudflare) return cloudflare

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return headers.get('x-real-ip')?.trim() || 'desconhecido'
}
