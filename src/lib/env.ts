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

/**
 * Erro de configuração do ambiente — distinto de uma falha passageira.
 *
 * A distinção existe porque as rotas tratam os dois casos de forma oposta: uma
 * falha passageira merece "tente novamente", e uma variável ausente nunca vai
 * se resolver com nova tentativa. Mandar o usuário repetir nesse caso esconde
 * o problema de quem pode corrigi-lo.
 */
export class ConfigError extends Error {
  constructor(message: string, readonly variable: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export function isConfigError(e: unknown): e is ConfigError {
  return e instanceof ConfigError || (e as any)?.name === 'ConfigError'
}

function required(name: string, hint: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new ConfigError(
      `Variável de ambiente obrigatória ausente: ${name}. ${hint}`,
      name
    )
  }
  return value.trim()
}

/** URL do banco (pool). Sem fallback: antes havia uma connection string de produção embutida no código. */
export function getDatabaseUrl(): string {
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  if (!raw || !raw.trim()) {
    throw new ConfigError(
      'Variável de ambiente obrigatória ausente: POSTGRES_PRISMA_URL. ' +
        'Configure a connection string do Postgres no ambiente de execução.',
      'POSTGRES_PRISMA_URL'
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

/**
 * Endereço público da aplicação, sem barra no fim.
 *
 * O e-mail precisa dele por um motivo que a tela não tem: um link relativo não
 * existe dentro de uma caixa de entrada. Todo link que sai daqui é absoluto ou
 * não é link.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://griffo.work'
  return raw.replace(/\/+$/, '')
}

/** Chave da API do Resend. */
export function getResendApiKey(): string {
  return required(
    'RESEND_API_KEY',
    'Crie uma chave em https://resend.com/api-keys e configure-a no ambiente.'
  )
}

/**
 * Remetente do digest.
 *
 * O domínio precisa estar verificado no Resend. O padrão é
 * `send.griffo.work`, que é onde SPF, DKIM e DMARC estão passando — mandar do
 * domínio raiz sem essa verificação é o caminho mais curto para a caixa de
 * spam.
 */
export function getDigestFrom(): string {
  return process.env.RADAR_DIGEST_FROM?.trim() || 'GriffoWork <radar@send.griffo.work>'
}

/**
 * Para onde vai a resposta.
 *
 * `send.griffo.work` só envia; quem responder ao remetente fala com o vazio.
 * O `Reply-To` aponta para uma caixa em `@griffo.work`, que o Cloudflare Email
 * Routing encaminha. Um e-mail que não aceita resposta ensina o destinatário a
 * ignorar os próximos.
 */
export function getDigestReplyTo(): string {
  return process.env.RADAR_DIGEST_REPLY_TO?.trim() || 'contact@griffo.work'
}

/**
 * O envio está ligado?
 *
 * Desligado por padrão, e de propósito. O documento de continuidade é direto:
 * *"Não ligue o envio antes do Radar estar validado. Mandar e-mail sobre vaga
 * ruim queima o domínio, e domínio queimado não se recupera fácil."*
 *
 * Todo o resto do caminho funciona com a variável desligada — a rodada apura
 * quem receberia o quê e registra isso no log —, então dá para conferir o
 * conteúdo antes de qualquer mensagem sair. Ligar é uma decisão de operação,
 * não de código: `RADAR_DIGEST_ENABLED=true`.
 */
export function isDigestEnabled(): boolean {
  return (process.env.RADAR_DIGEST_ENABLED || '').trim().toLowerCase() === 'true'
}
