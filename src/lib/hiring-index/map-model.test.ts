import test from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES, LANGUAGES, type Language } from '@/lib/i18n'
import { summarizeAtlas } from './atlas'
import type { LaborMarketRow } from './lookup'
import {
  CONTINENT_NO_DATA_FILL,
  NO_DATA_FILL,
  PHASE_CHIP,
  PHASE_FILL,
  UNCLASSIFIED_FILL,
  buildHiringMapModel,
} from './map-model'
import { WORLD_MAP_MARKERS, WORLD_MAP_SHAPES } from './world-map'

/**
 * O modelo da tela do mapa (§2.55).
 *
 * A trava principal não é de aparência: é que **nada com cor de fase saia para
 * um país que não tem medição**, e que **toda forma desenhada tenha entrada no
 * modelo** — o componente indexa `model.shapes[code]` sem defesa, e um código
 * sem entrada derrubaria a página inteira em produção.
 */

function rows(country: string, values: number[], overrides: Partial<LaborMarketRow> = {}): LaborMarketRow[] {
  return values.map((value, i) => ({
    country,
    source: 'eurostat_jvs',
    metric: 'job_vacancy_rate',
    value,
    unit: 'percent',
    period: new Date(Date.UTC(2024, i, 1)),
    periodType: 'month',
    revised: true,
    seriesBreak: false,
    confidence: 'high',
    note: null,
    ...overrides,
  }))
}

const FALLING = [6.0, 5.8, 5.6, 5.4, 5.2, 5.0, 4.8, 4.6]
const RISING = [3.0, 3.2, 3.5, 3.9, 4.4, 5.0, 5.7, 6.5]

function model(lang: Language = 'en') {
  const atlas = summarizeAtlas(
    [
      ...rows('DE', FALLING),
      ...rows('US', RISING, { source: 'bls_jolts', metric: 'job_openings_rate' }),
      ...rows('IE', RISING, { revised: false }),
      ...rows('PT', [4.1, 4.2, 4.0]),
    ],
    new Date(Date.UTC(2026, 8, 2))
  )
  return buildHiringMapModel(
    atlas,
    lang,
    DICTIONARIES[lang].hiringMap,
    DICTIONARIES[lang].hiringIndex,
    DICTIONARIES[lang].continents
  )
}

// ---------------------------------------------------------------------------
// A trava que impede a página de cair
// ---------------------------------------------------------------------------

test('TODA forma desenhada tem entrada no modelo', () => {
  const m = model()
  const drawn = [...WORLD_MAP_SHAPES.map((s) => s.code), ...WORLD_MAP_MARKERS.map((k) => k.code)]

  for (const code of drawn) {
    assert.ok(m.shapes[code], `forma ${code} sem entrada — o componente indexaria undefined`)
    assert.ok(m.shapes[code].fill)
    assert.ok(m.shapes[code].title.length > 0)
  }
  assert.ok(drawn.length > 190)
})

// ---------------------------------------------------------------------------
// Cor só onde há medição
// ---------------------------------------------------------------------------

test('país classificado recebe a cor da própria fase', () => {
  const m = model()
  assert.equal(m.shapes.DE.fill, PHASE_FILL.cooling)
  assert.equal(m.shapes.US.fill, PHASE_FILL.heating_up)
  assert.equal(m.countries.DE.chipClass, PHASE_CHIP.cooling)
})

test('país sem cobertura recebe a hachura, e nunca uma cor de fase', () => {
  const m = model()
  for (const code of ['DZ', 'NP', 'BO', 'MN']) {
    assert.equal(m.shapes[code].fill, NO_DATA_FILL, `${code} não deveria ter cor`)
    assert.equal(m.countries[code], undefined)
  }
  assert.ok(!Object.values(PHASE_FILL).includes(NO_DATA_FILL))
})

test('país coberto sem histórico bastante é cinza, não fase e não hachura', () => {
  const m = model()
  assert.equal(m.shapes.PT.fill, UNCLASSIFIED_FILL)
  assert.equal(m.countries.PT.chipClass, 'bg-slate-400')
  assert.equal(m.countries.PT.statusLabel, DICTIONARIES.en.hiringIndex.insufficientLabel)
  assert.ok(!Object.values(PHASE_FILL).includes(UNCLASSIFIED_FILL))
})

test('o `title` nativo diz o país, o estado e — quando há — a fonte', () => {
  const m = model()
  assert.equal(m.shapes.DE.title, 'Germany — Cooling down · Eurostat')
  assert.equal(m.shapes.DZ.title, `Algeria — ${DICTIONARIES.en.hiringMap.noDataLabel}`)
  assert.ok(!m.shapes.DE.title.includes('cooling'))
})

// ---------------------------------------------------------------------------
// Ordem, links e fontes
// ---------------------------------------------------------------------------

test('a ordem é pelo nome no idioma ativo, sem mercado privilegiado', () => {
  assert.deepEqual(model('en').ordered, ['DE', 'IE', 'PT', 'US'])
  // Em português: Alemanha, Estados Unidos, Irlanda, Portugal.
  assert.deepEqual(model('pt').ordered, ['DE', 'US', 'IE', 'PT'])
})

test('cada país coberto aponta para a página de país que já existe', () => {
  const m = model()
  assert.equal(m.countries.DE.href, '/de')
  assert.equal(m.countries.US.href, '/us')
})

test('as fontes saem sem repetição e com o nome próprio da instituição', () => {
  assert.deepEqual(model().sources, ['Eurostat', 'U.S. Bureau of Labor Statistics (JOLTS)'])
})

test('a impressão preliminar é sinalizada, e a revisada não inventa aviso', () => {
  const m = model()
  assert.equal(m.countries.IE.preliminary, true)
  assert.equal(m.countries.DE.preliminary, false)
})

// ---------------------------------------------------------------------------
// O agregado na tela
// ---------------------------------------------------------------------------

test('as barras somam 100% dos países classificados, e a contagem é a real', () => {
  const m = model()
  const total = m.bars.reduce((acc, b) => acc + b.count, 0)
  assert.equal(total, 3)
  assert.equal(Math.round(m.bars.reduce((acc, b) => acc + b.sharePercent, 0)), 100)
  assert.equal(m.text.unclassifiedCount, '1')
})

test('a amplitude líquida sai como termo (§2.68), com o percentual ao lado', () => {
  // Dois esquentando (US, IE) contra um esfriando (DE), de 3 classificados
  // (PT fica de fora, sem histórico bastante): +2 − 1 = +1 → +1/3 ≈ +33%,
  // dentro da faixa [20%, 60%) → "mostly heating".
  const m = model()
  assert.equal(m.text.netBreadthTerm, DICTIONARIES.en.hiringMap.netBreadthMostlyHeating)
  assert.equal(m.text.netBreadthPercent, '+33%')
})

test('sem data de coleta, a linha de atualização simplesmente não existe', () => {
  const vazio = buildHiringMapModel(
    summarizeAtlas([]),
    'en',
    DICTIONARIES.en.hiringMap,
    DICTIONARIES.en.hiringIndex,
    DICTIONARIES.en.continents
  )
  assert.equal(vazio.text.updatedLine, null)
  assert.deepEqual(vazio.ordered, [])
  // E o mundo continua desenhado, todo sem dado — não some.
  assert.equal(vazio.shapes.DE.fill, NO_DATA_FILL)
  // Divisão por zero na porcentagem não vira NaN na tela.
  for (const bar of vazio.bars) assert.equal(bar.sharePercent, 0)
})

// ---------------------------------------------------------------------------
// O recorte por continente (§2.59)
// ---------------------------------------------------------------------------

test('A BARRA DE CONTINENTE TEM COMO DENOMINADOR O CONTINENTE INTEIRO', () => {
  // É a trava do §2.59, e a razão de o §2.56 ter recusado este recorte antes.
  // Com o denominador nos países medidos, a Europa (3 de 42 aqui) sairia com a
  // barra cheia e pareceria tão lida quanto se tivesse os 42.
  const m = model()
  const eu = m.continents.find((c) => c.continent === 'EU')!
  const colorido = eu.bar
    .filter((s) => s.kind !== 'uncovered')
    .reduce((acc, s) => acc + s.widthPercent, 0)

  assert.ok(colorido < 10, `a parte colorida tomou ${colorido}% da barra com 3 de 42 países`)
  // E o pedaço que falta é hachura, não espaço vazio: o total fecha em 100%.
  assert.equal(Math.round(eu.bar.reduce((acc, s) => acc + s.widthPercent, 0)), 100)
  assert.equal(eu.bar.at(-1)!.kind, 'uncovered')
  assert.equal(eu.bar.at(-1)!.fill, CONTINENT_NO_DATA_FILL)
})

test('os pedaços da barra são contíguos, sem buraco nem sobreposição', () => {
  for (const linha of model().continents) {
    let esperado = 0
    for (const segmento of linha.bar) {
      assert.ok(Math.abs(segmento.xPercent - esperado) < 1e-9, `buraco na barra de ${linha.continent}`)
      esperado += segmento.widthPercent
    }
  }
})

test('a cobertura absoluta acompanha TODA barra — nunca só a percentagem', () => {
  const m = model()
  const eu = m.continents.find((c) => c.continent === 'EU')!
  const oc = m.continents.find((c) => c.continent === 'OC')!

  assert.equal(eu.trackedLabel, '3')
  assert.equal(eu.totalLabel, '42')
  assert.ok(eu.coverageLabel.includes('3'))
  assert.ok(eu.coverageLabel.includes('42'))
  // Continente sem nenhum país medido continua na lista, dizendo `0 de 5`.
  assert.equal(oc.trackedLabel, '0')
  assert.equal(oc.totalLabel, '5')
  assert.equal(oc.bar.length, 1)
  assert.equal(oc.bar[0].kind, 'uncovered')
})

test('os sete continentes saem, e o rótulo do leitor de tela diz a cobertura primeiro', () => {
  const m = model()
  assert.equal(m.continents.length, 7)
  for (const linha of m.continents) {
    assert.ok(linha.barLabel.startsWith(linha.name))
    assert.ok(linha.barLabel.includes(linha.coverageLabel))
  }
})

test('O NOME DO CONTINENTE VEM DO DICIONÁRIO, NUNCA DE `Intl`', () => {
  // Nome de país por ICU já custou a árvore inteira vinda do servidor aqui
  // (`Falklandinseln` contra `Falklandinseln (Malwinen)`). Continente é um
  // conjunto de sete palavras fixas, e é assim que ele fica.
  for (const lang of LANGUAGES) {
    const dict = DICTIONARIES[lang].continents
    const nomes = model(lang).continents.map((c) => c.name).sort()
    assert.deepEqual(nomes, Object.values(dict).sort(), `nome de continente errado em ${lang}`)
  }
})

test('a ordem dos continentes é pelo nome no idioma ativo, sem privilegiado', () => {
  // Em inglês: Africa, Asia, Central America and the Caribbean, Europe,
  // North America, Oceania, South America.
  assert.deepEqual(
    model('en').continents.map((c) => c.continent),
    ['AF', 'AS', 'CA', 'EU', 'NA', 'OC', 'SA']
  )
  // Em português a ordem muda: os quatro nomes de "América" vêm antes de
  // Ásia, e "América Central e Caribe" vem antes de "do Norte"/"do Sul"
  // porque "Central" começa com C, antes de "d" de "do".
  assert.deepEqual(
    model('pt').continents.map((c) => c.continent),
    ['AF', 'CA', 'NA', 'SA', 'AS', 'EU', 'OC']
  )
})

// ---------------------------------------------------------------------------
// Idioma
// ---------------------------------------------------------------------------

test('nenhuma chave crua sobra em nenhum dos 12 idiomas', () => {
  for (const lang of LANGUAGES) {
    const m = model(lang)
    const todo = [
      ...Object.values(m.text).filter((v): v is string => typeof v === 'string'),
      ...Object.values(m.countries).map((c) => `${c.linkLabel} ${c.sourceLine} ${c.periodLine}`),
      ...m.continents.map((c) => `${c.name} ${c.coverageLabel} ${c.barLabel}`),
    ].join(' ')

    for (const marca of ['{count}', '{classified}', '{tracked}', '{total}', '{date}', '{source}', '{period}', '{country}']) {
      assert.ok(!todo.includes(marca), `${marca} não substituído em ${lang}`)
    }
    assert.equal(m.bars[0].label, DICTIONARIES[lang].hiringIndex.phaseCooling)
  }
})
