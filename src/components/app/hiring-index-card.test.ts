import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DICTIONARIES } from '@/lib/i18n'
import { HiringIndexCardView, targetMarketOf } from './hiring-index-card'
import type { HiringIndexSummary } from '@/lib/hiring-index/lookup'

/**
 * A trava do cartão de temperatura de contratação: ele NUNCA fica vazio.
 *
 * Os quatro desfechos — classificado, coberto sem histórico bastante, país sem
 * cobertura e falha de consulta — têm de sair com texto visível, do dicionário,
 * no idioma ativo. Um `renderToStaticMarkup` é suficiente porque `...View` é só
 * desenho: quem busca é o componente de cima, e é justamente por isso que os
 * dois foram separados.
 */

function summary(overrides: Partial<HiringIndexSummary> = {}): HiringIndexSummary {
  return {
    country: 'US',
    covered: true,
    source: 'bls_jolts',
    sourceName: 'U.S. Bureau of Labor Statistics (JOLTS)',
    metric: 'job_openings_rate',
    phase: 'stable',
    insufficientDataReason: null,
    latestPeriod: '2026-07-01T00:00:00.000Z',
    periodType: 'month',
    latestIsPreliminary: false,
    confidence: 'high',
    pointsUsed: 55,
    ...overrides,
  }
}

function render(props: Partial<Parameters<typeof HiringIndexCardView>[0]> = {}, lang: 'pt' | 'en' = 'pt') {
  return renderToStaticMarkup(
    createElement(HiringIndexCardView, {
      country: 'US',
      lang,
      dict: DICTIONARIES[lang].hiringIndex,
      summary: summary(),
      loading: false,
      failed: false,
      ...props,
    })
  )
}

/** Texto visível, sem as tags — é o que a pessoa lê. */
const textOf = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

// ---------------------------------------------------------------------------
// País com fase classificada
// ---------------------------------------------------------------------------

test('fase classificada mostra o rótulo traduzido, e nunca o nome do enum', () => {
  const html = render({ summary: summary({ phase: 'cooling' }) })
  const text = textOf(html)

  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.phaseCooling))
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.phaseCoolingHint))
  assert.ok(!text.includes('cooling'))
  assert.ok(!text.includes('bottoming_out'))
})

test('as cinco fases têm rótulo próprio e desenho próprio', () => {
  const phases = ['cooling', 'bottoming_out', 'recovering', 'heating_up', 'stable'] as const
  const labels = new Set<string>()
  const skins = new Set<string>()

  for (const phase of phases) {
    const html = render({ summary: summary({ phase }) })
    labels.add(textOf(html))
    // A cor do bloco muda com a fase: cor é informação, e a mesma cor para
    // desfechos opostos esconderia o resultado.
    skins.add(html.slice(0, html.indexOf('>')))
    assert.ok(textOf(html).length > 0)
  }

  assert.equal(labels.size, 5)
  assert.ok(skins.size >= 4)
})

test('a fonte aparece SEMPRE que há série, sem tooltip nem "saiba mais"', () => {
  const text = textOf(render({ summary: summary({ sourceName: 'Eurostat' }) }))
  assert.ok(text.includes('Eurostat'))
})

test('a leitura preliminar é avisada, e a revisada não inventa aviso nenhum', () => {
  const aviso = DICTIONARIES.pt.hiringIndex.preliminaryNote

  assert.ok(textOf(render({ summary: summary({ latestIsPreliminary: true }) })).includes(aviso))
  assert.ok(!textOf(render({ summary: summary({ latestIsPreliminary: false }) })).includes(aviso))
})

// ---------------------------------------------------------------------------
// Os desfechos sem fase — a razão de o cartão existir do jeito que existe
// ---------------------------------------------------------------------------

test('país coberto sem histórico bastante DIZ isso, e não some', () => {
  const html = render({
    summary: summary({ phase: null, insufficientDataReason: 'too_few_points', pointsUsed: 3 }),
  })
  const text = textOf(html)

  assert.ok(html.length > 0)
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.insufficientLabel))
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.insufficientDesc))
  // Nenhum rótulo de fase pode aparecer aqui: seria inventar um resultado.
  assert.ok(!text.includes(DICTIONARIES.pt.hiringIndex.phaseStable))
})

test('país SEM COBERTURA diz que não há fonte, não que falta histórico', () => {
  const text = textOf(
    render({
      country: 'BR',
      summary: summary({
        country: 'BR',
        covered: false,
        source: null,
        sourceName: null,
        metric: null,
        phase: null,
        latestPeriod: null,
        periodType: null,
        pointsUsed: 0,
      }),
    })
  )

  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.notCoveredDesc))
  assert.ok(!text.includes(DICTIONARIES.pt.hiringIndex.insufficientDesc))
  // O cartão continua na tela, com o título e o mercado nomeados.
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.title))
})

test('falha de consulta NÃO vira "país sem dado"', () => {
  const text = textOf(render({ failed: true, summary: null }))

  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.unavailable))
  assert.ok(!text.includes(DICTIONARIES.pt.hiringIndex.notCoveredDesc))
  assert.ok(!text.includes(DICTIONARIES.pt.hiringIndex.insufficientDesc))
  // Nem no selo: "dado insuficiente" afirma algo sobre a série do país, e a
  // requisição que falhou não permite afirmar nada sobre ela. O defeito era
  // real e apareceu na conferência visual, não no teste.
  assert.ok(!text.includes(DICTIONARIES.pt.hiringIndex.insufficientLabel))
  // O cartão continua na tela, com título e mercado.
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.title))
})

test('enquanto carrega, o cartão já existe e diz que está carregando', () => {
  const text = textOf(render({ loading: true, summary: null }))
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.loading))
  assert.ok(text.includes(DICTIONARIES.pt.hiringIndex.title))
})

// ---------------------------------------------------------------------------
// Idioma
// ---------------------------------------------------------------------------

test('o idioma ativo escolhe o rótulo — nada de português fixo', () => {
  const pt = textOf(render({ summary: summary({ phase: 'heating_up' }) }, 'pt'))
  const en = textOf(render({ summary: summary({ phase: 'heating_up' }) }, 'en'))

  assert.ok(pt.includes(DICTIONARIES.pt.hiringIndex.phaseHeatingUp))
  assert.ok(en.includes(DICTIONARIES.en.hiringIndex.phaseHeatingUp))
  assert.ok(!en.includes(DICTIONARIES.pt.hiringIndex.phaseHeatingUp))
})

test('os 12 idiomas renderizam o cartão sem cair e sem sobrar chave crua', () => {
  for (const lang of Object.keys(DICTIONARIES) as (keyof typeof DICTIONARIES)[]) {
    const html = renderToStaticMarkup(
      createElement(HiringIndexCardView, {
        country: 'DE',
        lang,
        dict: DICTIONARIES[lang].hiringIndex,
        summary: summary({ country: 'DE', sourceName: 'Eurostat', phase: 'cooling', periodType: 'quarter' }),
        loading: false,
        failed: false,
      })
    )
    const text = textOf(html)
    assert.ok(text.length > 0, `cartão vazio no idioma ${lang}`)
    assert.ok(!text.includes('{country}'), `{country} não substituído em ${lang}`)
    assert.ok(!text.includes('{source}'), `{source} não substituído em ${lang}`)
    assert.ok(!text.includes('{period}'), `{period} não substituído em ${lang}`)
    assert.ok(text.includes('Eurostat'), `fonte omitida em ${lang}`)
  }
})

test('o nome do país sai no idioma ativo, e o código é o recuo', () => {
  assert.ok(textOf(render({ country: 'DE' }, 'pt')).includes('Alemanha'))
  assert.ok(textOf(render({ country: 'DE' }, 'en')).includes('Germany'))
  // Código que o Intl não conhece não quebra a tela.
  assert.ok(textOf(render({ country: 'ZZ' }, 'pt')).length > 0)
})

// ---------------------------------------------------------------------------
// Escolha do mercado
// ---------------------------------------------------------------------------

test('o mercado declarado vence a residência', () => {
  assert.equal(targetMarketOf({ primaryMarket: 'US', residenceCountry: 'BR' }), 'US')
})

test('sem mercado declarado, a residência serve de recuo', () => {
  assert.equal(targetMarketOf({ primaryMarket: null, residenceCountry: 'pt' }), 'PT')
})

test('sem nenhum dos dois não há país, e não há país padrão inventado', () => {
  assert.equal(targetMarketOf({}), null)
  assert.equal(targetMarketOf(null), null)
  assert.equal(targetMarketOf({ primaryMarket: 'GLOBAL' }), null)
})
