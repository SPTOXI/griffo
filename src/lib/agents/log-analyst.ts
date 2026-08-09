import 'server-only'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'

/**
 * Análise periódica do `AiLog` (P11).
 *
 * O painel já mostra contagens: chamadas por provedor, failovers, latência
 * média. O que ele não mostra é **correlação** — que as falhas do Kimi se
 * concentram em currículos longos, que o failover dispara em horário de pico,
 * que um provedor degradou depois de uma troca de modelo. Isso exige olhar o
 * conjunto, e é o tipo de leitura que um modelo faz bem.
 *
 * Roda em lote, acionado pelo administrador, e no DeepSeek — é análise de texto
 * sobre dados já agregados, não precisa do modelo caro.
 *
 * Diferente do agente de diagnóstico, que faz checagem determinística: ali um
 * LLM só acrescentaria prosa a um resultado que já é objetivo. Aqui o valor
 * está justamente em encontrar o padrão que ninguém pensou em consultar.
 */

const MAX_SAMPLE = 300

export interface LogInsightsReport {
  windowDays: number
  totalCalls: number
  failures: number
  failovers: number
  judged: number
  avgQualityScore: number | null
  insights: string
  generatedAt: string
}

/** Agrega os dados brutos. Sem IA: é a matéria-prima da leitura seguinte. */
async function collectStats(windowDays: number) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const [logs, byProvider, byTask, qualityAgg] = await Promise.all([
    db.aiLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE,
      select: {
        taskType: true,
        provider: true,
        usedModel: true,
        status: true,
        failoverCount: true,
        responseTimeMs: true,
        tokensIn: true,
        tokensOut: true,
        errorMessage: true,
        qualityScore: true,
        qualityNotes: true,
        createdAt: true,
      },
    }),
    db.aiLog.groupBy({
      by: ['provider', 'status'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { responseTimeMs: true },
    }),
    db.aiLog.groupBy({
      by: ['taskType', 'status'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.aiLog.aggregate({
      where: { createdAt: { gte: since }, qualityScore: { not: null } },
      _avg: { qualityScore: true },
      _count: { qualityScore: true },
    }),
  ])

  return { logs, byProvider, byTask, qualityAgg }
}

export async function analyzeAiLogs(windowDays = 7): Promise<LogInsightsReport> {
  const { logs, byProvider, byTask, qualityAgg } = await collectStats(windowDays)

  const failures = logs.filter((l) => l.status === 'error')
  const failovers = logs.filter((l) => l.failoverCount > 0)

  const base: Omit<LogInsightsReport, 'insights'> = {
    windowDays,
    totalCalls: logs.length,
    failures: failures.length,
    failovers: failovers.length,
    judged: qualityAgg._count.qualityScore || 0,
    avgQualityScore: qualityAgg._avg.qualityScore ?? null,
    generatedAt: new Date().toISOString(),
  }

  if (logs.length === 0) {
    return { ...base, insights: 'Não há chamadas de IA registradas na janela analisada.' }
  }

  // Amostras dos casos ruins: é onde o padrão costuma estar.
  const failureSample = failures.slice(0, 30).map((l) => ({
    tarefa: l.taskType,
    provedor: l.provider,
    modelo: l.usedModel,
    erro: l.errorMessage?.slice(0, 200),
    tokensEntrada: l.tokensIn,
    latenciaMs: l.responseTimeMs,
    hora: l.createdAt.toISOString().slice(11, 16),
  }))

  const lowQualitySample = logs
    .filter((l) => l.qualityScore !== null && l.qualityScore < 7)
    .slice(0, 20)
    .map((l) => ({
      tarefa: l.taskType,
      modelo: l.usedModel,
      nota: l.qualityScore,
      observacao: l.qualityNotes,
    }))

  const context = {
    janelaDias: windowDays,
    totalChamadasAmostradas: logs.length,
    porProvedor: byProvider.map((g) => ({
      provedor: g.provider,
      status: g.status,
      chamadas: g._count._all,
      latenciaMediaMs: Math.round(g._avg.responseTimeMs || 0),
    })),
    porTarefa: byTask.map((g) => ({
      tarefa: g.taskType,
      status: g.status,
      chamadas: g._count._all,
    })),
    qualidadeAmostrada: {
      julgadas: base.judged,
      notaMedia: base.avgQualityScore,
      amostrasAbaixoDe7: lowQualitySample,
    },
    amostraDeFalhas: failureSample,
  }

  try {
    const result = await executeAiTask({
      taskType: 'support_chat', // DeepSeek em INITIAL_TASK_ROUTING
      internal: true,
      systemPrompt: `Você é analista de confiabilidade de uma plataforma que usa múltiplos provedores de IA.

Receberá estatísticas agregadas e amostras de falhas. Procure CORRELAÇÕES, não repita as contagens — quem lê já as tem na tela.

Foque em:
1. Falhas concentradas em algum provedor, modelo, tarefa ou horário.
2. Relação entre tamanho da entrada (tokensEntrada) e falha ou latência.
3. Queda de qualidade associada a um modelo específico.
4. O que NÃO dá para concluir com os dados disponíveis — dizer isso vale mais que inventar um padrão.

Responda em português, em no máximo 6 tópicos curtos. Se não houver padrão discernível, diga isso claramente em vez de forçar uma conclusão.`,
      userPrompt: `Dados dos últimos ${windowDays} dias:\n\n${JSON.stringify(context, null, 2)}`,
      maxTokens: 1200,
    })

    return { ...base, insights: result.content.trim() }
  } catch (e: any) {
    console.error('[log-analyst] Falha ao gerar leitura:', e?.message || e)
    return {
      ...base,
      insights:
        'Não foi possível gerar a leitura automática nesta execução. ' +
        'Os números agregados acima continuam válidos.',
    }
  }
}
