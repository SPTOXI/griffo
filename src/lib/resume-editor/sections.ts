/**
 * O currículo reescrito em blocos editáveis (§2.161, Fase 2 do criador).
 *
 * Um bloco começa num título `##` ou `###` e vai até o próximo título desses
 * níveis; o que vem antes do primeiro (nome e contatos) é o bloco do topo.
 * Assim cada experiência (`###` dentro de "Experiência") é um bloco próprio,
 * e a pessoa mexe só nela.
 *
 * Puro e seguro para o navegador. `joinBlocks(splitBlocks(md))` devolve o
 * mesmo conteúdo, a menos de linhas em branco nas emendas.
 */

export interface ResumeBlock {
  /** A primeira linha quando é título (`## Experiência`), ou `null` no bloco do topo. */
  heading: string | null
  /** Nível do título (2 ou 3); 1 no bloco do topo. */
  level: 1 | 2 | 3
  /** O bloco inteiro em Markdown, título incluído. */
  text: string
}

const HEADING = /^(#{2,3})\s+\S/

export function splitBlocks(markdown: string): ResumeBlock[] {
  const blocks: ResumeBlock[] = []
  let current: string[] = []
  let heading: string | null = null
  let level: 1 | 2 | 3 = 1

  const flush = () => {
    const text = current.join('\n').trim()
    if (text) blocks.push({ heading, level, text })
  }

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.match(HEADING)
    if (m) {
      flush()
      current = [line]
      heading = line.trim()
      level = m[1].length as 2 | 3
    } else {
      current.push(line)
    }
  }
  flush()
  return blocks
}

export function joinBlocks(blocks: Pick<ResumeBlock, 'text'>[]): string {
  return blocks
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join('\n\n')
}

/** Só o título, sem conteúdo embaixo (ex.: "## Experiência" antes das experiências). */
export function isHeadingOnly(block: ResumeBlock): boolean {
  return block.heading !== null && block.text.trim() === block.heading
}

/**
 * Melhorias com IA por currículo. Cada uma é uma chamada curta (Haiku); o teto
 * impede que um currículo vire gasto sem fim depois de uma compra só.
 * Com 20, o pior caso custa ~US$ 0,06 — longe do piso de US$ 2,60 da análise.
 */
export const MAX_BLOCK_IMPROVEMENTS = 20

/** Teto do que a pessoa pode pedir à IA ("deixe mais curto"). */
export const MAX_INSTRUCTION_CHARS = 200

/** Teto de um bloco enviado para melhorar: uma seção, não o currículo inteiro. */
export const MAX_BLOCK_CHARS = 6000

/**
 * O que volta da IA, limpo: sem cerca de código e com o MESMO título do bloco
 * original. Trocar o título quebraria a ordem das seções e o PDF.
 */
export function cleanImprovedBlock(raw: string, original: ResumeBlock): string | null {
  let text = raw.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '').trim()
  if (!text) return null
  if (original.heading) {
    const lines = text.split('\n')
    if (HEADING.test(lines[0]) || /^#\s/.test(lines[0])) lines.shift()
    text = [original.heading, ...lines].join('\n').trim()
    if (text === original.heading) return null
  }
  return text.length >= 10 ? text.slice(0, MAX_BLOCK_CHARS) : null
}
