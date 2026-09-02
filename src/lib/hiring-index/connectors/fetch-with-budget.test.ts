import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchJsonWithBudget } from './fetch-with-budget'

function fakeFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  return (async () => response as Response) as unknown as typeof fetch
}

test('fetchJsonWithBudget: resposta ok devolve o JSON', async () => {
  const result = await fetchJsonWithBudget('https://example.com', {
    timeBudgetMs: 5000,
    sourceName: 'Teste',
    fetchImpl: fakeFetch({ ok: true, json: async () => ({ a: 1 }) }),
  })
  assert.deepEqual(result, { ok: true, json: { a: 1 } })
})

test('fetchJsonWithBudget: HTTP não-ok vira falha com o nome da fonte na mensagem', async () => {
  const result = await fetchJsonWithBudget('https://example.com', {
    timeBudgetMs: 5000,
    sourceName: 'BLS',
    fetchImpl: fakeFetch({ ok: false, status: 500, json: async () => ({}) }),
  })
  assert.deepEqual(result, { ok: false, error: 'HTTP 500 no BLS' })
})

test('fetchJsonWithBudget: abort (timeout) vira mensagem de tempo esgotado com o nome da fonte', async () => {
  const timingOut: typeof fetch = (async (_url, init) => {
    return new Promise((_resolve, reject) => {
      const signal = (init as RequestInit | undefined)?.signal
      signal?.addEventListener('abort', () => {
        const err = new Error('aborted')
        err.name = 'AbortError'
        reject(err)
      })
    }) as Promise<Response>
  }) as typeof fetch

  const result = await fetchJsonWithBudget('https://example.com', {
    timeBudgetMs: 1000,
    sourceName: 'Eurostat',
    fetchImpl: timingOut,
  })
  assert.deepEqual(result, { ok: false, error: 'Tempo esgotado no Eurostat' })
})

test('fetchJsonWithBudget: repassa method/headers/body, mas nunca deixa o chamador sobrescrever o signal', async () => {
  let capturedInit: RequestInit | undefined
  const spy: typeof fetch = (async (_url, init) => {
    capturedInit = init as RequestInit
    return { ok: true, json: async () => ({}) } as Response
  }) as typeof fetch

  await fetchJsonWithBudget('https://example.com', {
    timeBudgetMs: 5000,
    sourceName: 'Teste',
    fetchImpl: spy,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
  })

  assert.equal(capturedInit?.method, 'POST')
  assert.equal((capturedInit?.headers as Record<string, string>)?.['Content-Type'], 'application/json')
  assert.equal(capturedInit?.body, '{}')
  assert.ok(capturedInit?.signal instanceof AbortSignal)
})
