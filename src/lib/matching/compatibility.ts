/**
 * Compatibilidade em três eixos (§9) — e por que não é um número só.
 *
 * O `matchPercentage` que o produto já tinha é uma leitura do modelo sobre o
 * currículo. O §9 é explícito sobre o que ele NÃO é: probabilidade de
 * contratação, chance de conseguir emprego, ou percentual real de aderência ao
 * mercado. E o §17 proíbe apresentá-lo como tal.
 *
 * O problema de um número único não é a imprecisão — é que ele apaga a
 * informação que o usuário precisa para decidir. "78%" não diz se falta uma
 * competência que ele aprende num fim de semana ou se falta autorização de
 * trabalho no país. As duas coisas produzem o mesmo 78 e pedem decisões opostas.
 *
 * Por isso, três eixos que não se somam:
 *
 * - **Profissional** — o que a pessoa é: competências, experiência, senioridade.
 *   Muda devagar.
 * - **Com a vaga** — o que ESTA vaga pede contra o que ela tem. Muda a cada vaga.
 * - **Contextual** — localização, idioma, modelo de trabalho, contrato. Não é
 *   sobre competência: é sobre viabilidade. Uma incompatibilidade aqui não se
 *   resolve estudando.
 *
 * Mais **lacunas** (o que falta) e **evidências** (por que chegamos aqui). O §9
 * termina dizendo: "O usuário deve conseguir entender o motivo do match".
 *
 * ## Sobre os números internos
 *
 * Cada eixo tem um score de 0 a 100. Ele é **sinal interno**: ordena a fila do
 * Radar e alimenta o filtro de qualidade. O que vai para a tela é o rótulo
 * qualitativo. Nenhuma função deste arquivo devolve algo que possa ser exibido
 * como "X% de chance".
 */

import { isSameRole, seniorityMeets, type SeniorityLevel } from '../market/taxonomy'
import { SENIORITY_ORDER } from '../market/taxonomy'
import type { ProfessionalProfile } from '../profile'
import type { NormalizedJob } from '../jobs/types'

export type CompatibilityLevel = 'high' | 'medium' | 'low'

export interface CompatibilityAxis {
  /** 0–100. Sinal interno; nunca exibido como probabilidade. */
  score: number
  level: CompatibilityLevel
  /** Por que este eixo pontuou assim. Frases prontas para a tela. */
  evidence: string[]
  /** O que falta neste eixo, e que se resolve com preparo ou tempo. */
  gaps: string[]
  /**
   * Impedimentos: o que NÃO se resolve estudando nem se candidatando melhor.
   * Morar no país errado sem querer mudar, não ter o idioma exigido.
   *
   * Separado de `gaps` porque a diferença é categórica, não de grau. Um
   * impedimento não é "muitos pontos negativos" — é uma porta fechada, e
   * tratá-lo como desconto numérico deixa um encaixe profissional excelente
   * mascarar uma vaga inviável.
   */
  blockers: string[]
}

/** O veredito geral, em palavras. Nunca em porcentagem (§17). */
export type OverallFit = 'strong' | 'good' | 'partial' | 'weak'

export type Recommendation = 'apply' | 'consider' | 'stretch' | 'skip'

export interface MatchResult {
  professional: CompatibilityAxis
  jobFit: CompatibilityAxis
  contextual: CompatibilityAxis
  overall: OverallFit
  recommendation: Recommendation
  /**
   * Impedimentos concretos — coisas que não se resolvem com preparo. Autorização
   * de trabalho, idioma exigido que a pessoa não tem, presencial em outro país.
   */
  blockers: string[]
  /** Frase única para a tela. Fala de compatibilidade, nunca de contratação. */
  headline: string
}

function levelOf(score: number): CompatibilityLevel {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Competências do candidato que aparecem na lista pedida. */
function intersectSkills(candidate: string[], required: string[]): { matched: string[]; missing: string[] } {
  const have = candidate.map(normalizeToken).filter(Boolean)
  const matched: string[] = []
  const missing: string[] = []

  for (const req of required) {
    const needle = normalizeToken(req)
    if (!needle) continue
    // Contido nos dois sentidos: "SQL" casa com "SQL avançado", e vice-versa.
    const found = have.some((h) => h === needle || h.includes(needle) || needle.includes(h))
    if (found) matched.push(req)
    else missing.push(req)
  }

  return { matched, missing }
}

/**
 * Eixo 1 — quem a pessoa é.
 *
 * Não olha a vaga. É o mesmo resultado para todas as vagas do mesmo cargo, e é
 * por isso que ele pode ser calculado uma vez e reaproveitado (§27).
 */
export function professionalAxis(profile: ProfessionalProfile, job: NormalizedJob): CompatibilityAxis {
  const evidence: string[] = []
  const gaps: string[] = []
  let score = 50 // Sem informação nenhuma, o meio: nem promessa nem condenação.

  // Cargo equivalente entre mercados — é aqui que a taxonomia paga.
  const candidateTitles = [profile.currentTitle, ...profile.targetRoles].filter(Boolean) as string[]
  const sameRole = candidateTitles.some((t) => isSameRole(t, job.title))
  if (sameRole) {
    score += 25
    evidence.push(`Sua trajetória é do mesmo cargo que a vaga (${job.title}).`)
  } else if (job.normalizedTitle && candidateTitles.length > 0) {
    gaps.push('A vaga é de um cargo diferente do que você exerce ou declarou como alvo.')
    score -= 10
  }

  // Senioridade
  const candidateSeniority = profile.seniority as SeniorityLevel | null
  const jobSeniority = job.seniority as SeniorityLevel | null
  if (candidateSeniority && jobSeniority) {
    const delta = SENIORITY_ORDER.indexOf(candidateSeniority) - SENIORITY_ORDER.indexOf(jobSeniority)
    if (delta === 0) {
      score += 15
      evidence.push('Sua senioridade é exatamente a pedida.')
    } else if (delta > 0) {
      score += 8
      evidence.push('Sua senioridade está acima da pedida.')
    } else {
      score -= 15
      gaps.push('A vaga pede senioridade acima da sua.')
    }
  }

  // Experiência declarada
  if (profile.yearsExperience != null && profile.yearsExperience >= 3) {
    score += 5
    evidence.push(`${profile.yearsExperience} anos de experiência declarados.`)
  }

  if (evidence.length === 0) {
    gaps.push('Seu perfil profissional tem poucos dados preenchidos — o diagnóstico fica limitado.')
  }

  const bounded = Math.max(0, Math.min(100, score))
  return { score: bounded, level: levelOf(bounded), evidence, gaps, blockers: [] }
}

/**
 * Eixo 2 — o que ESTA vaga pede.
 *
 * É o eixo que muda de vaga para vaga, e o que o usuário mais quer ver: quais
 * requisitos ele atende e quais não.
 */
export function jobFitAxis(profile: ProfessionalProfile, job: NormalizedJob): CompatibilityAxis {
  const evidence: string[] = []
  const gaps: string[] = []

  const candidateSkills = [...profile.skills, ...profile.specializations]
  const required = [...job.requirements, ...job.skills]

  if (required.length === 0) {
    // Vaga sem requisitos listados não é vaga sem requisitos: é vaga que não os
    // publicou. Pontuar alto seria inventar aderência.
    return {
      score: 50,
      level: 'medium',
      evidence: [],
      gaps: ['A vaga não lista requisitos objetivos — não há como medir aderência ponto a ponto.'],
      blockers: [],
    }
  }

  const { matched, missing } = intersectSkills(candidateSkills, required)
  const ratio = matched.length / required.length
  const score = Math.round(ratio * 100)

  if (matched.length) {
    evidence.push(`Você atende ${matched.length} de ${required.length} requisitos: ${matched.slice(0, 6).join(', ')}.`)
  }
  if (missing.length) {
    gaps.push(`Requisitos não evidenciados no seu perfil: ${missing.slice(0, 6).join(', ')}.`)
  }
  if (candidateSkills.length === 0) {
    gaps.push('Você ainda não declarou competências no perfil — sem elas a comparação com a vaga é fraca.')
  }

  return { score, level: levelOf(score), evidence, gaps, blockers: [] }
}

/**
 * Eixo 3 — viabilidade.
 *
 * Localização, idioma, modelo de trabalho, contrato. Uma incompatibilidade aqui
 * não se resolve estudando, e é por isso que ela é separada: misturá-la com
 * competência produziria um número que esconde um impedimento.
 */
export function contextualAxis(profile: ProfessionalProfile, job: NormalizedJob): CompatibilityAxis {
  const evidence: string[] = []
  const gaps: string[] = []
  const blockers: string[] = []
  let score = 100 // Parte do viável e desconta o que atrapalha.

  // Modelo de trabalho
  if (job.remoteType !== 'unknown' && profile.workModes.length > 0) {
    if (profile.workModes.includes(job.remoteType)) {
      evidence.push(`Modelo de trabalho compatível (${job.remoteType}).`)
    } else {
      score -= 40
      gaps.push(`A vaga é ${job.remoteType} e você não marcou esse modelo como aceito.`)
    }
  }

  // Localização
  if (job.country && profile.residenceCountry) {
    if (job.country === profile.residenceCountry) {
      evidence.push('A vaga é no país onde você mora.')
    } else if (job.remoteType === 'remote' && profile.openToInternationalRemote) {
      evidence.push('Vaga remota em outro país, e você aceita remoto internacional.')
    } else if (profile.openToRelocation) {
      evidence.push('Vaga em outro país, e você declarou disponibilidade para mudança.')
      score -= 10
    } else {
      score -= 35
      blockers.push('A vaga é em outro país e você não declarou disponibilidade para mudança nem para remoto internacional.')
    }
  }

  // Idioma da vaga contra os idiomas declarados
  if (job.language) {
    const spoken = profile.spokenLanguages.map((l) => l.code.toLowerCase())
    const jobLang = job.language.slice(0, 2).toLowerCase()
    if (spoken.length > 0) {
      if (spoken.includes(jobLang)) {
        evidence.push(`Você declarou domínio do idioma da vaga (${jobLang}).`)
      } else {
        score -= 25
        blockers.push(`A vaga está em ${jobLang} e você não declarou esse idioma.`)
      }
    }
  }

  // Pretensão salarial contra o que a vaga oferece.
  // Só compara quando as DUAS existem e a moeda bate. Comparar valores em
  // moedas diferentes produziria conclusão errada com aparência de precisão.
  if (
    profile.salaryMin != null &&
    job.salaryMax != null &&
    profile.salaryCurrency &&
    job.currency &&
    profile.salaryCurrency === job.currency &&
    profile.salaryPeriod === job.salaryPeriod
  ) {
    if (job.salaryMax < profile.salaryMin) {
      score -= 20
      gaps.push(`O teto da vaga (${job.currency} ${job.salaryMax}) está abaixo da sua pretensão mínima.`)
    } else {
      evidence.push('A faixa salarial da vaga alcança sua pretensão.')
    }
  }

  const finalScore = Math.max(0, Math.min(100, score))
  return { score: finalScore, level: levelOf(finalScore), evidence, gaps, blockers }
}

const HEADLINE: Record<OverallFit, string> = {
  strong: 'Esta vaga apresenta forte compatibilidade com seu perfil.',
  good: 'Esta vaga apresenta boa compatibilidade com seu perfil.',
  partial: 'Esta vaga tem compatibilidade parcial com seu perfil.',
  weak: 'Esta vaga tem baixa compatibilidade com seu perfil.',
}

/**
 * O veredito, a partir dos três eixos.
 *
 * O contextual tem poder de veto: por melhor que seja o encaixe profissional,
 * uma vaga inviável não é uma boa vaga. Um candidato perfeito para um cargo
 * presencial em outro país onde ele não pode morar não tem "forte
 * compatibilidade" — tem um impedimento.
 */
export function matchJob(profile: ProfessionalProfile, job: NormalizedJob): MatchResult {
  const professional = professionalAxis(profile, job)
  const jobFit = jobFitAxis(profile, job)
  const contextual = contextualAxis(profile, job)

  const blockers = [...professional.blockers, ...jobFit.blockers, ...contextual.blockers]

  // Média ponderada só como SINAL: o que a vaga pede pesa mais que o perfil
  // genérico, porque é o que decide a triagem.
  const signal = Math.round(professional.score * 0.3 + jobFit.score * 0.45 + contextual.score * 0.25)

  // O impedimento tem poder de veto, e ele é ESTRUTURAL — não um desconto que
  // um bom encaixe profissional possa compensar. Um candidato perfeito para uma
  // vaga presencial num país onde ele não pode morar não tem forte
  // compatibilidade: tem uma porta fechada, e dizer o contrário é enganá-lo.
  let overall: OverallFit
  if (blockers.length > 0) overall = 'weak'
  /**
   * Aderência ZERO não vira "parcial" por falta do que descontar.
   *
   * O eixo contextual parte de 100 e só subtrai o que atrapalha. Num perfil sem
   * nada declarado não há o que subtrair, e ele fica com 100 — "nada te impede"
   * vira nota cheia. Somado a um eixo profissional neutro de 50, o sinal
   * chegava a 40 e o desfecho a `partial`: um perfil em branco recebia vaga de
   * qualquer área como "vale esticar".
   *
   * Foi assim que um perfil de biomedicina recebeu vagas de tecnologia. Nenhum
   * eixo errou; o que errou foi transformar ausência de informação em pontos.
   *
   * `jobFit === 0` significa que a vaga listou requisitos e o candidato não
   * evidenciou NENHUM — ou porque não combina, ou porque ele ainda não declarou
   * competência alguma. Nos dois casos não há base para recomendar, e dizer o
   * contrário é inventar aderência. Vaga que não publica requisito não cai
   * aqui: essa recebe 50 e um registro honesto de que não deu para medir.
   */
  else if (jobFit.score === 0) overall = 'weak'
  else if (contextual.level === 'low') overall = 'weak'
  else if (signal >= 75 && jobFit.level === 'high') overall = 'strong'
  else if (signal >= 60) overall = 'good'
  else if (signal >= 40) overall = 'partial'
  else overall = 'weak'

  let recommendation: Recommendation
  if (overall === 'strong') recommendation = 'apply'
  else if (overall === 'good') recommendation = 'consider'
  else if (overall === 'partial') recommendation = 'stretch'
  else recommendation = 'skip'

  return {
    professional,
    jobFit,
    contextual,
    overall,
    recommendation,
    blockers,
    headline: HEADLINE[overall],
  }
}

/**
 * O sinal interno de ordenação. NÃO exiba isto.
 *
 * Existe para ordenar a fila do Radar e alimentar o filtro de qualidade. O §9 é
 * explícito: "Use o percentual apenas como sinal interno quando apropriado".
 * Exportado separado do `MatchResult` de propósito — quem quiser exibi-lo terá
 * de importar uma função cujo nome diz que não é para isso.
 */
export function internalSignalScore(match: MatchResult): number {
  return Math.round(
    match.professional.score * 0.3 + match.jobFit.score * 0.45 + match.contextual.score * 0.25
  )
}
