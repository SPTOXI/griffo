import { createHash } from 'node:crypto'

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
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/** Trecho procurado dentro do JSON de `meta` para achar testes do mesmo IP. */
export function ipMetaNeedle(ipKey: string): string {
  return `"ipKey":"${ipKey}"`
}
