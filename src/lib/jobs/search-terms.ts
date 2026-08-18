/**
 * Os termos que uma fonte de BUSCA procura.
 *
 * ## De onde eles vêm, e por quê
 *
 * Greenhouse e Lever são boards por empresa: pede-se o board, vem o que está
 * aberto. A Gupy é busca — não existe "todas as vagas", existe "as vagas que
 * casam com esta palavra". Alguém precisa dizer qual palavra.
 *
 * A resposta é o próprio produto: os **cargos que a orientação profissional
 * recomendou** aos usuários. É isso que o Radar sempre foi para ser — buscar
 * vaga das áreas sugeridas, no país da pessoa — e é a única origem de termos
 * que não é chute de quem escreveu o código.
 *
 * ## Coletar continua servindo a todo mundo
 *
 * Buscar pela união dos cargos-alvo não transforma a coleta em algo por
 * usuário: a vaga encontrada pelo termo de um entra no banco e fica disponível
 * para o matching de todos. O que muda é só de onde saem as palavras.
 *
 * ## Por frequência, não por sorteio
 *
 * O orçamento de tempo não cobre todos os termos, e cortar arbitrariamente
 * deixaria de fora justamente quem está na fila há mais tempo. Ordenar por
 * quantas pessoas querem aquele cargo faz o corte atender mais gente por
 * segundo gasto — e os termos raros continuam entrando quando os comuns já
 * foram coletados numa rodada anterior.
 */
export interface SearchTermOptions {
  /** Quantos termos no máximo. Cada um custa pelo menos uma ida à rede. */
  limit?: number
  /** Só usuários deste país. Uma fonte brasileira não busca cargo alemão. */
  country?: string | null
}

/** Termo curto demais varre metade do portal; longo demais não casa com nada. */
const MIN_TERM_LENGTH = 3
const MAX_TERM_LENGTH = 60

export function normalizeTerms(rawLists: unknown[], limit: number): string[] {
  const counts = new Map<string, { term: string; count: number }>()

  for (const raw of rawLists) {
    let list: unknown
    try {
      list = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      // Perfil com JSON corrompido não derruba a coleta dos demais.
      continue
    }
    if (!Array.isArray(list)) continue

    // Um usuário que declara o mesmo cargo duas vezes não vale por dois: o
    // desempate é quantas PESSOAS querem aquilo.
    const seenHere = new Set<string>()

    for (const item of list) {
      const term = String(item ?? '').trim()
      if (term.length < MIN_TERM_LENGTH || term.length > MAX_TERM_LENGTH) continue

      const key = term.toLowerCase()
      if (seenHere.has(key)) continue
      seenHere.add(key)

      const existing = counts.get(key)
      if (existing) existing.count++
      else counts.set(key, { term, count: 1 })
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.term)
}
