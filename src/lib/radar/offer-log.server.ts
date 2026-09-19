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

/**
 * O que este log NÃO é, e é decisão, não esquecimento.
 *
 * Ele é **append-only**: uma oferta registrada nunca é removida porque o
 * alerta correspondente foi retirado depois. `pruneUnfoundedAlerts` existe
 * para parar de mostrar uma RECOMENDAÇÃO que envelheceu mal — o perfil mudou,
 * a vaga fechou — e isso não desfaz o fato de que aquela vaga apareceu no
 * Radar da pessoa naquele dia.
 *
 * A distinção importa porque as duas coisas têm formas diferentes: o alerta
 * carrega nota, recomendação e o match inteiro; esta lista carrega cargo,
 * empresa, país e data. Uma diz "candidate-se a isto"; a outra diz "isto passou
 * por aqui". Retirar a primeira é correto; reescrever a segunda seria apagar o
 * passado da pessoa para poupar a nossa vergonha.
 */

/** O mínimo para preservar um alerta como memória, antes de ele ser apagado. */
export interface AlertToPreserve {
  userId: string
  jobId: string
  createdAt: Date
  job: { title: string; company: string; country: string | null } | null
}

/**
 * Copia alertas para o log ANTES de eles serem apagados.
 *
 * Chamado de todo lugar que apaga `RadarAlert`. É essa simetria que sustenta a
 * promessa do módulo: **nenhum alerta é destruído sem virar memória antes**.
 *
 * A primeira versão desta funcionalidade preservava só no expurgo de vagas aos
 * 180 dias, e a revisão mostrou o buraco: `pruneUnfoundedAlerts` roda a cada
 * rodada do Radar e apaga alerta muito antes disso — inclusive todo o
 * histórico anterior ao deploy, que nunca chegaria ao expurgo para ser
 * copiado.
 *
 * Idempotente pelo `@@unique([userId, jobId])`, e **nunca lança** — mas
 * SINALIZA a falha, e isso é o ponto.
 *
 * A primeira versão devolvia só a contagem e engolia o erro. Quem chama
 * apagava em seguida de qualquer jeito, então uma falha aqui — a tabela ainda
 * não existir no banco, antes do `prisma db push`, é o caso óbvio — destruía
 * em silêncio exatamente o histórico que esta função existe para salvar.
 *
 * Agora quem chama sabe, e a regra é simples: **memória não preservada,
 * alerta não apagado**. O alerta sobrevive mais uma rodada, o que não custa
 * nada, e a rodada seguinte tenta de novo.
 */
export async function preserveOffers(
  alerts: readonly AlertToPreserve[]
): Promise<{ ok: boolean; count: number }> {
  const memories = alerts
    .filter((a) => a.job)
    .map((a) => ({
      userId: a.userId,
      jobId: a.jobId,
      title: a.job!.title,
      company: a.job!.company,
      country: a.job!.country,
      offeredAt: a.createdAt,
    }))

  if (memories.length === 0) return { ok: true, count: 0 }

  try {
    const res = await db.radarOfferLog.createMany({ data: memories, skipDuplicates: true })
    return { ok: true, count: res.count }
  } catch (e: any) {
    console.error(
      `[radar] preservação de ofertas FALHOU — apagamento abortado para não perder histórico: ${e?.message || e}`
    )
    return { ok: false, count: 0 }
  }
}

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
