/**
 * Quais países a Adzuna varre nesta rodada.
 *
 * ## O problema que isto resolve
 *
 * A Adzuna cobre dezenove países (ver `ADZUNA_COUNTRIES`), e a cota gratuita é
 * de **2.500 requisições por mês** — cerca de 83 por dia. Varrer todos com
 * todos os termos toda noite estouraria isso: 19 países × 6 termos × 2 páginas
 * = 228 requisições por rodada, 7.068 no mês.
 *
 * O tempo aperta antes da cota. As fontes rodam **em sequência** dentro dos 45s
 * da invocação (`runRadar`), e a Adzuna é a última da lista. Medido em
 * 02/09/2026, uma requisição de busca leva ~1,1s na mediana (2,1s no pior dos
 * oito países medidos); somada a gravação de até 50 vagas, um país com cinco
 * termos custa ~6s e um país de varredura de base, ~2s. Dezenove países numa
 * rodada não cabem — não porque a cota acabaria, mas porque o relógio acabaria
 * primeiro, e os últimos da fila simplesmente não rodariam.
 *
 * A saída não é cortar arbitrariamente: é **rodízio**. Cada rodada atende
 * alguns países, sempre os que esperaram mais, e em poucos dias todos foram
 * cobertos. Ninguém fica para trás — só espera.
 *
 * É a mesma decisão que a rodada do Radar já toma com usuários, pelo mesmo
 * motivo: tentar atender todos e ser cortado no meio deixa metade sem
 * atendimento e sem registro disso.
 *
 * ## O que ordena a fila
 *
 * `lastCollectionAt` da fonte daquele país (`adzuna:br`, `adzuna:us`...). País
 * nunca coletado vem primeiro — ele nunca teve vez. Isso reusa estado que já
 * existe no banco, em vez de inventar um contador de rodízio que precisaria ser
 * mantido em sincronia com a realidade.
 */

export interface CountryPlanInput {
  /** Código no formato da Adzuna: `br`, `us`, `gb`... */
  country: string
  /** Cargos que os usuários daquele país declararam buscar. */
  terms: string[]
  /** Última coleta daquele país. Nulo = nunca. */
  lastCollectionAt: Date | null
}

export interface CountryPlan {
  country: string
  terms: string[]
  /**
   * Varredura SEM termo: as vagas mais recentes do mercado, sem filtro de cargo.
   *
   * Verdadeiro exatamente quando não há termo a buscar. Ver
   * `adzunaRoundInputs` para o motivo de isso ter deixado de ser "não roda".
   */
  baseline: boolean
}

export interface PlanOptions {
  /** Quantos países por rodada. Multiplica direto o consumo de cota. */
  maxCountries?: number
  /** Quantos termos por país. Idem. */
  maxTermsPerCountry?: number
}

/**
 * Países cobertos pela Adzuna, **verificados um a um** contra a API real.
 *
 * ## Verificado contra a API real
 *
 * Em 02/09/2026, por `GET` em
 * `api.adzuna.com/v1/api/jobs/{country}/search/1?results_per_page=50&max_days_old=30&sort_by=date`,
 * com as credenciais desta instalação. Os dezenove abaixo responderam **200 com
 * resultados**; o `count` observado, que serve de ordem de grandeza do mercado:
 *
 * | novo | país | `count` | | | país | `count` |
 * |------|------|---------|-|-|------|---------|
 * |      | us | 3.657.405 | | | nl | 99.342 |
 * |      | de |   654.021 | | | mx | 91.432 |
 * |      | fr |   566.334 | |•| pl | 83.726 |
 * |      | br |   468.460 | |•| ch | 66.897 |
 * |      | gb |   377.272 | |•| za | 61.377 |
 * |      | au |   188.473 | |•| be | 59.028 |
 * |      | ca |   151.909 | |•| es | 50.377 |
 * |      | it |   113.065 | |•| sg | 29.557 |
 * |      | in |   111.577 | |•| at | 20.671 |
 * |      |    |           | |•| nz |  6.552 |
 *
 * Os oito marcados com • são os acrescentados nesta rodada de verificação
 * (`nz`, `za`, `pl`, `nl`, `at`, `be`, `sg`, `ch`) — o comentário anterior
 * dizia que os onze eram "todos os que a Adzuna cobre", e não eram mais.
 *
 * ## O que NÃO é coberto, também verificado
 *
 * Na mesma data, responderam **404 com `exception: UNSUPPORTED_COUNTRY`**:
 * `pt`, `jp`, `ru`, `ie`, `se`, `no`, `dk`, `fi`, `ae`. Portugal e Japão já
 * eram sabidos; a Rússia entrou no teste porque listas antigas da Adzuna a
 * citam — hoje não é atendida, e é por isso que "a documentação diz" não
 * substitui a requisição.
 *
 * Não existe endpoint de descoberta nesta assinatura: `jobs/countries` e
 * `countries` responderam 404 `UNKNOWN_METHOD`. A lista de países só se
 * descobre país a país.
 *
 * Antes de acrescentar um país aqui, teste. É uma requisição.
 */
export const ADZUNA_COUNTRIES = [
  'br', 'us', 'ca', 'gb', 'es', 'mx', 'de', 'fr', 'in', 'au', 'it',
  // Acrescentados em 02/09/2026, cada um verificado contra a API real.
  'nz', 'za', 'pl', 'nl', 'at', 'be', 'sg', 'ch',
] as const

const COVERED = new Set<string>(ADZUNA_COUNTRIES)

/** A Adzuna atende este país? */
export function adzunaCovers(country: string | null | undefined): boolean {
  return typeof country === 'string' && COVERED.has(country.trim().toLowerCase())
}

/**
 * A fila de países da rodada: TODOS os cobertos, com os termos que houver.
 *
 * ## O que isto corrige, e por que a regra anterior mudou
 *
 * Até aqui a fila saía de `searchTermsByCountry()` — os países onde ALGUÉM
 * declarou morar. A regra que a acompanhava era explícita e, no seu contexto,
 * certa: "país sem termo nenhum fica de fora, gastar requisição numa busca vazia
 * é gastar cota de quem tem o que procurar".
 *
 * O que essa regra produziu na prática, medido no banco em 02/09/2026: quatro
 * perfis, todos com residência declarada no Brasil, e portanto **uma única
 * fonte Adzuna existente** — `adzuna:br`, com 400 vagas. Nenhuma `adzuna:us`,
 * `adzuna:de`, `adzuna:gb`. Os onze países da lista eram onze no papel e um na
 * execução, e acrescentar oito ao array não teria mudado nada: a fila não os
 * alcançava.
 *
 * Isso é exatamente o viés que a regra do operador proíbe — o corpo de vagas do
 * produto acabar sendo o do Brasil porque foi de lá que vieram os primeiros
 * usuários.
 *
 * ## Por que sem termo, e não com termos inventados
 *
 * A alternativa seria semear cada país com cargos escolhidos por nós. Seria
 * inventar demanda: o corpo de vagas passaria a refletir o que ADIVINHAMOS que
 * se procura na Polônia. Uma busca sem `what` devolve as vagas mais recentes
 * daquele mercado, na ordem em que foram publicadas — amostra que não escolhe
 * profissão nenhuma, que é precisamente a propriedade necessária para um dia
 * medir quais profissões crescem por país.
 *
 * E custa **uma** requisição por país, contra cinco de um país com termos.
 */
export function adzunaRoundInputs(
  termsByCountry: Map<string, string[]>,
  lastCollections: Map<string, Date | null>
): CountryPlanInput[] {
  return ADZUNA_COUNTRIES.map((country) => ({
    country,
    terms: termsByCountry.get(country.toUpperCase()) ?? termsByCountry.get(country) ?? [],
    lastCollectionAt: lastCollections.get(country) ?? null,
  }))
}

/**
 * Monta a rodada.
 *
 * País sem termo entra como varredura de base (`baseline`), não fica de fora —
 * ver `adzunaRoundInputs`. País fora da cobertura continua fora: pedir a um país
 * que a Adzuna não atende é um 404 garantido toda rodada.
 */
export function planAdzunaRound(inputs: CountryPlanInput[], options: PlanOptions = {}): CountryPlan[] {
  const maxCountries = options.maxCountries ?? 4
  const maxTermsPerCountry = options.maxTermsPerCountry ?? 3

  return inputs
    .filter((input) => adzunaCovers(input.country))
    .sort((a, b) => {
      // Nunca coletado vem primeiro: nunca teve vez.
      const at = a.lastCollectionAt?.getTime() ?? 0
      const bt = b.lastCollectionAt?.getTime() ?? 0
      if (at !== bt) return at - bt
      // Empate: ordem estável, para a rodada ser reproduzível.
      return a.country.localeCompare(b.country)
    })
    .slice(0, Math.max(0, maxCountries))
    .map((input) => {
      const terms = input.terms.slice(0, Math.max(0, maxTermsPerCountry))
      return { country: input.country.toLowerCase(), terms, baseline: terms.length === 0 }
    })
}

/**
 * Quantas requisições esta rodada vai gastar, no pior caso.
 *
 * Serve para a rodada declarar o consumo em vez de deixá-lo implícito — e para
 * o teste travar o número, que é o que impede alguém de subir um limite sem
 * perceber que estourou a cota do mês.
 *
 * A varredura de base custa uma requisição por página, e não zero: é uma busca
 * como as outras, só que sem `what`. Contá-la como zero faria a rodada declarar
 * um consumo menor que o real — o tipo de erro que só aparece na fatura.
 */
export function estimatedRequests(plans: CountryPlan[], pagesPerTerm: number): number {
  return plans.reduce((sum, plan) => sum + Math.max(plan.terms.length, plan.baseline ? 1 : 0) * pagesPerTerm, 0)
}
