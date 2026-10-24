import 'server-only'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { executeAiTask } from '@/lib/ai-router/router'
import { freshOpenJobWhere } from '@/lib/jobs/lifecycle'
import { countryLabel } from '@/lib/jobs/country-labels'
import { citySpellings } from './city-index'
import {
  CITY_AGENT_BATCH,
  CITY_AGENT_JSON_SCHEMA,
  CITY_AGENT_TARGETS,
  cityAgentSystemPrompt,
  cityAgentUserPrompt,
  validateDecisions,
} from './city-agent'
import { CITY_JOBS_CACHE_TAG, countryExclusions, loadCityIndex, loadCityRules } from './city-index.server'
import { CITY_JOBS_COUNTRY_SLUGS } from './context'

/** O modelo, fixo: DeepSeek Flash (decisão do operador, 24/10/2026). */
const CITY_AGENT_MODEL = 'deepseek-flash'

export interface CityAgentRun {
  countries: number
  reviewed: number
  saved: number
  costUsd: number
  errors: string[]
}

/**
 * Uma rodada do agente: para cada país com grafias sem regra (os com mais
 * pendências primeiro), manda um lote ao DeepSeek Flash e grava o que passar
 * pela validação, marcado `decidedBy: 'agent'`. Para quando o tempo acaba —
 * a rodada seguinte continua de onde parou, porque o que foi decidido sai da
 * fila sozinho.
 *
 * Sem failover para outro provedor de propósito (`maxProviderAttempts: 1`): o
 * operador escolheu o DeepSeek Flash para isto. Fora do ar, a rodada para e a
 * próxima tenta de novo.
 */
export async function runCityAgent(opts: { deadlineMs: number }): Promise<CityAgentRun> {
  const start = Date.now()
  const run: CityAgentRun = { countries: 0, reviewed: 0, saved: 0, costUsd: 0, errors: [] }

  // Pendências por país, numa consulta só.
  const grouped = await db.job.groupBy({
    by: ['country', 'city'],
    where: { ...freshOpenJobWhere(), country: { in: CITY_JOBS_COUNTRY_SLUGS.map((s) => s.toUpperCase()) }, city: { not: null } },
    _count: { _all: true },
  })
  const byCountry = new Map<string, { city: string | null; category: null; count: number }[]>()
  for (const g of grouped) {
    if (!g.country) continue
    const list = byCountry.get(g.country) ?? []
    list.push({ city: g.city, category: null, count: g._count._all })
    byCountry.set(g.country, list)
  }

  const queue: { country: string; pending: ReturnType<typeof citySpellings> }[] = []
  for (const [country, rows] of byCountry) {
    const rules = await loadCityRules(country)
    const pending = citySpellings(rows, countryExclusions(country), rules).filter((s) => !s.rule)
    if (pending.length > 0) queue.push({ country, pending })
  }
  queue.sort((a, b) => b.pending.length - a.pending.length)

  for (const { country, pending } of queue) {
    // Cada chamada leva até ~15s; não começa uma que não termina no prazo.
    if (Date.now() - start > opts.deadlineMs - 18_000) break
    const batch = pending.slice(0, CITY_AGENT_BATCH)
    const index = await loadCityIndex(country)
    const targets = index.slice(0, CITY_AGENT_TARGETS).map((c) => ({ slug: c.slug, name: c.name }))
    try {
      const ai = await executeAiTask({
        taskType: 'city_classification',
        systemPrompt: cityAgentSystemPrompt(),
        userPrompt: cityAgentUserPrompt({
          countryCode: country,
          countryName: countryLabel(country, 'en'),
          items: batch,
          targets,
        }),
        jsonSchema: CITY_AGENT_JSON_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 2500,
        disableThinking: true,
        internal: true,
        modelOverride: CITY_AGENT_MODEL,
        maxProviderAttempts: 1,
        timeBudgetMs: 15_000,
      })
      run.costUsd += ai.costUsd ?? 0
      run.countries++
      run.reviewed += batch.length

      const decisions = validateDecisions(
        ai.content,
        batch.map((b) => b.rawSlug),
        new Set(index.map((c) => c.slug))
      )
      for (const d of decisions) {
        // `create` só: se o admin decidiu esta grafia no meio da rodada, a dele fica.
        await db.cityAlias
          .create({
            data: {
              country,
              rawSlug: d.rawSlug,
              kind: d.kind,
              canonicalSlug: d.kind === 'alias' ? d.canonicalSlug ?? null : null,
              decidedBy: 'agent',
            },
          })
          .then(() => run.saved++)
          .catch(() => {})
      }
    } catch (e: any) {
      run.errors.push(`${country}: ${e?.message || e}`)
      // Provedor fora do ar não é defeito do país: encerra a rodada.
      break
    }
  }

  if (run.saved > 0) revalidateTag(CITY_JOBS_CACHE_TAG, { expire: 0 })
  return run
}
