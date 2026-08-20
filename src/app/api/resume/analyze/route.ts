export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { unlockAnalysis } from '@/lib/entitlements'
import { getRequestLanguage } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { processAnalysisJob, resumeIfStalled } from '@/lib/analysis/job'
import { checkResumeContent } from '@/lib/analysis/content-guard'
import { SEGMENT_IDS } from '@/lib/analysis/stages'

/**
 * Abre uma análise e responde na hora.
 *
 * Esta rota fazia a análise inteira antes de responder: uma chamada de IA de
 * ~3.800 tokens de saída, medida em 82s, dentro de uma função com
 * `maxDuration = 60`. A plataforma encerrava a execução aos 60s e o navegador
 * mostrava "erro de conexão" depois de mais de um minuto de espera.
 *
 * Agora ela destrava o currículo, cria o job e devolve o `id`. O processamento
 * roda fora do caminho da resposta e grava o progresso no banco; a tela
 * acompanha por `GET /api/resume/analyze/status`. Fechar o navegador no meio
 * deixou de custar o laudo.
 *
 * O destrave é o ÚNICO movimento cobrável do produto: ele consome uma análise
 * do saldo e libera os nove itens deste currículo para sempre — reescrita,
 * carta, orientação, presença digital e download deixaram de ter preço próprio.
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
      select: { id: true, originalContent: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })
    }

    /**
     * Antes de qualquer coisa, e principalmente ANTES DE COBRAR.
     *
     * Um PDF sem camada de texto chegou a ser analisado, pontuado nas oito
     * dimensões e desenhado em gráfico — com o parecer dizendo, no próprio
     * texto, que só o nome do arquivo havia sido fornecido. Pontuar um
     * documento que não se conseguiu ler é inventar dado sobre o candidato.
     *
     * A posição desta verificação é parte da correção: aqui, o destrave ainda
     * não aconteceu e o saldo não foi tocado. Recusar depois devolveria a
     * mensagem certa e cobraria mesmo assim.
     */
    const verdict = checkResumeContent(resume.originalContent)
    if (!verdict.analyzable) {
      return NextResponse.json(
        { error: verdict.message, code: 'UNREADABLE_RESUME', reason: verdict.code },
        { status: 422 }
      )
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

    // Idempotente: um currículo já destravado não é cobrado de novo. Repetir a
    // análise do mesmo currículo — porque o usuário mudou a vaga alvo, ou
    // porque um segmento falhou — não custa uma segunda análise do saldo.
    const unlock = await unlockAnalysis(user.id, resume.id)

    if (!unlock.ok) {
      return NextResponse.json(
        {
          error: unlock.error || 'Você ainda não tem uma análise disponível.',
          code: 'ANALYSIS_REQUIRED',
          balance: unlock.balance,
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
        userCountry: edgeCountry(req),
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
        balance: unlock.balance,
      },
      { status: 202 }
    )
  } catch (e: any) {
    // Nada a estornar: o destrave é do currículo, não da execução. Se o
    // processamento falhar, o currículo continua liberado e a análise pode ser
    // repetida sem nova cobrança.
    console.error('analyze error:', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a análise. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
