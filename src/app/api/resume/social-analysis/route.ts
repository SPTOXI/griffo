export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import {
  reserveCredits,
  settleReservation,
  releaseReservation,
  CREDIT_COSTS,
  type CreditReservation,
} from '@/lib/credits'
import { getRequestLanguage, LANGUAGE_DIRECTIVE, SOCIAL_PLATFORMS_BY_MARKET } from '@/lib/i18n/server'
import { getRequestCountry } from '@/lib/currency'
import { fetchAllProfiles, detectPlatform, type SocialProfileData } from '@/lib/social/fetchers'
import { parsePdfBase64 } from '@/lib/pdf-text'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
  /**
   * Conteúdo que o usuário forneceu para perfis que não puderam ser lidos —
   * o LinkedIn sempre, e as demais plataformas quando a leitura falha.
   * Chave = URL do perfil.
   */
  suppliedContent: z.record(z.string(), z.string().max(20000)).optional(),
  /** Texto já extraído do perfil, quando o cliente prefere colar. */
  linkedinPdfText: z.string().max(30000).optional(),
  /** PDF que o LinkedIn gera em "Mais → Salvar como PDF", em base64. */
  linkedinPdfBase64: z.string().optional(),
})

const str = { type: 'string' } as const

const SOCIAL_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['overallAssessment', 'profiles'],
  properties: {
    overallAssessment: str,
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['platform', 'url', 'analyzed', 'findings', 'headline', 'aboutSummary', 'tips'],
        properties: {
          platform: str,
          url: str,
          /** `false` quando o conteúdo não pôde ser lido — o conselho vira genérico e é rotulado como tal. */
          analyzed: { type: 'boolean' },
          findings: str,
          headline: str,
          aboutSummary: str,
          tips: { type: 'array', items: str },
        },
      },
    },
  },
} as const

function parseSocialAnalysis(rawText: string): any {
  const cleaned = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A IA devolveu a análise em formato inválido.')
  }

  if (!Array.isArray(parsed?.profiles) || parsed.profiles.length === 0) {
    throw new Error('A análise veio sem perfis.')
  }
  if (typeof parsed?.overallAssessment !== 'string' || !parsed.overallAssessment.trim()) {
    throw new Error('A análise veio sem avaliação geral.')
  }

  return parsed
}

/** Monta o bloco de contexto, deixando explícito o que foi lido e o que não foi. */
function buildProfilesContext(profiles: SocialProfileData[]): string {
  const blocks = profiles.map((p) => {
    if (p.status === 'fetched' && p.content) {
      return `### ${p.platform.toUpperCase()} — ${p.url}\nCONTEÚDO REAL DO PERFIL:\n${p.content}`
    }
    return `### ${p.platform.toUpperCase()} — ${p.url}\nCONTEÚDO NÃO DISPONÍVEL. Motivo: ${p.note || 'não foi possível ler'}`
  })
  return blocks.join('\n\n')
}

/**
 * Prazo total da rota, em milissegundos, deixando folga dentro do
 * `maxDuration` de 60s para o reembolso e a resposta HTTP.
 *
 * Esta rota trabalha ANTES de chamar a IA — lê o PDF e busca os perfis, o que
 * pode levar 10s — e o roteador, sozinho, planejava em cima dos 52s cheios como
 * se a chamada começasse junto com a requisição. Somados, os dois estouravam o
 * limite da plataforma, que encerrava a função antes do `catch`: o usuário
 * pagava e não recebia nem o resultado nem a mensagem de erro.
 */
const ROUTE_BUDGET_MS = 52_000

export async function POST(req: Request) {
  const routeStart = Date.now()
  let reservation: CreditReservation | null = null
  const costCredits = CREDIT_COSTS.social_optimization

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
    })
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    // Reúne os links do perfil do usuário e do currículo.
    const links: Record<string, string> = {}
    for (const source of [user.socialLinks, resume.socialLinksJson]) {
      if (!source) continue
      try {
        Object.assign(links, JSON.parse(source))
      } catch {
        // fonte corrompida: ignora em vez de derrubar a rota
      }
    }

    const urls = Object.values(links).filter((u) => typeof u === 'string' && u.trim())
    const supplied = parsed.data.suppliedContent || {}

    // O PDF é extraído aqui, antes de cobrar: um arquivo ilegível vira erro
    // com instrução, não uma análise cobrada sem insumo.
    let linkedinText = parsed.data.linkedinPdfText?.trim() || ''
    if (!linkedinText && parsed.data.linkedinPdfBase64) {
      const decoded = await parsePdfBase64(parsed.data.linkedinPdfBase64)
      if (decoded.error) {
        return NextResponse.json({ error: decoded.error }, { status: 400 })
      }
      linkedinText = decoded.text.trim()
    }
    const hasLinkedinPdf = !!linkedinText

    if (urls.length === 0 && Object.keys(supplied).length === 0 && !hasLinkedinPdf) {
      return NextResponse.json(
        { error: 'Cadastre ao menos um perfil profissional antes de solicitar a análise.' },
        { status: 400 }
      )
    }

    // Busca ANTES de cobrar: se nenhum perfil puder ser lido, o usuário recebe
    // uma orientação do que fazer em vez de pagar por uma análise sem insumo.
    const fetched = await fetchAllProfiles(urls)

    // Substitui o conteúdo dos perfis que o usuário forneceu manualmente.
    const profiles: SocialProfileData[] = fetched.map((p) => {
      const manual = supplied[p.url] || supplied[p.url.replace(/\/$/, '')]
      if (manual?.trim()) {
        return { ...p, status: 'fetched' as const, content: manual.trim().slice(0, 4000), note: undefined }
      }
      if (p.platform === 'linkedin' && hasLinkedinPdf) {
        return {
          ...p,
          status: 'fetched' as const,
          content: linkedinText.slice(0, 4000),
          note: undefined,
        }
      }
      return p
    })

    // PDF do LinkedIn enviado sem que houvesse um link do LinkedIn cadastrado.
    if (hasLinkedinPdf && !profiles.some((p) => p.platform === 'linkedin')) {
      profiles.push({
        platform: 'linkedin',
        url: 'perfil enviado em PDF',
        status: 'fetched',
        content: linkedinText.slice(0, 4000),
      })
    }

    // Conteúdo colado para uma URL que não estava entre os links cadastrados.
    for (const [url, content] of Object.entries(supplied)) {
      if (!content.trim()) continue
      if (profiles.some((p) => p.url === url || p.url.replace(/\/$/, '') === url)) continue
      profiles.push({
        platform: detectPlatform(url),
        url,
        status: 'fetched',
        content: content.trim().slice(0, 4000),
      })
    }

    const analyzedCount = profiles.filter((p) => p.status === 'fetched').length

    if (analyzedCount === 0) {
      return NextResponse.json(
        {
          error:
            'Nenhum perfil pôde ser lido automaticamente. Envie o PDF do seu perfil do LinkedIn ' +
            '("Mais → Salvar como PDF") ou cole o texto do perfil para prosseguir.',
          code: 'NO_PROFILE_CONTENT',
          profiles: profiles.map((p) => ({ platform: p.platform, url: p.url, status: p.status, note: p.note })),
        },
        { status: 422 }
      )
    }

    const reservationResult = await reserveCredits(
      user.id,
      costCredits,
      `Análise de presença digital em ${analyzedCount} perfil(is) (${costCredits} cr)`
    )

    if (!reservationResult.success) {
      return NextResponse.json(
        {
          error: reservationResult.error || 'Seu saldo de créditos é insuficiente.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: costCredits,
          currentCredits: reservationResult.currentBalance,
        },
        { status: 402 }
      )
    }

    reservation = reservationResult.reservation

    const lang = getRequestLanguage(req)

    const systemPrompt = `${LANGUAGE_DIRECTIVE[lang]}

Você é especialista em presença digital profissional e em como recrutadores e algoritmos de busca avaliam perfis.

As plataformas que mais importam no mercado deste candidato são: ${SOCIAL_PLATFORMS_BY_MARKET[lang]}.

Você receberá o CONTEÚDO REAL de perfis profissionais do candidato, além do currículo dele. Analise o que está efetivamente escrito em cada perfil.

REGRAS CRÍTICAS DE HONESTIDADE:
1. Baseie cada observação no conteúdo real fornecido. Cite o que viu — o texto do "Sobre", os repositórios, a bio.
2. Quando um perfil vier marcado como CONTEÚDO NÃO DISPONÍVEL, defina "analyzed": false, escreva em "findings" que o perfil não pôde ser lido e dê apenas orientação geral para aquela plataforma. NÃO descreva o perfil como se o tivesse visto.
3. Aponte incoerências entre o currículo e os perfis quando existirem — é um dos maiores riscos de triagem.
4. "headline" e "aboutSummary" devem ser textos prontos para o candidato copiar, escritos a partir da experiência real dele.

TAMANHO DA RESPOSTA (o que controla a latência — respeite):
- "overallAssessment": 3 a 4 frases.
- "findings": 2 a 3 frases por perfil.
- "headline": uma linha, até 220 caracteres.
- "aboutSummary": até 6 linhas.
- "tips": 3 a 4 itens curtos por perfil.

Responda APENAS um JSON válido, sem texto antes ou depois.`

    const aiResponse = await executeAiTask({
      taskType: 'social_advice',
      userId: user.id,
      userCountry: getRequestCountry(req),
      systemPrompt,
      userPrompt: `CURRÍCULO DO CANDIDATO:
${resume.originalContent.slice(0, 8000)}

PERFIS PROFISSIONAIS:
${buildProfilesContext(profiles)}`,
      maxTokens: 4000,
      // Parecer estruturado não ganha nada com raciocínio estendido, e no
      // Sonnet 5 ele vem LIGADO por padrão. Era a causa direta dos
      // "The operation was aborted due to timeout" registrados para
      // `social_advice`: o raciocínio consumia o orçamento e a chamada passava
      // dos 25s de teto por provedor.
      disableThinking: true,
      // O que sobrou do prazo depois da leitura do PDF e da busca dos perfis.
      timeBudgetMs: ROUTE_BUDGET_MS - (Date.now() - routeStart),
      jsonSchema: SOCIAL_JSON_SCHEMA as unknown as Record<string, unknown>,
    })

    const analysis = parseSocialAnalysis(aiResponse.content)

    const stored = {
      ...analysis,
      // Guarda o que foi lido de fato: sem isso não há como auditar depois se
      // uma recomendação veio de conteúdo real ou de orientação genérica.
      sources: profiles.map((p) => ({
        platform: p.platform,
        url: p.url,
        status: p.status,
        note: p.note,
      })),
      analyzedAt: new Date().toISOString(),
    }

    await db.resume.update({
      where: { id: resume.id },
      data: { socialAnalysisJson: JSON.stringify(stored) },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        action: 'social_analysis',
        meta: JSON.stringify({
          analyzedCount,
          totalProfiles: profiles.length,
          usedModel: aiResponse.usedModel,
          costUsd: aiResponse.costUsd,
        }),
      },
    })

    await settleReservation(reservation)

    return NextResponse.json({
      success: true,
      socialAnalysis: stored,
      analyzedCount,
      modelUsed: aiResponse.usedModel,
    })
  } catch (e: any) {
    console.error('social-analysis error:', e?.diagnostic || e?.message || e)

    const release = await releaseReservation(reservation, 'Falha na análise de presença digital')

    // Diz o que aconteceu e o que fazer. "Tente novamente em instantes" era o
    // mesmo texto para toda causa possível, e o usuário repetia a operação sem
    // saber se o problema era o conteúdo que ele enviou ou o provedor de IA.
    const isProviderFailure = Boolean(e?.diagnostic)
    const base = isProviderFailure
      ? 'Os provedores de IA não responderam a tempo nesta tentativa. Nada do que você enviou foi perdido — ' +
        'basta clicar em analisar de novo.'
      : e?.message && typeof e.message === 'string' && e.message.length < 200
        ? e.message
        : 'Ocorreu uma falha durante o processamento da análise.'

    return NextResponse.json(
      {
        error: release.refunded
          ? `${base} Seus ${costCredits} créditos foram REEMBOLSADOS automaticamente.`
          : `${base} Nenhum crédito foi cobrado.`,
        refunded: release.refunded,
        currentBalance: release.currentBalance,
        code: isProviderFailure ? 'AI_PROVIDERS_UNAVAILABLE' : 'ANALYSIS_FAILED',
      },
      { status: 500 }
    )
  }
}
