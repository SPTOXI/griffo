import 'server-only'
import { db } from './db'
import { purgeAgedJobs, purgeClosedJobs } from './jobs/lifecycle.server'
import { DELETE_AFTER_PUBLISHED_DAYS, PURGE_CLOSED_AFTER_DAYS } from './jobs/lifecycle'

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
  /**
   * Vagas encerradas. Não são dado pessoal — são anúncio público que já saiu
   * do ar, e guardá-los para sempre faz o banco crescer sem teto.
   *
   * Vaga sobre a qual alguém foi avisado sobrevive a ESTE prazo — `RadarAlert`
   * cai junto por cascata. Ela não sobrevive ao `agedJob` abaixo. Ver
   * `jobs/lifecycle.server.ts`.
   */
  closedJob: PURGE_CLOSED_AFTER_DAYS,
  /**
   * Vagas velhas, apagadas **com alerta e tudo**.
   *
   * O prazo maior que `closedJob` não é acaso: aquele é o caminho suave (só
   * vaga sem alerta), este é o duro, e o duro precisa de mais folga.
   *
   * O que tornou isto aceitável foi `RadarOfferLog`: o registro de que alguém
   * foi avisado deixou de depender da linha da vaga, então apagá-la não destrói
   * mais o histórico de ninguém.
   */
  agedJob: DELETE_AFTER_PUBLISHED_DAYS,
  /**
   * O histórico de vagas ofertadas (`RadarOfferLog`).
   *
   * **É dado pessoal** — diz o que uma pessoa identificável procurou e recebeu
   * —, e por isso precisa de teto como qualquer outro neste arquivo. Sem esta
   * linha, o módulo que existe para limitar retenção estaria guardando para
   * sempre justamente o dado que ele acabou de criar.
   *
   * Dois anos, alinhado ao currículo inativo: é memória da própria pessoa
   * sobre a própria busca, e bem além dos 180 dias em que a vaga original
   * deixa de existir.
   */
  radarOfferLog: 730,
}

function cutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

export interface PurgeReport {
  webhookEvents: number
  aiLogs: number
  auditLogs: number
  resumes: number
  /** Vagas encerradas há tempo e sem alerta nenhum apontando para elas. */
  closedJobs: number
  /** Vagas publicadas há mais de 180 dias, apagadas com alerta e tudo. */
  agedJobs: number
  /** Linhas do histórico de ofertas além do prazo de retenção. */
  offerLogs: number
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
    closedJobs: 0,
    agedJobs: 0,
    offerLogs: 0,
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

  /**
   * O teto do histórico de ofertas vem ANTES dos dois expurgos de vaga, de
   * propósito.
   *
   * Esta rota tem `maxDuration = 60`, e `purgeAgedJobs` pode gastar quase tudo
   * num acervo acumulado (até 20 transações de 20s). Se ele viesse antes, uma
   * execução carregada seria interrompida sem nunca chegar aqui, e o teto de
   * retenção de DADO PESSOAL nunca se aplicaria — enquanto a etapa que só
   * economiza espaço rodaria sempre. A ordem certa é a inversa: conformidade
   * primeiro, faxina depois.
   */
  report.offerLogs = await step('radarOfferLog', async () => {
    const r = await db.radarOfferLog.deleteMany({
      where: { offeredAt: { lt: cutoff(RETENTION_DAYS.radarOfferLog) } },
    })
    return r.count
  })

  /**
   * Vagas encerradas não são dado pessoal — são anúncio público fora do ar. O
   * motivo de apagá-las é espaço, não conformidade, e por isso o critério é
   * diferente: vaga sobre a qual alguém foi avisado fica — até os 180 dias,
   * quando `purgeAgedJobs` abaixo a leva de qualquer jeito.
   */
  report.closedJobs = await step('closedJob', () => purgeClosedJobs())

  /**
   * Aos 180 dias a vaga sai, com alerta e tudo.
   *
   * O que antes impedia isto — não destruir o registro de que alguém foi
   * avisado — passou a viver em `RadarOfferLog`, que guarda cargo, empresa,
   * país e data sem referência à vaga, e por isso sobrevive ao apagamento.
   * A pessoa perde o anúncio de uma vaga que não existe há meio ano, e mantém
   * a memória de que ela lhe foi oferecida.
   */
  report.agedJobs = await step('agedJob', () => purgeAgedJobs())

  return report
}
