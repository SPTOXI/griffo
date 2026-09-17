import test from 'node:test'
import assert from 'node:assert/strict'
import { CLIENT_EVENTS, FUNNEL_STEPS, SERVER_EVENTS, isLikelyBot, summarizeFunnel } from './funnel'

test('evento de servidor nunca é aceito do navegador', () => {
  for (const e of SERVER_EVENTS) {
    assert.ok(!(CLIENT_EVENTS as readonly string[]).includes(e), e)
  }
})

test('todo passo do funil é um evento conhecido', () => {
  const all = new Set<string>([...CLIENT_EVENTS, ...SERVER_EVENTS])
  for (const step of FUNNEL_STEPS) assert.ok(all.has(step.event), step.event)
})

test('reconhece robôs e pré-visualizadores de link', () => {
  for (const ua of [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'WhatsApp/2.23.20.0',
    'curl/8.4.0',
    '',
    null,
  ]) {
    assert.equal(isLikelyBot(ua), true, String(ua))
  }
})

test('navegador comum não é robô', () => {
  for (const ua of [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36',
  ]) {
    assert.equal(isLikelyBot(ua), false, ua)
  }
})

test('funil conta pessoas distintas e a conversão entre passos', () => {
  const rows = [
    { event: 'page_view', userId: null, visitorId: 'a' },
    { event: 'page_view', userId: null, visitorId: 'a' },
    { event: 'page_view', userId: null, visitorId: 'b' },
    { event: 'page_view', userId: null, visitorId: 'c' },
    { event: 'page_view', userId: null, visitorId: 'd' },
    { event: 'signup_done', userId: 'u1', visitorId: 'a' },
    { event: 'purchase_done', userId: 'u1', visitorId: null },
    { event: 'purchase_done', userId: 'u1', visitorId: null },
  ]
  const s = summarizeFunnel(rows)
  const get = (e: string) => s.find((x) => x.event === e)!
  assert.equal(get('page_view').people, 4)
  assert.equal(get('page_view').fromPrevious, null)
  assert.equal(get('signup_done').people, 1)
  assert.equal(get('signup_done').fromPrevious, 25)
  assert.equal(get('purchase_done').people, 1)
  // passos vazios no meio não zeram a base: compra é comparada ao cadastro
  assert.equal(get('purchase_done').fromPrevious, 100)
})
