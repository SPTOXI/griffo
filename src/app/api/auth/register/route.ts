import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendAccountExistsEmail, sendVerificationEmail } from '@/lib/email/verify-email.server'
import { isConfigError } from '@/lib/env'
import { trackServerEvent } from '@/lib/analytics/track.server'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .refine((p) => p.trim().length >= 8, 'A senha não pode conter apenas espaços.'),
  profession: z.string().max(120).optional(),
  // Liga o cadastro à visita anônima que o originou (funil).
  visitorId: z.string().max(100).optional(),
  // Idioma da tela, para o e-mail de confirmação sair na mesma língua.
  lang: z.string().max(5).optional(),
  // Consentimento de transferência internacional. Obrigatório: o currículo é
  // processado por provedores de IA fora do país de origem, e sem base
  // jurídica registrada esse tratamento não tem respaldo (LGPD Art. 33,
  // GDPR Cap. V). Recusar significa não poder usar o produto — por isso a
  // interface precisa deixar isso explícito antes do envio.
  dataTransferConsent: z.literal(true, {
    message: 'É necessário aceitar o processamento do currículo por serviços de IA no exterior.',
  }),
})

/**
 * A MESMA resposta para e-mail novo e e-mail já cadastrado.
 *
 * Antes, um 409 dizia a qualquer pessoa quem tem conta num serviço de busca de
 * emprego, e entregava logins válidos para ataque de senha (§2.147). Agora o
 * que aconteceu só aparece na caixa de entrada: conta nova recebe o link de
 * confirmação; conta existente recebe um aviso. O clique no link confirma o
 * e-mail (`/api/auth/verify-email`), e a sessão abre no login com a senha.
 */
const CHECK_EMAIL = { status: 'check_email' } as const
/** Reenvio do link para cadastro pendente: no máximo um a cada 5 minutos. */
const RESEND_MIN_INTERVAL_MS = 5 * 60 * 1000
/** Aviso de "você já tem conta": no máximo um a cada 30 minutos por conta. */
const ACCOUNT_EXISTS_MIN_INTERVAL_MS = 30 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    const { name, email, password, profession } = parsed.data

    const normalizedEmail = email.toLowerCase()
    const lang = parsed.data.lang || 'pt'

    // O scrypt roda nos dois caminhos: sem isso, a conta existente respondia
    // mais rápido e o tempo de resposta voltava a revelar o que o corpo esconde.
    const passwordHash = hashPassword(password)

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      if (existing.emailVerificationPending) {
        // Cadastro pendente: ninguém provou ainda ser dono do e-mail, então a
        // senha gravada não é de ninguém em particular. Quem se cadastra por
        // último define a senha, e só ela abre a conta depois da confirmação
        // (o link não abre sessão — ver `/api/auth/verify-email`).
        //
        // Manter a primeira senha era a tomada de conta pré-registrada: alguém
        // cadastrava o e-mail da vítima com uma senha dele; a vítima se
        // cadastrava depois, confirmava, e passava a usar uma conta cuja senha
        // o atacante sabia. Se o atacante sobrescrever de novo depois da
        // vítima, o pior caso é ela não conseguir entrar — e não pôr dado
        // nenhum numa conta que outra pessoa abre.
        const last = existing.emailVerificationSentAt?.getTime() ?? 0
        const resend = Date.now() - last > RESEND_MIN_INTERVAL_MS
        await db.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            name,
            profession: profession || null,
            ...(resend ? { emailVerificationSentAt: new Date() } : {}),
          },
        })
        if (resend) await sendVerificationEmail(existing, lang)
      } else {
        // No máximo um aviso por conta a cada 30 minutos. Sem teto, repetir o
        // cadastro com o e-mail de alguém enchia a caixa dessa pessoa com
        // mensagens do nosso domínio — e cada reclamação de spam pesa contra a
        // entrega dos e-mails de todo mundo.
        const recentNotice = await db.auditLog.findFirst({
          where: {
            userId: existing.id,
            action: 'account_exists_notice',
            createdAt: { gte: new Date(Date.now() - ACCOUNT_EXISTS_MIN_INTERVAL_MS) },
          },
          select: { id: true },
        })
        if (!recentNotice) {
          await db.auditLog.create({ data: { userId: existing.id, action: 'account_exists_notice' } })
          await sendAccountExistsEmail(existing.email, lang)
        }
      }
      return NextResponse.json(CHECK_EMAIL, { status: 202 })
    }

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        profession: profession || null,
        role: 'user',
        plan: 'free',
        // Cadastro não dá análise nenhuma. O que é gratuito é a PRÉVIA — as
        // oito notas, sem diagnóstico —, e ela não consome saldo.
        analysisBalance: 0,
        dataTransferConsent: true,
        dataTransferConsentAt: new Date(),
        emailVerificationPending: true,
        emailVerificationSentAt: new Date(),
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'register',
        // Registra o consentimento na trilha de auditoria: é ele que prova a
        // base jurídica do tratamento se ela for questionada.
        meta: JSON.stringify({ analysisBalance: 0, dataTransferConsent: true, consentVersion: 'v1' }),
      },
    })

    await trackServerEvent('signup_done', { req, userId: user.id, visitorId: parsed.data.visitorId })

    await sendVerificationEmail(user, lang)

    return NextResponse.json(CHECK_EMAIL, { status: 202 })
  } catch (e: any) {
    // Dois cadastros simultâneos do mesmo e-mail: o segundo bate na chave
    // única. Responde igual a todo o resto, sem 500 que diferencie.
    if (e?.code === 'P2002') return NextResponse.json(CHECK_EMAIL, { status: 202 })
    console.error('register error', e)
    // Mesma distinção do login: o link de confirmação é assinado com a mesma
    // variável da sessão.
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
