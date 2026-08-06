import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail ou usuário'),
  password: z.string().min(1, 'Informe sua senha'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    const { email: identifier, password } = parsed.data
    const normalizedIdentifier = identifier.trim().toLowerCase()

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { name: identifier.trim() },
        ],
      },
    })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Usuário/E-mail ou senha incorretos.' }, { status: 401 })
    }

    if (user.disabled && user.role !== 'admin') {
      return NextResponse.json({ error: 'Sua conta foi desabilitada pelo administrador do sistema.' }, { status: 403 })
    }

    try {
      await db.auditLog.create({
        data: { userId: user.id, action: 'login' },
      })
    } catch (e) {
      console.warn('AuditLog create failed non-critically:', e)
    }

    await createSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profession: user.profession,
        plan: user.plan,
        credits: user.credits,
        planStartsAt: user.planStartsAt,
        planEndsAt: user.planEndsAt,
        recruiterOptIn: user.recruiterOptIn,
        profileVisible: user.profileVisible,
      },
    })
  } catch (e: any) {
    console.error('login error', e)
    return NextResponse.json({ error: 'Erro ao entrar. Tente novamente.' }, { status: 500 })
  }
}
