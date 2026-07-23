import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const [userData, transactions] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { credits: true, plan: true },
      }),
      db.creditTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ])

    return NextResponse.json({
      credits: userData?.credits ?? 0,
      plan: userData?.plan ?? 'free',
      transactions,
    })
  } catch (e: any) {
    console.error('credit balance API error:', e)
    return NextResponse.json({ error: 'Erro ao consultar saldo de créditos.' }, { status: 500 })
  }
}
