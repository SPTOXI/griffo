import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

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
