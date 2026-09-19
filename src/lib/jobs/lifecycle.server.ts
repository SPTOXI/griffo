import 'server-only'
import { db } from '../db'
import {
  DELETE_AFTER_PUBLISHED_DAYS,
  PURGE_CLOSED_AFTER_DAYS,
  STALE_AFTER_DAYS,
  agedJobPurgeWhere,
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
 * Apaga vaga velha demais — **com alerta e tudo**, preservando a memória.
 *
 * ## Dois critérios, e o `closedAt` não é detalhe
 *
 * Só sai vaga que é velha **e** já está encerrada. A primeira versão disto
 * olhava só a idade, e teria criado um laço: a vaga publicada há 200 dias que
 * a fonte ainda lista seria apagada aqui e **recriada pela coleta seguinte**,
 * com id novo. Além do churn, o id novo quebra o "não se avisa duas vezes" do
 * §15 — a mesma vaga voltaria a ser avisada como se fosse inédita.
 *
 * O que fica de fora por causa disso — vaga velha que a fonte insiste em
 * listar — já está invisível pelo filtro de `FRESH_MAX_AGE_DAYS`. Ela ocupa
 * linha no banco e não aparece para ninguém, e é uma troca barata perto de um
 * laço de apaga-e-recria.
 *
 * ## A memória é preservada AQUI, não em outro lugar
 *
 * Antes de apagar, cada alerta das vagas condenadas vira linha em
 * `RadarOfferLog` — cargo, empresa, país e a data em que o alerta saiu. Só
 * então o apagamento acontece, na mesma transação.
 *
 * Fazer isso aqui, e não num script de backfill à parte, é o que fecha o
 * defeito que derrubou o PR #71 **e** o que a revisão apontou nesta versão: o
 * log começa a ser escrito no dia do deploy, então todo alerta anterior a ele
 * não teria cópia nenhuma. Amarrado ao expurgo, o histórico é preservado por
 * construção — não existe ordem de execução em que se apague algo sem antes
 * copiá-lo, nem há um passo manual que alguém possa esquecer de rodar.
 *
 * `skipDuplicates` com o `@@unique([userId, jobId])` torna a cópia idempotente:
 * a oferta já registrada na hora do alerta não vira linha dobrada.
 *
 * **Vaga sem `publishedAt` nunca é apagada por aqui.** Apagar de forma
 * irreversível por causa de um campo que a fonte não mandou é a pior versão de
 * "eliminar por dado ausente".
 *
 * Diferente de `closeStaleJobs`, **este relança**: quem chama é o
 * `runRetentionPurge`, que já isola cada etapa e registra o erro no relatório.
 * Engolir aqui faria um expurgo permanentemente quebrado parecer um expurgo
 * vazio no painel do admin.
 */
export async function purgeAgedJobs(
  options: { now?: Date; afterDays?: number; batchSize?: number } = {}
): Promise<number> {
  const now = options.now ?? new Date()
  const afterDays = options.afterDays ?? DELETE_AFTER_PUBLISHED_DAYS
  // Lote pequeno de propósito. Cada iteração é uma transação que copia
  // memórias E apaga vagas em cascata (`RadarAlert` vai junto), e o teto padrão
  // de transação do Prisma é de 5s: 500 vagas com cascata estouram esse teto, a
  // etapa falha, e falha IGUAL em toda tentativa seguinte — um expurgo
  // permanentemente travado. Cem cabe com folga, e o laço de 20 lotes continua
  // dando 2.000 vagas por execução.
  const batchSize = options.batchSize ?? 100

  let deleted = 0

  for (let batch = 0; batch < 20; batch++) {
    const candidates = await db.job.findMany({
      // O recorte mora em `agedJobPurgeWhere` — é a regra mais perigosa do
      // módulo e merece ser lida e testada como valor, não como consulta.
      where: agedJobPurgeWhere(now, afterDays),
      select: {
        id: true,
        title: true,
        company: true,
        country: true,
        radarAlerts: { select: { userId: true, createdAt: true } },
      },
      take: batchSize,
    })

    if (candidates.length === 0) break

    const memories = candidates.flatMap((job) =>
      job.radarAlerts.map((alert) => ({
        userId: alert.userId,
        jobId: job.id,
        title: job.title,
        company: job.company,
        country: job.country,
        offeredAt: alert.createdAt,
      }))
    )

    // Copiar e apagar numa transação só: se o apagamento acontecesse sem a
    // cópia ter entrado, o histórico sumiria — e é para impedir exatamente
    // isso que esta função foi reescrita.
    await db.$transaction(
      async (tx) => {
        await tx.radarOfferLog.createMany({ data: memories, skipDuplicates: true })
        await tx.job.deleteMany({ where: { id: { in: candidates.map((c) => c.id) } } })
      },
      // Forma interativa, e não o array, só por causa do `timeout`: a forma de
      // array não aceita a opção, e o padrão de 5s é curto para um apagamento
      // em cascata com o banco em outra região. Preferir um lote lento a um
      // lote que estoura — porque um lote que estoura falha IGUAL em toda
      // tentativa seguinte, travando o expurgo para sempre.
      { timeout: 20_000 }
    )

    deleted += candidates.length
    if (candidates.length < batchSize) break
  }

  return deleted
}
