export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { describeAiJobProgress, resumeIfStalled } from '@/lib/ai-jobs/engine'
// Importado pelo efeito colateral: registra os runners de cada `kind` no
// motor genérico, para que `resumeIfStalled` saiba qual função retomar.
import '@/lib/ai-jobs/runners'

/**
 * Estado de um job de IA fora do laudo principal (perfil social, extração de
 * perfil, orientação vocacional, carta, reescrita — ver
 * `lib/ai-jobs/engine.ts`).
 *
 * Uma rota só para os cinco `kind`s, e não uma por fluxo: o formato da
 * resposta é o mesmo em todos — status, progresso, etapas concluídas,
 * resultado —, e cinco rotas quase idênticas seriam cinco lugares para o
 * mesmo bug aparecer separadamente.
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const resumeId = searchParams.get('resumeId')
    const kind = searchParams.get('kind')

    if (!jobId && !(resumeId && kind)) {
      return NextResponse.json({ error: 'Informe jobId, ou resumeId e kind.' }, { status: 400 })
    }

    const job = await db.aiJob.findFirst({
      // O filtro por `userId` é o que impede ler o job de outra pessoa a
      // partir de um id adivinhado.
      where: jobId
        ? { id: jobId, userId: user.id }
        : { resumeId: resumeId!, kind: kind!, userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kind: true,
        status: true,
        stepsJson: true,
        totalSteps: true,
        resultJson: true,
        errorMessage: true,
        resumeId: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 })
    }

    if (job.status === 'queued' || job.status === 'running') {
      await resumeIfStalled(job.id)
    }

    const progress = describeAiJobProgress(job)

    return NextResponse.json({
      jobId: job.id,
      kind: job.kind,
      resumeId: job.resumeId,
      status: job.status,
      ...progress,
      result: job.resultJson ? JSON.parse(job.resultJson) : null,
      error: job.errorMessage,
    })
  } catch (e: any) {
    console.error('ai-jobs status error:', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar a tarefa.' }, { status: 500 })
  }
}
