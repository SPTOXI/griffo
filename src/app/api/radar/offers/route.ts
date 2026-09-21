export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { listOfferLog } from '@/lib/radar/offer-log.server'

/**
 * O histórico de vagas que o Radar já ofereceu a esta pessoa.
 *
 * Diferente de `GET /api/radar`, que lê `RadarAlert` e some quando a vaga é
 * apagada, esta rota lê `RadarOfferLog` — a cópia que sobrevive ao apagamento
 * da vaga aos 180 dias. É por isso que ela existe: sem um caminho de leitura,
 * a memória preservada não serviria a ninguém.
 *
 * Isolamento por usuário é estrutural, igual ao resto do Radar: a consulta
 * parte do `userId` da sessão e não há parâmetro por onde pedir o histórico de
 * outra pessoa.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const offers = await listOfferLog(user.id)
    return NextResponse.json({ offers }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('radar offer log error', e?.message || e)
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}
