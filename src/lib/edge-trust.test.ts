import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cameThroughCloudflare } from './edge-trust'
import { clientIpFrom } from './request-ip'
import { edgeCountry } from './pricing/edge-country'

const h = (o: Record<string, string>) => new Headers(o)
const req = (o: Record<string, string>) => new Request('https://griffo.work/', { headers: o })

test('sem CF_ORIGIN_SECRET fora de produção os cabeçalhos cf-* são aceitos', () => {
  delete process.env.CF_ORIGIN_SECRET
  assert.equal(cameThroughCloudflare(h({})), true)
  assert.equal(edgeCountry(req({ 'cf-ipcountry': 'BR' })), 'BR')
})

test('sem CF_ORIGIN_SECRET em produção os cabeçalhos cf-* são recusados', () => {
  delete process.env.CF_ORIGIN_SECRET
  const env = process.env as Record<string, string | undefined>
  const previous = env.NODE_ENV
  env.NODE_ENV = 'production'
  try {
    assert.equal(cameThroughCloudflare(h({})), false)
    assert.equal(clientIpFrom(h({ 'cf-connecting-ip': '1.2.3.4', 'x-real-ip': '198.51.100.4' })), '198.51.100.4')
    assert.equal(edgeCountry(req({ 'cf-ipcountry': 'IN', 'x-vercel-ip-country': 'BR' })), 'BR')
  } finally {
    env.NODE_ENV = previous
  }
})

test('com CF_ORIGIN_SECRET, cf-ipcountry forjado direto na origem é ignorado', () => {
  process.env.CF_ORIGIN_SECRET = 's3gr3d0'
  try {
    // Ataque: chamada direta à *.vercel.app pedindo a Faixa 4.
    assert.equal(edgeCountry(req({ 'cf-ipcountry': 'IN', 'x-vercel-ip-country': 'US' })), 'US')
    assert.equal(edgeCountry(req({ 'cf-ipcountry': 'IN', 'x-griffo-edge': 'errado' })), '')
    // Caminho legítimo: veio pelo Cloudflare.
    assert.equal(edgeCountry(req({ 'cf-ipcountry': 'BR', 'x-griffo-edge': 's3gr3d0' })), 'BR')
  } finally {
    delete process.env.CF_ORIGIN_SECRET
  }
})

test('com CF_ORIGIN_SECRET, cf-connecting-ip forjado não vira chave do limitador', () => {
  process.env.CF_ORIGIN_SECRET = 's3gr3d0'
  try {
    assert.equal(clientIpFrom(h({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '198.51.100.4' })), '198.51.100.4')
    assert.equal(
      clientIpFrom(h({ 'cf-connecting-ip': '1.2.3.4', 'x-griffo-edge': 's3gr3d0', 'x-forwarded-for': '9.9.9.9' })),
      '1.2.3.4'
    )
  } finally {
    delete process.env.CF_ORIGIN_SECRET
  }
})
