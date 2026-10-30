export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireUnlockedResume } from '@/lib/entitlements'
import { executeAiTask } from '@/lib/ai-router/router'
import { wrapUntrustedDocument } from '@/lib/analysis/untrusted'
import { LANGUAGE_DIRECTIVE } from '@/lib/i18n/server'
import { LANGUAGES, type Language } from '@/lib/i18n/types'
import { MAX_RESUME_CHARS } from '@/lib/validation'
import { bannedTermsPrompt, writingLangOf } from '@/lib/writing/slop'
import {
  MAX_BLOCK_CHARS,
  MAX_BLOCK_IMPROVEMENTS,
  MAX_INSTRUCTION_CHARS,
  cleanImprovedBlock,
  splitBlocks,
} from '@/lib/resume-editor/sections'

/**
 * Editor por partes do currículo reescrito (§2.161).
 *
 * - `PUT` grava o currículo editado em `rewrittenContent` — é dele que saem o
 *   PDF e os outros arquivos, então a próxima baixada já vem atualizada.
 * - `POST` melhora UM bloco com IA e devolve a sugestão SEM gravar: a pessoa
 *   vê, usa ou descarta, e só o "salvar" grava.
 *
 * Os dois exigem o currículo liberado (Análise Completa): o editor é parte do
 * que se compra, não uma porta para reescrita grátis.
 */

const noStore = { 'Cache-Control': 'no-store' }

const saveSchema = z.object({
  resumeId: z.string().min(1).max(100),
  content: z.string().trim().min(30).max(MAX_RESUME_CHARS),
})

const improveSchema = z.object({
  resumeId: z.string().min(1).max(100),
  block: z.string().trim().min(10).max(MAX_BLOCK_CHARS),
  instruction: z.string().trim().max(MAX_INSTRUCTION_CHARS).optional(),
  lang: z.string().max(5).optional(),
})

async function guard(resumeId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401, headers: noStore }) }
  const entitlement = await requireUnlockedResume(user.id, resumeId)
  if (!entitlement.ok) {
    return {
      error: NextResponse.json(
        { error: entitlement.error, code: entitlement.code },
        { status: entitlement.status, headers: noStore }
      ),
    }
  }
  return { user }
}

export async function PUT(req: Request) {
  const parsed = saveSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers: noStore })
  const g = await guard(parsed.data.resumeId)
  if (g.error) return g.error

  await db.resume.update({
    where: { id: parsed.data.resumeId },
    data: { rewrittenContent: parsed.data.content },
  })
  await db.auditLog
    .create({
      data: {
        userId: g.user.id,
        resumeId: parsed.data.resumeId,
        action: 'resume_edited',
        meta: JSON.stringify({ length: parsed.data.content.length }),
      },
    })
    .catch(() => {})
  return NextResponse.json({ ok: true }, { headers: noStore })
}

function systemPrompt(lang: Language): string {
  const writingLang = writingLangOf(lang)
  return `Você é redator de currículos. Recebe UM bloco de um currículo, em Markdown, e o devolve melhorado.

REGRAS OBRIGATÓRIAS:
1. Não invente nada: nenhum número, percentual, ferramenta, empresa, cargo, data, curso ou resultado que não esteja no bloco ou no currículo original da pessoa. Inventar é falsificar o currículo.
2. Mantenha a PRIMEIRA linha (o título do bloco) exatamente igual.
3. Siga o pedido da pessoa, se houver, desde que não exija inventar. Sem pedido, deixe o texto mais claro, direto e profissional.
4. Markdown puro: tópicos com '- ' e negrito com '**' quando já existirem. Sem emojis, sem comentário antes ou depois.${writingLang ? `\n\n${bannedTermsPrompt(writingLang)}` : ''}

Responda APENAS com o bloco melhorado.

${LANGUAGE_DIRECTIVE[lang] ?? LANGUAGE_DIRECTIVE.en}`
}

export async function POST(req: Request) {
  const parsed = improveSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers: noStore })
  const { resumeId, block, instruction } = parsed.data
  const g = await guard(resumeId)
  if (g.error) return g.error
  const lang: Language = (LANGUAGES as string[]).includes(parsed.data.lang ?? '') ? (parsed.data.lang as Language) : 'en'

  // Reserva antes da chamada, numa atualização condicional: dois cliques em
  // paralelo não passam do teto. Devolvida se a IA falhar.
  const reserved = await db.resume.updateMany({
    where: { id: resumeId, userId: g.user.id, blockImprovements: { lt: MAX_BLOCK_IMPROVEMENTS } },
    data: { blockImprovements: { increment: 1 } },
  })
  if (reserved.count === 0) {
    return NextResponse.json({ error: 'LIMIT_REACHED', limit: MAX_BLOCK_IMPROVEMENTS }, { status: 429, headers: noStore })
  }
  const release = () =>
    db.resume.update({ where: { id: resumeId }, data: { blockImprovements: { decrement: 1 } } }).catch(() => {})

  try {
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
      select: { originalContent: true, blockImprovements: true },
    })
    const original = splitBlocks(block)[0] ?? { heading: null, level: 1 as const, text: block }
    const ai = await executeAiTask({
      taskType: 'resume_block_improve',
      systemPrompt: systemPrompt(lang),
      userPrompt: [
        wrapUntrustedDocument((resume?.originalContent ?? '').slice(0, 12000), 'currículo original, só para conferir fatos'),
        wrapUntrustedDocument(block, 'bloco a melhorar'),
        instruction ? wrapUntrustedDocument(instruction, 'pedido da pessoa') : 'Sem pedido específico.',
      ].join('\n\n'),
      maxTokens: 1500,
      disableThinking: true,
      modelOverride: 'claude-haiku-4-5',
      userId: g.user.id,
      timeBudgetMs: 40_000,
    })
    const improved = cleanImprovedBlock(ai.content, original)
    if (!improved) {
      await release()
      return NextResponse.json({ error: 'GENERIC' }, { status: 502, headers: noStore })
    }
    return NextResponse.json(
      { block: improved, remaining: Math.max(0, MAX_BLOCK_IMPROVEMENTS - (resume?.blockImprovements ?? MAX_BLOCK_IMPROVEMENTS)) },
      { headers: noStore }
    )
  } catch (e: any) {
    await release()
    console.error('[resume-edit] melhorar bloco falhou:', e?.message || e)
    return NextResponse.json({ error: 'GENERIC' }, { status: 502, headers: noStore })
  }
}
