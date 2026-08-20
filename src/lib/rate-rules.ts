/**
 * Qual regra de limite se aplica a um caminho.
 *
 * ## O erro que isto corrige
 *
 * A busca era `RULES.find(r => path.startsWith(r.prefix))` — a PRIMEIRA regra
 * cujo prefixo casa. Com `/api/resume/analyze` na lista antes de qualquer
 * outra coisa, `/api/resume/analyze/status` herdava o limite da rota cara: 10
 * requisições por 10 minutos.
 *
 * Só que a tela CONSULTA o status a cada 1,5 segundo enquanto o laudo é
 * gerado. Dez consultas são quinze segundos. A partir daí, todas as outras
 * voltavam 429 — por dez minutos.
 *
 * E o efeito não era só a barra parar. É a consulta de status que REATIVA um
 * trabalho cuja invocação a plataforma encerrou (`resumeIfStalled`). Bloqueada
 * no middleware, ela nunca chegava à rota: o job ficava para sempre no
 * primeiro segmento, e a tela girava sobre um trabalho que ninguém ia retomar.
 *
 * ## Por que prefixo mais longo, e não ordem
 *
 * Ordenar a lista resolveria este caso e deixaria a armadilha de pé: qualquer
 * sub-rota criada depois herdaria em silêncio o limite da rota pai, e o
 * sintoma seria de novo "trava sem erro". O prefixo mais específico ganhar é
 * uma regra que não depende de ninguém lembrar da ordem.
 */

export interface RateRule {
  /** Prefixo do caminho ao qual a regra se aplica. */
  prefix: string
  /** Requisições permitidas dentro da janela. */
  limit: number
  /** Tamanho da janela em milissegundos. */
  windowMs: number
}

export function matchRule<T extends RateRule>(path: string, rules: T[]): T | undefined {
  let best: T | undefined
  for (const rule of rules) {
    if (!path.startsWith(rule.prefix)) continue
    if (!best || rule.prefix.length > best.prefix.length) best = rule
  }
  return best
}
