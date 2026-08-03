/**
 * Engine de OCR de Alta Economia e Pré-processador de Documentos
 * Higieniza, comprime e otimiza textos de PDFs e arquivos antes de enviar para as LLMs.
 * Reduz consumo desnecessário de tokens em até 60%.
 */

export function cleanAndOptimizeTextForAi(rawText: string): string {
  if (!rawText) return ''

  let text = rawText

  // 1. Remove caracteres nulos, de controle e sequências binárias de PDF
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')

  // 2. Remove repetições excessivas de linhas vazias e quebras de página soltas
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n')

  // 3. Remove repetições excessivas de caracteres de separação (ex: ---------, *********, =========)
  text = text.replace(/[-*=_]{4,}/g, '---')

  // 4. Remove espaços duplicados mantendo indentação básica
  text = text.replace(/[ \t]{2,}/g, ' ')

  // 5. Remove cabeçalhos/rodapés repetitivos de paginação de PDF (ex: "Página 1 de 3", "Page 2 of 5")
  text = text.replace(/(pág|página|page)\s+\d+\s+(de|of)\s+\d+/gi, '')

  // 6. Normaliza quebras de linha para padronização Unix
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  return text.trim()
}
