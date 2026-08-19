import test from 'node:test'
import assert from 'node:assert/strict'
import {
  REMOTEOK_DESCRIPTOR,
  REMOTIVE_DESCRIPTOR,
  createRemoteOkAdapter,
  createRemotiveAdapter,
  isoFromEpochSeconds,
  isoFromNaiveDate,
  parseRemoteOkPayload,
  parseRemotivePayload,
  remoteBoardAdapters,
} from './remote-boards'

/** Recortes dos payloads REAIS observados em 19/08/2026. */
const remotivePayload = {
  '0-legal-notice': 'aviso do serviço',
  'job-count': 1,
  jobs: [
    {
      id: 1919266,
      url: 'https://remotive.com/remote-jobs/software-development/senior-ai-1919266',
      title: 'Senior Independent AI Engineer / Architect',
      company_name: 'A.Team',
      category: 'Software Development',
      tags: ['go', 'UI/UX', 'testing'],
      job_type: 'contract',
      publication_date: '2026-08-16T10:09:41',
      candidate_required_location: 'Americas, Europe, Israel',
      salary: '$120 - $170 /hour',
      description: '<p>Construir <b>sistemas</b>.</p>',
    },
  ],
}

const remoteOkPayload = [
  { legal: 'aviso do serviço, primeiro item do array' },
  {
    slug: 'remote-team-member-1136966',
    id: '1136966',
    epoch: 1787050378,
    date: '2026-08-18T10:52:58+00:00',
    company: 'Reliance Industries Limited',
    position: 'Team Member Special Assignment',
    tags: ['education', 'non tech'],
    location: 'Jamnagar, ',
    apply_url: 'https://remoteOK.com/remote-jobs/remote-team-member-1136966',
    url: 'https://remoteOK.com/remote-jobs/remote-team-member-1136966',
    salary_min: 0,
    salary_max: 0,
    description: 'Atuar em projetos.',
  },
]

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

// --- Remotive ---

test('Remotive: converte a vaga', () => {
  const jobs = parseRemotivePayload(remotivePayload)
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].title, 'Senior Independent AI Engineer / Architect')
  assert.equal(jobs[0].company, 'A.Team')
  assert.equal(jobs[0].remoteType, 'remote')
})

test('Remotive: a data sem fuso é lida como UTC', () => {
  // Sem marcador, o Date usa o fuso de quem roda — e a mesma vaga teria data
  // diferente conforme a região da função.
  assert.equal(parseRemotivePayload(remotivePayload)[0].publishedAt, '2026-08-16T10:09:41.000Z')
  assert.equal(isoFromNaiveDate('2026-08-16T10:09:41'), '2026-08-16T10:09:41.000Z')
  assert.equal(isoFromNaiveDate('2026-08-16T10:09:41Z'), '2026-08-16T10:09:41.000Z')
  assert.equal(isoFromNaiveDate('não é data'), null)
  assert.equal(isoFromNaiveDate(null), null)
})

test('Remotive: o SALÁRIO EM TEXTO LIVRE não vira número', () => {
  // "$120 - $170 /hour" exigiria adivinhar moeda, período e intervalo — três
  // chances de errar num campo que o usuário lê como promessa.
  const job = parseRemotivePayload(remotivePayload)[0]
  assert.equal(job.salaryMin, undefined)
  assert.equal(job.salaryMax, undefined)
  assert.deepEqual(job.notDisclosed, ['salaryMin', 'salaryMax'])
})

test('Remotive: a restrição geográfica vai como localização, e o país fica nulo', () => {
  // "Americas, Europe, Israel" é de ONDE se pode candidatar, não onde fica a
  // vaga. A vaga remota não tem país.
  const job = parseRemotivePayload(remotivePayload)[0]
  assert.equal(job.location, 'Americas, Europe, Israel')
  assert.equal(job.country, null)
})

test('Remotive: a marcação da descrição é removida', () => {
  assert.equal(parseRemotivePayload(remotivePayload)[0].description, 'Construir sistemas.')
})

// --- RemoteOK ---

test('RemoteOK: o AVISO LEGAL do primeiro item não vira vaga', () => {
  const jobs = parseRemoteOkPayload(remoteOkPayload)
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].title, 'Team Member Special Assignment')
})

test('RemoteOK: o cargo vem de `position`, não de `title`', () => {
  // Mesma pegadinha do `text` no Lever: ler `title` descartaria tudo e a fonte
  // pareceria vazia.
  const jobs = parseRemoteOkPayload([{ position: 'Cargo', company: 'X', url: 'u' }])
  assert.equal(jobs[0].title, 'Cargo')
})

test('RemoteOK: `epoch` está em SEGUNDOS', () => {
  // Tratar como milissegundos jogaria toda vaga para 1970.
  assert.equal(parseRemoteOkPayload(remoteOkPayload)[0].publishedAt, '2026-08-18T10:52:58.000Z')
  assert.equal(isoFromEpochSeconds(0), null)
  assert.equal(isoFromEpochSeconds(-5), null)
  assert.equal(isoFromEpochSeconds('1787050378'), null)
})

test('RemoteOK: SALÁRIO ZERO É "NÃO INFORMADO", não uma oferta', () => {
  const job = parseRemoteOkPayload(remoteOkPayload)[0]
  assert.equal(job.salaryMin, null)
  assert.equal(job.salaryMax, null)
  assert.deepEqual(job.notDisclosed, ['salaryMin', 'salaryMax'])
})

test('RemoteOK: salário de verdade é mantido, e não é marcado como oculto', () => {
  const jobs = parseRemoteOkPayload([
    { position: 'P', company: 'C', url: 'u', salary_min: 90000, salary_max: 120000 },
  ])
  assert.equal(jobs[0].salaryMin, 90000)
  assert.equal(jobs[0].notDisclosed, null)
})

test('RemoteOK: localização suja vai crua, sem adivinhação', () => {
  assert.equal(parseRemoteOkPayload(remoteOkPayload)[0].location, 'Jamnagar,')
  assert.equal(parseRemoteOkPayload(remoteOkPayload)[0].country, null)
})

// --- comuns ---

test('payload malformado devolve lista vazia sem lançar', () => {
  assert.deepEqual(parseRemotivePayload(null), [])
  assert.deepEqual(parseRemotivePayload({ jobs: 'texto' }), [])
  assert.deepEqual(parseRemoteOkPayload(null), [])
  assert.deepEqual(parseRemoteOkPayload({ jobs: [] }), [])
})

test('NENHUMA das duas fecha vaga por ausência', () => {
  // Devolvem a fatia recente, não o catálogo. Sair da fatia significa que
  // outras vagas foram publicadas depois — não que esta fechou.
  assert.equal(REMOTIVE_DESCRIPTOR.closesByAbsence, false)
  assert.equal(REMOTEOK_DESCRIPTOR.closesByAbsence, false)
})

test('nenhuma declara mercado fixo', () => {
  // Vaga remota internacional serve a qualquer país; declarar mercados a
  // esconderia de quem mais precisa dela.
  assert.deepEqual(REMOTIVE_DESCRIPTOR.markets, [])
  assert.deepEqual(REMOTEOK_DESCRIPTOR.markets, [])
})

test('HTTP ruim é falha, não "não há vaga remota no mundo"', async () => {
  const adapter = createRemotiveAdapter({ fetchImpl: fakeFetch({}, false, 503) })
  const result = await adapter.collect({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 503/)
})

test('coleta bem-sucedida traz as vagas', async () => {
  const remotive = createRemotiveAdapter({ fetchImpl: fakeFetch(remotivePayload) })
  const remoteok = createRemoteOkAdapter({ fetchImpl: fakeFetch(remoteOkPayload) })

  assert.equal((await remotive.collect({ timeBudgetMs: 5000 })).jobs.length, 1)
  assert.equal((await remoteok.collect({ timeBudgetMs: 5000 })).jobs.length, 1)
})

test('as duas vêm LIGADAS por padrão', () => {
  // São a única fonte de quem mora em país fora da Adzuna. Atrás de variável de
  // ambiente, esses mercados ficariam sem fonte por esquecimento.
  assert.equal(remoteBoardAdapters(undefined).length, 2)
  assert.equal(remoteBoardAdapters('').length, 2)
})

test('`off` desliga as duas', () => {
  assert.deepEqual(remoteBoardAdapters('off'), [])
  assert.deepEqual(remoteBoardAdapters('OFF'), [])
})

test('a limpeza não deixa espaço encostado na pontuação', () => {
  // `sistemas<b>.</b>` vira `sistemas .` se a tag só virar espaço. O resíduo
  // aparece na descrição que o matching lê e que a pessoa vê.
  const jobs = parseRemotivePayload({
    jobs: [
      {
        title: 'T',
        url: 'u',
        company_name: 'C',
        description: '<p>Fim de <b>frase</b>. E <i>outra</i>, com vírgula.</p>',
      },
    ],
  })
  assert.equal(jobs[0].description, 'Fim de frase. E outra, com vírgula.')
})
