import test from 'node:test'
import assert from 'node:assert/strict'
import { matchRule, type RateRule } from './rate-rules'

const rules: RateRule[] = [
  { prefix: '/api/resume/analyze', limit: 10, windowMs: 600_000 },
  { prefix: '/api/resume/analyze/status', limit: 900, windowMs: 600_000 },
  { prefix: '/api/user', limit: 20, windowMs: 600_000 },
  { prefix: '/api/user/export', limit: 5, windowMs: 3_600_000 },
]

test('a sub-rota não herda o limite da rota pai', () => {
  // O defeito real: a consulta de status, que a tela faz a cada 1,5s, caía no
  // limite de 10 por 10 minutos da rota cara. Quinze segundos depois, tudo 429
  // — inclusive a consulta que REATIVA o processamento.
  const rule = matchRule('/api/resume/analyze/status', rules)
  assert.equal(rule?.prefix, '/api/resume/analyze/status')
  assert.equal(rule?.limit, 900)
})

test('a rota pai continua com o limite dela', () => {
  const rule = matchRule('/api/resume/analyze', rules)
  assert.equal(rule?.limit, 10)
})

test('vence o prefixo mais longo, não a ordem da lista', () => {
  // A regra específica de export vem DEPOIS da genérica de user na lista.
  assert.equal(matchRule('/api/user/export', rules)?.limit, 5)
  assert.equal(matchRule('/api/user/settings', rules)?.limit, 20)
})

test('caminho sem regra não é limitado', () => {
  assert.equal(matchRule('/api/pricing', rules), undefined)
})
