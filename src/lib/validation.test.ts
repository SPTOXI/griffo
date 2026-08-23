import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_SOCIAL_LINKS, MAX_SOCIAL_URL_CHARS, socialLinksSchema } from './validation'

test('aceita o formato que a tela envia', () => {
  const parsed = socialLinksSchema.parse({
    LinkedIn: 'linkedin.com/in/fulano',
    GitHub: 'https://github.com/fulano',
  })
  assert.deepEqual(parsed, {
    LinkedIn: 'linkedin.com/in/fulano',
    GitHub: 'https://github.com/fulano',
  })
})

test('descarta campo aberto e não preenchido', () => {
  assert.deepEqual(socialLinksSchema.parse({ LinkedIn: '', GitHub: 'github.com/x' }), {
    GitHub: 'github.com/x',
  })
})

test('recusa mais perfis que o teto', () => {
  const demais = Object.fromEntries(
    Array.from({ length: MAX_SOCIAL_LINKS + 1 }, (_, i) => [`rede${i}`, `exemplo${i}.com`])
  )
  assert.equal(socialLinksSchema.safeParse(demais).success, false)
})

test('recusa URL longa demais', () => {
  const longa = `exemplo.com/${'a'.repeat(MAX_SOCIAL_URL_CHARS)}`
  assert.equal(socialLinksSchema.safeParse({ LinkedIn: longa }).success, false)
})

test('recusa esquema perigoso no valor', () => {
  assert.equal(socialLinksSchema.safeParse({ LinkedIn: 'javascript:alert(1)' }).success, false)
})

test('recusa nome de plataforma longo demais', () => {
  assert.equal(socialLinksSchema.safeParse({ ['x'.repeat(41)]: 'exemplo.com' }).success, false)
})
