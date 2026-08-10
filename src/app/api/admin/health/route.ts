import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PROVIDER_CONFIGS, getProviderRuntimeConfig } from '@/lib/ai-router/registry'
import type { ProviderId } from '@/lib/ai-router/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const healthStatus: any = {
      timestamp: new Date().toISOString(),
      components: {
        database: { status: 'unknown', latencyMs: 0, error: null },
        env: { status: 'unknown', missingKeys: [] },
        incidents: { status: 'unknown', activeCount: 0, recentAiErrors: 0 },
        aiProviders: { status: 'unknown', activeKeys: 0, message: '' }
      }
    }

    // 1. Database Ping
    try {
      const dbStart = Date.now()
      await db.$queryRaw`SELECT 1`
      const dbLatency = Date.now() - dbStart
      healthStatus.components.database.latencyMs = dbLatency
      healthStatus.components.database.status = dbLatency > 500 ? 'degraded' : 'healthy'
    } catch (e: any) {
      healthStatus.components.database.status = 'error'
      healthStatus.components.database.error = e.message || 'Falha na conexão'
    }

    // 2. Critical Environment Variables
    //
    // A lista conferida aqui precisa ser a das variáveis que o código realmente
    // lê. A anterior exigia `JWT_SECRET`, que não é lido em lugar nenhum — um
    // alarme vermelho permanente por uma variável inexistente — e não conferia
    // `SESSION_SECRET` nem `ENCRYPTION_KEY`, cuja ausência derruba o login e a
    // decifragem das chaves de IA. O monitor acendia pelo motivo errado e ficava
    // verde pelos certos.
    const missingKeys: string[] = []

    // `getDatabaseUrl` aceita qualquer uma das duas: exigir só a primeira
    // acusaria falta num ambiente perfeitamente configurado.
    if (!process.env.POSTGRES_PRISMA_URL?.trim() && !process.env.DATABASE_URL?.trim()) {
      missingKeys.push('POSTGRES_PRISMA_URL')
    }
    for (const key of ['SESSION_SECRET', 'ENCRYPTION_KEY']) {
      if (!process.env[key]?.trim()) missingKeys.push(key)
    }

    healthStatus.components.env.missingKeys = missingKeys
    healthStatus.components.env.status = missingKeys.length > 0 ? 'error' : 'healthy'

    // 3. Incidents and AI Logs
    try {
      const activeIncidents = await db.systemIncident.count({
        where: {
          status: { in: ['investigating', 'action_required'] }
        }
      })
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentAiErrors = await db.aiLog.count({
        where: {
          status: 'error',
          createdAt: { gte: yesterday }
        }
      })
      healthStatus.components.incidents.activeCount = activeIncidents
      healthStatus.components.incidents.recentAiErrors = recentAiErrors
      
      if (activeIncidents > 0 || recentAiErrors > 10) {
        healthStatus.components.incidents.status = 'degraded'
      } else {
        healthStatus.components.incidents.status = 'healthy'
      }
    } catch {
      healthStatus.components.incidents.status = 'unknown'
    }

    // 4. AI Providers Check
    //
    // Contar linhas em `AiApiKey` não diz nada sobre o roteador conseguir usar
    // aquelas chaves. Uma chave cadastrada que não decifra — `ENCRYPTION_KEY`
    // ausente ou trocada — some silenciosamente: `tryDecryptSecret` devolve
    // nulo, o roteador cai para a variável de ambiente, não acha nada, e pula o
    // provedor com "Sem chave de API". O painel, contando linhas, seguia
    // anunciando "4 provedores disponíveis para failover" enquanto nenhuma
    // chamada saía — e o custo de IA em $0,00 era o único sinal de que nada
    // chegava ao modelo.
    //
    // Agora a conta é de provedores cuja credencial de fato se resolve.
    try {
      const rows = await db.aiApiKey.count({ where: { status: 'active' } })

      const resolved: string[] = []
      const unusable: string[] = []
      for (const providerId of Object.keys(PROVIDER_CONFIGS) as ProviderId[]) {
        const runtime = await getProviderRuntimeConfig(providerId)
        if (runtime.apiKey) resolved.push(providerId)
        else unusable.push(providerId)
      }

      healthStatus.components.aiProviders.activeKeys = resolved.length
      healthStatus.components.aiProviders.registeredRows = rows
      healthStatus.components.aiProviders.unusable = unusable

      if (resolved.length === 0) {
        healthStatus.components.aiProviders.status = 'error'
        healthStatus.components.aiProviders.message =
          rows > 0
            ? `${rows} chave(s) cadastrada(s), mas nenhuma utilizável — verifique ENCRYPTION_KEY.`
            : 'Nenhuma chave de IA ativa configurada.'
      } else if (unusable.length > 0) {
        healthStatus.components.aiProviders.status = 'degraded'
        healthStatus.components.aiProviders.message = `${resolved.length} provedor(es) utilizável(is). Sem credencial: ${unusable.join(', ')}.`
      } else {
        healthStatus.components.aiProviders.status = 'healthy'
        healthStatus.components.aiProviders.message = `${resolved.length} provedores disponíveis para failover.`
      }
    } catch {
      healthStatus.components.aiProviders.status = 'unknown'
    }

    // Overall Status
    const statuses = Object.values(healthStatus.components).map((c: any) => c.status)
    if (statuses.includes('error')) healthStatus.overall = 'error'
    else if (statuses.includes('degraded')) healthStatus.overall = 'degraded'
    else healthStatus.overall = 'healthy'

    return NextResponse.json(healthStatus)
  } catch (e: any) {
    console.error('Health check error:', e)
    return NextResponse.json({ error: 'Erro ao executar diagnóstico do sistema.' }, { status: 500 })
  }
}
