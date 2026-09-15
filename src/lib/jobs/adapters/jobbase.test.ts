import test from 'node:test'
import assert from 'node:assert/strict'
import { decideCollection } from '../collection'
import {
  createJobBaseAdapter,
  jobBaseAdapters,
  jobBaseCredentials,
  parseJobBasePayload,
} from './jobbase'

/**
 * Recorte do formato de `job_postings` do JobBase conforme descrito pelo
 * operador: `company_name_raw` já vem na própria linha (sem join com
 * `companies`), `country_code` em ISO2, `work_mode` em
 * onsite/hybrid/remote/unknown.
 */
const payloadValido = [
  {
    company_name_raw: 'Empresa X',
    source: 'greenhouse',
    external_id: '4001',
    source_url: 'https://boards.greenhouse.io/empresax/jobs/4001',
    title: 'Engenheira Backend',
    country_code: 'BR',
    region: 'SP',
    city: 'São Paulo',
    work_mode: 'hybrid',
    salary_min: 8000,
    salary_max: 12000,
    salary_currency: 'BRL',
    posted_at: '2026-08-10T12:00:00Z',
    first_seen_at: '2026-08-11T03:00:00Z',
  },
  {
    company_name_raw: 'Empresa Y',
    source: 'lever',
    external_id: 'abc',
    source_url: 'https://jobs.lever.co/empresay/abc',
    title: 'Product Manager',
    country_code: 'US',
    work_mode: 'remote',
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
  const jobs = parseJobBasePayload(payloadValido)
  assert.equal(jobs.length, 2)
  assert.equal(jobs[0].title, 'Engenheira Backend')
  assert.equal(jobs[0].company, 'Empresa X')
})

test('sourceJobId combina source e external_id, a chave própria do JobBase', () => {
  const jobs = parseJobBasePayload(payloadValido)
  assert.equal(jobs[0].sourceJobId, 'greenhouse:4001')
  assert.equal(jobs[1].sourceJobId, 'lever:abc')
})

test('country_code já vem pronto em ISO2, sem adivinhar', () => {
  const jobs = parseJobBasePayload(payloadValido)
  assert.equal(jobs[0].country, 'BR')
  assert.equal(jobs[1].country, 'US')
})

test('work_mode mapeia para remoteType; valor desconhecido vira unknown', () => {
  const jobs = parseJobBasePayload([
    ...payloadValido,
    { ...payloadValido[0], work_mode: 'algo-novo', external_id: 'z' },
  ])
  assert.equal(jobs[0].remoteType, 'hybrid')
  assert.equal(jobs[1].remoteType, 'remote')
  assert.equal(jobs[2].remoteType, 'unknown')
})

test('category_slug do JobBase mapeia para category; sem ele fica null', () => {
  const jobs = parseJobBasePayload([
    { ...payloadValido[0], category_slug: 'ti', external_id: 'y' },
    { ...payloadValido[1], external_id: 'z' }, // sem category_slug no payload
  ])
  assert.equal(jobs[0].category, 'ti')
  assert.equal(jobs[1].category, null)
})

test('publishedAt prefere posted_at; sem ele cai para first_seen_at', () => {
  const jobs = parseJobBasePayload(payloadValido)
  assert.equal(jobs[0].publishedAt, '2026-08-10T12:00:00Z')
  // A segunda vaga do payload não declara posted_at nem first_seen_at.
  assert.equal(jobs[1].publishedAt, null)
})

test('vaga sem título, URL ou empresa é descartada', () => {
  const jobs = parseJobBasePayload([
    { ...payloadValido[0], title: '' },
    { ...payloadValido[0], source_url: '' },
    { ...payloadValido[0], company_name_raw: '' },
  ])
  assert.equal(jobs.length, 0)
})

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseJobBasePayload(null), [])
  assert.deepEqual(parseJobBasePayload({ jobs: [] }), [])
  assert.deepEqual(parseJobBasePayload('texto'), [])
})

test('credenciais têm padrão de produção quando nada é configurado', () => {
  const creds = jobBaseCredentials(undefined, undefined)
  assert.equal(creds.url, 'https://poesywqtwnihizhkkbii.supabase.co')
  assert.match(creds.anonKey, /^sb_publishable_/)
})

test('credenciais configuradas substituem o padrão, e a barra final some', () => {
  const creds = jobBaseCredentials('https://outro.supabase.co/', 'outra-chave')
  assert.equal(creds.url, 'https://outro.supabase.co')
  assert.equal(creds.anonKey, 'outra-chave')
})

test('coleta bem-sucedida numa página só é declarada completa', async () => {
  const adapter = createJobBaseAdapter({
    credentials: jobBaseCredentials(),
    fetchImpl: fakeFetch({ jsonValue: payloadValido }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 2)
  assert.equal(result.pagesFetched, 1)
})

test('pagina até a última página vir menor que o teto', async () => {
  let calls = 0
  const fetchImpl = (async () => {
    calls++
    // Duas páginas cheias, terceira menor: é ela quem encerra a paginação.
    const jsonValue = calls <= 2 ? [payloadValido[0], payloadValido[0]] : [payloadValido[1]]
    return { ok: true, status: 200, json: async () => jsonValue } as Response
  }) as unknown as typeof fetch

  const adapter = createJobBaseAdapter({
    credentials: jobBaseCredentials(),
    fetchImpl,
    pageSize: 2,
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(calls, 3)
  assert.equal(result.outcome, 'complete')
  assert.equal(result.jobs.length, 5)
})

test('HTTP ruim é falha, não "base sem vagas"', async () => {
  const adapter = createJobBaseAdapter({
    credentials: jobBaseCredentials(),
    fetchImpl: fakeFetch({ ok: false, status: 500 }),
  })
  const result = await adapter.collect({ timeBudgetMs: 5000 })

  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 500/)
})

test('resposta que não é lista é falha, não zero vagas', () => {
  return createJobBaseAdapter({
    credentials: jobBaseCredentials(),
    fetchImpl: fakeFetch({ jsonValue: { message: 'erro' } }),
  })
    .collect({ timeBudgetMs: 5000 })
    .then((result) => {
      assert.equal(result.outcome, 'failed')
      assert.match(result.error!, /não veio como lista/)
    })
})

test('§12: falha no JobBase não fecha vaga nenhuma', async () => {
  const adapter = createJobBaseAdapter({
    credentials: jobBaseCredentials(),
    fetchImpl: fakeFetch({ ok: false, status: 503 }),
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

test('a fonte não fecha vaga por ausência, mesmo com coleta completa', () => {
  // Ao contrário de um board por empresa, o JobBase agrega várias empresas de
  // fontes variadas — sair da resposta de hoje não prova encerramento.
  assert.equal(createJobBaseAdapter({ credentials: jobBaseCredentials() }).descriptor.closesByAbsence, false)
})

test('JOBBASE=off desliga a fonte', () => {
  assert.deepEqual(jobBaseAdapters({ toggle: 'off' }), [])
  assert.deepEqual(jobBaseAdapters({ toggle: 'OFF' }), [])
})

test('sem toggle, a fonte roda com as credenciais padrão', () => {
  const adapters = jobBaseAdapters({})
  assert.equal(adapters.length, 1)
  assert.equal(adapters[0].descriptor.slug, 'jobbase')
})
