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
    //
    // `deepseek-v4-flash` (o padrão seguinte) também foi retirado, confirmado
    // em 13/09/2026 na documentação oficial: "ainda é aceito, mas os modelos
    // correspondentes foram aposentados" — servido por trás por
    // `deepseek-flash`, no mesmo preço. Diferente do `deepseek-chat`, este
    // não falha explicitamente (o alias continua respondendo), então não
    // havia sintoma nenhum apontando para o problema — só apareceu ao
    // verificar o ID antes de uma mudança não relacionada (pedido do
    // operador para o Flash V4.1). `deepseek-flash` é o ID atual.
    defaultModel: 'deepseek-flash',
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
    // `gemini-2.0-flash` foi APOSENTADO pelo Google — descoberto em
    // 26/08/2026 ao investigar "erro geral" no diagnóstico de conexão. O erro
    // real (só visível chamando a API REST direto — o SDK da OpenAI engole o
    // corpo do 404 do Gemini e mostra "404 status code (no body)") era:
    // "This model models/gemini-2.0-flash is no longer available. Please
    // update your code to use models/gemini-3.6-flash." Mesma classe do
    // `deepseek-chat` retirado em 24/07/2026 — ver o comentário no DeepSeek
    // logo abaixo. Zero chamada ao Gemini está registrada em `AiLog` desde
    // sempre (só é candidato de suplente distante, quase nunca alcançado),
    // então isto pode ter estado quebrado por um bom tempo sem ninguém notar.
    defaultModel: 'gemini-3.6-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    // Preço herdado do `gemini-2.0-flash` — NÃO confirmado para o
    // `gemini-3.6-flash`. Mantido como estimativa até alguém confirmar o
    // valor real na página de pricing do Google; o painel de custo pode
    // estar errado para este provedor até lá.
    pricing: {
      inputPer1k: 0.000075, // $0.075 / 1M — herdado, não confirmado
      outputPer1k: 0.0003, // $0.30 / 1M — herdado, não confirmado
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    // Cadastrado em 26/08/2026 a pedido do operador. Nenhuma tarefa foi
    // roteada pra cá ainda — só disponibilizado no painel administrativo,
    // pra ser atribuído depois. Ver 2.36 na auditoria.
    defaultModel: 'gpt-5.6-luna',
    baseURL: 'https://api.openai.com/v1',
    // O .env local do operador tem a chave em `ChatGPT_KEY`, não neste nome —
    // isso só importa se ninguém cadastrar a chave pelo painel (que decifra
    // de `AiApiKey`/`SystemConfig` e tem prioridade sobre a variável de
    // ambiente, ver `getProviderRuntimeConfig` abaixo). Cadastrando pelo
    // painel, o nome da variável local não faz diferença nenhuma.
    apiKeyEnvVar: 'OPENAI_API_KEY',
    pricing: {
      inputPer1k: 0.0002, // $0.20 / 1M (gpt-5.6-luna, contexto curto)
      outputPer1k: 0.0012, // $1.20 / 1M
    },
  },
}

// A tabela de preços vive em ./pricing (sem dependência de banco, para poder
// ser testada). Reexportada aqui porque este é o módulo que o resto do
// roteador importa.
export { resolveModelPricing } from './pricing'

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
  //
  // `deepseek-v4-flash` saiu pelo mesmo motivo, confirmado em 13/09/2026: a
  // chave já cadastrada no painel apontava para ele, e sem removê-lo daqui
  // ela continuaria "funcionando" só porque a DeepSeek mantém o alias — o
  // efeito colateral seria nunca migrar de fato para o `deepseek-flash`
  // atual, e continuar vulnerável ao dia em que o alias for desligado de
  // vez, sem aviso, como aconteceu com o `deepseek-chat`.
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
  // `gemini-2.0-flash` saiu da lista pelo mesmo motivo do `deepseek-chat`
  // acima: aposentado pelo Google (descoberto em 26/08/2026, ver o
  // cabeçalho de PROVIDER_CONFIGS.gemini). Mantê-lo aqui faria uma chave já
  // cadastrada continuar chamando um ID que devolve 404.
  gemini: ['gemini-3.6-flash'],
  openai: ['gpt-5.6-luna'],
}

// Normalize provider names that may differ between DB records and PROVIDER_CONFIGS keys
const PROVIDER_ALIASES: Record<string, ProviderId> = {
  moonshot: 'kimi',
  'moonshot-ai': 'kimi',
  anthropic: 'claude',
  google: 'gemini',
  'google-gemini': 'gemini',
  chatgpt: 'openai',
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
  // GPT-5.6 (OpenAI), não Claude — decisão do operador em 12/09/2026 para
  // aliviar a concentração em cima do Claude (oito tarefas primárias antes
  // desta), testando o provedor cadastrado em 26/08/2026 e nunca usado numa
  // tarefa real. Escolhida esta, e não uma das sete já em produção, por ser
  // a única ainda sem histórico de qualidade em nenhum provedor — testar o
  // GPT-5.6 aqui não arrisca regredir algo que já funciona. Sem histórico de
  // erro do Claude que motivasse a troca (ver `AiLog`: zero erro desde
  // 26/08/2026) — puramente preventivo, não uma correção.
  interview_prep: 'openai',
  // Prévia gratuita: servida a quem ainda não pagou, ao custo de US$ 0,0011 por
  // conta fora de pico e US$ 0,0022 no pico, pela tabela do DeepSeek que vale a
  // partir de 16/08/2026 (antes dela era US$ 0,0017). É o único item do produto
  // que roda deliberadamente no modelo barato.
  free_preview: 'deepseek',
  // Extração estruturada de campos que já estão escritos no currículo. Não é
  // redação nem julgamento: o modelo barato faz isso bem, e a rota é chamada
  // uma vez por pessoa.
  profile_extraction: 'deepseek',
  // Mesma extração, com alguém esperando na tela da landing: vai para o Claude
  // (com `modelOverride` Haiku 4.5 na chamada), o mais rápido da cadeia para
  // JSON curto. O DeepSeek Pro leva ~53s na mediana nesta tarefa.
  lead_profile_extraction: 'claude',
  // Ficha da vaga: extração curta, em lote, milhares de vezes. Começou no
  // DeepSeek (US$ 0,0008/vaga, 3,4s na primeira rodada, 23/09/2026) e foi para
  // o Kimi por decisão do operador no mesmo dia: há crédito sobrando lá, e o
  // gasto sai do crédito, não do caixa (~US$ 0,015/vaga). O preço disso é
  // velocidade — ~12s por chamada e teto de 3 simultâneas por organização —,
  // e é por isso que `lib/jobs/intelligence.server.ts` usa 3 de concorrência.
  // O suplente é o DeepSeek (`FALLBACK_CHAIN.kimi`), o que também tira o
  // Claude, dez vezes mais caro, do caminho desta tarefa.
  job_intelligence: 'kimi',
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
 *
 * **Regra do operador (26/08/2026): o Kimi só entra em funções SERIAIS.**
 * `job_deduplication` é serial por natureza (`agent-dedup.ts` processa um par
 * de vagas por vez) e é onde o Kimi continua como primário, sem restrição —
 * nunca dispara chamadas concorrentes contra si mesmo. Para qualquer tarefa
 * que dispare N chamadas em PARALELO no mesmo pedido (`analysis_segment`,
 * `social_advice`) ou que sirva muitos usuários ao mesmo tempo, o Kimi não
 * deve ocupar a primeira posição de suplente: seu teto de 3 requisições
 * simultâneas por organização (comentário mais abaixo, no laço de chamada)
 * é estourado justo quando várias tarefas caem para o suplente ao mesmo
 * tempo — ver 2.34 na auditoria para os números que embasaram isto. O
 * DeepSeek assume essa posição nas cadeias abaixo.
 */
export const FALLBACK_CHAIN: Record<ProviderId, ProviderId[]> = {
  // DeepSeek como primeiro suplente do Claude, e não o Kimi — decisão
  // corrigida em 26/08/2026 a partir do log de 30 dias, não por preço (embora
  // o DeepSeek também seja mais barato): quando o Claude falha como primário,
  // `MAX_PROVIDER_ATTEMPTS = 2` dá à cadeia só UMA chance de suplente, e essa
  // chance ia para o Kimi. Em 30 dias o Kimi tentado como segunda tentativa
  // teve 0 sucessos em ~46 tentativas (sempre timeout) — contra 32 de 32
  // sucessos do DeepSeek quando ele ocupava essa posição (usuários da UE, onde
  // a residência de dados já excluía o Kimi do §13, deixando o DeepSeek em
  // segundo por acidente). A causa mais provável está documentada logo abaixo,
  // no laço de chamada: "o Kimi limita a 3 requisições simultâneas por
  // organização" — exatamente o cenário de uma falha do Claude em cluster,
  // quando várias análises caem para o suplente ao mesmo tempo e saturam esse
  // teto. Ver 2.34 na auditoria para os números completos.
  claude: ['deepseek', 'kimi', 'gemini'],
  // Era `['kimi', 'claude', 'gemini']` — Kimi em primeiro por ser mais barato
  // que o Claude, decisão pensada para UM sintoma do DeepSeek: estourar o
  // orçamento de raciocínio (`JSON_TASK_TOKEN_FLOOR` em router.ts). Esse
  // sintoma específico já tem correção própria desde 25/08/2026 (piso de
  // tokens 4x maior). O que sobrou sem explicação era outro sintoma —
  // `profile_extraction` reprovado por "JSON inválido" mesmo respondendo
  // rápido (não é truncamento) — e aí o Kimi como suplente falhou as mesmas
  // vezes que falhou como suplente do Claude: mesma causa registrada em
  // 2.34, o teto de 3 requisições simultâneas do Kimi por organização,
  // saturado justo quando várias tarefas caem para o suplente ao mesmo
  // tempo. Trocado em 26/08/2026 para o Claude primeiro — nunca falhou
  // `profile_extraction` nas tentativas observadas — com o Kimi mantido só
  // como segunda opção, mais barata, para quando o Claude também não servir.
  deepseek: ['claude', 'kimi', 'gemini'],
  kimi: ['deepseek', 'gemini', 'claude'],
  gemini: ['kimi', 'deepseek', 'claude'],
  // Ninguém é primário aqui ainda (ver PROVIDER_CONFIGS.openai) — cadeia
  // preenchida por completude do tipo. Kimi de fora por padrão, mesma regra
  // acima: sem uso real ainda, não há como saber se uma tarefa que vier a
  // usar OpenAI como primária vai disparar chamadas em paralelo.
  openai: ['claude', 'deepseek', 'gemini'],
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
