/**
 * A ficha da vaga: o que o anúncio pede, extraído UMA vez por vaga (§27, §2.136).
 *
 * ## Por que isto existe
 *
 * Nenhuma fonte manda requisitos. Em 23/09/2026 as 6.084 vagas abertas do
 * Brasil tinham `requirements` e `skills` vazios, todas — e `jobFitAxis` sem
 * requisito devolve 50 sem evidência. Com isso, o único caminho para uma vaga
 * "combinar" era o cargo ser confirmado pela taxonomia, que conhece 12 cargos;
 * 91% das vagas BR ficam fora dela. Uma coordenadora de laboratório não recebia
 * vaga nenhuma, nem na landing nem no Radar.
 *
 * A descrição, quando existe, diz o que a vaga pede. Esta extração lê a
 * descrição e grava o que está escrito nela nos dois campos que o matching já
 * sabe usar. Nenhuma IA entra no matching: ele continua determinístico e sem
 * custo por pessoa, só passa a ter o que comparar.
 *
 * ## O formato é o do matching
 *
 * `intersectSkills` compara por inclusão de texto normalizado ("SQL" casa com
 * "SQL avançado"). Por isso os itens são TERMOS CURTOS, no idioma do anúncio —
 * "Hematologia", "CRBM ativo", "Excel avançado" —, e não frases ("experiência
 * de 3 anos com rotinas de hematologia"), que nunca casariam com competência
 * declarada nenhuma.
 *
 * E a lista é CURTA: a nota do eixo é `atendidos / pedidos`. Um anúncio
 * transcrito com quinze itens, metade deles periféricos, derrubaria a nota de
 * quem atende o essencial.
 */

import { wrapUntrustedDocument } from '../analysis/untrusted'

/** Sobe quando o prompt ou o formato mudam de um jeito que justifique reler. */
export const JOB_INTELLIGENCE_VERSION = 1

/** Abaixo disto a "descrição" é um título repetido ou um trecho sem conteúdo. */
export const MIN_DESCRIPTION_CHARS = 200

/**
 * O que vai para o modelo. O essencial de um anúncio está no começo; o fim
 * costuma ser benefício, processo seletivo e texto institucional. Também é o
 * que segura o custo: anúncios de Greenhouse passam de 7 mil caracteres.
 */
export const MAX_DESCRIPTION_CHARS = 6000

/**
 * A seção de requisitos que o JobBase separa (§2.137) basta a partir disto.
 * Mais curta que isso costuma ser um cabeçalho sem corpo, e a descrição
 * inteira dá mais do que ela.
 */
export const MIN_REQUIREMENTS_TEXT_CHARS = 60

/**
 * O texto que vai para a extração: a seção de requisitos quando existe, a
 * descrição inteira quando não. `null` quando nenhum dos dois basta — a vaga é
 * marcada `too_short` sem chamar IA.
 */
export function pickExtractionText(input: {
  requirementsText?: string | null
  description?: string | null
}): { text: string; source: 'requirements' | 'description' } | null {
  const requirements = input.requirementsText?.trim() ?? ''
  if (requirements.length >= MIN_REQUIREMENTS_TEXT_CHARS) return { text: requirements, source: 'requirements' }
  const description = input.description?.trim() ?? ''
  if (description.length >= MIN_DESCRIPTION_CHARS) return { text: description, source: 'description' }
  return null
}

/** Teto por lista — ver "a lista é CURTA" no cabeçalho. */
export const MAX_ITEMS = 8

const MAX_ITEM_CHARS = 60

export const JOB_INTELLIGENCE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['requirements', 'skills'],
  properties: {
    requirements: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
  },
} as const

export function jobIntelligenceSystemPrompt(): string {
  return `Você lê anúncios de vaga e extrai o que o anúncio PEDE do candidato. Você não avalia a vaga, não completa o que falta e não deduz nada que não esteja escrito.

Responda SOMENTE com um objeto JSON com duas listas de strings:

- "requirements": exigências formais do candidato — formação ("Superior em Biomedicina"), registro profissional ("CRBM ativo", "COREN"), certificação, idioma com nível ("Inglês avançado"), CNH. Só o que o anúncio pede.
- "skills": competências técnicas e áreas de conhecimento que o trabalho exige — ferramentas, sistemas, técnicas, especialidades ("Hematologia", "Coleta de sangue", "SAP", "Excel avançado", "Gestão de equipe"). Vale também quando aparecem como atividade: "realizar coleta de material biológico" vira "Coleta de material biológico".

Regras:
- Cada item é um TERMO CURTO, de 1 a 4 palavras, sem verbo, sem "experiência em", sem "conhecimento de". Escreva no idioma do anúncio.
- No máximo ${MAX_ITEMS} itens em cada lista: os mais centrais para o trabalho, não todos os mencionados.
- NÃO inclua: competências comportamentais (comunicação, proatividade, trabalho em equipe), benefícios, salário, horário, local, etapas do processo seletivo, descrição da empresa.
- NÃO inclua tempo de experiência nem senioridade.
- "Desejável" e "diferencial" também entram, desde que sejam técnicos.
- Se o anúncio não pede nada técnico nem formal, devolva as listas vazias. Lista vazia é resposta correta; inventar item não é.`
}

/**
 * O anúncio é texto de terceiros: vai embrulhado como dado, pelo mesmo
 * caminho que o currículo, para que um "ignore as instruções" escrito numa
 * vaga não vire instrução.
 */
export function jobIntelligenceUserPrompt(job: { title: string; company: string; description: string }): string {
  return wrapUntrustedDocument(
    `Vaga: ${job.title}\nEmpresa: ${job.company}\n\n${job.description.slice(0, MAX_DESCRIPTION_CHARS)}`,
    'anúncio da vaga'
  )
}

export interface JobIntelligence {
  requirements: string[]
  skills: string[]
}

function cleanItems(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const item = raw.replace(/\s+/g, ' ').trim().replace(/[.;,:]+$/, '')
    if (item.length < 2 || item.length > MAX_ITEM_CHARS) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
    if (out.length >= MAX_ITEMS) break
  }
  return out
}

/**
 * A resposta do modelo, limpa. `null` quando sequer é um objeto JSON — o
 * chamador marca a vaga como ilegível em vez de tentar de novo a cada rodada,
 * porque a resposta já foi paga.
 */
export function parseJobIntelligence(rawText: string): JobIntelligence | null {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    try {
      parsed = match ? JSON.parse(match[0]) : undefined
    } catch {
      parsed = undefined
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const obj = parsed as Record<string, unknown>
  const requirements = cleanItems(obj.requirements)
  // Um item que está nas duas listas conta duas vezes na nota. Fica onde o
  // modelo o pôs primeiro, em `requirements`.
  const inRequirements = new Set(requirements.map((r) => r.toLowerCase()))
  const skills = cleanItems(obj.skills).filter((s) => !inRequirements.has(s.toLowerCase()))
  return { requirements, skills }
}

/**
 * O que fica em `Job.intelligenceJson`. Não repete as listas — elas vivem em
 * `requirements`/`skills`, que é onde o matching lê. Isto é o registro de que a
 * vaga já foi lida, com que versão, e como terminou.
 */
export interface JobIntelligenceMarker {
  v: number
  at: string
  /** `ok` extraiu; `too_short` nem chamou IA; `unparseable` pagou e não leu. */
  status: 'ok' | 'too_short' | 'unparseable'
}

export function intelligenceMarker(status: JobIntelligenceMarker['status'], now: Date = new Date()): string {
  const marker: JobIntelligenceMarker = { v: JOB_INTELLIGENCE_VERSION, at: now.toISOString(), status }
  return JSON.stringify(marker)
}

/** A lista que a fonte mandou está vazia? `"[]"`, `null` e string vazia contam. */
export function isEmptyList(raw: string | null | undefined): boolean {
  if (!raw) return true
  try {
    const parsed = JSON.parse(raw)
    return !Array.isArray(parsed) || parsed.length === 0
  } catch {
    return true
  }
}

/**
 * A linha da recoleta de uma vaga que já existe.
 *
 * Nenhuma fonte manda requisitos hoje, e `rowFor` grava `"[]"` quando a lista
 * vem vazia. Numa vaga nova isso é o certo; numa recoleta apagaria, todo dia,
 * o que a extração de requisitos (`lib/jobs/intelligence`) já preencheu — e a
 * vaga voltaria a "não lista requisitos" sem que a extração a pegasse de
 * novo, porque ela já está marcada como lida. Lista vazia na recoleta,
 * portanto, não sobrescreve (§2.136).
 */
export function keepExtractedLists<T extends { requirements: string; skills: string }>(
  row: T,
  job: { requirements: readonly string[]; skills: readonly string[] }
): Omit<T, 'requirements' | 'skills'> & Partial<Pick<T, 'requirements' | 'skills'>> {
  const { requirements, skills, ...rest } = row
  return {
    ...rest,
    ...(job.requirements.length > 0 ? { requirements } : {}),
    ...(job.skills.length > 0 ? { skills } : {}),
  }
}
