import 'server-only'
import { db } from '../db'
import {
  getAppUrl,
  getDigestFrom,
  getDigestReplyTo,
  getResendApiKey,
  isDigestEnabled,
} from '../env'
import { buildDigest, digestLanguage, firstNameOf, type DigestOpportunity } from '../email/digest'
import { EmailSendError, listUnsubscribeHeaders, sendEmail, type SendDeps } from '../email/send'
import { unsubscribeUrl } from '../email/unsubscribe.server'
import type { OverallFit } from '../matching/compatibility'
import { DEFAULT_RADAR_PREFERENCES } from './curation'

/**
 * O envio do digest do Radar (§7.3 do documento de continuidade).
 *
 * ## Onde isto roda, e o que isso impõe
 *
 * Na mesma invocação do cron diário, depois da rodada. Não há alternativa: o
 * plano Hobby dá **um** cron por dia, então um segundo agendamento só para
 * e-mail não existe. Isso tem três consequências que estão no desenho:
 *
 * 1. O orçamento é o que sobrar dos 60s. Por isso a função recebe um `deadline`
 *    absoluto e para quando ele chega, em vez de tentar atender todo mundo e
 *    ser morta no meio — o que deixaria envios sem registro.
 * 2. Quem não couber hoje é atendido amanhã. Como a marca de "já avisado" está
 *    no alerta e não no usuário, ninguém perde aviso por ter ficado de fora.
 * 3. **`frequency: 'immediate'` não é imediato.** Com uma rodada por dia, o
 *    mais rápido que existe é diário, e é isso que acontece. Prometer imediato
 *    e entregar diário seria mentir na tela; o valor continua aceito e se
 *    comporta como diário até haver plano que sustente outra coisa.
 *
 * ## A ordem das operações não é arbitrária
 *
 * Envia primeiro, marca depois. Marcar antes tornaria uma falha de envio num
 * aviso perdido para sempre — e perdido em silêncio, que é o defeito que este
 * projeto mais paga para não ter. Marcar depois pode, no pior caso, repetir um
 * aviso se o processo morrer entre o envio e a escrita. Repetir é constrangedor;
 * sumir é dano.
 *
 * ## O que NÃO acontece aqui
 *
 * Um alerta cujo e-mail não saiu continua visível no produto. O e-mail é um
 * aviso sobre o Radar, não o Radar: a tela é a fonte da verdade, e nada aqui
 * altera alerta, perfil ou preferência de ninguém.
 */

/** Teto de usuários por rodada. Baixo de propósito: o e-mail divide os 60s com a rodada. */
const MAX_USERS_PER_RUN = 20

/** Teto de alertas lidos numa rodada, para a consulta não crescer com a base. */
const MAX_ALERTS_PER_RUN = 200

/**
 * A janela mínima entre dois digests do mesmo usuário.
 *
 * Vinte horas e não vinte e quatro: o cron não roda no mesmo minuto todo dia, e
 * uma janela de exatamente um dia faria um atraso de dois minutos pular o envio
 * inteiro — a pessoa receberia em dias alternados sem ninguém entender por quê.
 */
const DAILY_WINDOW_MS = 20 * 60 * 60 * 1000
const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export type DigestSkipReason =
  | 'radar_off'
  | 'too_soon'
  | 'no_email'
  | 'send_failed'
  | 'out_of_time'

export interface DigestUserResult {
  userId: string
  /** Quantos alertas entrariam (ou entraram) neste envio. */
  alerts: number
  sent: boolean
  skipped?: DigestSkipReason
}

export interface DigestRunSummary {
  /** `false` quando `RADAR_DIGEST_ENABLED` não está ligado — nada saiu. */
  enabled: boolean
  /** Usuários com alerta pendente considerados nesta rodada. */
  considered: number
  sent: number
  failed: number
  results: DigestUserResult[]
  /** A rodada parou pelo prazo, não por ter terminado. */
  ranOutOfTime: boolean
}

interface AlertRow {
  id: string
  userId: string
  overallFit: string
  matchJson: string
  signalScore: number
  job: {
    title: string
    company: string
    city: string | null
    region: string | null
    country: string | null
    applicationUrl: string
  }
}

/**
 * O local da vaga, com o que a vaga declarou — e só.
 *
 * §43: vaga sem local não ganha "remoto" nem "não informado" com cara de campo
 * preenchido. Devolve `null`, e a linha some da mensagem.
 */
function locationOf(job: AlertRow['job']): string | null {
  const parts = [job.city, job.region, job.country].map((p) => p?.trim()).filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

/**
 * A frase do matcher, como ela era quando o alerta saiu.
 *
 * Vem do `matchJson` gravado no alerta e não de um novo cálculo, pelo mesmo
 * motivo que a tela do Job Fit faz assim: o perfil pode ter mudado desde então,
 * e recalcular mudaria o que a pessoa foi avisada.
 *
 * Sem `headline` legível não há o que dizer sobre a vaga, e a vaga fica de fora
 * — não se preenche com frase genérica.
 */
function headlineOf(matchJson: string): string | null {
  try {
    const parsed = JSON.parse(matchJson) as { headline?: unknown }
    const headline = typeof parsed?.headline === 'string' ? parsed.headline.trim() : ''
    return headline || null
  } catch {
    return null
  }
}

function windowFor(frequency: string): number {
  return frequency === 'weekly' ? WEEKLY_WINDOW_MS : DAILY_WINDOW_MS
}

export async function sendPendingDigests(options: {
  /** Instante (epoch ms) em que esta rodada precisa ter terminado. */
  deadline: number
  maxUsers?: number
  deps?: SendDeps
}): Promise<DigestRunSummary> {
  const enabled = isDigestEnabled()
  const maxUsers = options.maxUsers ?? MAX_USERS_PER_RUN
  const results: DigestUserResult[] = []
  let sent = 0
  let failed = 0
  let ranOutOfTime = false

  // Quem tem alerta ainda não enviado. Uma consulta, independente do tamanho
  // da base — a lista de usuários é o que se pagina, não os alertas.
  const pending = await db.radarAlert.groupBy({
    by: ['userId'],
    where: { notifiedAt: null },
    _count: { _all: true },
  })

  if (pending.length === 0) {
    return { enabled, considered: 0, sent: 0, failed: 0, results: [], ranOutOfTime: false }
  }

  const candidateIds = pending.map((p) => p.userId)

  // Tudo o que decide o envio, em consultas por conjunto. O aviso da seção 6 do
  // documento de continuidade é explícito: N+1 aqui estoura os 60s.
  const [users, preferences, profiles, lastSends] = await Promise.all([
    db.user.findMany({
      where: { id: { in: candidateIds }, disabled: false },
      select: { id: true, email: true, name: true },
    }),
    db.radarPreference.findMany({
      where: { userId: { in: candidateIds } },
      select: { userId: true, frequency: true, maxPerDigest: true },
    }),
    db.professionalProfile.findMany({
      where: { userId: { in: candidateIds } },
      select: { userId: true, communicationLanguage: true },
    }),
    db.radarAlert.groupBy({
      by: ['userId'],
      where: { userId: { in: candidateIds }, notifiedAt: { not: null } },
      _max: { notifiedAt: true },
    }),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  const prefByUser = new Map(preferences.map((p) => [p.userId, p]))
  const langByUser = new Map(profiles.map((p) => [p.userId, p.communicationLanguage]))
  const lastSendByUser = new Map(lastSends.map((l) => [l.userId, l._max.notifiedAt]))

  // Quem esperou mais vai primeiro. É a mesma rotação justa da rodada: com teto
  // por invocação, a ordem é o que impede alguém de ficar para trás sempre.
  const ordered = [...candidateIds].sort((a, b) => {
    const at = lastSendByUser.get(a)?.getTime() ?? 0
    const bt = lastSendByUser.get(b)?.getTime() ?? 0
    return at - bt
  })

  const eligible: string[] = []
  for (const userId of ordered) {
    const pref = prefByUser.get(userId)
    const frequency = pref?.frequency ?? DEFAULT_RADAR_PREFERENCES.frequency
    const alerts = pending.find((p) => p.userId === userId)?._count._all ?? 0

    if (frequency === 'off') {
      // Os alertas ficam pendentes de propósito: se a pessoa religar o Radar,
      // o que apareceu enquanto estava desligado continua sendo notícia.
      results.push({ userId, alerts, sent: false, skipped: 'radar_off' })
      continue
    }

    const user = userById.get(userId)
    if (!user?.email) {
      results.push({ userId, alerts, sent: false, skipped: 'no_email' })
      continue
    }

    const last = lastSendByUser.get(userId)
    if (last && Date.now() - last.getTime() < windowFor(frequency)) {
      results.push({ userId, alerts, sent: false, skipped: 'too_soon' })
      continue
    }

    eligible.push(userId)
    if (eligible.length >= maxUsers) break
  }

  if (eligible.length === 0) {
    return { enabled, considered: results.length, sent, failed, results, ranOutOfTime }
  }

  // Os alertas dos escolhidos, numa consulta só. `signalScore` ordena e nunca
  // é exibido — ver §9 e §17.
  const alertRows = (await db.radarAlert.findMany({
    where: { userId: { in: eligible }, notifiedAt: null },
    orderBy: [{ signalScore: 'desc' }, { createdAt: 'desc' }],
    take: MAX_ALERTS_PER_RUN,
    select: {
      id: true,
      userId: true,
      overallFit: true,
      matchJson: true,
      signalScore: true,
      job: {
        select: {
          title: true,
          company: true,
          city: true,
          region: true,
          country: true,
          applicationUrl: true,
        },
      },
    },
  })) as AlertRow[]

  const byUser = new Map<string, AlertRow[]>()
  for (const row of alertRows) {
    const list = byUser.get(row.userId)
    if (list) list.push(row)
    else byUser.set(row.userId, [row])
  }

  const radarUrl = `${getAppUrl()}/?view=radar`

  for (const userId of eligible) {
    if (Date.now() >= options.deadline) {
      ranOutOfTime = true
      results.push({ userId, alerts: byUser.get(userId)?.length ?? 0, sent: false, skipped: 'out_of_time' })
      continue
    }

    const user = userById.get(userId)!
    const pref = prefByUser.get(userId)
    const maxPerDigest = pref?.maxPerDigest ?? DEFAULT_RADAR_PREFERENCES.maxPerDigest
    const rows = (byUser.get(userId) ?? []).slice(0, maxPerDigest)

    const opportunities: DigestOpportunity[] = []
    const includedIds: string[] = []
    for (const row of rows) {
      const headline = headlineOf(row.matchJson)
      // Alerta sem frase legível não vira cartão com texto inventado.
      if (!headline) continue
      opportunities.push({
        title: row.job.title,
        company: row.job.company,
        location: locationOf(row.job),
        overallFit: row.overallFit as OverallFit,
        headline,
        url: row.job.applicationUrl,
      })
      includedIds.push(row.id)
    }

    if (opportunities.length === 0) {
      results.push({ userId, alerts: 0, sent: false })
      continue
    }

    const unsubscribe = unsubscribeUrl(userId)
    const content = buildDigest({
      lang: digestLanguage(langByUser.get(userId)),
      firstName: firstNameOf(user.name),
      opportunities,
      radarUrl,
      unsubscribeUrl: unsubscribe,
    })

    if (!enabled) {
      // Modo de conferência: apura quem receberia o quê e registra, sem mandar
      // nada. É o que permite ler o conteúdo antes de arriscar a reputação do
      // domínio, como manda o §7.3.
      console.info(
        `[radar/digest] (desligado) ${user.email} receberia ${opportunities.length} ` +
          `oportunidade(s) — assunto: ${content.subject}`
      )
      results.push({ userId, alerts: opportunities.length, sent: false })
      continue
    }

    try {
      await sendEmail(
        {
          to: user.email,
          subject: content.subject,
          html: content.html,
          text: content.text,
          headers: listUnsubscribeHeaders(unsubscribe),
        },
        // Lida aqui e não dentro do envio: `getResendApiKey` lança
        // `ConfigError` quando a chave não existe, e esse erro precisa cair no
        // `catch` desta iteração — não derrubar a rodada inteira.
        { apiKey: getResendApiKey(), from: getDigestFrom(), replyTo: getDigestReplyTo() },
        options.deps
      )

      // Só depois do envio bem-sucedido. Ver o cabeçalho deste arquivo.
      await db.radarAlert.updateMany({
        where: { id: { in: includedIds } },
        data: { notifiedAt: new Date() },
      })

      sent++
      results.push({ userId, alerts: opportunities.length, sent: true })
    } catch (e: any) {
      failed++
      // O detalhe fica no log e em lugar nenhum além dele — §10.9. Os alertas
      // continuam sem marca, e a rodada de amanhã tenta de novo.
      const detail = e instanceof EmailSendError ? e.message : String(e?.message || e)
      console.error(`[radar/digest] falha ao enviar para o usuário ${userId}: ${detail}`)
      results.push({ userId, alerts: opportunities.length, sent: false, skipped: 'send_failed' })
    }
  }

  return { enabled, considered: results.length, sent, failed, results, ranOutOfTime }
}
