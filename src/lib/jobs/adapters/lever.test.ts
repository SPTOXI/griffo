import test from 'node:test'
import assert from 'node:assert/strict'
import { decideCollection } from '../collection'
import {
  createLeverAdapter,
  isoFromEpochMs,
  leverAdapters,
  parseLeverBoardSpec,
  parseLeverPayload,
} from './lever'

/**
 * O `payloadValido` é um recorte do payload REAL observado em 18/08/2026: os
 * nomes de campo, o `createdAt` em milissegundos e o `country` já em ISO2
 * vieram de lá, não de memória.
 */
const payloadValido = [
  {
    id: '33538a2f-d27d-4a96-8f05-fa4b0e4d940e',
    text: 'AbelsonTaylor Writer',
    hostedUrl: 'https://jobs.lever.co/leverdemo/33538a2f',
    applyUrl: 'https://jobs.lever.co/leverdemo/33538a2f/apply',
    createdAt: 1553186035299,
    country: 'US',
    workplaceType: 'hybrid',
    descriptionPlain: 'Escreve textos técnicos.',
    additionalPlain: 'Sobre a empresa.',
    categories: {
      commitment: 'Regular Full Time (Salary)',
      location: 'Arlington, TX',
      allLocations: ['Arlington, TX'],
      department: 'Customer Success',
    },
  },
  {
    id: 'segunda',
    text: 'Enfermeira',
    hostedUrl: 'https://jobs.lever.co/empresa/segunda',
    country: 'BR',
    categories: { location: 'São Paulo' },
  },
]

const fakeFetch = (response: { ok?: boolean; status?: number; jsonValue?: unknown }): typeof fetch =>
  (async () =>
    ({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.jsonValue,
    }) as Response) as unknown as typeof fetch

test('converte o payload em vagas cruas', () => {
  const jobs = parseLeverPayload(payloadValido, 'Empresa X')
  assert.equal(jobs.length, 2)
  assert.equal(jobs[0].title, 'AbelsonTaylor Writer')
  assert.equal(jobs[0].sourceJobId, '33538a2f-d27d-4a96-8f05-fa4b0e4d940e')
})

test('o cargo vem de `text`, não de `title`', () => {
  // O campo tem nome diferente do Greenhouse. Ler `title` devolveria vazio e a
  // vaga seria descartada — a fonte pareceria não ter vaga nenhuma.
  const jobs = parseLeverPayload([{ text: 'Cargo', hostedUrl: 'u' }], 'X')
  assert.equal(jobs[0].title, 'Cargo')
})

test('prefere applyUrl, e cai para hostedUrl quando não há', () => {
  const jobs = parseLeverPayload(payloadValido, 'X')
  assert.match(jobs[0].applicationUrl!, /\/apply$/)
  assert.equal(jobs[1].applicationUrl, 'https://jobs.lever.co/empresa/segunda')
})

test('a data em milissegundos vira texto ISO', () => {
  // Passar o número adiante faria o normalizador ler um número onde espera
  // data — e vaga sem data some da priorização do Radar.
  const jobs = parseLeverPayload(payloadValido, 'X')
  assert.equal(jobs[0].publishedAt, '2019-03-21T16:33:55.299Z')
})

test('data ausente ou absurda vira nulo, não uma data qualquer', () => {
  assert.equal(isoFromEpochMs(undefined), null)
  assert.equal(isoFromEpochMs(0), null)
  assert.equal(isoFromEpochMs(-1), null)
  assert.equal(isoFromEpochMs('1553186035299'), null)
  assert.equal(isoFromEpochMs(Number.NaN), null)
  assert.equal(parseLeverPayload([{ text: 'T', hostedUrl: 'u' }], 'X')[0].publishedAt, null)
})

test('o país vem pronto, em ISO2', () => {
  // A vantagem sobre o Greenhouse: não há o que adivinhar do texto de local.
  const jobs = parseLeverPayload(payloadValido, 'X')
  assert.equal(jobs[0].country, 'US')
  assert.equal(jobs[1].country, 'BR')
})

test('as duas descrições entram juntas', () => {
  const jobs = parseLeverPayload(payloadValido, 'X')
  assert.match(jobs[0].description!, /Escreve textos técnicos/)
  assert.match(jobs[0].description!, /Sobre a empresa/)
})

test('sem descrição nenhuma, o campo é nulo — não string vazia', () => {
  const jobs = parseLeverPayload([{ text: 'T', hostedUrl: 'u' }], 'X')
  assert.equal(jobs[0].description, null)
})

test('vaga sem cargo ou sem URL é descartada', () => {
  assert.equal(parseLeverPayload([{ text: '', hostedUrl: 'u' }, { text: 'T' }], 'X').length, 0)
})

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseLeverPayload(null, 'X'), [])
  assert.deepEqual(parseLeverPayload({ postings: [] }, 'X'), [])
  assert.deepEqual(parseLeverPayload('texto', 'X'), [])
})

test('coleta bem-sucedida é declarada completa', async () => {
  const adapter = createLeverAdapter({
    boardToken: 'empresa',
    companyName: 'Empresa X',
    fetchImpl: fakeFetch({ jsonValue: payloadValido }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 2)
})

test('HTTP ruim é falha, NÃO "board sem vagas"', async () => {
  const adapter = createLeverAdapter({
    boardToken: 'nubank',
    companyName: 'Nubank',
    fetchImpl: fakeFetch({ ok: false, status: 404 }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 404/)
})

test('200 com objeto em vez de lista é FALHA, não zero vagas', async () => {
  // Erro embrulhado em 200. Tratar como coleta vazia apagaria as vagas da
  // empresa — o engano que o §12 existe para conter.
  const adapter = createLeverAdapter({
    boardToken: 'empresa',
    companyName: 'Empresa X',
    fetchImpl: fakeFetch({ jsonValue: { error: 'algo' } }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /não veio como lista/)
})

test('§12: board que responde 404 não fecha vaga nenhuma', async () => {
  const adapter = createLeverAdapter({
    boardToken: 'naoexiste',
    companyName: 'X',
    fetchImpl: fakeFetch({ ok: false, status: 404 }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  const decision = decideCollection({
    outcome: result.outcome,
    seenKeys: [],
    previouslyOpenKeys: ['a', 'b'],
    error: result.error,
  })

  assert.deepEqual(decision.keysToClose, [])
  assert.equal(decision.reliable, false)
})

test('sem nome declarado, o token vira o nome da empresa', async () => {
  // `company` é obrigatório na normalização. Vazio, as vagas seriam descartadas
  // uma a uma e a coleta terminaria "bem-sucedida" com zero resultados.
  const adapter = createLeverAdapter({
    boardToken: 'minhaempresa',
    companyName: '',
    fetchImpl: fakeFetch({ jsonValue: payloadValido }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.jobs[0].company, 'minhaempresa')
})

test('a lista de boards sai da variável de ambiente', () => {
  assert.deepEqual(parseLeverBoardSpec('empresa:Empresa X, outra:Outra'), [
    { token: 'empresa', company: 'Empresa X' },
    { token: 'outra', company: 'Outra' },
  ])
})

test('entrada malformada é descartada, e repetida entra uma vez', () => {
  assert.deepEqual(parseLeverBoardSpec(' , /../etc:Ruim, ok:Bom, OK:Repetida'), [
    { token: 'ok', company: 'Bom' },
  ])
  assert.deepEqual(parseLeverBoardSpec(null), [])
})

test('sem variável de ambiente, nenhuma fonte do Lever roda', () => {
  // A lista conferida está vazia de propósito: `leverdemo` é board de
  // demonstração, e alimentar o Radar com vaga de mentira é pior que silêncio.
  assert.deepEqual(leverAdapters(undefined), [])
  assert.deepEqual(leverAdapters(''), [])
})

test('cada board vira uma fonte com slug próprio', () => {
  const slugs = leverAdapters('a:A,b:B').map((x) => x.descriptor.slug)
  assert.deepEqual(slugs, ['lever:a', 'lever:b'])
})

test('a fonte não declara mercado fixo', () => {
  // Cada board declara o país das SUAS vagas em `country`. Uma lista fixa aqui
  // esconderia vagas de um mercado que aquele board atende.
  const [adapter] = leverAdapters('x:X')
  assert.deepEqual(adapter.descriptor.markets, [])
})
