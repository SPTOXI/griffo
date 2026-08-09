import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, destroySession, verifyPassword } from '@/lib/auth'
import { revokeAllUserSessions } from '@/lib/session-store'

export const dynamic = 'force-dynamic'

const deleteSchema = z.object({
  password: z.string().min(1, 'Confirme sua senha para excluir a conta.'),
  confirm: z.literal('EXCLUIR', {
    message: 'Digite EXCLUIR para confirmar.',
  }),
})

/**
 * `DELETE /api/user` — exclusão de conta.
 *
 * Direito de eliminação: Art. 18 da LGPD e Art. 17 do GDPR (este com prazo de
 * até um mês). Não existia rota alguma para isso — o titular dependia de pedir
 * a um administrador, sem prazo nem registro.
 *
 * A exclusão é imediata e definitiva. `onDelete: Cascade` no schema remove
 * currículos, transações, logs de IA e sessões junto; `AuditLog` usa
 * `SetNull`, então a trilha de auditoria sobrevive sem apontar para ninguém —
 * que é o comportamento correto: o registro contábil permanece, a identificação
 * desaparece.
 */
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    // Reautenticação: excluir a conta é irreversível, e o cookie de sessão
    // sozinho não é prova suficiente de que quem está pedindo é o titular.
    if (!verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 403 })
    }

    // O administrador não pode se autoexcluir: a plataforma ficaria sem acesso
    // administrativo, e a rota de admin já impede a exclusão por outro caminho.
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Contas administrativas não podem ser excluídas por esta rota.' },
        { status: 400 }
      )
    }

    await revokeAllUserSessions(user.id)

    // Registrado antes da exclusão: depois o `userId` vira nulo pelo SetNull, e
    // o que resta é a contagem, sem identificar quem era.
    await db.auditLog.create({
      data: { userId: user.id, action: 'account_delete' },
    })

    await db.user.delete({ where: { id: user.id } })
    await destroySession()

    return NextResponse.json({
      success: true,
      message: 'Sua conta e todos os dados associados foram excluídos.',
    })
  } catch (e: any) {
    console.error('account delete error', e?.message || e)
    return NextResponse.json({ error: 'Erro ao excluir a conta.' }, { status: 500 })
  }
}
