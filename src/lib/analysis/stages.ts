/**
 * Metadados dos segmentos da análise, sem nada de servidor.
 *
 * Vive separado de `segments.ts` porque o modal de progresso é um Client
 * Component: ele precisa dos rótulos para mostrar o que está sendo processado,
 * mas não pode arrastar prompts, schemas nem o roteador de IA para o bundle do
 * navegador.
 */

export const SEGMENT_IDS = [
  'dimensions_a',
  'dimensions_b',
  'job_match',
  'targeted_changes',
  'executive',
] as const

export type SegmentId = (typeof SEGMENT_IDS)[number]

export const DIMENSION_KEYS = [
  'structure',
  'summary',
  'impact',
  'skills',
  'experience',
  'keywords',
  'career',
  'upskilling',
] as const

export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  structure: 'Estrutura & Compatibilidade ATS',
  summary: 'Resumo & Posicionamento Profissional',
  impact: 'Resultados Quantificados (STAR/XYZ)',
  skills: 'Habilidades & Palavras-Chave de Busca',
  experience: 'Experiência Profissional & Verbos de Ação',
  keywords: 'Palavras-Chave & Match com Vagas',
  career: 'Trajetória & Plano de Carreira',
  upskilling: 'Capacitação & Cursos Recomendados',
}

/** Descrições curtas por dimensão, usadas na tela de progresso. */
export const DIMENSION_HINTS: Record<DimensionKey, string> = {
  structure: 'Formato, parseabilidade e leitura por robôs de triagem',
  summary: 'Headline, objetivo e síntese de carreira',
  impact: 'Quantificação de resultados e indicadores numéricos',
  skills: 'Vocabulário técnico e termos buscados por recrutadores',
  experience: 'Escopo, autonomia e verbos de ação',
  keywords: 'Termos estratégicos para os filtros das vagas',
  career: 'Progressão, estabilidade e projeção do próximo passo',
  upskilling: 'Lacunas de conhecimento e certificações recomendadas',
}

/** Dimensões cobertas por cada um dos dois segmentos de dimensões. */
export const SEGMENT_DIMENSIONS: Record<'dimensions_a' | 'dimensions_b', DimensionKey[]> = {
  dimensions_a: ['structure', 'summary', 'impact', 'skills'],
  dimensions_b: ['experience', 'keywords', 'career', 'upskilling'],
}

/**
 * Uma etapa visível na tela. Cada segmento acende as suas de uma vez, quando
 * termina — e os rótulos são os das dimensões reais do laudo, não uma lista
 * decorativa: a tela anterior anunciava "Formação & Certificações" e "Presença
 * Digital", que não existem entre as oito dimensões avaliadas.
 */
export interface AnalysisStage {
  segment: SegmentId
  label: string
  description: string
}

export const ANALYSIS_STAGES: AnalysisStage[] = [
  ...SEGMENT_DIMENSIONS.dimensions_a.map((key) => ({
    segment: 'dimensions_a' as SegmentId,
    label: DIMENSION_LABELS[key],
    description: DIMENSION_HINTS[key],
  })),
  ...SEGMENT_DIMENSIONS.dimensions_b.map((key) => ({
    segment: 'dimensions_b' as SegmentId,
    label: DIMENSION_LABELS[key],
    description: DIMENSION_HINTS[key],
  })),
  {
    segment: 'job_match',
    label: 'Aderência à Vaga Alvo',
    description: 'Requisitos atendidos, lacunas e plano de ação',
  },
  {
    segment: 'targeted_changes',
    label: 'Reescrita de Trechos',
    description: 'Sugestões cirúrgicas seção a seção',
  },
  {
    segment: 'executive',
    label: 'Parecer Executivo',
    description: 'Síntese, pontos fortes, fragilidades e recomendações',
  },
]
