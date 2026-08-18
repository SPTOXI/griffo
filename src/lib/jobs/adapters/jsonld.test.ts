import test from 'node:test'
import assert from 'node:assert/strict'
import {
  JSONLD_DESCRIPTOR,
  careerPageAdapters,
  createCareerPageAdapter,
  extractJobPostings,
  jobPostingToRaw,
  parseCareerPageSpec,
} from './jsonld'

const vaga = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'Enfermeiro Assistencial',
  identifier: 'VG-9182',
  url: 'https://empresa.com.br/vagas/9182',
  datePosted: '2026-08-10',
  employmentType: 'FULL_TIME',
  description: '<p>Atuar em <b>UTI</b> adulto.</p>',
  hiringOrganization: { '@type': 'Organization', name: 'Hospital Exemplo' },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Campinas',
      addressRegion: 'São Paulo',
      addressCountry: 'BR',
    },
  },
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'BRL',
    value: { '@type': 'QuantitativeValue', minValue: 5000, maxValue: 7000, unitText: 'MONTH' },
  },
}

const pagina = (...blocos: unknown[]) =>
  `<html><head>${blocos
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('')}</head><body>oi</body></html>`

const fakeFetch = (html: string, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, text: async () => html }) as Response) as unknown as typeof fetch

test('acha a vaga no bloco JSON-LD', () => {
  const found = extractJobPostings(pagina(vaga))
  assert.equal(found.length, 1)
  assert.equal(found[0].title, 'Enfermeiro Assistencial')
})

test('acha a vaga embrulhada em @graph', () => {
  // Variação comum no mundo real que quebraria um parser ingênuo.
  const found = extractJobPostings(pagina({ '@context': 'x', '@graph': [{ '@type': 'WebSite' }, vaga] }))
  assert.equal(found.length, 1)
})

test('acha várias vagas em blocos separados', () => {
  const found = extractJobPostings(pagina(vaga, { ...vaga, title: 'Outra' }))
  assert.equal(found.length, 2)
})

test('acha vaga quando o bloco é um array', () => {
  const found = extractJobPostings(pagina([{ '@type': 'Organization' }, vaga]))
  assert.equal(found.length, 1)
})

test('@type como lista também conta', () => {
  const found = extractJobPostings(pagina({ ...vaga, '@type': ['JobPosting', 'Thing'] }))
  assert.equal(found.length, 1)
})

test('bloco quebrado não derruba os bons', () => {
  const html = `<script type="application/ld+json">{quebrado</script>${pagina(vaga)}`
  assert.equal(extractJobPostings(html).length, 1)
})

test('página sem JSON-LD devolve lista vazia', () => {
  assert.deepEqual(extractJobPostings('<html><body>nada</body></html>'), [])
  assert.deepEqual(extractJobPostings(''), [])
  assert.deepEqual(extractJobPostings(null as any), [])
})

test('converte a vaga com todos os campos', () => {
  const raw = jobPostingToRaw(vaga, { pageUrl: 'https://empresa.com.br/vagas' })!
  assert.equal(raw.title, 'Enfermeiro Assistencial')
  assert.equal(raw.company, 'Hospital Exemplo')
  assert.equal(raw.applicationUrl, 'https://empresa.com.br/vagas/9182')
  assert.equal(raw.sourceJobId, 'VG-9182')
  assert.equal(raw.city, 'Campinas')
  assert.equal(raw.region, 'São Paulo')
  assert.equal(raw.country, 'BR')
  assert.equal(raw.publishedAt, '2026-08-10')
  assert.equal(raw.salaryMin, 5000)
  assert.equal(raw.salaryMax, 7000)
  assert.equal(raw.currency, 'BRL')
  assert.equal(raw.salaryPeriod, 'MONTH')
})

test('a marcação da descrição é removida', () => {
  const raw = jobPostingToRaw(vaga, { pageUrl: 'x' })!
  assert.equal(raw.description, 'Atuar em UTI adulto.')
})

test('TELECOMMUTE vira remoto', () => {
  const raw = jobPostingToRaw({ ...vaga, jobLocationType: 'TELECOMMUTE' }, { pageUrl: 'x' })!
  assert.equal(raw.remoteType, 'remote')
})

test('sem URL própria, usa a página de origem', () => {
  const { url, ...semUrl } = vaga
  const raw = jobPostingToRaw(semUrl, { pageUrl: 'https://empresa.com.br/vagas' })!
  assert.equal(raw.applicationUrl, 'https://empresa.com.br/vagas')
})

test('sem empresa na página, usa a configurada', () => {
  const { hiringOrganization, ...semOrg } = vaga
  const raw = jobPostingToRaw(semOrg, { pageUrl: 'x', company: 'Configurada' })!
  assert.equal(raw.company, 'Configurada')
})

test('sem título ou sem empresa, a vaga é recusada', () => {
  const { title, ...semTitulo } = vaga
  assert.equal(jobPostingToRaw(semTitulo, { pageUrl: 'x' }), null)

  const { hiringOrganization, ...semOrg } = vaga
  assert.equal(jobPostingToRaw(semOrg, { pageUrl: 'x' }), null)
})

test('salário zero ou negativo é ignorado, não gravado', () => {
  // Zero num anúncio é campo não preenchido, não uma vaga que paga nada.
  const raw = jobPostingToRaw(
    { ...vaga, baseSalary: { value: { minValue: 0, maxValue: -5 } } },
    { pageUrl: 'x' }
  )!
  assert.equal(raw.salaryMin, null)
  assert.equal(raw.salaryMax, null)
})

test('coleta de uma página é completa', async () => {
  const adapter = createCareerPageAdapter({
    pages: [{ url: 'https://empresa.com.br/vagas' }],
    fetchImpl: fakeFetch(pagina(vaga)),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 1)
})

test('todas as páginas falhando é FALHA, não "ninguém está contratando"', async () => {
  const adapter = createCareerPageAdapter({
    pages: [{ url: 'https://a.com' }],
    fetchImpl: fakeFetch('', false, 500),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 500/)
})

test('página sem vaga nenhuma é coleta completa, não falha', async () => {
  // A empresa pode simplesmente não estar contratando. Isso é informação, não erro.
  const adapter = createCareerPageAdapter({
    pages: [{ url: 'https://a.com' }],
    fetchImpl: fakeFetch('<html>sem vagas</html>'),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 0)
})

test('esta fonte FECHA por ausência, ao contrário da Gupy', () => {
  // Cada página é lida por inteiro: se a vaga saiu da página de carreiras da
  // empresa, ela saiu de verdade.
  assert.notEqual(JSONLD_DESCRIPTOR.closesByAbsence, false)
})

test('só http(s) é aceito na configuração', () => {
  // Uma entrada malformada viraria requisição a `file://` ou a host interno,
  // feita pelo servidor em nome de quem escreveu a variável.
  assert.deepEqual(parseCareerPageSpec('file:///etc/passwd,http://localhost:9/x|A'), [
    { url: 'http://localhost:9/x', company: 'A' },
  ])
  assert.deepEqual(parseCareerPageSpec('não é url'), [])
  assert.deepEqual(parseCareerPageSpec(null), [])
})

test('o separador é a barra, porque toda URL já tem dois-pontos', () => {
  assert.deepEqual(parseCareerPageSpec('https://a.com/vagas|Empresa A'), [
    { url: 'https://a.com/vagas', company: 'Empresa A' },
  ])
})

test('página repetida entra uma vez só', () => {
  const pages = parseCareerPageSpec('https://a.com|A,https://A.com|B')
  assert.equal(pages.length, 1)
})

test('sem variável, nenhuma fonte de página de carreira roda', () => {
  assert.deepEqual(careerPageAdapters(undefined), [])
  assert.deepEqual(careerPageAdapters(''), [])
})
