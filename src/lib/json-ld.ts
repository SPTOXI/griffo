/**
 * Serializa JSON-LD para `<script type="application/ld+json">`.
 *
 * `JSON.stringify` não escapa `<`. Um texto com `</script>` — vindo de fonte
 * externa (dados do Atlas) ou de tradução — fecharia a tag e o resto viraria
 * HTML executável. `\u003c` é o mesmo caractere para o parser de JSON.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
