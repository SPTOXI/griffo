import test from 'node:test'
import assert from 'node:assert/strict'
import { submitUrlsToIndexNow } from './indexnow'

test('envia host, key, keyLocation e a lista de URLs no corpo', async () => {
  let capturedUrl = ''
  let capturedInit: RequestInit | undefined
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url)
    capturedInit = init
    return new Response('', { status: 200 })
  }) as typeof fetch

  const result = await submitUrlsToIndexNow(['https://griffo.work/br'], fakeFetch)

  assert.equal(capturedUrl, 'https://api.indexnow.org/indexnow')
  const body = JSON.parse(String(capturedInit?.body))
  assert.equal(body.host, 'griffo.work')
  assert.equal(body.key, '5aa728fe6a274c0d8fb10530a78312fa')
  assert.equal(body.keyLocation, 'https://griffo.work/5aa728fe6a274c0d8fb10530a78312fa.txt')
  assert.deepEqual(body.urlList, ['https://griffo.work/br'])
  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
})

test('devolve ok=false e o status quando o motor de busca recusa', async () => {
  const fakeFetch = (async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response('key not found', { status: 403 })) as typeof fetch

  const result = await submitUrlsToIndexNow(['https://griffo.work/br'], fakeFetch)

  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
  assert.equal(result.body, 'key not found')
})
