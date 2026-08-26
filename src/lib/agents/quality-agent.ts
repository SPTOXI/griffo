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

  /**
   * Diagnóstico vocacional.
   *
   * Esta rota declarava `full_analysis`, e as regras acima exigem `dimensions`
   * — campo do laudo de currículo, que o diagnóstico vocacional nunca produziu.
   * O resultado: TODA resposta do Claude era reprovada com "Dimensões de
   * análise incompletas", o roteador caía para o suplente, e a tarefa terminava
   * em falha operacional mesmo quando o modelo havia respondido corretamente.
   *
   * As regras abaixo verificam o formato que esta tarefa de fato produz.
   */
  if (taskType === 'career_orientation') {
    let json: any = null
    try {
      json = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim())
    } catch {
      return { approved: false, score: 3, feedback: 'Estrutura JSON inválida.' }
    }

    if (typeof json.profileSummary !== 'string' || json.profileSummary.trim().length < 30) {
      return { approved: false, score: 4, feedback: 'Resumo do perfil ausente ou superficial.' }
    }

    if (!Array.isArray(json.topMatchingAreas) || json.topMatchingAreas.length === 0) {
      return { approved: false, score: 4, feedback: 'Nenhuma área de carreira sugerida.' }
    }

    const hasWeakArea = json.topMatchingAreas.some(
      (a: any) => !a?.role?.trim() || !a?.whyFit || String(a.whyFit).trim().length < 20
    )
    if (hasWeakArea) {
      return { approved: false, score: 5, feedback: 'Áreas sugeridas sem cargo ou sem justificativa.' }
    }

    return { approved: true, score: 9.0 }
  }

  /**
   * Carta de apresentação e resumo profissional direcionado.
   *
   * Regra própria, e não a de `rewrite` — que também produz texto longo e
   * passaria qualquer coisa acima de 100 caracteres. O risco desta tarefa não é
   * tamanho: é devolver um dos dois artefatos e não o outro, ou devolver um
   * texto com espaços reservados que o candidato enviaria com "[empresa]"
   * dentro.
   */
  if (taskType === 'cover_letter') {
    let json: any = null
    try {
      json = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim())
    } catch {
      return { approved: false, score: 3, feedback: 'Estrutura JSON inválida.' }
    }

    const letter = typeof json.coverLetter === 'string' ? json.coverLetter.trim() : ''
    if (letter.length < 400) {
      return { approved: false, score: 4, feedback: 'Carta de apresentação ausente ou curta demais.' }
    }

    const summary = typeof json.professionalSummary === 'string' ? json.professionalSummary.trim() : ''
    if (summary.length < 120) {
      return { approved: false, score: 5, feedback: 'Resumo profissional ausente ou curto demais.' }
    }

    // Espaço reservado não preenchido: o modelo não encontrou o dado e deixou o
    // buraco. Entregar isso ao usuário é entregar um rascunho como produto.
    if (/\[[^\]]{2,40}\]/.test(letter) || /\[[^\]]{2,40}\]/.test(summary)) {
      return { approved: false, score: 4, feedback: 'Texto contém espaços reservados não preenchidos.' }
    }

    return { approved: true, score: 9.0 }
  }

  if (taskType === 'rewrite') {
    // Reescrita deve ter tamanho razoável e estrutura em markdown
    if (text.length < 100) {
      return { approved: false, score: 4, feedback: 'Currículo reescrito muito sucinto.' }
    }
    return { approved: true, score: 9.0 }
  }

  /**
   * Extração de perfil: a única exigência é ser JSON com as chaves do perfil.
   *
   * Nada de mínimo de conteúdo aqui. Um currículo de primeiro emprego produz,
   * legitimamente, quase tudo nulo — e reprovar isso faria o roteador tentar
   * outro provedor atrás de uma resposta mais cheia, que só poderia ser mais
   * cheia inventando. Quem descarta campo ruim é `lib/profile/extract.ts`.
   */
  if (taskType === 'profile_extraction') {
    const stripped = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    let json: any
    try {
      json = JSON.parse(stripped)
    } catch {
      // Texto antes/depois do JSON que a limpeza de markdown acima não cobre —
      // tenta o maior bloco {...} da resposta antes de reprovar. Mesmo recuo
      // em `lib/profile/extract.ts`, que faz a extração de verdade depois
      // desta aprovação.
      const match = stripped.match(/\{[\s\S]*\}/)
      try {
        json = match ? JSON.parse(match[0]) : undefined
      } catch {
        json = undefined
      }
      if (json === undefined) {
        return { approved: false, score: 2, feedback: 'A leitura do currículo não veio em JSON válido.' }
      }
    }
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return { approved: false, score: 3, feedback: 'A leitura do currículo não veio como objeto JSON.' }
    }
    return { approved: true, score: 9.0 }
  }

  // Padrão para outros tipos de tarefas
  return { approved: true, score: 8.5 }
}
