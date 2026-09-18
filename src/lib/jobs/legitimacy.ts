/**
 * A vaga é real e preenchível agora?
 *
 * ## O buraco que isto fecha
 *
 * O `lifecycle.ts` responde se a vaga ainda **existe**: some da coleta por
 * tempo suficiente, fecha. Mas existir não é a mesma pergunta que valer a
 * candidatura. Um banco de talentos fica aberto para sempre e aparece em toda
 * coleta — pelo `lifecycle` ele é uma vaga saudável, e para quem se candidata
 * é um formulário que não tem vaga do outro lado.
 *
 * Numa ferramenta que promete só interromper quando vale a pena, mandar
 * alguém se candidatar a um anúncio perpétuo é o mesmo defeito que avisar sobre
 * vaga encerrada, só que mais difícil de perceber.
 *
 * ## Não tem número, de propósito
 *
 * O sinal é **neutro na compatibilidade**: ele nunca soma nem subtrai do Job
 * Fit. A forma garante isso melhor que a disciplina — a saída é um nível mais a
 * lista de motivos, e **nenhum número**. Nota é somável por engano; nível não é.
 * Quem quiser misturar os dois tem de escrever a conversão na mão, e aí a
 * intenção fica visível na revisão.
 *
 * ## Ausência de dado não pontua
 *
 * O `types.ts` já fixou a regra: *"Eliminar por dado ausente transforma
 * silêncio em rejeição"*. Salário não divulgado é a norma em boa parte dos
 * mercados — no Brasil, a maioria —, não indício de fraude. Então só pontua o
 * que o anúncio **afirma**: dizer que é banco de talentos, continuar aberto
 * muito além da janela normal, a mesma empresa republicar o mesmo cargo.
 * Campo vazio não é evidência de nada e fica fora.
 *
 * Fase 1: módulo puro. Sem escrita no banco e sem tela — ver
 * `docs/PLANO-CAREER-OPS.md` (F1).
 */

/**
 * Aberta há mais tempo que isto, e ainda aparecendo em toda coleta, é anúncio
 * perpétuo.
 *
 * O piso é bem acima dos 45 dias do `STALE_AFTER_DAYS` de propósito: aquele
 * conta ausência (sumiu da coleta), este conta presença (continua aparecendo).
 * Uma contratação demorada de verdade cabe em três meses; o que passa disso
 * raramente é uma vaga só sendo preenchida devagar.
 *
 * **Tem que ficar ABAIXO de `EXPIRED_AFTER_PUBLISHED_DAYS` (120).** Desde que
 * a vaga passou a ser encerrada por idade aos 120 dias, um limiar de 120 aqui
 * nunca dispararia: quando a vaga chegasse à idade, já estaria fechada, e este
 * sinal só olha vaga aberta. Os 90 dias mantêm o aviso vivo na janela em que
 * ele ainda informa alguma coisa — entre "velha o bastante para desconfiar" e
 * "velha o bastante para sair do acervo". Mexer num dos dois números sem olhar
 * o outro desliga este sinal em silêncio.
 */
export const EVERGREEN_AFTER_DAYS = 90

/**
 * A partir de quantas publicações do mesmo cargo pela mesma empresa a
 * recirculação vira sinal.
 *
 * Duas não dizem nada — a primeira pode ter sido preenchida e a segunda ser uma
 * segunda posição real. Três ou mais do mesmo cargo é padrão, e padrão é o que
 * distingue rotatividade e reabertura perpétua de uma contratação normal.
 */
export const RECIRCULATION_MIN_POSTINGS = 3

/**
 * Descrição menor que isto, e sem nenhum requisito extraído, é anúncio oco.
 *
 * As duas condições juntas importam: anúncio curto com requisito é sintético,
 * não oco, e é comum em board que corta o texto. Sem as duas, isto puniria a
 * fonte em vez do anúncio.
 */
export const THIN_DESCRIPTION_MAX_CHARS = 200

/** O que foi encontrado. Nunca "o que falta". */
export type LegitimacySignal =
  /** O próprio anúncio diz que é banco de talentos / candidatura espontânea. */
  | 'talent_pool'
  /** Aberta muito além da janela normal, ainda aparecendo em toda coleta. */
  | 'evergreen'
  /** A mesma empresa já publicou este mesmo cargo várias vezes. */
  | 'recirculated'
  /** Descrição oca: curta demais e sem nenhum requisito. */
  | 'thin_description'

export type LegitimacyLevel = 'ok' | 'attention' | 'suspect'

export interface LegitimacyAssessment {
  level: LegitimacyLevel
  /** Em ordem estável, para o texto não dançar entre duas execuções. */
  signals: LegitimacySignal[]
}

export interface LegitimacyInput {
  title: string
  description: string | null
  /** Quantos requisitos o normalizador extraiu. Zero é uma resposta válida. */
  requirementsCount: number
  /** Quando a fonte diz que publicou. `null` quando a fonte não informa. */
  publishedAt: Date | null
  /**
   * Quantas vagas distintas esta mesma empresa já publicou com este mesmo
   * cargo, a própria incluída. Quem chama consulta por `companyKey` +
   * `normalizedTitle` (o índice já existe no schema). `1` quando não se sabe —
   * é o valor que não acusa nada.
   */
  postingsForSameRole: number
  now: Date
}

/**
 * "Banco de talentos" nos 12 idiomas do produto, sem acento e em minúsculas —
 * o formato que `normalize` produz.
 *
 * São trechos, não frases inteiras: `banco de talentos` casa com "Banco de
 * Talentos — Tecnologia". O que entra aqui é só expressão que **afirma** não
 * haver posição específica; nada de "junior", "estágio" ou palavra de cargo,
 * que apareceria em vaga real.
 */
const TALENT_POOL_PHRASES: readonly string[] = [
  // pt
  'banco de talentos', 'cadastro reserva', 'candidatura espontanea',
  'banco de curriculos', 'oportunidades futuras',
  // en
  'talent pool', 'talent community', 'talent network', 'general application',
  'speculative application', 'open application', 'future opportunities',
  'future openings', 'join our talent',
  // es
  'banco de talento', 'bolsa de trabajo', 'candidatura espontanea',
  'autocandidatura',
  // de
  'initiativbewerbung', 'talentpool', 'talent pool',
  // fr
  'candidature spontanee', 'vivier de talents',
  // it
  'candidatura spontanea', 'autocandidatura',
  // nl
  'open sollicitatie', 'talentenpool',
  // sv
  'spontanansokan', 'spontanansokning',
  // ja
  'オープンポジション', '人材プール', '随時募集',
  // ko
  '인재풀', '상시채용', '인재 등록',
  // zh
  '人才库', '人才儲備', '长期招聘', '長期招募',
  // ar
  'قاعدة المواهب', 'تقديم مفتوح',
]

/** Mesma normalização do `ats-check/score.ts`: sem acento, minúscula. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
}

/**
 * O anúncio diz, com todas as letras, que não há posição específica.
 *
 * Lê título e descrição: várias fontes põem "Banco de Talentos" só no corpo,
 * com um título que parece cargo normal.
 */
function isTalentPool(title: string, description: string | null): boolean {
  const haystack = normalize(`${title} ${description ?? ''}`)
  return TALENT_POOL_PHRASES.some((phrase) => haystack.includes(normalize(phrase)))
}

/**
 * Nível a partir dos sinais.
 *
 * `talent_pool` sozinho já é `suspect` porque não é indício, é a própria coisa:
 * o anúncio declarou que não tem posição específica. Os outros três são
 * indícios — um é `attention`, dois ou mais viram padrão e sobem para
 * `suspect`.
 */
function levelFor(signals: readonly LegitimacySignal[]): LegitimacyLevel {
  if (signals.includes('talent_pool')) return 'suspect'
  if (signals.length >= 2) return 'suspect'
  if (signals.length === 1) return 'attention'
  return 'ok'
}

/**
 * Avalia um anúncio **aberto**. Vaga fechada não passa por aqui: "aberta há 200
 * dias" deixa de ser sinal no instante em que ela fecha, e o Radar só mostra
 * vaga aberta.
 */
export function assessLegitimacy(input: LegitimacyInput): LegitimacyAssessment {
  const signals: LegitimacySignal[] = []

  if (isTalentPool(input.title, input.description)) signals.push('talent_pool')

  if (input.publishedAt && daysBetween(input.publishedAt, input.now) >= EVERGREEN_AFTER_DAYS) {
    signals.push('evergreen')
  }

  if (input.postingsForSameRole >= RECIRCULATION_MIN_POSTINGS) signals.push('recirculated')

  const description = input.description?.trim() ?? ''
  if (description.length < THIN_DESCRIPTION_MAX_CHARS && input.requirementsCount === 0) {
    signals.push('thin_description')
  }

  return { level: levelFor(signals), signals }
}

/* ------------------------------------------------------------------------- *
 * Avaliação em lote
 *
 * A recirculação é a única entrada que não cabe na vaga sozinha: ela pergunta
 * quantas vezes a MESMA empresa publicou o MESMO cargo. Responder isso por
 * vaga seria uma consulta por vaga — 500 consultas para um lote do Radar.
 *
 * Por isso o lote é separado em duas metades: a montagem, aqui, pura e
 * testável com um mapa de contagens na mão; e a consulta que produz esse mapa,
 * em `legitimacy.server.ts`. O que decide (chave do par, dado ausente,
 * contagem de requisitos) fica testado sem banco nenhum.
 * ------------------------------------------------------------------------- */

/** O que a avaliação precisa de cada linha do banco. Nada além disto. */
export interface LegitimacyJobRow {
  id: string
  title: string
  companyKey: string
  /** `null` quando a taxonomia não reconheceu o cargo. */
  normalizedTitle: string | null
  description: string | null
  /** JSON array, na forma em que o banco guarda. */
  requirements: string | null
  publishedAt: Date | null
}

/**
 * Chave do par (empresa, cargo), ou `null` quando o cargo é desconhecido.
 *
 * `null` não é caso de borda a tolerar, é a resposta certa: sem cargo
 * reconhecido não há como agrupar por cargo, e agrupar só por empresa contaria
 * como recirculação uma empresa que abriu cinco vagas DIFERENTES — que é
 * contratação saudável, o oposto do que o sinal procura.
 *
 * O separador é ` ` porque não ocorre em `companyKey` normalizada: com um
 * hífen, `("acme-tech", "lead")` e `("acme", "tech-lead")` cairiam na mesma
 * chave.
 */
export function roleKey(companyKey: string, normalizedTitle: string | null): string | null {
  if (!normalizedTitle) return null
  return `${companyKey} ${normalizedTitle}`
}

/** Quantos requisitos o normalizador extraiu. JSON quebrado conta como zero. */
function countRequirements(raw: string | null): number {
  if (!raw) return 0
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

/**
 * Avalia um lote, dado o mapa de quantas publicações existem por par
 * (empresa, cargo) — o que `roleKey` chaveia.
 *
 * Par ausente do mapa vira `1`, o valor que não acusa nada: se a contagem não
 * foi resolvida, o silêncio não pode virar acusação (a mesma regra do
 * `types.ts` que rege o módulo inteiro).
 */
export function assessJobsWithCounts(
  jobs: readonly LegitimacyJobRow[],
  postingsByRole: ReadonlyMap<string, number>,
  now: Date
): Map<string, LegitimacyAssessment> {
  const out = new Map<string, LegitimacyAssessment>()

  for (const job of jobs) {
    const key = roleKey(job.companyKey, job.normalizedTitle)
    out.set(
      job.id,
      assessLegitimacy({
        title: job.title,
        description: job.description,
        requirementsCount: countRequirements(job.requirements),
        publishedAt: job.publishedAt,
        postingsForSameRole: (key && postingsByRole.get(key)) || 1,
        now,
      })
    )
  }

  return out
}
