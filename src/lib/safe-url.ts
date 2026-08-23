/**
 * Validação de esquema de URL para valores que saem para o navegador ou para o
 * cliente de e-mail.
 *
 * Este módulo NÃO é o `url-guard`. Aquele resolve DNS e recusa destinos
 * internos, e existe para proteger o SERVIDOR quando ele mesmo busca uma URL
 * (SSRF). Este aqui protege o USUÁRIO: uma URL guardada no banco vira `href`
 * no e-mail do digest e argumento de `window.open` no Radar, e nesses dois
 * lugares `javascript:` e `data:` executam script na origem da aplicação.
 *
 * Por que isso importa aqui: `applicationUrl` não é digitada por nós. Ela vem
 * de quadros de vagas de terceiros — Greenhouse, Lever, Gupy, Adzuna, RemoteOK
 * — e das páginas de carreira em `CAREER_PAGES`, cujo JSON-LD é escrito pela
 * própria empresa. Um desses conteúdos ser hostil não é hipótese remota: é o
 * modelo de ameaça normal de quem consome dado de terceiro.
 *
 * Escapar HTML não resolve este caso. `escapeHtml('javascript:alert(1)')` não
 * muda um caractere sequer — o valor continua sendo um esquema executável
 * dentro de um atributo `href` perfeitamente bem formado. O que fecha a porta
 * é recusar o esquema, e é só isso que este módulo faz.
 *
 * Sem `server-only`: o cliente precisa dele antes de `window.open`.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * `true` se o valor é uma URL absoluta http/https.
 *
 * Relativa é recusada de propósito: todo consumidor deste módulo trabalha com
 * endereço externo, e uma URL relativa ali é sinal de dado malformado.
 */
export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    return SAFE_PROTOCOLS.has(new URL(value.trim()).protocol)
  } catch {
    return false
  }
}

/** A URL, se for segura; `null` se não for. */
export function safeHttpUrl(value: unknown): string | null {
  return isSafeHttpUrl(value) ? (value as string).trim() : null
}

/**
 * Aceita a forma abreviada que o usuário digita ("linkedin.com/in/fulano") e
 * devolve a URL absoluta correspondente — mas continua recusando um esquema
 * perigoso escrito por extenso.
 *
 * É o formato dos links de perfil: o campo da tela não pede "https://", e
 * exigi-lo transformaria uma digitação normal em erro de validação.
 */
export function safeProfileUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Qualquer coisa antes de `:` que não seja http/https é recusada sem tentar
  // consertar. Prefixar "https://" em `javascript:alert(1)` produziria uma
  // string inválida em vez de uma recusa explícita — e o silêncio esconde a
  // tentativa de quem escreveu.
  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):/i)
  if (scheme && !SAFE_PROTOCOLS.has(`${scheme[1].toLowerCase()}:`)) return null

  return safeHttpUrl(scheme ? trimmed : `https://${trimmed}`)
}
