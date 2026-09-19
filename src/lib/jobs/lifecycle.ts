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

/**
 * Publicada há mais tempo que isto, a vaga some do Radar e das contagens
 * públicas — **sem** ser encerrada.
 *
 * ## Por que filtro na leitura, e não `closedAt`
 *
 * Uma primeira versão disto (PR #71, revertida) escrevia `closedAt` nas vagas
 * velhas. Dois defeitos, e os dois vinham da mesma causa: `closedAt` carrega
 * dois significados — "esta vaga acabou" e "pode limpar" — e escrever idade ali
 * herdava o segundo sem querer.
 *
 * 1. `pruneUnfoundedAlerts` apaga permanentemente todo alerta cuja vaga esteja
 *    fechada. Fechar o acervo velho de uma vez viraria apagamento em massa do
 *    histórico das pessoas.
 * 2. `runCollection` reabre qualquer vaga que reaparece, e roda ANTES. A vaga
 *    oscilava fechada/aberta a cada rodada.
 *
 * Idade é um fato que depende de `now`, não um estado da vaga — e fato
 * dependente de tempo não se grava, se calcula na leitura. É a mesma conclusão
 * a que `legitimacy.server.ts` chegou sobre o sinal `evergreen`.
 *
 * O número é de produto, não técnico: ele define o que o site pode afirmar
 * sobre o frescor do que exibe.
 */
export const FRESH_MAX_AGE_DAYS = 120

/**
 * Publicada há mais tempo que isto, a vaga é **apagada**, com alerta e tudo.
 *
 * Decisão do operador, e ela desfaz de propósito a regra antiga de
 * `purgeClosedJobs` ("vaga sobre a qual alguém foi avisado fica, sempre"). O
 * que aquela regra protegia — o registro de que alguém foi avisado — passa a
 * viver em `RadarOfferLog`, que é uma cópia desnormalizada (cargo, empresa,
 * país, data) e **sobrevive ao apagamento da vaga**.
 *
 * Trocar a linha inteira por quatro campos é a escolha certa aqui: o que a
 * pessoa precisa lembrar é "esta vaga me foi oferecida naquele dia", não o
 * anúncio inteiro de uma vaga que não existe mais há meio ano.
 *
 * Os 60 dias de folga sobre `FRESH_MAX_AGE_DAYS` existem para a vaga sumir da
 * vista bem antes de sumir do banco: se o corte de frescor estiver errado, dá
 * tempo de perceber e voltar atrás enquanto a linha ainda existe.
 */
export const DELETE_AFTER_PUBLISHED_DAYS = 180

export function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

/**
 * O recorte de "vaga que conta": aberta e não velha demais.
 *
 * Existe como função única porque o mesmo recorte é usado no Radar, na
 * contagem da home e na lista por país. Três cópias divergiriam, e a home
 * passaria a discordar do Radar sobre quantas vagas existem.
 *
 * **Vaga sem `publishedAt` entra.** Idade desconhecida não é idade demais — a
 * regra do `types.ts` ("eliminar por dado ausente transforma silêncio em
 * rejeição") vale aqui como vale no resto. A consequência honesta é que a
 * promessa pública é sobre o que se SABE: nenhuma vaga sabidamente mais velha
 * que o corte.
 */
export function freshOpenJobWhere(now: Date = new Date(), maxAgeDays: number = FRESH_MAX_AGE_DAYS) {
  return {
    closedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { gte: daysAgo(now, maxAgeDays) } }],
  }
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
