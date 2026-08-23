export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { MAX_PDF_BASE64_CHARS, parsePdfBase64, extractPdfWithVision } from '@/lib/pdf-text'

/**
 * Extração do texto do PDF do perfil, separada da análise que o consome.
 *
 * Antes o PDF viajava dentro da requisição de análise, e as duas coisas
 * disputavam o mesmo `maxDuration` de 60s: quando o arquivo não tinha camada de
 * texto não havia orçamento para a transcrição por visão, então a única saída
 * era recusar o arquivo. E, do lado do usuário, uma falha na leitura chegava
 * misturada com uma falha da análise — o mesmo erro genérico para causas
 * completamente diferentes.
 *
 * Separadas, cada uma tem o prazo inteiro para si, e o usuário VÊ o texto
 * extraído antes de rodar a auditoria, podendo corrigi-lo ou completá-lo à mão.
 *
 * A transcrição por visão só é acionada quando a extração local falha, que é o
 * caso raro.
 */

const schema = z.object({
  // O teto duplica o que `parsePdfBase64` já confere, mas atua antes: sem ele,
  // um corpo de centenas de megabytes é lido e mantido em memória inteiro
  // antes de a rota ter chance de recusá-lo.
  pdfBase64: z
    .string()
    .min(1, 'Envie um arquivo PDF.')
    .max(MAX_PDF_BASE64_CHARS, 'O arquivo excede o limite de 10 MB.'),
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

    const decoded = await parsePdfBase64(parsed.data.pdfBase64)

    if (decoded.text.trim()) {
      return NextResponse.json({
        text: decoded.text.trim(),
        method: 'text_layer',
        charCount: decoded.text.trim().length,
      })
    }

    // Arquivo íntegro, conteúdo em imagem: é o único caso em que reprocessar
    // adianta. Nas demais falhas (arquivo corrompido, grande demais, não é PDF)
    // a transcrição por visão receberia o mesmo arquivo ruim.
    if (decoded.code === 'NO_TEXT_LAYER') {
      try {
        const transcribed = await extractPdfWithVision(parsed.data.pdfBase64)
        if (transcribed.trim().length >= 50) {
          return NextResponse.json({
            text: transcribed.trim(),
            method: 'ocr',
            charCount: transcribed.trim().length,
          })
        }
      } catch (visionErr: any) {
        console.error('profile-pdf-text vision failed:', visionErr?.diagnostic || visionErr?.message || visionErr)
      }

      return NextResponse.json(
        {
          error:
            'Este PDF não tem texto selecionável e a leitura automática por imagem também não ' +
            'conseguiu recuperá-lo. Abra seu perfil, selecione o texto do título e da seção ' +
            '"Sobre" e cole no campo de texto abaixo.',
          code: 'NO_TEXT_LAYER',
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: decoded.error || 'Não foi possível ler este PDF.', code: decoded.code || 'INVALID' },
      { status: 400 }
    )
  } catch (e: any) {
    console.error('profile-pdf-text error:', e?.diagnostic || e?.message || e)
    return NextResponse.json(
      {
        error:
          'Falha ao ler o arquivo. Tente enviar novamente ou cole o texto do perfil manualmente.',
        code: 'READ_FAILED',
      },
      { status: 500 }
    )
  }
}
