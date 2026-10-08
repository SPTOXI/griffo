import { test } from 'node:test'
import assert from 'node:assert/strict'
import { metaContent, readTextCapped, stripTagBlocks, stripTags, tagBlocks } from './html-scan'

test('extrai blocos, meta e texto como antes', () => {
  const html =
    '<html><head><title>Vaga X</title><meta property="og:description" content="Descrição da vaga">' +
    '<script type="application/ld+json">{"a":1}</script><style>p{}</style></head><body><p>Olá</p></body></html>'
  assert.equal(tagBlocks(html, 'title')[0]?.body, 'Vaga X')
  assert.equal(metaContent(html, 'property', 'og:description'), 'Descrição da vaga')
  assert.equal(tagBlocks(html, 'script')[0]?.body, '{"a":1}')
  assert.equal(stripTags(stripTagBlocks(stripTagBlocks(html, 'script'), 'style')).replace(/\s+/g, ' ').trim(), 'Vaga X Olá')
})

test('marcação hostil sem fechamento termina rápido', () => {
  const hostile = '<script type="application/ld+json">'.repeat(60_000) + '<meta property="og:title" '.repeat(60_000) + '<'.repeat(500_000)
  const t = Date.now()
  tagBlocks(hostile, 'script')
  metaContent(hostile, 'property', 'og:title')
  stripTags(hostile)
  assert.ok(Date.now() - t < 2000)
})

test('lê no máximo o teto de bytes', async () => {
  const text = await readTextCapped(new Response('a'.repeat(5000)), 1000)
  assert.equal(text.length, 1000)
})
