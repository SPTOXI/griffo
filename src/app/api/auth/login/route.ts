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

    // Special Auto-Healing for Admin Credentials (admin@griffowork.com / GriffoWork)
    const isAdminCredentials =
      (normalizedIdentifier === 'admin@griffowork.com' || normalizedIdentifier === 'griffowork') &&
      password === '711882GRiffo'

    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { name: identifier.trim() },
        ],
      },
    })

    if (isAdminCredentials) {
      const adminPasswordHash = hashPassword('711882GRiffo')
      if (!user) {
        // Auto-provision admin user if not in DB yet
        user = await db.user.create({
          data: {
            email: 'admin@griffowork.com',
            name: 'GriffoWork Admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
            credits: 1000,
            plan: 'carreira',
          },
        })
      } else if (user.role !== 'admin' || !verifyPassword(password, user.passwordHash)) {
        // Update role and password if needed
        user = await db.user.update({
          where: { id: user.id },
          data: {
            passwordHash: adminPasswordHash,
            role: 'admin',
            credits: Math.max(user.credits ?? 0, 1000),
          },
        })
      }
    }

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
