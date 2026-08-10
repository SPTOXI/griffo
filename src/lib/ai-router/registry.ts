import { db } from '../db'
import { tryDecryptSecret } from '../crypto'
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

/**
 * Provedor primário de cada tarefa.
 *
 * A divisão é por natureza do trabalho, não por preço: o que o usuário lê e
 * leva embora — laudo, reescrita, parecer de presença digital — vai para o
 * Claude (Sonnet 5); o que é maquinário interno — atendimento, juiz de
 * qualidade, análise de logs — vai para o DeepSeek, que custa uma ordem de
 * grandeza menos e não precisa da mesma profundidade.
 *
 * Houve uma passagem em que tudo foi para o DeepSeek, tentando resolver os 82s
 * da análise. Não era um problema de provedor: eram 3.800 tokens de saída numa
 * chamada só, e nenhum modelo gera isso rápido. A correção real foi dividir a
 * análise em cinco chamadas paralelas (ver lib/analysis/segments.ts), o que
 * liberou a escolha do modelo para voltar a ser sobre qualidade.
 */
export const INITIAL_TASK_ROUTING: Record<TaskType, ProviderId> = {
  // Sempre desviado para o Claude quando há PDF anexado — é o único da cadeia
  // com entrada nativa de documento. Declarado aqui pelo mesmo motivo.
  ocr_extraction: 'claude',
  analysis_segment: 'claude',
  full_analysis: 'claude',
  rewrite: 'claude',
  social_advice: 'claude',
  // Maquinário interno e tarefas sem chamador.
  support_chat: 'deepseek',
  normalization: 'deepseek',
  cover_letter: 'deepseek',
}

/**
 * Ordem de fallback. O Kimi é o primeiro suplente em todas as cadeias; o Gemini
 * fica por último enquanto não se decide se entra em uso.
 *
 * Vale lembrar que só os dois primeiros candidatos são de fato tentados
 * (`MAX_PROVIDER_ATTEMPTS` no router): o terceiro e o quarto existem para o
 * caso em que o filtro de residência de dados elimina algum dos anteriores.
 */
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  claude: ['kimi', 'deepseek', 'gemini'],
  deepseek: ['kimi', 'claude', 'gemini'],
  kimi: ['deepseek', 'claude', 'gemini'],
  gemini: ['kimi', 'deepseek', 'claude'],
}

/**
 * Cache curto das duas tabelas que alimentam a configuração de provedores.
 *
 * Uma análise chegava a fazer ~13 idas ao banco, das quais 4 eram estas mesmas
 * duas consultas repetidas: `getProviderRuntimeConfig` era chamada uma vez para
 * o provedor primário e de novo dentro do laço de tentativas, e cada chamada
 * lia `AiApiKey` e `SystemConfig` inteiras. Num usuário no Brasil isso custava
 * ~60ms; num usuário na Europa, contra o Supabase em São Paulo, passava de
 * 800ms — dentro de um orçamento de 60s que já estava apertado.
 *
 * O TTL é curto de propósito: uma troca de chave no painel passa a valer em no
 * máximo 30s, e as rotas administrativas limpam o cache explicitamente ao
 * salvar, então na prática o efeito é imediato.
 */
const CONFIG_CACHE_TTL_MS = 30_000

type ProviderTables = {
  keys: { id: string; provider: string; apiKey: string; baseUrl: string | null; model: string }[]
  configs: { key: string; value: string }[]
}

let cachedTables: { data: ProviderTables; at: number } | null = null

/** Invalida o cache. Chamado pelas rotas que alteram chaves ou configurações. */
export function clearProviderConfigCache() {
  cachedTables = null
}

async function loadProviderTables(): Promise<ProviderTables> {
  if (cachedTables && Date.now() - cachedTables.at < CONFIG_CACHE_TTL_MS) {
    return cachedTables.data
  }

  const empty: ProviderTables = { keys: [], configs: [] }
  try {
    const [keys, configs] = await Promise.all([
      db.aiApiKey.findMany({
        where: { status: 'active' },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, provider: true, apiKey: true, baseUrl: true, model: true },
      }),
      db.systemConfig.findMany({ select: { key: true, value: true } }),
    ])
    const data = { keys, configs }
    cachedTables = { data, at: Date.now() }
    return data
  } catch (e) {
    console.warn('[AI Registry] Falha ao ler configuração de provedores:', e)
    // Sem cachear a falha: a próxima chamada tenta de novo.
    return cachedTables?.data ?? empty
  }
}

/** Provedores com chave ativa cadastrada, sem uma consulta adicional. */
export async function getProvidersWithActiveKeys(): Promise<ProviderId[]> {
  const { keys } = await loadProviderTables()
  const ids = new Set<ProviderId>()
  for (const k of keys) {
    const id = normalizeProviderId(k.provider)
    if (id) ids.add(id)
  }
  return [...ids]
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

  const { keys, configs } = await loadProviderTables()

  // 1. Chave ativa cadastrada pelo admin em AiApiKey
  const matchingKey = keys.find((k) => normalizeProviderId(k.provider) === providerId)
  if (matchingKey) {
    // Decifra tolerando falha: se a chave não abrir, este provedor fica sem
    // credencial e o roteador cai para o próximo, em vez de derrubar a
    // requisição inteira.
    if (matchingKey.apiKey) {
      apiKey = tryDecryptSecret(matchingKey.apiKey, `AiApiKey.${matchingKey.id}`) || apiKey
    }
    if (matchingKey.baseUrl) baseURL = matchingKey.baseUrl
    if (matchingKey.model) model = matchingKey.model
  }

  // 2. SystemConfig sobrepõe
  const keyPrefix = providerId === 'kimi' ? 'MOONSHOT' : providerId.toUpperCase()
  for (const c of configs) {
    if ((c.key === `${keyPrefix}_API_KEY` || c.key === `${providerId.toUpperCase()}_API_KEY`) && c.value) {
      apiKey = tryDecryptSecret(c.value, `SystemConfig.${c.key}`) || apiKey
    }
    if ((c.key === `${keyPrefix}_MODEL` || c.key === `${providerId.toUpperCase()}_MODEL`) && c.value) {
      model = c.value
    }
    if (c.key === `${providerId.toUpperCase()}_BASE_URL` && c.value) {
      baseURL = c.value
    }
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
