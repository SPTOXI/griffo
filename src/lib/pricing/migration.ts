/**
 * Conversão do saldo antigo, em módulo puro.
 *
 * Vive separado de `lib/entitlements.ts` por um motivo prático: aquele módulo
 * importa `lib/db`, que importa `server-only` — um pacote cujo `index.js` é
 * literalmente um `throw`. Ele existe para quebrar o build quando um módulo de
 * servidor vaza para o navegador, e cumpre esse papel bem; o efeito colateral é
 * que qualquer script de linha de comando que o alcance morre no import, antes
 * de executar uma linha sequer.
 *
 * A regra de conversão é aritmética pura e não precisa de banco. Aqui ela pode
 * ser importada tanto pelo aplicativo quanto pelo script de migração.
 */

/** Taxa de conversão do saldo antigo. */
export const CREDITS_PER_ANALYSIS = 25

/**
 * Quantas análises completas um saldo de créditos vira.
 *
 * Arredonda PARA CIMA, a favor do usuário. Quem tinha 40 créditos — o antigo
 * Plano de Entrada, que valia 2 avaliações — recebe 2 análises, não 1. Ninguém
 * pode sair perdendo numa mudança de modelo que não pediu.
 */
export function analysesForCredits(credits: number): number {
  if (credits <= 0) return 0
  return Math.ceil(credits / CREDITS_PER_ANALYSIS)
}
