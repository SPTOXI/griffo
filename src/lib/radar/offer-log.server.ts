import 'server-only'
import { db } from '../db'

/**
 * O que o Radar já ofereceu a esta pessoa.
 *
 * ## Por que existe separado do alerta
 *
 * `RadarAlert` é o aviso vivo: some quando a vaga é apagada, porque não faz
 * sentido abrir um aviso de uma vaga que não existe mais. `RadarOfferLog` é a
 * memória: quatro campos copiados, sem relação com `Job`, e por isso
 * sobrevive. Aos 180 dias a vaga sai do banco e esta lista continua inteira.
 *
 * É a contrapartida que torna o apagamento aceitável — e uma contrapartida que
 * ninguém consegue ler não é contrapartida nenhuma, que era o buraco desta
 * implementação antes desta função existir.
 */

/** Teto de uma consulta. Alto o bastante para caber um ano de Radar. */
export const OFFER_LOG_MAX = 500

export interface OfferLogEntry {
  title: string
  company: string
  country: string | null
  offeredAt: Date
}

/**
 * As ofertas de uma pessoa, da mais recente para a mais antiga.
 *
 * Não devolve `jobId`: ele existe na tabela para deduplicar a escrita, não
 * para ser mostrado — e um id de vaga que pode já ter sido apagada não é dado
 * útil para quem lê. Fora isso, é exatamente o que foi pedido: cargo, empresa,
 * país e a data em que apareceu no Radar.
 */
export async function listOfferLog(
  userId: string,
  options: { take?: number } = {}
): Promise<OfferLogEntry[]> {
  const take = Math.min(options.take ?? OFFER_LOG_MAX, OFFER_LOG_MAX)

  return db.radarOfferLog.findMany({
    where: { userId },
    select: { title: true, company: true, country: true, offeredAt: true },
    orderBy: { offeredAt: 'desc' },
    take,
  })
}
