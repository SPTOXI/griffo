import type { ProfessionalProfile } from '../profile'

/**
 * Os termos que dizem "esta vaga é da área desta pessoa" — para ORDENAR a
 * leitura do banco, nunca para eliminar (§2.136).
 *
 * ## O problema
 *
 * O Radar avalia no máximo 500 vagas por pessoa (`MAX_JOBS_PER_USER`), e as
 * escolhia pelas mais recentes do mercado dela. Em 23/09/2026 o Brasil tinha
 * 6.068 vagas frescas; a primeira de laboratório estava na posição 1.068. Uma
 * coordenadora de análises clínicas tinha as vagas da área dela fora do lote,
 * e o matching nem chegava a vê-las.
 *
 * ## A correção
 *
 * O teto continua o mesmo; muda a ORDEM em que ele é gasto: primeiro as vagas
 * cujo título toca a área, depois as que a mencionam na descrição ou na
 * ficha, e só então as mais recentes. Nada deixa de passar pelo filtro duro e
 * pelo `matchJob` — o que mudou é quais 500 chegam até eles.
 *
 * ## Por que frases, e não palavras
 *
 * Quebrar "Gestão de Unidades de Saúde" em palavras traria "gestão", que está
 * em milhares de vagas e encheria o lote de ruído antes das vagas da área.
 * A frase inteira é rara o bastante para significar alguma coisa.
 */

/** Frases mais curtas que isto casam com qualquer coisa ("TI", "5S", "RH"). */
const MIN_TERM_CHARS = 4

/** Teto de termos por consulta: cada um é um `ILIKE` a mais na varredura. */
export const MAX_TITLE_TERMS = 24
export const MAX_TEXT_TERMS = 16

/** Sem acento, minúsculo, espaço simples — a forma que o anúncio sem acento usa. */
function fold(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function collect(phrases: (string | null | undefined)[], max: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of phrases) {
    const phrase = (raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (phrase.length < MIN_TERM_CHARS) continue
    // As duas grafias: o `ILIKE` do Postgres não ignora acento, e metade dos
    // anúncios vem sem ("analises clinicas").
    for (const variant of [phrase, fold(phrase)]) {
      if (seen.has(variant)) continue
      seen.add(variant)
      out.push(variant)
    }
    if (out.length >= max) break
  }
  return out.slice(0, max)
}

export interface AreaTerms {
  /** Casados contra o título da vaga — o sinal mais forte. */
  title: string[]
  /** Casados contra descrição e ficha (requisitos e competências extraídos). */
  text: string[]
}

export function areaTermsOf(profile: ProfessionalProfile): AreaTerms {
  // A ordem importa: o teto corta pelo fim, e o fim é o menos específico.
  const area = [profile.field, ...profile.targetFields, ...profile.specializations]
  const roles = [...profile.targetRoles, profile.currentTitle]
  return {
    title: collect([...roles, ...area, ...profile.skills], MAX_TITLE_TERMS),
    text: collect([...area, ...profile.skills], MAX_TEXT_TERMS),
  }
}
