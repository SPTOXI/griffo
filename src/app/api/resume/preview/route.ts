export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { getRequestLanguage, LANGUAGE_DIRECTIVE } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { DIMENSION_KEYS, DIMENSION_LABELS, type DimensionKey } from '@/lib/analysis/stages'
import { checkResumeContent } from '@/lib/analysis/content-guard'

/**
 * Prévia gratuita: as oito notas, e só isso.
 *
 * É o que converte. A pessoa vê a nota e não vê o porquê — nem diagnóstico, nem
 * recomendação, nem texto. Uma prévia que explicasse o problema já teria
 * entregado o produto.
 *
 * Roda em `free_preview`, roteado para o DeepSeek: US$ 0,0017 por conta contra
 * US$ 1,04 da análise completa. É o único item que roda deliberadamente no
 * modelo barato, e é o que torna sustentável servi-lo a quem nunca vai pagar.
 *
 * Uma por conta, controlada por `User.freePreviewAt` — sem isso, abrir
 * currículos novos seria a forma gratuita de obter o que se vende.
 */

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório'),
})

const PREVIEW_INPUT_LIMIT = 12000

const previewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['overall', 'scores'],
  properties: {
    overall: { type: 'number', minimum: 0, maximum: 10 },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: [...DIMENSION_KEYS],
      properties: Object.fromEntries(
        DIMENSION_KEYS.map((key) => [key, { type: 'number', minimum: 0, maximum: 10 }])
      ),
    },
  },
} as const

function parseJsonLoose(raw: string): any {
  return JSON.parse(
    raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  )
}

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(10, Math.round(num * 10) / 10))
}

export async function POST(req: Request) {
  // Só é devolvida se ESTA requisição a tiver tomado — ver o `catch`.
  let claimedQuota: { userId: string; at: Date } | null = null

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
      select: { id: true, originalContent: true, previewJson: true, unlockedAt: true },
    })
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    // Antes de gastar a única prévia gratuita da conta: currículo ilegível não
    // produz nota, e queimar a cota nele seria cobrar duas vezes pelo erro.
    const verdict = checkResumeContent(resume.originalContent)
    if (!verdict.analyzable) {
      return NextResponse.json(
        { error: verdict.message, code: 'UNREADABLE_RESUME' },
        { status: 422 }
      )
    }

    // Já calculada: devolve a mesma, sem gastar de novo e sem consumir a cota.
    if (resume.previewJson) {
      return NextResponse.json({ preview: JSON.parse(resume.previewJson), cached: true })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { freePreviewAt: true, role: true },
    })

    const exempt = dbUser?.role === 'admin' || Boolean(resume.unlockedAt)
    if (!exempt && dbUser?.freePreviewAt) {
      return NextResponse.json(
        {
          error: 'Sua prévia gratuita já foi usada. A Análise Completa entrega o laudo inteiro.',
          code: 'PREVIEW_ALREADY_USED',
        },
        { status: 402 }
      )
    }

    // A cota é marcada ANTES da chamada de IA, e condicionada a ainda estar
    // livre. Marcar depois abriria a janela em que dois pedidos simultâneos
    // rodam duas prévias — e o custo de uma prévia perdida é US$ 0,0017, muito
    // menor que o de servir infinitas.
    if (!exempt) {
      const claimedAt = new Date()
      const claimed = await db.user.updateMany({
        where: { id: user.id, freePreviewAt: null },
        data: { freePreviewAt: claimedAt },
      })
      if (claimed.count === 0) {
        return NextResponse.json(
          { error: 'Sua prévia gratuita já foi usada.', code: 'PREVIEW_ALREADY_USED' },
          { status: 402 }
        )
      }
      claimedQuota = { userId: user.id, at: claimedAt }
    }

    const lang = getRequestLanguage(req)

    const result = await executeAiTask({
      taskType: 'free_preview',
      userId: user.id,
      resumeId: resume.id,
      userCountry: edgeCountry(req),
      // Extração numérica pura: o raciocínio não acrescenta nada e disputa o
      // mesmo orçamento de tokens da resposta.
      disableThinking: true,
      /**
       * Prazo curto, de propósito — metade do padrão do roteador.
       *
       * Esta é a PRIMEIRA coisa que alguém vê do produto, e são oito números de
       * um modelo barato: se demorar, não é porque o trabalho é grande, é
       * porque algo travou. O orçamento padrão de 52s deixaria um provedor
       * pendurado quase até o teto da função antes de tentar o suplente — a
       * pessoa esperaria quase um minuto para ver um erro.
       *
       * Com 25s o roteador troca de provedor rápido, e ainda cabe a segunda
       * tentativa que a tela faz por conta própria. Duas esperas de 25s com
       * chance de acertar valem mais que uma de 52s que termina em nada.
       */
      timeBudgetMs: 25_000,
      systemPrompt:
        `${LANGUAGE_DIRECTIVE[lang]}\n\n` +
        'Você avalia currículos e devolve NOTAS, nada além disso.\n\n' +
        'Atribua de 0 a 10 a cada uma das oito dimensões abaixo, e uma nota geral ' +
        'coerente com elas:\n' +
        DIMENSION_KEYS.map((key, i) => `${i + 1}. "${key}": ${DIMENSION_LABELS[key]}`).join('\n') +
        '\n\nUse a régua inteira: um currículo mediano tira entre 5 e 7, e nota 9 ou 10 ' +
        'exige evidência concreta no texto. NÃO escreva justificativa, recomendação ou ' +
        'qualquer texto — apenas os números do schema.',
      userPrompt: `Currículo a avaliar:\n\n${resume.originalContent.slice(0, PREVIEW_INPUT_LIMIT)}`,
      maxTokens: 500,
      jsonSchema: previewSchema as unknown as Record<string, unknown>,
    })

    const raw = parseJsonLoose(result.content)
    const scores = Object.fromEntries(
      DIMENSION_KEYS.map((key) => [key, clampScore(raw?.scores?.[key])])
    ) as Record<DimensionKey, number>

    const average =
      DIMENSION_KEYS.reduce((sum, key) => sum + scores[key], 0) / DIMENSION_KEYS.length

    const preview = {
      // A nota geral é a média das oito, não um número que o modelo escolheu à
      // parte: uma geral que não bate com as dimensões exibidas ao lado dela é
      // a primeira coisa que o usuário nota — e a primeira razão para duvidar
      // do resto.
      overall: Math.round(average * 10) / 10,
      scores,
      dimensions: DIMENSION_KEYS.map((key) => ({
        key,
        label: DIMENSION_LABELS[key],
        score: scores[key],
      })),
      generatedAt: new Date().toISOString(),
    }

    await db.resume.update({
      where: { id: resume.id },
      data: { previewJson: JSON.stringify(preview) },
    })

    return NextResponse.json({ preview, cached: false })
  } catch (e: any) {
    console.error('preview error:', e?.diagnostic || e?.message || e)

    // A cota volta só quando foi tomada nesta requisição e a prévia não saiu.
    // Sem isto, uma indisponibilidade do provedor queimaria a única prévia
    // gratuita da conta — o usuário perderia o que converte por um problema que
    // não é dele. A devolução é condicionada a `freePreviewAt` ser exatamente o
    // que gravamos, então uma prévia bem-sucedida em paralelo não é desfeita.
    if (claimedQuota) {
      await db.user
        .updateMany({
          where: { id: claimedQuota.userId, freePreviewAt: claimedQuota.at },
          data: { freePreviewAt: null },
        })
        .catch(() => {})
    }

    return NextResponse.json(
      { error: 'Não foi possível gerar sua prévia agora. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
