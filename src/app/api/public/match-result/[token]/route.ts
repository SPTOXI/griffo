export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { isValidToken } from '@/lib/match-preview/rules'
import { loadLeadResult } from '@/lib/match-preview/server'

/**
 * Resultado do envio sem conta da landing, lido pelo token.
 *
 * Caminho separado de `/api/public/match-preview` de propósito: a tela consulta
 * aqui a cada 2 segundos, e um prefixo em comum faria a consulta herdar o
 * limite baixo do envio no middleware — o mesmo defeito que já travou o status
 * da análise (ver o cabeçalho de `lib/rate-rules.ts`).
 *
 * Vencido e inexistente respondem igual (404): responder diferente diria a
 * quem testa tokens quais já existiram.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const headers = { 'Cache-Control': 'no-store' }
  if (!isValidToken(token)) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers })

  try {
    const result = await loadLeadResult(token)
    if (!result) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers })
    return NextResponse.json(result, { headers })
  } catch (e: any) {
    console.error('match-result error:', e?.message || e)
    return NextResponse.json({ error: 'GENERIC' }, { status: 500, headers })
  }
}
