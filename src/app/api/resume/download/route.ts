import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hasActivePlan } from '@/lib/auth'
import { generateResumePdf, generateAnalysisReportPdf, sanitizeMarkdown } from '@/lib/pdf'

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

    // Downloads require active plan (paid)
    if (!hasActivePlan(user)) {
      return NextResponse.json({ error: 'Assine um plano para baixar.', code: 'PLAN_REQUIRED' }, { status: 403 })
    }

    await db.auditLog.create({
      data: { userId: user.id, resumeId: resume.id, action: 'download', meta: JSON.stringify({ type }) },
    })

    if (type === 'resume_pdf') {
      if (!resume.rewrittenContent) return NextResponse.json({ error: 'Currículo ainda não foi reescrito' }, { status: 400 })
      const buf = await generateResumePdf(resume.rewrittenContent)
      const safeName = (user.name || 'curriculo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      return new NextResponse(buf, {
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
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}_curriculo.md"`,
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
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_laudo.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: 'Tipo de download inválido' }, { status: 400 })
  } catch (e: any) {
    console.error('download error', e)
    return NextResponse.json({ error: 'Erro ao gerar download.' }, { status: 500 })
  }
}
