/**
 * Quando uma vaga deixa de valer.
 *
 * ## O buraco que isto fecha
 *
 * Boards por empresa encerram vaga por ausência: o board lista o que está
 * aberto, e o que saiu dele fechou. Fontes de busca — Gupy, Adzuna — declaram
 * `closesByAbsence: false`, porque sumir de uma busca pode ser mudança de
 * ranking e não encerramento.
 *
 * O efeito colateral é que **vaga dessas fontes não fechava por nada**. Em
 * alguns meses o Radar estaria avisando sobre vaga encerrada há muito tempo — e
 * numa ferramenta que promete só interromper quando vale a pena, isso não é um
 * erro pequeno: é o oposto exato do que foi prometido.
 *
 * ## A regra: tempo, não ausência pontual
 *
 * Sumir de UMA coleta não diz nada. Não aparecer em coleta NENHUMA por semanas
 * diz. A janela é longa de propósito — o custo de fechar cedo demais (esconder
 * vaga viva) é maior que o de fechar tarde (mostrar vaga velha por mais uns
 * dias), e uma vaga real reaparece em toda coleta.
 *
 * ## A trava que herda o §12
 *
 * Se a FONTE está quebrada há semanas, o silêncio é nosso, não da vaga. Fechar
 * aí seria o §12 de novo — apagar vagas vivas porque a coleta falhou — só que
 * em câmera lenta. Por isso a decisão exige que a fonte tenha coletado com
 * sucesso dentro da janela.
 */

/** Sem reaparecer por este tempo, a vaga é dada como encerrada. */
export const STALE_AFTER_DAYS = 45

/**
 * Vaga fechada há mais tempo que isto pode ser apagada.
 *
 * O prazo existe para que a vaga sobreviva ao arrependimento: um fechamento
 * errado pode ser desfeito enquanto a linha existe — a vaga reaparecendo numa
 * coleta limpa o `closedAt`. Depois de apagada, ela voltaria como vaga nova, e
 * quem já a viu seria avisado de novo.
 */
export const PURGE_CLOSED_AFTER_DAYS = 90

export function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export interface StaleInput {
  /** Última vez que a vaga apareceu numa coleta. */
  lastSeenAt: Date
  /** Já fechada? Então não há o que decidir. */
  closedAt: Date | null
  /** Última coleta CONFIÁVEL da fonte. Nulo = a fonte nunca teve uma. */
  sourceLastSuccessfulCollection: Date | null
}

export interface StaleDecision {
  close: boolean
  reason: string | null
  /** Por que NÃO fechou, quando não fechou. Para diagnóstico. */
  explanation: string
}

/**
 * Decide se uma vaga deve ser encerrada por tempo.
 *
 * Devolve a explicação mesmo quando não fecha: "por que aquela vaga velha
 * continua aparecendo" é uma pergunta que alguém vai fazer, e a resposta tem
 * que estar no código e não na memória de quem escreveu.
 */
export function staleDecision(input: StaleInput, options: { now: Date; staleDays?: number }): StaleDecision {
  const staleDays = options.staleDays ?? STALE_AFTER_DAYS
  const cutoff = daysAgo(options.now, staleDays)

  if (input.closedAt) {
    return { close: false, reason: null, explanation: 'Vaga já estava encerrada.' }
  }

  if (input.lastSeenAt >= cutoff) {
    return { close: false, reason: null, explanation: `Vista numa coleta nos últimos ${staleDays} dias.` }
  }

  // A trava que herda o §12: fonte parada há mais tempo que a janela significa
  // que o silêncio é nosso. Fechar aqui apagaria vaga viva porque a COLETA
  // falhou — o erro que o §12 existe para impedir, em câmera lenta.
  if (!input.sourceLastSuccessfulCollection || input.sourceLastSuccessfulCollection < cutoff) {
    return {
      close: false,
      reason: null,
      explanation:
        'A fonte não teve coleta confiável dentro da janela. A vaga não reaparecer pode ser falha nossa, não encerramento dela.',
    }
  }

  return {
    close: true,
    reason: `Não reapareceu em nenhuma coleta por ${staleDays} dias.`,
    explanation: `A fonte segue coletando e a vaga não aparece há mais de ${staleDays} dias.`,
  }
}
