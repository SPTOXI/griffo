import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppUrl } from '@/lib/env'
import { userIdFromVerifyRequest } from '@/lib/email/verify-email.server'

export const dynamic = 'force-dynamic'

/**
 * O clique no link de confirmação do cadastro (§2.147).
 *
 * Confirma o e-mail e leva para a tela de entrada. Link inválido ou vencido
 * leva para a mesma tela com um aviso: lá a pessoa pode pedir outro link
 * tentando entrar (o login reenvia para cadastro pendente).
 *
 * ## Por que não abre sessão
 *
 * O link prova que a pessoa lê a caixa de entrada, não que ela conhece a senha
 * gravada na conta. Abrir sessão aqui permitia a tomada de conta
 * pré-registrada: alguém cadastra o e-mail da vítima com uma senha dele, a
 * vítima depois se cadastra, clica no link, entra sem digitar senha e passa a
 * usar uma conta cuja senha o atacante sabe. Exigir o login depois do clique
 * garante que só usa a conta quem conhece a senha atual — e o cadastro de uma
 * conta pendente grava a senha de quem se cadastrou por último
 * (`api/auth/register`).
 *
 * Pelo mesmo motivo, o link deixou de ser um login reutilizável durante as 48
 * horas de validade: clicá-lo de novo só confirma o que já está confirmado.
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

    return NextResponse.redirect(`${appUrl}/?view=login&verify=done`, 303)
  } catch (e) {
    console.error('verify-email error', e)
    return NextResponse.redirect(`${appUrl}/?view=login&verify=error`, 303)
  }
}
