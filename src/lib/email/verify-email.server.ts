import 'server-only'
import { getAppUrl, getDigestFrom, getDigestReplyTo, getResendApiKey, getSessionSecret } from '../env'
import { sendEmail } from './send'
import {
  buildAccountExistsEmail,
  buildVerificationEmail,
  emailVerificationToken,
  userIdFromVerificationToken,
} from './verify-email'

/**
 * A confirmação de e-mail ligada ao ambiente. A parte que erra em silêncio (o
 * token) fica em `verify-email.ts`, com teste; aqui só entram segredo, URL e
 * envio.
 *
 * O envio nunca derruba o cadastro: a resposta da rota precisa ser a mesma
 * tendo ou não saído e-mail, senão a diferença de tempo ou de erro volta a
 * revelar se a conta existe. Falha vai para o log.
 */

export async function sendVerificationEmail(user: { id: string; email: string }, lang: string): Promise<void> {
  const token = emailVerificationToken(user.id, getSessionSecret())
  const verifyUrl = `${getAppUrl()}/api/auth/verify-email?t=${encodeURIComponent(token)}`
  await deliver(buildVerificationEmail({ to: user.email, lang, verifyUrl }), 'confirmação')
}

export async function sendAccountExistsEmail(email: string, lang: string): Promise<void> {
  await deliver(buildAccountExistsEmail({ to: email, lang, loginUrl: `${getAppUrl()}/?view=login` }), 'aviso de conta existente')
}

export function userIdFromVerifyRequest(token: string | null | undefined): string | null {
  return userIdFromVerificationToken(token, getSessionSecret())
}

async function deliver(message: Parameters<typeof sendEmail>[0], kind: string): Promise<void> {
  try {
    await sendEmail(message, { apiKey: getResendApiKey(), from: getDigestFrom(), replyTo: getDigestReplyTo() })
  } catch (e: any) {
    console.warn(`[verify-email] e-mail de ${kind} não saiu:`, e?.message || e)
  }
}
