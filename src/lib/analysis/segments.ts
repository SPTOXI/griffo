import type { Language } from '../i18n'
import { LANGUAGE_DIRECTIVE, ATS_BY_MARKET } from '../i18n/server'
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  SEGMENT_DIMENSIONS,
  SEGMENT_IDS,
  type DimensionKey,
  type SegmentId,
} from './stages'

/**
 * A análise em cinco pedidos independentes, em vez de um só.
 *
 * A versão anterior pedia o laudo inteiro numa única chamada de ~3.800 tokens
 * de saída. Geração é serial — um token por vez —, então esses 3.800 tokens
 * *eram* a latência: 82s medidos, contra um `maxDuration` de 60s. A função
 * morria antes de responder, e o usuário via "erro de conexão" depois de mais
 * de um minuto de espera. Trocar de provedor não muda isso: o mesmo volume de
 * saída custa o mesmo tempo em qualquer modelo da categoria.
 *
 * Cinco chamadas de ~800 tokens rodando ao mesmo tempo terminam no tempo da
 * mais lenta, não na soma — o que troca ~82s por ~18s sem tirar nada do laudo.
 *
 * O custo de repetir o currículo no input das cinco é absorvido pelo cache de
 * prompt: `buildSharedContext` produz um bloco idêntico em todos os segmentos,
 * marcado como cacheável, então a primeira chamada grava e as outras quatro
 * leem por uma fração do preço.
 *
 * A divisão não é arbitrária: nenhum segmento depende do resultado de outro. A
 * nota geral, único valor derivado, é calculada localmente em `mergeSegments`.
 *
 * Os `maxTokens` abaixo carregam folga deliberada sobre o tamanho estimado de
 * cada resposta, por dois motivos que se somam: o tokenizador do Sonnet 5 conta
 * cerca de 30% mais tokens que o da geração anterior para o mesmo texto, e
 * `max_tokens` na API cobre raciocínio e resposta juntos. Orçamento apertado
 * aqui não produz resposta curta — produz JSON truncado, que a validação do
 * segmento reprova por inteiro.
 */

const str = { type: 'string' } as const
const strArray = { type: 'array', items: str } as const

function dimensionsSchema(keys: readonly DimensionKey[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['dimensions'],
    properties: {
      dimensions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['key', 'label', 'score', 'rationale'],
          properties: {
            key: { type: 'string', enum: [...keys] },
            label: str,
            score: { type: 'number' },
            rationale: str,
          },
        },
      },
    },
  } as const
}

/** Erro de conteúdo do segmento. O chamador reembolsa; não é falha transitória. */
export class SegmentValidationError extends Error {
  constructor(readonly segmentId: SegmentId, message: string) {
    super(`[${segmentId}] ${message}`)
    this.name = 'SegmentValidationError'
  }
}

export interface AnalysisSegmentSpec {
  id: SegmentId
  /** Tarefa específica deste segmento. O contexto comum não se repete aqui. */
  instruction: string
  schema: Record<string, unknown>
  maxTokens: number
  /** Valida e devolve o pedaço do laudo que este segmento contribui. */
  parse: (raw: unknown) => Record<string, unknown>
}

function parseDimensions(segmentId: SegmentId, keys: readonly DimensionKey[], raw: any) {
  const list = raw?.dimensions
  if (!Array.isArray(list) || list.length !== keys.length) {
    throw new SegmentValidationError(
      segmentId,
      `Esperadas ${keys.length} dimensões, recebidas ${Array.isArray(list) ? list.length : 0}.`
    )
  }

  const byKey = new Map<string, any>()
  for (const item of list) {
    const score = Number(item?.score)
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      throw new SegmentValidationError(segmentId, `Nota inválida na dimensão '${item?.key}'.`)
    }
    if (typeof item?.rationale !== 'string' || item.rationale.trim().length < 20) {
      throw new SegmentValidationError(segmentId, `Justificativa ausente na dimensão '${item?.key}'.`)
    }
    byKey.set(String(item?.key), {
      key: String(item.key),
      // O rótulo é nosso, não do modelo: ele varia de chamada para chamada e a
      // tela agrupa por ele.
      label: DIMENSION_LABELS[item.key as DimensionKey] ?? String(item.key),
      score,
      rationale: item.rationale.trim(),
    })
  }

  const ordered = keys.map((k) => byKey.get(k))
  if (ordered.some((d) => !d)) {
    const missing = keys.filter((k) => !byKey.has(k))
    throw new SegmentValidationError(segmentId, `Dimensões ausentes: ${missing.join(', ')}.`)
  }

  return { dimensions: ordered }
}

const SEGMENT_SPECS: Record<SegmentId, AnalysisSegmentSpec> = {
  dimensions_a: {
    id: 'dimensions_a',
    maxTokens: 1600,
    schema: dimensionsSchema(SEGMENT_DIMENSIONS.dimensions_a) as unknown as Record<string, unknown>,
    instruction: `Avalie EXATAMENTE estas 4 dimensões do currículo, nesta ordem:

1. "structure" — Estrutura & Compatibilidade ATS. Formato, seções, parseabilidade por robôs de triagem.
2. "summary" — Resumo & Posicionamento Profissional. Headline, objetivo, síntese de carreira.
3. "impact" — Resultados Quantificados. Aplicação das fórmulas STAR/XYZ, presença de números e indicadores.
4. "skills" — Habilidades & Palavras-Chave de Busca. Vocabulário técnico e termos que recrutadores buscam.

Para cada uma: nota de 0 a 10 e uma justificativa técnica APROFUNDADA, citando trechos concretos do currículo. Nada de avaliação genérica que serviria para qualquer candidato.`,
    parse: (raw) => parseDimensions('dimensions_a', SEGMENT_DIMENSIONS.dimensions_a, raw),
  },

  dimensions_b: {
    id: 'dimensions_b',
    maxTokens: 1600,
    schema: dimensionsSchema(SEGMENT_DIMENSIONS.dimensions_b) as unknown as Record<string, unknown>,
    instruction: `Avalie EXATAMENTE estas 4 dimensões do currículo, nesta ordem:

1. "experience" — Experiência Profissional & Verbos de Ação. Escopo de responsabilidade, autonomia, força dos verbos.
2. "keywords" — Palavras-Chave & Match com Vagas. Termos estratégicos para os filtros de triagem do mercado alvo.
3. "career" — Trajetória & Plano de Carreira. Progressão, estabilidade, lacunas, projeção do próximo passo.
4. "upskilling" — Capacitação & Cursos Recomendados. Lacunas de conhecimento e certificações objetivas a buscar.

Para cada uma: nota de 0 a 10 e uma justificativa técnica APROFUNDADA, citando trechos concretos do currículo. Nada de avaliação genérica que serviria para qualquer candidato.`,
    parse: (raw) => parseDimensions('dimensions_b', SEGMENT_DIMENSIONS.dimensions_b, raw),
  },

  job_match: {
    id: 'job_match',
    maxTokens: 1400,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['jobMatch'],
      properties: {
        jobMatch: {
          type: 'object',
          additionalProperties: false,
          required: [
            'targetJob',
            'matchPercentage',
            'verdict',
            'matchedRequirements',
            'missingRequirements',
            'actionPlan',
          ],
          properties: {
            targetJob: str,
            matchPercentage: { type: 'number' },
            verdict: str,
            matchedRequirements: strArray,
            missingRequirements: strArray,
            actionPlan: strArray,
          },
        },
      },
    } as unknown as Record<string, unknown>,
    instruction: `Avalie a ADERÊNCIA do candidato à vaga alvo declarada no contexto.

Produza: o cargo analisado, um percentual de aderência (0 a 100), um veredito curto e direto, os requisitos que o candidato JÁ atende, os que a vaga exige e ele NÃO demonstra, e um plano de ação com passos concretos para fechar as lacunas.

Se nenhuma vaga alvo específica foi fornecida, avalie a aderência à área de atuação evidente no currículo e diga isso no veredito.`,
    parse: (raw: any) => {
      const jm = raw?.jobMatch
      if (!jm || typeof jm !== 'object') {
        throw new SegmentValidationError('job_match', 'Bloco de aderência ausente.')
      }
      const pct = Number(jm.matchPercentage)
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        throw new SegmentValidationError('job_match', 'Percentual de aderência inválido.')
      }
      const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
      return {
        jobMatch: {
          targetJob: typeof jm.targetJob === 'string' ? jm.targetJob : '',
          matchPercentage: Math.round(pct),
          verdict: typeof jm.verdict === 'string' ? jm.verdict : '',
          matchedRequirements: arr(jm.matchedRequirements),
          missingRequirements: arr(jm.missingRequirements),
          actionPlan: arr(jm.actionPlan),
        },
      }
    },
  },

  targeted_changes: {
    id: 'targeted_changes',
    maxTokens: 2000,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['targetedChanges'],
      properties: {
        targetedChanges: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['section', 'originalText', 'rationale', 'suggestedText'],
            properties: {
              section: str,
              originalText: str,
              rationale: str,
              suggestedText: str,
            },
          },
        },
      },
    } as unknown as Record<string, unknown>,
    instruction: `Aponte de 4 a 7 trechos ESPECÍFICOS do currículo que devem ser reescritos.

Para cada um: a seção onde está, o TRECHO EXATO copiado do currículo original, a justificativa técnica de por que ele prejudica o candidato (falta de dados quantificáveis, adjetivos vagos, ausência de termos buscados por recrutadores) e a reescrita otimizada aplicando STAR/XYZ.

O campo "originalText" precisa ser um trecho literal do currículo fornecido — não invente texto que não está lá. Se o currículo for curto demais para 4 trechos, devolva quantos existirem de fato.`,
    parse: (raw: any) => {
      const list = raw?.targetedChanges
      if (!Array.isArray(list)) {
        throw new SegmentValidationError('targeted_changes', 'Lista de sugestões ausente.')
      }
      const changes = list
        .filter(
          (c: any) =>
            c &&
            typeof c.section === 'string' &&
            typeof c.originalText === 'string' &&
            typeof c.suggestedText === 'string' &&
            c.suggestedText.trim().length > 0
        )
        .map((c: any) => ({
          section: c.section.trim(),
          originalText: c.originalText.trim(),
          rationale: typeof c.rationale === 'string' ? c.rationale.trim() : '',
          suggestedText: c.suggestedText.trim(),
        }))
      return { targetedChanges: changes }
    },
  },

  executive: {
    id: 'executive',
    maxTokens: 1900,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'summary',
        'atsFriendly',
        'strengths',
        'weaknesses',
        'recommendations',
        'keywords',
      ],
      properties: {
        summary: str,
        atsFriendly: { type: 'boolean' },
        strengths: strArray,
        weaknesses: strArray,
        recommendations: strArray,
        keywords: strArray,
      },
    } as unknown as Record<string, unknown>,
    instruction: `Produza o parecer executivo do currículo:

- "summary": parecer detalhado sobre o currículo e o nível de competitividade do candidato no mercado. Mínimo de 3 frases substantivas.
- "atsFriendly": true apenas se o currículo passaria limpo por um robô de triagem hoje.
- "strengths": 3 a 5 pontos fortes marcantes, cada um com a justificativa do porquê é forte.
- "weaknesses": 3 a 5 vulnerabilidades, cada uma com o impacto que tem na triagem.
- "recommendations": plano de ação prioritário, em passos claros e executáveis.
- "keywords": 10 a 15 palavras-chave estratégicas para o segmento do candidato.

NÃO calcule nota geral: ela é derivada das oito dimensões pelo sistema.`,
    parse: (raw: any) => {
      if (typeof raw?.summary !== 'string' || raw.summary.trim().length < 30) {
        throw new SegmentValidationError('executive', 'Parecer executivo ausente ou curto demais.')
      }
      const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
      return {
        summary: raw.summary.trim(),
        atsFriendly: Boolean(raw.atsFriendly),
        strengths: arr(raw.strengths),
        weaknesses: arr(raw.weaknesses),
        recommendations: arr(raw.recommendations),
        keywords: arr(raw.keywords),
      }
    },
  },
}

export const ANALYSIS_SEGMENTS: AnalysisSegmentSpec[] = SEGMENT_IDS.map((id) => SEGMENT_SPECS[id])

export function getSegmentSpec(id: SegmentId): AnalysisSegmentSpec | null {
  return SEGMENT_SPECS[id] ?? null
}

export interface SharedContextInput {
  resumeContent: string
  targetJob?: string | null
  targetJobDescription?: string | null
  lang: Language
}

/**
 * O bloco que não muda entre os cinco segmentos — e por isso é o que vale a
 * pena cachear. Precisa vir byte a byte idêntico em todas as chamadas: o cache
 * casa por prefixo exato, então qualquer variação por segmento aqui dentro
 * anularia o ganho.
 */
export function buildSharedContext({
  resumeContent,
  targetJob,
  targetJobDescription,
  lang,
}: SharedContextInput): string {
  const atsList = ATS_BY_MARKET[lang]

  const jobBlock =
    targetJob || targetJobDescription
      ? `VAGA / CARGO ALVO DESEJADO PELO CANDIDATO:
Cargo: ${targetJob || 'Não especificado'}
Descrição/Requisitos da Vaga:
${targetJobDescription || 'Nenhuma descrição fornecida.'}`
      : 'VAGA ALVO: nenhuma vaga específica foi fornecida. Avalie a aderência geral à área de atuação evidente no currículo.'

  return `${LANGUAGE_DIRECTIVE[lang]}

Você é um avaliador executivo sênior de currículos, especialista mundial em triagem ATS (Applicant Tracking Systems — ${atsList}) e estrategista de personal branding internacional.

Você trabalha com ALTA PROFUNDIDADE TÉCNICA E JUSTIFICADA. Você NUNCA é genérico: aponta EXATAMENTE onde está a falha, POR QUE ela prejudica o candidato e COMO corrigi-la, sempre citando o conteúdo real do currículo abaixo.

Responda SEMPRE com um único JSON válido, sem blocos de markdown em volta, seguindo estritamente o schema pedido.

=== CURRÍCULO DO CANDIDATO ===
${resumeContent}
=== FIM DO CURRÍCULO ===

${jobBlock}`
}

/**
 * Monta o laudo final a partir dos segmentos e deriva a nota geral.
 *
 * `overall` é calculado aqui, e não pedido ao modelo, porque nenhum modelo é
 * confiável em aritmética auto-consistente — e agora há uma segunda razão: as
 * dimensões chegam de duas chamadas que não se enxergam.
 */
export function mergeSegments(segments: Record<string, any>): Record<string, unknown> {
  const missing = SEGMENT_IDS.filter((id) => !segments[id])
  if (missing.length > 0) {
    throw new Error(`Laudo incompleto: segmentos ausentes (${missing.join(', ')}).`)
  }

  const dimensions = [
    ...(segments.dimensions_a?.dimensions ?? []),
    ...(segments.dimensions_b?.dimensions ?? []),
  ]

  if (dimensions.length !== DIMENSION_KEYS.length) {
    throw new Error('Laudo incompleto: faltam dimensões de avaliação.')
  }

  const scores = dimensions.map((d: any) => Number(d.score))
  const overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10

  return {
    ...segments.executive,
    dimensions,
    jobMatch: segments.job_match?.jobMatch,
    targetedChanges: segments.targeted_changes?.targetedChanges ?? [],
    overall,
  }
}
