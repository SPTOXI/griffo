import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateHeuristicSimilarity,
  findDuplicateCandidatePairs,
  type JobMinimal,
} from './agent-dedup'

const baseDate = new Date('2026-08-20T10:00:00Z')

const jobNubankGupy: JobMinimal = {
  id: 'job-1',
  title: 'Engenheiro de Software Frontend Pleno (React)',
  normalizedTitle: 'frontend_developer',
  company: 'Nubank',
  companyKey: 'nubank',
  country: 'BR',
  region: 'São Paulo',
  city: 'São Paulo',
  remoteType: 'hybrid',
  description: 'Atuar no time de cartões desenvolvendo interfaces em React e TypeScript.',
  requirements: JSON.stringify(['React', 'TypeScript', 'Jest']),
  skills: JSON.stringify(['React', 'Frontend']),
  publishedAt: baseDate,
  createdAt: baseDate,
  applicationUrl: 'https://nubank.gupy.io/job/1',
}

const jobNubankAdzuna: JobMinimal = {
  id: 'job-2',
  title: 'Desenvolvedor Front-End Pleno - React/Next',
  normalizedTitle: 'frontend_developer',
  company: 'Nu Pagamentos S.A.',
  companyKey: 'nubank',
  country: 'BR',
  region: 'São Paulo',
  city: 'São Paulo',
  remoteType: 'hybrid',
  description: 'Vaga para desenvolvedor front-end atuar com React, Next.js e testes.',
  requirements: JSON.stringify(['React', 'TypeScript', 'Next.js']),
  skills: JSON.stringify(['React', 'Next.js']),
  publishedAt: new Date('2026-08-21T10:00:00Z'),
  createdAt: new Date('2026-08-21T10:00:00Z'),
  applicationUrl: 'https://adzuna.com.br/land/ad/12345',
}

const jobItauBackend: JobMinimal = {
  id: 'job-3',
  title: 'Engenheiro Backend Java Sênior',
  normalizedTitle: 'backend_developer',
  company: 'Itaú Unibanco',
  companyKey: 'itau',
  country: 'BR',
  region: 'São Paulo',
  city: 'São Paulo',
  remoteType: 'onsite',
  description: 'Desenvolvimento em Java e microserviços.',
  requirements: JSON.stringify(['Java', 'Spring Boot']),
  skills: JSON.stringify(['Java']),
  publishedAt: baseDate,
  createdAt: baseDate,
  applicationUrl: 'https://itau.com/vagas/3',
}

test('heurística identifica alta similaridade entre vagas do Nubank com fontes e títulos parecidos', () => {
  const { score, reason } = calculateHeuristicSimilarity(jobNubankGupy, jobNubankAdzuna)
  assert.ok(score >= 70, `Score esperado >= 70, obteve ${score}`)
  assert.match(reason, /mesma empresa/)
  assert.match(reason, /mesma taxonomia de cargo/)
})

test('heurística descarta vagas de empresas e cargos completamente distintos', () => {
  const { score, reason } = calculateHeuristicSimilarity(jobNubankGupy, jobItauBackend)
  assert.equal(score, 0)
  assert.match(reason, /empresas distintas/)
})

test('findDuplicateCandidatePairs agrupa e ordena pares suspeitos corretamente', () => {
  const pairs = findDuplicateCandidatePairs([jobNubankGupy, jobNubankAdzuna, jobItauBackend])
  assert.equal(pairs.length, 1)
  assert.equal(pairs[0].jobA.id, 'job-1')
  assert.equal(pairs[0].jobB.id, 'job-2')
  assert.ok(pairs[0].heuristicScore >= 70)
})

test('mesma vaga comparada consigo mesma tem score 0', () => {
  const { score } = calculateHeuristicSimilarity(jobNubankGupy, jobNubankGupy)
  assert.equal(score, 0)
})
