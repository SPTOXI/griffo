import { test } from 'node:test'
import assert from 'node:assert/strict'
import { atsFromUrl } from './from-url'
import { ATS_META } from './meta'

test('atsFromUrl reconhece pelo domínio do fornecedor e só por ele', () => {
  assert.equal(atsFromUrl('https://empresa.gupy.io/jobs/123'), 'gupy')
  assert.equal(atsFromUrl('https://boards.greenhouse.io/acme/jobs/1'), 'greenhouse')
  assert.equal(atsFromUrl('https://acme.wd5.myworkdayjobs.com/x'), 'workday')
  assert.equal(atsFromUrl('https://jobs.lever.co/acme/1'), 'lever')
  assert.equal(atsFromUrl('https://evilgupy.io/x'), null)
  assert.equal(atsFromUrl('https://careers.acme.com/1'), null)
  assert.equal(atsFromUrl('não é url'), null)
})

test('todo ATS reconhecido tem guia', async () => {
  const urls = ['https://a.gupy.io', 'https://boards.greenhouse.io', 'https://jobs.ashbyhq.com', 'https://x.applytojob.com']
  for (const u of urls) assert.ok(ATS_META[atsFromUrl(u)!], u)
})
