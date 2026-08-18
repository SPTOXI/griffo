/**
 * Job Fit — o match virando ação (§18, §19, §20).
 *
 * O §18 é direto sobre o que NÃO basta:
 *
 * > Quando o Griffo encontrar uma vaga relevante, não parar no "Você combina
 * > com esta vaga."
 *
 * Uma tela que diz "forte compatibilidade" e para ali devolve ao usuário a
 * mesma pergunta com que ele chegou: e agora, o que eu faço? O Job Fit responde
 * em três blocos, que são os do §18 — **por que recomendamos**, **atenção**, e
 * **prepare-se** — e abre as ações do §19: currículo adaptado, carta,
 * preparação.
 *
 * ## A inversão do §19
 *
 * O fluxo antigo era `currículo → análise`. O novo é:
 *
 *     currículo → perfil → vaga encontrada → match → currículo adaptado à vaga
 *     → carta → preparação → candidatura
 *
 * A vaga volta para o currículo. É o que transforma o Griffo de "IA que melhora
 * currículos" em algo que acompanha o processo seletivo — a definição do §40.
 *
 * ## Sem promessa
 *
 * O §17 vale aqui também: o card diz "forte compatibilidade", nunca "82% de
 * chance". A recomendação é sobre o que fazer, não sobre o que vai acontecer.
 */

import type { MatchResult } from './compatibility'
import type { NormalizedJob } from '../jobs/types'
import type { ProfessionalProfile } from '../profile'

/** Uma ação que o usuário pode disparar a partir da vaga. */
export type JobFitActionId =
  | 'tailor_resume'
  | 'cover_letter'
  | 'interview_prep'
  | 'apply'

export interface JobFitAction {
  id: JobFitActionId
  label: string
  /** Por que esta ação é oferecida agora. */
  rationale: string
  /**
   * Ação principal do card. Só uma por vez: oferecer quatro botões iguais
   * devolve ao usuário a decisão que o produto deveria ter tomado por ele.
   */
  primary: boolean
}

export interface JobFitView {
  /** Cabeçalho: cargo, empresa, local, modelo. */
  role: string
  company: string
  location: string
  workMode: string

  /** Compatibilidade em palavras (§17). */
  compatibility: string

  /** Bloco 1 do §18 — "Por que recomendamos". */
  whyRecommended: string[]
  /** Bloco 2 do §18 — "Atenção". */
  attention: string[]
  /** Impedimentos, separados da atenção porque não se resolvem com preparo. */
  blockers: string[]

  /** Bloco 3 do §18 — "Prepare-se". */
  actions: JobFitAction[]

  /** Frase única de recomendação. Sobre o que fazer, não sobre o resultado. */
  recommendation: string
}

const COMPATIBILITY_LABEL: Record<MatchResult['overall'], string> = {
  strong: 'Alta',
  good: 'Boa',
  partial: 'Parcial',
  weak: 'Baixa',
}

const RECOMMENDATION_TEXT: Record<MatchResult['recommendation'], string> = {
  apply: 'Vale se candidatar. Prepare o currículo direcionado antes de enviar.',
  consider: 'Vale considerar. Veja os pontos de atenção antes de decidir.',
  stretch: 'É uma candidatura ambiciosa. Só vale com o currículo bem direcionado.',
  skip: 'Provavelmente não vale o esforço agora — os impedimentos abaixo pesam mais que a aderência.',
}

const WORK_MODE_LABEL: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
  unknown: 'Não informado',
}

function locationOf(job: NormalizedJob): string {
  const parts = [job.city, job.region, job.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return job.remoteType === 'remote' ? 'Remoto' : 'Local não informado'
}

/**
 * As ações oferecidas para esta vaga.
 *
 * A ordem e o que é principal dependem da recomendação. Uma vaga de encaixe
 * fraco não deve ter "candidatar-se" como botão principal — seria empurrar o
 * usuário para um esforço que o próprio diagnóstico desaconselha.
 */
export function actionsFor(match: MatchResult): JobFitAction[] {
  const tailor: JobFitAction = {
    id: 'tailor_resume',
    label: 'Adaptar currículo para esta vaga',
    rationale: 'Reescreve o currículo destacando o que ESTA vaga pede, com as palavras que ela usa.',
    primary: false,
  }
  const letter: JobFitAction = {
    id: 'cover_letter',
    label: 'Gerar carta para esta vaga',
    rationale: 'Escreve a carta direcionada aos requisitos que você atende.',
    primary: false,
  }
  const prep: JobFitAction = {
    id: 'interview_prep',
    label: 'Preparar para a entrevista',
    rationale: 'Antecipa as perguntas prováveis a partir das lacunas identificadas.',
    primary: false,
  }

  if (match.recommendation === 'skip') {
    // Nada de principal: a vaga não merece esforço, e destacar um botão
    // contradiria o diagnóstico que a própria tela acabou de dar.
    return [tailor]
  }

  if (match.recommendation === 'stretch') {
    // Candidatura ambiciosa começa pelo currículo, não pelo envio.
    return [{ ...tailor, primary: true }, letter, prep]
  }

  return [{ ...tailor, primary: true }, letter, prep]
}

/**
 * Monta a visão da oportunidade.
 *
 * Tudo que aparece aqui veio do match, que veio do perfil e da vaga. Nada é
 * inventado para preencher espaço: um bloco sem conteúdo fica vazio, e a tela
 * mostra a ausência — mesma regra da Etapa 1.
 */
export function buildJobFit(
  job: NormalizedJob,
  match: MatchResult,
  _profile: ProfessionalProfile
): JobFitView {
  const whyRecommended = [
    ...match.professional.evidence,
    ...match.jobFit.evidence,
    ...match.contextual.evidence,
  ]

  const attention = [
    ...match.professional.gaps,
    ...match.jobFit.gaps,
    ...match.contextual.gaps,
  ]

  return {
    role: job.title,
    company: job.company,
    location: locationOf(job),
    workMode: WORK_MODE_LABEL[job.remoteType] ?? 'Não informado',
    compatibility: COMPATIBILITY_LABEL[match.overall],
    whyRecommended,
    attention,
    blockers: match.blockers,
    actions: actionsFor(match),
    recommendation: RECOMMENDATION_TEXT[match.recommendation],
  }
}

/**
 * O contexto da vaga para os prompts de currículo direcionado e carta (§19).
 *
 * É a ponte entre o Radar e as rotas que já existem: a mesma rota de carta que
 * hoje recebe a "vaga alvo" digitada pelo usuário passa a poder receber uma
 * vaga encontrada pelo Radar, com os requisitos já extraídos e as lacunas já
 * identificadas.
 *
 * Inclui as lacunas de propósito. Uma carta escrita sabendo o que falta é
 * diferente de uma escrita no escuro: ela pode tratar a ausência com honestidade
 * em vez de contorná-la — que é o que as regras de honestidade daquela rota
 * exigem.
 */
export function jobPromptContext(job: NormalizedJob, match: MatchResult): string {
  const lines: string[] = [
    `VAGA ENCONTRADA PELO RADAR:`,
    `Cargo: ${job.title}`,
    `Empresa: ${job.company}`,
    `Local: ${locationOf(job)} (${WORK_MODE_LABEL[job.remoteType] ?? 'modelo não informado'})`,
  ]

  if (job.requirements.length) {
    lines.push(`Requisitos declarados: ${job.requirements.join('; ')}`)
  }
  if (job.skills.length) {
    lines.push(`Competências pedidas: ${job.skills.join('; ')}`)
  }
  if (job.description) {
    lines.push(`Descrição: ${job.description.slice(0, 3000)}`)
  }

  const matched = match.jobFit.evidence
  if (matched.length) {
    lines.push(`\nO QUE O CANDIDATO JÁ ATENDE: ${matched.join(' ')}`)
  }

  const gaps = [...match.jobFit.gaps, ...match.professional.gaps]
  if (gaps.length) {
    lines.push(
      `\nLACUNAS IDENTIFICADAS (trate com honestidade — não afirme que ele tem o que não tem): ${gaps.join(' ')}`
    )
  }

  return lines.join('\n')
}
