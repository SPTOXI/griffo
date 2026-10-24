import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPagePath, formatAtsResult, formatCountryTemperature } from './tools'

test('buildPagePath monta caminhos válidos e recusa o resto', () => {
  assert.equal(buildPagePath('ats_check'), '/ats-check')
  assert.equal(buildPagePath('ats_check', { lang: 'pt' }), '/ats-check?lang=pt')
  assert.equal(buildPagePath('ats_check', { lang: 'xx' }), '/ats-check')
  assert.equal(buildPagePath('country', { country: 'BR' }), '/br')
  assert.equal(buildPagePath('country', { country: '../x' }), null)
  assert.equal(buildPagePath('country'), null)
  assert.equal(buildPagePath('admin'), null)
})

test('formatAtsResult descreve nota e problemas', () => {
  const out = formatAtsResult({
    score: 62,
    level: 'attention',
    issues: [{ code: 'no_email', severity: 'critical' }],
    stats: { words: 400, lines: 50 },
  })
  assert.match(out, /62\/100/)
  assert.match(out, /\[critical\] No e-mail/)
})

test('formatCountryTemperature distingue sem cobertura, sem fase e com fase', () => {
  const base = { covered: true, source: 'BLS', sourceName: 'BLS JOLTS', metric: 'openings', insufficientDataReason: null, latestPeriod: '2026-08-01', periodType: 'month' }
  const atlas = {
    countries: [
      { ...base, country: 'US', phase: 'expansion' },
      { ...base, country: 'DE', phase: null },
    ],
  } as any
  assert.match(formatCountryTemperature(atlas, 'us'), /US: expansion/)
  assert.match(formatCountryTemperature(atlas, 'DE'), /not enough history/)
  assert.match(formatCountryTemperature(atlas, 'BR'), /No official source/)
})
