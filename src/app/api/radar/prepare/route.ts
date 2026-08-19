export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * A ponte entre achar a vaga e se preparar para ela.
 *
 * ## O que estava quebrado
 *
 * O Griffo sabe adaptar um currículo a uma vaga específica — reescreve
 * destacando o que importa e escreve a carta direcionada. Mas a vaga só entrava
 * no sistema de um jeito: **coladá à mão** no formulário de envio.
 *
 * Então o Radar encontrava a vaga certa, mostrava na tela, e a pessoa precisava
 * copiar a descrição, trocar de tela e colar. Quase ninguém faz — a fricção mata
 * exatamente no momento em que ela estava disposta a agir.
 *
 * É o que faltava para fechar a Etapa 8 (§18, §19, §20), e é onde o Radar
 * deixa de ser um serviço bonito que não leva a lugar nenhum.
 *
 * ## Direciona o currículo que já existe, e não cria outro
 *
 * Criar um currículo novo por vaga pareceria mais limpo, mas as permissões de
 * uso são POR CURRÍCULO: um currículo novo exigiria destravá-lo de novo. A
 * pessoa clicaria em "preparar para esta vaga" e receberia uma cobrança que não
 * pediu.
 *
 * Direcionar o que já existe mantém a decisão de compra onde ela sempre esteve.
 *
 * ## E avisa o que vai sobrescrever
 *
 * Se o currículo já estava direcionado a outra vaga, a resposta devolve qual
 * era. Trocar o alvo em silêncio faria a próxima análise sair diferente sem que
 * ninguém soubesse por quê.
 */

const schema = z.object({
  alertId: z.string().min(1, 'Alerta obrigatório.'),
  /** Currículo a direcionar. Sem ele, o mais recente. */
  resumeId: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    // O alerta precisa ser DESTE usuário. Sem isso, um id adivinhado leria a
    // vaga recomendada a outra pessoa.
    const alert = await db.radarAlert.findFirst({
      where: { id: parsed.data.alertId, userId: user.id },
      select: {
        id: true,
        job: { select: { title: true, company: true, description: true, applicationUrl: true } },
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Oportunidade não encontrada.' }, { status: 404 })
    }

    const resume = parsed.data.resumeId
      ? await db.resume.findFirst({
          where: { id: parsed.data.resumeId, userId: user.id },
          select: { id: true, targetJob: true },
        })
      : await db.resume.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true, targetJob: true },
        })

    if (!resume) {
      return NextResponse.json(
        {
          error: 'Você ainda não enviou um currículo. Envie um e depois volte para direcioná-lo a esta vaga.',
          code: 'no_resume',
        },
        { status: 409 }
      )
    }

    // Cargo e empresa juntos: "Enfermeiro" sozinho não distingue duas vagas
    // diferentes na lista, e é este texto que a pessoa vê ao voltar depois.
    const targetJob = `${alert.job.title} — ${alert.job.company}`

    // A descrição pode não existir: nem toda fonte a entrega. Direcionar só pelo
    // cargo é pior que direcionar pela descrição, mas é muito melhor que não
    // direcionar — e as rotas de IA já tratam os dois casos.
    const targetJobDescription = alert.job.description?.trim() || null

    const previousTarget = resume.targetJob?.trim() || null

    await db.resume.update({
      where: { id: resume.id },
      data: { targetJob, targetJobDescription },
    })

    // Preparar-se para a vaga é o clique mais forte que existe: vale mais que
    // abrir o link. Registrar isso é o que permite saber, depois, quais alertas
    // realmente serviram.
    await db.radarAlert.update({
      where: { id: alert.id },
      data: { clickedAt: new Date() },
    })

    return NextResponse.json({
      resumeId: resume.id,
      targetJob,
      hasDescription: Boolean(targetJobDescription),
      applicationUrl: alert.job.applicationUrl,
      // Devolvido para que a tela possa dizer o que mudou, em vez de trocar o
      // alvo do currículo em silêncio.
      previousTarget: previousTarget && previousTarget !== targetJob ? previousTarget : null,
    })
  } catch (e: any) {
    console.error('[radar/prepare]', e?.message || e)
    return NextResponse.json(
      { error: 'Não foi possível preparar seu currículo para esta vaga agora.' },
      { status: 500 }
    )
  }
}
