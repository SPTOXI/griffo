import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardedLookup } from './url-guard'

// DNS rebinding: a conexão resolve o nome de novo. O lookup usado por ela
// precisa recusar endereço interno mesmo que a checagem anterior tenha passado.
test('lookup da conexão recusa endereço interno', async () => {
  const err = await new Promise<Error | null>((resolve) =>
    guardedLookup('localhost', {}, (e) => resolve(e))
  )
  assert.ok(err)
  assert.match(err!.message, /não permitida/)
})
