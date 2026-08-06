import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateResumePdf, generateAnalysisReportPdf, sanitizeMarkdown } from '@/lib/pdf'
import { deductCredits, CREDIT_COSTS } from '@/lib/credits'

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

    // Deduct credit if user has balance, but allow download if user created the content
    const costCredits = CREDIT_COSTS.pdf_download

    if (!user.role || user.role !== 'admin') {
      if ((user.credits || 0) >= costCredits) {
        await deductCredits(
          user.id,
          costCredits,
          `Download do currículo em ${type} (${costCredits} cr)`
        ).catch(() => {})
      }
    }

    await db.auditLog.create({
      data: { userId: user.id, resumeId: resume.id, action: 'download', meta: JSON.stringify({ type }) },
    })

    if (type === 'resume_pdf') {
      if (!resume.rewrittenContent) return NextResponse.json({ error: 'Currículo ainda não foi reescrito' }, { status: 400 })
      const buf = await generateResumePdf(resume.rewrittenContent)
      const safeName = (user.name || 'curriculo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_curriculo.pdf"`,
        },
      })
    }

    if (type === 'resume_md') {
      if (!resume.rewrittenContent) return NextResponse.json({ error: 'Currículo ainda não foi reescrito' }, { status: 400 })
      const md = sanitizeMarkdown(resume.rewrittenContent)
      const buf = Buffer.from(md, 'utf-8')
      const safeName = (user.name || 'curriculo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}_curriculo.md"`,
        },
      })
    }

    if (type === 'resume_txt') {
      if (!resume.rewrittenContent) return NextResponse.json({ error: 'Currículo ainda não foi reescrito' }, { status: 400 })
      // Strip basic markdown hashes and stars for clean plain text
      const txt = resume.rewrittenContent
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
      const buf = Buffer.from(txt, 'utf-8')
      const safeName = (user.name || 'curriculo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}_curriculo.txt"`,
        },
      })
    }

    if (type === 'social_advice_txt' || type === 'social_advice_md') {
      if (!resume.analysisJson) return NextResponse.json({ error: 'Análise não disponível' }, { status: 400 })
      const analysis = JSON.parse(resume.analysisJson)
      const socialAdvice = Array.isArray(analysis.socialAdvice) ? analysis.socialAdvice : []
      if (socialAdvice.length === 0) return NextResponse.json({ error: 'Nenhum conselho de rede social disponível neste laudo' }, { status: 400 })

      let contentStr = `# Otimização de Presença Digital & Redes Sociais\n\n`
      for (const item of socialAdvice) {
        contentStr += `## ${item.platform}\n`
        contentStr += `URL: ${item.url}\n\n`
        if (item.headline) contentStr += `### 💡 Título Sugerido\n${item.headline}\n\n`
        if (item.aboutSummary) contentStr += `### 📝 Texto "Sobre" / Bio\n${item.aboutSummary}\n\n`
        if (item.tips && item.tips.length > 0) {
          contentStr += `### 🚀 Dicas de Otimização & Algoritmo\n`
          for (const tip of item.tips) {
            contentStr += `- ${tip}\n`
          }
          contentStr += `\n`
        }
        contentStr += `---\n\n`
      }

      if (type === 'social_advice_txt') {
        contentStr = contentStr.replace(/^#+\s+/gm, '').replace(/---/g, '==============')
      }

      const ext = type === 'social_advice_txt' ? 'txt' : 'md'
      const mime = type === 'social_advice_txt' ? 'text/plain' : 'text/markdown'
      const buf = Buffer.from(contentStr, 'utf-8')
      const safeName = (user.name || 'presenca_digital').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': `${mime}; charset=utf-8`,
          'Content-Disposition': `attachment; filename="${safeName}_redes_sociais.${ext}"`,
        },
      })
    }

    if (type === 'analysis_pdf') {
      if (!resume.analysisJson) return NextResponse.json({ error: 'Análise não disponível' }, { status: 400 })
      const analysis = JSON.parse(resume.analysisJson)
      const buf = await generateAnalysisReportPdf({
        userName: user.name || undefined,
        resumeId: resume.id,
        analysis,
        createdAt: resume.updatedAt,
      })
      const safeName = (user.name || 'analise').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_laudo.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: 'Tipo de download inválido' }, { status: 400 })
  } catch (e: any) {
    console.error('download error', e)
    return NextResponse.json({ error: 'Erro ao gerar arquivo para download' }, { status: 500 })
  }
}
