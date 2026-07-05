import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (id) {
      const resume = await db.resume.findFirst({
        where: { id, userId: user.id },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          originalContent: true,
          originalFormat: true,
          analysisJson: true,
          rewrittenContent: true,
        },
      })
      if (!resume) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
      let analysis = null
      if (resume.analysisJson) {
        try { analysis = JSON.parse(resume.analysisJson) } catch { analysis = null }
      }
      return NextResponse.json({ resume: { ...resume, analysis } })
    }

    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        originalFormat: true,
      },
    })
    return NextResponse.json({ resumes })
  } catch (e: any) {
    console.error('resume get error', e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const resume = await db.resume.findFirst({ where: { id, userId: user.id } })
    if (!resume) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    await db.resume.delete({ where: { id } })
    await db.auditLog.create({ data: { userId: user.id, action: 'resume_delete', meta: JSON.stringify({ resumeId: id }) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('resume delete error', e)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
