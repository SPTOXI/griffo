import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'
import { isConfigError } from '@/lib/env'

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail'),
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
    const normalizedEmail = identifier.trim().toLowerCase()

    // Autenticação apenas por e-mail. Antes o `OR` também casava por `name`,
    // que não é único nem normalizado no schema: dois usuários com o mesmo
    // nome faziam o `findFirst` devolver um deles em ordem indefinida — quem
    // soubesse o nome de outra pessoa e criasse uma conta homônima podia,
    // dependendo da ordem retornada pelo banco, autenticar contra o registro
    // errado. `email` é `@unique`, então a busca é determinística.
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    // Mesma regra de `getCurrentUser`: conta desabilitada não entra, inclusive
    // a de administrador. A exceção anterior deixava o admin desabilitado
    // fazer login com sucesso e então receber 401 em toda requisição seguinte,
    // porque `getCurrentUser` não abria a mesma exceção.
    if (user.disabled) {
      return NextResponse.json({ error: 'Sua conta foi desabilitada pelo administrador do sistema.' }, { status: 403 })
    }

    try {
      await db.auditLog.create({
        data: { userId: user.id, action: 'login' },
      })
    } catch (e) {
      console.warn('AuditLog create failed non-critically:', e)
    }

    await createSession(user.id, {
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profession: user.profession,
        plan: user.plan,
        analysisBalance: user.analysisBalance,
        paymentCountry: user.paymentCountry,
        planStartsAt: user.planStartsAt,
        planEndsAt: user.planEndsAt,
        recruiterOptIn: user.recruiterOptIn,
        profileVisible: user.profileVisible,
      },
    })
  } catch (e: any) {
    console.error('login error', e)
    // Configuração ausente não se resolve tentando de novo. Dizer "tente
    // novamente" aqui esconde o problema de quem pode corrigi-lo — o nome da
    // variável fica só no log, mas a natureza do erro chega à tela.
    if (isConfigError(e)) {
      return NextResponse.json(
        {
          error:
            'O servidor está com uma configuração pendente e o login não pode ser concluído. ' +
            'Avise o administrador — o detalhe está no log da aplicação.',
          code: 'SERVER_MISCONFIGURED',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro ao entrar. Tente novamente.' }, { status: 500 })
  }
}
