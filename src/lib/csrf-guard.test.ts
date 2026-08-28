import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSameOrigin, isCsrfExempt, isMutatingMethod } from './csrf-guard'

test('isMutatingMethod identifica métodos de alteração de estado', () => {
  assert.equal(isMutatingMethod('POST'), true)
  assert.equal(isMutatingMethod('post'), true)
  assert.equal(isMutatingMethod('PUT'), true)
  assert.equal(isMutatingMethod('PATCH'), true)
  assert.equal(isMutatingMethod('DELETE'), true)
  assert.equal(isMutatingMethod('GET'), false)
  assert.equal(isMutatingMethod('HEAD'), false)
  assert.equal(isMutatingMethod('OPTIONS'), false)
})

test('isCsrfExempt isenta webhooks externos e endpoints públicos com token', () => {
  assert.equal(isCsrfExempt('/api/webhooks/stripe'), true)
  assert.equal(isCsrfExempt('/api/radar/unsubscribe'), true)
  assert.equal(isCsrfExempt('/api/cron/radar'), true)
  assert.equal(isCsrfExempt('/api/resume/upload'), false)
  assert.equal(isCsrfExempt('/api/auth/login'), false)
})

test('validateSameOrigin: aceita requisições de leitura GET/HEAD livremente', () => {
  const allowed = validateSameOrigin({
    method: 'GET',
    pathname: '/api/resume/123',
    origin: 'https://evil.com',
    host: 'griffo.work',
  })
  assert.equal(allowed, true)
})

test('validateSameOrigin: aceita requisições same-origin válidas', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/resume/upload',
    origin: 'https://griffo.work',
    host: 'griffo.work',
    secFetchSite: 'same-origin',
  })
  assert.equal(allowed, true)
})

test('validateSameOrigin: aceita localhost e portas de desenvolvimento', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/auth/login',
    origin: 'http://localhost:3000',
    host: 'localhost:3000',
    secFetchSite: 'same-origin',
  })
  assert.equal(allowed, true)
})

test('validateSameOrigin: bloqueia requisições cross-site com sec-fetch-site = cross-site', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/user',
    origin: 'https://griffo.work',
    host: 'griffo.work',
    secFetchSite: 'cross-site',
  })
  assert.equal(allowed, false)
})

test('validateSameOrigin: bloqueia requisições com Origin divergente do Host', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/resume/analyze',
    origin: 'https://malicious-site.com',
    host: 'griffo.work',
  })
  assert.equal(allowed, false)
})

test('validateSameOrigin: bloqueia Origin malformado', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/resume/analyze',
    origin: 'not-a-valid-url',
    host: 'griffo.work',
  })
  assert.equal(allowed, false)
})

test('validateSameOrigin: permite rotas isentas como webhooks Stripe mesmo cross-origin', () => {
  const allowed = validateSameOrigin({
    method: 'POST',
    pathname: '/api/webhooks/stripe',
    origin: 'https://stripe.com',
    host: 'griffo.work',
    secFetchSite: 'cross-site',
  })
  assert.equal(allowed, true)
})
