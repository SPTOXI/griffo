import { ISSUE_PENALTY, type AtsCheckResult, type AtsIssueCode, type AtsSeverity } from '../ats-check/score'

const SEVERITY_RANK: Record<AtsSeverity, number> = { critical: 0, warning: 1, tip: 2 }

/**
 * Regras do envio sem conta da landing (§2.132) — puras, sem banco.
 *
 * ## O prazo de 24 horas
 *
 * A promessa pública é "apagamos em até 24 horas". A linha vence em 22h e a
 * purga roda de hora em hora (`.github/workflows/visitor-leads-hourly.yml`):
 * as duas horas de folga cobrem o atraso de agendamento do GitHub Actions, que
 * não garante o minuto. A leitura recusa linha vencida desde o primeiro
 * segundo, então nada é mostrado depois de 22h mesmo que a purga atrase.
 *
 * ## Quem escolhe guardar
 *
 * Mesmo prazo do currículo de conta inativa (`RETENTION_DAYS.inactiveResume`):
 * dois anos. Não é "para sempre", porque nada neste banco é.
 */
export const DELETE_AFTER_HOURS = 22
export const KEEP_FOR_DAYS = 730

export function expiresAtFor(recruiterOptIn: boolean, now: Date = new Date()): Date {
  const ms = recruiterOptIn
    ? KEEP_FOR_DAYS * 24 * 60 * 60 * 1000
    : DELETE_AFTER_HOURS * 60 * 60 * 1000
  return new Date(now.getTime() + ms)
}

/**
 * Processamento que não terminou em 3 minutos não vai terminar: a função
 * serverless que o rodava já morreu. A tela para de esperar e mostra falha.
 */
export const PROCESSING_TIMEOUT_MS = 3 * 60 * 1000

/** Quantas oportunidades completas o visitante vê sem pagar. Decisão do operador. */
export const FREE_OPPORTUNITIES = 1

/** Teto do que se guarda por lead. A tela nunca mostra mais que isso trancado. */
export const MAX_STORED_MATCHES = 50

/**
 * O token é o id da linha e a credencial de leitura ao mesmo tempo.
 * 16 bytes aleatórios em hex. Qualquer outra forma é recusada antes de ir ao banco.
 */
export const TOKEN_PATTERN = /^[0-9a-f]{32}$/

export function isValidToken(value: string | null | undefined): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value)
}

/**
 * As categorias da isca.
 *
 * A isca diz QUANTOS problemas existem e DE QUE TIPO. Desde 24/10/2026, por
 * decisão do operador, ela também revela UM deles — o mais grave — de graça:
 * ver um erro concreto do próprio currículo convence mais do que uma contagem,
 * e o teste ATS público (`/ats-check`) já mostra todos. Os demais continuam
 * só como contagem por categoria (decisões 4 e 5 do §2.132).
 */
export type TeaserCategory = 'formatting' | 'keywords' | 'experience' | 'contact'

export const ISSUE_CATEGORY: Record<AtsIssueCode, TeaserCategory> = {
  no_text: 'formatting',
  garbled_chars: 'formatting',
  columns_suspected: 'formatting',
  too_long: 'formatting',
  too_short: 'formatting',
  hidden_text_suspected: 'formatting',
  invisible_chars: 'formatting',
  keyword_stuffing: 'keywords',
  no_skills_section: 'keywords',
  no_metrics: 'keywords',
  no_linkedin: 'keywords',
  no_experience_section: 'experience',
  no_education_section: 'experience',
  no_dates: 'experience',
  no_email: 'contact',
  no_phone: 'contact',
}

export const TEASER_ORDER: TeaserCategory[] = ['keywords', 'formatting', 'experience', 'contact']

export interface Teaser {
  total: number
  /** Só as categorias com pelo menos um ponto, na ordem de `TEASER_ORDER`. */
  byCategory: { category: TeaserCategory; count: number }[]
  /** O problema mais grave, revelado de graça. `null` quando não há nenhum. */
  revealed: AtsIssueCode | null
}

export function teaserFrom(ats: Pick<AtsCheckResult, 'issues'>): Teaser {
  const counts = new Map<TeaserCategory, number>()
  for (const issue of ats.issues) {
    const category = ISSUE_CATEGORY[issue.code]
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  const byCategory = TEASER_ORDER.filter((c) => (counts.get(c) ?? 0) > 0).map((category) => ({
    category,
    count: counts.get(category)!,
  }))
  // O mais grave: severidade primeiro, depois quanto tira da nota — a mesma
  // ordem de `scoreAtsReadability`, refeita aqui para não depender dela.
  const worst = [...ats.issues].sort(
    (a, b) =>
      SEVERITY_RANK[ISSUE_PENALTY[a.code].severity] - SEVERITY_RANK[ISSUE_PENALTY[b.code].severity] ||
      ISSUE_PENALTY[b.code].points - ISSUE_PENALTY[a.code].points
  )[0]
  return { total: ats.issues.length, byCategory, revealed: worst?.code ?? null }
}
