/**
 * Quando uma vaga pode ser encerrada — e, sobretudo, quando NÃO pode (§12).
 *
 * Esta é a regra mais importante de toda a coleta, e o prompt mestre a escreve
 * em maiúsculas:
 *
 * > NUNCA marcar vagas como encerradas simplesmente porque uma coleta retornou
 * > zero resultados.
 *
 * ## Por que zero resultados não significa nada
 *
 * HTTP 200 com lista vazia é indistinguível, do lado de cá, de seis situações
 * diferentes: manutenção da fonte, mudança do endpoint, falha do adapter,
 * bloqueio por robô, erro de paginação e indisponibilidade temporária. Em cinco
 * delas as vagas continuam abertas.
 *
 * ## Por que o erro é assimétrico
 *
 * Fechar uma vaga aberta por engano tira do usuário uma oportunidade real, e o
 * estrago é invisível: ele nunca fica sabendo do que perdeu, e não há como
 * reconstruir depois quais vagas foram apagadas por erro e quais encerraram de
 * verdade. Manter aberta uma vaga já encerrada custa ao usuário um clique numa
 * página que diz "vaga não disponível".
 *
 * Um clique perdido contra uma oportunidade perdida. Toda decisão deste arquivo
 * escolhe o clique.
 *
 * ## O que autoriza um encerramento
 *
 * Só uma coleta CONFIÁVEL — completa, sem erro, sem paginação truncada e sem
 * desaparecimento em massa. Qualquer dúvida devolve zero encerramentos e um
 * motivo registrado.
 */

/** Como a coleta terminou, do ponto de vista do adapter. */
export type CollectionOutcome =
  /** Todas as páginas vieram, sem erro. É a única que pode autorizar fechamento. */
  | 'complete'
  /** A fonte respondeu, mas a coleta não terminou (erro no meio, página faltando). */
  | 'partial'
  /** Erro de transporte, timeout, 4xx/5xx, bloqueio. */
  | 'failed'

export type CollectionStatus = 'ok' | 'empty_unexpected' | 'partial' | 'error' | 'never_collected'

export interface CollectionReport {
  outcome: CollectionOutcome
  /** Chaves de deduplicação vistas nesta coleta. */
  seenKeys: string[]
  /** Chaves que estavam abertas antes desta coleta. */
  previouslyOpenKeys: string[]
  /** Mensagem do adapter, quando houve falha. */
  error?: string | null
  /**
   * A fonte declarou explicitamente que estas vagas foram encerradas. É a
   * evidência mais forte que existe, e a única que dispensa as demais
   * verificações.
   */
  reportedClosedKeys?: string[]
}

export interface CollectionDecision {
  status: CollectionStatus
  /** Chaves que PODEM ser encerradas. Frequentemente vazio, e isso é correto. */
  keysToClose: string[]
  /** Motivo do encerramento, gravado em `Job.closedReason`. */
  closeReason: 'absent_from_reliable_collection' | 'source_reported' | null
  /**
   * Confiável o bastante para AUTORIZAR ENCERRAMENTO por ausência? Bem mais
   * estrita que `healthy` — só `true` numa coleta completa. Não usar para
   * decidir se a fonte está saudável: uma fonte de busca grande (Adzuna) é
   * `partial` toda rodada, por desenho, e não é por isso que está falhando.
   */
  reliable: boolean
  /**
   * A fonte respondeu de um jeito que indica que ela está funcionando? Não
   * exige coleta completa — só que a resposta não pareça pane (erro de
   * transporte, ou zero vagas com vaga aberta antes). É o sinal certo para
   * `consecutiveFailures`/`lastSuccessfulCollection`: contar `partial` como
   * falha de saúde faria uma fonte que sempre estoura o teto de páginas —
   * caso normal da Adzuna, documentado — aparecer para sempre como "nunca
   * teve sucesso" no painel, mesmo coletando vaga real a cada rodada.
   */
  healthy: boolean
  /** Explicação legível. Vai para o painel e para o log. */
  explanation: string
}

/**
 * Proporção de desaparecimento acima da qual a coleta vira suspeita.
 *
 * Uma fonte perder metade das vagas de uma vez é possível — fim de trimestre,
 * congelamento de contratações — e é MUITO mais provável que seja falha de
 * paginação. Acima deste limite o encerramento é suspenso e a coleta é marcada
 * para revisão, em vez de apagar metade da base.
 */
export const MASS_DISAPPEARANCE_RATIO = 0.5

/**
 * Abaixo deste número de vagas abertas, a proporção não diz nada.
 *
 * Uma fonte com 2 vagas que perde 1 tem 50% de desaparecimento e provavelmente
 * está certa. O limite de proporção só faz sentido com volume.
 */
export const MASS_DISAPPEARANCE_MIN_JOBS = 8

/**
 * Decide o que fazer com uma coleta.
 *
 * Função pura: recebe o relato, devolve a decisão. Não toca no banco — quem
 * grava é o chamador. Isso é o que torna a regra do §12 testável sem
 * infraestrutura, e é por isso que ela tem teste.
 */
export function decideCollection(report: CollectionReport): CollectionDecision {
  const seen = new Set(report.seenKeys)
  const previouslyOpen = report.previouslyOpenKeys
  const reportedClosed = report.reportedClosedKeys ?? []

  // 1. Falha de transporte. Nada é confiável, nada fecha.
  if (report.outcome === 'failed') {
    return {
      status: 'error',
      keysToClose: [],
      closeReason: null,
      reliable: false,
      healthy: false,
      explanation: `Coleta falhou (${report.error || 'sem detalhe'}). Nenhuma vaga foi encerrada — uma falha de coleta não é evidência de encerramento.`,
    }
  }

  // 2. Encerramento declarado pela própria fonte. É a evidência mais forte, e
  //    vale mesmo numa coleta parcial: a fonte disse, com todas as letras, que
  //    aquela vaga acabou.
  const explicitlyClosed = reportedClosed.filter((key) => previouslyOpen.includes(key))

  // 3. Coleta parcial. A fonte respondeu, mas faltou pedaço — o que estiver
  //    ausente pode estar apenas na parte que não veio.
  if (report.outcome === 'partial') {
    return {
      status: 'partial',
      keysToClose: explicitlyClosed,
      closeReason: explicitlyClosed.length ? 'source_reported' : null,
      reliable: false,
      // Só conta como saudável se trouxe vaga de verdade: uma fonte grande
      // que estoura o teto de páginas com resultado é normal (Adzuna, toda
      // rodada). Parcial com zero vaga nenhuma é outra coisa — mais parecido
      // com falha no meio do caminho do que com fonte grande.
      healthy: seen.size > 0,
      explanation: explicitlyClosed.length
        ? `Coleta incompleta. Encerradas apenas as ${explicitlyClosed.length} vagas que a fonte declarou encerradas; ausência não foi usada como critério.`
        : 'Coleta incompleta. Nenhuma vaga encerrada — o que faltou pode estar na parte que não veio.',
    }
  }

  // 4. O caso do §12: 200, lista vazia, e havia vagas abertas.
  if (seen.size === 0 && previouslyOpen.length > 0) {
    return {
      status: 'empty_unexpected',
      keysToClose: explicitlyClosed,
      closeReason: explicitlyClosed.length ? 'source_reported' : null,
      reliable: false,
      healthy: false,
      explanation:
        `A fonte respondeu sem erro mas devolveu zero vagas, e havia ${previouslyOpen.length} aberta(s). ` +
        'Isso pode ser manutenção, mudança de endpoint, falha do adapter, bloqueio ou erro de paginação. ' +
        'Nenhuma vaga foi encerrada por ausência.',
    }
  }

  // 5. Coleta completa e vazia, sem nada aberto antes. Normal — fonte sem vagas.
  if (seen.size === 0) {
    return {
      status: 'ok',
      keysToClose: [],
      closeReason: null,
      reliable: true,
      healthy: true,
      explanation: 'Coleta completa sem vagas. Não havia nada aberto antes; nada a encerrar.',
    }
  }

  // 6. Coleta completa com resultados. Aqui a ausência PODE virar encerramento.
  const missing = previouslyOpen.filter((key) => !seen.has(key))

  const disappearanceRatio = previouslyOpen.length > 0 ? missing.length / previouslyOpen.length : 0
  const massDisappearance =
    previouslyOpen.length >= MASS_DISAPPEARANCE_MIN_JOBS &&
    disappearanceRatio > MASS_DISAPPEARANCE_RATIO

  if (massDisappearance) {
    return {
      status: 'empty_unexpected',
      keysToClose: explicitlyClosed,
      closeReason: explicitlyClosed.length ? 'source_reported' : null,
      reliable: false,
      healthy: false,
      explanation:
        `${missing.length} de ${previouslyOpen.length} vagas (${Math.round(disappearanceRatio * 100)}%) sumiram de uma vez. ` +
        'Desaparecimento em massa é mais provável ser paginação truncada que encerramento real. Nada foi encerrado por ausência.',
    }
  }

  const byAbsence = missing.filter((key) => !explicitlyClosed.includes(key))

  return {
    status: 'ok',
    keysToClose: [...explicitlyClosed, ...byAbsence],
    closeReason: byAbsence.length ? 'absent_from_reliable_collection' : explicitlyClosed.length ? 'source_reported' : null,
    reliable: true,
    healthy: true,
    explanation:
      `Coleta completa com ${seen.size} vaga(s). ` +
      (missing.length
        ? `${missing.length} ausente(s) encerrada(s) com base numa coleta confiável.`
        : 'Nenhuma vaga ausente.'),
  }
}

/**
 * Os campos de estado da fonte depois de uma coleta.
 *
 * `lastSuccessfulCollection` só avança quando a coleta foi SAUDÁVEL — é ela, e
 * não `lastCollectionAt`, que autoriza encerramentos futuros. Uma fonte que
 * responde há semanas sempre vazia tem `lastCollectionAt` de agora e
 * `lastSuccessfulCollection` antiga, e é essa distância que o painel mostra
 * como problema.
 *
 * Saudável, não confiável: `decision.healthy`, não `decision.reliable`. Uma
 * fonte de busca grande como a Adzuna é `partial` toda rodada, por desenho —
 * usar `reliable` aqui faria `consecutiveFailures` crescer para sempre e
 * `lastSuccessfulCollection` nunca avançar numa fonte que está entregando
 * vaga real a cada coleta. `reliable` continua controlando só o que pode
 * fechar vaga (`keysToClose`, dentro de `decideCollection`).
 */
export function sourceStateAfter(
  decision: CollectionDecision,
  previous: { consecutiveFailures: number },
  now: Date = new Date()
): {
  collectionStatus: CollectionStatus
  collectionError: string | null
  lastCollectionAt: Date
  lastSuccessfulCollection?: Date
  consecutiveFailures: number
} {
  return {
    collectionStatus: decision.status,
    collectionError: decision.reliable ? null : decision.explanation,
    lastCollectionAt: now,
    ...(decision.healthy ? { lastSuccessfulCollection: now } : {}),
    consecutiveFailures: decision.healthy ? 0 : previous.consecutiveFailures + 1,
  }
}
