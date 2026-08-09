import 'server-only'
import { db } from './db'

/**
 * Política de retenção.
 *
 * LGPD Art. 15 e GDPR Art. 5(1)(e): dado pessoal não pode ser guardado por
 * tempo indeterminado — a retenção precisa ser limitada à finalidade. A
 * plataforma guardava tudo para sempre: currículos de contas abandonadas,
 * eventos de webhook, logs de IA.
 *
 * Os prazos abaixo são o ponto de partida defensável, não uma decisão
 * jurídica fechada; ajustá-los é decisão do controlador (G9 no
 * PLANO-MELHORIAS).
 */

export const RETENTION_DAYS = {
  /** Eventos de webhook: só servem para conciliar pagamento. */
  webhookEvent: 90,
  /** Logs de IA: métricas operacionais, já sem conteúdo do currículo. */
  aiLog: 365,
  /** Trilha de auditoria: prazo mais longo, é registro de conformidade. */
  auditLog: 730,
  /**
   * Currículos de contas inativas. Prazo generoso de propósito: o currículo é
   * o produto que a pessoa pagou para ter, e apagá-lo cedo demais destrói
   * valor que ela adquiriu.
   */
  inactiveResume: 730,
}

function cutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

export interface PurgeReport {
  webhookEvents: number
  aiLogs: number
  auditLogs: number
  resumes: number
  errors: string[]
}

/**
 * Executa o expurgo. Idempotente e seguro para rodar repetidas vezes.
 *
 * Cada etapa é isolada: se uma falhar, as outras seguem, e o erro entra no
 * relatório em vez de abortar tudo.
 */
export async function runRetentionPurge(): Promise<PurgeReport> {
  const report: PurgeReport = {
    webhookEvents: 0,
    aiLogs: 0,
    auditLogs: 0,
    resumes: 0,
    errors: [],
  }

  const step = async (label: string, fn: () => Promise<number>) => {
    try {
      return await fn()
    } catch (e: any) {
      report.errors.push(`${label}: ${e?.message || e}`)
      return 0
    }
  }

  report.webhookEvents = await step('webhookEvent', async () => {
    const r = await db.webhookEvent.deleteMany({
      where: { createdAt: { lt: cutoff(RETENTION_DAYS.webhookEvent) } },
    })
    return r.count
  })

  report.aiLogs = await step('aiLog', async () => {
    const r = await db.aiLog.deleteMany({
      where: { createdAt: { lt: cutoff(RETENTION_DAYS.aiLog) } },
    })
    return r.count
  })

  report.auditLogs = await step('auditLog', async () => {
    const r = await db.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff(RETENTION_DAYS.auditLog) } },
    })
    return r.count
  })

  report.resumes = await step('resume', async () => {
    // Só currículos que não foram tocados no prazo. `updatedAt` e não
    // `createdAt`: quem revisou o currículo ano passado ainda o está usando.
    const r = await db.resume.deleteMany({
      where: { updatedAt: { lt: cutoff(RETENTION_DAYS.inactiveResume) } },
    })
    return r.count
  })

  return report
}
