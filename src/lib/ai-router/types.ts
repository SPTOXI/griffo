export type TaskType =
  | 'ocr_extraction'
  | 'normalization'
  | 'rewrite'
  | 'full_analysis'
  | 'social_advice'
  | 'cover_letter'
  | 'support_chat'

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
  // JSON Schema da resposta esperada. No Claude, é aplicado como restrição de
  // saída (`output_config.format`), que garante JSON válido e no formato — não
  // é só uma instrução no prompt. Nos provedores compatíveis com OpenAI vira
  // `response_format: json_object`, que garante JSON válido mas não o formato.
  jsonSchema?: Record<string, unknown>
  /// Código de país do usuário (ISO-2), vindo da borda. Define quais provedores
  /// podem receber o dado — ver lib/data-residency.ts.
  userCountry?: string | null
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

export interface OperationalFailureItem {
  id: string
  createdAt: string
  taskType: string
  primaryModel: string
  provider: string
  status: string
  failoverCount: number
  errorMessage: string | null
  userId?: string | null
  userEmail?: string | null
}

