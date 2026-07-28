import { db } from '../db'
import { ModelBenchmarkItem, OperationalFailureItem, ProviderId } from './types'
import { PROVIDER_CONFIGS } from './registry'

export async function getAiMetricsData() {
  const [logs, auditFailovers, userCount, resumeCount] = await Promise.all([
    db.aiLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2000,
    }),
    db.auditLog.count({ where: { action: 'failover' } }),
    db.user.count(),
    db.resume.count(),
  ])

  // Costs by Provider
  const costByProvider: Record<string, number> = { kimi: 0, claude: 0, deepseek: 0, gemini: 0 }
  const callsByProvider: Record<string, number> = { kimi: 0, claude: 0, deepseek: 0, gemini: 0 }
  const latencyByProvider: Record<string, { sum: number; count: number }> = {
    kimi: { sum: 0, count: 0 },
    claude: { sum: 0, count: 0 },
    deepseek: { sum: 0, count: 0 },
    gemini: { sum: 0, count: 0 },
  }

  // Costs by Feature / Task
  const costByTask: Record<string, number> = {}
  const callsByTask: Record<string, number> = {}

  // Costs per User
  const costByUser: Record<string, { userId: string; email: string; costUsd: number; calls: number }> = {}

  // Benchmarks per Model
  const modelStats: Record<
    string,
    {
      provider: ProviderId
      model: string
      calls: number
      tokensIn: number
      tokensOut: number
      costUsd: number
      latencySum: number
      successCount: number
      failoverCount: number
    }
  > = {}

  let totalAiCostUsd = 0
  let totalAiCalls = 0
  let totalFailovers = auditFailovers
  let totalErrors = 0

  const failureLogs = logs.filter((l) => l.status === 'error' || l.errorMessage)
  totalErrors = failureLogs.length

  const failureUserIds = Array.from(new Set(failureLogs.map((l) => l.userId).filter(Boolean))) as string[]
  const failureUsers =
    failureUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: failureUserIds } },
          select: { id: true, email: true, name: true },
        })
      : []
  const userEmailMap = new Map(failureUsers.map((u) => [u.id, u.email || u.name || u.id]))

  const operationalFailures: OperationalFailureItem[] = failureLogs.slice(0, 50).map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    taskType: l.taskType,
    primaryModel: l.primaryModel,
    provider: l.provider,
    status: l.status,
    failoverCount: l.failoverCount,
    errorMessage: l.errorMessage,
    userId: l.userId,
    userEmail: l.userId ? userEmailMap.get(l.userId) || l.userId : 'Anônimo / Sistema',
  }))

  for (const log of logs) {
    totalAiCalls++
    totalAiCostUsd += log.costUsd
    if (log.status === 'failover') totalFailovers++

    // By Provider
    const prov = (log.provider as ProviderId) || 'kimi'
    costByProvider[prov] = (costByProvider[prov] || 0) + log.costUsd
    callsByProvider[prov] = (callsByProvider[prov] || 0) + 1
    if (log.responseTimeMs > 0) {
      if (!latencyByProvider[prov]) latencyByProvider[prov] = { sum: 0, count: 0 }
      latencyByProvider[prov].sum += log.responseTimeMs
      latencyByProvider[prov].count += 1
    }

    // By Task
    const task = log.taskType || 'full_analysis'
    costByTask[task] = (costByTask[task] || 0) + log.costUsd
    callsByTask[task] = (callsByTask[task] || 0) + 1

    // By User
    if (log.userId) {
      if (!costByUser[log.userId]) {
        costByUser[log.userId] = { userId: log.userId, email: log.userId, costUsd: 0, calls: 0 }
      }
      costByUser[log.userId].costUsd += log.costUsd
      costByUser[log.userId].calls += 1
    }

    // Benchmark Table per Model
    const modelKey = log.usedModel || PROVIDER_CONFIGS[prov]?.defaultModel || 'kimi-k3'
    if (!modelStats[modelKey]) {
      modelStats[modelKey] = {
        provider: prov,
        model: modelKey,
        calls: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencySum: 0,
        successCount: 0,
        failoverCount: 0,
      }
    }
    modelStats[modelKey].calls += 1
    modelStats[modelKey].tokensIn += log.tokensIn
    modelStats[modelKey].tokensOut += log.tokensOut
    modelStats[modelKey].costUsd += log.costUsd
    modelStats[modelKey].latencySum += log.responseTimeMs
    if (log.status === 'success' || log.status === 'failover') {
      modelStats[modelKey].successCount += 1
    }
    if (log.status === 'failover') {
      modelStats[modelKey].failoverCount += 1
    }
  }

  // Populate benchmarks table
  const benchmarkTable: ModelBenchmarkItem[] = Object.values(modelStats).map((m) => ({
    provider: m.provider,
    model: m.model,
    callsCount: m.calls,
    tokensTotal: m.tokensIn + m.tokensOut,
    avgLatencyMs: m.calls > 0 ? Math.round(m.latencySum / m.calls) : 0,
    avgCostUsd: m.calls > 0 ? m.costUsd / m.calls : 0,
    successRatePct: m.calls > 0 ? Math.round((m.successCount / m.calls) * 100) : 100,
    failoverCount: m.failoverCount,
  }))

  // Top Consuming Users
  const topUsers = Object.values(costByUser)
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, 10)

  // Fetch emails for top users
  if (topUsers.length > 0) {
    const userIds = topUsers.map((u) => u.userId)
    const userRecords = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    })
    for (const u of topUsers) {
      const rec = userRecords.find((r) => r.id === u.userId)
      if (rec) u.email = rec.email || rec.name || u.userId
    }
  }

  const avgCostPerUserUsd = userCount > 0 ? totalAiCostUsd / userCount : 0
  const avgCostPerAnalysisUsd = resumeCount > 0 ? totalAiCostUsd / resumeCount : 0

  return {
    costs: {
      totalAiCostUsd,
      totalAiCostBrl: totalAiCostUsd * 5.4,
      avgCostPerUserUsd,
      avgCostPerAnalysisUsd,
      costByProvider,
      costByTask,
    },
    usage: {
      totalAiCalls,
      totalFailovers,
      totalErrors,
      callsByProvider,
      callsByTask,
      latencyByProvider: Object.fromEntries(
        Object.entries(latencyByProvider).map(([k, v]) => [
          k,
          v.count > 0 ? Math.round(v.sum / v.count) : 0,
        ])
      ),
    },
    rankings: {
      topTasks: Object.entries(costByTask)
        .map(([task, cost]) => ({ task, costUsd: cost, calls: callsByTask[task] || 0 }))
        .sort((a, b) => b.costUsd - a.costUsd),
      topModels: Object.entries(callsByProvider)
        .map(([provider, calls]) => ({ provider, calls, costUsd: costByProvider[provider] || 0 }))
        .sort((a, b) => b.calls - a.calls),
      topUsers,
    },
    benchmarks: benchmarkTable,
    operationalFailures,
  }
}
