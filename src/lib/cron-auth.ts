import 'server-only'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * `Authorization: Bearer <CRON_SECRET>` comparado em tempo constante.
 *
 * A comparação com `!==` vaza, pelo tempo de resposta, quantos caracteres do
 * início batem. Os hashes têm tamanho fixo, então `timingSafeEqual` nunca
 * recebe buffers de tamanhos diferentes.
 */
export function cronAuthorized(req: Request, secret: string): boolean {
  const sent = req.headers.get('authorization') || ''
  const a = createHash('sha256').update(sent).digest()
  const b = createHash('sha256').update(`Bearer ${secret}`).digest()
  return timingSafeEqual(a, b)
}
