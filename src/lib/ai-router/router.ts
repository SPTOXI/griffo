import OpenAI from 'openai'
import { db } from '../db'
import { AiTaskRequest, AiTaskResult, ProviderId } from './types'
import {
  FALLBACK_CHAIN,
  getProviderRuntimeConfig,
  INITIAL_TASK_ROUTING,
  normalizeProviderId,
} from './registry'
import { auditQualityOfAiResult } from '../agents/quality-agent'

// As rotas que chamam este roteador declaram maxDuration = 60. Se o orçamento
// for consumido inteiro pelas tentativas de IA, a plataforma encerra a função
// antes do `catch` que devolve os créditos ao usuário — que então paga sem
// receber. Os três limites abaixo existem para garantir que sempre sobre tempo
// para o reembolso e a persistência.
const PROVIDER_TIMEOUT_MS = 20_000
const MAX_PROVIDER_ATTEMPTS = 2
// Corta novas tentativas a partir daqui, deixando ~15s para reembolso,
// gravação no banco e a resposta HTTP.
const TASK_DEADLINE_MS = 45_000

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResult> {
  const taskStartTime = Date.now()
  // Determine primary provider for task
  const primaryProviderId = INITIAL_TASK_ROUTING[req.taskType] || 'kimi'
  const primaryRuntime = await getProviderRuntimeConfig(primaryProviderId)

  // 1. Collect all candidate providers to try
  const allCandidates: ProviderId[] = [
    primaryProviderId,
    ...FALLBACK_CHAIN[primaryProviderId].filter((id) => id !== primaryProviderId),
  ]

  // 2. Also check if there are any active keys registered in AiApiKey table for OTHER providers
  try {
    const activeDbKeys = await db.aiApiKey.findMany({
      where: { status: 'active' },
      select: { provider: true },
    })
    for (const keyObj of activeDbKeys) {
      const pId = normalizeProviderId(keyObj.provider)
      if (pId && !allCandidates.includes(pId)) {
        allCandidates.push(pId)
      }
    }
  } catch (e) {
    // Ignore
  }

  // Só as duas primeiras tentativas cabem no orçamento: 2 x 20s deixa 20s de
  // folga. A cadeia completa de 4 provedores levaria mais de 60s sozinha.
  const candidateProviders = allCandidates.slice(0, MAX_PROVIDER_ATTEMPTS)

  let lastError: any = null
  let failoverCount = 0
  const attemptDiagnostics: string[] = []

  for (let i = 0; i < candidateProviders.length; i++) {
    const currentProviderId = candidateProviders[i]

    // Não inicia uma tentativa que não caberia no orçamento restante — é o que
    // garante que o `catch` da rota chegue a executar e devolva os créditos.
    const elapsed = Date.now() - taskStartTime
    if (elapsed + PROVIDER_TIMEOUT_MS > TASK_DEADLINE_MS) {
      attemptDiagnostics.push(
        `${currentProviderId.toUpperCase()}: Ignorado — orçamento de tempo esgotado (${elapsed}ms decorridos)`
      )
      break
    }

    const runtime = await getProviderRuntimeConfig(currentProviderId)

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

      if (currentProviderId === 'claude') {
        // Native Anthropic Messages API integration
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': runtime.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: runtime.model || 'claude-sonnet-5',
            max_tokens: req.maxTokens ?? 3500,
            system: req.systemPrompt,
            messages: [{ role: 'user', content: req.userPrompt }],
            // Structured outputs: a API restringe a geração ao schema, então a
            // resposta é sempre JSON válido no formato pedido. Elimina a classe
            // inteira de "falha de parse" que antes era mascarada com dados
            // fabricados.
            ...(req.jsonSchema
              ? { output_config: { format: { type: 'json_schema', schema: req.jsonSchema } } }
              : {}),
          }),
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        })

        const data = await res.json()

        if (!res.ok) {
          const status = res.status
          const errMsg = data.error?.message || data.message || JSON.stringify(data)
          throw new Error(`[Claude API ${status}] ${errMsg}`)
        }

        content = data.content?.[0]?.text || ''
        tokensIn = data.usage?.input_tokens || Math.ceil((req.systemPrompt.length + req.userPrompt.length) / 4)
        tokensOut = data.usage?.output_tokens || Math.ceil(content.length / 4)
      } else {
        const cleanApiKey = runtime.apiKey?.trim().replace(/^["']|["']$/g, '')

        // OpenAI-compatible SDK for Kimi, DeepSeek, Gemini
        const client = new OpenAI({
          apiKey: cleanApiKey,
          baseURL: runtime.baseURL,
          timeout: PROVIDER_TIMEOUT_MS,
          // O SDK usa maxRetries = 2 por padrão e aplica o timeout POR
          // tentativa, inclusive retentando em timeout. Sem esta linha um único
          // provedor consome 3 x o timeout e estoura o limite da função sozinho.
          maxRetries: 0,
        })

        const isReasoningModel = currentProviderId === 'kimi' || runtime.model?.includes('reasoner') || runtime.model?.includes('k3')

        const completion = await client.chat.completions.create({
          model: runtime.model,
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
          temperature: isReasoningModel ? 1 : (req.temperature ?? 0.3),
          max_tokens: req.maxTokens ?? 3500,
          // Estes provedores não aceitam JSON Schema; `json_object` garante
          // apenas que a saída é JSON válido. A conformidade com o formato é
          // verificada pelo chamador.
          ...(req.jsonSchema ? { response_format: { type: 'json_object' as const } } : {}),
        })

        const msg = completion.choices?.[0]?.message
        content = msg?.content || (msg as any)?.reasoning_content || ''
        tokensIn =
          completion.usage?.prompt_tokens ||
          Math.ceil((req.systemPrompt.length + req.userPrompt.length) / 4)
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

      const costIn = (tokensIn / 1000) * runtime.pricing.inputPer1k
      const costOut = (tokensOut / 1000) * runtime.pricing.outputPer1k
      const costUsd = costIn + costOut

      const status = failoverCount > 0 ? 'failover' : 'success'

      // Log telemetry in background
      try {
        await db.aiLog.create({
          data: {
            userId: req.userId || null,
            taskType: req.taskType,
            primaryModel: primaryRuntime.model,
            usedModel: runtime.model,
            provider: currentProviderId,
            tokensIn,
            tokensOut,
            costUsd,
            responseTimeMs,
            status,
            failoverCount,
          },
        })

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
        tokensIn,
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
