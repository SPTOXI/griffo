import test from 'node:test'
import assert from 'node:assert/strict'
import { decideCollection } from '../collection'
import { normalizeTerms } from '../search-terms'
import { GUPY_DESCRIPTOR, countryCodeFromName, createGupyAdapter, parseGupyPayload } from './gupy'

/**
 * O payload abaixo é recorte do REAL, observado em 18/08/2026: os nomes de
 * campo, o `country` por extenso em português e o bloco `pagination` vieram de
 * lá, não de memória.
 */
const pagina = (jobs: unknown[], total = jobs.length) => ({
  data: jobs,
  pagination: { total, limit: 100, offset: 0 },
})

const vaga = {
  id: 11831781,
  name: 'Biomédico/Bioquímico',
  description: 'Atuar em análises clínicas.',
  careerPageName: 'Vagas Grupo Sabin',
  careerPageUrl: 'https://gruposabin.gupy.io/abc',
  jobUrl: 'https://gruposabin.gupy.io/job/xyz?jobBoardSource=gupy_portal',
  type: 'vacancy_type_effective',
  publishedDate: '2026-08-18T14:42:16.831Z',
  isRemoteWork: false,
  city: 'Dourados',
  state: 'Mato Grosso do Sul',
  country: 'Brasil',
  workplaceType: 'on-site',
  skills: [],
}

const fakeFetch = (pages: unknown[]): typeof fetch => {
  let i = 0
  return (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => pages[Math.min(i++, pages.length - 1)],
    }) as Response) as unknown as typeof fetch
}

const failingFetch = (status: number): typeof fetch =>
  (async () => ({ ok: false, status, json: async () => ({}) }) as Response) as unknown as typeof fetch

test('converte o payload em vagas cruas', () => {
  const jobs = parseGupyPayload(pagina([vaga]))
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].title, 'Biomédico/Bioquímico')
  assert.equal(jobs[0].company, 'Vagas Grupo Sabin')
  assert.equal(jobs[0].sourceJobId, '11831781')
  assert.equal(jobs[0].city, 'Dourados')
  assert.equal(jobs[0].region, 'Mato Grosso do Sul')
})

test('o país por extenso vira ISO2', () => {
  // Guardar "Brasil" cru faria o filtro duro comparar "Brasil" com "BR" e
  // eliminar toda vaga brasileira de um perfil brasileiro.
  assert.equal(parseGupyPayload(pagina([vaga]))[0].country, 'BR')
  assert.equal(countryCodeFromName('Brasil'), 'BR')
  assert.equal(countryCodeFromName('brazil'), 'BR')
  assert.equal(countryCodeFromName('Portugal'), 'PT')
  assert.equal(countryCodeFromName('PT'), 'PT')
})

test('país desconhecido vira nulo, nunca um palpite', () => {
  // País errado é pior que país nenhum: o filtro duro age sobre ele.
  assert.equal(countryCodeFromName('Terra Média'), null)
  assert.equal(countryCodeFromName('ZZ'), null)
  assert.equal(countryCodeFromName(''), null)
  assert.equal(countryCodeFromName(undefined), null)
})

test('vaga remota é declarada remota', () => {
  const jobs = parseGupyPayload(pagina([{ ...vaga, isRemoteWork: true, workplaceType: 'on-site' }]))
  assert.equal(jobs[0].remoteType, 'remote')
})

test('vaga sem empresa é descartada', () => {
  // `company` é obrigatório na normalização; sem ele a vaga seria recusada
  // adiante de qualquer forma.
  assert.equal(parseGupyPayload(pagina([{ ...vaga, careerPageName: '' }])).length, 0)
})

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseGupyPayload(null), [])
  assert.deepEqual(parseGupyPayload({ data: 'não é lista' }), [])
  assert.deepEqual(parseGupyPayload([]), [])
})

test('a fonte declara que NÃO fecha vaga por ausência', () => {
  // É busca: a vaga pode ter caído fora do termo ou da ordenação e continuar
  // aberta. Fechar por ausência encerraria vaga viva a cada mudança de ranking.
  assert.equal(GUPY_DESCRIPTOR.closesByAbsence, false)
})

test('a fonte declara o mercado brasileiro', () => {
  assert.deepEqual(GUPY_DESCRIPTOR.markets, ['BR'])
})

test('o cabeçalho de acesso registra que é API interna', () => {
  // O §11 pede registro da decisão de acesso. Aqui ela tem risco, e o risco
  // precisa estar escrito onde quem mexer vai ler.
  assert.match(GUPY_DESCRIPTOR.accessNote, /INTERNA/)
})

test('sem termo nenhum, a coleta é vazia e bem-sucedida', async () => {
  // Nenhum termo é diferente de nenhuma vaga: não há falha a reportar.
  const adapter = createGupyAdapter({ terms: [], fetchImpl: failingFetch(500) })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 0)
})

test('coleta de um termo, numa página só, é completa', async () => {
  const adapter = createGupyAdapter({
    terms: ['biomédico'],
    fetchImpl: fakeFetch([pagina([vaga], 1)]),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 1)
})

test('paginação truncada pelo teto de páginas é PARCIAL', async () => {
  // O total diz 1000 e o teto deixa ler uma página. Dizer "completa" faria o
  // §12 acreditar num retrato que não existe.
  const adapter = createGupyAdapter({
    terms: ['x'],
    maxPagesPerTerm: 1,
    fetchImpl: fakeFetch([pagina([vaga], 1000)]),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'partial')
})

test('HTTP ruim num termo é falha, não "sem vaga para essa palavra"', async () => {
  const adapter = createGupyAdapter({ terms: ['x'], fetchImpl: failingFetch(503) })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 503/)
})

test('um termo falha e outro funciona: parcial, não falha total', async () => {
  let call = 0
  const mixed = (async () => {
    call++
    return call === 1
      ? ({ ok: false, status: 500, json: async () => ({}) } as Response)
      : ({ ok: true, status: 200, json: async () => pagina([vaga], 1) } as Response)
  }) as unknown as typeof fetch

  const adapter = createGupyAdapter({ terms: ['ruim', 'bom'], fetchImpl: mixed })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'partial')
  assert.equal(result.jobs.length, 1)
})

test('§12: coleta parcial da Gupy não fecha vaga nenhuma', async () => {
  const adapter = createGupyAdapter({ terms: ['x'], fetchImpl: failingFetch(500) })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  const decision = decideCollection({
    outcome: result.outcome,
    seenKeys: [],
    previouslyOpenKeys: ['a', 'b'],
    error: result.error,
  })

  assert.deepEqual(decision.keysToClose, [])
})

// --- termos de busca vindos da orientação ---

test('os termos saem dos cargos-alvo, ordenados por quantas pessoas os querem', () => {
  const termos = normalizeTerms(
    [
      JSON.stringify(['Enfermeiro', 'Coordenação de Enfermagem']),
      JSON.stringify(['enfermeiro']),
      JSON.stringify(['Enfermeiro', 'Analista de Dados']),
    ],
    10
  )
  assert.equal(termos[0], 'Enfermeiro')
  assert.equal(termos.length, 3)
})

test('o mesmo cargo repetido por UMA pessoa não vale por dois', () => {
  // O desempate é quantas pessoas querem, não quantas vezes está escrito.
  const termos = normalizeTerms(
    [JSON.stringify(['Enfermeiro', 'enfermeiro', 'ENFERMEIRO']), JSON.stringify(['Analista', 'Analista'])],
    10
  )
  assert.deepEqual(termos.sort(), ['Analista', 'Enfermeiro'])
})

test('termo curto ou longo demais é descartado', () => {
  const termos = normalizeTerms([JSON.stringify(['TI', 'ok', 'Enfermeiro', 'x'.repeat(200)])], 10)
  assert.deepEqual(termos, ['Enfermeiro'])
})

test('perfil com JSON corrompido não derruba os demais', () => {
  const termos = normalizeTerms(['{quebrado', JSON.stringify(['Enfermeiro'])], 10)
  assert.deepEqual(termos, ['Enfermeiro'])
})

test('o teto de termos é respeitado', () => {
  const termos = normalizeTerms([JSON.stringify(['aaa', 'bbb', 'ccc', 'ddd'])], 2)
  assert.equal(termos.length, 2)
})

test('sem perfil nenhum, não há termo — e isso não é erro', () => {
  assert.deepEqual(normalizeTerms([], 5), [])
  assert.deepEqual(normalizeTerms([null, undefined, '[]'], 5), [])
})
