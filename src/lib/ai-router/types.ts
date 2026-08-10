export type TaskType =
  | 'ocr_extraction'
  | 'normalization'
  | 'rewrite'
  | 'full_analysis'
  /// Um dos cinco pedaços da análise segmentada. Separado de `full_analysis`
  /// porque o Agente de Qualidade valida os dois de formas diferentes — ver
  /// agents/quality-agent.ts.
  | 'analysis_segment'
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
  /// Chamada de infraestrutura (juiz de qualidade, análise de logs), não pedida
  /// por um usuário. Não é amostrada pelo juiz — sem isto, julgar um resultado
  /// dispararia o julgamento do próprio julgamento, sem fim.
  internal?: boolean
  /// PDF em base64 enviado ao modelo como documento, para currículos
  /// escaneados sem camada de texto. Restringe a chamada ao Claude — é o único
  /// provedor da cadeia com entrada nativa de documento.
  pdfBase64?: string
  /// Contexto grande e idêntico entre chamadas irmãs — o currículo, na análise
  /// segmentada. Vai à frente do `systemPrompt` e é marcado como cacheável: no
  /// Claude via `cache_control`, nos provedores compatíveis com OpenAI pelo
  /// cache automático de prefixo, que exige apenas que o trecho comum venha
  /// primeiro e byte a byte igual. É o que torna barato repetir o currículo nos
  /// cinco segmentos da análise em vez de pedir tudo numa chamada só.
  cacheableContext?: string
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

