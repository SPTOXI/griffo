export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireUnlockedResume } from '@/lib/entitlements'
import { getRequestLanguage } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { fetchAllProfiles, detectPlatform, type SocialProfileData } from '@/lib/social/fetchers'
import { analyzeSocialPresence } from '@/lib/social/analysis'
import { loadProfileContext } from '@/lib/profile/server'
import { MAX_PDF_BASE64_CHARS, parsePdfBase64 } from '@/lib/pdf-text'
import { MAX_SOCIAL_LINKS } from '@/lib/validation'

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
  /**
   * Conteúdo que o usuário forneceu para perfis que não puderam ser lidos —
   * o LinkedIn sempre, e as demais plataformas quando a leitura falha.
   * Chave = URL do perfil.
   */
  suppliedContent: z
    .record(z.string().max(300), z.string().max(20000))
    // O tamanho de cada valor já tinha teto; a QUANTIDADE de chaves não, e o
    // produto dos dois é o que chega à memória e ao prompt. Doze é o mesmo
    // teto de perfis de `socialLinksSchema`.
    .refine((v) => Object.keys(v).length <= MAX_SOCIAL_LINKS, 'Perfis demais.')
    .optional(),
  /** Texto já extraído do perfil, quando o cliente prefere colar. */
  linkedinPdfText: z.string().max(30000).optional(),
  /**
   * PDF que o LinkedIn gera em "Mais → Salvar como PDF", em base64.
   *
   * `parsePdfBase64` já recusa o arquivo grande demais, mas só DEPOIS de o
   * corpo inteiro ter sido lido e mantido em memória. O teto no esquema recusa
   * antes.
   */
  linkedinPdfBase64: z.string().max(MAX_PDF_BASE64_CHARS).optional(),
})

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

    // Mídias sociais e otimização de perfil são dois dos nove itens da Análise
    // Completa. Nada aqui é cobrado por perfil analisado.
    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    const lang = getRequestLanguage(req)

    // Mercado profissional do candidato: alvo declarado no Perfil Profissional
    // quando houver, senão o país de acesso, e o idioma só em último caso.
    const { market } = await loadProfileContext(user.id, {
      edgeCountry: edgeCountry(req),
      language: lang,
    })

    // Uma chamada por perfil, em paralelo, mais a avaliação geral. O parecer
    // inteiro numa chamada só estourava o teto de tempo por provedor — mesmo
    // problema, e mesma solução, da análise do currículo. Ver lib/social/analysis.ts.
    const analysis = await analyzeSocialPresence({
      profiles,
      resumeExcerpt: resume.originalContent.slice(0, 8000),
      lang,
      market,
      userId: user.id,
      resumeId: resume.id,
      userCountry: edgeCountry(req),
      // O que sobrou do prazo depois da leitura do PDF e da busca dos perfis.
      // As chamadas são simultâneas, então cada uma pode usá-lo por inteiro.
      timeBudgetMs: ROUTE_BUDGET_MS - (Date.now() - routeStart),
    })


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
        // Modelo e custo saem do AiLog agora: a auditoria virou N chamadas
        // paralelas, cada uma com sua própria linha de telemetria, e repetir
        // aqui o modelo de uma delas descreveria mal o conjunto.
        meta: JSON.stringify({
          analyzedCount,
          totalProfiles: profiles.length,
          aiCalls: profiles.length + 1,
          failedProfiles: analysis.failedProfiles,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      socialAnalysis: stored,
      analyzedCount,
    })
  } catch (e: any) {
    console.error('social-analysis error:', e?.diagnostic || e?.message || e)

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

    // Nada a estornar: a falha não custou nada ao usuário.
    return NextResponse.json(
      {
        error: base,
        code: isProviderFailure ? 'AI_PROVIDERS_UNAVAILABLE' : 'ANALYSIS_FAILED',
      },
      { status: 500 }
    )
  }
}
