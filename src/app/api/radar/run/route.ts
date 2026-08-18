export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { runForUser } from '@/lib/radar/runner'

/**
 * Roda o Radar para quem pediu, agora.
 *
 * ## Por que esta rota existe
 *
 * A rodada automática é diária, porque **coletar** varre a internet e é caro.
 * Mas quem acabou de preencher o perfil não tem por que esperar até a
 * madrugada: as vagas já estão no banco, e **avaliar** um perfil contra elas é
 * barato — quatro consultas e cálculo em memória, sem rede nenhuma.
 *
 * Sem isto, a primeira experiência de quem se cadastra é uma tela vazia por até
 * 24 horas, indistinguível de produto quebrado.
 *
 * ## Ela NÃO coleta
 *
 * Coletar é por fonte e serve a todo mundo; deixar cada usuário disparar coleta
 * multiplicaria por N as idas às fontes, gastaria o orçamento de tempo e daria
 * a qualquer visitante um botão que faz o servidor chamar cinco APIs externas.
 *
 * O efeito prático é que uma vaga publicada hoje só aparece depois da coleta
 * da madrugada — e isso é o desenho, não uma limitação a esconder.
 *
 * ## Intervalo mínimo
 *
 * Avaliar é barato, mas não é de graça, e o resultado não muda entre dois
 * cliques seguidos: as mesmas vagas contra o mesmo perfil dão o mesmo veredito.
 * O intervalo existe para que segurar o botão não vire carga, e é curto o
 * bastante para não atrapalhar quem acabou de corrigir o perfil.
 */
const MIN_INTERVAL_MS = 30_000

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const profile = await db.professionalProfile.findUnique({
      where: { userId: user.id },
      select: { targetRoles: true, residenceCountry: true },
    })

    // Sem perfil não há o que avaliar, e a mensagem precisa dizer o que fazer —
    // "nenhuma oportunidade" mandaria a pessoa esperar por algo que nunca vem.
    if (!profile) {
      return NextResponse.json(
        {
          error:
            'Preencha seu Perfil Profissional primeiro — é dele que o Radar tira o que procurar.',
          code: 'no_profile',
        },
        { status: 409 }
      )
    }

    const preference = await db.radarPreference.findUnique({
      where: { userId: user.id },
      select: { lastRunAt: true },
    })

    const since = preference?.lastRunAt ? Date.now() - preference.lastRunAt.getTime() : Infinity
    if (since < MIN_INTERVAL_MS) {
      return NextResponse.json(
        {
          error: 'O Radar acabou de rodar. Espere alguns segundos antes de pedir de novo.',
          code: 'too_soon',
          retryAfterSec: Math.ceil((MIN_INTERVAL_MS - since) / 1000),
        },
        { status: 429 }
      )
    }

    const result = await runForUser(user.id)

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('[radar/run]', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível atualizar o Radar agora. Tente de novo em instantes.' },
      { status: 500 }
    )
  }
}
