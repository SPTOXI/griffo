import type { Language } from '@/lib/i18n'

/**
 * Como se diz "busca de emprego" no idioma da tela — e por que a hashtag não
 * entra aqui.
 *
 * ## A hashtag fica em inglês, o termo é que muda
 *
 * `#OpenToWork` e `#JobHunting` circulam **em inglês** em todos os mercados:
 * é o selo do LinkedIn, e o selo não se traduz na hashtag. O que muda de
 * idioma é o rótulo descritivo — o LinkedIn alemão diz "Offen für
 * Jobangebote", o francês "Ouvert aux opportunités".
 *
 * É exatamente o padrão que o §2.83 achou para "ATS": quem escreve sobre o
 * assunto usa a sigla em inglês **junto** do termo nativo, nunca um dos dois
 * sozinho. Por isso as `keywords` de `/hiring` levam os dois — a hashtag como
 * está, mais o termo daqui.
 *
 * ## Duas distinções que erram o público se forem trocadas
 *
 * **Japonês: `転職活動`, não `就職活動`.** O segundo é a caça a emprego de
 * recém-formado, que no Japão acontece num calendário anual fixo e onde a
 * empresa avalia potencial. O primeiro é a mudança de carreira, com timing
 * próprio, onde a empresa procura `即戦力` (quem já entrega). O público do
 * GriffoWork é o segundo. Trocar miraria estudante.
 *
 * **Chinês: `求职`, não `跳槽`.** `跳槽` é "pular de emprego" e carrega a
 * conotação de sair antes de cumprir o contrato — palavra de conversa, não de
 * página institucional. `求职` é o termo neutro.
 *
 * Coreano leva `구직` (procurar trabalho) e `이직` (trocar de emprego) porque
 * os dois cobrem meio de carreira, que é o público.
 */
const JOB_SEARCH_TERM: Record<Language, string[]> = {
  pt: ['busca de emprego', 'procurando emprego', 'recolocação profissional'],
  en: ['job hunting', 'job search', 'open to work'],
  es: ['búsqueda de empleo', 'buscar trabajo'],
  de: ['Jobsuche', 'Stellensuche', 'Bewerbung'],
  fr: ["recherche d'emploi", 'chercher un emploi'],
  it: ['ricerca di lavoro', 'cercare lavoro'],
  ja: ['転職活動', '転職'],
  nl: ['op zoek naar werk', 'solliciteren'],
  sv: ['jobbsökande', 'söka jobb'],
  zh: ['求职', '找工作'],
  ar: ['البحث عن عمل', 'البحث عن وظيفة'],
  ko: ['구직', '이직'],
}

/** As hashtags, que não se traduzem. */
export const JOB_SEARCH_HASHTAGS = ['open to work', 'opentowork', 'job hunting'] as const

/**
 * As keywords de busca de emprego para o idioma: as hashtags em inglês mais
 * os termos nativos. Nunca só um dos dois — ver o cabeçalho.
 */
export function jobSearchKeywords(lang: Language): string[] {
  return [...JOB_SEARCH_HASHTAGS, ...(JOB_SEARCH_TERM[lang] ?? JOB_SEARCH_TERM.en)]
}
