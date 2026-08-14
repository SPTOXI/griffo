export type TaskType =
  | 'ocr_extraction'
  | 'normalization'
  | 'rewrite'
  | 'full_analysis'
  /// Um dos cinco pedaços da análise segmentada. Separado de `full_analysis`
  /// porque o Agente de Qualidade valida os dois de formas diferentes — ver
  /// agents/quality-agent.ts.
  | 'analysis_segment'
  /// Prévia gratuita: só as oito notas, sem diagnóstico e sem texto. Roda num
  /// modelo barato porque é servida a quem ainda não pagou nada — a conversão
  /// vem de a pessoa ver a nota e não ver o porquê.
  | 'free_preview'
  | 'social_advice'
  /// Diagnóstico vocacional. Tem tipo próprio porque o Agente de Qualidade
  /// valida cada tarefa pelo formato que ela produz: enquanto esta rota
  /// declarava `full_analysis`, toda resposta era reprovada por não ter
  /// `dimensions` — campo do laudo de currículo, que o diagnóstico vocacional
  /// nunca produziu. Ver agents/quality-agent.ts.
  | 'career_orientation'
  | 'cover_letter'
  | 'support_chat'

export type ProviderId = 'gemini' | 'deepseek' | 'claude' | 'kimi'

export interface ModelPricing {
  inputPer1k: number // USD per 1K input tokens
  outputPer1k: number // USD per 1K output tokens
}

/**
 * Preço que muda com o relógio.
 *
 * O DeepSeek passou a cobrar o dobro em duas janelas fixas do dia (ver
 * `TIERED_MODEL_PRICING` em pricing.ts). Um número único não representa isso:
 * ou superestima o custo por 17 horas do dia, ou o subestima pelas outras 7.
 */
export interface TieredPricing {
  /// Instante (ms desde a época) a partir do qual esta tabela vale. Antes dele,
  /// o preço aplicado é o de `MODEL_PRICING`.
  from: number
  /// Faixas [início, fim) de hora UTC em que vale `peak`. Fora delas, `offPeak`.
  peakWindowsUtc: ReadonlyArray<readonly [number, number]>
  peak: ModelPricing
  offPeak: ModelPricing
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
  /// Desliga o raciocínio estendido do modelo nesta chamada.
  ///
  /// No Sonnet 5 o raciocínio é ligado por padrão quando o parâmetro `thinking`
  /// é omitido — mudança silenciosa em relação ao Sonnet 4.6, onde omiti-lo
  /// significava raciocínio desligado. E `max_tokens` limita raciocínio MAIS
  /// resposta somados: numa chamada de orçamento curto, o raciocínio consome a
  /// cota e a resposta chega truncada.
  ///
  /// Para extração estruturada — que é o que os segmentos da análise fazem — o
  /// raciocínio não acrescenta nada e só disputa o orçamento. Desligá-lo também
  /// derruba a latência, que é o objetivo de toda a divisão em segmentos.
  disableThinking?: boolean
  /// Tempo total que este roteador pode consumir, em milissegundos.
  ///
  /// O padrão (52s) supõe que a chamada de IA começa junto com a requisição
  /// HTTP. Rotas que fazem trabalho ANTES dela — a análise de presença digital
  /// gasta até 8s buscando os perfis e mais um tanto lendo o PDF — precisam
  /// declarar o que sobrou, senão o roteador planeja em cima de um orçamento
  /// que já foi parcialmente gasto e a função é encerrada pela plataforma antes
  /// do `catch` que responde ao usuário.
  timeBudgetMs?: number
  /// Quantos provedores tentar, no máximo. Padrão 2.
  ///
  /// O orçamento é dividido entre as tentativas, então duas tentativas valem
  /// metade do prazo cada. Para tarefas de GERAÇÃO LONGA — a reescrita produz
  /// um currículo inteiro — meio prazo não basta para nenhum provedor, e
  /// reservá-lo para um suplente que também não caberia garante duas falhas em
  /// vez de um sucesso. Nesses casos, declarar 1 troca a redundância por tempo,
  /// que é o recurso de que a tarefa realmente precisa.
  maxProviderAttempts?: number
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

