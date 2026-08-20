import test from 'node:test'
import assert from 'node:assert/strict'
import { clientIpFrom } from './request-ip'

const headers = (map: Record<string, string>) => ({
  get: (name: string) => map[name.toLowerCase()] ?? null,
})

test('atrás do Cloudflare, vale o IP que ele escreveu', () => {
  assert.equal(
    clientIpFrom(headers({ 'cf-connecting-ip': '191.0.0.9', 'x-forwarded-for': '10.0.0.1' })),
    '191.0.0.9'
  )
})

test('cabeçalho forjado pelo cliente não vira chave de limite', () => {
  // O ataque: o cliente manda um X-Forwarded-For qualquer, o Cloudflare
  // acrescenta o IP real DEPOIS, e quem lê o primeiro item lê o número que o
  // atacante escolheu — um balde de limite novo a cada requisição.
  const forjado = headers({
    'x-forwarded-for': '203.0.113.7, 191.0.0.9',
    'cf-connecting-ip': '191.0.0.9',
  })
  assert.equal(clientIpFrom(forjado), '191.0.0.9')
})

test('sem Cloudflare, cai na cadeia antiga', () => {
  assert.equal(clientIpFrom(headers({ 'x-forwarded-for': '198.51.100.4, 10.0.0.1' })), '198.51.100.4')
  assert.equal(clientIpFrom(headers({ 'x-real-ip': '198.51.100.5' })), '198.51.100.5')
})

test('sem nenhum cabeçalho, um valor declarado', () => {
  // String vazia como chave juntaria todo mundo num balde só.
  assert.equal(clientIpFrom(headers({})), 'desconhecido')
  assert.equal(clientIpFrom(headers({ 'x-forwarded-for': '  ' })), 'desconhecido')
})
