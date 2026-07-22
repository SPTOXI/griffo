import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const plan = searchParams.get('plan') || ''

    const where: any = {}
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (plan && plan !== 'all') {
      where.plan = plan
    }

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { resumes: true, subscriptions: true }
        }
      }
    })

    return NextResponse.json({ users })
  } catch (e: any) {
    console.error('admin users get error', e)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, role, plan } = body as { userId: string; role?: string; plan?: string }

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 })
    }

    const data: any = {}
    if (role && ['user', 'admin'].includes(role)) data.role = role
    if (plan && ['free', 'day', 'monthly', 'annual'].includes(plan)) data.plan = plan

    const updated = await db.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, plan: true }
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_user_update',
        meta: JSON.stringify({ targetUserId: userId, updated: data })
      }
    })

    return NextResponse.json({ user: updated })
  } catch (e: any) {
    console.error('admin user update error', e)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}
