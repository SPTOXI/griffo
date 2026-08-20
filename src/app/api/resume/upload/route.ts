export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cleanAndOptimizeTextForAi } from '@/lib/ocr/extractor'
import { parsePdfBuffer, extractPdfWithVision } from '@/lib/pdf-text'
import { checkResumeContent } from '@/lib/analysis/content-guard'

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
    let pdfWasScanned = false
    let visionUsed = false

    // Server-side PDF extraction if pdfBase64 is supplied
    if (pdfBase64) {
      // Limit PDF size to 10MB (base64 is ~33% larger than binary)
      const MAX_PDF_BASE64_SIZE = 14 * 1024 * 1024 // ~10MB binary
      if (pdfBase64.length > MAX_PDF_BASE64_SIZE) {
        return NextResponse.json(
          { error: 'O arquivo PDF é muito grande. O tamanho máximo permitido é 10MB.' },
          { status: 400 }
        )
      }

      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
      const buffer = Buffer.from(cleanBase64, 'base64')
      const extractedText = await parsePdfBuffer(buffer)

      if (extractedText && extractedText.trim().length >= 30) {
        content = extractedText.trim()
      } else {
        /**
         * PDF sem camada de texto — digitalização ou foto.
         *
         * A condição aqui era `else if (!content || content.length < 50)`:
         * a transcrição por imagem só era tentada quando o conteúdo vindo da
         * TELA era curto. Só que a tela mandava um marcador de uns 90
         * caracteres ao anexar um PDF, então a condição era falsa exatamente
         * quando mais precisava ser verdadeira — a transcrição era pulada, o
         * marcador seguia como conteúdo, e o laudo saía sobre um nome de
         * arquivo.
         *
         * Quem decide se o PDF precisa de transcrição é o RESULTADO DA
         * EXTRAÇÃO, e nada mais.
         */
        pdfWasScanned = true
        try {
          const transcribed = await extractPdfWithVision(cleanBase64)
          if (transcribed.length >= 50) {
            content = transcribed
            visionUsed = true
          }
        } catch (visionErr: any) {
          console.error('Vision extraction failed:', visionErr?.message || visionErr)
        }
      }
    }

    if (content) {
      content = cleanAndOptimizeTextForAi(content)
    }

    // O piso de 50 caracteres deixava passar o marcador que a tela escrevia. A
    // guarda agora é a mesma que a análise usa, e reconhece marcador por
    // formato — inclusive nos currículos que já foram gravados com ele.
    const analyzable = (content ?? '').trim()
    const verdict = checkResumeContent(analyzable)
    if (!verdict.analyzable) {
      // Mensagem por causa, não por sintoma.
      if (pdfWasScanned) {
        return NextResponse.json(
          {
            error:
              'Este PDF não tem texto selecionável — parece ser uma digitalização ou foto — e a ' +
              'leitura automática não conseguiu recuperá-lo. Envie o arquivo original em texto, ' +
              'exporte novamente do editor onde o currículo foi escrito, ou cole o conteúdo no ' +
              'campo de texto.',
            code: 'PDF_WITHOUT_TEXT_LAYER',
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: verdict.message, code: verdict.code },
        { status: 400 }
      )
    }

    const resume = await db.resume.create({
      data: {
        userId: user.id,
        originalContent: analyzable,
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
        meta: JSON.stringify({ format, length: analyzable.length, socialConsent, visionUsed }),
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
