import 'server-only'
import { executeAiTask } from '../ai-router/router'
import type { Language } from '../i18n'
import { LANGUAGE_DIRECTIVE } from '../i18n/server'
import { marketPromptContext, type MarketConfig } from '../market'
import type { SocialProfileData } from './fetchers'

/**
 * A auditoria de presença digital em uma chamada por perfil, em vez de uma só.
 *
 * A versão anterior pedia o parecer inteiro — avaliação geral mais achados,
 * headline, texto "Sobre" e ações para CADA perfil — numa única chamada de até
 * 4.000 tokens de saída. Geração é serial, um token por vez, então esses tokens
 * *eram* a latência: a chamada estourava o teto de 25s por provedor, caía para
 * o suplente, e a análise terminava em falha operacional. Desligar o
 * raciocínio estendido ajudou e não bastou — o volume de saída continuava o
 * mesmo.
 *
 * É exatamente o problema que a análise do currículo já havia enfrentado e
 * resolvido em `lib/analysis/segments.ts`: N chamadas pequenas rodando ao mesmo
 * tempo terminam no tempo da mais lenta, não na soma. Aqui a divisão é ainda
 * mais natural, porque nenhum perfil depende do outro — cada um já era uma
 * seção independente do resultado.
 *
 * O currículo, que se repete no input de todas elas, vai em `cacheableContext`:
 * a primeira chamada grava o cache e as demais leem por uma fração do preço.
 *
 * Nada aqui inventa conteúdo. Um perfil cuja leitura falhou continua marcado
 * como não lido, e um perfil cuja ANÁLISE falhou é reportado como tal em vez de
 * receber um texto plausível no lugar.
 */

const str = { type: 'string' } as const

const PROFILE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings', 'headline', 'aboutSummary', 'tips'],
  properties: {
    findings: str,
    headline: str,
    aboutSummary: str,
    tips: { type: 'array', items: str },
  },
} as const

const OVERALL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['overallAssessment'],
  properties: { overallAssessment: str },
} as const

export interface SocialProfileAdvice {
  platform: string
  url: string
  /** `false` quando o conteúdo não pôde ser lido OU quando a análise falhou. */
  analyzed: boolean
  /**
   * `true` quando a CHAMADA de análise deste perfil falhou. Separado de
   * `analyzed` porque as duas causas pedem ações opostas do usuário: um perfil
   * não lido precisa que ele forneça o conteúdo; um parecer que falhou precisa
   * apenas que ele refaça a auditoria.
   */
  failed?: boolean
  findings: string
  headline: string
  aboutSummary: string
  tips: string[]
}

export interface SocialAnalysisResult {
  overallAssessment: string
  profiles: SocialProfileAdvice[]
  /** Perfis cuja CHAMADA de análise falhou — distinto de não ter sido lido. */
  failedProfiles: number
}

function parseJsonLoose(raw: string): any {
  return JSON.parse(
    raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  )
}

/** Regras que valem para toda chamada desta auditoria. */
function baseRules(lang: Language, market: MarketConfig): string {
  return `${LANGUAGE_DIRECTIVE[lang]}

Você é especialista em presença digital profissional e em como recrutadores e algoritmos de busca avaliam perfis.

${marketPromptContext(market)}

REGRAS CRÍTICAS DE HONESTIDADE:
1. Baseie cada observação no conteúdo real fornecido. Cite o que viu — o texto do "Sobre", os repositórios, a bio.
2. Quando o perfil vier marcado como CONTEÚDO NÃO DISPONÍVEL, escreva em "findings" que ele não pôde ser lido e dê apenas orientação geral para aquela plataforma. NÃO o descreva como se o tivesse visto.
3. Aponte incoerências entre o currículo e o perfil quando existirem — é um dos maiores riscos de triagem.`
}

/** Bloco de um perfil, deixando explícito o que foi lido e o que não foi. */
function profileBlock(p: SocialProfileData, maxChars = 4000): string {
  if (p.status === 'fetched' && p.content) {
    return `### ${p.platform.toUpperCase()} — ${p.url}\nCONTEÚDO REAL DO PERFIL:\n${p.content.slice(0, maxChars)}`
  }
  return `### ${p.platform.toUpperCase()} — ${p.url}\nCONTEÚDO NÃO DISPONÍVEL. Motivo: ${p.note || 'não foi possível ler'}`
}

function normalizeTips(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 6)
}

async function analyzeOneProfile(
  profile: SocialProfileData,
  ctx: {
    lang: Language
    market: MarketConfig
    sharedContext: string
    userId: string
    resumeId: string
    userCountry: string | null
    timeBudgetMs: number
  }
): Promise<SocialProfileAdvice> {
  const result = await executeAiTask({
    taskType: 'social_advice',
    userId: ctx.userId,
    resumeId: ctx.resumeId,
    userCountry: ctx.userCountry,
    cacheableContext: ctx.sharedContext,
    disableThinking: true,
    timeBudgetMs: ctx.timeBudgetMs,
    systemPrompt: `${baseRules(ctx.lang, ctx.market)}

Analise UM único perfil, o que vier na mensagem, e produza:

- "findings": 2 a 3 frases sobre o que este perfil comunica hoje a um recrutador.
- "headline": um título pronto para o candidato copiar, até 220 caracteres, escrito a partir da experiência real dele.
- "aboutSummary": um texto "Sobre" pronto para copiar, até 6 linhas, também a partir da experiência real.
- "tips": 3 a 4 ações curtas e concretas para este perfil.

Responda APENAS o JSON do schema, sem texto antes ou depois.`,
    userPrompt: `PERFIL A ANALISAR:\n${profileBlock(profile)}`,
    maxTokens: 1600,
    jsonSchema: PROFILE_SCHEMA as unknown as Record<string, unknown>,
  })

  const parsed = parseJsonLoose(result.content)

  const findings = String(parsed?.findings || '').trim()
  if (!findings) {
    throw new Error(`Perfil ${profile.platform}: resposta sem achados.`)
  }

  return {
    platform: profile.platform,
    url: profile.url,
    analyzed: profile.status === 'fetched',
    findings,
    headline: String(parsed?.headline || '').trim(),
    aboutSummary: String(parsed?.aboutSummary || '').trim(),
    tips: normalizeTips(parsed?.tips),
  }
}

async function buildOverallAssessment(
  profiles: SocialProfileData[],
  ctx: {
    lang: Language
    market: MarketConfig
    sharedContext: string
    userId: string
    resumeId: string
    userCountry: string | null
    timeBudgetMs: number
  }
): Promise<string> {
  // Roda em paralelo com as análises individuais porque não depende delas: a
  // avaliação geral sai do MESMO material que elas leem, não das suas
  // conclusões. Recebe um recorte menor de cada perfil — o suficiente para um
  // panorama, sem transformar esta chamada na maior de todas.
  const digest = profiles.map((p) => profileBlock(p, 1200)).join('\n\n')

  const result = await executeAiTask({
    taskType: 'social_advice',
    userId: ctx.userId,
    resumeId: ctx.resumeId,
    userCountry: ctx.userCountry,
    cacheableContext: ctx.sharedContext,
    disableThinking: true,
    timeBudgetMs: ctx.timeBudgetMs,
    systemPrompt: `${baseRules(ctx.lang, ctx.market)}

Produza APENAS a avaliação geral da presença digital do candidato, em 3 a 4 frases: o que o conjunto dos perfis comunica hoje, a maior incoerência com o currículo (se houver) e a prioridade número um.

Responda APENAS o JSON do schema, sem texto antes ou depois.`,
    userPrompt: `PERFIS DO CANDIDATO:\n${digest}`,
    maxTokens: 700,
    jsonSchema: OVERALL_SCHEMA as unknown as Record<string, unknown>,
  })

  const text = String(parseJsonLoose(result.content)?.overallAssessment || '').trim()
  if (!text) throw new Error('Avaliação geral vazia.')
  return text
}

/**
 * Avaliação geral montada localmente quando a chamada dela falha.
 *
 * Enuncia só fatos que já temos — quais perfis foram lidos e quais não —, sem
 * opinar sobre o que não foi avaliado. Preferível a derrubar uma auditoria em
 * que todos os pareceres individuais deram certo.
 */
function factualOverall(profiles: SocialProfileAdvice[]): string {
  const read = profiles.filter((p) => p.analyzed)
  const notRead = profiles.filter((p) => !p.analyzed)

  const parts = [
    read.length > 0
      ? `Foram analisados ${read.length} perfil(is) com conteúdo real: ${read.map((p) => p.platform).join(', ')}.`
      : 'Nenhum perfil pôde ser analisado a partir de conteúdo real.',
  ]
  if (notRead.length > 0) {
    parts.push(
      `Sem conteúdo disponível para: ${notRead.map((p) => p.platform).join(', ')} — para esses, as recomendações abaixo são gerais.`
    )
  }
  parts.push('Consulte o parecer de cada perfil abaixo para as ações recomendadas.')
  return parts.join(' ')
}

export async function analyzeSocialPresence(params: {
  profiles: SocialProfileData[]
  resumeExcerpt: string
  lang: Language
  /** Mercado profissional do candidato — ver lib/market/. */
  market: MarketConfig
  userId: string
  resumeId: string
  userCountry: string | null
  /** Prazo restante da rota. Cada chamada paralela pode usá-lo por inteiro. */
  timeBudgetMs: number
  /**
   * Avisa, em tempo real, quando UM perfil (ou a avaliação geral) termina —
   * sucesso ou falha, nunca lança. Existe para dar à leitura de perfil social
   * progresso real por etapa (ver `lib/ai-jobs/runners/social-advice.ts` e a
   * regra em HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de travamento"),
   * sem que quem chama sem passar isto note qualquer diferença.
   */
  onStepSettled?: (key: string) => void
}): Promise<SocialAnalysisResult> {
  const { profiles, resumeExcerpt, ...rest } = params

  const ctx = {
    lang: rest.lang,
    market: rest.market,
    userId: rest.userId,
    resumeId: rest.resumeId,
    userCountry: rest.userCountry,
    timeBudgetMs: rest.timeBudgetMs,
    // Idêntico em todas as chamadas, byte a byte: é o que faz o cache de prompt
    // valer. Ver o comentário de `cacheableContext` em ai-router/types.ts.
    sharedContext: `CURRÍCULO DO CANDIDATO:\n${resumeExcerpt}`,
  }

  // `finally`, não `then`: precisa disparar tanto no sucesso quanto na falha
  // de cada chamada, sem alterar o valor ou o estado (fulfilled/rejected) que
  // `Promise.allSettled` enxerga depois.
  const tap = <T,>(promise: Promise<T>, key: string): Promise<T> => {
    if (!rest.onStepSettled) return promise
    return promise.finally(() => {
      try {
        rest.onStepSettled!(key)
      } catch (e) {
        console.warn('[social] onStepSettled lançou; ignorado:', e)
      }
    })
  }

  const settled = await Promise.allSettled([
    ...profiles.map((p, i) => tap(analyzeOneProfile(p, ctx), p.url || `${p.platform}_${i}`)),
    tap(buildOverallAssessment(profiles, ctx), 'overall'),
  ])

  const profileResults = settled.slice(0, profiles.length) as PromiseSettledResult<SocialProfileAdvice>[]
  const overallResult = settled[settled.length - 1] as PromiseSettledResult<string>

  const succeeded = profileResults.filter((r) => r.status === 'fulfilled').length

  // Nenhum perfil analisado é falha da tarefa inteira: a rota estorna. Entregar
  // só a avaliação geral seria cobrar por um laudo sem laudo.
  if (succeeded === 0) {
    const firstError = profileResults.find((r) => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined
    throw firstError?.reason instanceof Error
      ? firstError.reason
      : new Error('Nenhum perfil pôde ser analisado.')
  }

  const analyzedProfiles: SocialProfileAdvice[] = profileResults.map((r, i) => {
    if (r.status === 'fulfilled') return r.value

    // A análise deste perfil falhou — o que é diferente de o perfil não ter
    // sido lido, e é dito com essas palavras em vez de sumir da tela.
    const source = profiles[i]
    console.warn(
      `[social] Análise do perfil '${source.platform}' falhou:`,
      (r.reason as any)?.diagnostic || (r.reason as any)?.message || r.reason
    )
    return {
      platform: source.platform,
      url: source.url,
      analyzed: false,
      failed: true,
      findings:
        'O parecer deste perfil não pôde ser gerado nesta execução. Os demais perfis foram ' +
        'analisados normalmente — refaça a auditoria para tentar novamente apenas este.',
      headline: '',
      aboutSummary: '',
      tips: [],
    }
  })

  const overallAssessment =
    overallResult.status === 'fulfilled' ? overallResult.value : factualOverall(analyzedProfiles)

  if (overallResult.status === 'rejected') {
    console.warn(
      '[social] Avaliação geral falhou; usando resumo factual local:',
      (overallResult.reason as any)?.diagnostic || (overallResult.reason as any)?.message
    )
  }

  return {
    overallAssessment,
    profiles: analyzedProfiles,
    failedProfiles: profileResults.length - succeeded,
  }
}
