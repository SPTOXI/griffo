import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const configs = await db.systemConfig.findMany()
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({ config: configMap })
  } catch (e: any) {
    console.error('admin settings get error', e)
    return NextResponse.json({ error: 'Erro ao obter configurações' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json() as Record<string, string>

    for (const [key, value] of Object.entries(body)) {
      await db.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_config_update',
        meta: JSON.stringify({ keysUpdated: Object.keys(body) })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('admin settings post error', e)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
