import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { isConfigError } from '@/lib/env'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128),
  profession: z.string().max(120).optional(),
  // Consentimento de transferência internacional. Obrigatório: o currículo é
  // processado por provedores de IA fora do país de origem, e sem base
  // jurídica registrada esse tratamento não tem respaldo (LGPD Art. 33,
  // GDPR Cap. V). Recusar significa não poder usar o produto — por isso a
  // interface precisa deixar isso explícito antes do envio.
  dataTransferConsent: z.literal(true, {
    message: 'É necessário aceitar o processamento do currículo por serviços de IA no exterior.',
  }),
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
        role: 'user',
        plan: 'free',
        credits: 0, // 0 credits on signup (free user must acquire Plano de Entrada)
        dataTransferConsent: true,
        dataTransferConsentAt: new Date(),
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'register',
        // Registra o consentimento na trilha de auditoria: é ele que prova a
        // base jurídica do tratamento se ela for questionada.
        meta: JSON.stringify({ credits: 0, dataTransferConsent: true, consentVersion: 'v1' }),
      },
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
    // Mesma distinção do login: o cadastro também cria sessão e depende da
    // mesma variável.
    if (isConfigError(e)) {
      return NextResponse.json(
        {
          error:
            'O servidor está com uma configuração pendente e o cadastro não pode ser concluído. ' +
            'Avise o administrador — o detalhe está no log da aplicação.',
          code: 'SERVER_MISCONFIGURED',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Erro ao cadastrar. Tente novamente.' }, { status: 500 })
  }
}
