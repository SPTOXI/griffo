import 'server-only'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { jobPromptContext } from '../../matching/job-fit'
import type { MatchResult } from '../../matching/compatibility'
import type { NormalizedJob } from '../../jobs/types'
import { registerAiJobRunner } from '../engine'
import { runSingleCallJob } from './single-call'

const str = { type: 'string' } as const

const INTERVIEW_PREP_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'signal', 'groundedIn', 'tip'],
        properties: {
          question: str,
          // strength = o candidato atende isto e pode ser sondado a fundo;
          // gap = o candidato não atende, e é aí que a pergunta vai doer.
          signal: { type: 'string', enum: ['strength', 'gap'] },
          // O requisito, competência ou lacuna EXATA do contexto que motiva
          // esta pergunta — não uma categoria genérica.
          groundedIn: str,
          tip: str,
        },
      },
    },
  },
} as const

export interface InterviewPrepResult {
  questions: Array<{ question: string; signal: 'strength' | 'gap'; groundedIn: string; tip: string }>
  generatedAt: string
}

/**
 * Validação própria desta tarefa: uma lista de perguntas genéricas (sem
 * ancoragem na vaga) não é uma preparação de entrevista, é um texto de
 * enchimento — ver a mesma exigência em `parseCoverLetter`.
 */
export function parseInterviewPrep(rawText: string): InterviewPrepResult['questions'] {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu as perguntas em formato inválido.')
  }

  const questions = Array.isArray(parsed?.questions)
    ? parsed.questions
        .map((q: any) => ({
          question: typeof q?.question === 'string' ? q.question.trim() : '',
          signal: q?.signal === 'strength' || q?.signal === 'gap' ? q.signal : null,
          groundedIn: typeof q?.groundedIn === 'string' ? q.groundedIn.trim() : '',
          tip: typeof q?.tip === 'string' ? q.tip.trim() : '',
        }))
        .filter((q: any) => q.question.length >= 15 && q.signal && q.groundedIn && q.tip)
    : []

  if (questions.length < 4) {
    throw new Error('A IA não gerou perguntas suficientes com base na vaga.')
  }

  return questions
}

/** Mesmo padrão de `jobFromRow`/`list` de `api/radar/route.ts`, local a este runner. */
function list(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function jobFromRow(row: any): NormalizedJob {
  return {
    sourceJobId: row.sourceJobId,
    company: row.company,
    companyKey: row.companyKey,
    title: row.title,
    normalizedTitle: row.normalizedTitle,
    country: row.country,
    region: row.region,
    city: row.city,
    remoteType: row.remoteType,
    market: row.market,
    employmentType: row.employmentType,
    seniority: row.seniority,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    salaryPeriod: row.salaryPeriod,
    description: row.description,
    requirements: list(row.requirements),
    skills: list(row.skills),
    language: row.language,
    applicationUrl: row.applicationUrl,
    dedupeKey: row.dedupeKey,
    publishedAt: row.publishedAt,
    unknownFields: {},
  }
}

const SYSTEM_PROMPT = `Você é um recrutador técnico sênior preparando um candidato para a entrevista de UMA vaga específica.

O contexto acima traz a vaga (requisitos, competências, descrição), o que o candidato JÁ ATENDE e as LACUNAS identificadas pelo match.

REGRA INEGOCIÁVEL: toda pergunta tem que nascer de algo CONCRETO no contexto acima — um requisito declarado, uma competência pedida, ou uma lacuna listada. Proibido perguntas genéricas de entrevista ("fale sobre você", "qual seu maior defeito") que serviriam para qualquer vaga.

Para cada pergunta:
- Se nasce de algo que o candidato JÁ ATENDE ("strength"): é uma pergunta que aprofunda, testando se o domínio é real ou superficial.
- Se nasce de uma LACUNA ("gap"): é uma pergunta que o entrevistador plausivelmente faria para testar exatamente aquele ponto fraco — sem acusar, mas sem fingir que a lacuna não existe.

"groundedIn": cite o requisito/competência/lacuna EXATA do contexto (não uma paráfrase vaga) — é o que explica ao candidato por que ESTA pergunta, para ESTA vaga.
"tip": uma frase só, coaching prático de como abordar a resposta (estrutura, o que citar, o que evitar) — não a resposta pronta.

Gere entre 5 e 8 perguntas. Responda APENAS o JSON do schema, sem texto antes ou depois.`

/**
 * Perguntas de entrevista prováveis para uma vaga do Radar (§18/§19 —
 * completa a ação `interview_prep` já declarada em `lib/matching/job-fit.ts`
 * e nunca implementada).
 *
 * `job.inputJson` traz `{ alertId }` — preparado pela rota ANTES de criar o
 * job, seguindo o mesmo motivo documentado no campo: reler o alerta aqui
 * dentro, e não confiar num id solto, é o que mantém o isolamento por
 * usuário mesmo quando `resumeIfStalled` retoma o job fora da requisição
 * original.
 */
export async function processInterviewPrepJob(jobId: string): Promise<void> {
  await runSingleCallJob(jobId, async (job, onAttempt) => {
    const input = job.inputJson ? JSON.parse(job.inputJson) : {}
    const alertId = input.alertId as string | undefined
    if (!alertId) throw new Error('Vaga não identificada para esta preparação.')

    const alert = await db.radarAlert.findFirst({
      where: { id: alertId, userId: job.userId },
      select: { id: true, matchJson: true, job: true },
    })
    if (!alert) throw new Error('Oportunidade não encontrada.')

    let match: MatchResult | null = null
    try {
      match = JSON.parse(alert.matchJson)
    } catch {
      match = null
    }
    if (!match) throw new Error('Não foi possível ler o match desta vaga.')

    const normalizedJob = jobFromRow(alert.job)
    const cacheableContext = jobPromptContext(normalizedJob, match)

    const aiResponse = await executeAiTask({
      taskType: 'interview_prep',
      userId: job.userId,
      resumeId: job.resumeId,
      userCountry: job.userCountry,
      cacheableContext,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: 'Gere as perguntas de entrevista para o candidato do contexto acima.',
      maxTokens: 2000,
      disableThinking: true,
      maxProviderAttempts: 1,
      jsonSchema: INTERVIEW_PREP_JSON_SCHEMA as unknown as Record<string, unknown>,
      onProviderAttempt: onAttempt,
    })

    const questions = parseInterviewPrep(aiResponse.content)

    const stored: InterviewPrepResult = {
      questions,
      generatedAt: new Date().toISOString(),
    }

    // Grava o cache só depois do parse validar — uma falha não deixa cache
    // ruim gravado em `RadarAlert.interviewPrepJson`.
    await db.radarAlert.update({
      where: { id: alertId },
      data: { interviewPrepJson: JSON.stringify(stored) },
    })

    return JSON.stringify({ interviewPrep: stored })
  })
}

registerAiJobRunner('interview_prep', processInterviewPrepJob)
