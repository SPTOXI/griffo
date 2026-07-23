import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { purchaseCreditPackage } from '@/lib/credits'

const schema = z.object({
  packageId: z.enum(['entrada', 'starter', 'carreira', 'profissional']),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para adquirir créditos.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Pacote de créditos inválido.' }, { status: 400 })
    }

    const res = await purchaseCreditPackage(user.id, parsed.data.packageId)
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Erro ao processar compra.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: res.postPurchaseMessage || `${res.packageInfo?.name} ativado com sucesso!`,
      newBalance: res.newBalance,
      package: res.packageInfo,
    })
  } catch (e: any) {
    console.error('credit purchase API error:', e)
    return NextResponse.json({ error: 'Erro ao processar aquisição de créditos.' }, { status: 500 })
  }
}
