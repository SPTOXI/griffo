/**
 * Números públicos de prova social — a parte pura.
 *
 * Regra: nunca inventar. O percentil só aparece com amostra suficiente para
 * não ser ruído, e a contagem de currículos só aparece quando já é grande o
 * bastante para não parecer fraca.
 */

/** Abaixo disso, "melhor que X%" seria ruído e não sai. */
export const MIN_PERCENTILE_SAMPLE = 50

/** Abaixo disso, a contagem de currículos analisados não aparece na home. */
export const MIN_SOCIAL_PROOF_COUNT = 100

/**
 * Em que percentual dos currículos já testados a nota é MENOR que `score`.
 * `scores` precisa vir em ordem crescente. `null` quando a amostra é pequena.
 */
export function percentileBelow(scores: readonly number[], score: number): number | null {
  if (scores.length < MIN_PERCENTILE_SAMPLE) return null
  // Busca binária pela primeira nota >= score.
  let lo = 0
  let hi = scores.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (scores[mid] < score) lo = mid + 1
    else hi = mid
  }
  return Math.round((lo / scores.length) * 100)
}

/** Lê a nota guardada no `meta` (JSON) de um evento de teste. */
export function scoreFromMeta(meta: string | null): number | null {
  if (!meta) return null
  try {
    const v = JSON.parse(meta)?.score
    return typeof v === 'number' && v >= 0 && v <= 100 ? v : null
  } catch {
    return null
  }
}
