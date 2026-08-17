import type { Language } from './index'

/**
 * Idioma e contexto de mercado para as rotas de IA.
 *
 * A interface já era trilíngue, mas nenhuma rota de IA recebia o idioma: três
 * prompts fixavam português, e a análise não declarava idioma nenhum — o que
 * deixava a saída indefinida quando o currículo vinha em outro idioma. Um
 * usuário em inglês recebia o currículo reescrito em português.
 *
 * O idioma chega pelo cabeçalho `X-Griffo-Lang`, que o `internalFetch` anexa
 * automaticamente em toda chamada do cliente.
 */

const SUPPORTED: Language[] = ['pt', 'en', 'es']

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
}

/**
 * ATS e plataformas por mercado saíram daqui.
 *
 * Estavam indexados por `Language`, o que fazia o IDIOMA DA INTERFACE decidir
 * qual mercado de trabalho o produto descrevia. No caso mais comum de um
 * produto global — pessoa no Brasil, interface em português, mirando vaga nos
 * Estados Unidos — isso devolvia palavra-chave otimizada para a Gupy a quem
 * será triado pelo Workday.
 *
 * Agora quem responde por isso é `lib/market/`, que resolve o mercado a partir
 * do alvo profissional declarado, depois da residência, e só então do idioma.
 * Ver `resolveMarket` e `marketPromptContext`.
 */
