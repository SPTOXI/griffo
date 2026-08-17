/**
 * O filtro duro (§16) — o que a IA não precisa nem ver.
 *
 * O fluxo do Radar é:
 *
 *   perfil → preferências → mercado-alvo → FILTRO DURO → vagas elegíveis →
 *   normalização → matching IA → explicação → score → filtro de qualidade → alerta
 *
 * Este arquivo é a quarta caixa. Ele existe por dois motivos, e o segundo é o
 * que importa mais:
 *
 * 1. **Custo.** Mandar para a IA uma vaga presencial em Tóquio para alguém que
 *    só aceita remoto no Brasil é pagar por uma resposta previsível.
 * 2. **Qualidade do alerta.** Cada vaga incompatível que escapa até o fim
 *    consome a atenção que o usuário reservou para o Radar. O produto promete
 *    "silêncio por padrão"; ruído aqui é quebra de promessa, não desperdício.
 *
 * ## A regra que governa todos os filtros deste arquivo
 *
 * **Desconhecido nunca elimina.** Uma vaga que não diz o modelo de trabalho não
 * é uma vaga presencial: é uma vaga que não disse. Descartar por ausência de
 * informação transforma silêncio da fonte em rejeição ao candidato — e o
 * candidato nunca fica sabendo que existiu.
 *
 * É o mesmo princípio do §12 aplicado do outro lado do sistema: na dúvida,
 * mantenha; deixe a IA e o filtro de qualidade decidirem depois, com mais
 * contexto.
 */

import { seniorityMeets, type SeniorityLevel } from '../market/taxonomy'
import type { ProfessionalProfile } from '../profile'
import type { NormalizedJob } from '../jobs/types'

/** Por que uma vaga foi eliminada antes da IA. */
export type FilterReason =
  | 'location_incompatible'
  | 'work_mode_rejected'
  | 'seniority_below'
  | 'contract_type_rejected'
  | 'market_not_targeted'
  | 'job_closed'

export interface FilterOutcome {
  eligible: boolean
  /** Vazio quando elegível. Mais de um motivo é possível e útil no painel. */
  reasons: FilterReason[]
  /** Explicação legível, para o log e para o "por que não vi esta vaga". */
  explanation: string
}

const REASON_TEXT: Record<FilterReason, string> = {
  location_incompatible: 'a vaga é presencial num país que você não declarou como alvo',
  work_mode_rejected: 'o modelo de trabalho não está entre os que você aceita',
  seniority_below: 'a senioridade pedida está acima da sua',
  contract_type_rejected: 'o tipo de contrato não está entre os que você aceita',
  market_not_targeted: 'a vaga é de um mercado que não está entre os seus',
  job_closed: 'a vaga foi encerrada',
}

/** Mercados que valem para esta pessoa: o principal, os alternativos, e o global. */
export function targetMarketsOf(profile: ProfessionalProfile): string[] {
  const markets = new Set<string>()
  if (profile.primaryMarket) markets.add(profile.primaryMarket)
  for (const m of profile.alternativeMarkets) markets.add(m)
  // Quem aceita remoto internacional aceita, por definição, vaga sem mercado
  // fixo. Sem isto, declarar abertura ao mundo excluiria as vagas do mundo.
  if (profile.openToInternationalRemote) markets.add('GLOBAL')
  return [...markets]
}

/**
 * A vaga passa pelo filtro duro?
 *
 * Função pura sobre perfil e vaga. Não chama IA, não toca banco: é ela que
 * decide o que vale a pena mandar para a IA, então precisa ser mais barata que
 * a IA por ordens de grandeza.
 */
export function applyHardFilters(
  job: NormalizedJob & { closedAt?: Date | null },
  profile: ProfessionalProfile
): FilterOutcome {
  const reasons: FilterReason[] = []

  if (job.closedAt) {
    reasons.push('job_closed')
  }

  // --- Mercado ---
  // Só filtra quando a pessoa declarou algum alvo. Perfil vazio vê tudo: é
  // melhor que ver nada enquanto ainda não disse o que quer.
  const targets = targetMarketsOf(profile)
  if (targets.length > 0 && job.market) {
    const remoteReachesAnyone = job.remoteType === 'remote' && profile.openToInternationalRemote
    if (!targets.includes(job.market) && !remoteReachesAnyone) {
      reasons.push('market_not_targeted')
    }
  }

  // --- Modelo de trabalho ---
  // `unknown` passa: a vaga não disse, e não dizer não é ser presencial.
  if (profile.workModes.length > 0 && job.remoteType !== 'unknown') {
    if (!profile.workModes.includes(job.remoteType)) {
      reasons.push('work_mode_rejected')
    }
  }

  // --- Localização física ---
  // Só é obstáculo para vaga PRESENCIAL. Vaga remota não tem localização
  // incompatível, e híbrida depende de acordo — nenhuma das duas é filtro duro.
  if (
    job.remoteType === 'onsite' &&
    job.country &&
    profile.residenceCountry &&
    job.country !== profile.residenceCountry &&
    !profile.openToRelocation &&
    !targets.includes(job.country)
  ) {
    reasons.push('location_incompatible')
  }

  // --- Senioridade ---
  // `seniorityMeets` devolve `true` quando qualquer lado é desconhecido.
  if (!seniorityMeets(profile.seniority as SeniorityLevel | null, job.seniority as SeniorityLevel | null)) {
    reasons.push('seniority_below')
  }

  // --- Tipo de contrato ---
  // Comparação frouxa de propósito: "CLT" e "Efetivo CLT" são o mesmo vínculo,
  // e exigir igualdade exata eliminaria vagas boas por diferença de redação.
  if (profile.contractTypes.length > 0 && job.employmentType) {
    const wanted = profile.contractTypes.map((c) => c.toLowerCase().trim())
    const offered = job.employmentType.toLowerCase().trim()
    const matches = wanted.some((w) => offered.includes(w) || w.includes(offered))
    if (!matches) reasons.push('contract_type_rejected')
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    explanation: reasons.length
      ? `Não elegível: ${reasons.map((r) => REASON_TEXT[r]).join('; ')}.`
      : 'Elegível para avaliação.',
  }
}

export interface FilterBatchResult {
  eligible: NormalizedJob[]
  /** Vagas eliminadas, com o motivo. Alimenta as métricas do §29. */
  rejected: { job: NormalizedJob; outcome: FilterOutcome }[]
}

/**
 * Aplica o filtro a um lote.
 *
 * O que sobra é o que vale pagar para a IA avaliar. A proporção entre os dois
 * é uma métrica de saúde: filtro que aprova tudo não está filtrando, e filtro
 * que reprova tudo está eliminando o produto.
 */
export function filterJobs(
  jobs: (NormalizedJob & { closedAt?: Date | null })[],
  profile: ProfessionalProfile
): FilterBatchResult {
  const eligible: NormalizedJob[] = []
  const rejected: { job: NormalizedJob; outcome: FilterOutcome }[] = []

  for (const job of jobs) {
    const outcome = applyHardFilters(job, profile)
    if (outcome.eligible) eligible.push(job)
    else rejected.push({ job, outcome })
  }

  return { eligible, rejected }
}
