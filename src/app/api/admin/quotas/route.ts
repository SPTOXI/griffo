export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { currentQuotas } from '@/lib/jobs/quota.server'

/**
 * Consumo de cota das APIs de vagas, para o painel.
 *
 * Responde a pergunta que não tinha resposta: **quanto do mês já foi gasto, e
 * qual fonte está prestes a parar?**
 *
 * Sem isto, cota estourada só aparece como "o Radar entregou menos" — e a
 * Adzuna piora o caso respondendo 200 com `exception`, que se parece com "não
 * há vaga". A fonte falharia em silêncio até alguém desconfiar.
 *
 * Junto vem o estado de cada fonte de coleta: cota é só uma das formas de uma
 * fonte parar. Uma que responde 500 há três dias não estourou cota nenhuma, e
 * precisa aparecer no mesmo lugar.
 */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  const quotas = await currentQuotas()

  let sources: unknown[] = []
  try {
    sources = await db.jobSource.findMany({
      select: {
        slug: true,
        name: true,
        enabled: true,
        collectionStatus: true,
        collectionError: true,
        lastCollectionAt: true,
        lastSuccessfulCollection: true,
        consecutiveFailures: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { slug: 'asc' },
    })
  } catch (e: any) {
    console.warn('[admin/quotas] leitura das fontes falhou:', e?.message || e)
  }

  return NextResponse.json({
    period: quotas[0]?.period ?? null,
    quotas,
    sources,
    // O painel precisa saber se há algo a mostrar em destaque sem reimplementar
    // a regra — ela vive em `quota.ts` e é testada lá.
    hasAlert: quotas.some((q) => q.alert !== 'none'),
  })
}
