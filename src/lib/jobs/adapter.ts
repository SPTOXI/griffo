/**
 * O contrato de uma fonte de vagas (§11).
 *
 * O §11 lista o que todo adapter precisa ter: identificação, país/mercados,
 * método de coleta, paginação, normalização, tratamento de erro, deduplicação,
 * atualização, encerramento, última coleta e status. Este arquivo é onde esses
 * requisitos viram tipos.
 *
 * ## O adapter não decide encerramento
 *
 * Repare no que `CollectResult` **não** tem: nenhum campo dizendo "feche estas
 * vagas". O adapter reporta o que viu e como a coleta terminou; quem decide o
 * que fechar é `decideCollection`, em `collection.ts`, aplicando o §12.
 *
 * A separação é deliberada. Se cada adapter decidisse por conta própria, a regra
 * mais importante do sistema estaria replicada em N implementações escritas em
 * momentos diferentes — e bastaria uma delas esquecer para que uma coleta vazia
 * apagasse as vagas de alguém.
 *
 * ## O adapter é obrigado a admitir que falhou
 *
 * `outcome` tem três valores e nenhum deles é opcional. Um adapter que engole a
 * exceção e devolve lista vazia com `outcome: 'complete'` está mentindo para o
 * §12 — e é exatamente esse o cenário que o prompt mestre descreve como
 * perigoso. Quando um adapter não sabe se terminou, `partial` é a resposta
 * honesta.
 */

import type { CollectionOutcome } from './collection'
import type { RawJob } from './types'

/** Como a fonte é acessada. */
export type SourceKind = 'ats' | 'job_board' | 'company_careers' | 'api' | 'feed'

export interface JobSourceDescriptor {
  /** Identificador estável. Casa com `JobSource.slug` no banco. */
  slug: string
  name: string
  kind: SourceKind
  /**
   * Mercados em que esta fonte é relevante. Vazio = global.
   *
   * O §5 do plano avisa: "Não assumir que um ATS é globalmente dominante".
   * Declarar os mercados aqui é o que impede o Radar de varrer a Gupy atrás de
   * vaga em Tóquio.
   */
  markets: string[]
  /**
   * A fonte é legalmente e tecnicamente acessível desta forma? Documentação da
   * base — não é verificação automática, é registro de decisão humana.
   */
  accessNote: string
}

export interface CollectContext {
  /** Empresa ou board a coletar, quando a fonte é por empresa. */
  companySlug?: string
  /** Prazo total. Um adapter que estoura o orçamento devolve `partial`. */
  timeBudgetMs: number
  /** Página máxima. Protege contra paginação infinita por bug da fonte. */
  maxPages?: number
}

export interface CollectResult {
  /**
   * Como a coleta terminou. `complete` só quando TODAS as páginas vieram sem
   * erro — é o único valor que autoriza `decideCollection` a encerrar vagas por
   * ausência.
   */
  outcome: CollectionOutcome
  /** Vagas cruas, na ordem em que a fonte devolveu. */
  jobs: RawJob[]
  /** Vagas que a fonte declarou encerradas, quando ela informa isso. */
  reportedClosedIds?: string[]
  /** Mensagem de erro, quando `outcome` não é `complete`. */
  error?: string | null
  /** Quantas páginas foram lidas. Diagnóstico de paginação truncada. */
  pagesFetched?: number
}

export interface JobSourceAdapter {
  descriptor: JobSourceDescriptor
  /**
   * Coleta as vagas.
   *
   * **Nunca deve lançar.** Uma exceção que escapa daqui derruba a rodada
   * inteira do Radar, e um adapter defeituoso não pode impedir os outros de
   * funcionarem. Falha vira `outcome: 'failed'` com a mensagem em `error`.
   */
  collect(context: CollectContext): Promise<CollectResult>
}

/**
 * Envelopa um adapter para que ele nunca lance.
 *
 * Existe porque a regra "não lance" é fácil de escrever no contrato e fácil de
 * violar na implementação — um `JSON.parse` de resposta malformada basta.
 * Envelopar aqui garante o comportamento mesmo num adapter escrito por alguém
 * que não leu este arquivo.
 *
 * O erro vira `failed`, e `failed` não fecha vaga nenhuma (§12).
 */
export function safeCollect(
  adapter: JobSourceAdapter,
  context: CollectContext
): Promise<CollectResult> {
  return adapter.collect(context).catch((e: any) => ({
    outcome: 'failed' as const,
    jobs: [],
    error: `${adapter.descriptor.slug}: ${e?.message || String(e)}`,
    pagesFetched: 0,
  }))
}

/**
 * A fonte é relevante para estes mercados?
 *
 * Coletar a Gupy para quem só busca vaga no Japão gasta requisição, tempo e
 * limite de taxa da fonte para produzir zero resultados úteis — e, pior,
 * produz uma coleta vazia que o §12 vai ter de tratar como suspeita.
 */
export function sourceservesMarkets(descriptor: JobSourceDescriptor, markets: string[]): boolean {
  if (descriptor.markets.length === 0) return true // fonte global
  if (markets.length === 0) return true // usuário sem alvo declarado vê tudo
  return markets.some((m) => m === 'GLOBAL' || descriptor.markets.includes(m))
}
