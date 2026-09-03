/**
 * O índice inteiro de uma vez: um resumo por país e a contagem de fases.
 *
 * ## Por que a contagem, e não uma nota
 *
 * O pedido era um "GriffoWork Index": um número que dissesse como está o
 * mercado de trabalho no mundo. Ele não existe, e não por falta de vontade.
 *
 * `phase.ts` diz, no cabeçalho, por que os valores de dois países não podem ser
 * comparados entre si: os institutos europeus medem a mesma taxa com amostras
 * de 2.500 a 75.000 empresas e taxas de resposta de 11,4% a 98,8%, e o próprio
 * Eurostat não publica um total da UE por causa disso. Somando a isso o §2.54,
 * metade da cobertura atual (ILOSTAT e CEPALSTAT) é taxa de DESEMPREGO, que
 * mede outra coisa e mede mal onde há setor informal grande. Uma média
 * ponderada de 98 números medidos por quatro réguas diferentes teria três
 * casas decimais e nenhum significado.
 *
 * O que **é** comparável é a FASE, porque cada uma já saiu da comparação do
 * país com ele mesmo. "Está subindo" e "está caindo" são a mesma afirmação em
 * Portugal e no Quênia, mesmo que 4,1% e 4,1% não sejam a mesma coisa. Então o
 * índice é uma **distribuição**: quantos países em cada fase, com o total
 * dito junto. É contagem de fato, não estimativa.
 *
 * Era a saída já antecipada em §2.54 ("a resposta provável continua sendo
 * agregar as *fases*, não os valores").
 *
 * ## E por continente? Sim — mas com o denominador junto
 *
 * O §2.56 recusou o corte continental com um argumento certo: *"África: 60%
 * aquecendo" seria uma afirmação sobre os 12 países que têm dado apresentada
 * como afirmação sobre 54*. `continentBreakdown` só existe porque devolve o
 * denominador junto: `totalCountries` (quantos países daquele continente a
 * lista do produto conhece) e `uncovered` (quantos deles nenhuma fonte cobre)
 * saem no MESMO objeto que a distribuição, e não como algo que quem chama
 * calcula depois se lembrar. Um continente com 12 de 54 diz "12 de 54" antes
 * de dizer qualquer percentagem — que é a diferença entre um recorte e uma
 * insinuação de cobertura.
 *
 * Continua não havendo nota por continente, pelo mesmo motivo de não haver
 * nota global: os valores não se somam. O que se conta é país.
 *
 * ## O único número escalar que existe aqui, e como ele é calculado
 *
 * `netBreadth = (países em heating_up) − (países em cooling)`.
 *
 * Inteiro, não média. Chama-se AMPLITUDE (*breadth*) e não intensidade porque é
 * exatamente isso que ele mede: em quantos mercados a mais a curva está subindo
 * acima do próprio normal do que caindo. `+12` quer dizer "doze países a mais
 * aquecendo do que esfriando", uma frase que se confere contando linhas na
 * tabela. Não quer dizer que o mundo esteja 12 unidades de nada.
 *
 * `recovering`, `bottoming_out` e `stable` ficam de fora do escalar de
 * propósito: são estados intermediários, e incluí-los exigiria pesá-los uns
 * contra os outros — que é justamente o arbítrio que a distribuição evita. Eles
 * continuam visíveis na distribuição, que é a leitura principal.
 *
 * ## O que este arquivo não faz
 *
 * Não fala com o banco (ver o cabeçalho de `lookup.ts`: `server-only` derruba
 * qualquer teste rodado por `tsx`). Não inventa país: quem não tem linha na
 * tabela não entra em `countries` e não conta em `tracked` — a tela é que diz,
 * pelo desenho, que os demais estão sem dado.
 */

import type { HiringPhase } from './phase'
import { summarizeHiringIndex, type HiringIndexSummary, type LaborMarketRow } from './lookup'
import {
  CONTINENTS,
  COUNTRIES_PER_CONTINENT,
  continentOf,
  type Continent,
} from './continents'

/** As cinco fases, na ordem da curva. Ordem de leitura, não de importância. */
export const PHASES: readonly HiringPhase[] = [
  'cooling',
  'bottoming_out',
  'recovering',
  'heating_up',
  'stable',
] as const

export interface PhaseDistribution {
  /** Quantos países em cada fase. Soma + `unclassified` = `tracked`. */
  counts: Record<HiringPhase, number>
  /**
   * Países com dado oficial na tabela mas sem histórico bastante para
   * classificar. Não é erro, e não é "sem cobertura" — são frases diferentes.
   */
  unclassified: number
  /** Países com pelo menos uma linha de fonte oficial. */
  tracked: number
  /** Países com fase classificada. `tracked - unclassified`. */
  classified: number
  /** `heating_up − cooling`. Ver o cabeçalho: amplitude, não intensidade. */
  netBreadth: number
}

/**
 * Um continente: a distribuição dos países cobertos DELE, e a cobertura real.
 *
 * Os três números de cobertura são ditos por extenso de propósito. Ver o
 * cabeçalho: uma distribuição de continente sem o denominador ao lado vira uma
 * afirmação sobre países que ninguém mediu.
 */
export interface ContinentSummary {
  continent: Continent
  /**
   * A MESMA `PhaseDistribution` do agregado global, restrita aos países
   * cobertos deste continente. `distribution.tracked` é quantos países daqui
   * têm fonte oficial.
   */
  distribution: PhaseDistribution
  /**
   * Quantos países deste continente a lista do produto conhece — o
   * denominador honesto. Não é "quantos países existem no mundo" nem "quantos
   * têm linha no banco": ver o cabeçalho de `continents.ts`.
   */
  totalCountries: number
  /**
   * `totalCountries − distribution.tracked`. Países deste continente que
   * nenhuma fonte oficial cobre.
   *
   * Sai calculado daqui, e não da tela, porque é o número que a tela seria
   * tentada a esquecer — e esquecê-lo é exatamente o defeito que o §2.56
   * apontou ao recusar o corte por continente.
   */
  uncovered: number
}

export interface HiringAtlas {
  /**
   * Um resumo por país COBERTO, em ordem alfabética de código ISO.
   *
   * A ordem é alfabética e não tem exceção. Nenhum mercado é listado primeiro
   * por ser maior, mais antigo no produto ou de onde quem escreveu o código
   * mora.
   */
  countries: HiringIndexSummary[]
  distribution: PhaseDistribution
  /**
   * Os seis continentes povoados, sempre os seis, na ordem alfabética do
   * código.
   *
   * Continente sem nenhum país coberto **não some da lista**: ele sai com a
   * distribuição zerada e `uncovered === totalCountries`, que é a frase "aqui
   * não medimos nada" dita com número. Omiti-lo faria a tela parecer completa.
   */
  byContinent: ContinentSummary[]
  /** Período mais recente presente em qualquer série, em ISO. */
  latestPeriod: string | null
  /** Quando a coleta gravou pela última vez, em ISO. Vem do banco. */
  updatedAt: string | null
}

/** Contagem por fase a partir de resumos já prontos. */
export function phaseDistribution(summaries: readonly HiringIndexSummary[]): PhaseDistribution {
  const counts: Record<HiringPhase, number> = {
    cooling: 0,
    bottoming_out: 0,
    recovering: 0,
    heating_up: 0,
    stable: 0,
  }

  let tracked = 0
  let unclassified = 0

  for (const summary of summaries) {
    if (!summary.covered) continue
    tracked++
    if (summary.phase) counts[summary.phase]++
    else unclassified++
  }

  return {
    counts,
    unclassified,
    tracked,
    classified: tracked - unclassified,
    netBreadth: counts.heating_up - counts.cooling,
  }
}

/**
 * A mesma contagem, recortada por continente, com a cobertura junto.
 *
 * Reaproveita `phaseDistribution` — chamada uma vez por continente com os
 * resumos daquele continente — em vez de recontar. Duas contagens da mesma
 * coisa divergiriam na primeira correção feita só numa delas, e a soma dos
 * continentes deixaria de bater com o total global sem ninguém perceber.
 *
 * País cujo código a lista do produto não conhece **não entra em continente
 * nenhum**: ele continua no agregado global (a fonte oficial o cobre de
 * verdade), mas somá-lo a um continente estouraria o denominador daquele
 * continente, e "31 de 30" é pior que a omissão. Hoje isso não acontece — os
 * conectores já descartam código fora da lista (`iso3.ts`) —, mas a coluna do
 * banco é texto livre e a garantia não é estrutural.
 */
export function continentBreakdown(
  summaries: readonly HiringIndexSummary[]
): ContinentSummary[] {
  const byContinent = new Map<Continent, HiringIndexSummary[]>(
    CONTINENTS.map((continent) => [continent, [] as HiringIndexSummary[]])
  )

  for (const summary of summaries) {
    const continent = continentOf(summary.country)
    if (!continent) continue
    byContinent.get(continent)!.push(summary)
  }

  return CONTINENTS.map((continent) => {
    const distribution = phaseDistribution(byContinent.get(continent)!)
    const totalCountries = COUNTRIES_PER_CONTINENT[continent]
    return {
      continent,
      distribution,
      totalCountries,
      // `Math.max` é um cinto de segurança contra o único jeito de isto ficar
      // negativo: um país coberto que a lista do produto conhece deixar de ser
      // conhecido. Melhor `0` do que uma tela dizendo "−2 países sem fonte".
      uncovered: Math.max(0, totalCountries - distribution.tracked),
    }
  })
}

/**
 * Da tabela inteira para a tela do mapa.
 *
 * Agrupa por país e delega a `summarizeHiringIndex` — a MESMA função que a rota
 * de um país usa. Duas leituras diferentes da mesma tabela dariam, um dia, duas
 * respostas diferentes para o mesmo país, e a que aparece no mapa público
 * discordaria da que aparece no laudo pago.
 */
export function summarizeAtlas(
  rows: readonly LaborMarketRow[],
  updatedAt: Date | string | null = null
): HiringAtlas {
  const byCountry = new Map<string, LaborMarketRow[]>()

  for (const row of rows) {
    const code = typeof row.country === 'string' ? row.country.trim().toUpperCase() : ''
    if (!/^[A-Z]{2}$/.test(code)) continue
    const list = byCountry.get(code)
    if (list) list.push(row)
    else byCountry.set(code, [row])
  }

  const countries = [...byCountry.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, countryRows]) => summarizeHiringIndex(code, countryRows))

  let latestPeriod: string | null = null
  for (const summary of countries) {
    if (summary.latestPeriod && (latestPeriod === null || summary.latestPeriod > latestPeriod)) {
      latestPeriod = summary.latestPeriod
    }
  }

  return {
    countries,
    distribution: phaseDistribution(countries),
    byContinent: continentBreakdown(countries),
    latestPeriod,
    updatedAt: toIso(updatedAt),
  }
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

/**
 * A fase de cada país, num objeto simples de consulta.
 *
 * Existe para a tela do mapa, que percorre ~200 formas desenhadas e precisa
 * responder "qual a fase deste código?" em cada uma sem varrer a lista inteira
 * toda vez. País ausente do objeto é país SEM COBERTURA — e é o desenho neutro
 * que responde por ele, nunca uma cor de fase.
 */
export function phaseByCountry(atlas: HiringAtlas): Record<string, HiringPhase | null> {
  const out: Record<string, HiringPhase | null> = {}
  for (const summary of atlas.countries) {
    if (summary.covered) out[summary.country] = summary.phase
  }
  return out
}
