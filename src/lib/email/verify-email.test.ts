import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  VERIFY_TOKEN_TTL_MS,
  buildAccountExistsEmail,
  buildVerificationEmail,
  emailVerificationToken,
  userIdFromVerificationToken,
} from './verify-email'

const SECRET = 's'.repeat(64)

test('o link de confirmação abre só para o usuário de quem é', () => {
  const t = emailVerificationToken('user_1', SECRET)
  assert.equal(userIdFromVerificationToken(t, SECRET), 'user_1')
  // Assinado com outro segredo não vale: sem isso, qualquer um forjaria login.
  assert.equal(userIdFromVerificationToken(t, 'x'.repeat(64)), null)
})

test('o link vence: um link de login eterno numa caixa de entrada antiga é porta aberta', () => {
  const now = Date.now()
  const t = emailVerificationToken('user_1', SECRET, now)
  assert.equal(userIdFromVerificationToken(t, SECRET, now + VERIFY_TOKEN_TTL_MS - 1000), 'user_1')
  assert.equal(userIdFromVerificationToken(t, SECRET, now + VERIFY_TOKEN_TTL_MS + 1000), null)
})

test('token adulterado ou malformado não lança, devolve null', () => {
  const t = emailVerificationToken('user_1', SECRET)
  const [payload, sig] = t.split('.')
  const forged = Buffer.from(`admin.${Date.now() + 1e9}`).toString('base64url')
  assert.equal(userIdFromVerificationToken(`${forged}.${sig}`, SECRET), null)
  assert.equal(userIdFromVerificationToken(`${payload}.`, SECRET), null)
  assert.equal(userIdFromVerificationToken('', SECRET), null)
  assert.equal(userIdFromVerificationToken('lixo', SECRET), null)
  assert.equal(userIdFromVerificationToken(null, SECRET), null)
})

test('o token do descadastro não serve como link de confirmação (escopos separados)', async () => {
  const { unsubscribeToken } = await import('./unsubscribe')
  assert.equal(userIdFromVerificationToken(unsubscribeToken('user_1', SECRET), SECRET), null)
})

test('os e-mails levam o link, saem no idioma da tela e escapam HTML', () => {
  const v = buildVerificationEmail({ to: 'a@b.com', lang: 'pt', verifyUrl: 'https://griffo.work/api/auth/verify-email?t=a&b' })
  assert.match(v.subject, /Confirme/)
  assert.match(v.html, /t=a&amp;b/)
  assert.match(v.text, /t=a&b/)
  const e = buildAccountExistsEmail({ to: 'a@b.com', lang: 'de', loginUrl: 'https://griffo.work/?view=login' })
  assert.match(e.subject, /GriffoWork/)
  assert.match(e.html, /bereits/)
  // Idioma desconhecido cai no inglês, nunca em texto vazio.
  assert.match(buildVerificationEmail({ to: 'a@b.com', lang: 'xx', verifyUrl: 'https://x' }).subject, /Confirm your email/)
})
