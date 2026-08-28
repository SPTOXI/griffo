import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'
import { getSessionSecret } from './env'
import {
  createSessionRecord,
  isSessionActive,
  revokeSession,
  type SessionMeta,
} from './session-store'

// --- Password hashing using Node's scrypt (no extra deps) ---
const SCRYPT_KEYLEN = 64
const SCRYPT_SALTLEN = 16

/**
 * Hash dummy estático gerado via scrypt.
 * Usado quando um usuário não é encontrado para garantir tempo constante de CPU
 * na verificação de senha, eliminando qualquer oráculo de tempo (timing attack)
 * que permitisse enumeração de e-mails válidos.
 */
export const DUMMY_PASSWORD_HASH =
  'a1b2c3d4e5f60718293a4b5c6d7e8f90:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069a1b2c3d4e5f60718293a4b5c6d7e8f907f83b1657ff1fc53b92dc18148a1d65d'

export function hashPassword(password: string): string {
  const salt = randomBytes(SCRYPT_SALTLEN).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  try {
    const hashBuf = Buffer.from(hash, 'hex')
    const testBuf = scryptSync(password, salt, SCRYPT_KEYLEN)
    if (hashBuf.length !== testBuf.length) return false
    return timingSafeEqual(hashBuf, testBuf)
  } catch {
    return false
  }
}

/**
 * Verificação de senha em tempo estritamente constante.
 * Se o hash fornecido for nulo, indefinido ou malformado, executa o scrypt
 * contra o hash dummy e devolve false, garantindo imunidade a timing attacks.
 */
export function verifyPasswordConstantTime(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    verifyPassword(password, DUMMY_PASSWORD_HASH)
    return false
  }
  return verifyPassword(password, storedHash)
}

/**
 * Validação rigorosa de força da senha:
 * - Mínimo 8 caracteres (padrão OWASP/NIST SP 800-63B).
 * - Máximo 128 caracteres.
 * - Não pode consistir apenas em espaços.
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Senha é obrigatória.' }
  }
  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'A senha deve ter no máximo 128 caracteres.' }
  }
  if (password.trim().length === 0) {
    return { valid: false, message: 'A senha não pode consistir apenas em espaços.' }
  }
  return { valid: true }
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
