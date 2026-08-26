export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getRequestLanguage } from '@/lib/i18n/server'
import { requireUnlockedResume } from '@/lib/entitlements'
import { edgeCountry } from '@/lib/pricing/resolve'
import { processCoverLetterJob } from '@/lib/ai-jobs/runners/cover-letter'

/**
 * Carta de apresentação e resumo profissional direcionado.
 *
 * ## Por que esta rota existe
 *
 * Os dois itens eram vendidos e não existiam. `cover_letter` aparecia como
 * tipo de tarefa em `ai-router/types.ts`, tinha provedor primário declarado
 * em `registry.ts` e custo orçado por análise — mas nenhuma rota o produzia.
 * `professional_summary` aparecia só no catálogo e na landing, sem sequer um
 * tipo de tarefa. A promessa era de nove entregas e o código entregava sete.
 *
 * ## Uma chamada, dois artefatos
 *
 * Carta e resumo saem do mesmo par (currículo, vaga alvo) e do mesmo
 * raciocínio: o que nesta trajetória importa para ESTA vaga. Pedi-los em
 * chamadas separadas dobraria o custo e o tempo para produzir duas leituras do
 * mesmo material — que ainda por cima poderiam divergir entre si.
 *
 * O resumo aqui é o do CURRÍCULO, direcionado à vaga alvo. Não se confunde com
 * o texto "Sobre" que a análise de presença digital gera por perfil
 * (`lib/social/analysis.ts`): aquele é escrito para o algoritmo do LinkedIn,
 * este para o topo do currículo e para o recrutador humano.
 *
 * ## Nada é cobrado aqui
 *
 * Como toda rota derivada, esta só pergunta se o currículo está destravado. Uma
 * falha não custa nada ao usuário — ele pede de novo. Ver `lib/entitlements.ts`.
 *
 * ## Progresso real
 *
 * Abre o job e responde na hora — a tela acompanha por
 * `GET /api/ai-jobs/status`, com o marco real de tentativa de provedor em vez
 * do spinner com aviso de tempo que existia antes. Ver
 * `lib/ai-jobs/runners/cover-letter.ts`.
 */
const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
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
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
      select: { id: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    const inFlight = await db.aiJob.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        kind: 'cover_letter',
        status: { in: ['queued', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })

    if (inFlight) {
      return NextResponse.json({ jobId: inFlight.id, status: inFlight.status }, { status: 202 })
    }

    const job = await db.aiJob.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        kind: 'cover_letter',
        status: 'queued',
        totalSteps: 4,
        lang: getRequestLanguage(req),
        userCountry: edgeCountry(req),
      },
      select: { id: true },
    })

    after(() =>
      processCoverLetterJob(job.id).catch((e) =>
        console.error('[cover-letter] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    console.error('Error opening cover letter job:', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a redação. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
