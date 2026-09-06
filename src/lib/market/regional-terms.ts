/**
 * Vocabulário regional dentro do MESMO idioma.
 *
 * ## O problema que isto resolve
 *
 * `market.jobLanguage` resolve o IDIOMA da página (`/gb`, `/au` e `/us` são
 * todos `en`), mas não o VOCABULÁRIO. Quem procura emprego no Reino Unido
 * digita "CV"; quem procura nos EUA digita "resume" — são a mesma coisa com
 * nomes diferentes, e uma página em inglês que só diz "resume" simplesmente
 * não bate com a busca de quem escreveu "CV".
 *
 * Isso não é risco de SEO (o hreflang já declara as rotas como variantes
 * legítimas do mesmo conteúdo, e o Google não pune isso) — é intenção de
 * busca que passa batido. Daí este módulo existir só para o texto que aparece
 * no RESULTADO da busca (`<title>`, description, keywords), que é onde o
 * termo precisa bater.
 *
 * ## Por que a lista é curta de propósito
 *
 * Só entram mercados onde a convenção é inequívoca e verificável, não onde
 * "os dois termos aparecem". Índia, Singapura, Filipinas, Malásia e Nigéria
 * usam os dois de forma intercambiável dependendo do setor — chutar um lado
 * ali trocaria um texto correto por um palpite, então esses ficam no padrão
 * (`resume`) e não são listados aqui. A regra do projeto contra inventar dado
 * vale para vocabulário também.
 */

export type ResumeTerm = {
  /** Como o documento se chama no mercado. Ex.: 'CV' no Reino Unido. */
  noun: string
  /** O mesmo termo em minúscula, para uso no meio de uma frase. */
  nounLower: string
}

const CV: ResumeTerm = { noun: 'CV', nounLower: 'CV' }
const RESUME: ResumeTerm = { noun: 'Resume', nounLower: 'resume' }

/**
 * Como o documento se chama em cada idioma.
 *
 * Vem do mesmo vocabulário que os dicionários de `i18n/locales/` já usam no
 * texto da página — é a palavra que aquele público digita na busca
 * ("Lebenslauf", não "resume"). Antes disso, as keywords de TODA rota eram
 * "curriculo" + "resume" fixos, então nenhuma página não-PT/EN declarava o
 * próprio termo.
 */
const NATIVE_TERM: Record<string, ResumeTerm> = {
  pt: { noun: 'Currículo', nounLower: 'currículo' },
  es: { noun: 'Currículum', nounLower: 'currículum' },
  de: { noun: 'Lebenslauf', nounLower: 'Lebenslauf' },
  fr: { noun: 'CV', nounLower: 'CV' },
  it: { noun: 'Curriculum', nounLower: 'curriculum' },
  ja: { noun: '職務経歴書', nounLower: '職務経歴書' },
  nl: { noun: 'Cv', nounLower: 'cv' },
  sv: { noun: 'CV', nounLower: 'CV' },
  zh: { noun: '简历', nounLower: '简历' },
  ar: { noun: 'السيرة الذاتية', nounLower: 'السيرة الذاتية' },
  ko: { noun: '이력서', nounLower: '이력서' },
}

/**
 * Mercados de língua inglesa onde "CV" — não "resume" — é o termo padrão
 * para o documento de candidatura.
 *
 * Reino Unido, Irlanda, Austrália, Nova Zelândia e África do Sul seguem a
 * convenção britânica: "CV" é o termo corrente no mercado de trabalho geral
 * (diferente do uso acadêmico restrito que "CV" tem nos EUA/Canadá, onde o
 * documento comum continua sendo "resume").
 */
const CV_MARKETS = new Set(['GB', 'IE', 'AU', 'NZ', 'ZA'])

/**
 * O termo certo para o documento, no idioma da rota — e, dentro do inglês,
 * no país da rota.
 *
 * A divisão CV/resume só existe dentro do inglês: nos outros 11 idiomas há
 * uma palavra nativa única, sem variação regional que valha diferenciar
 * (`Lebenslauf` vale para DE e AT; `currículo` para BR e PT).
 */
export function resumeTermFor(countryCode: string, lang: string): ResumeTerm {
  if (lang !== 'en') return NATIVE_TERM[lang] ?? RESUME
  return CV_MARKETS.has(countryCode.toUpperCase()) ? CV : RESUME
}
