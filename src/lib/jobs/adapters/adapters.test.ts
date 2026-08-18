import test from 'node:test'
import assert from 'node:assert/strict'
import { safeCollect, sourceservesMarkets } from '../adapter'
import { decideCollection } from '../collection'
import {
  GREENHOUSE_DESCRIPTOR,
  VERIFIED_BOARDS,
  createGreenhouseAdapter,
  greenhouseAdapters,
  parseBoardSpec,
  parseGreenhousePayload,
} from './greenhouse'
import type { JobSourceAdapter } from '../adapter'

/**
 * Estes testes exercitam a CONVERSÃO e o TRATAMENTO DE ERRO dos adapters, com
 * `fetch` injetado. Que a API do Greenhouse responde neste formato foi
 * conferido à mão contra o board real — o registro dessa conferência, e o que
 * ela não cobre, está no cabeçalho de `greenhouse.ts`.
 *
 * O `payloadValido` abaixo é um recorte do payload REAL observado, e não uma
 * invenção: os nomes de campo, o escapamento do `content` e a convivência de
 * `first_published` com `updated_at` vieram de lá.
 */

const payloadValido = {
  jobs: [
    {
      id: 4001,
      title: 'Data Analyst',
      absolute_url: 'https://boards.greenhouse.io/empresa/jobs/4001',
      updated_at: '2026-08-13T17:38:18-04:00',
      first_published: '2026-08-06T12:50:10-04:00',
      company_name: 'Empresa do Payload',
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

test('a data usada é a de publicação, não a da última edição', () => {
  // `updated_at` faria uma vaga antiga reeditada parecer recém-publicada. Como
  // o Radar prioriza vaga nova, ela furaria a fila a cada edição do anúncio.
  const jobs = parseGreenhousePayload(payloadValido, 'Empresa X')
  assert.equal(jobs[0].publishedAt, '2026-08-06T12:50:10-04:00')
})

test('sem `first_published`, cai para `updated_at`', () => {
  // Nem todo board preenche. Uma data aproximada é melhor que nenhuma.
  const jobs = parseGreenhousePayload(
    { jobs: [{ id: 9, title: 'T', absolute_url: 'u', updated_at: '2026-01-01T00:00:00Z' }] },
    'Empresa X'
  )
  assert.equal(jobs[0].publishedAt, '2026-01-01T00:00:00Z')
})

test('sem data nenhuma, publishedAt é nulo — não é hoje', () => {
  const jobs = parseGreenhousePayload({ jobs: [{ id: 9, title: 'T', absolute_url: 'u' }] }, 'X')
  assert.equal(jobs[0].publishedAt, null)
})

test('o nome configurado vence o do payload', () => {
  const jobs = parseGreenhousePayload(payloadValido, 'Empresa X')
  assert.equal(jobs[0].company, 'Empresa X')
})

test('sem nome configurado, usa o `company_name` do payload', () => {
  const jobs = parseGreenhousePayload(payloadValido, '')
  assert.equal(jobs[0].company, 'Empresa do Payload')
})

test('a lista de boards sai da variável de ambiente', () => {
  const boards = parseBoardSpec('vercel:Vercel, stripe:Stripe')
  assert.deepEqual(boards, [
    { token: 'vercel', company: 'Vercel' },
    { token: 'stripe', company: 'Stripe' },
  ])
})

test('token sem nome é aceito; o nome vem do payload', () => {
  assert.deepEqual(parseBoardSpec('vercel'), [{ token: 'vercel', company: '' }])
})

test('entrada malformada é descartada, nunca adivinhada', () => {
  // Um token remendado a partir de lixo viraria uma fonte que falha toda
  // rodada, gastando o orçamento de tempo das fontes que funcionam.
  assert.deepEqual(parseBoardSpec('  , :Sem Token, /../etc:Ruim, ok:Bom'), [
    { token: 'ok', company: 'Bom' },
  ])
  assert.deepEqual(parseBoardSpec(''), [])
  assert.deepEqual(parseBoardSpec(null), [])
  assert.deepEqual(parseBoardSpec(undefined), [])
})

test('board repetido entra uma vez só', () => {
  // Duas entradas para o mesmo board coletariam as mesmas vagas duas vezes.
  assert.deepEqual(parseBoardSpec('vercel:Vercel,VERCEL:Outro'), [
    { token: 'vercel', company: 'Vercel' },
  ])
})

test('sem variável de ambiente, valem os boards conferidos', () => {
  const adapters = greenhouseAdapters(undefined)
  assert.equal(adapters.length, VERIFIED_BOARDS.length)
  assert.ok(adapters.length > 0, 'a lista conferida não pode estar vazia')
  assert.match(adapters[0].descriptor.slug, /^greenhouse:/)
})

test('a variável SUBSTITUI a lista conferida, não soma a ela', () => {
  // Quem declara os boards está dizendo quais quer; receber junto um que não
  // pediu seria surpresa.
  const adapters = greenhouseAdapters('outra-empresa:Outra')
  assert.equal(adapters.length, 1)
  assert.equal(adapters[0].descriptor.slug, 'greenhouse:outra-empresa')
})

test('cada board vira uma fonte com slug próprio', () => {
  // Slugs iguais fariam duas fontes compartilharem o mesmo estado de coleta —
  // e o §12 decide fechamento a partir desse estado.
  const adapters = greenhouseAdapters('a:A,b:B')
  const slugs = adapters.map((x) => x.descriptor.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})
