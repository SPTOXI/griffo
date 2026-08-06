// Quick diagnostic test for Gemini API
import OpenAI from 'openai'
import { getProviderRuntimeConfig } from './src/lib/ai-router/registry'

async function testGemini() {
  console.log('=== GEMINI DIAGNOSTIC TEST ===\n')

  try {
    const config = await getProviderRuntimeConfig('gemini')
    console.log('Config resolved:')
    console.log('  baseURL:', config.baseURL)
    console.log('  model:', config.model)
    console.log('  apiKey:', config.apiKey ? `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}` : '(EMPTY)')
    console.log('')

    if (!config.apiKey) {
      console.error('❌ API key is EMPTY. Cannot test.')
      process.exit(1)
    }

    // Test 1: Direct fetch to verify endpoint
    console.log('--- Test 1: Direct fetch ---')
    const directUrl = `${config.baseURL.replace(/\/+$/, '')}/chat/completions`
    console.log('  URL:', directUrl)
    
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Reply: OK' }],
        max_tokens: 5,
      }),
    })
    
    const directData = await directRes.json()
    console.log('  HTTP Status:', directRes.status)
    console.log('  Response:', JSON.stringify(directData, null, 2).slice(0, 500))
    console.log('')

    // Test 2: Via OpenAI SDK (same as production code)
    console.log('--- Test 2: OpenAI SDK ---')
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: 10000,
    })

    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'Reply: OK' }],
      max_tokens: 5,
    })
    console.log('  ✅ Success!')
    console.log('  Response:', completion.choices?.[0]?.message?.content)
    
  } catch (err: any) {
    console.error('  ❌ Error:', err?.status || err?.code, err?.message)
    if (err?.error) console.error('  Error body:', JSON.stringify(err.error, null, 2))
  }
}

testGemini()
