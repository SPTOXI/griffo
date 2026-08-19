import 'server-only'
import { db } from '../db'
import { MONTHLY_QUOTA, periodKey, quotaAlertLevel, quotaDecision, type QuotaAlertLevel, type QuotaDecision } from './quota'

/**
 * Registra requisições feitas a um provedor.
 *
 * Chamado DEPOIS da coleta, com o total da rodada — e não a cada requisição.
 * Contar uma a uma seria uma escrita no banco por chamada de rede, dobrando o
 * custo da coleta para melhorar uma precisão que ninguém usa.
 *
 * Nunca lança: perder a contagem de uma rodada é ruim, derrubar a rodada por
 * causa dela é pior.
 */
export async function recordQuotaUsage(provider: string, requests: number): Promise<void> {
  if (!provider || !Number.isFinite(requests) || requests <= 0) return

  const period = periodKey()
  const limit = MONTHLY_QUOTA[provider] ?? null

  try {
    await db.apiQuotaUsage.upsert({
      where: { provider_period: { provider, period } },
      create: { provider, period, used: Math.round(requests), limit },
      // `increment` e não leitura-e-escrita: duas rodadas simultâneas somariam
      // errado, e a soma é a única coisa que este registro existe para saber.
      update: { used: { increment: Math.round(requests) }, limit },
    })
  } catch (e: any) {
    console.warn(`[quota] contagem de ${provider} falhou:`, e?.message || e)
  }
}

export interface ProviderQuota {
  provider: string
  period: string
  used: number
  limit: number | null
  decision: QuotaDecision
  alert: QuotaAlertLevel
}

/**
 * O estado de cota de todos os provedores no mês corrente.
 *
 * Inclui provedor **sem consumo registrado**: ausência de linha significa zero
 * requisições, não provedor inexistente — e um painel que esconde a fonte
 * porque ela ainda não foi usada esconde justamente a que parou de funcionar.
 */
export async function currentQuotas(): Promise<ProviderQuota[]> {
  const period = periodKey()

  let rows: { provider: string; used: number; limit: number | null }[] = []
  try {
    rows = await db.apiQuotaUsage.findMany({
      where: { period },
      select: { provider: true, used: true, limit: true },
    })
  } catch (e: any) {
    console.warn('[quota] leitura falhou:', e?.message || e)
  }

  const byProvider = new Map(rows.map((r) => [r.provider, r]))
  const providers = new Set([...Object.keys(MONTHLY_QUOTA), ...byProvider.keys()])

  return [...providers]
    .map((provider) => {
      const row = byProvider.get(provider)
      const state = {
        provider,
        used: row?.used ?? 0,
        limit: row?.limit ?? MONTHLY_QUOTA[provider] ?? null,
      }
      return { ...state, period, decision: quotaDecision(state), alert: quotaAlertLevel(state) }
    })
    .sort((a, b) => {
      // Quem está mais perto do teto aparece primeiro: é a informação que faz
      // alguém agir.
      const ra = a.limit ? a.used / a.limit : -1
      const rb = b.limit ? b.used / b.limit : -1
      return rb - ra
    })
}

/**
 * A busca sob demanda pode chamar este provedor agora?
 *
 * A rodada agendada NÃO consulta isto: ela serve todos os usuários e tem
 * reserva própria. Quem cede quando a cota aperta é sempre o individual.
 */
export async function onDemandAllowed(provider: string): Promise<QuotaDecision> {
  const period = periodKey()

  try {
    const row = await db.apiQuotaUsage.findUnique({
      where: { provider_period: { provider, period } },
      select: { used: true, limit: true },
    })

    return quotaDecision({
      provider,
      used: row?.used ?? 0,
      limit: row?.limit ?? MONTHLY_QUOTA[provider] ?? null,
    })
  } catch (e: any) {
    console.warn(`[quota] verificação de ${provider} falhou:`, e?.message || e)
    // Falha de leitura não pode virar barra livre nem bloqueio total. Trata
    // como desconhecido, que é o que de fato é.
    return quotaDecision({ provider, used: 0, limit: null })
  }
}
