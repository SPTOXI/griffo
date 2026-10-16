import test from 'node:test'
import assert from 'node:assert/strict'
import { loginBlocked, MAX_FAILED_LOGINS_PER_ACCOUNT, MAX_FAILED_LOGINS_PER_ORIGIN } from './login-throttle'

test('loginBlocked: quem errou demais da mesma origem fica de fora', () => {
  assert.equal(loginBlocked(MAX_FAILED_LOGINS_PER_ORIGIN - 1, MAX_FAILED_LOGINS_PER_ORIGIN - 1), false)
  assert.equal(loginBlocked(MAX_FAILED_LOGINS_PER_ORIGIN, MAX_FAILED_LOGINS_PER_ORIGIN), true)
})

test('loginBlocked: falhas de outra origem não trancam o dono da conta', () => {
  // Atacante errou 10 vezes do IP A; o dono chega do IP B, sem falhas.
  assert.equal(loginBlocked(0, MAX_FAILED_LOGINS_PER_ORIGIN), false)
  // Mesmo passado o teto da conta, origem sem falha continua entrando.
  assert.equal(loginBlocked(0, MAX_FAILED_LOGINS_PER_ACCOUNT + 50), false)
})

test('loginBlocked: passado o teto da conta, origem com falha fica de fora', () => {
  assert.equal(loginBlocked(1, MAX_FAILED_LOGINS_PER_ACCOUNT), true)
  assert.equal(loginBlocked(1, MAX_FAILED_LOGINS_PER_ACCOUNT - 1), false)
})
