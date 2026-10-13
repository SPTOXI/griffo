import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { getAppUrl } from '@/lib/env'
import { userIdFromVerifyRequest } from '@/lib/email/verify-email.server'
import { clientIpFrom } from '@/lib/request-ip'

export const dynamic = 'force-dynamic'

/**
 * O clique no link de confirmação do cadastro (§2.147).
 *
 * Confirma o e-mail, abre a sessão e leva para o app. Link inválido ou vencido
 * leva para a tela de entrada com um aviso: lá a pessoa pode pedir outro link
 * tentando entrar (o login reenvia para cadastro pendente).
 *
 * Também abre sessão para conta já confirmada: o link só chega a quem lê a
 * caixa de entrada, e um segundo clique não deve virar mensagem de erro.
 */
export async function GET(req: Request) {
  const appUrl = getAppUrl()
  try {
    const token = new URL(req.url).searchParams.get('t')
    const userId = userIdFromVerifyRequest(token)
    if (!userId) return NextResponse.redirect(`${appUrl}/?view=login&verify=invalid`, 303)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.disabled) return NextResponse.redirect(`${appUrl}/?view=login&verify=invalid`, 303)

    if (user.emailVerificationPending) {
      await db.user.update({ where: { id: user.id }, data: { emailVerificationPending: false } })
      await db.auditLog
        .create({ data: { userId: user.id, action: 'email_verified' } })
        .catch((e) => console.warn('AuditLog email_verified create failed non-critically:', e))
    }

    await createSession(user.id, { userAgent: req.headers.get('user-agent'), ip: clientIpFrom(req.headers) })
    return NextResponse.redirect(`${appUrl}/?verified=1`, 303)
  } catch (e) {
    console.error('verify-email error', e)
    return NextResponse.redirect(`${appUrl}/?view=login&verify=error`, 303)
  }
}
