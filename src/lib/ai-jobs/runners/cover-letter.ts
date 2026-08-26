import 'server-only'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { loadProfileContext } from '../../profile/server'
import { buildResumeContext } from '../../analysis/resume-context'
import { registerAiJobRunner } from '../engine'
import { runSingleCallJob } from './single-call'

const str = { type: 'string' } as const

const COVER_LETTER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['coverLetter', 'professionalSummary', 'keywords'],
  properties: {
    coverLetter: str,
    professionalSummary: str,
    keywords: { type: 'array', items: str },
  },
} as const

export interface CoverLetterResult {
  coverLetter: string
  professionalSummary: string
  keywords: string[]
  targetJob: string | null
  generatedAt: string
}

/**
 * Validação própria desta tarefa — mesma exigida antes de existir esta
 * conversão para job: uma carta de 200 caracteres não é uma carta curta, é
 * uma carta que não foi escrita.
 */
export function parseCoverLetter(rawText: string): {
  coverLetter: string
  professionalSummary: string
  keywords: string[]
} {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu a carta em formato inválido.')
  }

  const coverLetter = typeof parsed?.coverLetter === 'string' ? parsed.coverLetter.trim() : ''
  if (coverLetter.length < 400) {
    throw new Error('A carta de apresentação veio vazia ou curta demais para ser usada.')
  }

  const professionalSummary =
    typeof parsed?.professionalSummary === 'string' ? parsed.professionalSummary.trim() : ''
  if (professionalSummary.length < 120) {
    throw new Error('O resumo profissional veio vazio ou curto demais para ser usado.')
  }

  const keywords = Array.isArray(parsed?.keywords)
    ? parsed.keywords.map((k: unknown) => String(k || '').trim()).filter(Boolean).slice(0, 12)
    : []

  return { coverLetter, professionalSummary, keywords }
}

/**
 * Carta de apresentação e resumo profissional direcionado.
 *
 * Prompt, schema e pós-processamento movidos de
 * `api/resume/cover-letter/route.ts` sem alteração — só o desfecho mudou, de
 * resposta síncrona para job com progresso real.
 */
export async function processCoverLetterJob(jobId: string): Promise<void> {
  await runSingleCallJob(jobId, async (job, onAttempt) => {
    const resume = await db.resume.findUnique({
      where: { id: job.resumeId },
      select: { id: true, originalContent: true, targetJob: true, targetJobDescription: true },
    })
    if (!resume) throw new Error('Currículo não encontrado.')

    const lang = job.lang as 'pt' | 'en' | 'es'

    const { market, promptContext: profileContext } = await loadProfileContext(job.userId, {
      edgeCountry: job.userCountry,
      language: lang,
    })

    const cacheableContext = buildResumeContext({
      resumeContent: resume.originalContent.slice(0, 15000),
      targetJob: resume.targetJob,
      targetJobDescription: resume.targetJobDescription,
      lang,
      market,
      profileContext,
    })

    const jobBlock = resume.targetJobDescription
      ? 'A vaga alvo está no contexto acima. Direcione a carta e o resumo a ELA, citando exigências concretas.'
      : resume.targetJob
        ? 'O cargo alvo está no contexto acima, mas não há descrição da vaga. Direcione ao cargo, sem inventar exigências que não foram informadas.'
        : 'NENHUMA VAGA ALVO FOI INFORMADA. Escreva uma carta e um resumo direcionados à área de atuação evidente no currículo. NÃO invente empresa, vaga ou processo seletivo.'

    const systemPrompt = `Você é redator sênior de candidaturas: escreve cartas de apresentação e resumos profissionais que passam por triagem automática e convencem um recrutador humano.

${jobBlock}

REGRAS DE HONESTIDADE — inegociáveis:
1. Use APENAS o que está no currículo. NÃO invente empregador, cargo, período, formação, certificação, número ou resultado.
2. Se a vaga exige algo que o candidato não tem, NÃO afirme que ele tem. Ou omita, ou trate como disposição a desenvolver.
3. NÃO invente nome de empresa contratante, nome de recrutador nem data.
4. Nenhum espaço reservado do tipo [seu nome] ou [empresa]: se o dado não existe, reescreva a frase sem ele.

O QUE PRODUZIR:

- "coverLetter": carta pronta para enviar, entre 220 e 350 palavras, no formato de candidatura usual do mercado acima. Abertura que diz a que veio, dois ou três parágrafos ligando experiência real aos requisitos, fechamento com disponibilidade. Sem emojis e sem símbolos decorativos — a carta passa por sistemas de triagem que os corrompem.
- "professionalSummary": resumo profissional para o TOPO DO CURRÍCULO, de 3 a 5 frases, na terceira pessoa implícita (sem "eu"), direcionado à vaga alvo. É o parágrafo de abertura do documento, não um texto de rede social.
- "keywords": 6 a 10 termos do vocabulário da vaga e do mercado que foram efetivamente incorporados aos dois textos.

Responda APENAS o JSON do schema, sem texto antes ou depois.`

    const aiResponse = await executeAiTask({
      taskType: 'cover_letter',
      userId: job.userId,
      resumeId: resume.id,
      userCountry: job.userCountry,
      cacheableContext,
      systemPrompt,
      userPrompt: 'Produza a carta de apresentação e o resumo profissional para o candidato do contexto acima.',
      maxTokens: 2600,
      disableThinking: true,
      maxProviderAttempts: 1,
      jsonSchema: COVER_LETTER_JSON_SCHEMA as unknown as Record<string, unknown>,
      onProviderAttempt: onAttempt,
    })

    const result = parseCoverLetter(aiResponse.content)

    const stored: CoverLetterResult = {
      ...result,
      targetJob: resume.targetJob || null,
      generatedAt: new Date().toISOString(),
    }

    await db.resume.update({
      where: { id: resume.id },
      data: { coverLetterJson: JSON.stringify(stored) },
    })

    return JSON.stringify({ coverLetter: stored })
  })
}

registerAiJobRunner('cover_letter', processCoverLetterJob)
