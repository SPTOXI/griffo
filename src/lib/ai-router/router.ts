import OpenAI from 'openai'
import { db } from '../db'
import { AiTaskRequest, AiTaskResult, ProviderId } from './types'
import {
  FALLBACK_CHAIN,
  getProviderRuntimeConfig,
  INITIAL_TASK_ROUTING,
} from './registry'

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResult> {
  // Determine primary provider for task
  const primaryProviderId = INITIAL_TASK_ROUTING[req.taskType] || 'kimi'
  const primaryRuntime = await getProviderRuntimeConfig(primaryProviderId)

  // Build sequence of providers to try (primary first, then fallback chain)
  const providerChain: ProviderId[] = [
    primaryProviderId,
    ...FALLBACK_CHAIN[primaryProviderId].filter((id) => id !== primaryProviderId),
  ]

  let lastError: any = null
  let failoverCount = 0

  for (let i = 0; i < providerChain.length; i++) {
    const currentProviderId = providerChain[i]
    const runtime = await getProviderRuntimeConfig(currentProviderId)

    // If no API key configured for this provider and it's not primary, skip
    if (!runtime.apiKey && currentProviderId !== primaryProviderId) {
      continue
    }

    const startCallTime = Date.now()
    try {
      const client = new OpenAI({
        apiKey: runtime.apiKey || (await getProviderRuntimeConfig('kimi')).apiKey,
        baseURL: runtime.baseURL,
        timeout: 20000, // 20s timeout per call
      })

      const completion = await client.chat.completions.create({
        model: runtime.model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userPrompt },
        ],
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 3500,
      })

      const responseTimeMs = Date.now() - startCallTime
      const content = completion.choices?.[0]?.message?.content || ''
      const tokensIn =
        completion.usage?.prompt_tokens ||
        Math.ceil((req.systemPrompt.length + req.userPrompt.length) / 4)
      const tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)

      const costIn = (tokensIn / 1000) * runtime.pricing.inputPer1k
      const costOut = (tokensOut / 1000) * runtime.pricing.outputPer1k
      const costUsd = costIn + costOut

      const status = failoverCount > 0 ? 'failover' : 'success'

      // Log telemetry in background
      try {
        await db.aiLog.create({
          data: {
            userId: req.userId || null,
            resumeId: req.resumeId || null,
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
                errorCode: lastError?.status || lastError?.code || '429/500/TIMEOUT',
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
      if (i < providerChain.length - 1) {
        failoverCount++
        console.warn(
          `[AI Router] Provider '${currentProviderId}' failed (${err?.status || err?.message || 'Error'}). Triggering failover to next provider...`
        )
      }
    }
  }

  // If all attempts failed, throw descriptive error
  const statusCode = lastError?.status || 502
  let errorMsg = lastError?.message || 'Falha ao conectar com os serviços de Inteligência Artificial.'
  if (lastError?.status === 401 || lastError?.message?.includes('Invalid Authentication')) {
    errorMsg = 'Chave de API inválida ou expirada (Erro 401). Por favor, atualize as credenciais no Painel Admin.'
  }
  throw new Error(errorMsg)
}
