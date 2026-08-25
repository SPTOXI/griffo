/**
 * Divide um arquivo SQL nas suas instruções.
 *
 * Existe porque o driver do Postgres, pelo protocolo estendido que o Prisma
 * usa, aceita UMA instrução por chamada. Mandar o arquivo inteiro de uma vez
 * falha com "cannot insert multiple commands into a prepared statement".
 *
 * Dividir em `;` e pronto não serve, e `prisma/rls.sql` é a prova viva dos três
 * motivos:
 *
 *  1. **Blocos `$$`.** Os dois `DO $$ ... $$` são uma instrução cada, e têm
 *     `;` dentro. Cortar neles produziria fragmentos sintaticamente inválidos.
 *
 *  2. **Apóstrofos em comentários.** O arquivo tem linhas como
 *     `-- ... current_setting('app.user_id') ...` — apóstrofos em número ímpar
 *     dentro de um comentário. Um divisor que rastreie aspas sem entender
 *     comentários passa a achar que está dentro de uma string a partir dali, e
 *     todo o resto do arquivo vira uma instrução só.
 *
 *  3. **`;` dentro de string.** Não ocorre hoje neste arquivo, mas é a mesma
 *     classe de erro e custa duas linhas cobrir.
 *
 * A ordem das verificações é o que importa: comentário vence aspas, aspas
 * vencem comentário. Dentro de um, o outro é texto comum.
 */

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''

  let inLineComment = false
  let inBlockComment = false
  let inSingleQuote = false
  /** Tag da citação por cifrão em curso (`$$` ou `$tag$`), ou null. */
  let dollarTag: string | null = null

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]

    // --- dentro de comentário de linha: só o fim da linha importa ---
    if (inLineComment) {
      current += ch
      if (ch === '\n') inLineComment = false
      continue
    }

    // --- dentro de comentário de bloco: só o `*/` importa ---
    if (inBlockComment) {
      current += ch
      if (ch === '*' && next === '/') {
        current += next
        i++
        inBlockComment = false
      }
      continue
    }

    // --- dentro de string: só a aspa de fechamento importa ---
    if (inSingleQuote) {
      current += ch
      if (ch === "'") {
        // `''` é uma aspa escapada, não o fim da string.
        if (next === "'") {
          current += next
          i++
        } else {
          inSingleQuote = false
        }
      }
      continue
    }

    // --- dentro de bloco $tag$: só o mesmo $tag$ fecha ---
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag
        i += dollarTag.length - 1
        dollarTag = null
      } else {
        current += ch
      }
      continue
    }

    // --- nível superior: aqui os delimitadores abrem, e o `;` corta ---
    if (ch === '-' && next === '-') {
      inLineComment = true
      current += ch
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      current += ch
      continue
    }
    if (ch === "'") {
      inSingleQuote = true
      current += ch
      continue
    }
    if (ch === '$') {
      // `$$` ou `$identificador$`. O `$1` de um parâmetro não casa, porque
      // exige o cifrão de fechamento.
      const match = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i))
      if (match) {
        dollarTag = match[0]
        current += dollarTag
        i += dollarTag.length - 1
        continue
      }
    }
    if (ch === ';') {
      const trimmed = current.trim()
      if (hasExecutableContent(trimmed)) statements.push(trimmed)
      current = ''
      continue
    }

    current += ch
  }

  // Última instrução sem `;` no fim do arquivo.
  const tail = current.trim()
  if (hasExecutableContent(tail)) statements.push(tail)

  return statements
}

/**
 * `true` se sobra alguma coisa além de comentário e espaço.
 *
 * O cabeçalho de `rls.sql` tem dezenas de linhas de comentário antes da
 * primeira instrução; sem esta checagem elas virariam uma "instrução" vazia que
 * o banco recusa.
 */
function hasExecutableContent(fragment: string): boolean {
  const withoutComments = fragment
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
  return withoutComments.trim().length > 0
}

/** `true` se a instrução devolve linhas (precisa de `queryRaw`, não `executeRaw`). */
export function returnsRows(statement: string): boolean {
  const firstKeyword = statement
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .trim()
    .split(/\s+/)[0]
    ?.toUpperCase()
  return firstKeyword === 'SELECT' || firstKeyword === 'WITH' || firstKeyword === 'VALUES'
}
