import { STALE_AFTER_DAYS } from '../jobs/lifecycle'

/**
 * Quanto sabemos sobre cada fonte de vaga — e quão confiável é isso.
 *
 * ## Por que isto existe
 *
 * "Essa fonte é boa?" hoje só tem resposta anedótica. Este módulo mede, por
 * fonte, três coisas que já temos dado para responder sem custo novo: **tempo
 * de renovação** (quanto uma vaga dura, do primeiro avistamento ao
 * encerramento), **qualidade do dado** (salário informado, requisitos
 * preenchidos, cargo reconhecido pela taxonomia) e **rendimento real**
 * (quantas vagas dessa fonte viraram alerta forte/bom no Radar, e quantas o
 * usuário confirmou como útil).
 *
 * ## O que isto NÃO é
 *
 * Não decide nada sozinho. É observação, não controle — a decisão de mudar
 * termos, países ou orçamento de busca continua sendo de uma pessoa, lendo
 * este relatório. Ver §30: o produto não muda comportamento por conta própria
 * a partir de sinal indireto.
 *
 * ## Maturidade — a pergunta que vem antes de "o que ele sabe"
 *
 * Uma média de 3 vagas fechadas não é um padrão, é ruído. `maturity` existe
 * pra dizer isso em voz alta: quanto dado e quanta janela de tempo sustentam
 * cada número, para que confiar nele — hoje por uma pessoa lendo o painel,
 * um dia por uma regra automática — seja uma decisão informada, não um
 * acidente de pouca amostra.
 */

export type MaturityLevel = 'baixa' | 'média' | 'alta'

export interface RawJobForQuality {
  sourceSlug: string
  createdAt: Date | string
  publishedAt: Date | string | null
  closedAt: Date | string | null
  salaryMin: number | null
  salaryMax: number | null
  requirements: string | null
  skills: string | null
  normalizedTitle: string | null
}

export interface RawAlertForQuality {
  sourceSlug: string
  overallFit: string
  feedback: string | null
}

export interface SourceQualityItem {
  sourceSlug: string
  totalJobs: number
  closedJobs: number
  /** Dias desde a vaga mais antiga vista desta fonte até agora. */
  observationDays: number
  /** Média de dias entre primeiro avistamento e encerramento. Nulo sem amostra suficiente (ver `minClosedForLifespan`). */
  avgLifespanDays: number | null
  /** 0–100. Vaga com salaryMin ou salaryMax preenchido. */
  salaryDisclosureRate: number
  /** 0–100. Vaga com ao menos um requisito ou competência extraído. */
  requirementsFillRate: number
  /** 0–100. Vaga cujo título bateu com um conceito da taxonomia. */
  recognizedTitleRate: number
  totalAlerts: number
  /** 0–100. Dos alertas gerados, quantos foram `strong` ou `good`. */
  strongOrGoodShare: number
  /** 0–100. De quem respondeu feedback, quantos marcaram 👍. Nulo sem ninguém ter respondido. */
  positiveFeedbackShare: number | null
  maturity: MaturityLevel
  maturityReason: string
}

function parseListLength(raw: string | null): number {
  if (!raw) return 0
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

/**
 * Amostra mínima para um `avgLifespanDays` significar algo. Abaixo disso, um
 * encerramento isolado (uma vaga sazonal, um erro de coleta corrigido tarde)
 * dominaria a média sozinho.
 */
const MIN_CLOSED_FOR_LIFESPAN = 5

/**
 * Limiares de maturidade — os mesmos para todo mundo, para que o rótulo
 * signifique a mesma coisa em qualquer fonte.
 *
 * `alta` exige uma janela de observação de pelo menos `STALE_AFTER_DAYS`: é o
 * prazo que o próprio produto usa para decidir que uma vaga sumiu de vez (ver
 * `lifecycle.ts`) — confiar no padrão de renovação de uma fonte antes de tê-la
 * observado por esse tempo seria julgar o relógio antes dele dar uma volta
 * inteira.
 */
function maturityFor(totalJobs: number, closedJobs: number, observationDays: number): { level: MaturityLevel; reason: string } {
  if (totalJobs < 20 || observationDays < 14) {
    return {
      level: 'baixa',
      reason: `${totalJobs} vaga(s) em ${observationDays} dia(s) de observação — cedo demais para confiar no padrão.`,
    }
  }
  if (totalJobs < 100 || closedJobs < MIN_CLOSED_FOR_LIFESPAN || observationDays < STALE_AFTER_DAYS) {
    return {
      level: 'média',
      reason: `${totalJobs} vagas em ${observationDays} dias, ${closedJobs} encerrada(s) — dá para ver tendência, ainda não para decidir sozinho a partir disto.`,
    }
  }
  return {
    level: 'alta',
    reason: `${totalJobs} vagas em ${observationDays} dias, ${closedJobs} encerradas — amostra e janela cobrem um ciclo inteiro de renovação.`,
  }
}

/**
 * Agrega vagas e alertas por fonte, calculando qualidade, tempo de renovação
 * e maturidade da amostra.
 *
 * Função pura: não toca no banco. Quem lê os dados é a rota; isso é o que
 * torna o cálculo testável sem infraestrutura, mesmo padrão de
 * `calculateMarketPerformance` e de `decideCollection`.
 */
export function calculateSourceQuality(
  jobs: RawJobForQuality[],
  alerts: RawAlertForQuality[],
  now: Date = new Date()
): SourceQualityItem[] {
  interface Accumulator {
    sourceSlug: string
    totalJobs: number
    closedJobs: number
    earliestSeen: Date
    lifespanDaysSum: number
    lifespanSamples: number
    withSalary: number
    withRequirements: number
    withRecognizedTitle: number
  }

  const bySource = new Map<string, Accumulator>()

  function accFor(slug: string): Accumulator {
    let acc = bySource.get(slug)
    if (!acc) {
      acc = {
        sourceSlug: slug,
        totalJobs: 0,
        closedJobs: 0,
        earliestSeen: now,
        lifespanDaysSum: 0,
        lifespanSamples: 0,
        withSalary: 0,
        withRequirements: 0,
        withRecognizedTitle: 0,
      }
      bySource.set(slug, acc)
    }
    return acc
  }

  for (const job of jobs) {
    const acc = accFor(job.sourceSlug)
    acc.totalJobs += 1

    const createdAt = toDate(job.createdAt)
    if (createdAt < acc.earliestSeen) acc.earliestSeen = createdAt

    if (job.salaryMin != null || job.salaryMax != null) acc.withSalary += 1
    if (parseListLength(job.requirements) > 0 || parseListLength(job.skills) > 0) acc.withRequirements += 1
    if (job.normalizedTitle) acc.withRecognizedTitle += 1

    if (job.closedAt) {
      acc.closedJobs += 1
      const start = job.publishedAt ? toDate(job.publishedAt) : createdAt
      const lifespanDays = (toDate(job.closedAt).getTime() - start.getTime()) / 86_400_000
      // Encerramento com data de início inconsistente (vaga "criada" depois do
      // encerramento, por exemplo republicação com data trocada) não entra na
      // média — um número negativo não é "renovação rápida", é dado ruim.
      if (lifespanDays >= 0) {
        acc.lifespanDaysSum += lifespanDays
        acc.lifespanSamples += 1
      }
    }
  }

  const alertsBySource = new Map<string, RawAlertForQuality[]>()
  for (const alert of alerts) {
    const list = alertsBySource.get(alert.sourceSlug) ?? []
    list.push(alert)
    alertsBySource.set(alert.sourceSlug, list)
  }

  const items: SourceQualityItem[] = []

  for (const acc of bySource.values()) {
    const observationDays = Math.max(0, Math.floor((now.getTime() - acc.earliestSeen.getTime()) / 86_400_000))
    const sourceAlerts = alertsBySource.get(acc.sourceSlug) ?? []
    const strongOrGood = sourceAlerts.filter((a) => a.overallFit === 'strong' || a.overallFit === 'good').length
    const withFeedback = sourceAlerts.filter((a) => a.feedback === 'interested' || a.feedback === 'not_useful')
    const positive = withFeedback.filter((a) => a.feedback === 'interested').length

    const { level, reason } = maturityFor(acc.totalJobs, acc.closedJobs, observationDays)

    items.push({
      sourceSlug: acc.sourceSlug,
      totalJobs: acc.totalJobs,
      closedJobs: acc.closedJobs,
      observationDays,
      avgLifespanDays:
        acc.lifespanSamples >= MIN_CLOSED_FOR_LIFESPAN
          ? Math.round((acc.lifespanDaysSum / acc.lifespanSamples) * 10) / 10
          : null,
      salaryDisclosureRate: pct(acc.withSalary, acc.totalJobs),
      requirementsFillRate: pct(acc.withRequirements, acc.totalJobs),
      recognizedTitleRate: pct(acc.withRecognizedTitle, acc.totalJobs),
      totalAlerts: sourceAlerts.length,
      strongOrGoodShare: pct(strongOrGood, sourceAlerts.length),
      positiveFeedbackShare: withFeedback.length > 0 ? pct(positive, withFeedback.length) : null,
      maturity: level,
      maturityReason: reason,
    })
  }

  return items.sort((a, b) => b.totalJobs - a.totalJobs)
}
