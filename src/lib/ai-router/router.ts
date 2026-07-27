import OpenAI from 'openai'
import { db } from '../db'
import { AiTaskRequest, AiTaskResult, ProviderId } from './types'
import {
  FALLBACK_CHAIN,
  getProviderRuntimeConfig,
  INITIAL_TASK_ROUTING,
  normalizeProviderId,
} from './registry'

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResult> {
  // Determine primary provider for task
  const primaryProviderId = INITIAL_TASK_ROUTING[req.taskType] || 'kimi'
  const primaryRuntime = await getProviderRuntimeConfig(primaryProviderId)

  // 1. Collect all candidate providers to try
  const candidateProviders: ProviderId[] = [
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
      if (pId && !candidateProviders.includes(pId)) {
        candidateProviders.push(pId)
      }
    }
  } catch (e) {
    // Ignore
  }

  let lastError: any = null
  let failoverCount = 0

  for (let i = 0; i < candidateProviders.length; i++) {
    const currentProviderId = candidateProviders[i]
    const runtime = await getProviderRuntimeConfig(currentProviderId)

    // Skip provider if no API key is available
    if (!runtime.apiKey) {
      continue
    }

    const startCallTime = Date.now()
    try {
      const client = new OpenAI({
        apiKey: runtime.apiKey,
        baseURL: runtime.baseURL,
        timeout: 25000, // 25s timeout per call
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
      
      if (!content) {
        throw new Error(`Resposta vazia recebida do provedor ${currentProviderId}`)
      }

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
      failoverCount++
      console.warn(
        `[AI Router] Provedor '${currentProviderId}' falhou (${err?.status || err?.message || 'Error'}). Tentando próximo provedor na fila de contingência...`
      )
    }
  }

  // If all attempts failed, throw descriptive error
  let errorMsg = lastError?.message || 'Falha ao conectar com os serviços de Inteligência Artificial.'
  if (lastError?.status === 401 || lastError?.message?.includes('Invalid Authentication')) {
    errorMsg = 'Chave de API de IA inválida ou expirada (Erro 401). Por favor, verifique as chaves cadastradas na Área Admin.'
  } else if (lastError?.status === 404 || lastError?.message?.includes('404')) {
    errorMsg = 'Endereço ou Modelo de IA não encontrado (Erro 404). Por favor, verifique o modelo e chave no Painel Admin.'
  } else if (!lastError) {
    errorMsg = 'Nenhuma chave de API de IA ativa encontrada no sistema. Cadastre uma chave em Área Admin > Chaves de IA.'
  }

  throw new Error(errorMsg)
}
