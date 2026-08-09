import 'server-only'
import { db } from '../db'
import { executeAiTask } from '../ai-router/router'

/**
 * Juiz de qualidade por amostragem (P10).
 *
 * O agente de qualidade determinístico (`quality-agent.ts`) continua no caminho
 * da requisição: ele é barato, checa estrutura — JSON válido, dimensões
 * presentes, justificativas não vazias — e é o que dispara o failover para
 * outro provedor. Essa parte não deve virar chamada de LLM.
 *
 * O que ele não sabe avaliar é **conteúdo**: se a justificativa de uma dimensão
 * é específica ao currículo ou genérica, se a nota é coerente com o que foi
 * escrito, se a recomendação é acionável. Isso exige um segundo modelo lendo o
 * resultado — caro e lento demais para o caminho da requisição, que já opera
 * dentro de um orçamento apertado de 60s.
 *
 * Por isso este juiz roda:
 *
 * - **depois da resposta**, via `after()` do Next, sem somar nada à latência
 *   percebida pelo usuário;
 * - **por amostragem** (10%), porque a finalidade é medir tendência de
 *   qualidade ao longo do tempo, não auditar cada chamada;
 * - **no DeepSeek**, que é ~20x mais barato que o Sonnet e suficiente para
 *   julgar especificidade.
 *
 * O veredito nunca altera o que o usuário recebeu. Ele já foi entregue.
 */

/** Proporção das chamadas bem-sucedidas que são julgadas. */
const SAMPLE_RATE = 0.1

/** Só vale a pena julgar o que o usuário lê como laudo. */
const JUDGED_TASKS = ['full_analysis', 'rewrite', 'social_advice']

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'specific', 'notes'],
  properties: {
    score: { type: 'number' },
    /** `false` quando o texto serviria para qualquer currículo. */
    specific: { type: 'boolean' },
    notes: { type: 'string' },
  },
} as const

export function shouldJudge(taskType: string): boolean {
  if (!JUDGED_TASKS.includes(taskType)) return false
  return Math.random() < SAMPLE_RATE
}

/**
 * Julga um resultado já entregue e grava o veredito no `AiLog`.
 *
 * Silencioso por natureza: qualquer falha aqui é registrada e descartada. Este
 * código roda depois da resposta — não há a quem devolver um erro, e uma
 * exceção não tratada em `after()` só polui o log.
 */
export async function judgeAiResult(params: {
  aiLogId: string
  taskType: string
  content: string
  sourceExcerpt: string
}): Promise<void> {
  const { aiLogId, taskType, content, sourceExcerpt } = params

  try {
    const verdict = await executeAiTask({
      taskType: 'support_chat', // roteado para DeepSeek em INITIAL_TASK_ROUTING
      // Sem `userId`: este custo é operacional, não do usuário, e associá-lo a
      // ele distorceria o custo por usuário no painel.
      internal: true,
      systemPrompt: `Você audita a qualidade de laudos gerados por IA para candidatos.

Avalie se o RESULTADO é específico ao MATERIAL DE ORIGEM ou se é texto genérico que serviria para qualquer pessoa.

Critérios:
- "score" de 0 a 10 para utilidade real ao candidato.
- "specific" = false se o texto não cita nada concreto do material de origem.
- "notes": uma frase apontando o principal problema, ou o principal acerto.

Responda APENAS JSON válido.`,
      userPrompt: `TIPO DE TAREFA: ${taskType}

MATERIAL DE ORIGEM (trecho):
${sourceExcerpt.slice(0, 3000)}

RESULTADO GERADO:
${content.slice(0, 6000)}`,
      maxTokens: 500,
      jsonSchema: JUDGE_SCHEMA as unknown as Record<string, unknown>,
    })

    const cleaned = verdict.content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    const score = typeof parsed.score === 'number' ? parsed.score : null
    if (score === null) return

    await db.aiLog.update({
      where: { id: aiLogId },
      data: {
        qualityScore: score,
        qualityNotes: [parsed.specific === false ? '[genérico]' : null, String(parsed.notes || '')]
          .filter(Boolean)
          .join(' ')
          .slice(0, 500),
        qualityJudgedAt: new Date(),
      },
    })
  } catch (e: any) {
    console.warn('[quality-judge] Julgamento descartado:', e?.message || e)
  }
}
