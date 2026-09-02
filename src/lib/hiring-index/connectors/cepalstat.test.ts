import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CEPALSTAT_DESCRIPTOR,
  createCepalstatConnector,
  locateTimeDimensions,
  parseCepalstatPayload,
  periodFromYearQuarter,
  windowStart,
} from './cepalstat'

/**
 * Recorte do payload REAL observado em 01/09/2026, em
 * `GET api-cepalstat.cepal.org/cepalstat/api/v1/indicator/2182/data?lang=en&format=json`.
 *
 * Tudo aqui saiu da resposta de verdade: os identificadores numéricos das
 * dimensões (208 país, 26677 trimestre, 29117 ano); os identificadores dos
 * trimestres FORA DE ORDEM (`Q1`=26681, `Q2`=26680, `Q3`=26682, `Q4`=26678);
 * os agregados regionais com `iso3: null`; a nota 8800 presa a UM único
 * registro (Brasil 2016-Q1), a 8604 a um só (República Dominicana 2015-Q1) e a
 * 8801 a um só (Paraguai 2017-Q1); a 8803 ("Preliminary data") nos quatro
 * trimestres de 2020 do Peru; e a 15092, ressalva GERAL do INDEC, em todos os
 * registros argentinos.
 *
 * Acrescentado de propósito ao recorte: um registro de `CUW` (Curaçao), país
 * que o CEPALSTAT lista e que `lib/market/countries.ts` não conhece.
 */
const YEAR_IDS: Record<string, number> = {
  '2015': 29185, '2016': 29186, '2017': 29187, '2020': 29190, '2025': 29195,
}
const Q_IDS: Record<string, number> = { Q1: 26681, Q2: 26680, Q3: 26682, Q4: 26678 }

const row = (iso3: string | null, year: string, quarter: string, value: string, notes: string) => ({
  value,
  source_id: 36,
  notes_ids: notes,
  iso3,
  dim_208: 222,
  dim_29117: YEAR_IDS[year],
  dim_26677: Q_IDS[quarter],
})

const payloadReal = {
  header: { name: 'uneclac cepalstat api', version: '1.9.13', success: true, code: 200, message: '' },
  body: {
    metadata: {
      indicator_id: 2182,
      indicator_name: 'Unemployment rate by quarter',
      unit: 'Average quarterly rate',
      data_features: 'Official national figures.',
    },
    data: [
      // Agregados regionais — não são países.
      { value: '6.644735979996606', source_id: 36, notes_ids: '15087,15090,15091', iso3: null, dim_208: 212, dim_29117: 29195, dim_26677: 26681 },
      { value: '9.990768050959295', source_id: 36, notes_ids: '15089,15090,15091', iso3: null, dim_208: 223, dim_29117: 29195, dim_26677: 26681 },

      // Brasil: quebra de série declarada em 2016-Q1 e mais nada marcado.
      row('BRA', '2016', 'Q1', '11.06099677416192', '8800,15090'),
      row('BRA', '2016', 'Q2', '11.442635439353836', '15090'),
      row('BRA', '2016', 'Q3', '11.920334977494926', '15090'),
      row('BRA', '2016', 'Q4', '12.153921091086216', '15090'),
      row('BRA', '2025', 'Q1', '7', '15090'),
      row('BRA', '2025', 'Q2', '5.8', '15090'),

      // República Dominicana e Paraguai: uma quebra cada, no primeiro ponto da
      // medição nova.
      row('DOM', '2015', 'Q1', '7.469143734150009', '8604,15090'),
      row('DOM', '2015', 'Q2', '7.508242884998692', '15090'),
      row('PRY', '2017', 'Q1', '6.3', '8801,15090'),
      row('PRY', '2017', 'Q2', '7.3', '15090'),

      // Peru: quatro trimestres provisórios.
      row('PER', '2020', 'Q1', '5.2', '8803,15090'),
      row('PER', '2020', 'Q2', '8.8', '8803,15090'),
      row('PER', '2020', 'Q3', '9.6', '8803,15090'),
      row('PER', '2020', 'Q4', '7', '8803,15090'),

      // Argentina: a ressalva geral do INDEC em todos os registros.
      row('ARG', '2025', 'Q1', '7.9', '15084,15090,15092'),
      row('ARG', '2025', 'Q2', '7.6', '15084,15090,15092'),

      row('MEX', '2025', 'Q1', '2.46354038', '15090'),
      row('MEX', '2025', 'Q2', '2.65986222', '15090'),

      // Acrescentado ao recorte: país fora da lista do produto.
      row('CUW', '2025', 'Q1', '18.6', '15090'),
    ],
    dimensions: [
      {
        name: 'Country__ESTANDAR',
        id: 208,
        members: [
          { name: 'Argentina', id: 216 },
          { name: 'Brazil', id: 222 },
          { name: 'Latin America and the Caribbean', id: 212 },
        ],
      },
      {
        name: 'Trimestre',
        id: 26677,
        members: [
          { name: 'Q1', id: 26681 },
          { name: 'Q2', id: 26680 },
          { name: 'Q3', id: 26682 },
          { name: 'Q4', id: 26678 },
        ],
      },
      {
        name: 'Years__ESTANDAR',
        id: 29117,
        members: Object.entries(YEAR_IDS).map(([name, id]) => ({ name, id })),
      },
    ],
    footnotes: [
      { id: 15084, description: '31 urban clusters.' },
      { id: 8803, description: 'Preliminary data' },
      { id: 8604, description: 'New measurement since 2015; data are not comparable with previous years.' },
      { id: 8800, description: 'New measurement since 2016; data are not comparable with previous years.' },
      { id: 8801, description: 'New measurement since 2017; data are not comparable with previous years.' },
      {
        id: 15092,
        description:
          'INDEC, in the framework of the statistical emergency declared in 2016, recommends disregarding the series published between 2007 and 2015 for purposes of comparison and analysis of the labor market in the Argentine Republic',
      },
      {
        id: 15090,
        description:
          'Percentage of unemployed population in relation to the labor force.  Data for individual countries are not comparable due to differences in coverage and definition of the working-age population.',
      },
      { id: 15087, description: 'Does not include hidden unemployment in Colombia, Ecuador, Jamaica and Panama.' },
      { id: 15089, description: 'Does not include hidden unemployment in Jamaica.' },
      { id: 15091, description: 'Weighted average' },
    ],
  },
}

const fakeFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload }) as Response) as unknown as typeof fetch

const pointsOf = (country: string, payload: unknown = payloadReal) =>
  parseCepalstatPayload(payload)
    .points.filter((p) => p.country === country)
    .sort((a, b) => a.period.getTime() - b.period.getTime())

test('AS DIMENSÕES DE TEMPO SÃO ACHADAS PELOS MEMBROS, NÃO PELO ID NEM PELO NOME', () => {
  // Os identificadores numéricos valem por indicador e os nomes vêm parte em
  // inglês, parte em espanhol ("Trimestre"), mesmo com `lang=en`. O formato dos
  // membros é o que a resposta afirma de si mesma.
  const found = locateTimeDimensions(payloadReal.body.dimensions)
  assert.equal(found.yearKey, 'dim_29117')
  assert.equal(found.quarterKey, 'dim_26677')
  assert.equal(found.years.get(29186), 2016)
  // Os identificadores dos trimestres NÃO estão em ordem na resposta real.
  assert.equal(found.quarters.get(26681), 1)
  assert.equal(found.quarters.get(26678), 4)
})

test('AGREGADOS REGIONAIS NÃO VIRAM PAÍS', () => {
  // "Latin America and the Caribbean" e "Caribbean" vêm na mesma lista dos
  // países, com `iso3: null`. São médias ponderadas de séries que a própria
  // nota 15090 declara não comparáveis entre si.
  const { points, problems } = parseCepalstatPayload(payloadReal)
  assert.ok(points.every((p) => p.country.length === 2))
  assert.equal(points.length, 18, 'os dois agregados ficam de fora dos 20 registros')
  // Agregado não é problema de coleta: é registro que não é país.
  assert.equal(problems.filter((p) => /agregados/.test(p)).length, 0)
})

test('ALFA-3 VIRA ALFA-2, e código fora da lista é descartado e denunciado', () => {
  assert.equal(pointsOf('BR').length, 6)
  assert.equal(pointsOf('BRA').length, 0)

  const { points, problems } = parseCepalstatPayload(payloadReal)
  assert.equal(points.filter((p) => p.country === 'CUW').length, 0)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /CUW/)
})

test('QUEBRA DE SÉRIE É LIDA PELO TEXTO DA NOTA, e marca UM ponto só', () => {
  // "New measurement since 2016; data are not comparable with previous years"
  // está presa ao primeiro registro da medição nova. Sem isto, a mudança de
  // metodologia apareceria na tela como um mercado virando de repente.
  const brasileiros = pointsOf('BR')
  const comQuebra = brasileiros.filter((p) => p.seriesBreak)
  assert.equal(comQuebra.length, 1)
  assert.equal(comQuebra[0].period.toISOString(), '2016-01-01T00:00:00.000Z')

  assert.equal(pointsOf('DO').filter((p) => p.seriesBreak).length, 1)
  assert.equal(pointsOf('PY').filter((p) => p.seriesBreak).length, 1)
})

test('RESSALVA GERAL DE COMPARABILIDADE NÃO É QUEBRA DE SÉRIE', () => {
  // A nota 15092 fala de comparabilidade, mas é ressalva do período inteiro e
  // está em TODOS os registros argentinos. Marcá-la como quebra faria
  // `classifyHiringPhase` cortar a série da Argentina em cada ponto.
  const argentinos = pointsOf('AR')
  assert.equal(argentinos.length, 2)
  assert.ok(argentinos.every((p) => p.seriesBreak === false))
  // E a nota 15090, que também diz "are not comparable", está em quase tudo.
  const mexicanos = pointsOf('MX')
  assert.ok(mexicanos.every((p) => p.seriesBreak === false))
})

test('"Preliminary data" entra como não revisado', () => {
  const peruanos = pointsOf('PE')
  assert.equal(peruanos.length, 4)
  assert.ok(peruanos.every((p) => p.revised === false))

  assert.ok(pointsOf('BR').every((p) => p.revised === true))
})

test('a nota fica como veio — identificadores, não texto', () => {
  const brasileiros = pointsOf('BR')
  assert.equal(brasileiros[0].note, '8800,15090')
  assert.equal(brasileiros[1].note, '15090')
})

test('TODO PONTO SAI COM CONFIANÇA BAIXA', () => {
  // Informalidade grande e cobertura urbana na maior parte da série: taxa de
  // desemprego conta quem trabalha informalmente como "empregado".
  const { points } = parseCepalstatPayload(payloadReal)
  assert.ok(points.length > 0)
  assert.ok(points.every((p) => p.confidence === 'low'))
  assert.equal(CEPALSTAT_DESCRIPTOR.confidence, 'low')
})

test('todo ponto carrega a métrica, a unidade e a fonte', () => {
  const { points } = parseCepalstatPayload(payloadReal)
  assert.ok(points.every((p) => p.metric === 'unemployment_rate'))
  assert.ok(points.every((p) => p.unit === 'percent'))
  assert.ok(points.every((p) => p.source === 'cepalstat_une'))
  assert.ok(points.every((p) => p.periodType === 'quarter'))
})

test('valor vazio não vira zero', () => {
  // `value` vem como TEXTO e `Number('')` é `0`. "Desemprego de 0,0%" é um
  // número que ninguém publicou.
  const comVazio = {
    ...payloadReal,
    body: { ...payloadReal.body, data: [row('MEX', '2025', 'Q3', '', '15090'), row('MEX', '2025', 'Q4', '   ', '')] },
  }
  assert.equal(parseCepalstatPayload(comVazio).points.length, 0)
})

test('o ano e o trimestre viram o primeiro dia do período, em UTC', () => {
  assert.equal(periodFromYearQuarter(2025, 1)!.toISOString(), '2025-01-01T00:00:00.000Z')
  assert.equal(periodFromYearQuarter(2025, 4)!.toISOString(), '2025-10-01T00:00:00.000Z')
  assert.equal(periodFromYearQuarter(2025, 5), null)
  assert.equal(periodFromYearQuarter(1800, 1), null)

  const brasileiros = pointsOf('BR')
  assert.equal(brasileiros[3].period.toISOString(), '2016-10-01T00:00:00.000Z')
})

test('A JANELA RECORTA A SÉRIE, que a API devolve inteira desde 2014', () => {
  // Gravar doze anos de todos os países a cada coleta multiplica a escrita sem
  // acrescentar sinal.
  assert.equal(windowStart(new Date('2026-09-01T00:00:00Z'), 24).toISOString(), '2020-10-01T00:00:00.000Z')
  assert.equal(windowStart(new Date('2026-01-15T00:00:00Z'), 4).toISOString(), '2025-04-01T00:00:00.000Z')

  const desde2025 = parseCepalstatPayload(payloadReal, new Date(Date.UTC(2025, 0, 1)))
  assert.ok(desde2025.points.every((p) => p.period.getUTCFullYear() === 2025))
  assert.equal(desde2025.points.filter((p) => p.country === 'BR').length, 2)
})

test('cabeçalho de erro do CEPALSTAT vira falha, com a mensagem preservada', () => {
  const erro = {
    header: { name: 'uneclac cepalstat api', success: false, code: 500, message: 'Internal Server Error' },
  }
  const { points, problems } = parseCepalstatPayload(erro)
  assert.equal(points.length, 0)
  assert.match(problems[0], /Internal Server Error/)
})

test('RESPOSTA SEM REGISTRO É FALHA DE COLETA, NÃO REGIÃO SEM DESEMPREGO', async () => {
  const vazio = { header: { success: true, code: 200 }, body: { data: [], dimensions: [], footnotes: [] } }
  const { points, problems } = parseCepalstatPayload(vazio)
  assert.equal(points.length, 0)
  assert.match(problems[0], /sem nenhum registro/)

  const connector = createCepalstatConnector({ fetchImpl: fakeFetch(vazio) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
})

test('resposta só com agregados também é falha, e diz por quê', () => {
  const soAgregados = {
    ...payloadReal,
    body: { ...payloadReal.body, data: payloadReal.body.data.slice(0, 2) },
  }
  const { points, problems } = parseCepalstatPayload(soAgregados)
  assert.equal(points.length, 0)
  assert.match(problems.join('; '), /agregados regionais/)
})

test('payload malformado não lança', () => {
  assert.deepEqual(parseCepalstatPayload(null).points, [])
  assert.deepEqual(parseCepalstatPayload({}).points, [])
  const semDimensoes = { header: { success: true }, body: { data: [row('BRA', '2025', 'Q1', '7', '')], dimensions: [] } }
  const { points, problems } = parseCepalstatPayload(semDimensoes)
  assert.equal(points.length, 0)
  assert.match(problems[0], /ano e trimestre/)
})

test('coleta com país desconhecido é PARCIAL, não completa nem falha', async () => {
  const connector = createCepalstatConnector({
    fetchImpl: fakeFetch(payloadReal),
    now: () => new Date('2016-03-01T00:00:00Z'),
    lastPeriods: 100,
  })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'partial')
  assert.ok(result.points.length > 0)
  assert.match(result.error!, /CUW/)
})

test('HTTP ruim é falha', async () => {
  const connector = createCepalstatConnector({ fetchImpl: fakeFetch({}, false, 502) })
  const result = await connector.fetchPoints({ timeBudgetMs: 5000 })
  assert.equal(result.outcome, 'failed')
  assert.match(result.error!, /HTTP 502/)
})

test('A CHAMADA PEDE O INDICADOR TRIMESTRAL, EM INGLÊS E EM JSON', async () => {
  // `lang=en` não é gosto: as notas de rodapé são lidas pelo texto em inglês.
  let url = ''
  const espiao: typeof fetch = (async (u: string) => {
    url = u
    return { ok: true, status: 200, json: async () => payloadReal } as Response
  }) as unknown as typeof fetch

  await createCepalstatConnector({ fetchImpl: espiao, lastPeriods: 100, now: () => new Date('2016-03-01T00:00:00Z') })
    .fetchPoints({ timeBudgetMs: 5000 })

  assert.match(url, /\/indicator\/2182\/data\?/)
  assert.match(url, /lang=en/)
  assert.match(url, /format=json/)
})

test('o descritor não promete uma lista fixa de países', () => {
  assert.equal(CEPALSTAT_DESCRIPTOR.countries, null)
  assert.equal(CEPALSTAT_DESCRIPTOR.slug, 'cepalstat_une')
  assert.equal(CEPALSTAT_DESCRIPTOR.metric, 'unemployment_rate')
})
