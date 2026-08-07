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

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResult> {
  const taskStartTime = Date.now()
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
  const attemptDiagnostics: string[] = []

  for (let i = 0; i < candidateProviders.length; i++) {
    const currentProviderId = candidateProviders[i]
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
            model: runtime.model || 'claude-opus-5',
            max_tokens: req.maxTokens ?? 3500,
            system: req.systemPrompt,
            messages: [{ role: 'user', content: req.userPrompt }],
          }),
          signal: AbortSignal.timeout(55000),
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
        if (currentProviderId === 'kimi') {
          console.log('[KIMI DEBUG] baseURL:', runtime.baseURL)
          console.log('[KIMI DEBUG] model:', runtime.model)
          console.log('[KIMI DEBUG] key prefix:', runtime.apiKey?.slice(0, 15) + '...')
          console.log('[KIMI DEBUG] key length:', runtime.apiKey?.length)
        }

        const cleanApiKey = runtime.apiKey?.trim().replace(/^["']|["']$/g, '')

        // OpenAI-compatible SDK for Kimi, DeepSeek, Gemini
        const client = new OpenAI({
          apiKey: cleanApiKey,
          baseURL: runtime.baseURL,
          timeout: 55000, // 55s timeout per call
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
