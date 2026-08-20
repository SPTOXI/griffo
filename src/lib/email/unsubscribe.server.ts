import 'server-only'
import { getAppUrl, getSessionSecret } from '../env'
import { unsubscribeToken, userIdFromToken } from './unsubscribe'

/**
 * O descadastro, já ligado ao ambiente.
 *
 * A separação existe porque `lib/env.ts` importa `server-only`: um módulo que
 * o importe não pode ser exercitado por teste unitário. A matemática do token
 * — que é a parte que erra em silêncio — fica em `unsubscribe.ts`, com teste;
 * aqui só passa o segredo adiante.
 */

/** A URL absoluta de descadastro. Link relativo não existe dentro de uma caixa de entrada. */
export function unsubscribeUrl(userId: string): string {
  const token = unsubscribeToken(userId, getSessionSecret())
  return `${getAppUrl()}/api/radar/unsubscribe?t=${encodeURIComponent(token)}`
}

/** O userId de um token recebido pela rota, ou `null`. */
export function userIdFromRequestToken(token: string | null | undefined): string | null {
  return userIdFromToken(token, getSessionSecret())
}
