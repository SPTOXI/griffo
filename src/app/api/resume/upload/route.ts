import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cleanAndOptimizeTextForAi } from '@/lib/ocr/extractor'

const schema = z.object({
  content: z.string().nullable().optional().default(''),
  format: z.enum(['text', 'markdown', 'pdf']).nullable().optional().default('text'),
  title: z.string().nullable().optional(),
  targetJob: z.string().nullable().optional(),
  targetJobDescription: z.string().nullable().optional(),
  socialLinks: z.record(z.string(), z.string()).nullable().optional(),
  socialConsent: z.boolean().nullable().optional().default(false),
  pdfBase64: z.string().nullable().optional(),
})

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse')
    if (typeof pdfParse === 'function') {
      const res = await pdfParse(buffer)
      return res.text || ''
    }
    if (pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: buffer })
      const res = await parser.getText()
      return typeof res === 'string' ? res : res?.text || ''
    }
  } catch (e: any) {
    console.error('Failed to parse PDF buffer:', e?.message || e)
  }
  return ''
}

export async function OPTIONS(req: Request) {
  // Respond to preflight requests for CORS
  return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

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

    const { format, targetJob, targetJobDescription, socialLinks, socialConsent, pdfBase64 } = parsed.data
    let content = parsed.data.content

    // Server-side PDF extraction if pdfBase64 is supplied
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
      const buffer = Buffer.from(cleanBase64, 'base64')
      const extractedText = await parsePdfBuffer(buffer)
      if (extractedText && extractedText.trim().length >= 30) {
        content = extractedText.trim()
      }
    }

    if (content) {
      content = cleanAndOptimizeTextForAi(content)
    }

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Conteúdo do currículo muito curto. Forneça pelo menos 50 caracteres de texto.' },
        { status: 400 }
      )
    }

    const resume = await db.resume.create({
      data: {
        userId: user.id,
        originalContent: content,
        originalFormat: format || 'text',
        targetJob: targetJob || null,
        targetJobDescription: targetJobDescription || null,
        socialLinksJson: socialLinks ? JSON.stringify(socialLinks) : null,
        socialConsent: socialConsent || false,
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

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ resumes })
  } catch (e: any) {
    console.error('fetch resumes error', e)
    return NextResponse.json({ error: 'Erro ao buscar currículos.' }, { status: 500 })
  }
}
