import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { runDiagnosticAndHealing } from '@/lib/agents/diagnostic-agent'

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
      await db.systemConfig.upsert({
        where: { key: 'ADMIN_ALERT_WEBHOOK_URL' },
        create: { key: 'ADMIN_ALERT_WEBHOOK_URL', value: alertWebhook },
        update: { value: alertWebhook },
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
