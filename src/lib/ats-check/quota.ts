import { createHash } from 'node:crypto'
import { isIPv4, isIPv6 } from 'node:net'

/**
 * Cota do teste grátis: UM por pessoa a cada 24 horas.
 *
 * "Pessoa" é o navegador (visitorId) OU o endereço de rede — basta um dos dois
 * já ter testado para bloquear. Apagar o localStorage não reabre o teste,
 * porque o IP continua o mesmo; trocar de rede não reabre, porque o
 * navegador continua o mesmo.
 *
 * O IP nunca é gravado: só um hash dele, que serve para comparar e não para
 * identificar ninguém.
 */
export const ATS_FREE_CHECKS_PER_WINDOW = 1
export const ATS_FREE_WINDOW_MS = 24 * 60 * 60 * 1000

export function ipKeyFor(ip: string): string {
  const salt = process.env.ATS_CHECK_SALT || 'griffo-ats-check'
  return createHash('sha256').update(`${salt}:${quotaSubject(ip)}`).digest('hex').slice(0, 32)
}

/**
 * O que conta como "um endereço" para a cota.
 *
 * IPv4: o próprio endereço. IPv6: o prefixo /64. Um provedor entrega a cada
 * cliente um /64 inteiro — 2^64 endereços que ele troca à vontade, sem pedir
 * nada a ninguém. Contar o endereço exato dava a quem tem IPv6 uma cota grátis
 * nova a cada requisição, e em `match-preview` cada uma é uma chamada de IA
 * paga por nós. IPv6 com IPv4 embutido (`::ffff:1.2.3.4`) conta como o IPv4.
 */
export function quotaSubject(ip: string): string {
  const raw = ip.trim().replace(/^\[|\]$/g, '').split('%')[0]
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(raw)
  if (mapped && isIPv4(mapped[1])) return mapped[1]
  if (!isIPv6(raw)) return raw
  const groups = expandIpv6(raw)
  return groups ? `${groups.slice(0, 4).join(':')}::/64` : raw
}

/** Os 8 grupos de um IPv6 válido, minúsculos e sem zeros à esquerda. */
function expandIpv6(ip: string): string[] | null {
  let text = ip.toLowerCase()
  // Cauda em notação IPv4 (`64:ff9b::1.2.3.4`) vira dois grupos hexadecimais.
  const tail = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text)
  if (tail) {
    const [a, b, c, d] = tail.slice(1).map(Number)
    text = text.slice(0, tail.index) + ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16)
  }
  const [head, rest] = text.split('::')
  const left = head ? head.split(':') : []
  const right = rest !== undefined && rest ? rest.split(':') : []
  const missing = 8 - left.length - right.length
  if (rest === undefined ? left.length !== 8 : missing < 1) return null
  const all = rest === undefined ? left : [...left, ...Array(missing).fill('0'), ...right]
  return all.map((g) => parseInt(g, 16).toString(16))
}

/** Trecho procurado dentro do JSON de `meta` para achar testes do mesmo IP. */
export function ipMetaNeedle(ipKey: string): string {
  return `"ipKey":"${ipKey}"`
}
