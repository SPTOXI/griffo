/**
 * Quanto sabemos sobre cada agente de IA do produto — e sobre o sistema como
 * um todo — e quão confiável é isso.
 *
 * Mesmo espírito de `job-source-quality.ts`, aplicado a `AiLog` e
 * `SystemIncident` em vez de `Job`/`RadarAlert`: mede sem decidir nada
 * sozinho, e diz o quanto dá para confiar em cada número por amostra e por
 * janela de tempo observada. Os limiares aqui são outros — chamada de IA
 * acontece com frequência bem maior que coleta de vaga — mas a pergunta é a
 * mesma, e a resposta continua qualitativa (baixa/média/alta), nunca um
 * percentual inventado de "confiança".
 *
 * Cada `TaskType` do roteador (`ai-router/types.ts`) é um "agente": análise
 * de currículo, orientação vocacional, carta, extração de perfil, dedup de
 * vagas, suporte... Cada um tem seu próprio histórico de sucesso, fallback e
 * (quando amostrado) nota de qualidade do juiz já existente.
 */

export type MaturityLevel = 'baixa' | 'média' | 'alta'

export interface RawAiLogForMaturity {
  taskType: string
  /** success | fallback | error — ver `AiLog.status`. */
  status: string
  failoverCount: number
  responseTimeMs: number
  /** Nulo = não sorteado pelo juiz de qualidade, não "reprovado". */
  qualityScore: number | null
  createdAt: Date | string
}

export interface RawIncidentForMaturity {
  /** low | medium | high | critical */
  severity: string
  /** investigating | auto_fixed | action_required | resolved */
  status: string
  createdAt: Date | string
}

export interface AgentMaturityItem {
  taskType: string
  totalCalls: number
  /** 0–100. `success` ou `fallback` contam como desfecho bem-sucedido — quem falhou de vez é só `error`. */
  successRate: number
  /** 0–100. Chamadas que precisaram de mais de um provedor. */
  failoverRate: number
  avgResponseTimeMs: number
  qualitySamples: number
  /** Nulo sem nenhuma amostra julgada pelo juiz de qualidade. */
  avgQualityScore: number | null
  observationDays: number
  maturity: MaturityLevel
  maturityReason: string
}

export interface SystemMaturity {
  totalCalls: number
  overallSuccessRate: number
  totalIncidents: number
  /** Incidentes graves (`high`/`critical`) que ainda não foram resolvidos. */
  unresolvedHighSeverity: number
  /** Nulo sem nenhum incidente registrado — não é "0% de resolução", é "sem histórico". */
  incidentResolutionRate: number | null
  observationDays: number
  maturity: MaturityLevel
  maturityReason: string
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

/**
 * Amostra mínima de nota de qualidade para a média significar algo — o juiz
 * amostra, não julga toda chamada, então poucas notas dão um número instável.
 */
const MIN_QUALITY_SAMPLES = 5

/**
 * Limiares de maturidade por agente.
 *
 * 30 dias é a referência de janela porque é um ciclo mensal completo — dá
 * para ver variação de dia de semana e de fim de semana, não só uma foto de
 * alguns dias seguidos.
 */
function maturityForAgent(totalCalls: number, observationDays: number): { level: MaturityLevel; reason: string } {
  if (totalCalls < 30 || observationDays < 7) {
    return {
      level: 'baixa',
      reason: `${totalCalls} chamada(s) em ${observationDays} dia(s) — cedo demais para confiar no padrão.`,
    }
  }
  if (totalCalls < 200 || observationDays < 30) {
    return {
      level: 'média',
      reason: `${totalCalls} chamadas em ${observationDays} dias — dá para ver tendência, ainda não para decidir sozinho a partir disto.`,
    }
  }
  return {
    level: 'alta',
    reason: `${totalCalls} chamadas em ${observationDays} dias — amostra e janela cobrem um ciclo mensal inteiro.`,
  }
}

/**
 * Agrega `AiLog` por `taskType`, calculando confiabilidade, qualidade
 * (quando julgada) e maturidade da amostra.
 *
 * Função pura, mesmo padrão de `calculateSourceQuality`: não toca no banco,
 * só transforma o que a rota já leu.
 */
export function calculateAgentMaturity(logs: RawAiLogForMaturity[], now: Date = new Date()): AgentMaturityItem[] {
  interface Accumulator {
    taskType: string
    totalCalls: number
    successOutcomes: number
    withFailover: number
    responseTimeSum: number
    responseTimeSamples: number
    qualitySum: number
    qualitySamples: number
    earliest: Date
  }

  const byTask = new Map<string, Accumulator>()

  for (const log of logs) {
    let acc = byTask.get(log.taskType)
    if (!acc) {
      acc = {
        taskType: log.taskType,
        totalCalls: 0,
        successOutcomes: 0,
        withFailover: 0,
        responseTimeSum: 0,
        responseTimeSamples: 0,
        qualitySum: 0,
        qualitySamples: 0,
        earliest: now,
      }
      byTask.set(log.taskType, acc)
    }

    acc.totalCalls += 1
    if (log.status === 'success' || log.status === 'fallback') acc.successOutcomes += 1
    if (log.failoverCount > 0) acc.withFailover += 1
    if (log.responseTimeMs > 0) {
      acc.responseTimeSum += log.responseTimeMs
      acc.responseTimeSamples += 1
    }
    if (log.qualityScore != null) {
      acc.qualitySum += log.qualityScore
      acc.qualitySamples += 1
    }

    const createdAt = toDate(log.createdAt)
    if (createdAt < acc.earliest) acc.earliest = createdAt
  }

  const items: AgentMaturityItem[] = []
  for (const acc of byTask.values()) {
    const observationDays = Math.max(0, Math.floor((now.getTime() - acc.earliest.getTime()) / 86_400_000))
    const { level, reason } = maturityForAgent(acc.totalCalls, observationDays)

    items.push({
      taskType: acc.taskType,
      totalCalls: acc.totalCalls,
      successRate: pct(acc.successOutcomes, acc.totalCalls),
      failoverRate: pct(acc.withFailover, acc.totalCalls),
      avgResponseTimeMs:
        acc.responseTimeSamples > 0 ? Math.round(acc.responseTimeSum / acc.responseTimeSamples) : 0,
      qualitySamples: acc.qualitySamples,
      avgQualityScore:
        acc.qualitySamples >= MIN_QUALITY_SAMPLES
          ? Math.round((acc.qualitySum / acc.qualitySamples) * 10) / 10
          : null,
      observationDays,
      maturity: level,
      maturityReason: reason,
    })
  }

  return items.sort((a, b) => b.totalCalls - a.totalCalls)
}

/**
 * Maturidade do sistema como um todo: o mesmo cálculo de volume/janela dos
 * agentes, aplicado ao total de chamadas de IA — e um rebaixamento de um
 * nível se houver incidente grave (`high`/`critical`) ainda em aberto agora.
 *
 * Não é média ponderada nem pontuação inventada: é a mesma régua qualitativa,
 * com uma trava simples e auditável — sistema com problema grave aberto não é
 * "alta maturidade" nesse momento, não importa o volume histórico.
 */
export function calculateSystemMaturity(
  logs: RawAiLogForMaturity[],
  incidents: RawIncidentForMaturity[],
  now: Date = new Date()
): SystemMaturity {
  const totalCalls = logs.length
  const successOutcomes = logs.filter((l) => l.status === 'success' || l.status === 'fallback').length

  let earliest = now
  for (const log of logs) {
    const createdAt = toDate(log.createdAt)
    if (createdAt < earliest) earliest = createdAt
  }
  const observationDays = totalCalls > 0 ? Math.max(0, Math.floor((now.getTime() - earliest.getTime()) / 86_400_000)) : 0

  const resolved = incidents.filter((i) => i.status === 'resolved' || i.status === 'auto_fixed').length
  const unresolvedHighSeverity = incidents.filter(
    (i) => (i.severity === 'high' || i.severity === 'critical') && i.status !== 'resolved' && i.status !== 'auto_fixed'
  ).length

  const base = maturityForAgent(totalCalls, observationDays)
  let level = base.level
  let reason = base.reason

  if (unresolvedHighSeverity > 0) {
    level = level === 'alta' ? 'média' : 'baixa'
    reason = `${unresolvedHighSeverity} incidente(s) grave(s) em aberto agora — maturidade rebaixada até serem resolvidos, independente do volume histórico.`
  }

  return {
    totalCalls,
    overallSuccessRate: pct(successOutcomes, totalCalls),
    totalIncidents: incidents.length,
    unresolvedHighSeverity,
    incidentResolutionRate: incidents.length > 0 ? pct(resolved, incidents.length) : null,
    observationDays,
    maturity: level,
    maturityReason: reason,
  }
}
