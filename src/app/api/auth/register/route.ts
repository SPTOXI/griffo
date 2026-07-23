import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128),
  profession: z.string().max(120).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    const { name, email, password, profession } = parsed.data

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado. Faça login.' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        profession: profession || null,
        plan: 'free',
        credits: 0, // 0 credits on signup (free user must acquire Plano de Entrada)
      },
    })

    await db.auditLog.create({
      data: { userId: user.id, action: 'register', meta: JSON.stringify({ email: user.email, credits: 0 }) },
    })

    await createSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profession: user.profession,
        plan: user.plan,
        credits: 0,
        planEndsAt: user.planEndsAt,
      },
    })
  } catch (e: any) {
    console.error('register error', e)
    return NextResponse.json({ error: 'Erro ao cadastrar. Tente novamente.' }, { status: 500 })
  }
}
