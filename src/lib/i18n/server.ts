import { Language, LANGUAGES } from './index'

/**
 * Idioma e contexto de mercado para as rotas de IA.
 *
 * O idioma chega pelo cabeçalho `X-Griffo-Lang`, que o `internalFetch` anexa
 * automaticamente em toda chamada do cliente.
 */

const SUPPORTED: Language[] = LANGUAGES

export function getRequestLanguage(req: Request): Language {
  const header = req.headers.get('x-griffo-lang')?.toLowerCase().trim()
  if (header && (SUPPORTED as string[]).includes(header)) {
    return header as Language
  }
  return 'pt'
}

/** Instrução de idioma injetada em todo prompt de IA. */
export const LANGUAGE_DIRECTIVE: Record<Language, string> = {
  pt: 'IDIOMA DA RESPOSTA: responda integralmente em Português do Brasil (pt-BR), inclusive os textos dentro do JSON.',
  en: 'RESPONSE LANGUAGE: respond entirely in English (en-US), including all text inside the JSON.',
  es: 'IDIOMA DE LA RESPUESTA: responde íntegramente en Español (es), incluidos los textos dentro del JSON.',
  de: 'ANTWORTSPRACHE: Antworten Sie vollständig auf Deutsch (de-DE), einschließlich aller Texte innerhalb des JSON.',
  fr: 'LANGUE DE RÉPONSE: Répondez entièrement en Français (fr-FR), y compris tous les textes à l\'intérieur du JSON.',
  it: 'LINGUA DI RISPOSTA: Rispondi interamente in Italiano (it-IT), inclusi tutti i testi all\'interno del JSON.',
  ja: '応答言語: すべてのJSON内テキストを含め、完全に日本語（ja-JP）で回答してください。',
}
