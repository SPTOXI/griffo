import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { revokeAllUserSessions } from '@/lib/session-store'

/**
 * Movimento de saldo feito pelo administrador.
 *
 * Toda alteração de `analysisBalance` por aqui gera uma linha no ledger. Sem
 * isso, o saldo de um usuário poderia mudar sem que nada explicasse a origem —
 * e o ledger, que existe para tornar a cobrança auditável, teria um buraco
 * exatamente onde a mudança não passou por pagamento.
 *
 * `delta` é o que de fato foi aplicado, não o que foi pedido: o saldo tem piso
 * em zero, então uma redução maior que o saldo é registrada pelo que coube.
 */
async function recordAdminBalanceChange(input: {
  adminId: string
  userId: string
  delta: number
  reason: string
}): Promise<void> {
  if (input.delta === 0) return
  await db.analysisLedger.create({
    data: {
      userId: input.userId,
      type: 'admin_grant',
      delta: input.delta,
      description:
        `${input.delta > 0 ? 'Crédito' : 'Redução'} de ${Math.abs(input.delta)} ` +
        `${Math.abs(input.delta) === 1 ? 'análise' : 'análises'} pelo administrador — ${input.reason}`,
    },
  })
}

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
        analysisBalance: true,
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

const createSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  name: z.string().min(2, 'Nome muito curto.'),
  password: z.string().min(8, 'A senha precisa de ao menos 8 caracteres.'),
  role: z.enum(['user', 'admin']).default('user'),
  /** Análises já liberadas na criação. Geram linha no ledger como qualquer outra. */
  analysisBalance: z.number().int().min(0).max(1000).default(0),
})

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const { email, name, password, role, analysisBalance } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 })
    }

    const created = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: hashPassword(password),
        role,
        plan: 'free',
        analysisBalance,
        // Conta criada pelo administrador não passou pela tela de cadastro,
        // onde o consentimento é colhido. Quem cria assume a responsabilidade
        // de ter a base jurídica — registrada no log de auditoria abaixo.
        dataTransferConsent: true,
        dataTransferConsentAt: new Date(),
        // Nada a converter: contas novas nascem no modelo de análises.
        creditsMigratedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true, plan: true, analysisBalance: true, disabled: true },
    })

    if (analysisBalance > 0) {
      await recordAdminBalanceChange({
        adminId: admin.id,
        userId: created.id,
        delta: analysisBalance,
        reason: 'saldo inicial na criação da conta',
      })
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_user_create',
        meta: JSON.stringify({
          targetUserId: created.id,
          email: normalizedEmail,
          role,
          analysisBalance,
        }),
      },
    })

    return NextResponse.json({
      user: created,
      message: `Conta de ${created.email} criada com sucesso.`,
    })
  } catch (e: any) {
    console.error('admin user create error', e)
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, role, plan, analysisBalance, analysisDelta, disabled } = body as {
      userId: string
      role?: string
      plan?: string
      /** Novo saldo absoluto. */
      analysisBalance?: number
      /** Crédito (positivo) ou redução (negativo) sobre o saldo atual. */
      analysisDelta?: number
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
    if (typeof disabled === 'boolean') data.disabled = disabled

    // O saldo tem duas formas de mudar, e a diferença entre elas importa.
    //
    // `analysisDelta` é incremento: some 5, tire 2. É atômico no banco, então
    // não perde uma análise que o usuário gastou entre a leitura da tela e o
    // clique do administrador.
    //
    // `analysisBalance` é atribuição: o saldo passa a ser exatamente isto.
    // Perde essa corrida por construção — quem atribui está dizendo "o valor é
    // este, independente do que houver" —, e existe para corrigir um saldo
    // errado, não para operar o dia a dia.
    let appliedDelta = 0
    const previousBalance = targetUser.analysisBalance

    if (typeof analysisDelta === 'number' && Number.isFinite(analysisDelta) && analysisDelta !== 0) {
      // Piso em zero: reduzir mais do que existe zera, não fica negativo.
      appliedDelta = Math.max(analysisDelta, -previousBalance)
      data.analysisBalance = { increment: appliedDelta }
    } else if (typeof analysisBalance === 'number' && analysisBalance >= 0) {
      appliedDelta = analysisBalance - previousBalance
      data.analysisBalance = analysisBalance
    }

    const updated = await db.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, plan: true, analysisBalance: true, disabled: true },
    })

    if (appliedDelta !== 0) {
      await recordAdminBalanceChange({
        adminId: admin.id,
        userId,
        delta: appliedDelta,
        reason: `ajuste manual (de ${previousBalance} para ${updated.analysisBalance})`,
      })
    }

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
        meta: JSON.stringify({
          targetUserId: userId,
          role: data.role,
          plan: data.plan,
          disabled: data.disabled,
          balanceFrom: previousBalance,
          balanceTo: updated.analysisBalance,
          appliedDelta,
        }),
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
