import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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
    const criticalKeys = [
      'POSTGRES_PRISMA_URL',
      'JWT_SECRET',
    ]
    const missingKeys = criticalKeys.filter(k => !process.env[k])
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
    try {
      const activeKeys = await db.aiApiKey.count({
        where: { status: 'active' }
      })
      healthStatus.components.aiProviders.activeKeys = activeKeys
      if (activeKeys === 0) {
        healthStatus.components.aiProviders.status = 'error'
        healthStatus.components.aiProviders.message = 'Nenhuma chave de IA ativa configurada.'
      } else {
        healthStatus.components.aiProviders.status = 'healthy'
        healthStatus.components.aiProviders.message = `${activeKeys} provedores disponíveis para failover.`
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
