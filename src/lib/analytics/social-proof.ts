/**
 * Números públicos de prova social — a parte pura.
 *
 * Regra: nunca inventar. O percentil só aparece com amostra suficiente para
 * não ser ruído, e a contagem de currículos só aparece quando já é grande o
 * bastante para não parecer fraca (antes disso, a de vagas analisadas).
 */

/** Abaixo disso, "melhor que X%" seria ruído e não sai. */
export const MIN_PERCENTILE_SAMPLE = 50

/**
 * Abaixo disso, a home não mostra a contagem de currículos: um número pequeno
 * de clientes passa menos confiança do que nenhum. Enquanto não chega lá, o
 * selo mostra quantas vagas a IA já analisou, que é número real e grande
 * (pedido do operador, §2.159). Passou do corte, volta sozinho aos currículos.
 */
export const MIN_RESUMES_FOR_COUNTER = 1000

/** Abaixo disso nem o número de vagas analisadas sai. */
export const MIN_JOBS_FOR_COUNTER = 1000

export interface SocialProof {
  kind: 'resumes' | 'jobs'
  /** Já arredondado para baixo em milhares quando é de vagas ("mais de 31 mil"). */
  n: number
}

export function pickSocialProof(resumes: number, jobsAnalyzed: number): SocialProof | null {
  if (resumes >= MIN_RESUMES_FOR_COUNTER) return { kind: 'resumes', n: resumes }
  if (jobsAnalyzed >= MIN_JOBS_FOR_COUNTER) return { kind: 'jobs', n: Math.floor(jobsAnalyzed / 1000) * 1000 }
  return null
}

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

/**
 * O número de vagas do selo como a língua diz: "31 mil" em português e
 * espanhol, "31 mila" em italiano, e o número cheio com o separador do idioma
 * nos outros (alemão e inglês não falam "31 Tausend" num selo).
 */
export function thousandsLabel(lang: string, n: number, locale: string): string {
  const k = Math.floor(n / 1000)
  if (lang === 'pt' || lang === 'es') return `${new Intl.NumberFormat(locale).format(k)} mil`
  if (lang === 'it') return `${new Intl.NumberFormat(locale).format(k)} mila`
  return new Intl.NumberFormat(locale).format(k * 1000)
}
