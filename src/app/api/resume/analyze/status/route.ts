export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { describeProgress, partialAnalysis, resumeIfStalled } from '@/lib/analysis/job'

/**
 * Estado de uma análise em andamento.
 *
 * Além de informar, esta rota conserta: se encontra um job cuja concessão
 * venceu — sinal de que a execução que o processava foi encerrada pela
 * plataforma —, ela reativa o processamento antes de responder. Quem está
 * esperando o laudo é quem mantém o trabalho vivo, o que dispensa fila
 * dedicada e cron.
 *
 * Devolve também o laudo parcial: os segmentos já concluídos vão para a tela
 * enquanto os outros ainda estão sendo gerados. É a diferença entre olhar uma
 * barra de progresso e ver o trabalho acontecendo.
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

    if (!jobId && !resumeId) {
      return NextResponse.json({ error: 'Informe jobId ou resumeId.' }, { status: 400 })
    }

    const job = await db.analysisJob.findFirst({
      // O filtro por `userId` é o que impede ler o job de outra pessoa a partir
      // de um id adivinhado.
      where: jobId ? { id: jobId, userId: user.id } : { resumeId: resumeId!, userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        segmentsJson: true,
        resultJson: true,
        errorMessage: true,
        resumeId: true,
        createdAt: true,
        finishedAt: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Análise não encontrada.' }, { status: 404 })
    }

    if (job.status === 'queued' || job.status === 'running') {
      await resumeIfStalled(job.id)
    }

    const progress = describeProgress(job)

    return NextResponse.json({
      jobId: job.id,
      resumeId: job.resumeId,
      status: job.status,
      ...progress,
      partial: job.status === 'completed' ? null : partialAnalysis(job.segmentsJson),
      analysis: job.resultJson ? JSON.parse(job.resultJson) : null,
      error: job.errorMessage,
    })
  } catch (e: any) {
    console.error('analyze status error:', e?.message || e)
    return NextResponse.json({ error: 'Erro ao consultar a análise.' }, { status: 500 })
  }
}
