export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cleanAndOptimizeTextForAi } from '@/lib/ocr/extractor'
import { MAX_PDF_BASE64_CHARS, parsePdfBase64, extractPdfWithVision } from '@/lib/pdf-text'
import { checkResumeContent } from '@/lib/analysis/content-guard'
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_RESUME_CHARS,
  MAX_TARGET_JOB_CHARS,
  socialLinksSchema,
} from '@/lib/validation'

/**
 * Nenhum campo de texto tinha teto.
 *
 * `content`, `targetJob`, `targetJobDescription` e `socialLinks` eram
 * `z.string()` puro, e as colunas correspondentes são `String` sem tamanho no
 * Postgres. O que passava por validação, então, era exatamente o tamanho do
 * corpo da requisição — e quem escolhe esse tamanho é quem envia.
 *
 * Os tetos vivem em `lib/validation.ts` com a justificativa de cada número.
 * Todos são folgados o bastante para não encostar em nenhum currículo real.
 */
const schema = z.object({
  content: z.string().max(MAX_RESUME_CHARS, 'Conteúdo muito longo.').nullable().optional().default(''),
  format: z.enum(['text', 'markdown', 'pdf']).nullable().optional().default('text'),
  title: z.string().max(200).nullable().optional(),
  targetJob: z.string().max(MAX_TARGET_JOB_CHARS, 'Cargo alvo muito longo.').nullable().optional(),
  targetJobDescription: z
    .string()
    .max(MAX_JOB_DESCRIPTION_CHARS, 'Descrição da vaga muito longa.')
    .nullable()
    .optional(),
  socialLinks: socialLinksSchema.nullable().optional(),
  socialConsent: z.boolean().nullable().optional().default(false),
  pdfBase64: z
    .string()
    .max(MAX_PDF_BASE64_CHARS, 'O arquivo PDF é muito grande. O tamanho máximo permitido é 10MB.')
    .nullable()
    .optional(),
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
      /**
       * A leitura passa por `parsePdfBase64`, não mais por `parsePdfBuffer`
       * cru. A diferença é o que a primeira faz ANTES de decodificar:
       *
       *  - confere o tamanho pelo comprimento do base64, sem alocar o buffer;
       *  - recorta o prefixo `data:` de QUALQUER tipo MIME (o recorte fixo em
       *    `application/pdf` que estava aqui deixava
       *    `data:application/octet-stream;base64,` dentro da string, e o
       *    decodificador produzia lixo);
       *  - exige a assinatura `%PDF-` nos primeiros bytes.
       *
       * Essa última é a que faltava. Sem ela, qualquer arquivo — um ZIP, um
       * executável, bytes aleatórios — era entregue ao parser, falhava, e caía
       * na transcrição por VISÃO, que é uma chamada de IA paga. Uma rota que
       * gasta dinheiro com entrada que nem é do tipo declarado.
       */
      const cleanBase64 = pdfBase64.replace(/^data:[^;,]*;base64,/i, '').replace(/\s/g, '')
      const decoded = await parsePdfBase64(pdfBase64)

      if (decoded.text.trim().length >= 30) {
        content = decoded.text.trim()
      } else if (decoded.code && decoded.code !== 'NO_TEXT_LAYER') {
        // Grande demais, vazio, ou não é PDF: reprocessar por visão receberia o
        // mesmo arquivo ruim e cobraria por isso.
        //
        // A mensagem de `INVALID` é reescrita aqui porque a de `parsePdfBase64`
        // fala em "o arquivo gerado pelo próprio LinkedIn" — correto para a
        // rota de perfil, que é de onde ela veio, e desorientador para quem
        // está enviando um currículo.
        const message =
          decoded.code === 'INVALID'
            ? 'O arquivo enviado não é um PDF válido. Confira o arquivo e envie novamente, ' +
              'ou cole o conteúdo do currículo no campo de texto.'
            : decoded.error || 'Não foi possível ler este PDF.'

        return NextResponse.json({ error: message, code: decoded.code }, { status: 400 })
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
