import 'server-only'
import { db } from '../../db'
import { executeAiTask } from '../../ai-router/router'
import { buildResumeContext } from '../../analysis/resume-context'
import { loadProfileContext } from '../../profile/server'
import { buildRewriteSegments, mergeRewriteSegments, type RewriteSegmentId } from '../../resume-rewrite/segments'
import { claimAiJob, completeAiJob, createStepWriter, failAiJob, registerAiJobRunner } from '../engine'
import type { Language } from '../../i18n'

// A análise já corta a entrada em 15.000 caracteres; a reescrita envia o
// currículo inteiro. Como o upload não impõe teto de tamanho, um documento
// muito grande faria o custo e o tempo desta rota crescerem sem limite.
const REWRITE_INPUT_LIMIT = 20000

/**
 * Reescrita do currículo em 3 seções paralelas, cada uma uma etapa real (ver
 * `lib/resume-rewrite/segments.ts` e 2.35 na auditoria).
 *
 * Prompt-base, contexto e persistência movidos de
 * `api/resume/rewrite/route.ts` sem alteração de conteúdo — só a divisão em
 * seções, e o desfecho, que passou de resposta síncrona para job com
 * progresso real.
 */
export async function processRewriteJob(jobId: string): Promise<void> {
  if (!(await claimAiJob(jobId))) return

  const job = await db.aiJob.findUnique({ where: { id: jobId } })
  if (!job) return
  if (job.status === 'completed' || job.status === 'failed') return

  const writeStep = createStepWriter(jobId)
  const steps: Record<string, unknown> = {}

  try {
    const resume = await db.resume.findUnique({
      where: { id: job.resumeId },
      select: {
        id: true,
        originalContent: true,
        targetJob: true,
        targetJobDescription: true,
        analysisJson: true,
      },
    })
    if (!resume) throw new Error('Currículo não encontrado.')

    const lang = job.lang as Language

    const { market, promptContext: profileContext } = await loadProfileContext(job.userId, {
      edgeCountry: job.userCountry,
      language: lang,
    })

    let keywordsHint = ''
    if (resume.analysisJson) {
      try {
        const parsedAnalysis = JSON.parse(resume.analysisJson)
        if (Array.isArray(parsedAnalysis.keywords) && parsedAnalysis.keywords.length > 0) {
          keywordsHint = `\n\nPalavras-Chave Estratégicas (ATS) obrigatórias a serem incorporadas organicamente na reescrita: ${parsedAnalysis.keywords.join(', ')}.`
        }
      } catch {
        // segue sem palavras-chave
      }
    }

    const cacheableContext = buildResumeContext({
      resumeContent: resume.originalContent.slice(0, REWRITE_INPUT_LIMIT),
      targetJob: resume.targetJob,
      targetJobDescription: resume.targetJobDescription,
      lang,
      market,
      profileContext,
    })

    const specs = buildRewriteSegments(keywordsHint, lang)
    const done: Partial<Record<RewriteSegmentId, string>> = {}

    const outcomes = await Promise.allSettled(
      specs.map(async (spec) => {
        const result = await executeAiTask({
          taskType: 'rewrite',
          userId: job.userId,
          resumeId: resume.id,
          userCountry: job.userCountry,
          cacheableContext,
          systemPrompt: spec.instruction,
          userPrompt: 'Produza agora, para o currículo do contexto, exatamente a seção que a sua tarefa pede.',
          maxTokens: spec.maxTokens,
          // Reescrever é geração longa e serial — os tokens SÃO a latência —,
          // mas cada seção agora é pequena o bastante para caber com folga no
          // teto por tentativa, o que permite ter suplente real de novo.
          disableThinking: true,
          maxProviderAttempts: 2,
        })

        done[spec.id] = result.content.trim()
        steps[spec.id] = { at: new Date().toISOString() }
        void writeStep({ ...steps })
      })
    )

    const errors = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected')
    if (errors.length > 0) {
      const message = errors.map((e) => e.reason?.diagnostic || e.reason?.message || String(e.reason)).join(' | ')
      throw new Error(`Falha ao reescrever ${errors.length} de ${specs.length} seção(ões): ${message}`)
    }

    const rewrittenContent = mergeRewriteSegments(done)

    await db.resume.update({
      where: { id: resume.id },
      data: { rewrittenContent },
    })

    await db.auditLog.create({
      data: {
        userId: job.userId,
        resumeId: resume.id,
        action: 'rewrite',
        meta: JSON.stringify({ sections: specs.length }),
      },
    })

    await completeAiJob(jobId, JSON.stringify({ rewrittenContent }))
  } catch (e: any) {
    const message = e?.diagnostic
      ? 'Os provedores de IA não responderam a tempo nesta tentativa. Tente de novo.'
      : e?.message && typeof e.message === 'string' && e.message.length < 300
        ? e.message
        : 'Ocorreu uma falha ao reescrever o currículo.'
    await failAiJob(jobId, message, e?.diagnostic || e?.message)
  }
}

registerAiJobRunner('rewrite', processRewriteJob)
