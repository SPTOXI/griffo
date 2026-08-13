/**
 * Carrega o `.env` para os scripts de linha de comando.
 *
 * O `bun run` lê o `.env` sozinho; o `node`/`tsx`, não. Sem isto, o mesmo
 * script funcionava com bun e falhava com npm dizendo que a chave não estava
 * configurada — com a chave ali, no arquivo, o tempo todo.
 *
 * `process.loadEnvFile` é da biblioteca padrão do Node (20.12+), então isto não
 * acrescenta dependência nenhuma. Variáveis já definidas no ambiente têm
 * precedência sobre o arquivo, que é o comportamento esperado em CI.
 */

export function loadEnvFile(path = '.env'): void {
  const load = (process as NodeJS.Process & { loadEnvFile?: (p?: string) => void }).loadEnvFile
  if (typeof load !== 'function') return

  try {
    load(path)
  } catch {
    // Sem arquivo `.env` — normal em CI e em produção, onde as variáveis vêm
    // do ambiente. Quem precisar de uma variável ausente reclama por conta
    // própria, com uma mensagem melhor que "arquivo não encontrado".
  }
}
