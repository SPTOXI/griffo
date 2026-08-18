/**
 * O Perfil Profissional derivado do diagnóstico vocacional.
 *
 * ## Por que isto existe, e por que é o caminho principal
 *
 * O Radar nasceu para buscar vagas **das áreas que a orientação profissional
 * recomendou**, no país da pessoa. Não para servir um formulário.
 *
 * Do jeito que estava, `runRadar` só avaliava quem tinha `ProfessionalProfile`
 * gravado — e o único jeito de ter era preencher trinta campos à mão. Quem
 * rodava o diagnóstico vocacional, recebia três áreas recomendadas e fechava a
 * tela ficava fora do Radar, tendo dito ao produto exatamente o que queria.
 * A informação estava lá; só não chegava a quem precisava dela.
 *
 * Agora o diagnóstico alimenta o perfil. Preencher à mão continua existindo,
 * como refinamento de quem quer discordar da recomendação ou detalhar o que ela
 * não cobre.
 *
 * ## O que se aproveita, e o que não
 *
 * Da orientação vêm os **cargos-alvo** — é a resposta dela. O `matchPercentage`
 * fica de fora: ele ordena a lista para leitura humana e não tem relação com os
 * três eixos de compatibilidade do `lib/matching`. Misturar os dois faria um
 * número virar outro pelo caminho.
 *
 * As `requiredSkillsToLearn` também ficam de fora, e por um motivo que importa:
 * são competências que a pessoa **não tem**. Gravá-las em `skills` faria o
 * matching acreditar que ela as domina — inventando qualificação, que é
 * exatamente o que o §43 proíbe.
 */

import type { ProfessionalProfile } from './index'

/** O recorte da orientação que interessa aqui. */
export interface OrientationInput {
  topMatchingAreas?: { role?: unknown }[] | unknown
}

/**
 * Os cargos recomendados, limpos.
 *
 * Tolerante de propósito: a orientação vem de uma resposta de IA já validada
 * pela rota que a produziu, e ler de novo com regras diferentes só criaria uma
 * segunda definição de "orientação válida".
 */
export function rolesFromOrientation(orientation: OrientationInput | null | undefined): string[] {
  const areas = (orientation as { topMatchingAreas?: unknown })?.topMatchingAreas
  if (!Array.isArray(areas)) return []

  const seen = new Set<string>()
  const roles: string[] = []

  for (const area of areas) {
    const role = typeof (area as any)?.role === 'string' ? (area as any).role.trim() : ''
    if (!role) continue

    const key = role.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    roles.push(role.slice(0, 120))

    // Seis é o teto do campo na tela. A orientação costuma devolver três.
    if (roles.length >= 6) break
  }

  return roles
}

/** Lê a orientação gravada. JSON corrompido devolve nulo, nunca lança. */
export function parseStoredOrientation(raw: string | null | undefined): OrientationInput | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as OrientationInput) : null
  } catch {
    return null
  }
}

export interface OrientationDerivation {
  /** Campos a gravar. Vazio quando não há nada novo a dizer. */
  data: Partial<Pick<ProfessionalProfile, 'targetRoles' | 'residenceCountry'>>
  /** Nomes dos campos preenchidos, para que a tela possa contar à pessoa. */
  filled: string[]
}

/**
 * O que a orientação acrescenta a um perfil que já existe.
 *
 * **Só preenche o que está vazio.** O §30 proíbe alterar o perfil sem que a
 * pessoa saiba; sobrescrever um cargo-alvo que ela digitou seria exatamente
 * isso. Quem escreveu tem razão sobre si.
 *
 * `residenceCountry` entra a partir do país de acesso porque o Radar precisa de
 * um país para funcionar, e o país de onde a pessoa acessa é o melhor palpite
 * disponível — mas só quando ela não disse nada. Ele fica visível e editável na
 * tela do perfil.
 */
export function deriveFromOrientation(
  current: Pick<ProfessionalProfile, 'targetRoles' | 'residenceCountry'>,
  orientation: OrientationInput | null,
  options: { fallbackCountry?: string | null } = {}
): OrientationDerivation {
  const data: OrientationDerivation['data'] = {}
  const filled: string[] = []

  if (current.targetRoles.length === 0) {
    const roles = rolesFromOrientation(orientation)
    if (roles.length > 0) {
      data.targetRoles = roles
      filled.push('targetRoles')
    }
  }

  if (!current.residenceCountry) {
    const country = options.fallbackCountry?.trim().toUpperCase()
    if (country && /^[A-Z]{2}$/.test(country)) {
      data.residenceCountry = country
      filled.push('residenceCountry')
    }
  }

  return { data, filled }
}
