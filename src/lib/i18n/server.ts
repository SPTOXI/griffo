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
 * ATS relevantes por mercado.
 *
 * A lista era fixa e brasileira — a Gupy aparecia cinco vezes no prompt de
 * análise. Recomendar palavras-chave otimizadas para os filtros da Gupy a um
 * candidato nos EUA não é apenas inútil: é conselho errado, que pode piorar a
 * triagem dele.
 */
export const ATS_BY_MARKET: Record<Language, string> = {
  pt: 'Gupy, Catho, Vagas.com, InfoJobs Brasil, LinkedIn Talent Solutions, Workday, Greenhouse',
  en: 'Workday, Taleo, Greenhouse, Lever, iCIMS, SmartRecruiters, Ashby, LinkedIn Talent Solutions',
  es: 'InfoJobs, Bumeran, Computrabajo, Tecnoempleo, LinkedIn Talent Solutions, Workday, Greenhouse',
}

/** Plataformas de presença digital relevantes por mercado. */
export const SOCIAL_PLATFORMS_BY_MARKET: Record<Language, string> = {
  pt: 'LinkedIn, Gupy, GitHub, Behance, Portfólio próprio',
  en: 'LinkedIn, GitHub, Behance, Dribbble, Stack Overflow, personal portfolio',
  es: 'LinkedIn, InfoJobs, GitHub, Behance, portafolio propio',
}
