/**
 * Teste de legibilidade para ATS — sem IA, sem banco, sem custo.
 *
 * É a porta de entrada gratuita e sem cadastro ("Seu currículo passa na
 * Gupy?"). Por ser determinístico, pode ser servido a qualquer visitante sem
 * captcha: o pior que um abuso consegue é gastar CPU de leitura de PDF, que o
 * rate limit do middleware e o teto de tamanho da rota já contêm.
 *
 * O que ele mede é o que um ATS consegue LER — não a qualidade da carreira.
 * A qualidade (as 8 notas) continua sendo a prévia de dentro da conta, e o
 * diagnóstico continua sendo o que se vende. Aqui só se aponta o problema,
 * nunca o conserto.
 */

import { hasSuspiciousInvisibles } from '../text/invisible'

export type AtsIssueCode =
  | 'no_text'
  | 'too_short'
  | 'too_long'
  | 'no_email'
  | 'no_phone'
  | 'no_experience_section'
  | 'no_education_section'
  | 'no_skills_section'
  | 'no_dates'
  | 'garbled_chars'
  | 'columns_suspected'
  | 'no_metrics'
  | 'no_linkedin'
  | 'keyword_stuffing'
  | 'hidden_text_suspected'
  | 'invisible_chars'

export type AtsSeverity = 'critical' | 'warning' | 'tip'
export type AtsLevel = 'good' | 'attention' | 'risk'

export interface AtsIssue {
  code: AtsIssueCode
  severity: AtsSeverity
}

export interface AtsCheckResult {
  score: number
  level: AtsLevel
  issues: AtsIssue[]
  stats: { words: number; lines: number }
}

/** Quanto cada problema tira da nota (de 100). */
export const ISSUE_PENALTY: Record<AtsIssueCode, { points: number; severity: AtsSeverity }> = {
  no_text: { points: 95, severity: 'critical' },
  too_short: { points: 20, severity: 'critical' },
  no_experience_section: { points: 15, severity: 'critical' },
  no_email: { points: 12, severity: 'critical' },
  garbled_chars: { points: 12, severity: 'critical' },
  columns_suspected: { points: 10, severity: 'warning' },
  no_dates: { points: 10, severity: 'warning' },
  too_long: { points: 8, severity: 'warning' },
  no_education_section: { points: 8, severity: 'warning' },
  no_skills_section: { points: 8, severity: 'warning' },
  no_phone: { points: 6, severity: 'warning' },
  no_metrics: { points: 6, severity: 'tip' },
  no_linkedin: { points: 3, severity: 'tip' },
  keyword_stuffing: { points: 25, severity: 'critical' },
  hidden_text_suspected: { points: 30, severity: 'critical' },
  invisible_chars: { points: 15, severity: 'critical' },
}

/**
 * ## Por que estas três REPROVAM, e com peso alto
 *
 * As outras checagens medem se o ATS CONSEGUE LER. Estas medem se alguém
 * tentou enganá-lo — e a diferença importa porque, sem elas, o teste premiava
 * exatamente a prática que mais prejudica quem a usa.
 *
 * Um currículo com palavras-chave repetidas trinta vezes em branco sobre
 * branco passa por qualquer leitor automático: o texto ESTÁ lá. Pela régua
 * antiga ele tirava nota boa. Só que recrutador humano abre o arquivo, marca
 * o texto, vê o bloco escondido, e a candidatura morre ali — às vezes com a
 * pessoa marcada na empresa inteira.
 *
 * Dizer "seu currículo passa" para quem fez isso seria o GriffoWork
 * chancelando o truque que vai custar a vaga da pessoa. Por isso o peso é de
 * reprovação, não de dica.
 *
 * ## O que NÃO dá para detectar aqui, e está dito
 *
 * Branco-sobre-branco e modo de renderização invisível vivem na ESTRUTURA do
 * PDF, e o extrator (`pdf-parse`) devolve só texto — sem cor, sem posição, sem
 * modo. Estas três checagens são indícios estatísticos sobre o texto extraído,
 * não leitura da estrutura. Pegam o caso comum e não prometem mais que isso.
 */

/** Repetição a partir da qual um termo deixa de ser ênfase e vira empilhamento. */
export const STUFFING_MIN_REPEATS = 12

/** Fração do texto que um único termo precisa ocupar para acusar. */
export const STUFFING_MIN_SHARE = 0.03

/**
 * Palavras por página acima das quais o texto não cabe fisicamente na folha.
 *
 * Um currículo denso bem diagramado chega a ~600 palavras por página. O dobro
 * disso não é diagramação apertada: é texto que não está sendo exibido.
 */
export const MAX_WORDS_PER_PAGE = 1200

export const MIN_WORDS = 150
export const MAX_WORDS = 1400

/**
 * Títulos de seção nos 12 idiomas do produto (sem acento e em minúsculas,
 * como `normalize` deixa a linha). Basta um trecho: "experiencia" casa com
 * "Experiência Profissional", "Experiencia Laboral" etc.
 */
const SECTION_WORDS = {
  experience: [
    'experiencia', 'experience', 'historico profissional', 'trajetoria', 'trayectoria',
    'employment', 'work history', 'atuacao profissional', 'empregos',
    'berufserfahrung', 'erfahrung', 'werdegang', 'parcours professionnel', 'esperienz',
    'werkervaring', 'ervaring', 'arbetslivserfarenhet', 'erfarenhet', 'anstallningar',
    '職歴', '職務経歴', '経歴', '경력', '工作经历', '工作经验', '工作經歷', 'الخبرة', 'الخبرات',
  ],
  education: [
    'formacao', 'educacao', 'education', 'escolaridade', 'formacion', 'educacion',
    'academic', 'estudos', 'estudios', 'graduacao', 'ausbildung', 'studium', 'bildung',
    'formation', 'etudes', 'istruzione', 'formazione', 'opleiding', 'utbildning',
    '学歴', '학력', '교육', '教育', '学历', '學歷', 'التعليم', 'المؤهل',
  ],
  skills: [
    'habilidades', 'competencias', 'skills', 'conhecimentos', 'ferramentas',
    'conocimientos', 'herramientas', 'qualificacoes', 'tecnologias', 'kenntnisse',
    'fahigkeiten', 'kompetenzen', 'competences', 'competenze', 'vaardigheden',
    'kompetenser', 'fardigheter', 'kunskaper', 'スキル', '資格', '기술', '스킬', '역량',
    '技能', '专业技能', '技术能力', 'المهارات', 'مهارات',
  ],
} as const

const SEVERITY_ORDER: Record<AtsSeverity, number> = { critical: 0, warning: 1, tip: 2 }

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Seção existe quando há uma linha curta (título) com a palavra. */
function hasSection(lines: string[], words: readonly string[]): boolean {
  return lines.some((line) => line.length <= 45 && words.some((w) => line.includes(normalize(w))))
}

export function levelFor(score: number): AtsLevel {
  if (score >= 80) return 'good'
  if (score >= 60) return 'attention'
  return 'risk'
}


/**
 * Um único termo ocupando fatia grande demais do documento.
 *
 * Conta só palavras de 4+ letras: artigo e preposição repetem muito por
 * natureza, e contá-los acusaria todo currículo escrito em prosa.
 */
function stuffedTerm(text: string, words: number): boolean {
  if (words < 80) return false

  const counts = new Map<string, number>()
  for (const raw of normalize(text).split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 4) continue
    counts.set(raw, (counts.get(raw) ?? 0) + 1)
  }

  for (const n of counts.values()) {
    if (n >= STUFFING_MIN_REPEATS && n / words >= STUFFING_MIN_SHARE) return true
  }
  return false
}

const MAX_SCORED_CHARS = 200_000

export function scoreAtsReadability(
  input: string | null | undefined,
  /**
   * Páginas do PDF, quando conhecidas. Ausente para texto colado — e ausência
   * NÃO acusa nada, pela mesma regra do resto da casa.
   */
  options: { pages?: number } = {}
): AtsCheckResult {
  // Teto de tamanho ANTES de qualquer regex: o texto vem de rota pública sem
  // login (texto colado ou extraído de PDF, sem limite próprio). Currículo real
  // não chega perto disso.
  const text = (input ?? '').slice(0, MAX_SCORED_CHARS).replace(/\r/g, '')
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const spaced = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  // Japonês e chinês não separam palavras por espaço: conta ~2 caracteres por
  // palavra para o teto e o piso de tamanho valerem igual nesses idiomas.
  const cjk = (text.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length
  const words = Math.max(spaced, Math.round(cjk / 2))
  const found = new Set<AtsIssueCode>()

  if (text.trim().length < 30 || words < 5) {
    return finish(new Set(['no_text']), words, rawLines.length)
  }

  const lines = rawLines.map(normalize)
  const flat = normalize(text)

  // Sinais de manipulação. Vêm antes das checagens de legibilidade porque
  // pesam mais: não adianta dizer que o texto é legível se ele foi plantado.
  if (hasSuspiciousInvisibles(text)) found.add('invisible_chars')
  if (stuffedTerm(text, words)) found.add('keyword_stuffing')
  if (options.pages && options.pages > 0 && words / options.pages > MAX_WORDS_PER_PAGE) {
    found.add('hidden_text_suspected')
  }

  if (words < MIN_WORDS) found.add('too_short')
  if (words > MAX_WORDS) found.add('too_long')

  // Quantificadores limitados (RFC 5321: 64 no local, 255 no domínio): sem
  // limite, uma sequência longa sem '@' fazia a regex varrer o resto do texto a
  // partir de cada posição — tempo quadrático em rota pública.
  if (!/[\w.+-]{1,64}@[\w-]{1,63}\.[\w.-]{1,190}/.test(text)) found.add('no_email')
  const phoneDigits = (text.match(/\+?\(?\d[\d\s().-]{7,30}\d/g) || []).some(
    (m) => m.replace(/\D/g, '').length >= 8 && !/^(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}$/.test(m.trim())
  )
  if (!phoneDigits) found.add('no_phone')

  if (!hasSection(lines, SECTION_WORDS.experience)) found.add('no_experience_section')
  if (!hasSection(lines, SECTION_WORDS.education)) found.add('no_education_section')
  if (!hasSection(lines, SECTION_WORDS.skills)) found.add('no_skills_section')

  const years = text.match(/\b(19[5-9]\d|20\d{2})\b/g) || []
  if (years.length < 2) found.add('no_dates')

  // Ícones de fontes decorativas e glifos sem mapeamento viram a área de uso
  // privado do Unicode ou o caractere de substituição quando o PDF é lido.
  const garbled = (text.match(/[\uE000-\uF8FF\uFFFD]/g) || []).length
  if (garbled >= 5 || garbled / Math.max(text.length, 1) > 0.005) found.add('garbled_chars')

  // Layout em colunas ou tabela costuma chegar como muitas linhas curtíssimas.
  if (rawLines.length >= 25) {
    const short = rawLines.filter((l) => l.length <= 22).length
    if (short / rawLines.length > 0.6) found.add('columns_suspected')
  }

  const hasMetric =
    /\d{1,15}([.,]\d{1,6})?\s?%/.test(text) ||
    /(R\$|US\$|€|£|¥|₩|\$)\s?\d/.test(text) ||
    /\d\s?(€|円|万|억|元)/.test(text) ||
    /\b\d{2,}\s?(mil|k|clientes|pessoas|projetos|lojas|vendas|clients|people|projects|clientes|personas|proyectos)\b/i.test(flat)
  if (!hasMetric) found.add('no_metrics')

  if (!/linkedin\.com\//i.test(text)) found.add('no_linkedin')

  return finish(found, words, rawLines.length)
}

function finish(found: Set<AtsIssueCode>, words: number, lines: number): AtsCheckResult {
  let score = 100
  for (const code of found) score -= ISSUE_PENALTY[code].points
  score = Math.max(0, Math.min(100, Math.round(score)))
  const issues = [...found]
    .map((code) => ({ code, severity: ISSUE_PENALTY[code].severity }))
    .sort((a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      ISSUE_PENALTY[b.code].points - ISSUE_PENALTY[a.code].points
    )
  return { score, level: levelFor(score), issues, stats: { words, lines } }
}
