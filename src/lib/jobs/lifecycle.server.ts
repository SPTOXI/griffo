import 'server-only'
import { db } from '../db'
import {
  DELETE_AFTER_PUBLISHED_DAYS,
  PURGE_CLOSED_AFTER_DAYS,
  STALE_AFTER_DAYS,
  daysAgo,
} from './lifecycle'

export interface StaleCloseReport {
  closed: number
  sourcesConsidered: number
  sourcesSkipped: number
}

/**
 * Encerra as vagas que pararam de aparecer.
 *
 * Roda por FONTE, e não numa consulta só, porque a trava do §12 é por fonte: a
 * pergunta "a coleta desta fonte está saudável?" só tem resposta olhando cada
 * uma. Uma consulta única sobre todas as vagas fecharia as de uma fonte
 * quebrada junto com as de uma fonte saudável.
 *
 * Nunca lança. É manutenção, e derrubar a rodada do Radar por causa dela
 * trocaria a entrega pelo cuidado com a entrega.
 */
export async function closeStaleJobs(options: { now?: Date; staleDays?: number } = {}): Promise<StaleCloseReport> {
  const now = options.now ?? new Date()
  const staleDays = options.staleDays ?? STALE_AFTER_DAYS
  const cutoff = daysAgo(now, staleDays)

  const report: StaleCloseReport = { closed: 0, sourcesConsidered: 0, sourcesSkipped: 0 }

  try {
    const sources = await db.jobSource.findMany({
      select: { id: true, slug: true, lastSuccessfulCollection: true },
    })

    for (const source of sources) {
      report.sourcesConsidered++

      // A fonte precisa estar coletando bem DENTRO da janela. Se ela está
      // parada há mais tempo que isso, a vaga não reaparecer é falha nossa —
      // fechar seria o erro do §12 em câmera lenta.
      if (!source.lastSuccessfulCollection || source.lastSuccessfulCollection < cutoff) {
        report.sourcesSkipped++
        continue
      }

      const result = await db.job.updateMany({
        where: { sourceId: source.id, closedAt: null, lastSeenAt: { lt: cutoff } },
        data: {
          closedAt: now,
          closedReason: `Não reapareceu em nenhuma coleta por ${staleDays} dias.`,
        },
      })

      report.closed += result.count
    }
  } catch (e: any) {
    console.warn('[jobs] encerramento por tempo falhou:', e?.message || e)
  }

  return report
}

/**
 * Apaga vagas encerradas há muito tempo.
 *
 * **Vaga com alerta nunca é apagada.** `RadarAlert` tem `onDelete: Cascade`,
 * então apagar a vaga apagaria junto o registro de que alguém foi avisado sobre
 * ela — destruindo o histórico da pessoa para economizar espaço. São poucas
 * linhas; não vale a troca.
 *
 * Feito em lotes para não montar uma transação gigante no primeiro expurgo,
 * quando o acúmulo pode ser grande.
 */
export async function purgeClosedJobs(
  options: { now?: Date; afterDays?: number; batchSize?: number } = {}
): Promise<number> {
  const now = options.now ?? new Date()
  const afterDays = options.afterDays ?? PURGE_CLOSED_AFTER_DAYS
  const batchSize = options.batchSize ?? 500
  const cutoff = daysAgo(now, afterDays)

  let deleted = 0

  try {
    // Teto de lotes: manutenção não pode virar uma rodada que não termina.
    for (let batch = 0; batch < 20; batch++) {
      const candidates = await db.job.findMany({
        where: { closedAt: { lt: cutoff }, radarAlerts: { none: {} } },
        select: { id: true },
        take: batchSize,
      })

      if (candidates.length === 0) break

      const result = await db.job.deleteMany({ where: { id: { in: candidates.map((c) => c.id) } } })
      deleted += result.count

      if (candidates.length < batchSize) break
    }
  } catch (e: any) {
    console.warn('[jobs] expurgo de vagas encerradas falhou:', e?.message || e)
  }

  return deleted
}

/**
 * Apaga vaga velha demais — **com alerta e tudo**.
 *
 * Isto desfaz de propósito a regra de `purgeClosedJobs` logo acima ("vaga com
 * alerta nunca é apagada"). A troca só é aceitável porque o que aquela regra
 * protegia mudou de lugar: o registro de que alguém foi avisado vive agora em
 * `RadarOfferLog`, desnormalizado (cargo, empresa, país, data) e sem relação
 * com `Job`, portanto imune ao `onDelete: Cascade` que leva o `RadarAlert`
 * junto.
 *
 * Em outras palavras: o alerta some, a memória fica. Apagar isto antes de o
 * log existir destruiria histórico — foi exatamente o defeito que reverteu o
 * PR #71.
 *
 * **Vaga sem `publishedAt` nunca é apagada por aqui.** Apagar de forma
 * irreversível por causa de um campo que a fonte não mandou é a pior versão de
 * "eliminar por dado ausente".
 *
 * Em lotes, e nunca lança — mesmo raciocínio de `purgeClosedJobs`.
 */
export async function purgeAgedJobs(
  options: { now?: Date; afterDays?: number; batchSize?: number } = {}
): Promise<number> {
  const now = options.now ?? new Date()
  const afterDays = options.afterDays ?? DELETE_AFTER_PUBLISHED_DAYS
  const batchSize = options.batchSize ?? 500
  const cutoff = daysAgo(now, afterDays)

  let deleted = 0

  try {
    for (let batch = 0; batch < 20; batch++) {
      const candidates = await db.job.findMany({
        where: { publishedAt: { not: null, lt: cutoff } },
        select: { id: true },
        take: batchSize,
      })

      if (candidates.length === 0) break

      const result = await db.job.deleteMany({ where: { id: { in: candidates.map((c) => c.id) } } })
      deleted += result.count

      if (candidates.length < batchSize) break
    }
  } catch (e: any) {
    console.warn('[jobs] expurgo por idade falhou:', e?.message || e)
  }

  return deleted
}
