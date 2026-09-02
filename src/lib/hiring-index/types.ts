/**
 * Índice de temperatura de contratação — o contrato comum dos conectores.
 *
 * ## O que este módulo é
 *
 * A base do sinal "este mercado está esquentando ou esfriando", por país. Um
 * conector busca a série oficial de um órgão de estatística e devolve pontos
 * neste formato; daqui para a frente ninguém precisa saber se o número veio do
 * BLS americano ou do Eurostat.
 *
 * ## O que este módulo NÃO é, e por quê
 *
 * **Não é um ranking entre países.** A tentação óbvia era montar uma tabela
 * "os mercados mais quentes do mundo" e ordená-la. Isso seria mentira
 * estatística, e não uma pequena.
 *
 * O próprio Eurostat não publica um total da UE para a taxa de vagas em aberto
 * — porque os países não são comparáveis entre si. A amostra vai de ~2.500
 * empresas na Finlândia a ~75.000 na Polônia. A taxa de resposta vai de 11,4%
 * na Alemanha a 98,8% na Romênia. A França pesquisa só empresas com 10+
 * empregados e exclui administração pública; a Dinamarca usa outro recorte de
 * setor. Uma taxa de 2,0% na França e 2,0% na Romênia não são o mesmo número
 * medido duas vezes — são dois números diferentes com o mesmo nome.
 *
 * Por isso a única comparação válida aqui é **um país contra a própria
 * história**. É também, por acaso, o que a metáfora da curva de J pede: cada
 * mercado tem a curva dele, não uma posição na curva alheia.
 *
 * ## Por que existe um nível de confiança no dado, e não só na tela
 *
 * As fontes não têm a mesma qualidade, e a diferença não é de grau — é de
 * natureza. Taxa de vagas em aberto (JOLTS, Eurostat) mede demanda declarada
 * por empregador. Taxa de desemprego modelada (ILOSTAT, CEPALSTAT — fase 2)
 * mede outra coisa, e em economias com setor informal grande mede mal: quem
 * trabalha informalmente conta como "empregado" sem que exista contratação
 * formal nenhuma por trás. É limitação metodológica documentada, não ruído.
 *
 * `confidence` fica no PONTO, e não num tooltip, para que essa diferença
 * sobreviva a qualquer tela futura que alguém escreva sem ter lido isto.
 */

/**
 * A grandeza que o ponto mede.
 *
 * Métricas diferentes NÃO se misturam na mesma série: a taxa de vagas em
 * aberto do Eurostat e a do JOLTS medem coisas parecidas com definições
 * diferentes, e emendá-las produziria um degrau artificial que a classificação
 * de fase leria como virada de mercado.
 */
export type LaborMetric =
  /** JOLTS: vagas em aberto / (emprego + vagas em aberto), mensal. */
  | 'job_openings_rate'
  /** Eurostat: postos vagos / (postos ocupados + postos vagos), trimestral. */
  | 'job_vacancy_rate'
  /** Fase 2 (ILOSTAT/CEPALSTAT). Declarado aqui porque o esquema já o aceita. */
  | 'unemployment_rate'

/**
 * Quanto o número merece ser levado a sério.
 *
 * `high` — pesquisa direta com empregadores sobre vagas em aberto.
 * `low`  — taxa derivada/modelada, ou marcada como pouco confiável pela
 *          própria fonte. Nunca deve ser apresentada com a mesma precisão
 *          implícita de um `high`.
 */
export type ConfidenceTier = 'high' | 'low'

/** Mensal ou trimestral. Define o que "3 períodos de média móvel" significa. */
export type PeriodType = 'month' | 'quarter'

/**
 * Um ponto de série temporal, no formato que vai para o banco.
 *
 * Espelha `LaborMarketPoint` no `schema.prisma`. O conector devolve isto; quem
 * grava faz um `upsert` por `(country, source, metric, period)` — a mesma
 * competência mensal pode ser buscada várias vezes e a última leitura vence,
 * que é exatamente o que a revisão do JOLTS exige.
 */
export interface LaborMarketPointInput {
  /** ISO 3166-1 alfa-2. `GR`, nunca `EL`; `GB`, nunca `UK`. */
  country: string
  /** Identificador estável do conector: `bls_jolts`, `eurostat_jvs`. */
  source: string
  metric: LaborMetric
  value: number
  /** `percent` hoje. Existe para o dia em que uma fonte devolver nível absoluto. */
  unit: string
  /** Primeiro dia do período coberto, em UTC. Julho/2026 → `2026-07-01T00:00Z`. */
  period: Date
  periodType: PeriodType
  /**
   * `false` = impressão preliminar/provisória.
   *
   * Não é detalhe. A taxa de resposta do JOLTS caiu de 58% (2019) para ~30% e
   * a revisão da segunda divulgação passou a valer ~180 mil vagas em média —
   * cerca do dobro da norma histórica. Publicar a primeira impressão como se
   * fosse "o número" é publicar algo que costuma mudar.
   */
  revised: boolean
  /**
   * A fonte declarou QUEBRA DE SÉRIE neste período.
   *
   * É a marcação mais importante deste esquema, e é fácil não perceber por
   * quê. Uma quebra significa que os valores antes e depois dela não são
   * comparáveis **entre si** — mudou a definição, o recorte da amostra ou o
   * método. E "o país contra a própria história" é a única comparação que este
   * produto faz.
   *
   * Sem este campo, uma mudança metodológica do instituto de estatística
   * apareceria na tela como um mercado esfriando ou esquentando de repente.
   * `classifyHiringPhase` corta a série na quebra mais recente por causa dele.
   */
  seriesBreak: boolean
  confidence: ConfidenceTier
  /**
   * Marcação crua da fonte, quando existe (`p`, `b`, `d`, `e`, `u` no
   * Eurostat; código de nota de rodapé no BLS). Guardada como veio, sem
   * tradução: é rastro de origem, não texto de tela.
   */
  note: string | null
}

/**
 * Resultado de uma busca.
 *
 * Os três desfechos são os mesmos dos adapters de vaga, e pelo mesmo motivo:
 * **resposta vazia não é mercado vazio**. Uma série que devolve zero pontos é
 * falha de coleta, não um país que parou de contratar — e tratar as duas como
 * a mesma coisa foi o defeito que a Adzuna já ensinou aqui (200 com
 * `exception` lido como "nenhuma vaga").
 */
export interface ConnectorResult {
  outcome: 'complete' | 'partial' | 'failed'
  points: LaborMarketPointInput[]
  /** Nulo em `complete`. Preenchido em `partial` e obrigatório em `failed`. */
  error: string | null
}

/** O que o conector declara sobre si mesmo, antes de rodar. */
export interface ConnectorDescriptor {
  slug: string
  name: string
  metric: LaborMetric
  confidence: ConfidenceTier
  /**
   * ISO2 cobertos, quando são conhecidos de antemão. `null` quando a própria
   * resposta declara os países (é o caso do Eurostat, que muda de conjunto
   * conforme adesões e conforme quem entregou dado no trimestre).
   */
  countries: string[] | null
  /** Sob que termos a fonte é acessada. Vai para a documentação, não para tela. */
  accessNote: string
}

export interface FetchContext {
  /** Teto de tempo da busca inteira, em ms. */
  timeBudgetMs: number
}

/**
 * A abstração inteira.
 *
 * Deliberadamente pequena: buscar e devolver pontos. Nada de repetição
 * automática, backoff ou controle de cota aqui — as duas APIs reais desta fase
 * não precisam, e uma máquina de retentativa escrita antes de existir o
 * problema é uma máquina que ninguém sabe se funciona.
 */
export interface LaborMarketConnector {
  descriptor: ConnectorDescriptor
  fetchPoints(context: FetchContext): Promise<ConnectorResult>
}
