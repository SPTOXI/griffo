/**
 * Varredura de HTML de terceiros sem regex de tempo quadrático.
 *
 * O HTML vem de um site escolhido pelo usuário: corpo sem limite e marcação
 * hostil são possíveis. Lê no máximo MAX_BODY_BYTES e só usa varreduras
 * lineares (indexOf) ou regex com quantificador limitado — regex com `[^>]*` e
 * `[\s\S]*?` sem fechamento custava tempo quadrático por requisição.
 */
export const MAX_BODY_BYTES = 2 * 1024 * 1024

export async function readTextCapped(res: Response, maxBytes = MAX_BODY_BYTES): Promise<string> {
  if (!res.body) return typeof res.text === 'function' ? (await res.text()).slice(0, maxBytes) : ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < maxBytes) {
    const { done, value } = await reader.read()
    if (done || !value) break
    chunks.push(value)
    total += value.byteLength
  }
  await reader.cancel().catch(() => {})
  const buf = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const c of chunks) {
    const part = c.subarray(0, buf.length - offset)
    buf.set(part, offset)
    offset += part.byteLength
    if (offset >= buf.length) break
  }
  return new TextDecoder().decode(buf)
}

/** Conteúdo de cada `<tag ...>...</tag>`, em uma passada. */
export function tagBlocks(html: string, tag: string): Array<{ open: string; body: string; start: number; end: number }> {
  const lower = html.toLowerCase()
  const out: Array<{ open: string; body: string; start: number; end: number }> = []
  const closeTag = `</${tag}>`
  let pos = 0
  while (pos < lower.length) {
    const start = lower.indexOf(`<${tag}`, pos)
    if (start === -1) break
    const openEnd = lower.indexOf('>', start)
    if (openEnd === -1) break
    const close = lower.indexOf(closeTag, openEnd + 1)
    if (close === -1) break
    out.push({ open: html.slice(start, openEnd + 1), body: html.slice(openEnd + 1, close), start, end: close + closeTag.length })
    pos = close + closeTag.length
  }
  return out
}

export function stripTagBlocks(html: string, tag: string): string {
  let out = ''
  let pos = 0
  for (const b of tagBlocks(html, tag)) {
    out += html.slice(pos, b.start) + ' '
    pos = b.end
  }
  return out + html.slice(pos)
}

/** Cada tag de abertura `<name ...>`, em uma passada. */
export function openTags(html: string, name: string): string[] {
  const lower = html.toLowerCase()
  const out: string[] = []
  let pos = 0
  while (pos < lower.length) {
    const start = lower.indexOf(`<${name}`, pos)
    if (start === -1) break
    const end = lower.indexOf('>', start)
    if (end === -1) break
    if (end - start <= 4000) out.push(html.slice(start, end + 1))
    pos = end + 1
  }
  return out
}

/** Remove tags HTML em uma passada (`<` sem `>` depois fica como texto). */
export function stripTags(html: string): string {
  let out = ''
  let pos = 0
  while (pos < html.length) {
    const start = html.indexOf('<', pos)
    if (start === -1) break
    const end = html.indexOf('>', start)
    if (end === -1) break
    out += html.slice(pos, start) + ' '
    pos = end + 1
  }
  return out + html.slice(pos)
}

export function metaContent(html: string, attr: 'property' | 'name', key: string): string | undefined {
  for (const tag of openTags(html, 'meta')) {
    const k = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']{0,200})["']`, 'i'))?.[1]
    if (k?.toLowerCase() !== key) continue
    const content = tag.match(/content\s*=\s*["']([^"']{1,5000})["']/i)?.[1]
    if (content) return content
  }
  return undefined
}

