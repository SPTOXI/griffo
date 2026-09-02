export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { lookupHiringIndex } from '@/lib/hiring-index/lookup.server'

/**
 * A temperatura de contratação de UM país (§2.51, §2.52).
 *
 * ## O que sai daqui, e o que não sai
 *
 * Sai o **enum** da fase (`cooling`, `heating_up`, ...), nunca texto de tela. O
 * rótulo que a pessoa lê é escolhido pelo componente com o idioma ativo dela,
 * do dicionário `hiringIndex` — mesmo padrão de toda tela que usa `useI18n()`.
 * Uma rota que devolvesse texto pronto congelaria o idioma no servidor e
 * quebraria a troca de idioma sem recarregar a página.
 *
 * ## País sem cobertura responde 200, não 404
 *
 * "Nenhuma fonte oficial cobre este país" é um resultado, não uma falha: o
 * índice cobre 30 países e o mundo tem quase 200. O corpo traz
 * `covered: false`, e a tela diz isso com todas as letras — o mesmo princípio
 * de `lib/market/countries.ts`, que prefere admitir que não há convenção de
 * currículo para um país a fingir cobertura. Um 404 empurraria a tela para o
 * caminho de erro, onde ela tenderia a sumir.
 *
 * ## Por que exige sessão, se o dado é público
 *
 * O dado é estatística oficial e não é de ninguém. A sessão existe porque a
 * rota consulta o banco a cada chamada e não está no `matcher` do
 * `middleware.ts` (que só cobre `/api/cron`, `/api/admin` e as rotas de
 * usuário): sem nenhum dos dois freios, seria uma consulta gratuita e ilimitada
 * ao Postgres. O widget vive dentro do laudo pago, atrás de login de qualquer
 * forma.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { country } = await params
    const summary = await lookupHiringIndex(country ?? '')

    return NextResponse.json(summary)
  } catch (e: any) {
    console.error('[hiring-index] GET falhou:', e?.message || e)
    // Falha de consulta NÃO é "país sem dado": devolver `covered: false` aqui
    // faria a tela afirmar que não existe fonte para o país quando o que houve
    // foi o banco não responder. São frases diferentes e o 500 preserva a
    // diferença.
    return NextResponse.json({ error: 'Não foi possível consultar o indicador.' }, { status: 500 })
  }
}
