export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireUnlockedResume } from '@/lib/entitlements'
import { getRequestLanguage } from '@/lib/i18n/server'
import { edgeCountry } from '@/lib/pricing/resolve'
import { fetchAllProfiles, detectPlatform, type SocialProfileData } from '@/lib/social/fetchers'
import { loadProfileContext } from '@/lib/profile/server'
import { MAX_PDF_BASE64_CHARS, parsePdfBase64 } from '@/lib/pdf-text'
import { MAX_SOCIAL_LINKS } from '@/lib/validation'
import { processSocialAdviceJob, type SocialAdviceInput } from '@/lib/ai-jobs/runners/social-advice'

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

export async function POST(req: Request) {
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

    const inFlight = await db.aiJob.findFirst({
      where: {
        resumeId: resume.id,
        userId: user.id,
        kind: 'social_advice',
        status: { in: ['queued', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })

    if (inFlight) {
      return NextResponse.json({ jobId: inFlight.id, status: inFlight.status }, { status: 202 })
    }

    // Entrada preparada AGORA — busca de perfil e PDF já feitas — e persistida
    // pro `after()` reaproveitar sem refazer nada. Ver o comentário de
    // `AiJob.inputJson` no schema.
    const input: SocialAdviceInput = {
      profiles,
      resumeExcerpt: resume.originalContent.slice(0, 8000),
      marketId: market.id,
      sources: profiles.map((p) => ({
        platform: p.platform,
        url: p.url,
        status: p.status,
        note: p.note,
      })),
    }

    const job = await db.aiJob.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        kind: 'social_advice',
        status: 'queued',
        totalSteps: profiles.length + 1,
        inputJson: JSON.stringify(input),
        lang,
        userCountry: edgeCountry(req),
      },
      select: { id: true },
    })

    after(() =>
      processSocialAdviceJob(job.id).catch((e) =>
        console.error('[social-analysis] Falha ao processar job:', e)
      )
    )

    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 })
  } catch (e: any) {
    // A partir daqui só sobra o que acontece ANTES de existir job — leitura de
    // PDF, busca de perfil, banco. A falha de provedor de IA agora só existe
    // dentro do job, e chega pela consulta de status, não por este `catch`.
    console.error('social-analysis error:', e?.message || e)
    return NextResponse.json(
      { error: 'Ocorreu uma falha durante o processamento. Nada do que você enviou foi perdido.', code: 'ANALYSIS_FAILED' },
      { status: 500 }
    )
  }
}
