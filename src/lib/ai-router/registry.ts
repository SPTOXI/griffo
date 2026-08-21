import { db } from '../db'
import { tryDecryptSecret } from '../crypto'
import { ProviderConfig, ProviderId, TaskType } from './types'
import { resolveModelPricing } from './pricing'

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
    // `deepseek-chat` era o padrão daqui, mas foi RETIRADO em 24/07/2026 15:59
    // UTC — era apelido do V4-Flash em modo não-pensante. Um ID retirado não
    // responde: enquanto ele era o padrão, toda chamada ao DeepSeek que não
    // tivesse modelo configurado no painel falhava e caía para o suplente.
    defaultModel: 'deepseek-v4-flash',
    baseURL: 'https://api.deepseek.com/v1',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    // Fallback de preço, usado só se o modelo efetivo sair de MODEL_PRICING.
    // Fora de pico do V4-Flash, que é o padrão do provedor.
    pricing: {
      inputPer1k: 0.00022, // $0.22 / 1M
      outputPer1k: 0.00066, // $0.66 / 1M
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

// A tabela de preços vive em ./pricing (sem dependência de banco, para poder
// ser testada). Reexportada aqui porque este é o módulo que o resto do
// roteador importa.
export { MODEL_PRICING, TIERED_MODEL_PRICING, resolveModelPricing } from './pricing'

// Modelos correntes por provedor. Um modelo configurado fora desta lista é
// tratado como desatualizado e substituído pelo padrão do provedor.
const CURRENT_MODELS: Record<ProviderId, string[]> = {
  claude: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
  kimi: ['kimi-k3'],
  // `deepseek-chat` saiu da lista porque foi retirado pelo provedor em
  // 24/07/2026. Mantê-lo aqui faria uma configuração antiga do painel continuar
  // valendo e chamando um ID que não existe mais; fora da lista, ela é
  // substituída pelo padrão do provedor — que é exatamente para o que esta
  // substituição existe.
  deepseek: ['deepseek-v4-flash', 'deepseek-v4-pro'],
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

/**
 * O modelo que será REALMENTE usado para um modelo configurado no painel.
 *
 * A substituição de um modelo fora da lista de correntes é deliberada — mantém
 * o produto no ar quando um ID envelhece —, mas era invisível. O painel exibia
 * `claude-3-5-sonnet` e a API recebia `claude-sonnet-5`: um administrador
 * investigando latência ou custo raciocinava sobre um modelo que nunca rodou, e
 * trocar a configuração não produzia efeito nenhum, porque o valor digitado era
 * descartado de qualquer forma.
 *
 * Exportada para que o painel possa mostrar as duas coisas.
 */
export function effectiveModel(providerId: ProviderId, storedModel: string | null | undefined): string {
  const base = PROVIDER_CONFIGS[providerId]
  if (!base) return storedModel?.trim() || ''
  const trimmed = (storedModel || '').trim().toLowerCase()
  return CURRENT_MODELS[providerId].includes(trimmed) ? trimmed : base.defaultModel
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
  career_orientation: 'claude',
  // A carta é um dos nove itens que a Análise Completa entrega, e o custo por
  // análise foi calculado com ela no Sonnet. Estava no DeepSeek — mais barata,
  // mas fora do padrão de qualidade do que a pessoa leva embora.
  cover_letter: 'claude',
  // Prévia gratuita: servida a quem ainda não pagou, ao custo de US$ 0,0011 por
  // conta fora de pico e US$ 0,0022 no pico, pela tabela do DeepSeek que vale a
  // partir de 16/08/2026 (antes dela era US$ 0,0017). É o único item do produto
  // que roda deliberadamente no modelo barato.
  free_preview: 'deepseek',
  // Extração estruturada de campos que já estão escritos no currículo. Não é
  // redação nem julgamento: o modelo barato faz isso bem, e a rota é chamada
  // uma vez por pessoa.
  profile_extraction: 'deepseek',
  // Maquinário interno e tarefas sem chamador.
  support_chat: 'deepseek',
  normalization: 'deepseek',
  // Agente de deduplicação semântica de vagas: Kimi K3 prioritário.
  job_deduplication: 'kimi',
}

/**
 * Ordem de fallback. O Kimi é o primário para deduplicação, com DeepSeek Flash
 * como primeiro suplente e Gemini como segundo.
 *
 * Vale lembrar que só os dois primeiros candidatos são de fato tentados
 * (`MAX_PROVIDER_ATTEMPTS` no router): o terceiro e o quarto existem para o
 * caso em que o filtro de residência de dados elimina algum dos anteriores.
 */
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  claude: ['kimi', 'deepseek', 'gemini'],
  deepseek: ['kimi', 'claude', 'gemini'],
  kimi: ['deepseek', 'gemini', 'claude'],
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
    // Resolvido agora, não na carga do módulo: o preço do DeepSeek depende da
    // hora UTC da chamada.
    pricing: resolveModelPricing(trimmedModel) ?? base.pricing,
  }
}
