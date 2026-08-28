import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'
import { getSessionSecret } from './env'
import {
  createSessionRecord,
  isSessionActive,
  revokeSession,
  type SessionMeta,
} from './session-store'
import {
  hashPassword,
  verifyPassword,
  verifyPasswordConstantTime,
  validatePasswordStrength,
  DUMMY_PASSWORD_HASH,
} from './password'

export {
  hashPassword,
  verifyPassword,
  verifyPasswordConstantTime,
  validatePasswordStrength,
  DUMMY_PASSWORD_HASH,
}

// --- Session management via strictly non-persistent session cookie ---
const SESSION_COOKIE = 'ca_session'
const SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours active window max

function sign(payload: string): string {
  const sig = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verify(token: string): string | null {
  if (!token || !token.includes('.')) return null
  const lastDot = token.lastIndexOf('.')
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  try {
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
  } catch {
    return null
  }
  return payload
}

export async function createSession(userId: string, meta: SessionMeta = {}): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const sid = await createSessionRecord(userId, expiresAt, meta)

  // `sid` vem nulo apenas enquanto a tabela `Session` não existe; nesse caso o
  // cookie mantém o formato antigo e vale só pela assinatura.
  const payload = JSON.stringify({
    ...(sid ? { sid } : {}),
    uid: userId,
    iat: Date.now(),
    exp: expiresAt.getTime(),
  })
  const token = sign(Buffer.from(payload).toString('base64url'))
  const cookieStore = await cookies()

  // Non-persistent Session Cookie: NO maxAge, NO expires
  // This guarantees browser deletes the session cookie automatically on browser tab/window close
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()

  // Revoga no servidor antes de apagar o cookie: sem isso, "sair" só removia a
  // cópia do navegador e um token capturado continuava valendo até expirar.
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const payload = token ? readPayload(token) : null
  if (payload?.sid) {
    await revokeSession(payload.sid)
  }

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

interface SessionPayload {
  sid?: string
  uid: string
  exp: number
}

/** Verifica a assinatura e decodifica o conteúdo do cookie. */
function readPayload(token: string): SessionPayload | null {
  const payloadB64 = verify(token)
  if (!payloadB64) return null
  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    const payload = readPayload(token)
    if (!payload) return null
    if (Date.now() > payload.exp) return null

    // Cookies emitidos antes desta mudança não têm `sid`. Continuam aceitos
    // até expirarem — no máximo 2 horas — para que o deploy não deslogue todo
    // mundo de uma vez. Depois disso todo cookie em circulação tem `sid`.
    if (payload.sid && !(await isSessionActive(payload.sid))) return null

    const user = await db.user.findUnique({ where: { id: payload.uid } })
    if (!user || user.disabled) return null
    return user
  } catch {
    return null
  }
}

// Check if user has active plan (any of: day, monthly, annual) within validity window
export function hasActivePlan(user: { plan: string; planStartsAt: Date | null; planEndsAt: Date | null }): boolean {
  if (user.plan === 'free') return false
  if (!user.planStartsAt || !user.planEndsAt) return false
  const now = new Date()
  return now >= user.planStartsAt && now <= user.planEndsAt
}
