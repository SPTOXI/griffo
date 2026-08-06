export const maxDuration = 60

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { generateDirectorBriefing } from '@/lib/agents/master-director-agent'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 })
  }

  try {
    const briefing = await generateDirectorBriefing()
    return NextResponse.json({ briefing })
  } catch (e: any) {
    console.error('Error generating director briefing:', e)
    return NextResponse.json({ error: 'Erro ao gerar boletim do Coordenador de Agentes' }, { status: 500 })
  }
}
