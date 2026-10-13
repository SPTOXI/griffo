/**
 * Limpeza de texto vindo das fontes.
 *
 * Vivia copiada em três adapters — Greenhouse, páginas de carreira e quadros
 * remotos. Três cópias significam três lugares para corrigir o mesmo defeito, e
 * foi assim que `"Construir sistemas ."` passou: tirar uma tag no meio da frase
 * deixa o espaço dela para trás, e o espaço encosta na pontuação.
 */

import { stripTags } from '../html-scan'

/** Teto da descrição bruta: nenhuma vaga legítima chega perto. */
const MAX_HTML_CHARS = 200_000

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/**
 * Uma passada só, de propósito.
 *
 * Substituições encadeadas decodificam duas vezes: `&amp;lt;` — que representa
 * o texto literal `&lt;` — viraria `&lt;` na primeira troca e `<` na segunda,
 * transformando texto do anúncio em marcação. Uma varredura única não reexamina
 * o que acabou de escrever.
 */
export function decodeBasicEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

/**
 * Tira a marcação e devolve texto legível.
 *
 * A tag vira espaço, e não vazio, porque `um<br>dois` sem espaço viraria
 * `umdois`. Mas isso cria o problema inverso — `sistemas<b>.</b>` vira
 * `sistemas .` — e por isso o espaço que encosta em pontuação é removido
 * depois.
 */
export function stripHtml(html: string): string {
  // Varredura linear em vez de `/<[^>]*>/g`: descrição de terceiro com muitos
  // `<` sem `>` custava tempo quadrático e travava o cron do Radar (§2.148).
  return stripTags(html.slice(0, MAX_HTML_CHARS))
    .replace(/\s+/g, ' ')
    // Espaço antes de pontuação é resíduo da limpeza, nunca escrita de alguém.
    .replace(/\s+([.,;:!?)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .trim()
}

/** Texto legível a partir de HTML, ou `null` quando não há nada aproveitável. */
export function readableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = stripHtml(value)
  return text || null
}
