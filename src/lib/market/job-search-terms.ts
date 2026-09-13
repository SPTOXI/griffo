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
 *
 * ## "Entrevista de emprego" — adicionado em 09/09/2026, dado externo
 *
 * Levantamento de share-of-search por país (8 termos de carreira, fornecido
 * pelo operador) mostrou "job interview" como a SEGUNDA maior fatia de busca
 * no Brasil (73%, atrás só de "job application") e dominante isolado numa
 * faixa de países que inclui quase toda a América Latina e parte do Leste
 * Europeu/Ibéria — a página não tinha nenhum termo nessa direção antes
 * disto. Diferente das distinções de JA/ZH que seguem, "entrevista de
 * emprego" não tem ambiguidade de público por idioma — é o mesmo termo,
 * mesma audiência, em todo lugar — então não precisou da verificação contra
 * fonte institucional que os outros pares desta lista tiveram.
 *
 * Japonês e chinês levam só a palavra isolada (`面接`/`面试`), não um
 * composto com `転職`/`求职`: mesmo cuidado do cabeçalho acima — um composto
 * pareceria natural sem ter sido verificado contra o uso real.
 *
 * ## "Currículo/CV/resume" — adicionado em 13/09/2026, Google Trends real
 *
 * Pedido do operador: ir ao Google Trends, achar o termo mais buscado em
 * cada idioma do site e usar para atrair mais lead orgânico. Comparação real
 * feita por país-sede de cada idioma (`trends.google.com/explore`, últimos
 * 12 meses, busca na Web), termos atuais desta lista contra candidatos.
 *
 * **O achado maior não entrou aqui, de propósito.** Em praticamente todo
 * mercado testado, o termo de MAIOR volume de todos não foi um sinônimo de
 * "busca de emprego" nem de "currículo" — foi "vagas de emprego"/"ofertas de
 * empleo"/`Stellenangebote`/"offres d'emploi"/"offerte di lavoro"/`求人`/
 * `vacatures`/"lediga jobb"/`招聘`, 3 a 10× mais buscado que qualquer termo
 * já usado aqui. Mesmo assim, **não entrou nesta lista**: é a mesma direção
 * que o cabeçalho de `/hiring` já rejeita para "hiring" (§2.84) — quem
 * digita "vagas de emprego" quer um QUADRO de vagas, e `/hiring` fala com
 * quem JÁ se candidatou e quer saber se o currículo passa. Trazer esse termo
 * pra cá atrairia o público errado pra página errada. Registrado aqui para
 * quem vier depois não repetir a pesquisa achando que foi esquecimento.
 *
 * **O que entrou**: o termo isolado de currículo/CV/resume, confirmado nos
 * mesmos gráficos como 2º colocado (ou empatado em 1º, no Brasil e na
 * Itália) — muito acima dos termos de busca de emprego já existentes nesta
 * lista, e com a direção certa: é exatamente a dúvida que `/hiring` responde
 * ("meu currículo passa?"). Confirmado, além do gráfico, contra o texto
 * visível de `hiringPage.searchBody` de cada um dos 12 idiomas — a palavra
 * já estava lá antes desta mudança (nenhuma cópia nova foi escrita), então
 * a keyword nova não é a promessa vazia que o teste da hashtag existe pra
 * pegar.
 *
 * Confiança mais baixa em três idiomas — o termo isolado apareceu no
 * gráfico bem perto dos termos já existentes, sem separação clara (ao
 * contrário do salto grande visto nos outros nove): japonês (`履歴書`),
 * sueco (`cv`) e coreano (`이력서`). Entraram mesmo assim porque a palavra já
 * é a mesma do texto visível — o risco de errar é baixo mesmo com o sinal do
 * Trends mais fraco.
 */
const JOB_SEARCH_TERM: Record<Language, string[]> = {
  pt: ['busca de emprego', 'procurando emprego', 'recolocação profissional', 'entrevista de emprego', 'currículo'],
  en: ['job hunting', 'job search', 'open to work', 'job interview', 'resume'],
  es: ['búsqueda de empleo', 'buscar trabajo', 'entrevista de trabajo', 'currículum'],
  de: ['Jobsuche', 'Stellensuche', 'Bewerbung', 'Vorstellungsgespräch', 'Lebenslauf'],
  fr: ["recherche d'emploi", 'chercher un emploi', "entretien d'embauche", 'CV'],
  it: ['ricerca di lavoro', 'cercare lavoro', 'colloquio di lavoro', 'curriculum'],
  ja: ['転職活動', '転職', '面接', '履歴書'],
  nl: ['op zoek naar werk', 'solliciteren', 'sollicitatiegesprek', 'cv'],
  sv: ['jobbsökande', 'söka jobb', 'jobbintervju', 'cv'],
  zh: ['求职', '找工作', '面试', '简历'],
  ar: ['البحث عن عمل', 'البحث عن وظيفة', 'مقابلة العمل', 'السيرة الذاتية'],
  ko: ['구직', '이직', '면접', '이력서'],
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
