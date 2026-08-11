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
    // `import()` em vez de `require()`: o pacote declara `"type": "module"` e
    // expõe a API por named export. O `require` funcionava por acidente do
    // interop do CommonJS e escondia a falha real — quando ela acontecia, vinha
    // como string vazia, indistinguível de um PDF sem camada de texto.
    //
    // O pacote precisa estar em `serverExternalPackages` no next.config.ts,
    // senão o empacotador quebra o binário nativo e o worker que ele carrega.
    const mod: any = await import('pdf-parse')
    const pdfParse: any = mod?.default ?? mod

    if (mod?.PDFParse || pdfParse?.PDFParse) {
      const PDFParse = mod.PDFParse ?? pdfParse.PDFParse
      const parser = new PDFParse({ data: buffer })
      const res = await parser.getText()
      return typeof res === 'string' ? res : res?.text || ''
    }
    if (typeof pdfParse === 'function') {
      const res = await pdfParse(buffer)
      return res.text || ''
    }

    console.error('pdf-parse carregado sem API reconhecida:', Object.keys(mod || {}))
  } catch (e: any) {
    // Registrado com a pilha: sem ela, uma falha de carregamento do pacote e um
    // PDF de fato ilegível produzem exatamente o mesmo sintoma.
    console.error('Failed to parse PDF buffer:', e?.stack || e?.message || e)
  }
  return ''
}

/** Teto de tamanho do PDF aceito, em bytes decodificados. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024

export interface PdfDecodeResult {
  text: string
  error?: string
  /**
   * Causa da falha, para que o chamador possa reagir a cada uma de um jeito
   * diferente. `NO_TEXT_LAYER` é a única recuperável: é o PDF que existe e está
   * íntegro, mas cujo conteúdo é imagem — o caso que `extractPdfWithVision`
   * resolve. As demais não adianta reprocessar.
   */
  code?: 'EMPTY' | 'TOO_LARGE' | 'INVALID' | 'NO_TEXT_LAYER'
}

/**
 * Decodifica um PDF em base64 e extrai o texto, recusando entradas grandes
 * demais antes de gastar CPU com elas.
 */
export async function parsePdfBase64(base64: string): Promise<PdfDecodeResult> {
  // O prefixo `data:` pode vir com qualquer tipo MIME: o navegador nem sempre
  // rotula o arquivo como `application/pdf`. Recortar só o prefixo exato
  // deixava `data:application/octet-stream;base64,` dentro da string, e o
  // decodificador produzia lixo — um PDF perfeitamente válido chegava aqui como
  // "não foi possível extrair texto".
  const cleaned = base64.replace(/^data:[^;,]*;base64,/i, '').replace(/\s/g, '').trim()
  if (!cleaned) return { text: '', error: 'Arquivo vazio.', code: 'EMPTY' }

  // 4 caracteres de base64 codificam 3 bytes; evita alocar o buffer para saber.
  const approxBytes = Math.floor((cleaned.length * 3) / 4)
  if (approxBytes > MAX_PDF_BYTES) {
    return { text: '', error: 'O arquivo excede o limite de 10 MB.', code: 'TOO_LARGE' }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(cleaned, 'base64')
  } catch {
    return { text: '', error: 'Arquivo PDF inválido.', code: 'INVALID' }
  }

  // Todo PDF começa com `%PDF`. Sem esta checagem, um arquivo que não é PDF —
  // ou um base64 truncado no caminho — chegava ao fim com a mensagem genérica
  // de "não foi possível extrair texto", que manda o usuário procurar defeito
  // no lugar errado.
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return {
      text: '',
      error: 'O arquivo enviado não é um PDF válido. Envie o arquivo gerado pelo próprio LinkedIn.',
      code: 'INVALID',
    }
  }

  const text = await parsePdfBuffer(buffer)
  if (!text.trim()) {
    return {
      text: '',
      error:
        'Este PDF não tem texto selecionável — provavelmente é uma imagem ou digitalização. ' +
        'Copie e cole o texto do perfil no campo abaixo.',
      code: 'NO_TEXT_LAYER',
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
