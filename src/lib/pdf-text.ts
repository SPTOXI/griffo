import 'server-only'

/**
 * Extração de texto de PDF.
 *
 * Estava embutida na rota de upload; foi extraída para cá porque a análise de
 * presença digital precisa da mesma coisa — o LinkedIn não permite leitura
 * automática, mas gera um PDF do próprio perfil em "Mais → Salvar como PDF",
 * e esse arquivo passa pelo mesmo caminho de um currículo.
 *
 * A biblioteca `pdf-parse` mudou de formato entre versões (função direta numa,
 * classe `PDFParse` noutra); as duas formas são tratadas.
 *
 * PDF sem camada de texto (escaneado) devolve string vazia aqui — é o caso que
 * `extractPdfWithVision` cobre.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
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

/** Teto de tamanho do PDF aceito, em bytes decodificados. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024

export interface PdfDecodeResult {
  text: string
  error?: string
}

/**
 * Decodifica um PDF em base64 e extrai o texto, recusando entradas grandes
 * demais antes de gastar CPU com elas.
 */
export async function parsePdfBase64(base64: string): Promise<PdfDecodeResult> {
  const cleaned = base64.replace(/^data:application\/pdf;base64,/, '').trim()
  if (!cleaned) return { text: '', error: 'Arquivo vazio.' }

  // 4 caracteres de base64 codificam 3 bytes; evita alocar o buffer para saber.
  const approxBytes = Math.floor((cleaned.length * 3) / 4)
  if (approxBytes > MAX_PDF_BYTES) {
    return { text: '', error: 'O arquivo excede o limite de 10 MB.' }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(cleaned, 'base64')
  } catch {
    return { text: '', error: 'Arquivo PDF inválido.' }
  }

  const text = await parsePdfBuffer(buffer)
  if (!text.trim()) {
    return {
      text: '',
      error:
        'Não foi possível extrair texto deste PDF. Se ele for uma imagem escaneada, ' +
        'cole o texto do perfil manualmente.',
    }
  }

  return { text }
}

/**
 * Extrai o texto de um PDF sem camada de texto, enviando o arquivo ao modelo.
 *
 * O "Agente de Economia & OCR" do projeto é regex: limpa e normaliza texto que
 * já existe, mas não faz OCR. Um currículo escaneado — foto ou digitalização —
 * chegava aqui vazio, e o upload respondia "conteúdo muito curto", que descreve
 * o sintoma e esconde a causa: o usuário reenviava o mesmo arquivo sem entender.
 *
 * Só é acionada quando a extração local falha, porque custa uma chamada de IA e
 * a esmagadora maioria dos PDFs tem camada de texto.
 */
export async function extractPdfWithVision(base64: string): Promise<string> {
  const { executeAiTask } = await import('./ai-router/router')

  const result = await executeAiTask({
    taskType: 'ocr_extraction',
    internal: true,
    pdfBase64: base64.replace(/^data:application\/pdf;base64,/, '').trim(),
    systemPrompt:
      'Você transcreve currículos. Devolva TODO o texto do documento, preservando a ordem e a ' +
      'separação entre seções. Não resuma, não comente, não reescreva: transcreva. ' +
      'Se o documento não for um currículo, transcreva mesmo assim.',
    userPrompt: 'Transcreva integralmente o texto deste documento.',
    maxTokens: 8000,
  })

  return result.content.trim()
}
