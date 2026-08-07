import { db } from '../db'
import { ProviderConfig, ProviderId, TaskType } from './types'

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
    defaultModel: 'claude-sonnet-4-20250514',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    pricing: {
      inputPer1k: 0.003, // $3.00 / 1M
      outputPer1k: 0.015, // $15.00 / 1M
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

// Distribution of primary models per task (optimized by provider specialty)
// - Gemini: best for OCR/vision and fast extraction
// - DeepSeek: cost-effective for normalization/structuring
// - Claude: superior writing quality for rewrites and creative content
// - Kimi: strong full-document analysis and reasoning
export const INITIAL_TASK_ROUTING: Record<TaskType, ProviderId> = {
  ocr_extraction: 'deepseek',
  normalization: 'deepseek',
  rewrite: 'claude',
  full_analysis: 'claude',
  social_advice: 'claude',
  cover_letter: 'claude',
  support_chat: 'deepseek',
}

// Fallback sequence if primary provider fails
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  claude: ['deepseek', 'gemini', 'kimi'],
  deepseek: ['claude', 'gemini', 'kimi'],
  gemini: ['claude', 'deepseek', 'kimi'],
  kimi: ['claude', 'deepseek', 'gemini'],
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

  let trimmedModel = model.trim()
  const lowerModel = trimmedModel.toLowerCase()

  // Auto-correct common model naming mismatches configured in DB/env
  if (providerId === 'kimi') {
    if (!baseURL || baseURL.includes('moonshot.cn')) {
      baseURL = 'https://api.moonshot.ai/v1'
    }
    if (!trimmedModel || trimmedModel.startsWith('moonshot-v1')) {
      trimmedModel = 'kimi-k3'
    }
  }
  if (providerId === 'claude' && (lowerModel === 'claude-3-5-sonnet' || lowerModel === 'claude-3-5-sonnet-20241022' || lowerModel === 'claude-sonnet-5' || !trimmedModel)) {
    trimmedModel = 'claude-sonnet-4-20250514'
  }
  if (providerId === 'deepseek' && (lowerModel.includes('v3') || lowerModel === 'deepseek-chat' || !trimmedModel)) {
    trimmedModel = 'deepseek-v4-pro'
  }
  if (providerId === 'gemini' && (lowerModel === 'gemini-pro' || lowerModel === 'gemini-1.5-flash' || lowerModel === 'gemini-2.5-flash' || !trimmedModel)) {
    trimmedModel = 'gemini-2.0-flash'
  }

  return {
    providerId,
    apiKey: apiKey.trim(),
    baseURL: baseURL.trim(),
    model: trimmedModel,
    pricing: base.pricing,
  }
}
