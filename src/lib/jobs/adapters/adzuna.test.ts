import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ADZUNA_DESCRIPTOR,
  adzunaCredentials,
  createAdzunaAdapter,
  parseAdzunaPayload,
  salaryIsPredicted,
} from './adzuna'

/**
 * Recorte do payload REAL observado em 18/08/2026: a hierarquia em
 * `location.area`, o `salary_is_predicted` como texto e o `redirect_url` da
 * própria Adzuna vieram de lá.
 */
const vaga = {
  id: '5819746215',
  title: 'Enfermeiro(a)',
  created: '2026-07-29T08:50:56Z',
  redirect_url: 'https://www.adzuna.com.br/land/ad/5819746215?se=abc',
  salary_is_predicted: '0',
  company: { display_name: 'Hospital Pequeno Principe' },
  location: { display_name: 'Curitiba, Paraná', area: ['Brasil', 'Sul', 'Paraná', 'Curitiba'] },
  category: { label: 'Unknown', tag: 'unknown' },
  description: 'Atuar na assistência.',
}

const pagina = (results: unknown[]) => ({ count: results.length, results })

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

const creds = { appId: 'id', appKey: 'key' }

test('converte o payload em vagas cruas', () => {
  const jobs = parseAdzunaPayload(pagina([vaga]))
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].title, 'Enfermeiro(a)')
  assert.equal(jobs[0].company, 'Hospital Pequeno Principe')
  assert.equal(jobs[0].sourceJobId, '5819746215')
  assert.equal(jobs[0].publishedAt, '2026-07-29T08:50:56Z')
})

test('o país sai do primeiro item da hierarquia, e vira ISO2', () => {
  const jobs = parseAdzunaPayload(pagina([vaga]))
  assert.equal(jobs[0].country, 'BR')
  assert.equal(jobs[0].region, 'Paraná')
  assert.equal(jobs[0].city, 'Curitiba')
})

test('SALÁRIO ESTIMADO É DESCARTADO', () => {
  // `salary_is_predicted: "1"` significa que a Adzuna chutou. Gravar isso poria
  // no produto um número que ninguém prometeu, e o usuário o leria como
  // promessa.
  const jobs = parseAdzunaPayload(
    pagina([{ ...vaga, salary_is_predicted: '1', salary_min: 3000, salary_max: 5000 }])
  )
  assert.equal(jobs[0].salaryMin, null)
  assert.equal(jobs[0].salaryMax, null)
})

test('salário informado de verdade é mantido', () => {
  const jobs = parseAdzunaPayload(
    pagina([{ ...vaga, salary_is_predicted: '0', salary_min: 3000, salary_max: 5000 }])
  )
  assert.equal(jobs[0].salaryMin, 3000)
  assert.equal(jobs[0].salaryMax, 5000)
})

test('a estimativa é reconhecida em qualquer forma de "1"', () => {
  assert.ok(salaryIsPredicted('1'))
  assert.ok(salaryIsPredicted(1))
  assert.ok(salaryIsPredicted(true))
  assert.ok(!salaryIsPredicted('0'))
  assert.ok(!salaryIsPredicted(0))
  assert.ok(!salaryIsPredicted(undefined))
})

test('vaga sem empresa, título ou URL é descartada', () => {
  assert.equal(parseAdzunaPayload(pagina([{ ...vaga, company: {} }])).length, 0)
  assert.equal(parseAdzunaPayload(pagina([{ ...vaga, title: '' }])).length, 0)
  assert.equal(parseAdzunaPayload(pagina([{ ...vaga, redirect_url: '' }])).length, 0)
})

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseAdzunaPayload(null), [])
  assert.deepEqual(parseAdzunaPayload({ results: 'não é lista' }), [])
  assert.deepEqual(parseAdzunaPayload({}), [])
})

test('país fora da lista vira nulo, nunca palpite', () => {
  const jobs = parseAdzunaPayload(pagina([{ ...vaga, location: { area: ['Terra Média', 'X'] } }]))
  assert.equal(jobs[0].country, null)
})

test('coleta de um termo, numa página, é completa', async () => {
  const adapter = createAdzunaAdapter({
    credentials: creds,
    country: 'br',
    terms: ['enfermeiro'],
    fetchImpl: fakeFetch(pagina([vaga])),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 1)
})

test('200 com `exception` é FALHA, não mercado vazio', async () => {
  // A Adzuna responde 200 com exception quando a credencial não vale. Ler isso
  // como "nenhuma vaga" faria uma chave expirada parecer um mercado sem vagas.
  const adapter = createAdzunaAdapter({
    credentials: creds,
    country: 'br',
    terms: ['x'],
    fetchImpl: fakeFetch({ exception: 'AUTH_FAIL', display: 'Authorisation failed' }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /AUTH_FAIL/)
})

test('HTTP ruim é falha', async () => {
  const adapter = createAdzunaAdapter({
    credentials: creds,
    country: 'br',
    terms: ['x'],
    fetchImpl: fakeFetch({}, false, 429),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 429/)
})

test('sem termo, coleta vazia e bem-sucedida', async () => {
  const adapter = createAdzunaAdapter({
    credentials: creds,
    country: 'br',
    terms: [],
    fetchImpl: fakeFetch({}, false, 500),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
})

test('a fonte NÃO fecha vaga por ausência', () => {
  // É busca, como a Gupy: sair do resultado não é prova de encerramento.
  assert.equal(ADZUNA_DESCRIPTOR.closesByAbsence, false)
})

test('o slug carrega o país, para cada instância ter estado próprio', () => {
  const br = createAdzunaAdapter({ credentials: creds, country: 'BR', terms: [] })
  const gb = createAdzunaAdapter({ credentials: creds, country: 'gb', terms: [] })
  assert.equal(br.descriptor.slug, 'adzuna:br')
  assert.equal(gb.descriptor.slug, 'adzuna:gb')
})

test('meia credencial é credencial nenhuma', () => {
  // Metade produziria uma fonte que falha toda rodada com erro de autenticação,
  // gastando o orçamento de tempo das fontes que funcionam.
  assert.equal(adzunaCredentials('id', undefined), null)
  assert.equal(adzunaCredentials(undefined, 'key'), null)
  assert.equal(adzunaCredentials('  ', 'key'), null)
  assert.deepEqual(adzunaCredentials('id', 'key'), { appId: 'id', appKey: 'key' })
})

test('as credenciais não vazam para o slug nem para o nome da fonte', () => {
  // O slug vai para o banco e o nome aparece em log e diagnóstico.
  const adapter = createAdzunaAdapter({ credentials: { appId: 'segredo-id', appKey: 'segredo-key' }, country: 'br', terms: [] })
  assert.ok(!adapter.descriptor.slug.includes('segredo'))
  assert.ok(!adapter.descriptor.name.includes('segredo'))
})
