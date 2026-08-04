import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAdminUser } from '@/lib/admin'
import { getProviderRuntimeConfig } from '@/lib/ai-router/registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const providers = ['kimi', 'deepseek', 'claude'] as const
  const results: Record<string, any> = {}

  for (const pId of providers) {
    const config = await getProviderRuntimeConfig(pId)
    const startTime = Date.now()

    if (!config.apiKey) {
      results[pId] = { status: 'SKIPPED', reason: 'No API key configured' }
      continue
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
          results[pId] = {
            status: 'SUCCESS',
            latencyMs: Date.now() - startTime,
            response: data.content?.[0]?.text || 'OK',
            model: config.model,
          }
        } else {
          const errMsg = data.error?.message || data.message || JSON.stringify(data)
          results[pId] = {
            status: 'FAILED',
            httpCode: res.status,
            errorMessage: errMsg,
            model: config.model,
          }
        }
      } else {
        const cleanApiKey = config.apiKey?.trim().replace(/^["']|["']$/g, '')
        // OpenAI-compatible SDK call test
        const client = new OpenAI({
          apiKey: cleanApiKey,
          baseURL: config.baseURL,
          timeout: 10000,
        })
        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Responder: OK' }],
          max_tokens: 300,
        })
        const testMsg = completion.choices?.[0]?.message
        const textResp = testMsg?.content || (testMsg as any)?.reasoning_content || 'OK'
        results[pId] = {
          status: 'SUCCESS',
          latencyMs: Date.now() - startTime,
          response: textResp,
          model: config.model,
        }
      }
    } catch (err: any) {
      const detailedErr = err?.error?.message || err?.error?.code || err?.message || JSON.stringify(err)
      results[pId] = {
        status: 'FAILED',
        httpCode: err?.status || err?.code || 500,
        errorMessage: detailedErr,
        model: config.model,
        baseURL: config.baseURL,
      }
    }
  }

  return NextResponse.json({ results })
}
