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
 * Limitação conhecida: PDF sem camada de texto (escaneado) devolve string
 * vazia. Detectar isso e rotear para um modelo com visão é P8, ainda pendente.
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
