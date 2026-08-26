export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getRequestLanguage } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { processProfileExtractionJob } from '@/lib/ai-jobs/runners/profile-extraction'

/**
 * Abre a sugestão do Perfil Profissional a partir do currículo, e responde
 * na hora.
 *
 * ## Por que
 *
 * O currículo já diz cargo, área, competências, formação e tempo de carreira. O
 * perfil pedia tudo de novo. Pior: `runRadar` só avalia quem TEM perfil, então
 * o formulário em branco não era só chateação — era a porta fechada do Radar.
 *
 * ## Progresso real, não um spinner com aviso de tempo
 *
 * Esta rota fazia a chamada de IA e respondia só no fim — um spinner sem
 * nenhum sinal de que algo estava de fato acontecendo. Agora ela cria o job e
 * devolve o `id`; a tela acompanha por `GET /api/ai-jobs/status`, que mostra
 * um marco real a cada tentativa de provedor (ver
 * `lib/ai-jobs/runners/single-call.ts` e a regra em
 * `HANDOFF-CONTINUIDADE.md`, "Nunca dar sensação de travamento").
 *
 * ## Sugere, não grava
 *
 * A resposta é devolvida para a tela preencher os campos VAZIOS do formulário,
 * que a pessoa revisa e salva. Gravar direto faria o perfil mudar sozinho, e o
 * §30 é explícito quanto a não alterar o perfil sem que a pessoa saiba — ali
 * sobre o feedback do Radar, mas o motivo é o mesmo.
 *
 * ## Não custa nada, e não exige currículo destravado
 *
 * Diferente das rotas de entrega, esta não pede `requireUnlockedResume`: ela
 * não devolve análise nem texto novo, só reorganiza o que a pessoa já enviou
 * sobre si mesma. Cobrar por ler o próprio currículo de volta seria cobrar duas
 * vezes pelo mesmo upload.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    /**
     * O currículo pedido, ou o mais recente.
     *
     * A tela do perfil não sabe de currículos, e a pergunta que ela faz é "o
     * que você sabe sobre mim" — para ela, o mais recente é a resposta certa.
     *
     * Quem passa `resumeId` é a tela do laudo, perguntando outra coisa: "este
     * currículo aqui contradiz o perfil?". Aí o currículo tem de ser
     * exatamente o que está aberto, e não o último enviado — senão a pergunta
     * seria feita sobre um documento que a pessoa não está olhando.
     */
    const body = await req.json().catch(() => ({}))
    const requestedId = typeof body?.resumeId === 'string' ? body.resumeId : null

    const resume = await db.resume.findFirst({
      where: requestedId
        ? { id: requestedId, userId: user.id }
        : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, originalContent: true },
    })

    if (!resume || !resume.originalContent?.trim()) {
      return NextResponse.json(
        {
          error:
            'Você ainda não enviou um currículo. Envie um e depois volte aqui para preencher o perfil a partir dele.',
          code: 'no_resume',
        },
        { status: 404 }
      )
    }

    // Uma sugestão já em andamento é devolvida em vez de duplicada — mesmo
    // motivo do `analyze/route.ts`: um duplo clique não deve abrir dois jobs
    // para o mesmo currículo.
    const inFlight = await db.aiJob.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        kind: 'profile_extraction',
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
        kind: 'profile_extraction',
        status: 'queued',
        // 4, e não o teto real de tentativas (3): evita que a divisão bata em
        // 100% ENQUANTO ainda roda a última tentativa (ver o comentário de
        // `describeAiJobProgress`, que só força 100% quando `status` já é
        // 'completed'). Cada marco real ainda avança a barra normalmente.
        totalSteps: 4,
        lang: getRequestLanguage(req),
        userCountry: edgeCountry(req),
      },
      select: { id: true },
    })

    after(() =>
      processProfileExtractionJob(job.id).catch((e) =>
        console.error('[professional-profile/suggest] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    console.error('[professional-profile/suggest]', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a leitura do currículo. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
