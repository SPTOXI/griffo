import test from 'node:test'
import assert from 'node:assert/strict'
import { safeCollect, sourceservesMarkets } from '../adapter'
import { decideCollection } from '../collection'
import { GREENHOUSE_DESCRIPTOR, createGreenhouseAdapter, parseGreenhousePayload } from './greenhouse'
import type { JobSourceAdapter } from '../adapter'

/**
 * Estes testes exercitam a CONVERSÃO e o TRATAMENTO DE ERRO dos adapters, com
 * `fetch` injetado. Eles não verificam que a API do Greenhouse responde no
 * formato esperado — isso exige rede, e está declarado como pendência no
 * cabeçalho de `greenhouse.ts`.
 */

const payloadValido = {
  jobs: [
    {
      id: 4001,
      title: 'Data Analyst',
      absolute_url: 'https://boards.greenhouse.io/empresa/jobs/4001',
      updated_at: '2026-08-01T10:00:00Z',
      location: { name: 'Remote - US' },
      content: '&lt;p&gt;Trabalhe com &amp;lt;dados&amp;gt;&lt;/p&gt;',
    },
    {
      id: 4002,
      title: 'Backend Engineer',
      absolute_url: 'https://boards.greenhouse.io/empresa/jobs/4002',
      location: { name: 'São Paulo, Brazil' },
    },
  ],
}

const fakeFetch = (response: Partial<Response> & { jsonValue?: unknown }): typeof fetch =>
  (async () =>
    ({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.jsonValue ?? {},
    }) as Response) as unknown as typeof fetch

test('converte o payload do board em vagas cruas', () => {
  const jobs = parseGreenhousePayload(payloadValido, 'Empresa X')
  assert.equal(jobs.length, 2)
  assert.equal(jobs[0].title, 'Data Analyst')
  assert.equal(jobs[0].sourceJobId, '4001')
  assert.equal(jobs[0].company, 'Empresa X')
  assert.equal(jobs[0].location, 'Remote - US')
})

test('vaga sem título ou sem URL é descartada na conversão', () => {
  const jobs = parseGreenhousePayload(
    { jobs: [{ id: 1, title: '', absolute_url: 'x' }, { id: 2, title: 'Ok' }] },
    'Empresa X'
  )
  assert.equal(jobs.length, 0)
})

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseGreenhousePayload(null, 'X'), [])
  assert.deepEqual(parseGreenhousePayload({ jobs: 'não é array' }, 'X'), [])
  assert.deepEqual(parseGreenhousePayload({}, 'X'), [])
})

test('o HTML da descrição é limpo e as entidades desfeitas', () => {
  const jobs = parseGreenhousePayload(payloadValido, 'Empresa X')
  assert.ok(!jobs[0].description?.includes('<'), 'sobrou marcação HTML')
  assert.ok(!jobs[0].description?.includes('&amp;'), 'sobrou entidade escapada')
})

test('a localização vai como texto livre, sem adivinhar país', () => {
  // Adivinhar país errado é pior que não adivinhar: quem sabe fazer isso é o
  // normalizador, com contexto de mercado.
  const jobs = parseGreenhousePayload(payloadValido, 'Empresa X')
  assert.equal(jobs[1].location, 'São Paulo, Brazil')
  assert.equal(jobs[1].country, undefined)
})

test('coleta bem-sucedida é declarada completa', async () => {
  const adapter = createGreenhouseAdapter({
    boardToken: 'empresa',
    companyName: 'Empresa X',
    fetchImpl: fakeFetch({ jsonValue: payloadValido }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 2)
})

test('HTTP ruim é falha, NÃO "board sem vagas"', async () => {
  // Confundir os dois é exatamente o que o §12 proíbe: um 500 viraria coleta
  // vazia e apagaria as vagas da empresa.
  const adapter = createGreenhouseAdapter({
    boardToken: 'empresa',
    companyName: 'Empresa X',
    fetchImpl: fakeFetch({ ok: false, status: 500 }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'failed')
  assert.equal(result.jobs.length, 0)
  assert.match(result.error!, /HTTP 500/)
})

test('§12: uma coleta falha do adapter não fecha vaga nenhuma', async () => {
  // O teste que liga as duas metades: adapter reporta falha, decisor não fecha.
  const adapter = createGreenhouseAdapter({
    boardToken: 'empresa',
    companyName: 'Empresa X',
    fetchImpl: fakeFetch({ ok: false, status: 503 }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  const decision = decideCollection({
    outcome: result.outcome,
    seenKeys: [],
    previouslyOpenKeys: ['vaga-a', 'vaga-b'],
    error: result.error,
  })

  assert.deepEqual(decision.keysToClose, [])
  assert.equal(decision.reliable, false)
})

test('adapter que lança é contido, e a rodada continua', async () => {
  // Um adapter defeituoso não pode derrubar a rodada inteira do Radar.
  const quebrado: JobSourceAdapter = {
    descriptor: GREENHOUSE_DESCRIPTOR,
    async collect() {
      throw new Error('estourou')
    },
  }

  const result = await safeCollect(quebrado, { timeBudgetMs: 1000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /estourou/)
})

test('a fonte declara os mercados que atende', () => {
  // "Não assumir que um ATS é globalmente dominante."
  assert.ok(sourceservesMarkets(GREENHOUSE_DESCRIPTOR, ['US']))
  assert.ok(sourceservesMarkets(GREENHOUSE_DESCRIPTOR, ['GLOBAL']))
  assert.ok(!sourceservesMarkets(GREENHOUSE_DESCRIPTOR, ['JP']))
})

test('usuário sem mercado declarado vê todas as fontes', () => {
  assert.ok(sourceservesMarkets(GREENHOUSE_DESCRIPTOR, []))
})

test('fonte global atende qualquer mercado', () => {
  const global = { ...GREENHOUSE_DESCRIPTOR, markets: [] }
  assert.ok(sourceservesMarkets(global, ['JP']))
})
