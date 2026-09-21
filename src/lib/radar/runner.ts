import 'server-only'
import { db } from '../db'
// `sourceservesMarkets` NÃO entra aqui de propósito, e estava importado sem uso.
// Coletar é por FONTE e serve a todo mundo: filtrar a coleta pelo mercado de
// quem está na fila desta rodada faria a mesma fonte ser coletada ou não
// conforme quem calhou de ser atendido, e a vaga sumiria do banco por acaso.
// O lugar de filtrar por mercado é o filtro duro, por usuário.
import { safeCollect, type JobSourceAdapter } from '../jobs/adapter'
import { decideCollection, sourceStateAfter } from '../jobs/collection'
import { isTooOldToImport,freshOpenJobWhere } from '../jobs/lifecycle'
import { preserveOffers } from './offer-log.server'
import { closeStaleJobs, type StaleCloseReport } from '../jobs/lifecycle.server'
import { dedupeBatch } from '../jobs/dedup'
import type { LegitimacyJobRow } from '../jobs/legitimacy'
import { assessLegitimacyForJobs } from '../jobs/legitimacy.server'
import { normalizeJob } from '../jobs/normalize'
import { JobNormalizationError, type NormalizedJob } from '../jobs/types'
import { filterJobs, hasMatchableSignal, marketScopeOf } from '../matching/filters'
import { internalSignalScore, matchJob } from '../matching/compatibility'
import { fromRecord as profileFromRecord, type ProfessionalProfile } from '../profile'
import { curate, DEFAULT_RADAR_PREFERENCES, type EvaluatedOpportunity, type RadarPreferences } from './curation'

/**
 * A rodada do Radar — coleta, avalia, e decide se interrompe alguém.
 *
 * ## O que roda aqui, e por quê
 *
 * O §28 é explícito sobre a diferença entre isto e a análise de currículo:
 *
 * > O atual sistema de análise depende de consulta de status para
 * > continuar/reassumir. Isso funciona para operações iniciadas pelo usuário.
 * > O Radar é diferente. Ele precisa funcionar mesmo quando ninguém estiver
 * > olhando a tela.
 *
 * Por isso a entrada é um cron, e não uma requisição de usuário.
 *
 * ## Duas metades independentes
 *
 * **Coletar** é por FONTE e serve a todo mundo. **Avaliar** é por USUÁRIO e
 * serve a um só. Separá-las é o que evita coletar a mesma vaga uma vez por
 * pessoa — e é a base da economia do §27: a vaga é normalizada uma vez, e a
 * compatibilidade é calculada por par (vaga, usuário).
 *
 * ## Limite por invocação, e rotação justa
 *
 * Uma função serverless tem teto de tempo. Em vez de tentar atender todo mundo
 * e ser interrompida no meio — deixando metade dos usuários sem rodada e sem
 * registro disso —, cada invocação atende um número fixo, escolhendo sempre
 * quem esperou mais (`lastRunAt` mais antigo). A fila gira sozinha e ninguém
 * fica para trás indefinidamente.
 *
 * ## Sobre o matching não usar IA
 *
 * O §16 desenha o fluxo com "Matching IA" depois do filtro duro. Esta
 * implementação usa o matcher determinístico de `lib/matching/` no lugar.
 *
 * É uma escolha, não um esquecimento: o matcher determinístico é barato,
 * reprodutível, testável e — o que mais importa aqui — incapaz de inventar uma
 * evidência que não existe. Numa rodada que avalia milhares de pares sem
 * ninguém olhando, essas três propriedades valem mais que a profundidade de
 * leitura que a IA acrescentaria.
 *
 * A camada de IA cabe depois, sobre as poucas vagas que já passaram por aqui —
 * que é onde ela custa pouco e acrescenta muito. Ver os próximos passos na
 * auditoria.
 */

/**
 * Quantos usuários uma invocação atende.
 *
 * Dimensionado para caber no teto de 60s da função no plano Hobby da Vercel,
 * que é o que também limita o cron a uma vez por dia. Não é o número certo do
 * produto: é o número que o plano permite. No Pro, sobe junto com `maxDuration`
 * e com a frequência do cron.
 */
const USERS_PER_RUN = 10

/** Vagas consideradas por usuário. Teto de segurança, não meta. */
const MAX_JOBS_PER_USER = 500

/**
 * Vagas por ida ao banco na gravação.
 *
 * O laço antigo fazia duas consultas por vaga — uma para saber se ela já
 * existia, outra para gravar. Com a função em `iad1` e o banco em `sa-east-1`,
 * cada ida custa mais de cem milissegundos, e 84 vagas viravam meio minuto de
 * espera de rede. Em lote, o mesmo trabalho são três idas: descobrir o que já
 * existe, criar o que é novo, atualizar o resto.
 *
 * O tamanho existe para fontes grandes: uma consulta com dez mil chaves no
 * `IN` deixa de ser barata do lado do banco.
 */
const WRITE_CHUNK = 250

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export interface CollectionRunResult {
  sourceSlug: string
  collected: number
  inserted: number
  updated: number
  duplicates: number
  closed: number
  /** Vagas novas recusadas por já nascerem mais velhas que o corte de expurgo. */
  skippedTooOld: number
  status: string
  explanation: string
}

/**
 * Coleta de uma fonte, do início ao fim.
 *
 * A ordem importa: normaliza, deduplica, grava, e SÓ ENTÃO decide fechamentos.
 * Decidir antes de gravar usaria um retrato desatualizado do que está aberto.
 */
export async function runCollection(
  adapter: JobSourceAdapter,
  options: { timeBudgetMs: number; deadlineAt?: number }
): Promise<CollectionRunResult> {
  // Sem prazo declarado, não há prazo. Quem chama de um cron passa um; quem
  // chama de um teste não precisa.
  const deadlineAt = options.deadlineAt ?? Number.POSITIVE_INFINITY
  const slug = adapter.descriptor.slug

  const source = await db.jobSource.upsert({
    where: { slug },
    create: {
      slug,
      name: adapter.descriptor.name,
      kind: adapter.descriptor.kind,
      markets: JSON.stringify(adapter.descriptor.markets),
    },
    update: { name: adapter.descriptor.name },
  })

  const result = await safeCollect(adapter, { timeBudgetMs: options.timeBudgetMs })

  // Normaliza o que veio. Uma vaga sem o mínimo é descartada aqui, e o descarte
  // NÃO é falha da coleta: a fonte respondeu, só mandou um item inútil.
  const normalized: NormalizedJob[] = []
  for (const raw of result.jobs) {
    try {
      normalized.push(normalizeJob(raw, { sourceSlug: slug }))
    } catch (e) {
      if (!(e instanceof JobNormalizationError)) throw e
    }
  }

  const { unique, duplicates } = dedupeBatch(normalized)

  const now = new Date()

  const rowFor = (job: NormalizedJob) => ({
    sourceId: source.id,
    sourceJobId: job.sourceJobId,
    company: job.company,
    companyKey: job.companyKey,
    title: job.title,
    normalizedTitle: job.normalizedTitle,
    category: job.category,
    country: job.country,
    region: job.region,
    city: job.city,
    remoteType: job.remoteType,
    market: job.market,
    employmentType: job.employmentType,
    seniority: job.seniority,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    salaryPeriod: job.salaryPeriod,
    description: job.description,
    requirements: JSON.stringify(job.requirements),
    skills: JSON.stringify(job.skills),
    language: job.language,
    applicationUrl: job.applicationUrl,
    publishedAt: job.publishedAt,
    unknownFields: JSON.stringify(job.unknownFields),
    lastSeenAt: now,
  })

  let inserted = 0
  let updated = 0
  let skippedTooOld = 0

  // Verdadeiro enquanto TODAS as vagas coletadas foram gravadas. Se o prazo
  // acabar no meio, vira falso — e aí a coleta é tratada como parcial, porque
  // decidir fechamento a partir de uma gravação incompleta é exatamente o que
  // o §12 proíbe.
  let writeComplete = true

  for (const batch of chunk(unique, WRITE_CHUNK)) {
    if (Date.now() >= deadlineAt) {
      writeComplete = false
      break
    }

    const keys = batch.map((j) => j.dedupeKey)

    const existing = await db.job.findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    })
    const existingKeys = new Set(existing.map((r) => r.dedupeKey))

    const candidates = batch.filter((j) => !existingKeys.has(j.dedupeKey))

    // A trava que fecha o laço do expurgo por idade. Sem ela, toda vaga que o
    // expurgo apaga e a fonte ainda lista voltaria aqui com id novo — e o
    // alerta cascateado junto da vaga faria a pessoa ser avisada de novo.
    // Ver `agedJobPurgeWhere`: é o mesmo prazo, de propósito.
    const toCreate = candidates.filter((j) => !isTooOldToImport(j.publishedAt, now))
    skippedTooOld += candidates.length - toCreate.length

    // Vaga JÁ existente segue sendo atualizada mesmo que velha: parar de
    // atualizar faria a fonte parecer que a perdeu de vista, e isso é o §12.
    const toUpdate = batch.filter((j) => existingKeys.has(j.dedupeKey))

    if (toCreate.length > 0) {
      // `skipDuplicates` cobre a corrida com outra rodada da mesma fonte: a
      // vaga aparecer duas vezes é benigno, derrubar a coleta inteira não é.
      const created = await db.job.createMany({
        data: toCreate.map((j) => ({ ...rowFor(j), dedupeKey: j.dedupeKey })),
        skipDuplicates: true,
      })
      inserted += created.count
    }

    if (toUpdate.length > 0) {
      // Reaparecer numa coleta REABRE a vaga: se ela voltou, não estava
      // encerrada — e um fechamento anterior pode ter sido engano.
      //
      // As atualizações vão numa transação porque o Prisma as manda numa ida
      // só. Uma a uma seriam 84 viagens até São Paulo.
      await db.$transaction(
        toUpdate.map((j) =>
          db.job.update({
            where: { dedupeKey: j.dedupeKey },
            data: { ...rowFor(j), closedAt: null, closedReason: null },
          })
        )
      )
      updated += toUpdate.length
    }
  }

  // O que estava aberto ANTES desta coleta.
  const previouslyOpen = await db.job.findMany({
    where: { sourceId: source.id, closedAt: null },
    select: { dedupeKey: true },
  })

  /**
   * Numa fonte de BUSCA, sumir dos resultados não é prova de encerramento: a
   * vaga pode ter caído fora do termo, da página ou da ordenação e continuar
   * aberta. Passar a lista de abertas para o decisor faria cada mudança de
   * ranking encerrar vaga viva.
   *
   * Zerar a lista aqui, em vez de dentro do decisor, mantém o §12 num lugar só:
   * o decisor continua sem saber que existem fontes de busca.
   */
  const closesByAbsence = adapter.descriptor.closesByAbsence !== false

  const decision = decideCollection({
    // Gravação incompleta é coleta parcial, mesmo que a fonte tenha respondido
    // inteira: o retrato do que está aberto ficou pela metade.
    outcome: writeComplete ? result.outcome : 'partial',
    seenKeys: unique.map((j) => j.dedupeKey),
    previouslyOpenKeys: closesByAbsence ? previouslyOpen.map((j) => j.dedupeKey) : [],
    error: result.error,
  })

  let closed = 0
  if (decision.keysToClose.length > 0) {
    const res = await db.job.updateMany({
      where: { dedupeKey: { in: decision.keysToClose }, closedAt: null },
      data: { closedAt: now, closedReason: decision.closeReason },
    })
    closed = res.count
  }

  await db.jobSource.update({
    where: { id: source.id },
    data: sourceStateAfter(decision, { consecutiveFailures: source.consecutiveFailures }, now),
  })

  return {
    sourceSlug: slug,
    collected: result.jobs.length,
    inserted,
    updated,
    duplicates,
    closed,
    skippedTooOld,
    status: decision.status,
    explanation: decision.explanation,
  }
}

export interface UserRunResult {
  userId: string
  eligible: number
  evaluated: number
  alerted: number
  silenceReason: string | null
}

function preferencesOf(row: { frequency: string; minimumFit: string; maxPerDigest: number } | null): RadarPreferences {
  if (!row) return DEFAULT_RADAR_PREFERENCES
  return {
    frequency: (['immediate', 'daily', 'weekly', 'off'] as const).includes(row.frequency as any)
      ? (row.frequency as RadarPreferences['frequency'])
      : DEFAULT_RADAR_PREFERENCES.frequency,
    minimumFit: (['strong', 'good', 'partial'] as const).includes(row.minimumFit as any)
      ? (row.minimumFit as RadarPreferences['minimumFit'])
      : DEFAULT_RADAR_PREFERENCES.minimumFit,
    maxPerDigest: row.maxPerDigest > 0 ? row.maxPerDigest : DEFAULT_RADAR_PREFERENCES.maxPerDigest,
  }
}

/** Reconstrói a vaga normalizada a partir da linha do banco. */
function jobFromRow(row: any): NormalizedJob & { id: string; closedAt: Date | null } {
  const list = (raw: string | null): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }

  return {
    id: row.id,
    closedAt: row.closedAt,
    sourceJobId: row.sourceJobId,
    company: row.company,
    companyKey: row.companyKey,
    title: row.title,
    normalizedTitle: row.normalizedTitle,
    category: row.category,
    country: row.country,
    region: row.region,
    city: row.city,
    remoteType: row.remoteType,
    market: row.market,
    employmentType: row.employmentType,
    seniority: row.seniority,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    salaryPeriod: row.salaryPeriod,
    description: row.description,
    requirements: list(row.requirements),
    skills: list(row.skills),
    language: row.language,
    applicationUrl: row.applicationUrl,
    dedupeKey: row.dedupeKey,
    publishedAt: row.publishedAt,
    unknownFields: {},
  }
}

/**
 * Ordem em que as vagas abertas são lidas.
 *
 * `nulls: 'last'` não é detalhe: em Postgres, `ORDER BY x DESC` põe os nulos na
 * FRENTE. Com um teto de leitura, isso fazia as vagas sem data de publicação —
 * as que a fonte não datou — consumirem o orçamento antes das vagas realmente
 * recentes. Uma vaga sem data não é a mais nova; é a que não disse quando saiu.
 */
const NEWEST_FIRST = { publishedAt: { sort: 'desc', nulls: 'last' } } as const

/**
 * As vagas abertas que este usuário vai avaliar nesta rodada.
 *
 * ## O erro que isto corrige
 *
 * A consulta anterior era `closedAt: null` ordenado por data, com teto de 500 —
 * sem nenhuma menção a mercado. Com o banco pequeno isso funciona: 500 é mais
 * do que existe, todo mundo vê tudo, e o filtro duro faz o resto na memória.
 *
 * O defeito só aparece com volume, e aí aparece calado. Quando as vagas abertas
 * passam de 500, as 500 mais recentes DO MUNDO não têm relação nenhuma com quem
 * está sendo atendido: uma rodada com muitas vagas recentes na Índia entrega a
 * um usuário no Brasil um lote que o filtro duro rejeita inteiro. Ele recebe
 * silêncio — e silêncio é a resposta que o produto usa para dizer "não há nada
 * bom para você hoje". O sistema mente sem errar em nenhum lugar.
 *
 * ## A correção
 *
 * O teto passa a ser gasto em ordem de prioridade, e não por acaso: primeiro as
 * vagas dos mercados desta pessoa, e só depois o resto. O índice
 * `@@index([market, closedAt])` já existia para isto.
 *
 * ## Por que a segunda consulta existe
 *
 * Porque filtrar por mercado no banco NÃO pode virar eliminação. O filtro duro
 * deixa passar vaga sem mercado declarado, e deixa passar vaga remota para quem
 * aceita remoto internacional; e para quem ainda não declarou alvo nenhum, ele
 * deixa passar tudo. Se a consulta parasse na primeira metade, o banco estaria
 * decidindo o que o filtro decidiu não decidir — trocaríamos um erro por outro,
 * e o segundo seria pior, porque nem sequer é registrado como rejeição.
 *
 * Então: enquanto sobrar orçamento, o resto do mundo continua entrando. A
 * mudança é de ORDEM, não de escopo. Só quando 500 vagas do mercado da pessoa
 * já não cabem é que o resto fica de fora — e aí ficar de fora é a decisão
 * certa.
 */
/**
 * Tira do lote o que o próprio anúncio declara não ser vaga, e MEDE o resto.
 *
 * A separação não é meio-termo, é a diferença entre as duas coisas que
 * `assessLegitimacy` devolve:
 *
 * - `talent_pool` é o anúncio dizendo, com todas as letras, que não há posição
 *   específica. Não há o que medir: avisar alguém sobre um banco de talentos é
 *   o oposto exato do "só interromper quando vale a pena" que o Radar promete.
 *   Sai do lote.
 * - `evergreen`, `recirculated` e `thin_description` são INFERÊNCIA nossa.
 *   Eliminar por inferência antes de saber o volume é o que o §2.30 ("medir
 *   antes de automatizar") existe para impedir: se o limiar estiver errado,
 *   ninguém descobre — a vaga some do aviso e não sobra rastro. Então por ora
 *   eles só aparecem no log, e a decisão de eliminar espera número real.
 *
 * O log é por rodada, agregado: nome de vaga em log de produção não ajuda a
 * decidir limiar e só aumenta o que fica gravado sobre quem está procurando
 * emprego.
 */
async function dropDeclaredTalentPools<T extends LegitimacyJobRow>(rows: T[]): Promise<T[]> {
  const assessments = await assessLegitimacyForJobs(rows)

  const counts = { talent_pool: 0, evergreen: 0, recirculated: 0, thin_description: 0 }
  const kept: T[] = []

  for (const row of rows) {
    const signals = assessments.get(row.id)?.signals ?? []
    for (const signal of signals) counts[signal]++
    if (!signals.includes('talent_pool')) kept.push(row)
  }

  if (counts.talent_pool > 0) {
    console.warn(
      `[radar] ${counts.talent_pool} de ${rows.length} vaga(s) descartada(s): ` +
        'o anúncio declara banco de talentos / candidatura espontânea.'
    )
  }
  if (counts.evergreen || counts.recirculated || counts.thin_description) {
    console.info(
      `[radar] sinais de legitimidade apenas observados (nada eliminado por eles): ` +
        `perpétua=${counts.evergreen} recirculada=${counts.recirculated} ` +
        `descrição_oca=${counts.thin_description} de ${rows.length}.`
    )
  }

  return kept
}

async function openJobsWithinBudget(profile: ProfessionalProfile) {
  const scope = marketScopeOf(profile)

  const inScope = await db.job.findMany({
    where: { ...freshOpenJobWhere(), market: { in: scope } },
    orderBy: NEWEST_FIRST,
    take: MAX_JOBS_PER_USER,
  })

  if (inScope.length >= MAX_JOBS_PER_USER) return inScope

  const rest = await db.job.findMany({
    // `AND` explícito, e não espalhamento: `freshOpenJobWhere()` já traz um
    // `OR` (a vaga sem data de publicação que nunca é eliminada), e o filtro de
    // mercado abaixo traz outro. Espalhar os dois no mesmo objeto faria o
    // segundo `OR` sobrescrever o primeiro em silêncio — e o filtro de frescor
    // sumiria justamente desta consulta.
    where: {
      AND: [
        freshOpenJobWhere(),
        {
          // `notIn` sozinho deixaria de fora as vagas sem mercado: em SQL,
          // `market NOT IN (...)` com `market` nulo não é verdadeiro. São
          // justamente as vagas que "desconhecido nunca elimina" protege.
          OR: [{ market: null }, { market: { notIn: scope } }],
        },
      ],
    },
    orderBy: NEWEST_FIRST,
    take: MAX_JOBS_PER_USER - inScope.length,
  })

  return [...inScope, ...rest]
}

/**
 * Apaga alertas que deixaram de se sustentar.
 *
 * ## Por que isto precisa existir
 *
 * O alerta é GRAVADO, e a tela o lê de `RadarAlert` sem recalcular — de
 * propósito: o veredito guardado é o que motivou o aviso, e recalcular na
 * leitura mostraria à pessoa algo diferente do que ela foi avisada.
 *
 * A consequência é que um alerta errado fica errado para sempre. Foi o que
 * aconteceu com um perfil de biomedicina que recebeu vagas de tecnologia: a
 * regra que produzia esses alertas foi corrigida, mas as linhas já gravadas
 * continuaram na tela, e rodar o Radar de novo não as tirava de lá.
 *
 * Recalcular para EXIBIR continua proibido. Recalcular para ENCERRAR é outra
 * coisa, e é o mesmo que `closeStaleJobs` já faz com vaga parada: uma decisão
 * deliberada, dentro da rodada, registrada no log.
 *
 * ## O critério é `weak`, e não "abaixo do mínimo"
 *
 * `weak` quer dizer que não havia base para avisar — impedimento estrutural ou
 * aderência zero. "Abaixo do mínimo" depende da preferência do usuário, que ele
 * pode mudar de um dia para o outro; apagar por causa dela transformaria um
 * ajuste de exigência em perda de histórico.
 */
async function pruneUnfoundedAlerts(
  userId: string,
  profile: ReturnType<typeof profileFromRecord>
): Promise<number> {
  const alerts = await db.radarAlert.findMany({
    where: { userId },
    select: {
      id: true,
      jobId: true,
      createdAt: true,
      job: true,
      overallFit: true,
      recommendation: true,
      matchJson: true,
    },
  })

  if (alerts.length === 0) return 0

  const unfounded: string[] = []
  for (const alert of alerts) {
    if (!alert.job) continue
    if (alert.job.closedAt) {
      unfounded.push(alert.id)
      continue
    }
    const currentMatch = matchJob(profile, jobFromRow(alert.job))
    if (currentMatch.overall === 'weak') {
      unfounded.push(alert.id)
    } else if (
      alert.overallFit !== currentMatch.overall ||
      alert.recommendation !== currentMatch.recommendation
    ) {
      // Perfil mudou e o veredito atualizou: sincroniza o alerta gravado com o perfil atual
      await db.radarAlert.update({
        where: { id: alert.id },
        data: {
          overallFit: currentMatch.overall,
          recommendation: currentMatch.recommendation,
          matchJson: JSON.stringify(currentMatch),
          signalScore: internalSignalScore(currentMatch),
        },
      })
    }
  }

  if (unfounded.length === 0) return 0

  // Memória antes do apagamento. O alerta retirado deixa de ser recomendação,
  // mas continua tendo acontecido — ver o cabeçalho de `offer-log.server.ts`.
  const preserved = await preserveOffers(
    alerts
      .filter((a) => unfounded.includes(a.id))
      .map((a) => ({ userId, jobId: a.jobId, createdAt: a.createdAt, job: a.job }))
  )

  // Memória não preservada, alerta não apagado. O alerta sobrevive mais uma
  // rodada — custo nenhum — e a próxima tenta de novo. Apagar assim mesmo
  // destruiria em silêncio o histórico que a preservação existe para salvar.
  if (!preserved.ok) return 0

  const res = await db.radarAlert.deleteMany({ where: { id: { in: unfounded } } })
  console.warn(
    `[radar] usuário ${userId}: ${res.count} alerta(s) sem base removido(s) de ${alerts.length}.`
  )
  return res.count
}

/**
 * A rodada de um usuário.
 *
 * Não envia nada: grava `RadarAlert`. O envio — e-mail, push — é uma camada
 * acima, e separá-la significa que a decisão de interromper alguém já está
 * tomada e registrada mesmo quando não há por onde entregar.
 */
export async function runForUser(userId: string): Promise<UserRunResult> {
  const [profileRow, prefRow] = await Promise.all([
    db.professionalProfile.findUnique({ where: { userId } }),
    db.radarPreference.findUnique({ where: { userId } }),
  ])

  const preferences = preferencesOf(prefRow)
  const profile = profileFromRecord(profileRow)

  const markAsRun = () =>
    db.radarPreference.upsert({
      where: { userId },
      create: { userId, lastRunAt: new Date() },
      update: { lastRunAt: new Date() },
    })

  if (preferences.frequency === 'off') {
    await markAsRun()
    return { userId, eligible: 0, evaluated: 0, alerted: 0, silenceReason: 'radar_off' }
  }

  /**
   * Sem sinal profissional não se avalia nada — e não se lê o banco.
   *
   * Um perfil em branco passa por todo filtro, porque "desconhecido nunca
   * elimina". Sobra o pool inteiro de vagas coletadas, que hoje vem em grande
   * parte de quadros de tecnologia, e a pessoa recebe o que calhou de existir.
   * Foi assim que um perfil de biomedicina recebeu vagas de tecnologia.
   *
   * Sair aqui não é economia: é a diferença entre "não encontramos nada para
   * você" e "ainda não sabemos o que procurar". A primeira é mentira quando a
   * segunda é o caso.
   */
  if (!hasMatchableSignal(profile)) {
    // Sem sinal, NENHUM alerta existente se justifica — inclusive os que já
    // estão gravados. Deixá-los na tela seria manter no ar exatamente a
    // recomendação que não temos base para fazer.
    //
    // O custo é perder o histórico de feedback desses alertas. É aceitável:
    // feedback sobre um aviso que nunca deveria ter saído não mede nada.
    // Mesma regra do `pruneUnfoundedAlerts`: nenhum alerta é destruído sem
    // virar memória antes, inclusive nesta limpeza mais agressiva.
    const doomed = await db.radarAlert.findMany({
      where: { userId },
      select: { jobId: true, createdAt: true, job: true },
    })
    const kept = await preserveOffers(doomed.map((a) => ({ userId, ...a })))

    // Mesma regra do `pruneUnfoundedAlerts`: sem memória preservada, não se
    // apaga. A limpeza fica para a rodada seguinte.
    const removed = kept.ok
      ? await db.radarAlert.deleteMany({ where: { userId } })
      : { count: 0 }
    if (removed.count > 0) {
      console.warn(
        `[radar] usuário ${userId}: perfil sem sinal profissional; ` +
          `${removed.count} alerta(s) sem base removido(s).`
      )
    }

    await markAsRun()
    return { userId, eligible: 0, evaluated: 0, alerted: 0, silenceReason: 'profile_insufficient' }
  }

  // Com sinal: a rodada revisa o que já foi avisado antes de avisar de novo.
  await pruneUnfoundedAlerts(userId, profile)

  const rows = await openJobsWithinBudget(profile)
  const trustworthy = await dropDeclaredTalentPools(rows)

  const jobs = trustworthy.map(jobFromRow)
  const { eligible } = filterJobs(jobs, profile)

  const opportunities: EvaluatedOpportunity<{ id: string }>[] = eligible.map((job) => {
    const match = matchJob(profile, job)
    return {
      job: { id: (job as any).id },
      jobId: (job as any).id,
      match,
      publishedAt: job.publishedAt,
    }
  })

  const alreadyAlerted = await db.radarAlert.findMany({ where: { userId }, select: { jobId: true } })

  const result = curate(opportunities, {
    preferences,
    alreadyAlertedJobIds: alreadyAlerted.map((a) => a.jobId),
  })

  // Os dados da vaga na mão para o log de ofertas: ele guarda uma CÓPIA
  // (cargo, empresa, país), não uma referência, e é isso que o faz sobreviver
  // ao apagamento da vaga aos 180 dias.
  const rowById = new Map(trustworthy.map((row) => [row.id, row]))

  let alerted = 0
  for (const opportunity of result.selected) {
    const row = rowById.get(opportunity.jobId)
    try {
      await db.radarAlert.create({
        data: {
          userId,
          jobId: opportunity.jobId,
          overallFit: opportunity.match.overall,
          recommendation: opportunity.match.recommendation,
          matchJson: JSON.stringify(opportunity.match),
          signalScore: internalSignalScore(opportunity.match),
        },
      })
      alerted++
    } catch (e: any) {
      // P2002 = já existe alerta deste usuário para esta vaga. É a garantia do
      // "não se avisa duas vezes" funcionando sob concorrência, não um erro.
      if (e?.code !== 'P2002') throw e
      continue
    }

    // O log da oferta é best-effort, e FORA da transação do alerta — de
    // propósito, revertendo a decisão da primeira versão deste código.
    //
    // Prender os dois num `$transaction` parecia certo ("foi avisado" e "está
    // registrado que foi avisado" são o mesmo fato), e é errado na prática:
    // qualquer falha do lado do log — a tabela ainda não existir no banco,
    // antes do `prisma db push`, é o caso óbvio — derrubaria a criação do
    // ALERTA. O produto pago pararia de avisar as pessoas para proteger uma
    // linha de histórico. A troca é claramente ruim nessa direção.
    //
    // O que torna isto seguro é `purgeAgedJobs`: ele copia para o log tudo o
    // que for apagar, então uma linha perdida aqui é reposta antes de a vaga
    // sumir. Nada de histórico se perde; no máximo aparece mais tarde.
    if (row) {
      try {
        await db.radarOfferLog.create({
          data: {
            userId,
            jobId: opportunity.jobId,
            title: row.title,
            company: row.company,
            country: row.country,
            offeredAt: new Date(),
          },
        })
      } catch (e: any) {
        // P2002 aqui é a mesma oferta já registrada — esperado quando o
        // expurgo já tinha copiado esta vaga. Não é erro.
        if (e?.code !== 'P2002') {
          console.warn(`[radar] log de oferta falhou (alerta preservado): ${e?.message || e}`)
        }
      }
    }
  }

  await markAsRun()

  return {
    userId,
    eligible: eligible.length,
    evaluated: result.evaluated,
    alerted,
    silenceReason: result.silenceReason,
  }
}

export interface RadarRunSummary {
  collections: CollectionRunResult[]
  users: UserRunResult[]
  totalAlerted: number
  totalSilenced: number
  /** A rodada parou por falta de tempo, não por ter terminado. */
  ranOutOfTime: boolean
  /** Vagas encerradas por terem parado de aparecer. */
  staleClosed: StaleCloseReport
}

/**
 * A rodada completa.
 *
 * `adapters` chega de fora para que a rota decida quais fontes rodar — e para
 * que o teste rode a orquestração inteira com fontes falsas.
 */
export async function runRadar(options: {
  adapters: JobSourceAdapter[]
  collectionBudgetMs: number
  /** Instante em que a rodada tem de ter acabado. */
  deadlineAt?: number
}): Promise<RadarRunSummary> {
  const deadlineAt = options.deadlineAt ?? Number.POSITIVE_INFINITY
  const collections: CollectionRunResult[] = []
  let ranOutOfTime = false

  for (const adapter of options.adapters) {
    if (Date.now() >= deadlineAt) {
      ranOutOfTime = true
      break
    }
    // Uma fonte que falha não impede as outras: `safeCollect` já contém a
    // exceção, e aqui contemos a falha de gravação pelo mesmo motivo.
    try {
      collections.push(
        await runCollection(adapter, {
          timeBudgetMs: Math.max(1000, Math.min(options.collectionBudgetMs, deadlineAt - Date.now())),
          deadlineAt,
        })
      )
    } catch (e: any) {
      collections.push({
        sourceSlug: adapter.descriptor.slug,
        collected: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        closed: 0,
        skippedTooOld: 0,
        status: 'error',
        explanation: `Falha ao gravar a coleta: ${e?.message || String(e)}`,
      })
    }
  }

  /**
   * Encerrar por tempo vem DEPOIS de coletar e ANTES de avaliar.
   *
   * Depois de coletar porque uma vaga que reapareceu nesta rodada teve o
   * `lastSeenAt` atualizado e não deve ser dada como parada. Antes de avaliar
   * porque avaliar uma vaga que acabou de ser encerrada geraria alerta para
   * algo que já não existe — o erro que este mecanismo veio corrigir.
   */
  const staleClosed = await closeStaleJobs({ now: new Date() })

  // Quem esperou mais vem primeiro. Usuários sem preferência ainda registrada
  // entram na frente — nunca rodaram.
  const candidates = await db.user.findMany({
    where: { disabled: false, professionalProfile: { isNot: null } },
    select: { id: true, radarPreference: { select: { lastRunAt: true } } },
    take: USERS_PER_RUN * 4,
  })

  const ordered = candidates
    .sort((a, b) => {
      const at = a.radarPreference?.lastRunAt?.getTime() ?? 0
      const bt = b.radarPreference?.lastRunAt?.getTime() ?? 0
      return at - bt
    })
    .slice(0, USERS_PER_RUN)

  const users: UserRunResult[] = []
  for (const candidate of ordered) {
    // Parar entre usuários, e não no meio de um. Um usuário atendido pela
    // metade grava alertas sem registrar a rodada — na próxima ele seria
    // escolhido de novo e receberia os mesmos avisos.
    if (Date.now() >= deadlineAt) {
      ranOutOfTime = true
      break
    }

    try {
      users.push(await runForUser(candidate.id))
    } catch (e: any) {
      console.warn(`[radar] rodada do usuário ${candidate.id} falhou:`, e?.message || e)
    }
  }

  return {
    collections,
    users,
    totalAlerted: users.reduce((sum, u) => sum + u.alerted, 0),
    totalSilenced: users.filter((u) => u.alerted === 0).length,
    // Declarado, e não escondido: uma rodada truncada que se apresenta como
    // completa faz a fila parecer girar quando ela parou.
    ranOutOfTime,
    staleClosed,
  }
}

/**
 * Roda o Radar para um usuário sem deixar a falha vazar.
 *
 * Existe para as rotas que disparam o Radar como **efeito colateral** de outra
 * coisa: salvar o perfil, gerar o diagnóstico. Nessas, a entrega principal é a
 * outra — derrubá-la porque a avaliação de vagas não deu certo trocaria o que a
 * pessoa pediu pelo que ela nem sabe que está acontecendo.
 *
 * Quem chama o Radar de propósito (a rota `/api/radar/run`) NÃO usa isto: lá a
 * falha é a resposta, e precisa ser dita.
 */
export async function runForUserQuietly(userId: string): Promise<UserRunResult | null> {
  try {
    return await runForUser(userId)
  } catch (e: any) {
    console.warn(`[radar] rodada oportunista do usuário ${userId} falhou:`, e?.message || e)
    return null
  }
}
