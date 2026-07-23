export type TaskType =
  | 'ocr_extraction'
  | 'normalization'
  | 'rewrite'
  | 'full_analysis'
  | 'social_advice'
  | 'cover_letter'

export type ProviderId = 'gemini' | 'deepseek' | 'claude' | 'kimi'

export interface ModelPricing {
  inputPer1k: number // USD per 1K input tokens
  outputPer1k: number // USD per 1K output tokens
}

export interface ProviderConfig {
  id: ProviderId
  name: string
  defaultModel: string
  baseURL: string
  apiKeyEnvVar: string
  pricing: ModelPricing
}

export interface AiTaskRequest {
  taskType: TaskType
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  userId?: string
  resumeId?: string
}

export interface AiTaskResult {
  content: string
  usedProvider: ProviderId
  usedModel: string
  primaryModel: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  responseTimeMs: number
  status: 'success' | 'failover' | 'error'
  errorCode?: string
  failoverCount: number
}

export interface ModelBenchmarkItem {
  provider: ProviderId
  model: string
  callsCount: number
  tokensTotal: number
  avgLatencyMs: number
  avgCostUsd: number
  successRatePct: number
  failoverCount: number
}
