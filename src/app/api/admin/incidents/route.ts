import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { runDiagnosticAndHealing } from '@/lib/agents/diagnostic-agent'
import { assertPublicUrl, BlockedUrlError } from '@/lib/url-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const incidents = await db.systemIncident.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  const alertEmail = await db.systemConfig.findUnique({ where: { key: 'ADMIN_ALERT_EMAIL' } })
  const alertWebhook = await db.systemConfig.findUnique({ where: { key: 'ADMIN_ALERT_WEBHOOK_URL' } })

  return NextResponse.json({
    incidents,
    config: {
      adminAlertEmail: alertEmail?.value || admin.email,
      adminAlertWebhook: alertWebhook?.value || '',
    },
  })
}

export async function POST(req: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { action, incidentId, status, alertEmail, alertWebhook } = body

  if (action === 'update_config') {
    if (typeof alertEmail === 'string') {
      await db.systemConfig.upsert({
        where: { key: 'ADMIN_ALERT_EMAIL' },
        create: { key: 'ADMIN_ALERT_EMAIL', value: alertEmail },
        update: { value: alertEmail },
      })
    }
    if (typeof alertWebhook === 'string') {
      // Valida já na gravação, além da validação no envio: o administrador
      // descobre o problema aqui, e não num incidente crítico em que o alerta
      // silenciosamente não sai.
      const trimmed = alertWebhook.trim()
      if (trimmed) {
        if (!trimmed.toLowerCase().startsWith('https://')) {
          return NextResponse.json(
            { error: 'O webhook de alerta precisa usar HTTPS.' },
            { status: 400 }
          )
        }
        try {
          await assertPublicUrl(trimmed)
        } catch (e) {
          const message = e instanceof BlockedUrlError ? e.message : 'URL de webhook inválida.'
          return NextResponse.json({ error: message }, { status: 400 })
        }
      }
      await db.systemConfig.upsert({
        where: { key: 'ADMIN_ALERT_WEBHOOK_URL' },
        create: { key: 'ADMIN_ALERT_WEBHOOK_URL', value: trimmed },
        update: { value: trimmed },
      })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'run_diagnostic') {
    const diagData = await runDiagnosticAndHealing(incidentId)
    return NextResponse.json({ ok: true, diagnostic: diagData })
  }

  if (action === 'update_status' && incidentId && status) {
    await db.systemIncident.update({
      where: { id: incidentId },
      data: { status },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
