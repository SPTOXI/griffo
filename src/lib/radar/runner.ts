import 'server-only'
import { db } from '../db'
import { safeCollect, sourceservesMarkets, type JobSourceAdapter } from '../jobs/adapter'
import { decideCollection, sourceStateAfter } from '../jobs/collection'
import { dedupeBatch } from '../jobs/dedup'
import { normalizeJob } from '../jobs/normalize'
import { JobNormalizationError, type NormalizedJob } from '../jobs/types'
import { filterJobs } from '../matching/filters'
import { internalSignalScore, matchJob } from '../matching/compatibility'
import { fromRecord as profileFromRecord } from '../profile'
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
 * quem esperou mais (`lastRunAt` mais antigo). Com o cron rodando de hora em
 * hora, a fila gira sozinha e ninguém fica para trás indefinidamente.
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

/** Quantos usuários uma invocação atende. Mantém a rodada dentro do teto. */
const USERS_PER_RUN = 25

/** Vagas consideradas por usuário. Teto de segurança, não meta. */
const MAX_JOBS_PER_USER = 500

export interface CollectionRunResult {
  sourceSlug: string
  collected: number
  inserted: number
  updated: number
  duplicates: number
  closed: number
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
  options: { timeBudgetMs: number }
): Promise<CollectionRunResult> {
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

  let inserted = 0
  let updated = 0
  const now = new Date()

  for (const job of unique) {
    const data = {
      sourceId: source.id,
      sourceJobId: job.sourceJobId,
      company: job.company,
      companyKey: job.companyKey,
      title: job.title,
      normalizedTitle: job.normalizedTitle,
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
    }

    const existing = await db.job.findUnique({ where: { dedupeKey: job.dedupeKey }, select: { id: true } })
    if (existing) {
      // Reaparecer numa coleta REABRE a vaga: se ela voltou, não estava
      // encerrada — e um fechamento anterior pode ter sido engano.
      await db.job.update({ where: { dedupeKey: job.dedupeKey }, data: { ...data, closedAt: null, closedReason: null } })
      updated++
    } else {
      await db.job.create({ data: { ...data, dedupeKey: job.dedupeKey } })
      inserted++
    }
  }

  // O que estava aberto ANTES desta coleta.
  const previouslyOpen = await db.job.findMany({
    where: { sourceId: source.id, closedAt: null },
    select: { dedupeKey: true },
  })

  const decision = decideCollection({
    outcome: result.outcome,
    seenKeys: unique.map((j) => j.dedupeKey),
    previouslyOpenKeys: previouslyOpen.map((j) => j.dedupeKey),
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

  const rows = await db.job.findMany({
    where: { closedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: MAX_JOBS_PER_USER,
  })

  const jobs = rows.map(jobFromRow)
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

  let alerted = 0
  for (const opportunity of result.selected) {
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
}): Promise<RadarRunSummary> {
  const collections: CollectionRunResult[] = []

  for (const adapter of options.adapters) {
    // Uma fonte que falha não impede as outras: `safeCollect` já contém a
    // exceção, e aqui contemos a falha de gravação pelo mesmo motivo.
    try {
      collections.push(await runCollection(adapter, { timeBudgetMs: options.collectionBudgetMs }))
    } catch (e: any) {
      collections.push({
        sourceSlug: adapter.descriptor.slug,
        collected: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        closed: 0,
        status: 'error',
        explanation: `Falha ao gravar a coleta: ${e?.message || String(e)}`,
      })
    }
  }

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
  }
}
