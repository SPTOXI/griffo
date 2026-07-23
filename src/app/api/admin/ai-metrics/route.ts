import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { getAiMetricsData } from '@/lib/ai-router/metrics'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado. Requer função de Admin.' }, { status: 403 })
    }

    const data = await getAiMetricsData()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('ai-metrics API error:', e)
    return NextResponse.json({ error: 'Erro ao carregar telemetria de IA.' }, { status: 500 })
  }
}
