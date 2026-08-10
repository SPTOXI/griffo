export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { reserveCredits, CREDIT_COSTS } from '@/lib/credits'
import { getRequestLanguage } from '@/lib/i18n/server'
import { getRequestCountry } from '@/lib/currency'
import { processAnalysisJob, resumeIfStalled } from '@/lib/analysis/job'
import { SEGMENT_IDS } from '@/lib/analysis/stages'

/**
 * Abre uma análise e responde na hora.
 *
 * Esta rota fazia a análise inteira antes de responder: uma chamada de IA de
 * ~3.800 tokens de saída, medida em 82s, dentro de uma função com
 * `maxDuration = 60`. A plataforma encerrava a execução aos 60s, o navegador
 * mostrava "erro de conexão" depois de mais de um minuto de espera, e o `catch`
 * que devolvia os créditos morria junto — o estorno só acontecia depois, na
 * varredura de reservas órfãs.
 *
 * Agora ela reserva o crédito, cria o job e devolve o `id`. O processamento
 * roda fora do caminho da resposta e grava o progresso no banco; a tela
 * acompanha por `GET /api/resume/analyze/status`. Fechar o navegador no meio
 * deixou de custar o laudo.
 */

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { resumeId } = parsed.data

    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: user.id },
      select: { id: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })
    }

    // Uma análise já em andamento é devolvida em vez de duplicada. Sem isto, um
    // duplo clique — ou o disparo automático da tela coincidindo com o botão —
    // abriria dois jobs e cobraria duas vezes pelo mesmo laudo.
    const inFlight = await db.analysisJob.findFirst({
      where: { resumeId, userId: user.id, status: { in: ['queued', 'running'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })

    if (inFlight) {
      // Pode ser um job cuja execução a plataforma encerrou. Devolver o `id` sem
      // reativá-lo deixaria a tela esperando por algo que ninguém está fazendo.
      await resumeIfStalled(inFlight.id)
      return NextResponse.json(
        { jobId: inFlight.id, status: inFlight.status, totalSegments: SEGMENT_IDS.length },
        { status: 202 }
      )
    }

    const costCredits = CREDIT_COSTS.full_analysis
    const deduction = await reserveCredits(
      user.id,
      costCredits,
      `Análise completa em 8 Dimensões (${costCredits} cr)`
    )

    if (!deduction.success) {
      return NextResponse.json(
        {
          error:
            deduction.error ||
            'Seu saldo de créditos é insuficiente. Adquira o Plano de Entrada (R$ 9,90) ou recarregue seu saldo para continuar utilizando a IA.',
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: deduction.currentBalance,
        },
        { status: 402 }
      )
    }

    // Idioma e país são gravados no job: quem retomar o trabalho numa invocação
    // posterior não terá mais os cabeçalhos desta requisição.
    const job = await db.analysisJob.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        status: 'queued',
        lang: getRequestLanguage(req),
        userCountry: getRequestCountry(req),
        reservationId: deduction.reservation.id,
        creditsCost: costCredits,
      },
      select: { id: true },
    })

    // Fora do caminho da resposta. Se esta execução for encerrada antes de
    // terminar, a concessão do job vence e a consulta de status o retoma.
    after(() =>
      processAnalysisJob(job.id).catch((e) =>
        console.error('[analyze] Falha ao processar job:', e)
      )
    )

    return NextResponse.json(
      {
        jobId: job.id,
        status: 'queued',
        totalSegments: SEGMENT_IDS.length,
        currentBalance: deduction.currentBalance,
      },
      { status: 202 }
    )
  } catch (e: any) {
    // Nenhum crédito a estornar aqui: uma falha nesta rota ou é anterior à
    // reserva, ou é posterior à criação do job — e a partir daí o desfecho do
    // crédito pertence ao job, que libera a reserva se não conseguir concluir.
    console.error('analyze error:', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a análise. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
