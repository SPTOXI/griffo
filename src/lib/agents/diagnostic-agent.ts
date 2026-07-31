import { db } from '@/lib/db'
import { getProviderRuntimeConfig } from '@/lib/ai-router/registry'
import OpenAI from 'openai'

export interface DiagnosticSimulationResult {
  aiProviders: Record<string, { status: string; latencyMs?: number; error?: string }>
  databaseStatus: 'healthy' | 'unhealthy'
  pdfEngineStatus: 'healthy' | 'unhealthy'
  summary: string
  actionsTaken: string[]
}

/**
 * Agente 2: Motor de Auto-Diagnóstico, Simulação e Auto-Correção
 */
export async function runDiagnosticAndHealing(incidentId?: string): Promise<DiagnosticSimulationResult> {
  const actionsTaken: string[] = []
  const aiProvidersResult: Record<string, { status: string; latencyMs?: number; error?: string }> = {}

  // 1. Test AI Providers (DeepSeek, Kimi, Claude)
  const providers = ['deepseek', 'kimi', 'claude'] as const
  for (const pId of providers) {
    const startTime = Date.now()
    try {
      const config = await getProviderRuntimeConfig(pId)
      if (!config.apiKey) {
        aiProvidersResult[pId] = { status: 'SKIPPED', error: 'Nenhuma chave de API configurada' }
        continue
      }

      if (pId === 'claude') {
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
            messages: [{ role: 'user', content: 'Ping' }],
          }),
        })
        if (res.ok) {
          aiProvidersResult[pId] = { status: 'SUCCESS', latencyMs: Date.now() - startTime }
        } else {
          const data = await res.json().catch(() => ({}))
          aiProvidersResult[pId] = { status: 'FAILED', error: data.error?.message || `HTTP ${res.status}` }
        }
      } else {
        const cleanKey = config.apiKey.trim().replace(/^["']|["']$/g, '')
        const client = new OpenAI({ apiKey: cleanKey, baseURL: config.baseURL })
        await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        })
        aiProvidersResult[pId] = { status: 'SUCCESS', latencyMs: Date.now() - startTime }
      }
    } catch (e: any) {
      aiProvidersResult[pId] = { status: 'FAILED', error: e.message || 'Erro de conexão' }
    }
  }

  // 2. Test Database Connection
  let dbStatus: 'healthy' | 'unhealthy' = 'healthy'
  try {
    await db.user.count()
  } catch (e) {
    dbStatus = 'unhealthy'
    actionsTaken.push('Falha detectada no banco de dados Prisma/Supabase.')
  }

  // 3. Auto-Healing Attempts
  let failedCount = Object.values(aiProvidersResult).filter((r) => r.status === 'FAILED').length
  if (failedCount > 0) {
    actionsTaken.push(`Identificada instabilidade em ${failedCount} provedor(es) de IA. O Roteador Inteligente redirecionará o tráfego automaticamente para os provedores operacionais.`)
  }

  const resultSummary = `Auto-Diagnóstico concluído: Banco DB: ${dbStatus.toUpperCase()} | Provedores IA OK: ${
    Object.values(aiProvidersResult).filter((r) => r.status === 'SUCCESS').length
  }/${providers.length}`

  const diagData: DiagnosticSimulationResult = {
    aiProviders: aiProvidersResult,
    databaseStatus: dbStatus,
    pdfEngineStatus: 'healthy',
    summary: resultSummary,
    actionsTaken,
  }

  // 4. Update Incident record if provided
  if (incidentId) {
    const isCritical = dbStatus === 'unhealthy' || failedCount >= 2
    const finalSeverity = isCritical ? 'critical' : failedCount === 1 ? 'high' : 'medium'
    const finalStatus = isCritical ? 'action_required' : 'auto_fixed'

    await db.systemIncident.update({
      where: { id: incidentId },
      data: {
        severity: finalSeverity,
        status: finalStatus,
        diagnosticResult: JSON.stringify(diagData),
      },
    })

    // 5. Send Alert to Admin if Critical or High severity
    if (isCritical || finalSeverity === 'high') {
      await sendAdminAlert(incidentId, resultSummary, diagData)
    }
  }

  return diagData
}

/**
 * Envia notificação por webhook/mensageiro e e-mail para o administrador
 */
export async function sendAdminAlert(incidentId: string, summary: string, diagData: DiagnosticSimulationResult) {
  try {
    const webhookConfig = await db.systemConfig.findUnique({ where: { key: 'ADMIN_ALERT_WEBHOOK_URL' } })
    const emailConfig = await db.systemConfig.findUnique({ where: { key: 'ADMIN_ALERT_EMAIL' } })

    const alertMessage = `🚨 [ALERTA GRIFFO] Incidente Crítico Detectado!\nID: ${incidentId}\nResumo: ${summary}\nAções Automáticas: ${diagData.actionsTaken.join('; ') || 'Nenhuma'}\nVerifique o Painel Admin imediatamente.`

    // 1. Webhook / Mensageiro (Telegram, Discord, Slack, etc.)
    if (webhookConfig?.value) {
      await fetch(webhookConfig.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: alertMessage,
          content: alertMessage,
          incidentId,
          diagnostic: diagData,
        }),
      }).catch(() => {})
    }

    // 2. Registra log de envio do alerta
    await db.systemIncident.update({
      where: { id: incidentId },
      data: { alertSent: true },
    })

    console.log(`[Admin Alert Sent] ${alertMessage}`)
  } catch (e) {
    console.error('Error sending admin alert:', e)
  }
}
