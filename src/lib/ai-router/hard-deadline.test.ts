import test from 'node:test'
import assert from 'node:assert/strict'
import { withHardDeadline } from './router'

/**
 * Uma resposta que nunca termina (cabeçalhos chegaram, corpo não) precisa virar
 * erro dentro do prazo — senão a função inteira para no limite da Vercel (504).
 */
test('withHardDeadline rejeita uma promessa que nunca termina quando o prazo vence', async () => {
  const started = Date.now()
  await assert.rejects(
    withHardDeadline(new Promise(() => {}), AbortSignal.timeout(50), 50),
    (e: any) => e.code === 'ETIMEDOUT'
  )
  assert.ok(Date.now() - started < 1000)
})

test('withHardDeadline repassa o resultado e o erro de uma promessa que termina a tempo', async () => {
  assert.equal(await withHardDeadline(Promise.resolve(7), AbortSignal.timeout(1000), 1000), 7)
  await assert.rejects(withHardDeadline(Promise.reject(new Error('x')), AbortSignal.timeout(1000), 1000), /x/)
})
