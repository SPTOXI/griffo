export const maxDuration = 60

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAdminUser } from '@/lib/admin'
import { getProviderRuntimeConfig } from '@/lib/ai-router/registry'

export const dynamic = 'force-dynamic'

/**
 * Prazo por provedor no diagnóstico.
 *
 * Era 10s, sequencial — abaixo do próprio piso que o roteador de produção usa
 * (`MIN_PROVIDER_TIMEOUT_MS = 12_000` em `ai-router/router.ts`, "abaixo disto
 * uma tentativa não tem chance real de terminar"). Isso fazia o Kimi ser
 * reportado como falho quando só estava mais lento que 10s — descoberto em
 * 26/08/2026 ao investigar "erro geral" que na verdade eram três causas
 * diferentes (Kimi lento, Gemini com modelo aposentado, OpenAI com o
 * parâmetro errado — ver 2.39 na auditoria).
 */
const TEST_TIMEOUT_MS = 15_000

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const providers = ['kimi', 'deepseek', 'claude', 'gemini', 'openai'] as const

  // Em paralelo, não em sequência: eram 5 testes de até 10s cada rodando um
  // depois do outro, quase estourando o `maxDuration` de 60s sozinhos. Em
  // paralelo o tempo total é o do mais lento, não a soma — o que também é o
  // que sobrou de orçamento para subir `TEST_TIMEOUT_MS` sem risco de
  // encerramento pela plataforma.
  const entries = await Promise.all(
    providers.map(async (pId) => {
      const config = await getProviderRuntimeConfig(pId)
      const startTime = Date.now()

      if (!config.apiKey) {
        return [pId, { status: 'SKIPPED', reason: 'No API key configured' }] as const
      }

      try {
        if (pId === 'claude') {
          // Native Anthropic API call test
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: config.model || 'claude-sonnet-5',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Responder: OK' }],
            }),
          })
          const data = await res.json()
          if (res.ok) {
            return [
              pId,
              {
                status: 'SUCCESS',
                latencyMs: Date.now() - startTime,
                response: data.content?.[0]?.text || 'OK',
                model: config.model,
              },
            ] as const
          }
          const errMsg = data.error?.message || data.message || JSON.stringify(data)
          return [
            pId,
            { status: 'FAILED', httpCode: res.status, errorMessage: errMsg, model: config.model },
          ] as const
        }

        const cleanApiKey = config.apiKey?.trim().replace(/^["']|["']$/g, '')
        // OpenAI-compatible SDK call test
        const client = new OpenAI({
          apiKey: cleanApiKey,
          baseURL: config.baseURL,
          timeout: TEST_TIMEOUT_MS,
        })
        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Responder: OK' }],
          // A OpenAI recusa `max_tokens` nos modelos correntes — mesma causa
          // e mesma correção do roteador de produção (`ai-router/router.ts`,
          // ver 2.38 na auditoria). Esta rota tinha uma cópia própria da
          // chamada que ficou pra trás quando aquela foi corrigida.
          ...(pId === 'openai' ? { max_completion_tokens: 300 } : { max_tokens: 300 }),
        })
        const testMsg = completion.choices?.[0]?.message
        const textResp = testMsg?.content || (testMsg as any)?.reasoning_content || 'OK'
        return [
          pId,
          { status: 'SUCCESS', latencyMs: Date.now() - startTime, response: textResp, model: config.model },
        ] as const
      } catch (err: any) {
        const detailedErr = err?.error?.message || err?.error?.code || err?.message || JSON.stringify(err)
        return [
          pId,
          {
            status: 'FAILED',
            httpCode: err?.status || err?.code || 500,
            errorMessage: detailedErr,
            model: config.model,
            baseURL: config.baseURL,
          },
        ] as const
      }
    })
  )

  return NextResponse.json({ results: Object.fromEntries(entries) })
}
