import { NextResponse } from 'next/server'
import { clientIpFrom } from '@/lib/request-ip'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, verifyPasswordConstantTime, createSession } from '@/lib/auth'
import { isConfigError } from '@/lib/env'

// Trava por CONTA, independente do IP: o limitador do middleware é por IP e em
// memória por instância, então sozinho não segura quem distribui tentativas
// entre IPs. Depois de MAX_FAILED_LOGINS erros na janela, a conta recusa novas
// tentativas (mesmo com a senha certa) até a janela passar.
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED_LOGINS = 10

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

    // Verificação em tempo constante: mesmo se o usuário não existir no banco,
    // executa o scrypt com hash dummy para ter idêntico tempo de CPU,
    // eliminando qualquer oráculo de tempo para enumeração de e-mails.
    const passwordValid = verifyPasswordConstantTime(password, user?.passwordHash)

    if (user) {
      const recentFailures = await db.auditLog.count({
        where: {
          userId: user.id,
          action: 'login_failed',
          createdAt: { gte: new Date(Date.now() - FAILED_LOGIN_WINDOW_MS) },
        },
      })
      if (recentFailures >= MAX_FAILED_LOGINS) {
        return NextResponse.json(
          { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
          { status: 429, headers: { 'Retry-After': String(FAILED_LOGIN_WINDOW_MS / 1000) } }
        )
      }
      if (!passwordValid) {
        await db.auditLog.create({ data: { userId: user.id, action: 'login_failed' } }).catch((e) => {
          console.warn('AuditLog login_failed create failed non-critically:', e)
        })
      }
    }

    if (!user || !passwordValid) {
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
      // Mesma leitura do limitador: atrás do Cloudflare o primeiro item de
      // `x-forwarded-for` é o que o cliente mandou, e registrar isso como IP de
      // login guardaria no banco o número que o atacante escolheu.
      ip: clientIpFrom(req.headers),
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
