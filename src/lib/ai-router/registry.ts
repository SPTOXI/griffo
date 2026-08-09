import { db } from '../db'
import { ModelPricing, ProviderConfig, ProviderId, TaskType } from './types'

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  kimi: {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    defaultModel: 'kimi-k3',
    baseURL: 'https://api.moonshot.ai/v1',
    apiKeyEnvVar: 'MOONSHOT_API_KEY',
    pricing: {
      inputPer1k: 0.003, // $3.00 / 1M
      outputPer1k: 0.015, // $15.00 / 1M
    },
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    // Sonnet 5 é o primário: medido em 1,8s no commit 2aefa6d, contra o Opus 5
    // que não termina dentro do maxDuration de 60s das rotas de análise.
    defaultModel: 'claude-sonnet-5',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    pricing: {
      inputPer1k: 0.003, // $3.00 / 1M (Sonnet 5)
      outputPer1k: 0.015, // $15.00 / 1M (Sonnet 5)
    },
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/v1',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    pricing: {
      inputPer1k: 0.00027, // $0.27 / 1M
      outputPer1k: 0.0011, // $1.10 / 1M
    },
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    pricing: {
      inputPer1k: 0.000075, // $0.075 / 1M
      outputPer1k: 0.0003, // $0.30 / 1M
    },
  },
}

// O custo real depende do MODELO efetivamente usado, não do provedor: o admin
// pode trocar o modelo no painel sem que a tabela do provedor acompanhe. Antes
// disso o preço do Opus 5 estava declarado como $15/$75 (o triplo do real), o
// que inflava em 3x o custo e o lucro exibidos no painel administrativo.
//
// Valores em USD por 1k tokens. Modelos ausentes caem no preço do provedor.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-opus-5': { inputPer1k: 0.005, outputPer1k: 0.025 },
  'claude-sonnet-5': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-haiku-4-5': { inputPer1k: 0.001, outputPer1k: 0.005 },
  // Moonshot
  'kimi-k3': { inputPer1k: 0.003, outputPer1k: 0.015 },
  // DeepSeek — anunciou aumento em 06/08/2026 sem divulgar tamanho nem data,
  // mais política de pico 2x. Revisar periodicamente.
  'deepseek-v4-flash': { inputPer1k: 0.00014, outputPer1k: 0.00028 },
  'deepseek-v4-pro': { inputPer1k: 0.000435, outputPer1k: 0.00087 },
}

// Modelos correntes por provedor. Um modelo configurado fora desta lista é
// tratado como desatualizado e substituído pelo padrão do provedor.
const CURRENT_MODELS: Record<ProviderId, string[]> = {
  claude: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
  kimi: ['kimi-k3'],
  deepseek: ['deepseek-chat', 'deepseek-v4-flash', 'deepseek-v4-pro'],
  gemini: ['gemini-2.0-flash'],
}

// Normalize provider names that may differ between DB records and PROVIDER_CONFIGS keys
const PROVIDER_ALIASES: Record<string, ProviderId> = {
  moonshot: 'kimi',
  'moonshot-ai': 'kimi',
  anthropic: 'claude',
  google: 'gemini',
  'google-gemini': 'gemini',
}

export function normalizeProviderId(raw: string): ProviderId | null {
  const lower = raw.toLowerCase().trim()
  if (lower in PROVIDER_CONFIGS) return lower as ProviderId
  if (lower in PROVIDER_ALIASES) return PROVIDER_ALIASES[lower]
  return null
}

// Distribution of primary models per task
// Active providers: Claude Opus 5, DeepSeek, Kimi K3
// Inactive providers (quota exceeded): Gemini
export const INITIAL_TASK_ROUTING: Record<TaskType, ProviderId> = {
  ocr_extraction: 'deepseek',
  normalization: 'deepseek',
  rewrite: 'claude',
  full_analysis: 'claude',
  social_advice: 'claude',
  cover_letter: 'claude',
  support_chat: 'deepseek',
}

// Fallback sequence
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  claude: ['kimi', 'deepseek', 'gemini'],
  kimi: ['deepseek', 'claude', 'gemini'],
  deepseek: ['kimi', 'claude', 'gemini'],
  gemini: ['kimi', 'deepseek', 'claude'],
}

export async function getProviderRuntimeConfig(providerId: ProviderId) {
  const base = PROVIDER_CONFIGS[providerId]
  if (!base) {
    console.warn(`[AI Registry] Unknown provider '${providerId}', skipping.`)
    return {
      providerId,
      apiKey: '',
      baseURL: '',
      model: '',
      pricing: { inputPer1k: 0, outputPer1k: 0 },
    }
  }
  let apiKey = process.env[base.apiKeyEnvVar] || ''
  let baseURL = base.baseURL
  let model = base.defaultModel

  // 1. Check AiApiKey table for active key registered by admin
  try {
    const registeredKeys = await db.aiApiKey.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
    })

    const matchingKey = registeredKeys.find(
      (k) => normalizeProviderId(k.provider) === providerId
    )

    if (matchingKey) {
      if (matchingKey.apiKey) apiKey = matchingKey.apiKey
      if (matchingKey.baseUrl) baseURL = matchingKey.baseUrl
      if (matchingKey.model) model = matchingKey.model
    }
  } catch (e) {
    console.warn('Failed to fetch AiApiKey:', e)
  }

  // 2. Check SystemConfig table
  try {
    const configs = await db.systemConfig.findMany()
    for (const c of configs) {
      const keyPrefix = providerId === 'kimi' ? 'MOONSHOT' : providerId.toUpperCase()
      if ((c.key === `${keyPrefix}_API_KEY` || c.key === `${providerId.toUpperCase()}_API_KEY`) && c.value) {
        apiKey = c.value
      }
      if ((c.key === `${keyPrefix}_MODEL` || c.key === `${providerId.toUpperCase()}_MODEL`) && c.value) {
        model = c.value
      }
      if (c.key === `${providerId.toUpperCase()}_BASE_URL` && c.value) {
        baseURL = c.value
      }
    }
  } catch (e) {
    // Fallback to env
  }

  let trimmedModel = model.trim().toLowerCase()

  if (providerId === 'kimi' && (!baseURL || baseURL.includes('moonshot.cn'))) {
    baseURL = 'https://api.moonshot.ai/v1'
  }

  // Substitui apenas modelos desatualizados pelo padrão do provedor. A versão
  // anterior reescrevia por correspondência de substring — qualquer modelo com
  // "sonnet" no nome virava Opus 5, e qualquer "v4" do DeepSeek virava
  // deepseek-chat — o que desfazia silenciosamente a configuração do painel.
  if (!CURRENT_MODELS[providerId].includes(trimmedModel)) {
    trimmedModel = base.defaultModel
  }

  return {
    providerId,
    apiKey: apiKey.trim(),
    baseURL: baseURL.trim(),
    model: trimmedModel,
    pricing: MODEL_PRICING[trimmedModel] ?? base.pricing,
  }
}
