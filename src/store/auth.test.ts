import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import type { useAuth as useAuthType } from './auth'

/**
 * Achado do §2.100: sessão expirando no meio da navegação SPA (sem
 * reload) deixava o `useAuth` com o usuário antigo em memória — a tela
 * caía num estado vazio ("nenhum currículo encontrado") em vez de
 * voltar pra landing deslogada. Corrigido em `internal-fetch.ts`
 * (dispara `griffo:session-expired` em qualquer 401 de rota relativa) +
 * `auth.ts` (limpa o usuário ao ouvir o evento).
 *
 * O projeto não usa jsdom — `window` aqui é um `EventTarget` mínimo, só
 * o suficiente pra exercitar `addEventListener`/`dispatchEvent`, e
 * precisa existir ANTES do primeiro import de `./auth` (o listener é
 * registrado no escopo do módulo, uma vez só) — daí o `import()`
 * dinâmico dentro de `before`, em vez de um `import` estático no topo.
 */
let useAuth: typeof useAuthType

before(async () => {
  ;(globalThis as any).window = new EventTarget()
  ;({ useAuth } = await import('./auth'))
})

test('evento griffo:session-expired limpa o usuário autenticado', () => {
  useAuth.setState({
    user: { id: '1', email: 'a@a.com', name: 'A', plan: 'free' },
    hydrated: true,
  })
  assert.ok(useAuth.getState().user, 'pré-condição: usuário deveria estar setado')

  window.dispatchEvent(new Event('griffo:session-expired'))

  assert.equal(useAuth.getState().user, null, 'usuário deveria ter sido limpo pelo evento')
})

test('outros eventos não mexem no usuário', () => {
  useAuth.setState({
    user: { id: '2', email: 'b@b.com', name: 'B', plan: 'free' },
    hydrated: true,
  })

  window.dispatchEvent(new Event('algum-outro-evento'))

  assert.ok(useAuth.getState().user, 'usuário não deveria ter sido limpo por evento não relacionado')
})
