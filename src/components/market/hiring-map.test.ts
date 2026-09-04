import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DICTIONARIES, LANGUAGES } from '@/lib/i18n'
import { summarizeAtlas } from '@/lib/hiring-index/atlas'
import { PHASE_FILL, buildHiringMapModel } from '@/lib/hiring-index/map-model'
import type { LaborMarketRow } from '@/lib/hiring-index/lookup'
import { HiringMapView } from './hiring-map'

/**
 * As travas do mapa público (§2.55).
 *
 * Duas coisas são protegidas aqui, e são as duas que não podem falhar em
 * silêncio:
 *
 * 1. **País sem cobertura nunca sai com cor de fase.** É a regra de zero
 *    fabricação aplicada a pixel: colorir a Argélia de verde porque ficou bonito
 *    seria inventar uma medição que não existe.
 * 2. **Nada em português fixo.** A página é pública e indexável nos 12 idiomas,
 *    e o layout raiz já vazou português para `/us` e `/de` uma vez.
 *
 * O padrão é o de `hiring-index-card.test.ts`: `renderToStaticMarkup` sobre o
 * componente, que é o mesmo caminho que o servidor do Next percorre na primeira
 * resposta — por isso o teste vale para o HTML que o buscador recebe.
 */

function rows(
  country: string,
  values: number[],
  overrides: Partial<LaborMarketRow> = {}
): LaborMarketRow[] {
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
const FLAT = [4.0, 4.05, 3.98, 4.02, 4.0, 4.01, 3.99, 4.0]

/**
 * Um atlas pequeno com os três desfechos que o mapa tem de saber desenhar:
 * fase classificada (DE, US, SE), coberto sem histórico bastante (PT), e — pela
 * ausência — país que nenhuma fonte cobre (DZ, NP, qualquer outro).
 */
function atlas() {
  return summarizeAtlas(
    [
      ...rows('DE', FALLING),
      ...rows('US', RISING, { source: 'bls_jolts', metric: 'job_openings_rate' }),
      ...rows('IE', RISING),
      ...rows('SE', FLAT),
      ...rows('PT', [4.1, 4.2, 4.0]),
    ],
    new Date(Date.UTC(2026, 8, 2))
  )
}

function render(lang: (typeof LANGUAGES)[number] = 'pt') {
  return renderToStaticMarkup(
    createElement(HiringMapView, {
      model: buildHiringMapModel(
        atlas(),
        lang,
        DICTIONARIES[lang].hiringMap,
        DICTIONARIES[lang].hiringIndex,
        DICTIONARIES[lang].continents
      ),
    })
  )
}

/**
 * Texto visível, sem as tags — é o que a pessoa lê.
 *
 * As entidades voltam ao caractere de origem porque o React escapa `'`, `"` e
 * `&` no HTML (`qu&#x27;aucune`), e o que se compara aqui é a string do
 * dicionário. Sem isto, qualquer tradução com apóstrofo — francês, inglês,
 * italiano — reprovaria por um defeito que não existe na tela.
 */
const textOf = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

/** O `fill` do `<path>`/`<circle>` de um país, lido do HTML gerado. */
function fillOf(html: string, code: string): string | null {
  // O `<title>` vem depois do `fill` dentro do mesmo elemento; o casamento
  // procura o elemento cujo título começa com o nome do país.
  const re = new RegExp(`fill="([^"]+)"[^>]*>\\s*<title>([^<]*)</title>`, 'g')
  for (const m of html.matchAll(re)) {
    if (m[2].startsWith(code)) return m[1]
  }
  return null
}

// ---------------------------------------------------------------------------
// A regra que manda neste componente: cor só onde há medição
// ---------------------------------------------------------------------------

test('cada país classificado sai com a cor da PRÓPRIA fase', () => {
  const html = render('en')

  assert.equal(fillOf(html, 'Germany'), PHASE_FILL.cooling)
  assert.equal(fillOf(html, 'United States'), PHASE_FILL.heating_up)
  assert.equal(fillOf(html, 'Sweden'), PHASE_FILL.stable)
})

test('país SEM COBERTURA sai com a hachura, nunca com cor de fase', () => {
  const html = render('en')
  const semDado = fillOf(html, 'Algeria')

  assert.ok(semDado, 'a Argélia sumiu do mapa — ausente é indistinguível de sem dado')
  assert.match(semDado!, /^url\(#/)
  for (const cor of Object.values(PHASE_FILL)) {
    assert.notEqual(semDado, cor)
  }
})

test('país coberto SEM histórico bastante também não recebe cor de fase', () => {
  const html = render('en')
  const portugal = fillOf(html, 'Portugal')

  assert.ok(portugal)
  for (const cor of Object.values(PHASE_FILL)) {
    assert.notEqual(portugal, cor)
  }
})

test('as cinco fases têm cores distintas entre si e do estado sem dado', () => {
  const cores = new Set(Object.values(PHASE_FILL))
  assert.equal(cores.size, 5)
})

test('o mapa desenha o mundo, não só os países cobertos', () => {
  const html = render('en')
  // Muito mais formas do que os quatro países do atlas: um mapa que só
  // desenhasse quem tem dado esconderia o tamanho do que ainda não é coberto.
  assert.ok(html.split('<path').length > 150)
  // E os pequenos entram como círculo, senão sumiriam.
  assert.ok(html.includes('<circle'))
})

test('nenhum atributo `style` no HTML — a CSP do projeto o bloqueia', () => {
  // `next.config.ts` declara `default-src 'self'` e não declara `style-src`,
  // então o navegador BLOQUEIA atributo `style` em linha. A primeira versão
  // desta tela usava `style={{ backgroundColor }}` na legenda, nas barras e nos
  // 98 pontos da tabela, e produziu ~130 erros de CSP no dev server — com a
  // legenda chegando sem cor até a hidratação. Num página feita para ser lida
  // ANTES de qualquer JavaScript, isso é defeito, não detalhe.
  //
  // A cor calculada mora toda em `fill` de SVG, que é atributo de apresentação
  // e a CSP não alcança.
  const html = render('en')
  assert.ok(!/\sstyle="/.test(html), 'sobrou um atributo style, que a CSP vai bloquear')
  assert.ok(html.includes('fill="#dc2626"'))
})

// ---------------------------------------------------------------------------
// O agregado
// ---------------------------------------------------------------------------

test('a distribuição mostrada é a contagem real do atlas', () => {
  const a = atlas()
  const text = textOf(render('en'))

  assert.equal(a.distribution.tracked, 5)
  assert.equal(a.distribution.classified, 4)
  assert.equal(a.distribution.unclassified, 1)
  // Dois esquentando (US, IE) contra um esfriando (DE).
  assert.equal(a.distribution.netBreadth, 1)

  assert.ok(text.includes('4 of 5 countries'))
  // Amplitude líquida em termo (§2.68), não número: +1 de 4 classificados =
  // +25%, dentro de [20%, 60%) → "mostly heating". O percentual aparece do
  // lado do termo, não sozinho.
  assert.ok(text.includes(DICTIONARIES.en.hiringMap.netBreadthMostlyHeating))
  assert.ok(text.includes('+25%'))
})

test('o rótulo da amplitude líquida está na página', () => {
  const text = textOf(render('en'))
  assert.ok(text.includes(DICTIONARIES.en.hiringMap.netBreadthLabel))
})

// ---------------------------------------------------------------------------
// O recorte por continente (§2.59)
// ---------------------------------------------------------------------------

test('NENHUM CONTINENTE APARECE SEM A CONTAGEM ABSOLUTA DE COBERTURA', () => {
  // A regra inteira desta seção. O §2.56 recusou o corte continental porque uma
  // distribuição sozinha faria 12 países medidos passarem por 54. Se a
  // contagem sumir da tela, este teste tem de cair.
  const html = render('en')
  const text = textOf(html)

  // O atlas de teste tem DE, IE, PT e SE na Europa e US na América do Norte
  // (que desde o §2.65 tem só Canadá e EUA, 2 países — não mais 18).
  assert.ok(text.includes('4 of 42 countries with an official source'))
  assert.ok(text.includes('1 of 2 countries with an official source'))
  // E os continentes sem nenhum país medido dizem zero, em vez de sumir.
  assert.ok(text.includes('0 of 48 countries with an official source'))
  assert.ok(text.includes('0 of 5 countries with an official source'))
})

test('a parte não coberta da barra é HACHURA, não espaço vazio', () => {
  const html = render('en')
  // O padrão da seção é declarado por ela — não depende do `<defs>` do mapa.
  assert.ok(html.includes('id="gw-continent-no-data"'))
  assert.ok(html.includes('fill="url(#gw-continent-no-data)"'))
  // E a hachura nunca é uma das cinco cores de fase.
  for (const cor of Object.values(PHASE_FILL)) {
    assert.notEqual(`url(#gw-continent-no-data)`, cor)
  }
})

test('os sete continentes estão na tela, no idioma ativo', () => {
  for (const lang of LANGUAGES) {
    const text = textOf(render(lang))
    for (const nome of Object.values(DICTIONARIES[lang].continents)) {
      assert.ok(text.includes(nome), `continente "${nome}" ausente em ${lang}`)
    }
    assert.ok(text.includes(DICTIONARIES[lang].hiringMap.continentHeading))
    assert.ok(text.includes(DICTIONARIES[lang].hiringMap.continentHint))
  }
})

test('nenhuma nota por continente é inventada — só contagem', () => {
  // A seção não pode ganhar um escalar por continente numa refatoração
  // distraída: os valores de dois países não se somam, e por continente
  // tampouco. Ver o cabeçalho de `atlas.ts`.
  const m = buildHiringMapModel(
    atlas(),
    'en',
    DICTIONARIES.en.hiringMap,
    DICTIONARIES.en.hiringIndex,
    DICTIONARIES.en.continents
  )
  for (const linha of m.continents) {
    assert.equal('score' in linha, false)
    assert.equal('average' in linha, false)
    assert.equal(Number.isInteger(Number(linha.trackedLabel)), true)
  }
})

// ---------------------------------------------------------------------------
// Fonte, crédito e caminho para a página do país
// ---------------------------------------------------------------------------

test('o nome próprio de cada fonte aparece, sem tradução', () => {
  const text = textOf(render('de'))
  assert.ok(text.includes('Eurostat'))
  assert.ok(text.includes('U.S. Bureau of Labor Statistics (JOLTS)'))
})

test('a base cartográfica é creditada', () => {
  assert.ok(textOf(render('en')).includes('Natural Earth'))
})

test('cada país coberto tem link em HTML para a própria página', () => {
  const html = render('en')
  for (const code of ['de', 'us', 'se', 'pt', 'ie']) {
    assert.ok(html.includes(`href="/${code}"`), `sem link para /${code}`)
  }
})

test('nenhum mercado recebe destaque próprio — a tabela sai por nome', () => {
  const html = render('en')
  const nomes = [...html.matchAll(/href="\/(de|us|se|pt|ie)"[^>]*>([^<]+)</g)].map((m) => m[2])
  // Ordem alfabética do idioma ativo, e não a ordem em que os países entraram
  // no produto nem a do tamanho do mercado.
  assert.deepEqual(nomes, ['Germany', 'Ireland', 'Portugal', 'Sweden', 'United States'])
})

// ---------------------------------------------------------------------------
// Idioma — a página é pública nos 12
// ---------------------------------------------------------------------------

test('o idioma ativo escolhe o rótulo — nada de português fixo', () => {
  const pt = textOf(render('pt'))
  const en = textOf(render('en'))

  assert.ok(pt.includes(DICTIONARIES.pt.hiringMap.heading))
  assert.ok(en.includes(DICTIONARIES.en.hiringMap.heading))
  assert.ok(!en.includes(DICTIONARIES.pt.hiringMap.heading))
  assert.ok(!en.includes(DICTIONARIES.pt.hiringIndex.phaseCooling))
})

test('os 12 idiomas renderizam a página sem cair e sem sobrar chave crua', () => {
  for (const lang of LANGUAGES) {
    const text = textOf(render(lang))
    assert.ok(text.length > 0, `mapa vazio no idioma ${lang}`)
    assert.ok(!text.includes('{count}'), `{count} não substituído em ${lang}`)
    assert.ok(!text.includes('{classified}'), `{classified} não substituído em ${lang}`)
    assert.ok(!text.includes('{tracked}'), `{tracked} não substituído em ${lang}`)
    assert.ok(!text.includes('{date}'), `{date} não substituído em ${lang}`)
    assert.ok(!text.includes('{source}'), `{source} não substituído em ${lang}`)
    assert.ok(!text.includes('{period}'), `{period} não substituído em ${lang}`)
    assert.ok(!text.includes('{country}'), `{country} não substituído em ${lang}`)
    // Os rótulos de fase vêm do MESMO bloco `hiringIndex` do cartão do laudo:
    // duas telas do mesmo produto não podem nomear a mesma fase de dois jeitos.
    assert.ok(
      text.includes(DICTIONARIES[lang].hiringIndex.phaseCooling),
      `rótulo de fase ausente em ${lang}`
    )
    assert.ok(text.includes(DICTIONARIES[lang].hiringMap.noDataLabel), `legenda sem dado ausente em ${lang}`)
  }
})

test('o nome do enum de fase nunca chega à tela', () => {
  const text = textOf(render('en'))
  assert.ok(!text.includes('bottoming_out'))
  assert.ok(!text.includes('heating_up'))
})
