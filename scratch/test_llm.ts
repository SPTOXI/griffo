import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.MOONSHOT_API_KEY || ''

const providers = [
  { name: 'Moonshot AI (.ai)', baseURL: 'https://api.moonshot.ai/v1', model: 'kimi-k3' },
  { name: 'Moonshot AI (.cn)', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'DeepSeek', baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', model: 'moonshotai/kimi-k3' },
  { name: 'SiliconFlow', baseURL: 'https://api.siliconflow.cn/v1', model: 'Pro/moonshotai/Kimi-K3' },
  { name: 'Groq', baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'Together', baseURL: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3-70b-chat-hf' },
  { name: 'DashScope (Alibaba)', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
]

async function run() {
  for (const p of providers) {
    const client = new OpenAI({ apiKey, baseURL: p.baseURL })
    try {
      const res = await client.chat.completions.create({
        model: p.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      })
      console.log(`✅ SUCCESS on ${p.name} (${p.baseURL})! Response:`, res.choices[0]?.message?.content)
    } catch (err: any) {
      console.log(`❌ Failed on ${p.name}: ${err.status || err.code} - ${err.message}`)
    }
  }
}

run()
