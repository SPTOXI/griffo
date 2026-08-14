import 'server-only'

/**
 * Catálogo das chaves aceitas em `SystemConfig`.
 *
 * `POST /api/admin/settings` gravava qualquer par chave/valor recebido do
 * corpo da requisição. Um administrador — ou qualquer requisição feita com a
 * sessão dele — podia criar chaves arbitrárias, inclusive sobrescrever as que
 * o roteador de IA e a Stripe leem, e engordar a tabela sem limite. A lista
 * abaixo é a fronteira: o que não está aqui é recusado.
 *
 * `sensitive: true` marca o que é segredo — cifrado em repouso na gravação e
 * mascarado na leitura.
 */

export type SystemConfigKey = keyof typeof SYSTEM_CONFIG_KEYS

export const SYSTEM_CONFIG_KEYS = {
  // --- Pagamentos ---
  STRIPE_SECRET_KEY: { sensitive: true },
  STRIPE_WEBHOOK_SECRET: { sensitive: true },
  STRIPE_PUBLISHABLE_KEY: { sensitive: false },
  LEMON_API_KEY: { sensitive: true },
  LEMON_WEBHOOK_SECRET: { sensitive: true },
  LEMON_VARIANT_PROFISSIONAL: { sensitive: false },

  // --- Precificação exibida no painel ---
  CREDIT_PRICE_BRL: { sensitive: false },
  AI_AVG_COST_BRL: { sensitive: false },

  // --- Provedores de IA (lidos por ai-router/registry.ts) ---
  MOONSHOT_API_KEY: { sensitive: true },
  MOONSHOT_BASE_URL: { sensitive: false },
  KIMI_API_KEY: { sensitive: true },
  KIMI_MODEL: { sensitive: false },
  KIMI_BASE_URL: { sensitive: false },
  CLAUDE_API_KEY: { sensitive: true },
  CLAUDE_MODEL: { sensitive: false },
  CLAUDE_BASE_URL: { sensitive: false },
  DEEPSEEK_API_KEY: { sensitive: true },
  DEEPSEEK_MODEL: { sensitive: false },
  DEEPSEEK_BASE_URL: { sensitive: false },
  GEMINI_API_KEY: { sensitive: true },
  GEMINI_MODEL: { sensitive: false },
  GEMINI_BASE_URL: { sensitive: false },
  LLM_API_KEY: { sensitive: true },
  LLM_MODEL: { sensitive: false },
  LLM_BASE_URL: { sensitive: false },

  // --- Alertas do agente de diagnóstico ---
  ADMIN_ALERT_EMAIL: { sensitive: false },
  ADMIN_ALERT_WEBHOOK_URL: { sensitive: false },
} as const

/** Teto de tamanho por valor: nenhuma chave legítima chega perto disso. */
export const SYSTEM_CONFIG_MAX_VALUE_LENGTH = 2000

export function isKnownConfigKey(key: string): key is SystemConfigKey {
  return Object.prototype.hasOwnProperty.call(SYSTEM_CONFIG_KEYS, key)
}

export function isSensitiveConfigKey(key: string): boolean {
  return isKnownConfigKey(key) && SYSTEM_CONFIG_KEYS[key].sensitive
}

/**
 * Um valor mascarado devolvido pelo GET e reenviado sem alteração pelo POST.
 *
 * O painel carrega as configurações, o administrador edita um campo e reenvia
 * o objeto inteiro. Sem esta checagem, todo segredo que ele *não* editou seria
 * regravado com a própria máscara — destruindo a chave real no primeiro save.
 */
export function looksLikeMask(value: string): boolean {
  return value.includes('•')
}
