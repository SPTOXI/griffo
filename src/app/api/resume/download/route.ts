export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateResumePdf, generateAnalysisReportPdf, sanitizeMarkdown } from '@/lib/pdf'
import { reserveCredits, settleReservation, releaseReservation, CREDIT_COSTS } from '@/lib/credits'

interface DownloadPayload {
  buf: Buffer
  mime: string
  filename: string
}

class DownloadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

function safeBaseName(name: string | null | undefined, fallback: string): string {
  return (name || fallback).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
}

function buildSocialAdviceContent(analysis: any, asPlainText: boolean): string {
  const socialAdvice = Array.isArray(analysis.socialAdvice) ? analysis.socialAdvice : []
  if (socialAdvice.length === 0) {
    throw new DownloadError('Nenhum conselho de rede social disponível neste laudo', 400)
  }

  let content = `# Otimização de Presença Digital & Redes Sociais\n\n`
  for (const item of socialAdvice) {
    content += `## ${item.platform}\n`
    content += `URL: ${item.url}\n\n`
    if (item.headline) content += `### 💡 Título Sugerido\n${item.headline}\n\n`
    if (item.aboutSummary) content += `### 📝 Texto "Sobre" / Bio\n${item.aboutSummary}\n\n`
    if (item.tips && item.tips.length > 0) {
      content += `### 🚀 Dicas de Otimização & Algoritmo\n`
      for (const tip of item.tips) {
        content += `- ${tip}\n`
      }
      content += `\n`
    }
    content += `---\n\n`
  }

  return asPlainText
    ? content.replace(/^#+\s+/gm, '').replace(/---/g, '==============')
    : content
}

/**
 * Monta o arquivo pedido. Lança `DownloadError` quando o pedido não pode ser
 * atendido — nenhuma dessas condições deve custar crédito ao usuário.
 */
async function buildDownload(
  type: string,
  resume: { id: string; rewrittenContent: string | null; analysisJson: string | null; updatedAt: Date },
  userName: string | null
): Promise<DownloadPayload> {
  const requireRewritten = () => {
    if (!resume.rewrittenContent) {
      throw new DownloadError('Currículo ainda não foi reescrito', 400)
    }
    return resume.rewrittenContent
  }

  const requireAnalysis = () => {
    if (!resume.analysisJson) {
      throw new DownloadError('Análise não disponível', 400)
    }
    return JSON.parse(resume.analysisJson)
  }

  switch (type) {
    case 'resume_pdf':
      return {
        buf: await generateResumePdf(requireRewritten()),
        mime: 'application/pdf',
        filename: `${safeBaseName(userName, 'curriculo')}_curriculo.pdf`,
      }

    case 'resume_md':
      return {
        buf: Buffer.from(sanitizeMarkdown(requireRewritten()), 'utf-8'),
        mime: 'text/markdown; charset=utf-8',
        filename: `${safeBaseName(userName, 'curriculo')}_curriculo.md`,
      }

    case 'resume_txt': {
      const txt = requireRewritten()
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
      return {
        buf: Buffer.from(txt, 'utf-8'),
        mime: 'text/plain; charset=utf-8',
        filename: `${safeBaseName(userName, 'curriculo')}_curriculo.txt`,
      }
    }

    case 'social_advice_txt':
    case 'social_advice_md': {
      const asPlainText = type === 'social_advice_txt'
      const content = buildSocialAdviceContent(requireAnalysis(), asPlainText)
      return {
        buf: Buffer.from(content, 'utf-8'),
        mime: asPlainText ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8',
        filename: `${safeBaseName(userName, 'presenca_digital')}_redes_sociais.${asPlainText ? 'txt' : 'md'}`,
      }
    }

    case 'analysis_pdf':
      return {
        buf: await generateAnalysisReportPdf({
          userName: userName || undefined,
          resumeId: resume.id,
          analysis: requireAnalysis(),
          createdAt: resume.updatedAt,
        }),
        mime: 'application/pdf',
        filename: `${safeBaseName(userName, 'analise')}_laudo.pdf`,
      }

    default:
      throw new DownloadError('Tipo de download inválido', 400)
  }
}

// GET ?resumeId=...&type=resume_pdf|resume_md|analysis_pdf
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const url = new URL(req.url)
    const resumeId = url.searchParams.get('resumeId')
    const type = url.searchParams.get('type') || 'resume_pdf'

    if (!resumeId) return NextResponse.json({ error: 'resumeId obrigatório' }, { status: 400 })

    const resume = await db.resume.findFirst({ where: { id: resumeId, userId: user.id } })
    if (!resume) return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })

    // A cobrança acontece entre a validação e a geração, e não antes de tudo:
    // um pedido inválido (tipo desconhecido, currículo ainda não reescrito)
    // devolve erro sem custar nada, e uma falha na geração libera a reserva.
    //
    // Antes, a rota só cobrava quando já havia saldo — abaixo de 1 crédito o
    // download saía de graça — e a falha da cobrança era engolida por
    // `.catch(() => {})`. A isenção de administrador vive dentro de
    // `reserveCredits`, então não é repetida aqui.
    const costCredits = CREDIT_COSTS.pdf_download

    const reservationResult = await reserveCredits(
      user.id,
      costCredits,
      `Download do currículo em ${type} (${costCredits} cr)`
    )

    if (!reservationResult.success) {
      return NextResponse.json(
        {
          error: reservationResult.error || 'Saldo insuficiente para baixar o arquivo.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: costCredits,
          currentCredits: reservationResult.currentBalance,
        },
        { status: 402 }
      )
    }

    const reservation = reservationResult.reservation

    let payload: DownloadPayload
    try {
      payload = await buildDownload(type, resume, user.name)
    } catch (buildErr) {
      await releaseReservation(reservation, 'Falha ao gerar o arquivo')
      if (buildErr instanceof DownloadError) {
        return NextResponse.json({ error: buildErr.message }, { status: buildErr.status })
      }
      throw buildErr
    }

    await db.auditLog.create({
      data: { userId: user.id, resumeId: resume.id, action: 'download', meta: JSON.stringify({ type }) },
    })

    // Arquivo pronto: só agora a reserva vira cobrança.
    await settleReservation(reservation)

    return new NextResponse(new Uint8Array(payload.buf), {
      headers: {
        'Content-Type': payload.mime,
        'Content-Disposition': `attachment; filename="${payload.filename}"`,
      },
    })
  } catch (e: any) {
    console.error('download error', e)
    return NextResponse.json({ error: 'Erro ao gerar arquivo para download' }, { status: 500 })
  }
}
