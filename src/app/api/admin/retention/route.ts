import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { runRetentionPurge, RETENTION_DAYS } from '@/lib/retention'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Prazos vigentes, para exibição no painel. */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }
  return NextResponse.json({ retentionDays: RETENTION_DAYS })
}

/**
 * Dispara o expurgo.
 *
 * Acionado manualmente pelo painel. O agendamento automático (Vercel Cron)
 * exige configuração no `vercel.json` e um segredo de autenticação do cron —
 * fica como passo operacional, não de código.
 */
export async function POST() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const report = await runRetentionPurge()

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'retention_purge',
        meta: JSON.stringify(report),
      },
    })

    return NextResponse.json({ success: true, report })
  } catch (e: any) {
    console.error('retention purge error', e?.message || e)
    return NextResponse.json({ error: 'Erro ao executar o expurgo.' }, { status: 500 })
  }
}
