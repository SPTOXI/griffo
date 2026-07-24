import { db } from '../db'
import { ProviderConfig, ProviderId, TaskType } from './types'

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  kimi: {
    id: 'kimi',
    name: 'Kimi K3 (Moonshot AI)',
    defaultModel: 'moonshot-v1-8k',
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
    defaultModel: 'claude-3-5-sonnet-20241022',
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
    defaultModel: 'gemini-1.5-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    pricing: {
      inputPer1k: 0.000075, // $0.075 / 1M
      outputPer1k: 0.0003, // $0.30 / 1M
    },
  },
}

// Distribution of primary models per task
export const INITIAL_TASK_ROUTING: Record<TaskType, ProviderId> = {
  ocr_extraction: 'gemini',
  normalization: 'deepseek',
  rewrite: 'claude',
  full_analysis: 'kimi',
  social_advice: 'claude',
  cover_letter: 'claude',
}

// Fallback sequence if primary provider fails
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  kimi: ['claude', 'deepseek', 'gemini'],
  claude: ['kimi', 'deepseek', 'gemini'],
  deepseek: ['gemini', 'kimi', 'claude'],
  gemini: ['deepseek', 'kimi', 'claude'],
}

export async function getProviderRuntimeConfig(providerId: ProviderId) {
  const base = PROVIDER_CONFIGS[providerId]
  let apiKey = process.env[base.apiKeyEnvVar] || process.env.MOONSHOT_API_KEY || process.env.LLM_API_KEY || ''
  let baseURL = base.baseURL
  let model = base.defaultModel

  // 1. Check AiApiKey table for active key registered by admin
  try {
    const providerName = providerId === 'kimi' ? 'moonshot' : providerId
    const registeredKeys = await db.aiApiKey.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
    })

    const matchingKey = registeredKeys.find(
      (k) => k.provider.toLowerCase() === providerName.toLowerCase()
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
      if ((c.key === `${providerId.toUpperCase()}_API_KEY` || c.key === 'MOONSHOT_API_KEY') && c.value) {
        apiKey = c.value
      }
      if ((c.key === `${providerId.toUpperCase()}_MODEL` || c.key === 'KIMI_MODEL') && c.value) {
        model = c.value
      }
      if (c.key === `${providerId.toUpperCase()}_BASE_URL` && c.value) {
        baseURL = c.value
      }
    }
  } catch (e) {
    // Fallback to env
  }

  // Fallback for Moonshot AI model if model is 'kimi-k3' (Moonshot API requires 'moonshot-v1-8k' or 'moonshot-v1-32k')
  if (providerId === 'kimi' && (model === 'kimi-k3' || !model)) {
    model = 'moonshot-v1-8k'
  }

  return {
    providerId,
    apiKey: apiKey.trim(),
    baseURL: baseURL.trim(),
    model: model.trim(),
    pricing: base.pricing,
  }
}
