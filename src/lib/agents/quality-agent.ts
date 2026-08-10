/**
 * Agente de Qualidade e Auditoria de Respostas de IA (Fase 2)
 * Avalia a riqueza técnica, integridade estrutural e utilidade real do resultado gerado.
 */

export interface QualityAuditResult {
  approved: boolean
  score: number // 0 a 10
  feedback?: string
}

export function auditQualityOfAiResult(taskType: string, content: string): QualityAuditResult {
  if (!content || content.trim().length < 50) {
    return { approved: false, score: 2, feedback: 'Resposta muito curta ou vazia.' }
  }

  const text = content.trim()

  /**
   * Segmento da análise: cada chamada produz um pedaço do laudo, não o laudo
   * inteiro. As regras de `full_analysis` abaixo exigem `dimensions` E
   * `summary` no mesmo objeto — nenhum segmento tem os dois, então aplicá-las
   * aqui reprovaria todos eles e derrubaria a análise inteira.
   *
   * A verificação de conteúdo de cada segmento é estrutural e vive em
   * `lib/analysis/segments.ts`, no `parse` de cada um: contagem de dimensões,
   * faixa das notas, tamanho das justificativas, trechos citados. O que resta
   * para cá é o que este agente sabe fazer sem conhecer o segmento — recusar
   * uma resposta que sequer é JSON.
   */
  if (taskType === 'analysis_segment') {
    try {
      JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim())
    } catch {
      return { approved: false, score: 3, feedback: 'Estrutura JSON inválida.' }
    }
    return { approved: true, score: 9.0 }
  }

  if (taskType === 'full_analysis') {
    // 1. Deve ser um JSON válido
    let json: any = null
    try {
      const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()
      json = JSON.parse(clean)
    } catch {
      return { approved: false, score: 3, feedback: 'Estrutura JSON inválida.' }
    }

    // 2. Deve ter dimensões justificadas e não genéricas
    if (!json.dimensions || !Array.isArray(json.dimensions) || json.dimensions.length < 3) {
      return { approved: false, score: 4, feedback: 'Dimensões de análise incompletas.' }
    }

    const hasShortRationale = json.dimensions.some(
      (d: any) => !d.rationale || d.rationale.trim().length < 15
    )
    if (hasShortRationale) {
      return { approved: false, score: 5, feedback: 'Justificativas das dimensões muito superficiais.' }
    }

    // 3. Deve ter veredito e recomendações
    if (!json.summary || json.summary.length < 30) {
      return { approved: false, score: 5, feedback: 'Veredito executivo fraco ou omisso.' }
    }

    return { approved: true, score: 9.5 }
  }

  if (taskType === 'rewrite') {
    // Reescrita deve ter tamanho razoável e estrutura em markdown
    if (text.length < 100) {
      return { approved: false, score: 4, feedback: 'Currículo reescrito muito sucinto.' }
    }
    return { approved: true, score: 9.0 }
  }

  // Padrão para outros tipos de tarefas
  return { approved: true, score: 8.5 }
}
