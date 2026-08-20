export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { getRequestLanguage } from '@/lib/i18n/server'
import { requireUnlockedResume } from '@/lib/entitlements'
import { edgeCountry } from '@/lib/pricing/resolve'
import { buildResumeContext } from '@/lib/analysis/resume-context'
import { loadProfileContext } from '@/lib/profile/server'

/**
 * Carta de apresentação e resumo profissional direcionado.
 *
 * ## Por que esta rota existe
 *
 * Os dois itens eram vendidos e não existiam. `cover_letter` aparecia como tipo
 * de tarefa em `ai-router/types.ts`, tinha provedor primário declarado em
 * `registry.ts` e custo orçado por análise — mas nenhuma rota o produzia.
 * `professional_summary` aparecia só no catálogo e na landing, sem sequer um
 * tipo de tarefa. A promessa era de nove entregas e o código entregava sete.
 *
 * ## Uma chamada, dois artefatos
 *
 * Carta e resumo saem do mesmo par (currículo, vaga alvo) e do mesmo
 * raciocínio: o que nesta trajetória importa para ESTA vaga. Pedi-los em
 * chamadas separadas dobraria o custo e o tempo para produzir duas leituras do
 * mesmo material — que ainda por cima poderiam divergir entre si.
 *
 * O resumo aqui é o do CURRÍCULO, direcionado à vaga alvo. Não se confunde com
 * o texto "Sobre" que a análise de presença digital gera por perfil
 * (`lib/social/analysis.ts`): aquele é escrito para o algoritmo do LinkedIn,
 * este para o topo do currículo e para o recrutador humano.
 *
 * ## Nada é cobrado aqui
 *
 * Como toda rota derivada, esta só pergunta se o currículo está destravado. Uma
 * falha não custa nada ao usuário — ele pede de novo. Ver `lib/entitlements.ts`.
 */

const schema = z.object({
  resumeId: z.string().min(1, 'ID do currículo obrigatório.'),
})

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
  /** Vaga a que os textos foram direcionados, ou `null` quando não houve uma. */
  targetJob: string | null
  generatedAt: string
}

/**
 * Validação própria desta tarefa.
 *
 * Cada tipo de tarefa de IA tem que ter a sua: reaproveitar a regra de outro
 * tipo por semelhança estrutural é o defeito que já reprovou toda resposta
 * correta do diagnóstico vocacional, quando ele declarava `full_analysis` e era
 * cobrado por um campo `dimensions` que nunca produziu.
 *
 * Os limites abaixo são o que separa um texto utilizável de uma resposta que
 * apenas parece uma: uma carta de 200 caracteres não é uma carta curta, é uma
 * carta que não foi escrita.
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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 })
    }

    const resume = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado.' }, { status: 404 })
    }

    const entitlement = await requireUnlockedResume(user.id, resume.id)
    if (!entitlement.ok) {
      return NextResponse.json(
        { error: entitlement.error, code: entitlement.code, balance: entitlement.balance },
        { status: entitlement.status }
      )
    }

    const lang = getRequestLanguage(req)

    // Convenção de candidatura é local: nos Estados Unidos a carta é opcional e
    // curta, na Alemanha o Anschreiben é formal e esperado. O mercado sai do
    // Perfil Profissional quando declarado; sem ele, do país de acesso.
    const { market, promptContext: profileContext } = await loadProfileContext(user.id, {
      edgeCountry: edgeCountry(req),
      language: lang,
    })

    /**
     * Currículo, mercado, perfil e vaga vão no bloco CACHEÁVEL, que o roteador
     * coloca antes do marcador de cache. É material idêntico ao que a reescrita
     * e a orientação vocacional usam — quando a pessoa pede duas dessas
     * entregas seguidas, a segunda lê o prefixo do cache em vez de reenviá-lo.
     *
     * O que muda por tarefa — o papel de redator, as regras de honestidade, o
     * que produzir — fica no `systemPrompt`, DEPOIS do marcador. Variar ali não
     * invalida nada.
     */
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
      userId: user.id,
      resumeId: resume.id,
      userCountry: edgeCountry(req),
      cacheableContext,
      systemPrompt,
      // O currículo NÃO se repete aqui: ele já está no bloco cacheável. Mandá-lo
      // duas vezes dobraria o custo de entrada e não acrescentaria nada.
      userPrompt: 'Produza a carta de apresentação e o resumo profissional para o candidato do contexto acima.',
      maxTokens: 2600,
      // Redação direcionada não ganha com raciocínio estendido, e no Sonnet 5 ele
      // vem ligado por padrão — consumindo parte do mesmo orçamento de tokens da
      // resposta. Mesma decisão das demais rotas de geração.
      disableThinking: true,
      // Geração longa: a carta inteira não sai em meio orçamento, e reservar
      // metade do prazo para um suplente que também não caberia troca um sucesso
      // por duas falhas. Mesmo raciocínio da reescrita e da orientação.
      maxProviderAttempts: 1,
      jsonSchema: COVER_LETTER_JSON_SCHEMA as unknown as Record<string, unknown>,
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

    return NextResponse.json({ coverLetter: stored })
  } catch (e: any) {
    console.error('Error generating cover letter:', e?.diagnostic || e?.message || e)

    const isProviderFailure = Boolean(e?.diagnostic)
    return NextResponse.json(
      {
        // Escrita, e não `e?.message`: a mensagem do erro é feita para o log,
        // e mostrá-la ao usuário entrega texto interno — às vezes com nome de
        // modelo e teto de tokens — a quem só queria a carta.
        error: isProviderFailure
          ? 'Os provedores de IA não responderam a tempo nesta tentativa. Clique em gerar novamente.'
          : 'Não foi possível redigir a carta agora. Tente novamente em instantes — o currículo continua liberado e nada foi cobrado.',
        code: isProviderFailure ? 'AI_PROVIDERS_UNAVAILABLE' : 'COVER_LETTER_FAILED',
      },
      { status: 500 }
    )
  }
}
