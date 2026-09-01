import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { handleBareDomain, geoRedirectTarget, isGeoRedirectEnabled } from './middleware'

function req(opts: { path?: string; method?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`https://griffo.work${opts.path ?? '/'}`, {
    method: opts.method ?? 'GET',
    headers: opts.headers ?? {},
  })
}

test('isGeoRedirectEnabled: vem ligado por padrão, só desliga com "false" explícito', () => {
  const original = process.env.GEO_REDIRECT_ENABLED
  try {
    delete process.env.GEO_REDIRECT_ENABLED
    assert.equal(isGeoRedirectEnabled(), true)
    process.env.GEO_REDIRECT_ENABLED = 'false'
    assert.equal(isGeoRedirectEnabled(), false)
    process.env.GEO_REDIRECT_ENABLED = 'true'
    assert.equal(isGeoRedirectEnabled(), true)
  } finally {
    if (original === undefined) delete process.env.GEO_REDIRECT_ENABLED
    else process.env.GEO_REDIRECT_ENABLED = original
  }
})

test('geoRedirectTarget: país com rota própria vira o slug; desconhecido cai em "global"', () => {
  assert.equal(geoRedirectTarget(req({ headers: { 'cf-ipcountry': 'DE' } })), 'de')
  assert.equal(geoRedirectTarget(req({ headers: { 'cf-ipcountry': 'BR' } })), 'br')
  // Sem cobertura de mercado (não está em SUPPORTED_COUNTRY_SLUGS) e sem header nenhum.
  assert.equal(geoRedirectTarget(req({ headers: { 'cf-ipcountry': 'ZZ' } })), 'global')
  assert.equal(geoRedirectTarget(req({})), 'global')
})

test('handleBareDomain: redireciona visitante novo do domínio nu para o país da borda', () => {
  const res = handleBareDomain(req({ headers: { 'cf-ipcountry': 'DE' } }))
  assert.ok(res, 'deveria redirecionar')
  assert.equal(res!.status, 307)
  assert.equal(new URL((res as Response).headers.get('location')!).pathname, '/de')
})

test('handleBareDomain: nunca dispara fora do caminho exato "/" (evita loop de redirecionamento)', () => {
  assert.equal(handleBareDomain(req({ path: '/de' })), null)
  assert.equal(handleBareDomain(req({ path: '/global' })), null)
  assert.equal(handleBareDomain(req({ path: '/api/radar' })), null)
})

test('handleBareDomain: não redireciona requisição que não é GET', () => {
  assert.equal(handleBareDomain(req({ method: 'POST' })), null)
})

test('handleBareDomain: usuário logado (cookie de sessão) nunca é redirecionado', () => {
  const res = handleBareDomain(req({ headers: { cookie: 'ca_session=abc123', 'cf-ipcountry': 'DE' } }))
  assert.equal(res, null)
})

test('handleBareDomain: idioma escolhido manualmente (cookie griffo_lang) nunca é sobrescrito por geo-IP', () => {
  const res = handleBareDomain(req({ headers: { cookie: 'griffo_lang=pt', 'cf-ipcountry': 'DE' } }))
  assert.equal(res, null)
})

test('handleBareDomain: bots de busca/IA e crawlers de preview nunca são redirecionados', () => {
  const bots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'GPTBot/1.0',
    'ClaudeBot/1.0',
    'PerplexityBot/1.0',
    'facebookexternalhit/1.1',
    'Twitterbot/1.0',
    'Slackbot-LinkExpanding 1.0',
  ]
  for (const ua of bots) {
    const res = handleBareDomain(req({ headers: { 'user-agent': ua, 'cf-ipcountry': 'DE' } }))
    assert.equal(res, null, `deveria ignorar bot: ${ua}`)
  }
})

test('handleBareDomain: desligado via GEO_REDIRECT_ENABLED=false não redireciona ninguém', () => {
  const original = process.env.GEO_REDIRECT_ENABLED
  try {
    process.env.GEO_REDIRECT_ENABLED = 'false'
    const res = handleBareDomain(req({ headers: { 'cf-ipcountry': 'DE' } }))
    assert.equal(res, null)
  } finally {
    if (original === undefined) delete process.env.GEO_REDIRECT_ENABLED
    else process.env.GEO_REDIRECT_ENABLED = original
  }
})
