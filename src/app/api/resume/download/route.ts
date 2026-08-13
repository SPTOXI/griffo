export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateResumePdf, generateAnalysisReportPdf, sanitizeMarkdown } from '@/lib/pdf'
import { requireUnlockedResume } from '@/lib/entitlements'

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

/**
 * Monta o arquivo da auditoria de presença digital.
 *
 * Passou a ler `socialAnalysisJson`, produzido pela rota `social-analysis`,
 * que visita os perfis. Antes lia `analysis.socialAdvice`, gerado junto da
 * análise de 8 dimensões sem abrir nenhum perfil — o arquivo exportado tinha a
 * mesma aparência de um laudo, sem nada por trás.
 *
 * Cada perfil sai marcado como lido ou não lido: a distinção precisa sobreviver
 * à exportação, senão o documento que o candidato leva embora perde justamente
 * a informação que diz o quanto confiar nele.
 */
function buildSocialAdviceContent(socialAnalysis: any, asPlainText: boolean): string {
  const profiles = Array.isArray(socialAnalysis?.profiles) ? socialAnalysis.profiles : []
  if (profiles.length === 0) {
    throw new DownloadError(
      'Nenhuma auditoria de presença digital disponível. Execute a auditoria na aba de redes sociais.',
      400
    )
  }

  let content = `# Auditoria de Presença Digital\n\n`

  if (socialAnalysis.overallAssessment) {
    content += `## Avaliação geral\n${socialAnalysis.overallAssessment}\n\n---\n\n`
  }

  for (const item of profiles) {
    content += `## ${item.platform}\n`
    content += `URL: ${item.url}\n`
    content += `Perfil lido: ${item.analyzed ? 'sim' : 'não — orientação geral'}\n\n`
    if (item.findings) content += `### 🔎 O que encontramos\n${item.findings}\n\n`
    if (item.headline) content += `### 💡 Título Sugerido\n${item.headline}\n\n`
    if (item.aboutSummary) content += `### 📝 Texto "Sobre" / Bio\n${item.aboutSummary}\n\n`
    if (item.tips && item.tips.length > 0) {
      content += `### 🚀 Ações Recomendadas\n`
      for (const tip of item.tips) {
        content += `- ${tip}\n`
      }
      content += `\n`
    }
    content += `---\n\n`
  }

  if (socialAnalysis.analyzedAt) {
    content += `Auditoria realizada em ${new Date(socialAnalysis.analyzedAt).toLocaleString('pt-BR')}\n`
  }

  return asPlainText
    ? content.replace(/^#+\s+/gm, '').replace(/---/g, '==============')
    : content
}

/**
 * Monta o arquivo pedido. Lança `DownloadError` quando o pedido não pode ser
 * atendido.
 */
async function buildDownload(
  type: string,
  resume: {
    id: string
    rewrittenContent: string | null
    analysisJson: string | null
    socialAnalysisJson: string | null
    updatedAt: Date
  },
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

  const requireSocialAnalysis = () => {
    if (!resume.socialAnalysisJson) {
      throw new DownloadError(
        'Auditoria de presença digital não disponível. Execute-a na aba de redes sociais.',
        400
      )
    }
    return JSON.parse(resume.socialAnalysisJson)
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
      const content = buildSocialAdviceContent(requireSocialAnalysis(), asPlainText)
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

    // O download é o nono item da Análise Completa. Baixar o mesmo currículo
    // dez vezes não custa nada — o que se comprou foi a análise, não o arquivo.
    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    let payload: DownloadPayload
    try {
      payload = await buildDownload(type, resume, user.name)
    } catch (buildErr) {
      if (buildErr instanceof DownloadError) {
        return NextResponse.json({ error: buildErr.message }, { status: buildErr.status })
      }
      throw buildErr
    }

    await db.auditLog.create({
      data: { userId: user.id, resumeId: resume.id, action: 'download', meta: JSON.stringify({ type }) },
    })

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
