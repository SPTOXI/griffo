import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * `GET /api/user/export` — portabilidade dos dados.
 *
 * Art. 18, V da LGPD e Art. 20 do GDPR: o titular tem direito a receber seus
 * dados num formato estruturado e de uso corrente. Não existia exportação
 * alguma.
 *
 * O JSON sai como anexo, com tudo que a plataforma guarda sobre a pessoa:
 * cadastro, currículos (originais, reescritos e laudos), o ledger de análises,
 * o histórico do modelo antigo, assinaturas e a trilha de auditoria. Segredos e hashes ficam de fora — não
 * são dados do titular, são credenciais do sistema.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const [resumes, analysisLedger, creditTransactions, subscriptions, auditLogs] = await Promise.all([
      db.resume.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.analysisLedger.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      // Histórico do modelo de créditos, encerrado. Continua exportado porque
      // é dado do titular: a mudança de modelo não apaga o que ele comprou.
      db.creditTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.subscription.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      format: 'griffo-user-export-v1',
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profession: user.profession,
        socialLinks: user.socialLinks ? safeParse(user.socialLinks) : null,
        role: user.role,
        analysisBalance: user.analysisBalance,
        paymentCountry: user.paymentCountry,
        plan: user.plan,
        planStartsAt: user.planStartsAt,
        planEndsAt: user.planEndsAt,
        recruiterOptIn: user.recruiterOptIn,
        profileVisible: user.profileVisible,
        createdAt: user.createdAt,
        // `passwordHash` fica de fora de propósito: é credencial, não dado do
        // titular, e exportá-la só ampliaria a superfície de vazamento.
      },
      resumes: resumes.map((r) => ({
        id: r.id,
        originalContent: r.originalContent,
        rewrittenContent: r.rewrittenContent,
        analysis: r.analysisJson ? safeParse(r.analysisJson) : null,
        careerOrientation: r.careerOrientationJson ? safeParse(r.careerOrientationJson) : null,
        jobMatch: r.jobMatchJson ? safeParse(r.jobMatchJson) : null,
        socialLinks: r.socialLinksJson ? safeParse(r.socialLinksJson) : null,
        socialConsent: r.socialConsent,
        targetJob: r.targetJob,
        targetJobDescription: r.targetJobDescription,
        atsScore: r.atsScore,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      analysisLedger,
      creditTransactions,
      subscriptions,
      auditLogs: auditLogs.map((a) => ({
        action: a.action,
        resumeId: a.resumeId,
        meta: a.meta ? safeParse(a.meta) : null,
        createdAt: a.createdAt,
      })),
    }

    const filename = `griffo_meus_dados_${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    console.error('user export error', e?.message || e)
    return NextResponse.json({ error: 'Erro ao exportar seus dados.' }, { status: 500 })
  }
}

/** Campos JSON são strings no schema; devolvê-los já decodificados é mais útil. */
function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
