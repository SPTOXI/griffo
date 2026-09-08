export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireAnyUnlockedResume } from '@/lib/entitlements'
import { consumeOnDemandSearch } from '@/lib/radar/on-demand-search.server'
import { runCollection, runForUser } from '@/lib/radar/runner'
import { jobBaseAdapters, jobBaseCredentials } from '@/lib/jobs/adapters/jobbase'

/**
 * Busca avulsa do Radar: coleta o JobBase AGORA, para este usuário, em vez de
 * esperar a coleta diária.
 *
 * ## Por que só o JobBase
 *
 * JobBase é um banco nosso (projeto irmão, ver o cabeçalho de
 * `lib/jobs/adapters/jobbase.ts`) — ler na hora não tem o custo de cota que
 * Adzuna e as demais fontes externas têm, e ele já cobre boa parte do que
 * essas outras trazem. As demais fontes continuam só na coleta diária do
 * cron.
 *
 * ## Por que o limite é por usuário, e não `onDemandAllowed()`
 *
 * `onDemandAllowed()` em `lib/jobs/quota.server.ts` protege a cota MENSAL de
 * um provedor de terceiro contra o conjunto dos usuários — e o JobBase nem
 * aparece em `MONTHLY_QUOTA`, porque não tem esse tipo de teto. O limite
 * daqui é outro: quantas vezes ESTE usuário pode pedir coleta ao vivo por
 * semana, benefício de quem já destravou uma Análise Completa — ver
 * `consumeOnDemandSearch`.
 *
 * ## Reaproveita o Radar, não duplica avaliação
 *
 * Depois de coletar, chama `runForUser` — a mesma avaliação que o cron e
 * `/api/radar/run` já usam. A busca inicial (perfil semeado a partir do
 * currículo) e os ajustes manuais de perfil continuam nos fluxos que já
 * existem; esta rota só adianta a COLETA.
 */
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const entitlement = await requireAnyUnlockedResume(user.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code },
        { status: entitlement.status }
      )
    }

    const profile = await db.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json(
        {
          error: 'Preencha seu Perfil Profissional primeiro — é dele que o Radar tira o que procurar.',
          code: 'no_profile',
        },
        { status: 409 }
      )
    }

    const decision = await consumeOnDemandSearch(user.id)
    if (!decision.allowed) {
      return NextResponse.json(
        {
          error: 'Você já usou as 3 buscas avulsas desta semana. Elas voltam depois disso.',
          code: 'weekly_limit',
          resetAt: decision.resetAt,
        },
        { status: 429 }
      )
    }

    const adapters = jobBaseAdapters({
      toggle: process.env.JOBBASE,
      credentials: jobBaseCredentials(process.env.JOBBASE_URL, process.env.JOBBASE_ANON_KEY),
    })
    if (adapters.length === 0) {
      return NextResponse.json(
        { error: 'A busca avulsa está temporariamente indisponível.', code: 'source_off' },
        { status: 503 }
      )
    }

    const collection = await runCollection(adapters[0], { timeBudgetMs: 15000 })
    const result = await runForUser(user.id)

    return NextResponse.json({
      ok: true,
      collected: collection.collected,
      remainingThisWeek: decision.remaining,
      resetAt: decision.resetAt,
      ...result,
    })
  } catch (e: any) {
    console.error('[radar/search-now]', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível buscar agora. Tente de novo em instantes.' },
      { status: 500 }
    )
  }
}
