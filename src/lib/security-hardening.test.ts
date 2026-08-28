import test from 'node:test'
import assert from 'node:assert/strict'
import {
  hashPassword,
  verifyPassword,
  verifyPasswordConstantTime,
  validatePasswordStrength,
  DUMMY_PASSWORD_HASH,
} from './auth'
import nextConfig from '../../next.config'

test('validatePasswordStrength recusa senhas com menos de 8 caracteres', () => {
  assert.equal(validatePasswordStrength('123456').valid, false)
  assert.equal(validatePasswordStrength('short').valid, false)
  assert.equal(validatePasswordStrength('1234567').valid, false)
})

test('validatePasswordStrength aceita senhas fortes com 8 ou mais caracteres', () => {
  assert.equal(validatePasswordStrength('senha1234').valid, true)
  assert.equal(validatePasswordStrength('Griffo#Secure!2026').valid, true)
  assert.equal(validatePasswordStrength('palavra-passe-muito-longa').valid, true)
})

test('validatePasswordStrength recusa senhas compostas apenas por espaços', () => {
  assert.equal(validatePasswordStrength('        ').valid, false)
})

test('verifyPasswordConstantTime: autentica senha correta', () => {
  const hash = hashPassword('minhasenha123')
  assert.equal(verifyPasswordConstantTime('minhasenha123', hash), true)
  assert.equal(verifyPasswordConstantTime('senhaerrada', hash), false)
})

test('verifyPasswordConstantTime: protege contra timing attack quando usuário não existe', () => {
  // Quando o hash for null/undefined, a função roda o scrypt internamente e devolve false
  assert.equal(verifyPasswordConstantTime('qualquersenha', null), false)
  assert.equal(verifyPasswordConstantTime('qualquersenha', undefined), false)
  assert.equal(verifyPasswordConstantTime('qualquersenha', ''), false)
  assert.equal(verifyPasswordConstantTime('qualquersenha', 'hash-invalido-sem-dois-pontos'), false)
})

test('DUMMY_PASSWORD_HASH é um hash scrypt estruturalmente válido', () => {
  assert.ok(DUMMY_PASSWORD_HASH.includes(':'))
  const [salt, hash] = DUMMY_PASSWORD_HASH.split(':')
  assert.equal(salt.length, 32)
  assert.equal(hash.length, 128)
})

test('next.config.ts define cabeçalhos de segurança completos (OWASP ASVS / Nível 10)', async () => {
  const headersFn = nextConfig.headers
  assert.ok(typeof headersFn === 'function', 'nextConfig deve declarar headers()')

  const headerRules = await headersFn!()
  const rootRule = headerRules.find((r) => r.source === '/:path*')
  assert.ok(rootRule, 'Deve haver regra global para /:path*')

  const headerMap = new Map(rootRule.headers.map((h) => [h.key, h.value]))

  // HSTS
  assert.ok(headerMap.has('Strict-Transport-Security'))
  assert.ok(headerMap.get('Strict-Transport-Security')!.includes('includeSubDomains'))

  // Clickjacking & MIME
  assert.equal(headerMap.get('X-Frame-Options'), 'DENY')
  assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff')

  // Isolamento de Origem (COOP / CORP)
  assert.equal(headerMap.get('Cross-Origin-Opener-Policy'), 'same-origin')
  assert.equal(headerMap.get('Cross-Origin-Resource-Policy'), 'same-origin')
  assert.equal(headerMap.get('X-DNS-Prefetch-Control'), 'off')

  // CSP
  const csp = headerMap.get('Content-Security-Policy')
  assert.ok(csp, 'CSP deve estar presente')
  assert.ok(csp!.includes("default-src 'self'"))
  assert.ok(csp!.includes("frame-ancestors 'none'"))
  assert.ok(csp!.includes("object-src 'none'"))
  assert.ok(csp!.includes("base-uri 'self'"))
})
