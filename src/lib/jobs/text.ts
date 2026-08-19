/**
 * Limpeza de texto vindo das fontes.
 *
 * Vivia copiada em três adapters — Greenhouse, páginas de carreira e quadros
 * remotos. Três cópias significam três lugares para corrigir o mesmo defeito, e
 * foi assim que `"Construir sistemas ."` passou: tirar uma tag no meio da frase
 * deixa o espaço dela para trás, e o espaço encosta na pontuação.
 */

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
  return html
    .replace(/<[^>]*>/g, ' ')
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
