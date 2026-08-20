/**
 * A aritmética de tempo de uma análise, separada para poder ser testada.
 *
 * `job.ts` é `server-only` e fala com o Prisma e com a IA — nada dele roda num
 * teste. Mas o que fazia a análise levar minutos não era a IA: era esta conta,
 * feita errada em dois lugares. Aqui ela é uma função pura.
 *
 * ## O tempo morto que existia
 *
 * A concessão (`leaseUntil`) era renovada para `agora + 60s` a cada segmento
 * concluído. Só que a invocação que renovava **não pode viver 60s a partir
 * dali**: a plataforma a encerra 60s depois de ela ter COMEÇADO. Uma invocação
 * que gravava um segmento aos 50s e era encerrada aos 60s deixava a concessão
 * valendo até os 110s — e durante 50 segundos o job ficava marcado como "tem
 * dono" sem ter dono nenhum. Ninguém podia retomá-lo, e nada estava
 * acontecendo.
 *
 * Repetido a cada retomada, é isso que transforma uma análise de 20 segundos
 * numa espera de minutos. O trabalho não estava lento; estava parado esperando
 * uma concessão vencer.
 *
 * A correção é dizer a verdade sobre até quando esta invocação PODE estar viva,
 * que é o começo dela mais o teto da plataforma — nunca além.
 */

/**
 * Teto da plataforma para uma invocação, igual ao `maxDuration` declarado nas
 * rotas. É o limite superior absoluto de vida de qualquer execução.
 */
export const MAX_EXECUTION_MS = 60_000

/**
 * Folga descontada do teto antes de começar trabalho novo.
 *
 * Ser encerrado no meio de uma gravação é o pior desfecho: perde-se o segmento
 * que acabou de ser pago à IA. Melhor parar com tempo de gravar e deixar a
 * próxima consulta retomar.
 */
export const EXECUTION_RESERVE_MS = 6_000

/**
 * Abaixo disto não vale começar um segmento.
 *
 * Um segmento precisa de uma chamada de IA inteira. Começá-lo com dez segundos
 * disponíveis não o acelera — só garante que ele será interrompido, e que o
 * custo dele foi pago sem resultado. Parar aqui é o que faz a retomada avançar
 * em vez de refazer.
 */
export const MIN_SEGMENT_BUDGET_MS = 15_000

/**
 * Até quando esta invocação pode alegar que está viva.
 *
 * Nunca além do teto da plataforma contado do início dela — é essa parte que
 * faltava. `LEASE_MS` continua limitando a detecção de morte para invocações
 * curtas; o mínimo entre os dois é o que nunca mente nas duas direções.
 */
export function leaseUntil(options: {
  now: number
  executionStartedAt: number
  leaseMs: number
}): Date {
  const byLease = options.now + options.leaseMs
  const byPlatform = options.executionStartedAt + MAX_EXECUTION_MS
  return new Date(Math.min(byLease, byPlatform))
}

/** Instante em que esta invocação precisa ter parado de começar coisa nova. */
export function executionDeadline(executionStartedAt: number): number {
  return executionStartedAt + MAX_EXECUTION_MS - EXECUTION_RESERVE_MS
}

/**
 * Quanto tempo sobra para uma chamada de IA, ou `null` se não sobra o
 * suficiente para uma que termine.
 */
export function segmentBudgetMs(now: number, deadlineAt: number): number | null {
  const remaining = deadlineAt - now
  return remaining >= MIN_SEGMENT_BUDGET_MS ? remaining : null
}
