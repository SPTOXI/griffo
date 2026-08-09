import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { revokeAllUserSessions } from '@/lib/session-store'

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const plan = searchParams.get('plan') || ''

    // Sem teto, esta rota carregava a base inteira de usuários em memória e a
    // devolvia numa resposta só. Funciona com centenas; com dezenas de
    // milhares, estoura o tempo da função antes de estourar a memória.
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

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

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        credits: true,
        disabled: true,
        createdAt: true,
        _count: {
          select: { resumes: true, subscriptions: true },
        },
      },
      }),
    ])

    return NextResponse.json({
      users,
      pagination: { total, limit, offset, hasMore: offset + users.length < total },
    })
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
    const { userId, role, plan, credits, disabled } = body as {
      userId: string
      role?: string
      plan?: string
      credits?: number
      disabled?: boolean
    }

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    // Protection Rule: Never allow disabling an Admin user
    if (targetUser.role === 'admin' && disabled === true) {
      return NextResponse.json(
        { error: 'O perfil de Administrador Mestre não pode ser desabilitado.' },
        { status: 400 }
      )
    }

    const data: any = {}
    if (role && ['user', 'admin'].includes(role)) data.role = role
    if (plan) data.plan = plan
    if (typeof credits === 'number' && credits >= 0) data.credits = credits
    if (typeof disabled === 'boolean') data.disabled = disabled

    const updated = await db.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, plan: true, credits: true, disabled: true },
    })

    // Desabilitar já era respeitado por `getCurrentUser`, mas agora as sessões
    // do usuário também são revogadas — o efeito passa a ser registrado e
    // auditável, em vez de depender só da checagem em cada requisição.
    if (disabled === true) {
      await revokeAllUserSessions(userId)
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_user_update',
        meta: JSON.stringify({ targetUserId: userId, updated: data }),
      },
    })

    return NextResponse.json({ user: updated, message: 'Usuário atualizado com sucesso.' })
  } catch (e: any) {
    console.error('admin user update error', e)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const singleUserId = searchParams.get('userId')
    const userIds: string[] = body.userIds || (singleUserId ? [singleUserId] : [])

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos um usuário para deletar.' }, { status: 400 })
    }

    // Fetch targets to prevent deleting any Admin
    const targets = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, role: true },
    })

    const adminTargets = targets.filter((u) => u.role === 'admin')
    if (adminTargets.length > 0) {
      return NextResponse.json(
        { error: 'O perfil de Administrador NUNCA pode ser deletado do sistema.' },
        { status: 400 }
      )
    }

    const deletableIds = targets.map((u) => u.id)

    await db.user.deleteMany({
      where: { id: { in: deletableIds } },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_users_delete',
        meta: JSON.stringify({ deletedCount: deletableIds.length, deletableIds }),
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: deletableIds.length,
      message: `${deletableIds.length} usuário(s) deletado(s) com sucesso.`,
    })
  } catch (e: any) {
    console.error('admin user delete error', e)
    return NextResponse.json({ error: 'Erro ao deletar usuário(s)' }, { status: 500 })
  }
}
