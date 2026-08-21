/**
 * Agente de Deduplicação Semântica de Vagas (§14).
 *
 * ## Por que este agente existe
 *
 * A deduplicação determinística em `src/lib/jobs/dedup.ts` funciona por chaves
 * exatas (`sid:`, `url:`, `cmp:`). Porém, agregadores e portais frequentemente
 * cadastram a mesma vaga com variações sutis:
 *
 * 1. Nome da empresa ligeiramente diferente ("Nubank" vs "Nu Pagamentos S.A.").
 * 2. Título ligeiramente diferente ("Engenheiro Frontend" vs "Dev React/Next.js").
 * 3. URLs com wrappers de redirect da Adzuna vs Gupy vs Lever.
 * 4. Republicações da mesma vaga em datas próximas.
 *
 * ## A estratégia em 3 camadas
 *
 * 1. **Pré-Filtro Heurístico (Grátis & Instantâneo):** Agrupa apenas pares com alta suspeita
 *    (mesma empresa aproximada + mesmo estado/país + título aproximado).
 * 2. **Agente de IA (Kimi K3 -> DeepSeek -> Gemini):** Analisa semanticamente
 *    os textos completos dos anúncios e emite veredito estruturado em JSON.
 * 3. **Reconciliação no Banco de Dados:** Mantém a vaga mais recente/completa,
 *    migra os alertas existentes do Radar (`RadarAlert`) e apaga a vaga antiga.
 */

import { foldTitle } from '../market/taxonomy'

export interface JobMinimal {
  id: string
  title: string
  normalizedTitle: string | null
  company: string
  companyKey: string
  country: string | null
  region: string | null
  city: string | null
  remoteType: string
  description: string | null
  requirements: string | null
  skills: string | null
  publishedAt: Date | null
  createdAt: Date
  applicationUrl: string
}

export interface CandidatePair {
  jobA: JobMinimal
  jobB: JobMinimal
  heuristicScore: number
  reason: string
}

export interface AiDedupVerdict {
  isDuplicate: boolean
  confidence: number
  reason: string
  keepJobId?: string
  deleteJobId?: string
}

export interface DedupRoundSummary {
  pairsAnalyzed: number
  duplicatesFound: number
  jobsDeleted: number
  timeSpentMs: number
  errors: string[]
}

/**
 * Calcula a pontuação de similaridade heurística entre duas vagas para pré-seleção.
 * Retorna score de 0 a 100. Valores >= 65 são considerados pares suspeitos.
 */
export function calculateHeuristicSimilarity(a: JobMinimal, b: JobMinimal): { score: number; reason: string } {
  if (a.id === b.id) return { score: 0, reason: 'mesma vaga' }

  let score = 0
  const reasons: string[] = []

  // 1. Empresa
  const compA = foldTitle(a.companyKey || a.company)
  const compB = foldTitle(b.companyKey || b.company)
  if (compA === compB && compA.length > 0) {
    score += 40
    reasons.push('mesma empresa')
  } else if (compA.includes(compB) || compB.includes(compA)) {
    score += 30
    reasons.push('empresa similar')
  } else {
    // Empresas totalmente diferentes raramente são a mesma vaga
    return { score: 0, reason: 'empresas distintas' }
  }

  // 2. Cargo / Título
  const titleA = foldTitle(a.title)
  const titleB = foldTitle(b.title)
  if (titleA === titleB) {
    score += 35
    reasons.push('mesmo título')
  } else if (a.normalizedTitle && b.normalizedTitle && a.normalizedTitle === b.normalizedTitle) {
    score += 30
    reasons.push('mesma taxonomia de cargo')
  } else {
    // Sobreposição de palavras do título
    const wordsA = new Set(titleA.split(/\s+/).filter((w) => w.length > 2))
    const wordsB = new Set(titleB.split(/\s+/).filter((w) => w.length > 2))
    let intersection = 0
    for (const w of wordsA) if (wordsB.has(w)) intersection++
    const union = new Set([...wordsA, ...wordsB]).size
    const jaccard = union > 0 ? intersection / union : 0

    if (jaccard >= 0.5) {
      score += Math.round(jaccard * 30)
      reasons.push(`título com ${Math.round(jaccard * 100)}% de termos em comum`)
    }
  }

  // 3. Localização / Modalidade
  const locA = `${a.country || ''}|${a.region || ''}|${a.city || ''}|${a.remoteType}`.toLowerCase()
  const locB = `${b.country || ''}|${b.region || ''}|${b.city || ''}|${b.remoteType}`.toLowerCase()
  if (locA === locB) {
    score += 25
    reasons.push('mesma localidade/modalidade')
  } else if (a.country === b.country && (a.remoteType === 'remote' || b.remoteType === 'remote')) {
    score += 15
    reasons.push('mesmo país e modalidade remota')
  }

  return { score, reason: reasons.join('; ') }
}

/**
 * Encontra pares de vagas suspeitas de serem duplicadas no conjunto fornecido.
 */
export function findDuplicateCandidatePairs(jobs: JobMinimal[], minScore = 65): CandidatePair[] {
  const pairs: CandidatePair[] = []
  const seenPairKeys = new Set<string>()

  for (let i = 0; i < jobs.length; i++) {
    for (let j = i + 1; j < jobs.length; j++) {
      const jobA = jobs[i]
      const jobB = jobs[j]

      const pairKey = [jobA.id, jobB.id].sort().join(':')
      if (seenPairKeys.has(pairKey)) continue
      seenPairKeys.add(pairKey)

      const { score, reason } = calculateHeuristicSimilarity(jobA, jobB)
      if (score >= minScore) {
        pairs.push({ jobA, jobB, heuristicScore: score, reason })
      }
    }
  }

  // Ordena pelos pares com maior suspeita
  return pairs.sort((p1, p2) => p2.heuristicScore - p1.heuristicScore)
}

export const DEDUP_SYSTEM_PROMPT = `Você é um Auditor Especialista em Deduplicação de Vagas de Emprego do GriffoWork.
Sua missão é analisar dois anúncios de vagas de emprego (Vaga A e Vaga B) e determinar com rigor se são EXATAMENTE A MESMA oportunidade de trabalho publicada em canais diferentes (ex: Gupy, Adzuna, site da empresa).

Regras de Decisão:
1. isDuplicate = true APENAS se ambas descreverem a mesma função na mesma empresa, com requisitos substancialmente idênticos.
2. Vagas de níveis diferentes (ex: Júnior vs Sênior) ou para cidades diferentes NÃO são duplicatas.
3. Se for duplicata:
   - Defina 'keepJobId' para a vaga mais detalhada/recente.
   - Defina 'deleteJobId' para a vaga redundante/mais antiga a ser removida.
4. Responda estritamente em formato JSON válido conforme o schema. Sem comentários adicionais fora do JSON.`

export function buildDedupUserPrompt(jobA: JobMinimal, jobB: JobMinimal): string {
  return `Analise os dois anúncios abaixo e determine se representam a mesma vaga de emprego:

=== VAGA A (ID: ${jobA.id}) ===
Título: ${jobA.title} (Normalizado: ${jobA.normalizedTitle || 'N/A'})
Empresa: ${jobA.company}
Localização: ${jobA.city || ''}, ${jobA.region || ''} - ${jobA.country || ''} (Modalidade: ${jobA.remoteType})
Publicada em: ${jobA.publishedAt?.toISOString() || jobA.createdAt.toISOString()}
Requisitos: ${jobA.requirements || 'Não especificado'}
Habilidades: ${jobA.skills || 'Não especificado'}
Descrição:
${(jobA.description || '').slice(0, 1500)}

=== VAGA B (ID: ${jobB.id}) ===
Título: ${jobB.title} (Normalizado: ${jobB.normalizedTitle || 'N/A'})
Empresa: ${jobB.company}
Localização: ${jobB.city || ''}, ${jobB.region || ''} - ${jobB.country || ''} (Modalidade: ${jobB.remoteType})
Publicada em: ${jobB.publishedAt?.toISOString() || jobB.createdAt.toISOString()}
Requisitos: ${jobB.requirements || 'Não especificado'}
Habilidades: ${jobB.skills || 'Não especificado'}
Descrição:
${(jobB.description || '').slice(0, 1500)}

Responda em JSON com:
- isDuplicate (boolean)
- confidence (número entre 0.0 e 1.0)
- reason (explicação concisa)
- keepJobId (id da vaga a manter)
- deleteJobId (id da vaga a apagar)`
}

/**
 * Consulta a IA (Kimi K3 -> DeepSeek -> Gemini) para julgar se o par é duplicado.
 */
export async function judgeJobPairWithAi(pair: CandidatePair): Promise<AiDedupVerdict> {
  const { jobA, jobB } = pair
  const userPrompt = buildDedupUserPrompt(jobA, jobB)

  try {
    const { executeAiTask } = await import('../ai-router/router')
    const result = await executeAiTask({
      taskType: 'job_deduplication',
      systemPrompt: DEDUP_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
      maxTokens: 1000,
      jsonSchema: {
        type: 'object',
        properties: {
          isDuplicate: { type: 'boolean' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
          keepJobId: { type: 'string' },
          deleteJobId: { type: 'string' },
        },
        required: ['isDuplicate', 'confidence', 'reason'],
      },
    })

    const parsed = JSON.parse(result.content || '{}') as AiDedupVerdict
    return {
      isDuplicate: !!parsed.isDuplicate,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      reason: parsed.reason || 'Sem justificativa.',
      keepJobId: parsed.keepJobId || (jobA.publishedAt && jobB.publishedAt && jobA.publishedAt > jobB.publishedAt ? jobA.id : jobB.id),
      deleteJobId: parsed.deleteJobId || (jobA.publishedAt && jobB.publishedAt && jobA.publishedAt > jobB.publishedAt ? jobB.id : jobA.id),
    }
  } catch (e: any) {
    return {
      isDuplicate: false,
      confidence: 0,
      reason: `Falha ao processar análise da IA: ${e?.message || String(e)}`,
    }
  }
}

/**
 * Reconcilia a duplicata no banco de dados de forma segura:
 * 1. Migra alertas existentes do Radar para a vaga canônica preservada.
 * 2. Deleta a vaga duplicada.
 * 3. Registra auditoria no banco.
 */
export async function reconcileJobDuplicateInDb(
  verdict: AiDedupVerdict,
  jobA: JobMinimal,
  jobB: JobMinimal
): Promise<boolean> {
  if (!verdict.isDuplicate || verdict.confidence < 0.85 || !verdict.keepJobId || !verdict.deleteJobId) {
    return false
  }

  const keepId = verdict.keepJobId
  const deleteId = verdict.deleteJobId

  try {
    const { db } = await import('../db')
    await db.$transaction(async (tx) => {
      // 1. Alertas vinculados à vaga a ser deletada
      const existingAlerts = await tx.radarAlert.findMany({
        where: { jobId: deleteId },
        select: { id: true, userId: true },
      })

      for (const alert of existingAlerts) {
        // Se o usuário já possui um alerta para a vaga preservada, apaga o redundante
        const canonicalAlert = await tx.radarAlert.findFirst({
          where: { userId: alert.userId, jobId: keepId },
        })

        if (canonicalAlert) {
          await tx.radarAlert.delete({ where: { id: alert.id } })
        } else {
          // Caso contrário, migra o alerta para a vaga preservada
          await tx.radarAlert.update({
            where: { id: alert.id },
            data: { jobId: keepId },
          })
        }
      }

      // 2. Apaga a vaga duplicada
      await tx.job.delete({
        where: { id: deleteId },
      })

      // 3. Registra no log de auditoria
      await tx.auditLog.create({
        data: {
          action: 'job_semantic_dedup',
          meta: JSON.stringify({
            keepJobId: keepId,
            deletedJobId: deleteId,
            confidence: verdict.confidence,
            reason: verdict.reason,
            company: jobA.company,
            titleA: jobA.title,
            titleB: jobB.title,
          }),
        },
      })
    })

    return true
  } catch (err) {
    console.error(`[AgentDedup] Erro ao reconciliar duplicata (${deleteId} -> ${keepId}):`, err)
    return false
  }
}

/**
 * Executa uma rodada completa de deduplicação semântica.
 */
export async function runAiDeduplicationClean(options?: {
  maxPairsToAnalyze?: number
  timeBudgetMs?: number
}): Promise<DedupRoundSummary> {
  const startedAt = Date.now()
  const maxPairs = options?.maxPairsToAnalyze ?? 15
  const budgetMs = options?.timeBudgetMs ?? 30_000

  const summary: DedupRoundSummary = {
    pairsAnalyzed: 0,
    duplicatesFound: 0,
    jobsDeleted: 0,
    timeSpentMs: 0,
    errors: [],
  }

  try {
    const { db } = await import('../db')
    // 1. Busca as vagas abertas mais recentes
    const jobs = await db.job.findMany({
      where: { closedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        id: true,
        title: true,
        normalizedTitle: true,
        company: true,
        companyKey: true,
        country: true,
        region: true,
        city: true,
        remoteType: true,
        description: true,
        requirements: true,
        skills: true,
        publishedAt: true,
        createdAt: true,
        applicationUrl: true,
      },
    })

    if (jobs.length < 2) {
      summary.timeSpentMs = Date.now() - startedAt
      return summary
    }

    // 2. Encontra pares suspeitos com o pré-filtro
    const candidatePairs = findDuplicateCandidatePairs(jobs)
    const pairsToProcess = candidatePairs.slice(0, maxPairs)

    // 3. Processa os pares com o agente de IA
    for (const pair of pairsToProcess) {
      if (Date.now() - startedAt >= budgetMs) {
        break
      }

      summary.pairsAnalyzed++
      const verdict = await judgeJobPairWithAi(pair)

      if (verdict.isDuplicate && verdict.confidence >= 0.85) {
        summary.duplicatesFound++
        const deleted = await reconcileJobDuplicateInDb(verdict, pair.jobA, pair.jobB)
        if (deleted) {
          summary.jobsDeleted++
        }
      }
    }
  } catch (e: any) {
    summary.errors.push(e?.message || String(e))
  }

  summary.timeSpentMs = Date.now() - startedAt
  return summary
}
