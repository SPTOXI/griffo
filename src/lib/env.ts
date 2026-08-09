import 'server-only'

/**
 * Acesso validado às variáveis de ambiente obrigatórias.
 *
 * A validação é preguiçosa de propósito. `next build` importa todos os módulos
 * de rota para coletar dados de página; validar no import faria de uma variável
 * ausente um erro de BUILD, derrubando o deploy inteiro em vez de apenas as
 * requisições que realmente dependem dela.
 *
 * O que estas funções eliminam são os fallbacks embutidos no código, que
 * deixavam a aplicação subir silenciosamente insegura quando a variável não
 * estava configurada.
 */

function required(name: string, hint: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. ${hint}`
    )
  }
  return value.trim()
}

/** URL do banco (pool). Sem fallback: antes havia uma connection string de produção embutida no código. */
export function getDatabaseUrl(): string {
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  if (!raw || !raw.trim()) {
    throw new Error(
      'Variável de ambiente obrigatória ausente: POSTGRES_PRISMA_URL. ' +
        'Configure a connection string do Postgres no ambiente de execução.'
    )
  }
  return raw.trim()
}

/**
 * Segredo de assinatura da sessão. Sem fallback: com um valor previsível,
 * qualquer pessoa que conheça o código forja um cookie válido para qualquer
 * usuário, inclusive o administrador, sem precisar da senha.
 */
export function getSessionSecret(): string {
  return required(
    'SESSION_SECRET',
    'Gere um valor forte com: openssl rand -hex 32'
  )
}
