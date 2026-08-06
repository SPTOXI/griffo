export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const url = new URL(req.url)
    const paramObj = await params
    const id = paramObj?.id || url.searchParams.get('id')

    if (id) {
      const resume = await db.resume.findFirst({
        where: { id, userId: user.id },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          originalContent: true,
          originalFormat: true,
          analysisJson: true,
          rewrittenContent: true,
          careerOrientationJson: true,
        },
      })
      if (!resume) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
      let analysis = null
      if (resume.analysisJson) {
        try { analysis = JSON.parse(resume.analysisJson) } catch { analysis = null }
      }
      let careerOrientation = null
      if (resume.careerOrientationJson) {
        try { careerOrientation = JSON.parse(resume.careerOrientationJson) } catch { careerOrientation = null }
      }
      return NextResponse.json({ resume: { ...resume, analysis, careerOrientation } })
    }

    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        originalFormat: true,
      },
    })
    return NextResponse.json({ resumes })
  } catch (e: unknown) {
    console.error('get resume error', e)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const url = new URL(req.url)
    const paramObj = await params
    const id = paramObj?.id || url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID do currículo obrigatório' }, { status: 400 })

    const resume = await db.resume.findFirst({ where: { id, userId: user.id } })
    if (!resume) return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 })

    await db.resume.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('delete resume error', e)
    return NextResponse.json({ error: 'Erro ao remover currículo' }, { status: 500 })
  }
}
