import 'server-only'
import { db } from '@/lib/db'
import { edgeCountry } from '@/lib/pricing/edge-country'
import type { ServerEvent } from './funnel'

/**
 * Grava um evento do funil a partir do servidor.
 *
 * Nunca lança: telemetria que derruba cadastro ou compra é pior que telemetria
 * perdida. O país vem da borda (ou do que o chamador já sabe), nunca do corpo
 * da requisição.
 */
export async function trackServerEvent(
  event: ServerEvent,
  opts: {
    req?: Request
    userId?: string | null
    visitorId?: string | null
    sku?: string | null
    meta?: Record<string, string | number | boolean | null>
  } = {}
): Promise<void> {
  try {
    const country = (opts.req ? edgeCountry(opts.req) : null) || opts.meta?.country || null
    await db.analyticsEvent.create({
      data: {
        event,
        userId: opts.userId || null,
        visitorId: opts.visitorId ? String(opts.visitorId).slice(0, 100) : null,
        sku: opts.sku || null,
        meta: JSON.stringify({ ...(opts.meta || {}), ...(country ? { country } : {}) }),
      },
    })
  } catch {
    // silencioso de propósito
  }
}
