import OpenAI from 'openai'
import { db } from '../db'
import { AiTaskRequest, AiTaskResult, ProviderId } from './types'
import {
  FALLBACK_CHAIN,
  getProviderRuntimeConfig,
  getProvidersWithActiveKeys,
  INITIAL_TASK_ROUTING,
} from './registry'
import { after } from 'next/server'
import { auditQualityOfAiResult } from '../agents/quality-agent'
import { judgeAiResult, shouldJudge } from '../agents/quality-judge'
import { filterProvidersByResidency, isEuropeanUser } from '../data-residency'

// As rotas que chamam este roteador declaram maxDuration = 60. Se o orçamento
// for consumido inteiro pelas tentativas de IA, a plataforma encerra a função
// antes do `catch` que devolve os créditos ao usuário — que então paga sem
// receber. Os limites abaixo existem para garantir que sempre sobre tempo
// para o reembolso e a persistência.
//
// O teto por tentativa é DERIVADO do orçamento (metade dele, respeitando o
// máximo), porque precisa caber DUAS vezes dentro do prazo: senão o fallback só
// funciona quando o primário falha rápido — justamente o caso em que ele menos
// importa. Com 35s fixos (dois valores atrás), um primário que travava consumia
// o orçamento inteiro e o segundo provedor nunca era tentado: 35 + 35 = 70 não
// cabe em 52.
const MAX_PROVIDER_ATTEMPTS = 2
// Corta novas tentativas a partir daqui, deixando ~8s para reembolso,
// gravação no banco e a resposta HTTP dentro do limite de 60s. É o padrão:
// quem já gastou parte do prazo antes de chamar declara o que sobrou em
// `req.timeBudgetMs`.
const DEFAULT_TASK_BUDGET_MS = 52_000
const MAX_PROVIDER_TIMEOUT_MS = 25_000
// Abaixo disto uma tentativa não tem chance real de terminar, e um teto menor
// só produziria duas falhas rápidas em vez de uma resposta.
const MIN_PROVIDER_TIMEOUT_MS = 12_000

// Multiplicadores do cache de prompt da Anthropic, relativos ao preço de
// entrada: gravar custa 1,25x e ler custa 0,1x.
const CACHE_WRITE_MULTIPLIER = 1.25
const CACHE_READ_MULTIPLIER = 0.1

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResult> {
  const taskStartTime = Date.now()

  // O teto por tentativa é derivado do orçamento, e não fixo: ele precisa caber
  // DUAS vezes no prazo, senão o fallback só funciona quando o primário falha
  // rápido — justamente o caso em que ele menos importa.
  const taskBudgetMs = Math.max(MIN_PROVIDER_TIMEOUT_MS, req.timeBudgetMs ?? DEFAULT_TASK_BUDGET_MS)
  const providerTimeoutMs = Math.min(
    MAX_PROVIDER_TIMEOUT_MS,
    Math.max(MIN_PROVIDER_TIMEOUT_MS, Math.floor(taskBudgetMs / MAX_PROVIDER_ATTEMPTS))
  )
  // Entrada com documento só existe no Claude na cadeia atual: um PDF enviado
  // ao endpoint compatível com OpenAI seria descartado silenciosamente, e o
  // modelo responderia sobre um prompt sem o anexo. A escolha é feita aqui, e
  // não depois de montar a lista, para que `primaryModel` no AiLog registre o
  // modelo que de fato podia ser usado.
  const primaryProviderId: ProviderId = req.pdfBase64
    ? 'claude'
    : INITIAL_TASK_ROUTING[req.taskType] || 'kimi'
  const primaryRuntime = await getProviderRuntimeConfig(primaryProviderId)

  // 1. Collect all candidate providers to try
  const allCandidates: ProviderId[] = req.pdfBase64
    ? ['claude']
    : [primaryProviderId, ...FALLBACK_CHAIN[primaryProviderId].filter((id) => id !== primaryProviderId)]

  // 2. Provedores com chave cadastrada que não estejam na cadeia padrão.
  // Lê do mesmo cache de `getProviderRuntimeConfig`, sem consulta adicional.
  // Não se aplica com documento anexado, pela mesma razão acima.
  if (!req.pdfBase64) {
    for (const pId of await getProvidersWithActiveKeys()) {
      if (!allCandidates.includes(pId)) allCandidates.push(pId)
    }
  }

  // 3. Residência de dados: currículo de residente na UE não pode ir para
  // provedor sem decisão de adequação (China). Ver lib/data-residency.ts.
  const permitted = filterProvidersByResidency(allCandidates, req.userCountry)
  if (permitted.length === 0) {
    throw Object.assign(
      new Error('Nenhum provedor de IA autorizado para a região do usuário.'),
      { diagnostic: `Origem ${req.userCountry}: todos os candidatos são de jurisdição sem adequação.` }
    )
  }

  // Só as duas primeiras tentativas cabem no orçamento: 2 x 25s deixa 10s de
  // folga dentro do prazo de 52s. A cadeia completa de 4 provedores levaria
  // mais de 60s sozinha.
  const candidateProviders = permitted.slice(0, MAX_PROVIDER_ATTEMPTS)

  let lastError: any = null
  let failoverCount = 0
  const attemptDiagnostics: string[] = []

  for (let i = 0; i < candidateProviders.length; i++) {
    const currentProviderId = candidateProviders[i]

    // Não inicia uma tentativa que não caberia no orçamento restante — é o que
    // garante que o `catch` da rota chegue a executar e devolva os créditos.
    const elapsed = Date.now() - taskStartTime
    if (elapsed + providerTimeoutMs > taskBudgetMs) {
      attemptDiagnostics.push(
        `${currentProviderId.toUpperCase()}: Ignorado — orçamento de tempo esgotado (${elapsed}ms decorridos)`
      )
      break
    }

    // Reaproveita a do primário quando ele sobreviveu ao filtro de residência:
    // era a quarta consulta redundante ao banco por análise.
    const runtime =
      currentProviderId === primaryProviderId
        ? primaryRuntime
        : await getProviderRuntimeConfig(currentProviderId)

    // Skip provider if no API key is available
    if (!runtime.apiKey) {
      attemptDiagnostics.push(`${currentProviderId.toUpperCase()}: Sem chave de API`)
      continue
    }

    const startCallTime = Date.now()
    try {
      let content = ''
      let tokensIn = 0
      let tokensOut = 0
      // Tokens de entrada que não são cobrados ao preço cheio. Ficam de fora de
      // `tokensIn` para não distorcer o custo, e entram no cálculo com o
      // multiplicador de cada um.
      let cacheWriteTokens = 0
      let cacheReadTokens = 0

      if (currentProviderId === 'claude') {
        // Native Anthropic Messages API integration
        //
        // `useCache` decide entre marcar o contexto comum para cache — dois
        // blocos em `system`, o cacheável primeiro — e simplesmente concatenar
        // tudo numa string. A marcação cobre o que vem ANTES dela, então a ordem
        // é o que faz o cache valer; invertida, cada chamada gravaria um cache
        // novo.
        const claudeBody = (useCache: boolean) =>
          JSON.stringify({
            model: runtime.model || 'claude-sonnet-5',
            max_tokens: req.maxTokens ?? 3500,
            system: req.cacheableContext
              ? useCache
                ? [
                    {
                      type: 'text',
                      text: req.cacheableContext,
                      cache_control: { type: 'ephemeral' },
                    },
                    { type: 'text', text: req.systemPrompt },
                  ]
                : `${req.cacheableContext}\n\n${req.systemPrompt}`
              : req.systemPrompt,
            messages: [
              {
                role: 'user',
                content: req.pdfBase64
                  ? [
                      {
                        type: 'document',
                        source: { type: 'base64', media_type: 'application/pdf', data: req.pdfBase64 },
                      },
                      { type: 'text', text: req.userPrompt },
                    ]
                  : req.userPrompt,
              },
            ],
            // Omitir `thinking` NÃO significa raciocínio desligado no Sonnet 5:
            // desde essa geração o padrão é ligado, e `max_tokens` cobre
            // raciocínio e resposta somados. Numa chamada de orçamento curto o
            // raciocínio consome a cota e a resposta chega truncada — o JSON não
            // fecha e a validação do segmento reprova. Precisa ser explícito.
            ...(req.disableThinking ? { thinking: { type: 'disabled' } } : {}),
            // Structured outputs: a API restringe a geração ao schema, então a
            // resposta é sempre JSON válido no formato pedido. Elimina a classe
            // inteira de "falha de parse" que antes era mascarada com dados
            // fabricados.
            ...(req.jsonSchema
              ? { output_config: { format: { type: 'json_schema', schema: req.jsonSchema } } }
              : {}),
          })

        const callClaude = (useCache: boolean) =>
          fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': runtime.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: claudeBody(useCache),
            signal: AbortSignal.timeout(providerTimeoutMs),
          })

        const wantsCache = Boolean(req.cacheableContext)
        let res = await callClaude(wantsCache)
        let data = await res.json()

        // Um 400 é erro de forma da requisição, e o bloco de cache é o elemento
        // de forma mais recente aqui — pode não ser aceito pela versão da API ou
        // pelo plano da conta. Em vez de derrubar a análise inteira por causa de
        // uma otimização de custo, repete a chamada sem cache: o conteúdo é
        // exatamente o mesmo, só deixa de ser reaproveitado entre os segmentos.
        if (!res.ok && res.status === 400 && wantsCache) {
          const firstError = data.error?.message || data.message || JSON.stringify(data)
          console.warn(
            `[AI Router] Claude recusou a requisição com cache de prompt; repetindo sem cache. Motivo: ${firstError}`
          )
          attemptDiagnostics.push(`CLAUDE (cache recusado): ${firstError}`)
          res = await callClaude(false)
          data = await res.json()
        }

        if (!res.ok) {
          const status = res.status
          const errMsg = data.error?.message || data.message || JSON.stringify(data)
          throw new Error(`[Claude API ${status}] ${errMsg}`)
        }

        // A resposta é uma LISTA de blocos, e o primeiro não é necessariamente o
        // texto: com raciocínio ligado, `content[0]` é um bloco `thinking` e a
        // resposta vem depois dele. Ler o índice 0 às cegas devolvia string
        // vazia, e o roteador registrava "Resposta vazia recebida do provedor"
        // para uma chamada que na verdade respondeu — o erro escondia a causa.
        //
        // Procurar o bloco pelo tipo, e concatenar quando houver mais de um,
        // mantém a leitura correta independentemente de o raciocínio estar
        // ligado ou desligado.
        content = Array.isArray(data.content)
          ? data.content
              .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
              .map((b: any) => b.text)
              .join('')
          : ''

        // Truncamento por orçamento produz JSON que não fecha. Sem esta
        // distinção o erro chega como "estrutura inválida", que manda procurar
        // defeito no prompt em vez de no `max_tokens`.
        if (data.stop_reason === 'max_tokens') {
          throw new Error(
            `[Claude API] Resposta truncada em max_tokens (${req.maxTokens ?? 3500}). ` +
              'O orçamento não coube na resposta pedida.'
          )
        }
        tokensIn =
          data.usage?.input_tokens ||
          Math.ceil(
            (req.systemPrompt.length + req.userPrompt.length + (req.cacheableContext?.length ?? 0)) / 4
          )
        tokensOut = data.usage?.output_tokens || Math.ceil(content.length / 4)
        cacheWriteTokens = data.usage?.cache_creation_input_tokens || 0
        cacheReadTokens = data.usage?.cache_read_input_tokens || 0
      } else {
        const cleanApiKey = runtime.apiKey?.trim().replace(/^["']|["']$/g, '')

        // OpenAI-compatible SDK for Kimi, DeepSeek, Gemini
        const client = new OpenAI({
          apiKey: cleanApiKey,
          baseURL: runtime.baseURL,
          timeout: providerTimeoutMs,
          // O SDK usa maxRetries = 2 por padrão e aplica o timeout POR
          // tentativa, inclusive retentando em timeout. Sem esta linha um único
          // provedor consome 3 x o timeout e estoura o limite da função sozinho.
          maxRetries: 0,
        })

        const isReasoningModel = currentProviderId === 'kimi' || runtime.model?.includes('reasoner') || runtime.model?.includes('k3')

        // Os cinco segmentos da análise saem ao mesmo tempo. Quando o primário
        // falha, os cinco caem juntos para o suplente — e o Kimi limita a 3
        // requisições simultâneas por organização, devolvendo 429 com
        // "try again after 1 seconds". Sem esta espera, um fallback que era
        // perfeitamente viável é descartado por um limite de um segundo.
        //
        // Uma repetição só: se o segundo 429 vier, a concorrência não é
        // passageira e insistir apenas queima o orçamento de tempo.
        const createCompletion = async (attempt = 1): Promise<any> => {
          try {
            return await client.chat.completions.create(buildCompletionParams())
          } catch (e: any) {
            const status = e?.status ?? e?.response?.status
            if (status === 429 && attempt === 1) {
              await new Promise((r) => setTimeout(r, 1200))
              return createCompletion(2)
            }
            throw e
          }
        }

        const buildCompletionParams = () => ({
          model: runtime.model,
          messages: [
            {
              role: 'system' as const,
              // O contexto comum vai primeiro: estes provedores cacheiam por
              // prefixo automaticamente, e o prefixo só casa se o trecho
              // compartilhado abrir a mensagem e vier byte a byte igual.
              content: req.cacheableContext
                ? `${req.cacheableContext}\n\n${req.systemPrompt}`
                : req.systemPrompt,
            },
            { role: 'user' as const, content: req.userPrompt },
          ],
          temperature: isReasoningModel ? 1 : (req.temperature ?? 0.3),
          max_tokens: req.maxTokens ?? 3500,
          // Estes provedores não aceitam JSON Schema; `json_object` garante
          // apenas que a saída é JSON válido. A conformidade com o formato é
          // verificada pelo chamador.
          ...(req.jsonSchema ? { response_format: { type: 'json_object' as const } } : {}),
        })

        const completion = await createCompletion()

        const msg = completion.choices?.[0]?.message
        content = msg?.content || (msg as any)?.reasoning_content || ''
        tokensIn =
          completion.usage?.prompt_tokens ||
          Math.ceil(
            (req.systemPrompt.length + req.userPrompt.length + (req.cacheableContext?.length ?? 0)) / 4
          )
        // O cache destes provedores é automático e o desconto já vem aplicado
        // na fatura; a API reporta o acerto apenas para conferência. Somar aqui
        // cobraria de novo o que `prompt_tokens` já contou.
        cacheReadTokens = 0
        tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)
      }

      const responseTimeMs = Date.now() - startCallTime

      if (!content) {
        throw new Error(`Resposta vazia recebida do provedor ${currentProviderId}`)
      }

      // Quality Agent Check (Fase 2)
      const qualityResult = auditQualityOfAiResult(req.taskType, content)
      if (!qualityResult.approved) {
        attemptDiagnostics.push(`${currentProviderId.toUpperCase()} (Reprovado no Agente de Qualidade): ${qualityResult.feedback}`)
        throw new Error(`Qualidade insuficiente (${qualityResult.feedback})`)
      }

      // Gravar o cache custa mais que a entrada normal; lê-lo custa uma fração.
      // Cobrar os dois ao preço cheio esconderia exatamente o efeito que o
      // cache existe para produzir, e o painel administrativo mostraria a
      // análise segmentada como mais cara do que ela é.
      const costIn =
        (tokensIn / 1000) * runtime.pricing.inputPer1k +
        (cacheWriteTokens / 1000) * runtime.pricing.inputPer1k * CACHE_WRITE_MULTIPLIER +
        (cacheReadTokens / 1000) * runtime.pricing.inputPer1k * CACHE_READ_MULTIPLIER
      const costOut = (tokensOut / 1000) * runtime.pricing.outputPer1k
      const costUsd = costIn + costOut

      // O volume registrado inclui o que passou pelo cache: são tokens que o
      // modelo de fato leu, e omiti-los faria o painel subestimar o uso.
      const totalTokensIn = tokensIn + cacheWriteTokens + cacheReadTokens

      const status = failoverCount > 0 ? 'failover' : 'success'

      // Log telemetry in background
      try {
        const aiLog = await db.aiLog.create({
          data: {
            userId: req.userId || null,
            taskType: req.taskType,
            primaryModel: primaryRuntime.model,
            usedModel: runtime.model,
            provider: currentProviderId,
            tokensIn: totalTokensIn,
            tokensOut,
            costUsd,
            responseTimeMs,
            status,
            failoverCount,
          },
          select: { id: true },
        })

        // Juiz de qualidade por amostragem: roda DEPOIS da resposta, via
        // `after()`, então não entra no orçamento de 60s da requisição.
        // Chamadas internas não são julgadas — julgar um julgamento não teria
        // fim. Ver agents/quality-judge.ts.
        if (!req.internal && shouldJudge(req.taskType)) {
          try {
            after(() =>
              judgeAiResult({
                aiLogId: aiLog.id,
                taskType: req.taskType,
                content,
                sourceExcerpt: req.userPrompt,
              })
            )
          } catch (afterErr) {
            // `after()` exige contexto de requisição. Se este roteador for
            // chamado de fora de uma rota, o julgamento simplesmente não ocorre.
            console.warn('[AI Router] Julgamento de qualidade não agendado:', afterErr)
          }
        }

        if (failoverCount > 0) {
          await db.auditLog.create({
            data: {
              userId: req.userId || null,
              resumeId: req.resumeId || null,
              action: 'failover',
              meta: JSON.stringify({
                taskType: req.taskType,
                primaryProvider: primaryProviderId,
                usedProvider: currentProviderId,
                attemptDiagnostics,
              }),
            },
          })
        }
      } catch (logErr) {
        console.error('Failed to log AI execution:', logErr)
      }

      return {
        content: content.trim(),
        usedProvider: currentProviderId,
        usedModel: runtime.model,
        primaryModel: primaryRuntime.model,
        tokensIn: totalTokensIn,
        tokensOut,
        costUsd,
        responseTimeMs,
        status,
        failoverCount,
      }
    } catch (err: any) {
      lastError = err
      failoverCount++
      const diagStr = `${currentProviderId.toUpperCase()}: ${err?.status || err?.code || 'ERR'} (${err?.message || 'Falha'})`
      attemptDiagnostics.push(diagStr)
      console.warn(
        `[AI Router] Provedor '${currentProviderId}' falhou: ${diagStr}. Tentando próximo na fila...`
      )
    }
  }

  // If all attempts failed, record operational failure log in DB for analysis and throw clean user-safe error
  const diagSummary = attemptDiagnostics.join(' | ')
  const detailedError = `Falha ao processar com as IAs ativas. Diagnóstico por provedor: [${diagSummary}]`
  const totalLatencyMs = Date.now() - taskStartTime

  try {
    await db.aiLog.create({
      data: {
        userId: req.userId || null,
        taskType: req.taskType,
        primaryModel: primaryRuntime.model,
        usedModel: 'ALL_PROVIDERS_FAILED',
        provider: primaryProviderId,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        responseTimeMs: totalLatencyMs,
        status: 'error',
        failoverCount,
        errorMessage: diagSummary,
      },
    })

    await db.auditLog.create({
      data: {
        userId: req.userId || null,
        resumeId: req.resumeId || null,
        action: 'ai_error',
        meta: JSON.stringify({
          taskType: req.taskType,
          primaryProvider: primaryProviderId,
          attemptDiagnostics,
          summary: diagSummary,
        }),
      },
    })
  } catch (logErr) {
    console.error('Failed to log operational AI error:', logErr)
  }

  console.error('[AI Router Error] Operational failure across all providers:', detailedError)

  const userSafeError: any = new Error('Falha ao processar com as IAs ativas.')
  userSafeError.diagnostic = detailedError
  userSafeError.attemptDiagnostics = attemptDiagnostics
  throw userSafeError
}
