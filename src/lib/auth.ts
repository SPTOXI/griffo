import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

// --- Password hashing using Node's scrypt (no extra deps) ---
const SCRYPT_KEYLEN = 64
const SCRYPT_SALTLEN = 16

export function hashPassword(password: string): string {
  const salt = randomBytes(SCRYPT_SALTLEN).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, SCRYPT_KEYLEN)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// --- Session management via signed cookie ---
// Lightweight JWT-like token: payload.signature
const SESSION_SECRET = process.env.SESSION_SECRET || 'career-analyst-dev-secret-change-me'
const SESSION_COOKIE = 'ca_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function sign(payload: string): string {
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verify(token: string): string | null {
  if (!token || !token.includes('.')) return null
  const lastDot = token.lastIndexOf('.')
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
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

export async function createSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ uid: userId, iat: Date.now(), exp: Date.now() + SESSION_MAX_AGE * 1000 })
  const token = sign(Buffer.from(payload).toString('base64url'))
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    const payloadB64 = verify(token)
    if (!payloadB64) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as { uid: string; exp: number }
    if (Date.now() > payload.exp) return null
    const user = await db.user.findUnique({ where: { id: payload.uid } })
    return user
  } catch {
    return null
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

// Check if user has active plan (any of: day, monthly, annual) within validity window
export function hasActivePlan(user: { plan: string; planStartsAt: Date | null; planEndsAt: Date | null }): boolean {
  if (user.plan === 'free') return false
  if (!user.planStartsAt || !user.planEndsAt) return false
  const now = new Date()
  return now >= user.planStartsAt && now <= user.planEndsAt
}
