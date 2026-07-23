import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const schema = z.object({
  content: z.string().min(80).max(30000),
  format: z.enum(['text', 'markdown', 'pdf']).default('text'),
  title: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  socialConsent: z.boolean().default(false),
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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const { content, format, socialLinks, socialConsent } = parsed.data

    const resume = await db.resume.create({
      data: {
        userId: user.id,
        originalContent: content,
        originalFormat: format,
        socialLinksJson: socialLinks ? JSON.stringify(socialLinks) : null,
        socialConsent: socialConsent || false,
        status: 'draft',
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'upload',
        meta: JSON.stringify({ format, length: content.length, socialConsent }),
      },
    })

    return NextResponse.json({ resume })
  } catch (e: any) {
    console.error('upload error', e)
    return NextResponse.json({ error: 'Erro ao salvar currículo.' }, { status: 500 })
  }
}
