import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * Criptografia simétrica autenticada (AES-256-GCM) para segredos guardados no
 * banco: `AiApiKey.apiKey` e os valores sensíveis de `SystemConfig`
 * (chave da Stripe, webhook secret, chaves das IAs).
 *
 * Antes disso todos ficavam em texto puro nas tabelas. Qualquer acesso de
 * leitura ao banco — um backup, um dump, uma credencial de leitura vazada,
 * o próprio painel do Supabase — entregava as chaves de produção prontas
 * para uso. O GCM também autentica: um valor adulterado falha ao decifrar em
 * vez de devolver lixo silenciosamente.
 *
 * Compatível com o que já está gravado: `decryptSecret` devolve intacto
 * qualquer valor sem o prefixo `gwenc.v1.`, então os segredos em texto puro
 * continuam funcionando e passam a ser cifrados quando forem regravados.
 */

const PREFIX = 'gwenc.v1.'
const IV_BYTES = 12 // recomendado para GCM
const KEY_BYTES = 32

let cachedKey: Buffer | null = null

/**
 * Deriva a chave de `ENCRYPTION_KEY`, que deve ter 32 bytes em hex (64 chars)
 * ou base64. Gere com: `openssl rand -hex 32`.
 *
 * Preguiçosa pelo mesmo motivo de `lib/env.ts`: validar no import transformaria
 * a variável ausente em erro de build, derrubando o deploy inteiro.
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey

  const raw = process.env.ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error(
      'Variável de ambiente obrigatória ausente: ENCRYPTION_KEY. ' +
        'Gere um valor com: openssl rand -hex 32'
    )
  }

  let key: Buffer
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex')
  } else {
    key = Buffer.from(raw, 'base64')
  }

  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY inválida: são necessários ${KEY_BYTES} bytes ` +
        `(64 caracteres hex), foram fornecidos ${key.length}.`
    )
  }

  cachedKey = key
  return key
}

/** `true` se o valor já está cifrado por esta função. */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

/**
 * Cifra um segredo. Lança se `ENCRYPTION_KEY` não estiver configurada — a
 * gravação falha em vez de persistir texto puro sem avisar.
 *
 * Idempotente: um valor já cifrado é devolvido como está.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext
  if (isEncrypted(plaintext)) return plaintext

  const key = getEncryptionKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    PREFIX + iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

/**
 * Decifra um segredo gravado por `encryptSecret`.
 *
 * Valores sem o prefixo são devolvidos intactos: é o caminho dos segredos
 * gravados antes desta mudança. Um valor cifrado que não decifre lança —
 * devolver texto corrompido para uma chave de API só transformaria o problema
 * numa falha de autenticação confusa lá na frente.
 */
export function decryptSecret(value: string): string {
  if (!value || !isEncrypted(value)) return value

  const parts = value.slice(PREFIX.length).split('.')
  if (parts.length !== 3) {
    throw new Error('Segredo cifrado com formato inválido.')
  }

  const [ivB64, tagB64, ctB64] = parts
  const key = getEncryptionKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error(
      'Falha ao decifrar segredo: a ENCRYPTION_KEY não confere com a usada na gravação, ' +
        'ou o valor foi adulterado.'
    )
  }
}

/**
 * Decifra tolerando falha, para os caminhos de leitura que não podem derrubar
 * a requisição inteira (o registro de provedores tenta vários). Devolve string
 * vazia e registra no log — o provedor é então tratado como não configurado.
 */
export function tryDecryptSecret(value: string, label: string): string {
  try {
    return decryptSecret(value)
  } catch (e: any) {
    console.error(`[crypto] Não foi possível decifrar ${label}:`, e?.message || e)
    return ''
  }
}

/** Prévia segura para exibição no painel: nunca revela o segredo inteiro. */
export function maskSecret(plaintextOrCipher: string): string {
  const value = isEncrypted(plaintextOrCipher)
    ? tryDecryptSecret(plaintextOrCipher, 'valor para máscara')
    : plaintextOrCipher

  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`
}
